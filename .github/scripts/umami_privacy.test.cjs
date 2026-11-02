const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const tracker = '<script defer src="/assets/umami-privacy.js"></script>\n<script defer src="https://stats.katyashalel.com/script.js" data-website-id="28863e5d-32dd-4b7d-9368-46d5ba6d6866" data-domains="katyashalel.com" data-exclude-search="true" data-exclude-hash="true" data-before-send="katyaUmamiBeforeSend"></script>\n';

function loadHook(location) {
  const context = { URL, URLSearchParams, location };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/umami-privacy.js'), 'utf8'), context);
  return context.katyaUmamiBeforeSend;
}

test('every public page loads the hardened Umami tag once', () => {
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) files.push(full);
    }
  })(root);
  assert.equal(files.length, 78);
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html.split(tracker).length - 1, 1, file);
    assert.equal(html.includes('data-domains="www.katyashalel.com"'), false, file);
  }
});

test('strips query and hash, drops secret fields, and skips service paths', () => {
  const send = loadHook({ pathname: '/about/', search: '?utm=newsletter', hash: '#person' });
  const cleaned = send('event', {
    url: '/about/?utm=newsletter&email=person@example.com#person',
    referrer: 'https://example.com/path?access_token=secret#top',
    email: 'person@example.com',
    token: 'raw-token',
    name: 'pageview',
    data: { email: 'person@example.com', code: 'abc', section: 'about' }
  });
  assert.equal(cleaned.url, '/about/');
  assert.equal(cleaned.referrer, 'https://example.com/path');
  assert.equal(cleaned.name, 'pageview');
  assert.equal(JSON.stringify(cleaned.data), JSON.stringify({ section: 'about' }));
  assert.equal('email' in cleaned, false);
  assert.equal('token' in cleaned, false);

  const russian = send('event', {
    url: 'https://katyashalel.com/ru/audit/?code=1#request',
    referrer: '/guides/sprint/?token=1'
  });
  assert.equal(russian.url, 'https://katyashalel.com/ru/audit/');
  assert.equal(russian.referrer, '/guides/sprint/');

  assert.equal(send('event', { url: '/api/lead?token=1' }), false);
  assert.equal(send('event', { url: '/carousel-studio.html' }), false);
  assert.equal(send('event', { url: '/admin/' }), false);
  assert.equal(send('event', { url: '/audit/thank-you/?email=person@example.com' }), false);
  assert.equal(send('event', { url: '/.well-known/agent-card.json' }), false);
  assert.equal(send('event', null), false);

  const onTool = loadHook({ pathname: '/carousel-studio.html', search: '', hash: '' });
  assert.equal(onTool('event', { url: '/about/' }), false);
});
