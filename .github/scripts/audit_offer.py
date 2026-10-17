"""Acceptance for the owner-approved personal audit offer; no network or submissions."""
from pathlib import Path
import json,re,subprocess,html,hashlib,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[2];m=json.loads((root/'.github/scripts/audit_offer_manifest.json').read_text())
def old(f):return subprocess.check_output(['git','show',m['base']+':'+f],cwd=root,text=True)
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>','',s))).strip()
for f,label in [('index.html','Work with me'),('ru/index.html','Работать со мной')]:
 assert (root/f).read_text()==old(f).replace('<a class="btn primary" href="#contact">'+label+'</a>','<a class="btn primary" href="/audit/#request">'+label+'</a>'),f+' only primary CTA may change'
for lang in ['en','ru']:
 f=('ru/' if lang=='ru' else '')+'audit/index.html';s=(root/f).read_text();before=old(f);c=m['copy'][lang]
 assert re.findall(r'<style>.*?</style>',before,re.S)==[x.replace(m['addedStyle'],'') for x in re.findall(r'<style>.*?</style>',s,re.S)],f+' preserve styles except list spacing'
 js=r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>'
 before_scripts=re.findall(js,before,re.S);after_scripts=re.findall(js,s,re.S)
 if lang=='en':
  delivery=json.loads((root/'.github/scripts/audit_delivery_manifest.json').read_text())
  assert len(before_scripts)==len(after_scripts) and before_scripts[:-1]==after_scripts[:-1],f+' preserve other runtime'
  assert hashlib.sha256(after_scripts[-1].encode()).hexdigest()==delivery['runtimeSha256'],f+' approved email recovery runtime'
 else:assert before_scripts==after_scripts,f+' preserve runtime'
 for key in ['title','price','headline','intro','scope','included','process','limits','cta']:
  assert c[key] in clean(s),key
 assert [clean(x) for x in re.findall(r'<li>(.*?)</li>',s,re.S)]==c['items']
 schemas=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)]
 assert sum(x.get('@type')=='FAQPage' for x in schemas)==1,f+' exactly one FAQPage'
 assert sum(x.get('@type')=='Service' for x in schemas)==1,f+' exactly one Service'
 service=next(x for x in schemas if x['@type']=='Service');faq=next(x for x in schemas if x['@type']=='FAQPage')
 assert service['name']==c['title'] and service['offers']=={'@type':'Offer','price':'350','priceCurrency':'USD','url':'https://katyashalel.com/audit/#request','description':c['price']}
 assert service['description']==c['intro']+' '+c['scope']+' '+c['limits']
 assert service['provider']=={'@id':'https://katyashalel.com/#person'}
 visible={clean(q):clean(a) for q,a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>',s,re.S)}
 assert len(visible)==4
 for q in faq['mainEntity']:assert q['acceptedAnswer']['text']==visible[q['name']]
 links=r'<link[^>]*(?:rel="canonical"|hreflang=)[^>]*>'
 assert re.findall(links,before)==re.findall(links,s),'Canonical/hreflang unchanged'
 assert ('href="/ongoing/"' if lang=='en' else 'href="/ru/ongoing/"') in s
 assert 'mailto:shalelekaterina@gmail.com' in s
 assert not re.search(r'five.day|5.day|пять дней|пятиднев|₽|\b(?:RUB|EUR)\b|€',s,re.I)
 if lang=='en':
  assert sorted(re.findall(r'id="(f-[^"]+)"',s))==sorted(re.findall(r'id="(f-[^"]+)"',before))
  assert 'id="request"' in s and 'id="f-email" autocomplete="email" required' in s
  assert 'no passwords, API keys or confidential client documents' in s
  assert 'One person, one service' in s and '<option>Two or three</option>' not in s
assert (root/'api/lead.js').read_text()==old('api/lead.js'),'Lead backend frozen'
for f in ['llms.txt','llms-core.txt']:
 assert re.findall(r'Last verified:.*',(root/f).read_text())==re.findall(r'Last verified:.*',old(f))
 assert 'Personal AI Legibility Audit: $350 one-time.' in (root/f).read_text()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def dates(s):return {u.find('s:loc',ns).text:(u.find('s:lastmod',ns).text if u.find('s:lastmod',ns) is not None else None) for u in ET.fromstring(s).findall('s:url',ns)}
a=dates(old('sitemap.xml'));b=dates((root/'sitemap.xml').read_text());revision=json.loads((root/'docs/public-fit-revision.json').read_text())
new_routes={'https://katyashalel.com/'+f.removesuffix('index.html') for f in revision['newPages']}
changed_routes={'https://katyashalel.com/'+f.removesuffix('index.html') for f in revision['updatedPages']}
assert set(b)==set(a)|new_routes
assert all(b[u]==revision['publicationDate'] for u in new_routes)
for url in a:assert b[url]==(revision['publicationDate'] if url in changed_routes else m['publicationDate'] if url in ['https://katyashalel.com'+p for p in ['/','/ru/','/audit/','/ru/audit/']] else a[url])
print(json.dumps({'offerLanguages':2,'approvedBulletsPerLanguage':6,'changedHomepageCTAs':2,'sitemapDates':4,'backend':'unchanged','status':'passed'}))
