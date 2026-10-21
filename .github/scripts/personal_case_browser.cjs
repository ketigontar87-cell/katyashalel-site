/* Local-only EN/RU case acceptance. No external requests or model calls. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');const assert=require('node:assert/strict');
const origin='http://127.0.0.1:4187';const server=spawn('python3',['-m','http.server','4187','--bind','127.0.0.1'],{stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<100;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 fs.mkdirSync('artifacts/website-browser/personal-case',{recursive:true});
 for(const width of [390,1440])for(const pre of ['','ru/']){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto(origin+'/'+pre+'observations/2026-10-17-consultant-selection/');
 assert.equal(await page.locator('h1').count(),1);assert.ok(await page.getByText('Closest match',{exact:false}).first().isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.equal(await page.locator('article img').count(),0);
 const details=page.locator('[data-nosnippet] > details');assert.equal(await details.getAttribute('open'),null);
 await details.locator(':scope > summary').focus();await page.keyboard.press('Enter');assert.equal(await details.getAttribute('open'),'');
 await details.locator('details > summary').click();assert.ok(await details.locator('pre').isVisible());
 await details.locator(':scope > summary').click();
 await page.screenshot({path:`artifacts/website-browser/personal-case/${pre?'ru':'en'}-${width}.png`,fullPage:true});
 const cta=page.locator('.footer-cta .btn');assert.equal(await cta.getAttribute('href'),'/'+pre+'audit/');
 await cta.click();assert.equal(new URL(page.url()).pathname,'/'+pre+'audit/');await page.close();
 }
 console.log('Personal case: 4 mobile/desktop language checks passed');
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
