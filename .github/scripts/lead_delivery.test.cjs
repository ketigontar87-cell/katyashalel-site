/* Contract tests use only in-memory provider responses, never a real message. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../api/lead.js'),'utf8');
let sequence=0;
async function setup(options={}){
 const handler=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#'+sequence++)).default;
 process.env.RESEND_API_KEY=options.missing?'':'re_fixture_not_a_real_key';
 process.env.LEAD_EMAIL_FROM='Ekaterina Shalel website <requests@legibi.ai>';
 const calls=[];const previous=global.fetch;
 global.fetch=async(url,init)=>{calls.push({url,init});if(options.throws)throw Error('SECRET_RESPONSE_DO_NOT_LOG');return {ok:options.status?options.status<300:true,status:options.status||200,json:async()=>options.response??{id:'fixture-message-id'}};};
 const invoke=async(body={email:'person@example.invalid',message:'Public request'},extra={})=>{
  const res={headers:{},code:null,body:null,setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},end(){return this;}};
  await handler({method:'POST',headers:{origin:'https://katyashalel.com','x-forwarded-for':'192.0.2.10'},body,...extra},res);return res;
 };
 return {calls,invoke,restore(){global.fetch=previous;delete process.env.RESEND_API_KEY;delete process.env.LEAD_EMAIL_FROM;}};
}
test('all four form contexts deliver only to the owner, preserving text and reply address',async()=>{
 const f=await setup();try{for(const form of ['AI Legibility Audit','For companies','Ongoing work','Legibility Sprint']){
  const message='Русский & <markup> 😀\n'+('Long public evidence. '.repeat(250));
  const r=await f.invoke({email:'person@example.invalid',form,message,to:'attacker@example.invalid',bcc:'attacker@example.invalid'});
  assert.equal(r.code,200);assert.equal(r.body.ok,true);assert.equal(r.body.reference,'fixture-message-id');
  const c=f.calls.at(-1);assert.equal(c.url,'https://api.resend.com/emails');const sent=JSON.parse(c.init.body);
  assert.deepEqual(sent.to,['shalelekaterina@gmail.com']);assert.equal(sent.reply_to,'person@example.invalid');assert.equal(sent.bcc,undefined);
  assert.ok(sent.text.endsWith(message));assert.ok(sent.subject.includes(form));assert.equal(sent.html,undefined);assert.ok(c.init.signal);
 }}finally{f.restore();}
});
test('retries retain identical provider payload and idempotency key; changed inquiry gets a new key',async()=>{
 const f=await setup();try{
  await f.invoke();await f.invoke(undefined,{headers:{'x-forwarded-for':'192.0.2.11'}});
  assert.equal(f.calls[0].init.body,f.calls[1].init.body);
  assert.equal(f.calls[0].init.headers['Idempotency-Key'],f.calls[1].init.headers['Idempotency-Key']);
  await f.invoke({email:'person@example.invalid',message:'Changed request'});
  assert.notEqual(f.calls[0].init.headers['Idempotency-Key'],f.calls[2].init.headers['Idempotency-Key']);
 }finally{f.restore();}
});
test('missing configuration never attempts a delivery',async()=>{
 const f=await setup({missing:true});try{const r=await f.invoke();assert.equal(r.code,503);assert.equal(r.body.ok,false);assert.equal(f.calls.length,0);}finally{f.restore();}
});
for(const status of [401,429,500])test('provider HTTP '+status+' is not reported as a successful enquiry',async()=>{
 const f=await setup({status,response:{id:'not-accepted',message:'SECRET_RESPONSE_DO_NOT_LOG'}});try{const r=await f.invoke();assert.equal(r.code,502);assert.deepEqual(r.body,{ok:false,error:'delivery_failed'});assert.equal(f.calls.length,1);}finally{f.restore();}
});
test('HTTP 200 without a provider receipt is a failure',async()=>{
 const f=await setup({response:{}});try{const r=await f.invoke();assert.equal(r.code,502);assert.equal(r.body.ok,false);}finally{f.restore();}
});
test('an ambiguous network failure is not a success and does not expose exception details',async()=>{
 const f=await setup({throws:true});const logs=[];const original=console.error;console.error=(...args)=>logs.push(args);
 try{const r=await f.invoke();assert.equal(r.code,502);assert.equal(r.body.error,'delivery_unconfirmed');assert.ok(!JSON.stringify([r.body,logs]).includes('SECRET_RESPONSE'));assert.equal(f.calls.length,1);}finally{console.error=original;f.restore();}
});
test('invalid email and overlong message are rejected without silently truncating or sending',async()=>{
 const f=await setup();try{
  for(const body of [{email:'invalid'},[],{email:'valid@example.invalid',message:'x'.repeat(12001)},{email:'valid@example.invalid',message:{invalid:true}}]){
   const r=await f.invoke(body);assert.equal(r.code,400);assert.equal(r.body.ok,false);
  }assert.equal(f.calls.length,0);
 }finally{f.restore();}
});
test('honeypot submissions do not contact the provider',async()=>{
 const f=await setup();try{const r=await f.invoke({website_url:'spam'});assert.equal(r.code,200);assert.equal(f.calls.length,0);}finally{f.restore();}
});
test('foreign browser origins and unsupported methods cannot send',async()=>{
 const f=await setup();try{
  assert.equal((await f.invoke(undefined,{headers:{origin:'https://other.example'}})).code,403);
  assert.equal((await f.invoke(undefined,{method:'GET'})).code,405);
  assert.equal((await f.invoke(undefined,{method:'OPTIONS'})).code,204);assert.equal(f.calls.length,0);
 }finally{f.restore();}
});
test('per-instance throttling rejects the sixth attempt',async()=>{
 const f=await setup();try{for(let i=0;i<5;i++)assert.equal((await f.invoke()).code,200);assert.equal((await f.invoke()).code,429);assert.equal(f.calls.length,5);}finally{f.restore();}
});
function sentText(call){return JSON.parse(call.init.body).text;}
test('an unanswered recollection is accepted and is not written into the enquiry',async()=>{
 const f=await setup();try{
  for(const body of [{email:'person@example.invalid',message:'Public request'},{email:'person@example.invalid',heard_about:'',heard_about_detail:''}]){
   const r=await f.invoke(body);assert.equal(r.code,200);
   assert.equal(sentText(f.calls.at(-1)).includes('Self-reported'),false);
  }
 }finally{f.restore();}
});
test('a chosen recollection and optional detail are stored apart from the legacy source field',async()=>{
 const f=await setup();try{
  const r=await f.invoke({email:'person@example.invalid',message:'Public request',source:'LinkedIn essay',heard_about:' ai_assistant ',heard_about_detail:' A short note '});
  assert.equal(r.code,200);const text=sentText(f.calls[0]);
  assert.ok(text.includes('How they found this: LinkedIn essay'));
  assert.ok(text.includes('Self-reported source: AI assistant'));
  assert.ok(text.includes('Self-reported detail: A short note'));
  assert.equal(text.includes('utm'),false);assert.equal(text.includes('referrer'),false);
 }finally{f.restore();}
});
test('invalid recollection values are rejected and nothing is sent',async()=>{
 const f=await setup();try{
  const cases=[['chatgpt','192.0.2.21'],['utm_source','192.0.2.22'],['search<script>','192.0.2.23'],[1,'192.0.2.24'],[['search'],'192.0.2.25']];
  for(const [heard_about,ip] of cases){
   const r=await f.invoke({email:'person@example.invalid',heard_about},{headers:{'x-forwarded-for':ip}});
   assert.equal(r.code,400);assert.equal(r.body.error,'invalid_field');
  }
  const long=await f.invoke({email:'person@example.invalid',heard_about:'other',heard_about_detail:'x'.repeat(81)},{headers:{'x-forwarded-for':'192.0.2.26'}});
  assert.equal(long.code,400);assert.equal(long.body.error,'field_too_long');
  const badDetail=await f.invoke({email:'person@example.invalid',heard_about_detail:{note:'secret'}},{headers:{'x-forwarded-for':'192.0.2.27'}});
  assert.equal(badDetail.code,400);assert.equal(badDetail.body.error,'invalid_field');
  assert.equal(f.calls.length,0);
 }finally{f.restore();}
});
test('legacy enquiries without the new fields still deliver',async()=>{
 const f=await setup();try{
  const r=await f.invoke({email:'person@example.invalid',message:'Public request',source:'A friend mentioned the audit'});
  assert.equal(r.code,200);const text=sentText(f.calls[0]);
  assert.ok(text.includes('How they found this: A friend mentioned the audit'));
  assert.equal(text.includes('Self-reported'),false);
 }finally{f.restore();}
});
test('recollection is not copied into analytics or logs',async()=>{
 const logs=[];const info=console.info;console.info=(...args)=>logs.push(args);
 const f=await setup();try{
  const detail='Private free detail that must stay out of logs';
  const r=await f.invoke({email:'person@example.invalid',name:'Ada',heard_about:'other',heard_about_detail:detail,message:'Public request'});
  assert.equal(r.code,200);
  assert.ok(sentText(f.calls[0]).includes('Self-reported detail: '+detail));
  assert.equal(JSON.stringify(logs).includes(detail),false);
  assert.equal(JSON.stringify(logs).includes('Ada'),false);
  assert.equal(source.includes('stats.katyashalel.com'),false);
  assert.equal(source.includes('document.cookie'),false);
 }finally{console.info=info;f.restore();}
});
test('every enquiry form offers the same optional recollection choices',()=>{
 const choices=['search','ai_assistant','social','recommendation','other','dont_remember'];
 const pages={
  'audit/index.html':'How did you hear about us?',
  'brands/index.html':'How did you hear about us?',
  'guides/sprint/index.html':'How did you hear about us?',
  'ongoing/index.html':'How did you hear about us?',
  'ru/audit/index.html':'Откуда вы о нас узнали?',
 };
 for(const [file,question] of Object.entries(pages)){
  const html=fs.readFileSync(path.join(__dirname,'../../',file),'utf8');
  assert.equal(html.includes('id="f-source"'),false,file);
  const select=html.match(/<select id="f-heard-about">([\s\S]*?)<\/select>/);
  assert.ok(select,file);assert.equal(select[0].includes('required'),false,file);
  assert.ok(html.includes(question),file);
  for(const choice of choices)assert.ok(select[1].includes('value="'+choice+'"'),file+' '+choice);
  assert.match(html,/<input type="text" id="f-heard-detail" maxlength="80"/);
  assert.ok(html.includes("heard_about: val('f-heard-about')"),file);
  assert.equal(html.includes('stats.2-28-116-83.sslip.io'),false,file);
 }
 const umami=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 assert.ok(umami.includes('src="https://stats.katyashalel.com/script.js"'));
});
