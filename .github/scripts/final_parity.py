from pathlib import Path
import re
import json


def rep(path, old, new, required=False):
    p=Path(path); s=p.read_text(); n=s.count(old)
    if required and not n: raise SystemExit(f'missing in {path}: {old[:90]}')
    if n: p.write_text(s.replace(old,new))


def add_hreflang(path,en,ru):
    p=Path(path); s=p.read_text()
    if f'hreflang="ru" href="{ru}"' in s: return
    canonical=f'<link rel="canonical" href="{en}">'
    insert=canonical+f'\n<link rel="alternate" hreflang="en" href="{en}">\n<link rel="alternate" hreflang="ru" href="{ru}">\n<link rel="alternate" hreflang="x-default" href="{en}">'
    if canonical not in s: raise SystemExit(f'canonical missing {path}')
    # remove old en/x-default pair if present to avoid duplicates
    s=s.replace(canonical,insert)
    # de-dupe exact later alternates if they already existed
    lines=s.splitlines(); out=[]; seen=set()
    for line in lines:
        if '<link rel="alternate" hreflang=' in line:
            key=line.strip()
            if key in seen: continue
            seen.add(key)
        out.append(line)
    p.write_text('\n'.join(out)+'\n')


add_hreflang('brands/index.html','https://katyashalel.com/brands/','https://katyashalel.com/ru/brands/')
add_hreflang('audit/index.html','https://katyashalel.com/audit/','https://katyashalel.com/ru/audit/')
add_hreflang('ongoing/index.html','https://katyashalel.com/ongoing/','https://katyashalel.com/ru/ongoing/')
add_hreflang('understood-by-ai/index.html','https://katyashalel.com/understood-by-ai/','https://katyashalel.com/ru/understood-by-ai/')

# Ongoing machine and visible framing.
rep('ongoing/index.html','"provider": {\n        "@type": "Person",','"provider": {\n        "@type": "Person",\n        "@id": "https://katyashalel.com/#person",')
rep('ongoing/index.html','"description": "Whether a model can identify an entity correctly, place it in relation to the entities around it, and attach a claim to it without taking on risk."','"description": "Whether AI systems can retrieve the right entity, understand it accurately, corroborate important claims and select it under defined decision conditions."')
rep('ongoing/index.html','For positions that have to hold, not just move once.','For evidence environments and selection patterns that need to be measured over time.')

# Understood-by-AI: recommendation is observed selection, not hidden confidence/risk claim.
rep('understood-by-ai/index.html','Recommendation is a different event from being mentioned. A mention costs the system nothing. A recommendation carries the cost of being wrong, so systems pull toward names confirmed from several directions. Being known is not enough. You have to be the option a system is willing to be wrong about.','Recommendation is a different observed event from being mentioned or cited. Being known is not enough: selection depends on the query constraints, the evidence the system retrieves and the alternatives available in that run. The useful measurement is whether you are selected consistently under a defined test set, not a story about the model’s internal confidence.')
rep('understood-by-ai/index.html','Work on the last step returns almost nothing while any earlier step is broken, which is why so much AI visibility work produces no movement.','The earlier stages should be diagnosed separately from selection, because a failure in entity resolution, retrieval or corroboration can coexist with a visibility problem. The test should show which stage is failing rather than assume one cause.')
rep('understood-by-ai/index.html','Retrieval-layer changes tend to show up within weeks, because those systems re-read the web frequently. What a model holds internally moves on the schedule of its training, which is not something anyone can promise you. Any specialist who guarantees a specific answer by a specific date is describing something they do not control.','Timing varies by surface, retrieval mode, source freshness and model updates. No specialist controls when a model will reflect a specific intervention, so the defensible approach is to re-measure on a stated schedule and report what changed without promising a date-specific answer.')

# RU homepage routes now that counterparts exist.
rep('ru/index.html','href="/understood-by-ai/">Посмотреть, как AI видит вас','href="/ru/understood-by-ai/">Посмотреть, как AI видит вас')
rep('ru/index.html','<li><a href="/ongoing/">Работа со мной (EN)</a></li>','<li><a href="/ru/ongoing/">Работа со мной</a></li>')
rep('ru/index.html','<div class="sprint-actions"><a class="cta ghost" href="/ongoing/">Как устроена работа (EN)</a><a class="cta ghost" href="/brands/">Для брендов (EN)</a></div>','<div class="sprint-actions"><a class="cta ghost" href="/ru/ongoing/">Как устроена работа</a><a class="cta ghost" href="/ru/brands/">Для брендов</a></div>')

# Sitemap: replace EN service blocks with bilingual alternates and append RU pairs before closing urlset.
p=Path('sitemap.xml'); s=p.read_text()
for slug in ['brands','audit','ongoing']:
    pat=rf'  <url>\n    <loc>https://katyashalel.com/{slug}/</loc>\n    <lastmod>[^<]+</lastmod>\n  </url>'
    repl=f'''  <url>\n    <loc>https://katyashalel.com/{slug}/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/{slug}/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/{slug}/"/>\n  </url>'''
    s,n=re.subn(pat,repl,s,count=1)
    if n!=1: raise SystemExit(f'sitemap EN block not found {slug}')
# understood-by-ai may occur later; normalize it if present.
pat=r'  <url>\n    <loc>https://katyashalel.com/understood-by-ai/</loc>\n    <lastmod>[^<]+</lastmod>(?:\n    <changefreq>[^<]+</changefreq>)?(?:\n    <priority>[^<]+</priority>)?\n  </url>'
repl='''  <url>\n    <loc>https://katyashalel.com/understood-by-ai/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/understood-by-ai/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/understood-by-ai/"/>\n  </url>'''
s,n=re.subn(pat,repl,s,count=1)
if n!=1: raise SystemExit('sitemap EN block not found understood-by-ai')
ru_entries='''\n  <url>\n    <loc>https://katyashalel.com/ru/brands/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/brands/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/brands/"/>\n  </url>\n  <url>\n    <loc>https://katyashalel.com/ru/audit/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/audit/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/audit/"/>\n  </url>\n  <url>\n    <loc>https://katyashalel.com/ru/ongoing/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/ongoing/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/ongoing/"/>\n  </url>\n  <url>\n    <loc>https://katyashalel.com/ru/understood-by-ai/</loc>\n    <lastmod>2026-09-01</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="https://katyashalel.com/understood-by-ai/"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="https://katyashalel.com/ru/understood-by-ai/"/>\n  </url>\n'''
for slug in ['brands','audit','ongoing','understood-by-ai']:
    if f'<loc>https://katyashalel.com/ru/{slug}/</loc>' in s: raise SystemExit(f'duplicate RU sitemap {slug}')
s=s.replace('</urlset>',ru_entries+'</urlset>')
p.write_text(s)

# Validate new page JSON-LD and counterpart links.
for slug in ['brands','audit','ongoing','understood-by-ai']:
    en=Path(f'{slug}/index.html').read_text(); ru=Path(f'ru/{slug}/index.html').read_text()
    if f'hreflang="ru" href="https://katyashalel.com/ru/{slug}/"' not in en: raise SystemExit(f'EN hreflang missing {slug}')
    if f'hreflang="en" href="https://katyashalel.com/{slug}/"' not in ru: raise SystemExit(f'RU hreflang missing {slug}')
    for content in [en,ru]:
        for block in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',content,re.S|re.I): json.loads(block)
print('final EN/RU commercial parity passed')