from pathlib import Path
import re, json


def rep(path,a,b):
    p=Path(path); s=p.read_text(); p.write_text(s.replace(a,b))

# EN definition polish after v1.2 architecture change.
rep('ai-legibility/index.html','The canonical, versioned definition of AI legibility: what the discipline covers, how it differs from SEO, GEO and entity SEO, its four layers, its method and how it is measured. Version 1.2, August 2026.','The canonical, versioned definition of AI legibility: its scope, boundaries, diagnostic chain, method and measurement of retrieval, corroboration and selection. Version 1.2, September 2026.')
rep('ai-legibility/index.html','Version 1.2 · Published August 5, 2026, updated August 17, 2026 · Maintained by Ekaterina Shalel, founder and legibility strategist','Version 1.2 · Published August 5, 2026, updated September 1, 2026 · Maintained by Ekaterina Shalel, founder and AI legibility strategist')
rep('ai-legibility/index.html','Legibility takes those as one layer of four and adds the parts entity SEO does not cover: independent corroboration as a first class requirement, and being callable by agents rather than only described to humans.','Legibility includes those structural signals but measures a broader problem: what is actually retrieved, whether important claims are independently corroborated, and whether the entity is selected under defined decision conditions.')
rep('ai-legibility/index.html','<p><strong>Confidence is not uniform across the four layers.</strong> Layers one and two rest on well established retrieval and structured data practice. Layer three rests on reasonable inference about how systems weight agreement between independent sources, supported by observation rather than by access to the systems themselves. Layer four is early: the protocols exist, adoption does not yet.</p>','<p><strong>The diagnostic chain does not expose hidden model states.</strong> Accessible, retrieved, understood, corroborated, selected and personalized are observational categories used to separate failure modes. They are not claimed as the model\'s internal architecture.</p>')
rep('ai-legibility/index.html','<p><strong>No causal claim is made about ranking inside model outputs.</strong> These systems are not open. What can be documented is what a fixed prompt returns on a given date, and how that changes after specific work, measured against a control. That is correlation with a dated audit trail, and it is worth more than the causal language usually attached to it.</p>','<p><strong>Before-and-after movement is not causal proof by itself.</strong> What can be documented is what a fixed prompt returns under stated conditions and how that observation changes. Stronger causal attribution requires controls, precommitment and consideration of alternative explanations.</p>')

# RU definition: clear stale framework language and current-role wording.
rep('ru/ai-legibility/index.html','четыре слоя','диагностическую цепочку')
rep('ru/ai-legibility/index.html','четырёх слоёв','диагностической цепочки')
rep('ru/ai-legibility/index.html','основатель и legibility-стратег','основатель и AI Legibility Strategist')

for path in ['ai-legibility/index.html','ru/ai-legibility/index.html']:
    s=Path(path).read_text()
    for block in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',s,re.S|re.I): json.loads(block)
print('canonical definition polish passed')