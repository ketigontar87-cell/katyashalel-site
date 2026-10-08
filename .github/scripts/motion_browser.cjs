/* Run with the existing Playwright test installation; no site dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = process.cwd();
const origin = 'http://127.0.0.1:4175';
const out = process.env.MOTION_ARTIFACTS || '/tmp/katya-motion-evidence';
const base = '5b9396159b31680bb0b5c189883b833b206fc2d2';
const server = spawn('python3', ['-m', 'http.server', '4175', '--bind', '127.0.0.1'], { stdio: 'ignore' });
async function signature(page) {
  return page.evaluate(() => ({
    text: document.body.innerText.replace(/ · Paris/g, '').replace(/ · Telegram/g, ''),
    links: [...document.querySelectorAll('a')].filter(a => a.getAttribute('href') !== 'https://t.me/shalel_notes').map(a => [a.textContent, a.getAttribute('href')]),
    metadata: [...document.querySelectorAll('meta,link[rel="canonical"],link[hreflang],script[type="application/ld+json"]')].map(e => e.outerHTML.replace(/,\s*"https:\/\/t\.me\/shalel_notes"/g, '')),
    boxes: ['.portrait','h1','.proof','.proof + section','#questions'].map(s => {
      const b=document.querySelector(s).getBoundingClientRect();return [b.x,b.y+scrollY,b.width,b.height];
    })
  }));
}
(async () => {
  await fs.mkdir(out, { recursive: true });
  for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
  const results=[];
  try {
    for(const width of [390,768,1440]) for(const lang of ['en','ru']) {
      const path=lang==='en'?'/':'/ru/';
      const html=execFileSync('git',['show',`${base}:${lang==='en'?'index.html':'ru/index.html'}`],{encoding:'utf8',cwd:root});
      let baseline;
      for(const mode of ['baseline','motion','reduced','no-js']) {
        const context=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',hasTouch:width===390});
        await context.route('**/*',route=>{
          const u=new URL(route.request().url());
          if(u.origin===origin && u.pathname===path && mode==='baseline')return route.fulfill({contentType:'text/html',body:html});
          return [origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(u.origin)?route.continue():route.abort();
        });
        const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{window.rafCount=0;const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>{window.rafCount++;return raf(cb);};});
        await page.goto(origin+path,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
        if(mode==='motion')await page.waitForTimeout(1800);
        const current=await signature(page);
        if(mode==='baseline')baseline=current;
        else {
          assert.deepEqual(current,baseline,`${lang}/${width}/${mode}: content, metadata, links, layout unchanged`);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'No horizontal overflow');
          assert.equal(await page.locator('h1').count(),1);
          assert.ok(await page.locator('h1').isVisible());
          await page.screenshot({path:`${out}/${lang}-${width}-${mode}-hero.png`});
          if(mode==='motion') {
            const replay=page.getByRole('button',{name:lang==='en'?'Replay animation':'Повторить анимацию'});
            const settled=await page.locator('.register-trace').first().getAttribute('d');
            await replay.focus();await page.keyboard.press('Enter');await page.waitForTimeout(80);
            assert.notEqual(await page.locator('.register-trace').first().getAttribute('d'),settled,'Keyboard replay starts');
            await page.waitForTimeout(1800);
            if(width===390){await replay.tap();await page.waitForTimeout(1800);}
            const count=await page.evaluate(()=>window.rafCount);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.rafCount),count,'No idle animation loop');
            await page.locator('.proof').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
            assert.ok(Number(await page.locator('.proof').evaluate(e=>e.style.getPropertyValue('--rail')))>0);
            await page.screenshot({path:`${out}/${lang}-${width}-motion-evidence.png`});
            await page.locator('.motion-strategy').screenshot({path:`${out}/${lang}-${width}-motion-strategy.png`});
            await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.motion-replay').disabled);assert.ok(await replay.isDisabled());
            const still=await page.locator('.register-trace').first().getAttribute('d');await page.waitForTimeout(150);assert.equal(await page.locator('.register-trace').first().getAttribute('d'),still);
          }
          if(mode==='reduced')assert.ok(await page.locator('.motion-replay').isDisabled());
          if(mode==='no-js')assert.equal(await page.locator('.motion-replay').count(),0);
          const menu=page.locator('.mobile-nav');
          if(await menu.isVisible()){await menu.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await menu.getAttribute('open'),'');await page.keyboard.press('Enter');}
          await page.locator('.hero .actions a').click();await page.waitForTimeout(700);assert.ok(page.url().endsWith('#contact'));assert.ok(await page.locator('#contact a[href="mailto:shalelekaterina@gmail.com"]').isVisible());
          assert.deepEqual(errors,[]);
          results.push({lang,width,mode,status:'passed'});
        }
        await context.close();
      }
    }
    await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.kill());
