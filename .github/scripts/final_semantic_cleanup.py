from pathlib import Path
import json
import re


def rep(path, old, new, required=False):
    p = Path(path)
    s = p.read_text()
    n = s.count(old)
    if required and n == 0:
        raise SystemExit(f"required text missing in {path}: {old[:100]!r}")
    if n:
        p.write_text(s.replace(old, new))
    return n


def replace_section(path, section_id, replacement):
    p = Path(path)
    s = p.read_text()
    pattern = rf'<div class="term" id="{re.escape(section_id)}">.*?</div>'
    s2, n = re.subn(pattern, replacement, s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"section {section_id} not found in {path}")
    p.write_text(s2)


# Homepage canonical Person id.
p = Path("index.html")
s = p.read_text()
if '"@type": "Person",\n  "name": "Ekaterina Shalel"' in s:
    s = s.replace(
        '"@type": "Person",\n  "name": "Ekaterina Shalel"',
        '"@type": "Person",\n  "@id": "https://katyashalel.com/#person",\n  "name": "Ekaterina Shalel"',
        1,
    )
p.write_text(s)

# Brands service: current category framing + epistemic limits.
rep(
    "brands/index.html",
    '"provider": {"@type": "Person", "name": "Ekaterina Shalel", "alternateName": ["Katya Shalel", "Екатерина Шалель"], "url": "https://katyashalel.com/", "jobTitle": "Founder and Legibility Strategist"}',
    '"provider": {"@type": "Person", "@id": "https://katyashalel.com/#person", "name": "Ekaterina Shalel", "alternateName": ["Katya Shalel", "Екатерина Шалель"], "url": "https://katyashalel.com/", "jobTitle": "Founder and AI legibility strategist"}',
)
rep(
    "brands/index.html",
    "Brand legibility is the degree to which AI systems such as ChatGPT, Claude, Perplexity and Gemini can retrieve a brand accurately, describe it in the brand's own positioning language, and surface it for the commercial queries where it belongs. A brand that models cannot read does not appear in AI-mediated recommendations, regardless of its retail distribution. The framework is developed by Ekaterina Shalel, founder and legibility strategist.",
    "Brand legibility measures whether AI systems can retrieve the right brand entity, understand it accurately, find corroboration for important claims and select it in defined commercial queries. Being known or cited does not guarantee being recommended. The framework is maintained by Ekaterina Shalel, founder and AI legibility strategist.",
)
rep(
    "brands/index.html",
    "What can be guaranteed is the process: a fixed baseline, a defined query set, documented interventions, and a re-measurement on the same set, so any movement is visible and attributable within the tested scope.",
    "What can be guaranteed is the process: a fixed baseline, a defined query set, documented interventions and re-measurement under comparable conditions. Movement can be observed within the tested scope, but a before-and-after change is not automatic proof of causality.",
)
rep(
    "brands/index.html",
    '<p>I call the discipline of fixing this <strong>brand legibility</strong>: making a brand retrievable, accurately described, and present in the recommendation queries where it belongs. Not advertising inside models, and not tricks against them. Architecture: entity data, canonical positioning, structured sources that models can read and cite.</p>',
    '<p><strong>Brand legibility</strong> asks four practical questions: can the system retrieve the right brand, understand it accurately, corroborate the claims that matter, and select it for a defined buyer query? The work starts with controlled entity clarity and extends into the external evidence environment. Advertising inside models is a separate intervention, not independent evidence.</p>',
)
rep(
    "brands/index.html",
    '<div class="step"><div class="step-n">4</div><p><b>Re-measurement protocol</b>Every later action is measured against the same frozen baseline, on the same query set, in the same markets and languages. Movement is visible and attributable, or it is not claimed.</p></div>',
    '<div class="step"><div class="step-n">4</div><p><b>Re-measurement protocol</b>Every later action is measured against the same frozen baseline, on the same query set, in the same markets and languages. Movement is reported as an observed change; causal attribution requires stronger evidence than before-and-after alone.</p></div>',
)
rep(
    "brands/index.html",
    '<p>The category background is real operating experience, not consulting theory. I architected SKINBOT, a neutral AI decision layer for beauty retail, with compliance-first architecture and live pilots in two markets, and built its market visibility from zero to ranked. I work daily with product catalogs, formulations and the retrieval behavior of AI systems in commerce.</p>',
    '<p>The category background comes from operating experience. I architected SKINBOT, a neutral AI decision layer for beauty retail, with compliance-first architecture and live pilots in two markets. That work made the distinction between product quality, entity clarity, evidence and model selection impossible to ignore.</p>',
)
rep(
    "brands/index.html",
    "<p>The degree to which AI systems can retrieve a brand accurately, describe it in the brand's own positioning language, and surface it for the commercial queries where it belongs. A brand that models cannot read does not appear in AI-mediated recommendations, regardless of its retail distribution.</p>",
    "<p>The degree to which AI systems can retrieve the right brand, understand it accurately, find corroboration for important claims and select it in a defined commercial query. Recognition, citation and selection are separate measurements.</p>",
)

