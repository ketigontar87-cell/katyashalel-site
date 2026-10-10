"""October 10 editorial acceptance; local only, no submissions or provider calls."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import subprocess,json,re,html,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[2]
manifest=json.loads((root/'.github/scripts/copy_review_manifest.json').read_text());base=manifest['base']
def old(f):return subprocess.check_output(['git','show',base+':'+f],cwd=root,text=True)
def schemas(s):return [json.loads(m) for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)]
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>','',s))).strip()
class Structure(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.added_links=[];self.anchors=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='a':
   added=d.get('class')=='course-availability';self.anchors.append(added)
   if added:
    assert d.get('href')=='mailto:shalelekaterina@gmail.com';assert d.get('style')=='color:inherit';self.added_links.append(d);return
  if t=='meta' and (d.get('name') or d.get('property')) in ['description','og:description','twitter:description']:d['content']='COPY'
  self.tags.append(('open',t,sorted(d.items())))
 def handle_endtag(self,t):
  if t=='a' and self.anchors.pop():return
  self.tags.append(('close',t))
def dates(x):
 result=[]
 def walk(v,path):
  if isinstance(v,dict):
   for k,item in v.items():
    if k.startswith('date') or k=='version':result.append((path+(k,),item))
    elif isinstance(item,(dict,list)):walk(item,path+(k,))
  elif isinstance(v,list):
   for i,item in enumerate(v):walk(item,path+(i,))
 walk(x,())
 return result
all_html=sorted(root.glob('**/*.html'));all_html=[p for p in all_html if '.git' not in p.parts and 'artifacts' not in p.parts]
count=0
for p in all_html:
 s=p.read_text();ds=schemas(s);count+=len(ds)
 assert not re.search(r'measure\s*(?:→|->|,)\s*diagnose\s*(?:→|->|,)\s*intervene',s,re.I),p
 assert not re.search(r'диагностир(?:овать|уй(?:те)?|овка|ование)\s*(?:→|->|,)\s*вмеш',s,re.I),p
 assert not re.search(r'вмешаться\s*(?:→|->|,)\s*(?:проверить|переизмерить)',s,re.I),p
 assert 'the waitlist closes August 6' not in s and 'лист закрывается 6 августа' not in s,p
# Authorized 2026-10-10: reciprocal hreflang on EN Sprint (3 specific link tags). Nothing else structural is allowed.
ALLOWED_SPRINT_HREFLANG=[('open','link',[('href','https://katyashalel.com/guides/sprint/'),('hreflang','en'),('rel','alternate')]),('open','link',[('href','https://katyashalel.com/ru/guides/sprint/'),('hreflang','ru'),('rel','alternate')]),('open','link',[('href','https://katyashalel.com/guides/sprint/'),('hreflang','x-default'),('rel','alternate')])]
for f in manifest['pages']:
 before=old(f);after=(root/f).read_text();a=Structure();a.feed(before);b=Structure();b.feed(after)
 b_tags=list(b.tags)
 if f=='guides/sprint/index.html':
  for t in ALLOWED_SPRINT_HREFLANG:
   assert t in b_tags,'authorized hreflang tag missing on EN Sprint'
   b_tags.remove(t)
 assert a.tags==b_tags,f+' DOM structure / non-copy attributes changed'
 for pattern in [r'<style[^>]*>.*?</style>',r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>']:
  assert re.findall(pattern,before,re.S)==re.findall(pattern,after,re.S),f+' styles or behavior changed'
 _db, _da = dates(schemas(before)), dates(schemas(after))
 # Authorized 2026-10-10: RU Sprint datePublished gap-fill (2026-07-16, matches EN).
 if f=='ru/guides/sprint/index.html':
  _has_dp = lambda lst: any(k[-1]=='datePublished' and v=='2026-07-16' for k,v in lst)
  assert not _has_dp(_db) and _has_dp(_da), 'RU Sprint datePublished gap-fill missing'
  _da = [x for x in _da if not (x[0][-1]=='datePublished' and x[1]=='2026-07-16')]
 assert _db==_da,f+' published dates/version must wait for release'
 # The current revision does not replace historic publication or full-verification dates.
for f in ['llms.txt','llms-core.txt']:
 assert manifest['method'] in (root/f).read_text()
 assert re.findall(r'Last verified:.*',(root/f).read_text())==re.findall(r'Last verified:.*',old(f))
for f in ['api/agent.js','about/index.html','ai-legibility/index.html','ru/about/index.html','ru/understood-by-ai/index.html']:
 assert manifest['method'] in (root/f).read_text(),f
assert 'For intervention studies' in (root/'ai-legibility/index.html').read_text()
assert 'Sponsored distribution is an intervention' in (root/'llms-core.txt').read_text()
# HowTo steps agree with visible instructions; FAQs agree with the same existing questions.
for lang in ['en','ru']:
 prefix='ru/' if lang=='ru' else ''
 s=(root/(prefix+'guides/visibility/index.html')).read_text();how=schemas(s)[0]
 paragraphs=re.findall(r'<section><div class="wrap"><p>(.*?)</p>',s,re.S)[1:5]
 assert [step['text'] for step in how['step']]==[clean(p) for p in paragraphs]
 for banned in ['Synonyms kill','Синонимы убивают','path is reproducible','это воспроизводимо','never substitute synonyms']:
  assert banned not in s,banned
 assert 'course-availability' in s
 s=(root/(prefix+'guides/sprint/index.html')).read_text();how,faq=schemas(s)[0]['@graph'];visible={clean(q):clean(a) for q,a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>',s,re.S)}
 for q in faq['mainEntity']:assert q['acceptedAnswer']['text']==visible[q['name']],q['name']
 assert 'totalTime' not in how and 'estimatedCost' not in how
 if lang=='en':
  blocks=re.findall(r'<div class="step" id="day-(?:[1-6]|21)">(.*?)\n  </div>',s,re.S)
  for step,block in zip(how['step'],blocks):
   parts=[clean(x) for x in re.findall('<li>(.*?)</li>',block,re.S)]
   caveat=re.search(r'<p class="caveat"><b>Caveat.</b> (.*?)</p>',block,re.S)
   if caveat:parts.append(clean(caveat[1]))
   assert step['text']==' '.join(parts)
  assert 'none is universally required or guarantees AI visibility' in s
  assert 'Eight to fifteen questions is enough' not in s
  assert 'One corroborating source outweighs' not in s
 else:
  assert [x['name'] for x in how['step']]==['Measure','Diagnose','Fix','Measure again']
  visible_steps=re.findall(r'<div class="step">.*?<h2>.*?</h2><p>(.*?)</p>',s,re.S)
  assert [x['text'] for x in how['step']]==[clean(x) for x in visible_steps]
s=(root/'ai-legibility/index.html').read_text()
answer='Use dated, repeated observations with a documented prompt set, product surface and conditions.'
assert s.count(answer)==2
assert 'An answer alone does not establish which sources were used' in s
assert 'Without a control, a visibility audit cannot be falsified' not in s
s=(root/'ru/ai-legibility/index.html').read_text()
assert manifest['method_ru'] in s
for banned in ['одно описание без списка ссылок','одно описание, без списка','описание собирается заново при каждом запросе']:
 assert banned not in s,banned
assert 'могут содержать ссылки' in s
assert 'Без подходящего сравнения результаты до и после остаются описательными.' in s
assert 'В исследованиях вмешательств' in s
visible={clean(q):clean(a) for q,a in re.findall(r'<h3>(.*?)</h3>\s*<p>(.*?)</p>',s,re.S)}
faq=next(x for x in schemas(s) if x.get('@type')=='FAQPage')
for q in faq['mainEntity']:assert q['acceptedAnswer']['text']==visible[q['name']]
s=(root/'ru/guides/sprint/index.html').read_text()
assert s.count(manifest['method_ru'])==3
assert 'Сначала измерить, потом диагностировать, менять и проверять.' not in s
# Page-specific published history, not the build date. Candidate release dates remain a separate review step.
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
xml=ET.fromstring((root/'sitemap.xml').read_text());entries={u.find('s:loc',ns).text:u.find('s:lastmod',ns).text for u in xml.findall('s:url',ns) if u.find('s:lastmod',ns) is not None}
evidence=json.loads((root/'docs/sitemap-date-evidence.json').read_text())
assert len(entries)==len(evidence)==71
for e in evidence:
 assert entries['https://katyashalel.com'+e['route']]==e['lastmod']
 assert e['lastmod']==subprocess.check_output(['git','show','-s','--format=%cs',e['publishedCommit']],cwd=root,text=True).strip()
 subprocess.run(['git','merge-base','--is-ancestor',e['publishedCommit'],base],cwd=root,check=True)
assert entries['https://katyashalel.com/']=='2026-10-08'
assert len(set(entries.values()))>1
assert json.loads((root/'.well-known/agent-card.json').read_text())['version']=='2026-10-10.1'
print(json.dumps({'html_documents':len(all_html),'json_ld_blocks':count,'copy_pages':len(manifest['pages']),'sitemap_dates_with_published_evidence':len(evidence),'styles_structure_and_behavior':'unchanged','status':'passed'}))
