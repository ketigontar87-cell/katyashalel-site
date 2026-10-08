/* Audit every public route. All outgoing submissions are intercepted locally. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const manifest=require('./site_motion_manifest.json').filter(r=>!r.excluded);
const origin='http://127.0.0.1:4196';
const out=process.env.INTERACTION_ARTIFACTS||'/tmp/katya-interactions/results';
const server=spawn('python3',['-m','http.server','4196','--bind','127.0.0.1'],{stdio:'ignore'});
const results={pages:[],forms:[],menus:[],limitations:[],mockedPosts:0};
async function activate(locator,width){if(width===390)await locator.tap();else{await locator.focus();await locator.press('Enter');}}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
 const inventory=new Map();
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390});
  let response='success';
  await context.route('**/*',route=>{
   const request=route.request(),u=new URL(request.url());
   if(request.method()==='POST'){
    results.mockedPosts++;
    if(response==='network')return route.abort();
    return route.fulfill({status:response==='http'?500:200,contentType:'application/json',body:response==='malformed'?'invalid JSON':JSON.stringify(response==='negative'?{ok:false,success:false}:response==='empty'?{}:{ok:true,success:'true'})});
   }
   return [origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(u.origin)?route.continue():route.abort();
  });
  const page=await context.newPage();
  let errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{window.copied.push(text);return Promise.resolve();}}});});
  for(const row of manifest){
   errors=[];await page.goto(origin+row.route);await page.evaluate(()=>document.fonts.ready);
   const data=await page.evaluate(()=>({links:[...document.querySelectorAll('a')].map(e=>({href:e.getAttribute('href'),text:e.textContent.trim()})),ids:[...document.querySelectorAll('[id]')].map(e=>e.id),alternates:[...document.querySelectorAll('link[hreflang]')].map(e=>({lang:e.hreflang,href:e.href})),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent))}));
   inventory.set(row.route,data);
   for(const href of data.links)assert.ok(href.href,`${row.route}: anchor has no destination`);
   // Each native disclosure must open via keyboard or touch, including the mobile menu.
   for(const summary of await page.locator('summary').all())if(await summary.isVisible()){
    const wasOpen=await summary.evaluate(e=>e.parentElement.open);
    if(width===390)await summary.tap();else {await summary.focus();await page.keyboard.press('Enter');}
    assert.equal(await summary.evaluate(e=>e.parentElement.open),!wasOpen,`${row.route}: disclosure activation`);
   }
   const hit=await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';let count=0;const failures=[];
    for(const e of document.querySelectorAll('a,button,input,textarea,select,summary,[role="button"],[onclick]')){
     if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||e.disabled||e.closest('[aria-hidden="true"]')||getComputedStyle(e).opacity==='0')continue;
     count++;e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
     // An inline link can wrap; its bounding-box centre may be whitespace.
     const r=e.getClientRects()[0],x=Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),y=Math.max(0,Math.min(innerHeight-1,r.y+r.height/2)),top=document.elementFromPoint(x,y);
     if(top!==e&&!e.contains(top))failures.push(`Covered ${e.tagName}: ${e.textContent.trim().slice(0,60)}`);
     e.focus({preventScroll:true});if(document.activeElement!==e)failures.push(`Not focusable ${e.tagName}: ${e.textContent.trim().slice(0,60)}`);
    }
    const apparent=[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).cursor==='pointer'&&!e.closest('a,button,input,textarea,select,summary,[role="button"],[onclick]')).map(e=>e.outerHTML.slice(0,150));
    return {count,failures,apparent};
   });
   assert.deepEqual(hit.failures,[],`${row.route} ${width}: all controls reachable`);
   assert.deepEqual(hit.apparent,[],`${row.route}: unexplained button-like elements`);
   const copy=page.locator('.copy');
   for(const button of await copy.all()){
    await activate(button,width);assert.match(await button.textContent(),/Copied|Скопировано/);
    assert.equal(await page.evaluate(()=>window.copied.at(-1)),await button.evaluate(e=>e.parentElement.querySelector('.p-body').innerText));
   }
   if(await copy.count()){
    // Denial and API absence must fall back to selecting the actual prompt, without errors.
    for(const denied of [true,false]){
     await page.evaluate(denied=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:denied?{writeText:()=>Promise.reject(Error('Clipboard denied'))}:undefined}),denied);
     await activate(copy.first(),width);assert.match(await copy.first().textContent(),/Selected|Выделено/);
     assert.equal(await page.evaluate(()=>getSelection().toString()),await copy.first().evaluate(e=>e.parentElement.querySelector('.p-body').textContent));
    }
   }
   for(const kind of ['lead','waitlist']){
    const button=page.locator(kind==='lead'?'#f-send':'.wl-form button');if(!await button.count())continue;
    const email=kind==='lead'?'#f-email':'#wl-email';
    for(const scenario of ['invalid','success','http','negative','empty','malformed','network']){
     await page.goto(origin+row.route);response=scenario;const posts=results.mockedPosts;
     await page.locator(email).fill(scenario==='invalid'?'invalid':'qa@example.invalid');await activate(button,width);
     if(scenario==='invalid'){await page.waitForTimeout(30);assert.equal(results.mockedPosts,posts,'Invalid email must not submit');}
     else{
      const note=page.locator(kind==='lead'?'#f-note':'.wl-form button');
      await note.filter({hasText:scenario==='success'?/Thanks|You are in|Вы в листе/:/Something went wrong|Error, try again|Ошибка/}).waitFor();
      assert.equal(results.mockedPosts,posts+1);assert.equal(await button.isDisabled(),scenario==='success');
      if(scenario!=='success')assert.equal(await page.locator(email).inputValue(),'qa@example.invalid','Retain email for retry');
      if(scenario==='negative'&&width===390)await page.screenshot({path:path.join(out,`${row.route.replaceAll('/','_')}-error.png`),fullPage:false});
     }
     results.forms.push({route:row.route,width,kind,scenario});
    }
   }
   assert.deepEqual(errors,[],`${row.route} ${width}: runtime errors`);
   results.pages.push({route:row.route,width,controls:hit.count,copies:await copy.count()});
  }
  await context.close();
 }
 // Validate every internal path and fragment. Existing API routes are checked as source files, never called.
 for(const [route,data] of inventory){
  for(const link of data.links){
   const u=new URL(link.href,origin+route);if(![origin,'https://katyashalel.com','https://www.katyashalel.com'].includes(u.origin))continue;
   let f=path.join(process.cwd(),decodeURIComponent(u.pathname));
   if(u.pathname.startsWith('/api/'))f+='.js';else if(!path.extname(f))f=path.join(f,'index.html');
   await fs.access(f).catch(()=>assert.fail(`${route}: missing internal path ${link.href}`));
   if(u.hash&&inventory.has(u.pathname))assert.ok(inventory.get(u.pathname).ids.includes(decodeURIComponent(u.hash.slice(1))),`${route}: missing target ${link.href}`);
  }
  for(const alternate of data.alternates){const target=new URL(alternate.href).pathname;assert.ok(inventory.has(target),`Missing alternate ${target}`);if(!inventory.get(target).alternates.some(a=>new URL(a.href).pathname===route))results.limitations.push({route,issue:'Pre-existing nonreciprocal hreflang; metadata change deferred',target});}
 }
 // A real native clipboard round trip, separate from deterministic denial/success mocks.
 const clipboardContext=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
 await clipboardContext.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 const clipboardPage=await clipboardContext.newPage();
 for(const route of ['/guides/legibility/','/ru/guides/legibility/']){
  await clipboardPage.goto(origin+route);await clipboardPage.locator('.copy').first().click();
  const pair=await clipboardPage.evaluate(async()=>[await navigator.clipboard.readText(),document.querySelector('.p-body').innerText]);
  assert.equal(pair[0],pair[1],`${route}: native clipboard contains complete prompt`);
  await clipboardPage.locator('.copy').first().click();await clipboardPage.waitForTimeout(1500);
  assert.equal(await clipboardPage.locator('.copy').first().textContent(),'Copy','Repeated copying restores original label');
 }
 await clipboardContext.close();
 // Reproduce the independently reported 500px issue, plus narrow/mobile/tablet and desktop.
 for(const width of [390,500,768,1440])for(const route of ['/','/ru/'])for(const mode of ['motion','reduced','no-js']){
  const c=await browser.newContext({viewport:{width,height:900},hasTouch:width<900,javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await c.route('**/*',r=>[origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(new URL(r.request().url()).origin)?r.continue():r.abort());
  const p=await c.newPage();await p.goto(origin+route);await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.content-copy a[href="https://legibi.ai/"]').count(),1);
  for(const target of ['#about','#contact']){
   const mobile=p.locator('.mobile-nav');const nav=width<900?mobile:p.locator('.nav');
   if(width<900){if(await mobile.getAttribute('open')===null)await mobile.locator('summary').click();assert.ok(await nav.locator(`a[href="${target}"]`).evaluate(e=>e.getBoundingClientRect().height>=44));}
   const link=nav.locator(`a[href="${target}"]`);
   if(mode==='reduced'){await link.focus();await p.keyboard.press('Enter');}else if(width<900)await link.tap();else await link.click();
   await p.waitForTimeout(mode==='reduced'?100:1200);assert.ok(p.url().endsWith(target));
   if(width<900&&mode!=='no-js'){assert.equal(await mobile.getAttribute('open'),null);assert.equal(await p.evaluate(()=>document.activeElement.id),target.slice(1));}
   const covered=await p.locator(target+' h2,'+target+' .display').first().evaluate(e=>{const header=document.querySelector('.top').getBoundingClientRect();const r=e.getBoundingClientRect();return Math.min(header.bottom,innerHeight)>r.top;});
   assert.equal(covered,false,`${route} ${width} ${mode}: anchor heading obscured`);
   if(target==='#contact'&&width===500)await p.screenshot({path:path.join(out,`${route==='/ru/'?'ru':'en'}-500-${mode}-contact.png`)});
  }
  if(width===1440&&mode==='motion')await p.locator('.content-copy').first().screenshot({path:path.join(out,`${route==='/ru/'?'ru':'en'}-strategy.png`)});
  // Incoming links start in another document, not a same-document test-driver navigation.
  await p.goto('about:blank');await p.goto(origin+route+'#person');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(mode==='reduced'?100:1200);
  assert.ok(await p.locator('#about h2#person').isVisible());
  assert.ok(await p.locator('#person').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.top').getBoundingClientRect().bottom),`${route} ${width} ${mode}: inbound founder anchor clears sticky header`);
  results.menus.push({route,width,mode});await c.close();
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({pages:results.pages.length,controls:results.pages.reduce((n,r)=>n+r.controls,0),forms:results.forms.length,menus:results.menus.length,mockedPosts:results.mockedPosts,limitations:results.limitations}));
 }finally{await browser.close();server.kill();}
})().catch(e=>{server.kill();console.error(e);process.exitCode=1});