# Audit provider and social-proof overclaim.
rep(
    "audit/index.html",
    '"provider": {"@type": "Person", "name": "Ekaterina Shalel", "url": "https://katyashalel.com"}',
    '"provider": {"@type": "Person", "@id": "https://katyashalel.com/#person", "name": "Ekaterina Shalel", "url": "https://katyashalel.com", "jobTitle": "Founder and AI legibility strategist"}',
)
rep(
    "audit/index.html",
    "Many people run the Audit first to see the gap, then execute with the Sprint.",
    "The Audit can establish the gap first; the Sprint is the published protocol for executing the structural work yourself.",
)

# Canonical definition EN v1.2.
p = Path("ai-legibility/index.html")
s = p.read_text()
s = s.replace("Canonical Definition v1.1", "Canonical Definition v1.2")
s = s.replace("Version 1.1", "Version 1.2")
s = s.replace('"version": "1.1"', '"version": "1.2"')
s = s.replace('"dateModified": "2026-08-05"', '"dateModified": "2026-09-01"')
s = s.replace(
    "what the discipline covers, how it differs from SEO, GEO and entity SEO, its four layers, its method and how it is measured. Version 1.1, August 2026.",
    "what the discipline covers, how it differs from SEO and GEO, its diagnostic chain, its method and how selection is measured. Version 1.2, September 2026.",
)
s = s.replace(
    "its scope, its boundaries against SEO, GEO and entity SEO, its four layers, its method and how it is measured.",
    "its scope, its boundaries against SEO and GEO, its diagnostic chain, its method and how selection is measured.",
)
s = s.replace(
    "Version 1.1 · Published August 5, 2026, updated August 17, 2026 · Maintained by Ekaterina Shalel, founder and legibility strategist",
    "Version 1.2 · Published August 5, 2026, updated September 1, 2026 · Maintained by Ekaterina Shalel, founder and AI legibility strategist",
)
p.write_text(s)
replace_section(
    "ai-legibility/index.html",
    "definition",
    '''<div class="term" id="definition">
    <h2>1. Definition</h2>
    <p><strong>AI legibility is the practice of making a person, product or company accurately retrievable, understandable and corroborated enough for AI systems to describe and evaluate it without relying on guesswork.</strong></p>
    <p>Selection and recommendation are measured outcomes, not guaranteed properties. A system can know an entity, cite it, and still choose an alternative when the query introduces different constraints or stronger competing evidence.</p>
    <p>The discipline separates what is under the entity's control from what is observed in the model. Controlled facts, structure and consistency improve structural legibility. Retrieval, independent corroboration, freshness and competitive evidence form the dynamic environment in which selection happens.</p>
  </div>''',
)
replace_section(
    "ai-legibility/index.html",
    "layers",
    '''<div class="term" id="layers">
    <h2>4. The diagnostic chain</h2>
    <p>I measure AI legibility as a sequence of observable questions rather than as a claim about a model's hidden internal stages.</p>
    <p><strong>Accessible.</strong> Can the relevant source be reached and parsed?</p>
    <p><strong>Retrieved.</strong> Does the system actually bring the entity or supporting source into the answer context?</p>
    <p><strong>Understood.</strong> Can it describe the entity and important claims without obvious guessing or identity drift?</p>
    <p><strong>Corroborated.</strong> Are important claims supported by sources beyond the entity's own controlled surfaces?</p>
    <p><strong>Selected.</strong> Is the entity actually chosen for a specified prompt, market, language and set of constraints?</p>
    <p><strong>Personalized.</strong> Does the result change when legitimate user context changes the decision criteria?</p>
    <p>Compressed: accessible → retrieved → understood → corroborated → selected → personalized. Trust is not inserted as a hidden stage unless a study defines an observable proxy in advance.</p>
  </div>''',
)
replace_section(
    "ai-legibility/index.html",
    "method",
    '''<div class="term" id="method">
    <h2>5. Method</h2>
    <p>The operating method is simple in form: <strong>measure → diagnose → intervene → verify.</strong></p>
    <p>Measure a frozen set of decision-relevant prompts before changing anything. Record the surface, model, market, language, retrieval or search state where observable, raw output and sources. Diagnose whether the failure is entity clarity, retrieval, contradiction, missing corroboration, competitive evidence or query fit. Document the intervention. Then repeat comparable conditions.</p>
    <p>A before-and-after difference is an observed change, not automatic proof that one intervention caused it. Where causal attribution matters, use stronger controls, precommitment and alternative explanations. The published <a href="/guides/sprint/">Legibility Sprint</a> covers the structural work; the measurement layer tests whether anything actually moved.</p>
  </div>''',
)
replace_section(
    "ai-legibility/index.html",
    "measurement",
    '''<div class="term" id="measurement">
    <h2>6. Measurement</h2>
    <p>AI outputs vary across surfaces, model versions, retrieval modes and repeated runs. A useful measurement therefore states its scope and keeps the comparison conditions explicit.</p>
    <p>Core observations include retrieval rate, answer inclusion, recommendation or selection rate, citation share by source type, corroboration coverage, model divergence, query sensitivity, freshness and source churn. Citation is not treated as a substitute for selection.</p>
    <p>For intervention studies, I use frozen prompts and controls where practical. <a href="/research/synthetic-term-control/">Synthetic Term Control</a> is one negative-control design for separating apparent movement from what the same procedure returns when there is no prior signal. Even then, model rationale text is not direct evidence of an internal trust state.</p>
  </div>''',
)

