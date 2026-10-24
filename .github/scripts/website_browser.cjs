/* Synthetic public-site acceptance. External requests and real submissions are blocked. */
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const founder = require('../../docs/founder-homepage-revision.json');
const origin = 'http://127.0.0.1:4174';
const out = 'artifacts/website-browser';
const server = spawn('python3', ['-m', 'http.server', '4174', '--bind', '127.0.0.1'], { stdio: 'ignore' });
async function run() {
  await mkdir(out, { recursive: true });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
  const results = [];
  try {
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/*', route => [origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const [path, lang] of [['/', 'en'], ['/ru/', 'ru'], ['/audit/', 'en'], ['/ru/audit/', 'ru'], ['/brands/', 'en'], ['/ru/brands/', 'ru'], ['/ongoing/', 'en'], ['/ru/ongoing/', 'ru']]) {
        await page.goto(origin + path, { waitUntil: 'networkidle' });
        assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
        assert.equal(await page.locator('html').getAttribute('lang'), lang);
        assert.equal(await page.locator('.faq details').count(), ['/', '/ru/'].includes(path) ? 0 : 4);
        const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(layout.scroll <= width + 1, JSON.stringify({ path, ...layout }));
        if (path === '/' || path === '/ru/') {
          const expected = founder.copy[lang].headline;
          assert.equal(await page.getByRole('heading', { level: 1 }).innerText().then(s => s.replace(/\s+/g, ' ')), expected);
          assert.equal(await page.locator('.hero .actions a').count(), 2);
          await page.screenshot({ path: `${out}/${lang}-${width}-hero.png` });
          await page.locator('.hero').screenshot({ path: `${out}/${lang}-${width}-hero-complete.png` });
          const primaryBottom = await page.locator('.hero .btn.primary').evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
          if(width===1440) assert.ok(primaryBottom<=900,'Desktop primary CTA stays within the first 900px viewport');
          if(width===390) assert.ok(primaryBottom<=1200,'Compact mobile hero keeps the CTA within a short initial scroll');
          const menu = page.locator('.mobile-nav');
          if (await menu.isVisible()) {
            await menu.locator('summary').focus();
            await page.keyboard.press('Enter');
            assert.equal(await menu.getAttribute('open'), '');
            assert.ok(await menu.getByRole('link', { name: 'Legibi', exact: true }).isVisible());
            await page.keyboard.press('Enter');
          }
          await page.locator('#method').screenshot({ path: `${out}/${lang}-${width}-method.png` });
          const routes = founder.copy[lang].heroLinks;
          for (let i = 0; i < routes.length; i++) {
            assert.equal(await page.locator('.hero .actions a').nth(i).getAttribute('href'), routes[i]);
            if (routes[i].startsWith('https://')) continue; // Assert external destination without leaving local-only QA.
            await page.locator('.hero .actions a').nth(i).click();
            assert.equal(new URL(page.url()).pathname, routes[i]);
            assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
            await page.goto(origin + path, { waitUntil: 'networkidle' });
          }
        }
        if (!['/', '/ru/'].includes(path)) {
        const disclosure = page.locator('.faq summary').first();
        await disclosure.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.faq details').first().getAttribute('open'), '');
        }
        if (lang === 'en' && path !== '/') {
          await page.locator('#f-send').click();
          assert.match(await page.locator('#f-note').innerText(), /valid email/);
          await page.locator('#f-email').fill('test@example.com');
          await page.route('**/api/lead', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
          await page.locator('#f-send').click();
          await page.getByText('Something went wrong.', { exact: false }).waitFor();
          assert.doesNotMatch(await page.locator('#f-note').innerText(), /Thanks/);
          await page.unroute('**/api/lead');
        }
        await page.screenshot({ path: `${out}/${lang}-${width}-${path.replace(/\//g, '_') || 'home'}-full.png`, fullPage: true });
        results.push({ path, lang, width, status: 'passed' });
      }
      await context.close();
    }
    await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.kill());
