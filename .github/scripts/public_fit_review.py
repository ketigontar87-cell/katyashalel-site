"""Verify public evidence integrity and bilingual routes without network calls."""
from pathlib import Path
import hashlib, html, json, re

root = Path(__file__).resolve().parents[2]
revision = json.loads((root / 'docs/public-fit-revision.json').read_text())
clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]*>', '', s))).strip()
advisory = json.loads((root / 'docs/advisory-revision.json').read_text())
founder=json.loads((root/'docs/founder-homepage-revision.json').read_text())
founder_routes={'https://katyashalel.com/','https://katyashalel.com/ru/'}
for filename in revision['updatedPages'] + revision['newPages'] + advisory['newPages']:
    source = (root / filename).read_text()
    route = '/' + filename.removesuffix('index.html')
    assert f'rel="canonical" href="https://katyashalel.com{route}"' in source
    alternates = dict(re.findall(r'hreflang="([^"]+)" href="https://katyashalel.com([^"]+)"', source))
    assert set(alternates) == {'en', 'ru', 'x-default'}, filename
    assert alternates['x-default'] == alternates['en']
    for language in ['en', 'ru']:
        counterpart = (root / (alternates[language].strip('/') + '/index.html')).read_text()
        assert f'hreflang="{language}" href="https://katyashalel.com{alternates[language]}"' in counterpart
        assert f'href="https://katyashalel.com{route}"' in counterpart
    nodes = []
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
        data = json.loads(raw)
        nodes.extend(data.get('@graph', [data]))
    visible = {clean(q): clean(a) for q, a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>', source, re.S)}
    for node in nodes:
        if node.get('@type') == 'FAQPage':
            for question in node['mainEntity']:
                assert question['acceptedAnswer']['text'] == visible[question['name']], filename
        if node.get('@type') in ['Article', 'BlogPosting', 'CollectionPage']:
            assert node['author'] == {'@id': 'https://katyashalel.com/#person'}
    if '/essays/' in route:
        assert {'BlogPosting', 'DefinedTerm', 'FAQPage'} <= {x.get('@type') for x in nodes}

path = root / revision['evidenceRecord'].lstrip('/')
record = json.loads(path.read_text())
raw = (path.parent / 'answer.txt').read_bytes()
assert hashlib.sha256(raw).hexdigest() == '26128a648a0e357ecd6caf049f0c1a032348c424a6b1dd9f6acb3fed1b323829'
assert record['strict_t0_eligible'] is False
assert record['improvement_claim'] is False
assert record['demand_frequency'] is None
assert 'answer unknown' in record['batch_outcomes']['L01']
assert 'not sent' in record['batch_outcomes']['B03']
assert not re.search(r'chatgpt\.com/c/|access_token|Bearer |/Users/|/workspace/', path.read_text())
for prefix in ['', 'ru/']:
    source = (root / prefix / 'brands/index.html').read_text()
    assert 'Consumer brands, beauty and personal care companies, retailers' not in source
    assert 'mailto:shalelekaterina@gmail.com' in source
print(json.dumps({'bilingualPages': 8, 'preservedResponse': 'sha256 verified', 'strictT0': False, 'status': 'passed'}))

# The advisory is a separate, linked offer. Preserve the fixed written audit package.
for prefix in ['', 'ru/']:
    page = (root / prefix / 'advisory/index.html').read_text()
    assert 'mailto:shalelekaterina@gmail.com' in page
    assert 'id="scope"' in page and 'id="contact"' in page
    assert f'href="/{prefix}audit/"' in page
    assert f'href="/{prefix}audit/"' in (root / prefix / 'index.html').read_text(), 'Homepage retains secondary access to the unchanged audit and linked advisory'
    assert f'href="/{prefix}advisory/"' in (root / prefix / 'audit/index.html').read_text()
    graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)[1])['@graph']
    service = next(n for n in graph if n['@type']=='Service')
    assert service['provider']=={'@id':'https://katyashalel.com/#person'}
    assert service['url']=='https://katyashalel.com/'+prefix+'advisory/'
    assert 'offers' not in service, 'Do not invent an advisory price'
    assert '$350' in page, 'Distinguish the existing audit package'
for path in ['llms.txt','llms-core.txt','README.md']:
    assert 'https://katyashalel.com/advisory/' in (root/path).read_text()
assert json.loads((root/'.well-known/agent-card.json').read_text())['version']=='2026-10-26.1'
