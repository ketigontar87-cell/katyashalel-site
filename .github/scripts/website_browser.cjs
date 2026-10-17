/* Synthetic public-site acceptance. External requests and real submissions are blocked. */
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
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
        assert.equal(await page.locator('.faq details').count(), 4);
        const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(layout.scroll <= width + 1, JSON.stringify({ path, ...layout }));
        if (path === '/' || path === '/ru/') {
          const expected = lang === 'en' ? 'Does AI recommend you when your customers ask?' : 'Рекомендует ли вас AI вашим потенциальным клиентам?';
          assert.equal(await page.getByRole('heading', { level: 1 }).innerText().then(s => s.replace(/\s+/g, ' ')), expected);
          assert.equal(await page.locator('.hero .actions a').count(), 1);
          await page.screenshot({ path: `${out}/${lang}-${width}-hero.png` });
          const menu = page.locator('.mobile-nav');
          if (await menu.isVisible()) {
            await menu.locator('summary').focus();
            await page.keyboard.press('Enter');
            assert.equal(await menu.getAttribute('open'), '');
            assert.ok(await menu.getByRole('link', { name: lang === 'en' ? 'For companies' : 'Для компаний' }).isVisible());
            await page.keyboard.press('Enter');
          }
          await page.locator('#method').screenshot({ path: `${out}/${lang}-${width}-method.png` });
          await page.locator('.hero .actions a').click();
          assert.ok(page.url().endsWith('/audit/#request'));
          assert.ok(await page.locator('#request #f-email').isVisible());
          await page.goto(origin+path);
        }
        const disclosure = page.locator('.faq summary').first();
        await disclosure.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.faq details').first().getAttribute('open'), '');
        if (lang === 'en' && path !== '/') {
          await page.locator('#f-send').click();
          assert.match(await page.locator('#f-note').innerText(), /valid email/);
          await page.locator('#f-email').fill('test@example.com');
          let submissions = 0;
          await page.route('**/api/lead', route => { submissions++; return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: true }) }); });
          await page.locator('#f-send').click();
          if (path === '/audit/') {
            assert.match(await page.locator('#f-note').innerText(), /has not been sent/);
            assert.equal(submissions, 0, 'Email recovery must not submit to the broken handler');
            const draft = new URL(await page.locator('#email-open').getAttribute('href'));
            assert.equal(draft.pathname, 'shalelekaterina@gmail.com');
            assert.match(draft.searchParams.get('body'), /Reply email: test@example.com/);
            assert.ok(await page.locator('#email-draft').isVisible());
          } else {
            await page.getByText('Something went wrong.', { exact: false }).waitFor();
            assert.doesNotMatch(await page.locator('#f-note').innerText(), /Thanks/);
          }
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
