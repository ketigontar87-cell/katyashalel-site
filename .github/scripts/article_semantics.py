"""Owner-approved article-only revision: explicit boundaries, no unrelated copy drift."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
BASE='0e82a7799821f96f210dd24e891b00fb4daaf318'
PAGES=['why-ai-knows-but-doesnt-recommend/index.html','ru/pochemu-ai-znaet-no-ne-rekomenduet/index.html']
class Boundaries(HTMLParser):
 def __init__(self):super().__init__();self.article=False;self.count=0;self.headings=0;self.faq=False;self.cta=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='article':assert not self.article;self.article=True;self.count+=1;assert a.get('id')=='article'
  if tag=='h1':assert self.article;self.headings+=1
  if a.get('class')=='faq':assert self.article;self.faq=True
  if a.get('class')=='cta':assert not self.article;self.cta=True
  if a.get('class')=='top':assert not self.article
 def handle_endtag(self,tag):
  if tag=='article':assert self.article;self.article=False
for f in PAGES:
 source=(ROOT/f).read_text();old=subprocess.check_output(['git','show',BASE+':'+f],cwd=ROOT,text=True)
 expected=old.replace('<main>','<main>\n<article id="article">',1).replace('  <section class="cta">','</article>\n\n  <section class="cta">',1).replace('<b>Intervene</b>','<b>Fix</b>').replace('<b>Verify</b>','<b>Measure again</b>').replace('"dateModified": "2026-09-01"','"dateModified": "2026-10-26"')
 assert source==expected,f+' contains unauthorized content/style/metadata changes'
 parser=Boundaries();parser.feed(source);assert (parser.count,parser.headings,parser.faq,parser.cta,parser.article)==(1,1,True,True,False)
 schemas=[json.loads(s) for s in re.findall(r'<script type="application/ld\+json">(.*?)</script>',source,re.S)]
 article=next(s for s in schemas if s.get('@type')=='TechArticle')
 assert article['datePublished']=='2026-09-01' and article['dateModified']=='2026-10-26'
 assert article['@id'].endswith('/#article')
 assert re.findall(r'<b>(.*?)</b>',re.search(r'<div class="method">(.*?)\n  </div>',source,re.S)[1])==['Measure','Diagnose','Fix','Measure again']
 for language,url in re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="https://katyashalel.com([^"]+)"',source):
  counterpart=ROOT/url.strip('/')/'index.html';assert counterpart.exists()
  assert 'href="https://katyashalel.com/'+f.removesuffix('index.html')+'"' in counterpart.read_text()
print(json.dumps({'articleSemantics':'passed','pages':2,'articleIncludes':'headline, body, FAQ','articleExcludes':'navigation, CTA','publicationDate':'preserved','stylesAndUnrelatedCopy':'byte-identical'}))
