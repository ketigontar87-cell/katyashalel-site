"""Read-only post-release verification of the four public offer/CTA pages."""
import argparse,html,json,re,time,urllib.request
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--commit',required=True);a=p.parse_args();assert re.fullmatch('[0-9a-f]{40}',a.commit)
m=json.loads(Path('.github/scripts/audit_offer_manifest.json').read_text())
def fetch(path):
 req=urllib.request.Request('https://katyashalel.com'+path+'?release_check='+a.commit,headers={'User-Agent':'Katya-site-release-check/1.0','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=30) as r:
  assert r.status==200
  return r.read().decode()
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>','',s))).strip()
for attempt in range(6):
 try:
  results=[]
  for lang,path in [('en','/'),('ru','/ru/')]:
   s=fetch(path);label='Work with me' if lang=='en' else 'Работать со мной'
   assert '<a class="btn primary" href="/audit/#request">'+label+'</a>' in s,path+' primary CTA'
   results.append({'path':path,'primaryCTA':'/audit/#request'})
  for lang,path in [('en','/audit/'),('ru','/ru/audit/')]:
   s=fetch(path);visible=clean(re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S));c=m['copy'][lang]
   for key in ['title','price','headline','intro','scope','process','limits','cta']:
    assert c[key] in visible,(path,key)
   for item in c['items']:assert item in visible,(path,item)
   schema=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)]
   offer=next(x for x in schema if x.get('@type')=='Service')['offers']
   assert offer['price']=='350' and offer['priceCurrency']=='USD'
   if lang=='en':assert 'id="request"' in s and 'id="f-email"' in s and "fetch('/api/lead'" in s
   results.append({'path':path,'offer':'$350 one-time','approvedCopy':'passed','inquiryOnly':True})
  Path('artifacts/live-audit').mkdir(parents=True,exist_ok=True)
  Path('artifacts/live-audit/result.json').write_text(json.dumps({'sourceCommit':a.commit,'checks':results,'noSubmissions':True},indent=2)+'\n')
  print(json.dumps({'sourceCommit':a.commit,'checks':results,'status':'passed','noSubmissions':True}));break
 except Exception:
  if attempt==5:raise
  time.sleep(20)
