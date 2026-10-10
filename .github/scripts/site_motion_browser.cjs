/* Full HTML inventory, immutable pre-expansion baseline, no real submissions. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');
const manifest=require('./site_motion_manifest.json');
const copyReview=require('./copy_review_manifest.json');
const base='1062f45669884a5c0aa700c22a06eac360135151';
const origin='http://127.0.0.1:4185';
const out=process.env.SITE_MOTION_ARTIFACTS||'/tmp/katya-site-motion/results';
const server=spawn('python3',['-m','http.server','4185','--bind','127.0.0.1'],{stdio:'ignore'});
const sources=new Map(manifest.map(r=>[r.route,execFileSync('git',['show',`${base}:${r.file}`],{encoding:'utf8'})]));
// Independent DOM interpretation of the owner's exact contact removal scope.
async function approvedContactRemoval(page){await page.evaluate(()=>{
 for(const a of document.querySelectorAll('a[href="https://t.me/shalel_notes"]')){
  if(a.closest('.tg'))a.closest('.tg').remove();
  else if(a.parentElement.tagName==='P' && a.parentElement.textContent.includes('Живая лента'))a.parentElement.remove();
  else {const prev=a.previousSibling;if(prev?.nodeType===3)prev.textContent=prev.textContent.replace(/\s*·\s*$/,'');a.remove();}
 }
 for(const e of document.querySelectorAll('footer span'))for(const n of e.childNodes)if(n.nodeType===3)n.textContent=n.textContent.replace(' · Paris','');
 for(const p of document.querySelectorAll('.content-copy p')) {
  for(const n of [...p.childNodes]) if(n.nodeType===3 && n.textContent.includes('Legibi')) {
   const [before,after]=n.textContent.split('Legibi'); const a=document.createElement('a');a.href='https://legibi.ai/';a.className='contextual-legibi';a.textContent='Legibi';n.replaceWith(before,a,after);
  }
 }
 for(const a of document.querySelectorAll('a[href="/vocabulary/#indifference-test"]'))a.setAttribute('href','/vocabulary/#the-indifference-test');
 // Approved mobile table repair: wrap long cell words only on this essay.
 // Mirror that exact rule in the historical reference; keep strict geometry equality.
 if(location.pathname==='/essays/who-owns-the-recommendation/' && matchMedia('(max-width: 560px)').matches){
  for(const cell of document.querySelectorAll('.layer-map th,.layer-map td'))cell.style.overflowWrap='anywhere';
 }
 // Explicitly authorized reciprocal visible Sprint navigation; metadata stays frozen.
 if(location.pathname==='/guides/sprint/'){
  const a=document.createElement('a');a.href='/ru/guides/sprint/';a.textContent='RU';document.querySelector('.top').append(a);
 }

});}
async function signature(page){return page.evaluate(()=>{
 const text=s=>s.replace(/\s+/g,' ').trim();
 const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent));
 const clean=o=>{if(!o||typeof o!=='object')return;if(o['@type']==='Person')delete o.homeLocation;if(Array.isArray(o.sameAs))o.sameAs=o.sameAs.filter(s=>s!=='https://t.me/shalel_notes');Object.values(o).forEach(clean);};schemas.forEach(clean);
 return {text:text(document.body.innerText),links:[...document.querySelectorAll('a')].map(e=>[e.getAttribute('href'),text(e.textContent)]),schema:schemas,meta:[...document.querySelectorAll('meta,link[rel="canonical"],link[hreflang]')].map(e=>e.outerHTML),images:[...document.images].map(e=>[e.getAttribute('src'),e.getAttribute('alt')]),boxes:[...document.querySelectorAll('h1,h2,h3,p,img,.step,.entry,.term,.faq,footer')].map(e=>{const r=e.getBoundingClientRect();return [e.tagName,...[r.x,r.y+scrollY,r.width,r.height].map(n=>Math.round(n*100)/100)];}),width:document.documentElement.scrollWidth};
});}
async function ready(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const files=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n').sort();assert.deepEqual(manifest.map(r=>r.file).sort(),files,'Every HTML file inventoried');
 for(const row of manifest.filter(r=>r.excluded))assert.equal(await fs.readFile(row.file,'utf8'),sources.get(row.route),'Excluded utility source unchanged');
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 const results=[];const observed=[];
 try{
 for(const width of [390,1440]){
  const contexts={};const pages={};
  for(const mode of ['baseline','motion','reduced','no-js']){
   const c=contexts[mode]=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',hasTouch:width===390});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin&&sources.has(u.pathname)&&mode==='baseline')return r.fulfill({contentType:'text/html',body:u.pathname==='/ru/ai-legibility/'?sources.get(u.pathname).replace('</head>','</style>\n</head>'):sources.get(u.pathname)});if(u.origin===origin&&u.pathname.startsWith('/api/'))return r.abort();return [origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(u.origin)?r.continue():r.abort();});
   pages[mode]=await c.newPage();
  }
  for(const row of manifest.filter(r=>!r.excluded)){
   const before=pages.baseline;await before.goto(origin+row.route,{waitUntil:'load'});await ready(before);await approvedContactRemoval(before);const expected=await signature(before);let copyExpected;
   for(const mode of ['motion','reduced','no-js']){
    const p=pages[mode];const errors=[];const capture=e=>errors.push(e.message);p.on('pageerror',capture);
    await p.goto(origin+row.route,{waitUntil:'load'});await ready(p);
    assert.equal(await p.locator('body').getAttribute('data-motion-family'),row.family);
    const actual=await signature(p);
    if(copyReview.pages.includes(row.file)){
     // Authorized editorial changes can reflow text; styles/structure are locked by copy_review.py.
     assert.deepEqual(actual.images,expected.images,`${row.route}: images preserved`);
     const authorizedSprintHreflang=['<link rel="alternate" hreflang="en" href="https://katyashalel.com/guides/sprint/">','<link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/guides/sprint/">','<link rel="alternate" hreflang="x-default" href="https://katyashalel.com/guides/sprint/">'];
     const fixedMeta=items=>items.filter(s=>!/(?:name|property)="(?:description|og:description|twitter:description)"/.test(s)&&!authorizedSprintHreflang.includes(s));
     assert.deepEqual(fixedMeta(actual.meta),fixedMeta(expected.meta),`${row.route}: non-copy metadata preserved`);
     const retainedLinks=await p.evaluate(()=>[...document.querySelectorAll('a:not(.course-availability)')].map(a=>[a.getAttribute('href'),a.textContent.replace(/\s+/g,' ').trim()]));
     assert.deepEqual(retainedLinks,expected.links,`${row.route}: original links preserved`);
     assert.ok(actual.width<=Math.max(width,expected.width),`${row.route}: no new horizontal overflow`);
     if(!copyExpected)copyExpected=actual;
     else assert.deepEqual(actual,copyExpected,`${row.route}: approved copy is identical with reduced motion and JS disabled`);
    }else assert.deepEqual(actual,expected,`${row.route} ${width} ${mode}: copy/links/metadata/images/geometry`);
    if(row.file==='essays/who-owns-the-recommendation/index.html'){
     assert.ok(actual.width<=width,`${row.route} ${width} ${mode}: no document overflow after table wrap`);
     assert.equal(await p.locator('.layer-map').evaluate(e=>getComputedStyle(e).display),'table','Native table semantics/layout retained');
     assert.equal(await p.locator('.layer-map').evaluate(e=>getComputedStyle(e).overflowX),'visible','Table overflow is wrapped, not hidden');
    }
    if(actual.width>width+1)observed.push({route:row.route,width,issue:'Pre-existing horizontal overflow, unchanged from baseline',scrollWidth:actual.width});
    assert.equal(await p.locator('a[href="https://t.me/shalel_notes"]').count(),0);
    assert.ok(await p.locator('h1').isVisible());
    if(mode!=='no-js'){
     assert.ok(await p.locator('.motion-heading,.motion-boundary').count()>0);
     const first=p.locator('.motion-heading').first();await first.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForFunction(()=>document.querySelector('.motion-heading')?.classList.contains('is-registered'));
     if(mode==='reduced')assert.equal(await first.evaluate(e=>getComputedStyle(e,'::before').transitionDuration),'0s');
    }
    const disclosure=p.locator('details:visible').first();if(await disclosure.count()){
     await disclosure.locator('summary').focus();await p.keyboard.press('Enter');assert.equal(await disclosure.getAttribute('open'),'',`${row.route} keyboard disclosure`);await p.keyboard.press('Enter');
     if(width===390){await disclosure.locator('summary').tap();assert.equal(await disclosure.getAttribute('open'),'',`${row.route} touch disclosure`);await disclosure.locator('summary').tap();}
    }
    if(mode==='motion'){
     await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`${out}/${row.file.replaceAll('/','_')}-${width}.png`});
     const last=p.locator('.motion-heading').last();await last.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForFunction(()=>[...document.querySelectorAll('.motion-heading')].at(-1)?.classList.contains('is-registered'));
     if(['service','profile','research','archive'].includes(row.family)||row.file.includes('water-against')||row.file==='ru/guides/dictionary/index.html')await p.screenshot({path:`${out}/${row.file.replaceAll('/','_')}-${width}-reading.png`});
    }
    assert.deepEqual(errors,[],`${row.route}: JS errors`);p.off('pageerror',capture);
    results.push({route:row.route,family:row.family,lang:row.lang,width,mode,status:'passed'});
   }
   console.log('PASS',width,row.route);
  }
  for(const c of Object.values(contexts))await c.close();
 }
 // Boundary-width regression checks for the one approved table repair.
 const tableWrapCases=[];
 for(const width of [320,360,560,561])for(const mode of ['motion','reduced','no-js']){
  const c=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());return [origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(u.origin)&&!u.pathname.startsWith('/api/')?r.continue():r.abort();});
  const p=await c.newPage();await p.goto(origin+'/essays/who-owns-the-recommendation/',{waitUntil:'load'});await ready(p);
  const geometry=await p.locator('.layer-map').evaluate(e=>({documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,right:e.getBoundingClientRect().right,display:getComputedStyle(e).display,overflow:getComputedStyle(e).overflowX,cells:[...e.querySelectorAll('th,td')].map(c=>({width:c.clientWidth,scroll:c.scrollWidth}))}));
  assert.ok(geometry.documentWidth<=width,`${width} ${mode}: document overflow ${JSON.stringify(geometry)}`);
  assert.ok(geometry.right<=width,`${width} ${mode}: table outside viewport`);
  assert.equal(geometry.display,'table');assert.equal(geometry.overflow,'visible');
  for(const cell of geometry.cells)assert.ok(cell.scroll<=cell.width+1,`${width} ${mode}: cell content overflows`);
  tableWrapCases.push({width,mode,...geometry});await c.close();
 }
 await fs.writeFile(`${out}/table-wrap-results.json`,JSON.stringify(tableWrapCases,null,2));
 console.log('PASS table wrapping at 320, 360, 560 and 561px in all modes');
 await fs.writeFile(`${out}/results.json`,JSON.stringify({base,cases:results,preExisting:[...new Map(observed.map(r=>[r.route+r.width,r])).values()],excluded:manifest.filter(r=>r.excluded)},null,2));
 console.log(JSON.stringify({passed:results.length,preExisting:[...new Map(observed.map(r=>[r.route+r.width,r])).values()],excluded:manifest.filter(r=>r.excluded)}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.kill());
