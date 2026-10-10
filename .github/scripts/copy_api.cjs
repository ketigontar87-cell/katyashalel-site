/* Exercise the callable output locally, with no network or external provider. */
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const m=require('./copy_review_manifest.json');
(async()=>{
 const load=async code=>(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
 const before=await load(execFileSync('git',['show',m.base+':api/agent.js'],{encoding:'utf8'}));
 const after=await load(fs.readFileSync('api/agent.js','utf8'));
 async function invoke(handler,query){let result,status,headers={};await handler({method:'GET',query},{setHeader:(k,v)=>headers[k]=v,status:n=>{status=n;return {send:text=>result=JSON.parse(text)}}});return {status,headers,result}}
 for(const query of [{},{type:'category'},{type:'recommendation'},{type:'offerings'},{type:'term',term:'corroboration-gap'},{type:'term',term:'missing-term'}]){
  const original=await invoke(before,query),current=await invoke(after,query);
  const expected=JSON.parse(JSON.stringify(original).replaceAll('Measure -> diagnose -> intervene -> verify.',m.method));
  assert.deepEqual(current,expected,'Existing API contract preserved for '+JSON.stringify(query));
  if(!query.type)assert.equal(current.result.identity.method.short,m.method);
 }
 console.log('6 local API output cases passed; schema, verification date, sources and headers preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
