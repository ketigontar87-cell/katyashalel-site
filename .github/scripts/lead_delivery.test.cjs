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
