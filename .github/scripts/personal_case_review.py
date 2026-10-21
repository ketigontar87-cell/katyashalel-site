"""Focused case integrity checks, local only."""
from pathlib import Path
import re,json,hashlib,subprocess
r=Path(__file__).resolve().parents[2]
for prefix,title in [('', 'How AI recommends an expert: my own case'),('ru/','Как AI рекомендует эксперта: мой собственный кейс')]:
 s=(r/prefix/'observations/2026-10-17-consultant-selection/index.html').read_text()
 assert s.count('<h1>')==1 and f'<h1>{title}</h1>' in s
 assert 'Can you recommend me good ai legibility strategist' in s
 assert 'My top recommendation' in s and 'Closest match' in s
 assert '<div data-nosnippet><details>' in s
 assert 'noindex' not in s
 assert f'href="/{prefix}audit/"' in s
 assert '2026-10-21' in s
 assert ('incorrect portrait' if prefix=='' else 'чужой портрет') in s
 assert 'IMG_' not in s and '<img' not in s
 raw=re.search(r'<pre lang="en">(.*?)</pre>',s,re.S)[1]
 old=subprocess.check_output(['git','show','3938e1f:'+prefix+'observations/2026-10-17-consultant-selection/index.html'],cwd=r,text=True)
 assert raw==re.search(r'<pre lang="en">(.*?)</pre>',old,re.S)[1]
for name in ['record.json','answer.txt']:
 path='observations/2026-10-17-consultant-selection/'+name
 assert (r/path).read_bytes()==subprocess.check_output(['git','show','3938e1f:'+path],cwd=r)
v=json.loads((r/'vercel.json').read_text());old=json.loads(subprocess.check_output(['git','show','3938e1f:vercel.json'],cwd=r,text=True))
assert v['redirects']==old['redirects']
assert {h['source'] for h in v['headers']}=={'/observations/2026-10-17-consultant-selection/'+n for n in ['record.json','answer.txt']}
assert all(h['headers']==[{'key':'X-Robots-Tag','value':'noindex'}] for h in v['headers'])
print('Personal case: positive evidence, preserved originals, scoped snippet/header controls PASS')