# Canonical definition RU v1.2.
p = Path("ru/ai-legibility/index.html")
s = p.read_text()
s = s.replace("v1.1", "v1.2")
s = s.replace("Версия 1.1", "Версия 1.2")
s = s.replace('"version": "1.1"', '"version": "1.2"')
s = s.replace('"dateModified": "2026-08-05"', '"dateModified": "2026-09-01"')
s = s.replace("основатель и legibility-стратег", "основатель и AI Legibility Strategist")
p.write_text(s)
replace_section(
    "ru/ai-legibility/index.html",
    "definition",
    '''<div class="term" id="definition">
    <h2>1. Определение</h2>
    <p><strong>AI Legibility это практика, которая делает человека, продукт или компанию достаточно точно находимыми, понятными и подтверждаемыми, чтобы AI-системы могли описывать и оценивать их без догадок.</strong></p>
    <p>Выбор и рекомендация это измеряемые результаты, а не гарантированное свойство. Система может знать сущность, цитировать её и всё равно выбрать альтернативу, если в запросе появляются другие ограничения или у конкурента сильнее доказательная среда.</p>
    <p>Я разделяю то, что контролирует сама компания, и то, что мы наблюдаем в модели. Ясность фактов, структура и согласованность формируют structural legibility. Retrieval, независимые подтверждения, свежесть источников и конкурентные доказательства формируют динамическую среду, в которой происходит выбор.</p>
  </div>''',
)
replace_section(
    "ru/ai-legibility/index.html",
    "layers",
    '''<div class="term" id="layers">
    <h2>4. Диагностическая цепочка</h2>
    <p>Я измеряю AI Legibility как последовательность наблюдаемых вопросов, а не как утверждение о скрытых внутренних этапах модели.</p>
    <p><strong>Accessible.</strong> Доступен ли нужный источник и может ли система его прочитать?</p>
    <p><strong>Retrieved.</strong> Попадает ли сущность или подтверждающий источник в контекст ответа?</p>
    <p><strong>Understood.</strong> Может ли система описать сущность и важные утверждения без явных догадок и путаницы?</p>
    <p><strong>Corroborated.</strong> Подтверждаются ли важные утверждения источниками за пределами контролируемых самой компанией поверхностей?</p>
    <p><strong>Selected.</strong> Выбирает ли система сущность в конкретном запросе, рынке, языке и наборе ограничений?</p>
    <p><strong>Personalized.</strong> Меняется ли результат, когда реальный пользовательский контекст меняет критерии выбора?</p>
    <p>Коротко: accessible → retrieved → understood → corroborated → selected → personalized. Trust не добавляется как скрытый этап, если заранее не определён наблюдаемый proxy.</p>
  </div>''',
)
replace_section(
    "ru/ai-legibility/index.html",
    "method",
    '''<div class="term" id="method">
    <h2>5. Метод</h2>
    <p>Рабочая схема проста: <strong>измерить → диагностировать → вмешаться → проверить.</strong></p>
    <p>Сначала фиксируется набор decision-relevant запросов и baseline. Для каждого запуска записываются поверхность, модель, рынок, язык, доступный retrieval/search state, сырой ответ и источники. Затем определяется тип провала: ясность сущности, retrieval, противоречия, нехватка независимых подтверждений, конкурентные доказательства или соответствие запросу. Вмешательство документируется, после чего те же условия измеряются повторно.</p>
    <p>Разница до и после это наблюдаемое изменение, но не автоматическое доказательство причинности. Когда причинность важна, нужны более сильные controls, precommitment и разбор альтернативных объяснений. Опубликованный <a href="/guides/sprint/">Legibility Sprint</a> закрывает structural-слой; измерение проверяет, изменилось ли поведение моделей.</p>
  </div>''',
)
replace_section(
    "ru/ai-legibility/index.html",
    "measurement",
    '''<div class="term" id="measurement">
    <h2>6. Измерение</h2>
    <p>Ответы AI меняются между поверхностями, версиями моделей, режимами retrieval и повторными запусками. Поэтому любое полезное измерение должно явно задавать scope и сохранять сопоставимые условия.</p>
    <p>Основные наблюдения: retrieval rate, answer inclusion, recommendation или selection rate, доля цитирований по типам источников, corroboration coverage, расхождение между моделями, чувствительность к запросу, свежесть и source churn. Цитирование не считается заменой выбора.</p>
    <p>В intervention studies я использую frozen prompts и controls там, где это практически возможно. <a href="/research/synthetic-term-control/">Synthetic Term Control</a> это один из negative-control дизайнов. И даже при наличии контроля объяснение модели не считается прямым доказательством её внутреннего состояния trust.</p>
  </div>''',
)

# QA.
for path in [
    "index.html",
    "brands/index.html",
    "audit/index.html",
    "ai-legibility/index.html",
    "ru/ai-legibility/index.html",
]:
    s = Path(path).read_text()
    for block in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', s, re.S | re.I):
        json.loads(block)
    if "Movement is visible and attributable" in s:
        raise SystemExit(f"stale attributable claim in {path}")
    if "built its market visibility from zero to ranked" in s:
        raise SystemExit(f"stale ranked claim in {path}")

if '"@id": "https://katyashalel.com/#person"' not in Path("index.html").read_text():
    raise SystemExit("homepage Person @id missing")

print("final semantic cleanup script passed")