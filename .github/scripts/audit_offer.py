"""Acceptance for the owner-approved personal audit offer; no network or submissions."""
from pathlib import Path
from photo_binding import original_home_photo
import json,re,subprocess,html,hashlib,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[2];m=json.loads((root/'.github/scripts/audit_offer_manifest.json').read_text())
def old(f):return subprocess.check_output(['git','show',m['base']+':'+f],cwd=root,text=True)
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>','',s))).strip()
human=json.loads((root/'docs/founder-homepage-revision.json').read_text())
for f in ['index.html','ru/index.html']:
 s=original_home_photo((root/f).read_text())
 before=subprocess.check_output(['git','show',human['base']+':'+f],cwd=root,text=True)
 assert hashlib.sha256(s.encode()).hexdigest()==human['homepageSha256'][f],f+' approved founder-first copy'
 assert s.count(human['approvedLayoutStyle'])==1,f+' exact approved compact hero styles'
 for pattern in [r'<style>.*?</style>',r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>',r'<link[^>]*(?:rel="canonical"|hreflang=)[^>]*>']:
  assert re.findall(pattern,s,re.S)==re.findall(pattern,before,re.S),f+' preserve runtime, identity and language metadata'
 prefix='ru/' if f.startswith('ru/') else ''
 hero=re.search(r'<div class="actions">(.*?)</div>',s,re.S).group(1)
 assert re.findall(r'href="([^"]+)"',hero)==['https://legibi.ai/','/'+prefix+'guides/sprint/'],f+' founder-first product and method routes'
 schemas=lambda x:[json.loads(v) for v in re.findall(r'<script type="application/ld\+json">(.*?)</script>',x,re.S)]
 assert schemas(s)==[v for v in schemas(before) if v.get('@type')!='FAQPage'],f+' preserve Person identity; remove absent service FAQ'
 c=human['copy']['ru' if prefix else 'en']
 assert c['headline'] in clean(s)
 assert all(t in clean(s) for t in c['paragraphs'])
 assert c['title'] in s and c['description'] in s
 assert c['signature'] in clean(s),f+' full founder signature'
for lang in ['en','ru']:
 f=('ru/' if lang=='ru' else '')+'audit/index.html';s=(root/f).read_text();before=old(f);c=m['copy'][lang]
 styles_before=re.findall(r'<style>.*?</style>',before,re.S);styles_after=re.findall(r'<style>.*?</style>',s,re.S)
 if lang=='en':
  assert styles_before==[x.replace(m['addedStyle'],'') for x in styles_after],f+' preserve styles except list spacing'
 else:
  assert styles_before==[styles_after[0].replace(m['addedStyle'],'')],f+' preserve published styles'
  assert len(styles_after)==2 and 'form-grid' in styles_after[1],f+' Russian request form styles'
 js=r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>'
 before_scripts=re.findall(js,before,re.S);after_scripts=re.findall(js,s,re.S)
 if lang=='en':
  delivery=json.loads((root/'.github/scripts/audit_delivery_manifest.json').read_text())
  assert len(before_scripts)==len(after_scripts) and before_scripts[:-1]==after_scripts[:-1],f+' preserve other runtime'
  assert hashlib.sha256(after_scripts[-1].encode()).hexdigest()==delivery['runtimeSha256'],f+' approved email recovery runtime'
 else:
  assert after_scripts[:-1]==before_scripts,f+' preserve published runtime'
  assert hashlib.sha256(after_scripts[-1].encode()).hexdigest()==m['ruRuntimeSha256'],f+' Russian request runtime'
  assert "fetch('/api/lead'" in after_scripts[-1] and 'id="f-email" autocomplete="email" required' in s
 for key in ['title','price','headline','intro','scope','included','process','limits','cta']:
  assert c[key] in clean(s),key
 assert [clean(x) for x in re.findall(r'<li>(.*?)</li>',s,re.S)]==c['items']
 schemas=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)]
 assert sum(x.get('@type')=='FAQPage' for x in schemas)==1,f+' exactly one FAQPage'
 assert sum(x.get('@type')=='Service' for x in schemas)==1,f+' exactly one Service'
 service=next(x for x in schemas if x['@type']=='Service');faq=next(x for x in schemas if x['@type']=='FAQPage')
 assert service['name']==c['title']
 assert service['alternateName']==c['buyerTitle'] and service['serviceType']==c['buyerTitle']
 assert service['audience']=={'@type':'Audience','audienceType':c['audience']} and c['audience'] in clean(s)
 assert re.search(r'<h1>'+re.escape(c['buyerTitle'])+r'</h1>',s)
 assert c['buyerTitle'] in re.search(r'<title>(.*?)</title>',s).group(1)
 assert c['buyerTitle'] in re.search(r'<meta name="description" content="([^"]*)"',s).group(1)
 offer_url='https://katyashalel.com/audit/#request' if lang=='en' else 'https://katyashalel.com/ru/audit/#request'
 assert service['offers']=={'@type':'Offer','price':'350','priceCurrency':'USD','url':offer_url,'description':c['price'],'seller':{'@id':'https://katyashalel.com/#person'}}
 assert service['description']==c['buyerTitle']+'. '+c['intro']+' '+c['scope']+' '+c['limits']
 assert service['provider']=={'@id':'https://katyashalel.com/#person'}
 org=next(x for x in schemas if x.get('@type')=='Organization')
 assert org=={'@context':'https://schema.org','@type':'Organization','@id':'https://legibi.ai/#organization','name':'Legibi','url':'https://legibi.ai/','founder':{'@id':'https://katyashalel.com/#person'}}
 assert sum(x.get('@type')=='Organization' for x in schemas)==1
 visible={clean(q):clean(a) for q,a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>',s,re.S)}
 assert list(visible.items())==[(q['name'],q['text']) for q in c['faq']]
 assert [(q['name'],q['acceptedAnswer']['text']) for q in faq['mainEntity']]==[(q['name'],q['text']) for q in c['faq']]
 for banned in ['Другая валюта не указана','Постоянный набор инструментов','Оплаты на этой странице нет','No other currency','fixed list of assistants','no payment checkout','is not this audit','не является платформой']:
  assert banned not in s,banned
 if lang=='en':
  assert 'Payment is arranged after the request.' in s and 'early access by request' in s
  assert 'Terms updated: 18 October 2026.' in s and 'Page revised: 1 November 2026.' in s
 else:
  assert 'Оплату согласуем после заявки.' in s and 'ранний доступ по заявке' in s
  assert 'Условия обновлены: 18 октября 2026 года.' in s and 'Страница обновлена: 1 ноября 2026 года.' in s
  assert 'href="#request"' in s and 'href="/audit/#request"' not in s
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
delivery=json.loads((root/'.github/scripts/audit_delivery_manifest.json').read_text())
assert hashlib.sha256((root/'api/lead.js').read_bytes()).hexdigest()==delivery['backendSha256'],'Approved email delivery backend'
for f in ['llms.txt','llms-core.txt']:
 assert re.findall(r'Last verified:.*',(root/f).read_text())==re.findall(r'Last verified:.*',old(f))
 text=(root/f).read_text()
 assert 'Personal AI Legibility Audit: $350 one-time.' in text
 assert 'AI visibility audit for founders and independent professionals' in text
 assert 'аудит видимости в нейросетях для предпринимателей и независимых экспертов' in text
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def dates(s):return {u.find('s:loc',ns).text:(u.find('s:lastmod',ns).text if u.find('s:lastmod',ns) is not None else None) for u in ET.fromstring(s).findall('s:url',ns)}
a=dates(old('sitemap.xml'));b=dates((root/'sitemap.xml').read_text());revision=json.loads((root/'docs/public-fit-revision.json').read_text())
advisory=json.loads((root/'docs/advisory-revision.json').read_text())
advisory_routes={'https://katyashalel.com/'+f.removesuffix('index.html') for f in advisory['updatedPages']+advisory['newPages']}
new_routes={'https://katyashalel.com/'+f.removesuffix('index.html') for f in revision['newPages']+advisory['newPages']}
changed_routes={'https://katyashalel.com/'+f.removesuffix('index.html') for f in revision['updatedPages']}
assert set(b)==set(a)|new_routes
assert all(b[u]==(advisory['publicationDate'] if u in advisory_routes else revision['publicationDate']) for u in new_routes)
for url in a:assert b[url]==(human['publicationDate'] if url in ['https://katyashalel.com/','https://katyashalel.com/ru/'] else advisory['publicationDate'] if url in advisory_routes else revision['publicationDate'] if url in changed_routes else m['publicationDate'] if url in ['https://katyashalel.com'+p for p in ['/','/ru/','/audit/','/ru/audit/']] else '2026-10-26' if url in ['https://katyashalel.com/why-ai-knows-but-doesnt-recommend/','https://katyashalel.com/ru/pochemu-ai-znaet-no-ne-rekomenduet/'] else '2026-10-27' if url in ['https://katyashalel.com/essays/ai-can-find-you-will-it-choose-you/', 'https://katyashalel.com/ru/essays/ai-mozhet-vas-nayti-no-vyberet-li-on-vas/'] else a[url])
print(json.dumps({'offerLanguages':2,'approvedBulletsPerLanguage':6,'changedHomepageCTAs':2,'sitemapDates':4,'backend':'approved email delivery; contract tests required','status':'passed'}))
