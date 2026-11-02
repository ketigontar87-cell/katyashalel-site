"""Narrow canonical-photo contract; no network or image transformations."""
from pathlib import Path
import json,re,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[2]
BASE='3470c686e55ed80c5d7f8a32dc703ea8020100c0'
URL='https://katyashalel.com/images/ekaterina-shalel-portrait.webp'
IMAGE={'@type':'ImageObject','@id':'https://katyashalel.com/#portrait','url':URL,'contentUrl':URL,'caption':'Ekaterina Shalel, founder of Legibi and legibility strategist','width':1100,'height':1650}
def original_home_photo(source):
    exact=json.dumps(IMAGE,ensure_ascii=False)
    assert source.count('"image": '+exact)==1,'Expected exactly one canonical Person image'
    return source.replace('"image": '+exact,'"image": "https://katyashalel.com/images/hero-portrait.jpg"',1)
# Q138801513 does not resolve. The v1.3 sentence stays verbatim; attribution is the next line.
DEAD_WIKIDATA='https://www.wikidata.org/wiki/Q138801513'
CANON_EN='AI legibility is the discipline of measuring and improving whether AI systems can retrieve, understand, corroborate, compare and select a company, product, founder or specialist under real decision conditions.'
CANON_RU='AI legibility это дисциплина, которая измеряет и улучшает, насколько AI-системы способны извлекать, понимать, подтверждать, сравнивать и выбирать компанию, продукт, основателя или специалиста в реальных условиях принятия решения.'
SHORT_EN='AI legibility: measuring and improving whether AI systems can retrieve, understand, corroborate, compare and select a company, product, founder or specialist under real decision conditions.'
SHORT_RU='AI legibility: измеряет и улучшает, насколько AI-системы способны извлекать, понимать, подтверждать, сравнивать и выбирать компанию, продукт, основателя или специалиста в реальных условиях принятия решения.'
CREDIT_EN='<p class="definition-credit">Defined by Ekaterina Shalel, founder of <a href="https://legibi.ai/">Legibi</a>.</p>'
CREDIT_RU='<p class="definition-credit">Определение Екатерины Шалель, основательницы <a href="https://legibi.ai/">Legibi</a>.</p>'
HOME_EN='<p>The <a href="/ai-legibility/">canonical definition</a> of AI legibility is maintained on its own page.</p>'
HOME_RU='<p><a href="/ru/ai-legibility/">Каноническое определение</a> AI legibility ведётся на своей странице.</p>'
def approve_attribution(text):
    text=text.replace('\n      "'+DEAD_WIKIDATA+'",','')
    text=text.replace(', "'+DEAD_WIKIDATA+'"','')
    text=text.replace('"'+DEAD_WIKIDATA+'",','')
    text=text.replace(SHORT_EN,CANON_EN).replace(SHORT_RU,CANON_RU)
    def credit_paragraphs(fragment, sentence, credit):
        def repl(m):
            block=m.group(0)
            if 'definition-credit' in block or sentence not in block:return block
            return block+credit
        return re.sub(r'<p\b[^>]*>.*?</p>',repl,fragment,flags=re.S)
    parts=re.split(r'(<script\b[^>]*>.*?</script>)',text,flags=re.S)
    built=[]
    for i,part in enumerate(parts):
        if i%2==0:
            if CANON_RU in part:part=credit_paragraphs(part,CANON_RU,CREDIT_RU)
            elif CANON_EN in part:part=credit_paragraphs(part,CANON_EN,CREDIT_EN)
        built.append(part)
    text=''.join(built)
    en_anchor='Here I share the method, research and documented observations behind that work.</p>'
    ru_anchor='Здесь делюсь методикой, исследованиями и зафиксированными наблюдениями, на которых строится эта работа.</p>'
    if en_anchor in text and HOME_EN not in text:text=text.replace(en_anchor,en_anchor+HOME_EN,1)
    if ru_anchor in text and HOME_RU not in text:text=text.replace(ru_anchor,ru_anchor+HOME_RU,1)
    return text
def validate():
    assert (ROOT/'images/about-coat.webp').read_bytes()==(ROOT/'images/ekaterina-shalel-portrait.webp').read_bytes(),'Portrait bytes must be unchanged'
    for path in ['index.html','ru/index.html','about/index.html','ru/about/index.html']:
        source=(ROOT/path).read_text()
        old=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT,text=True)
        if path=='ru/about/index.html':
            # Owner-approved title correction, 2026-11-01. All other bytes stay protected.
            before='<title>Обо мне · Ekaterina Shalel</title>'
            after='<title>Екатерина Шалель, основательница Legibi</title>'
            assert old.count(before)==1 and source.count(after)==1,'Expected approved Russian About title'
            old=old.replace(before,after,1)
        assert DEAD_WIKIDATA not in source, path
        old=approve_attribution(old)
        def normalize(match):
            raw=match[1]; data=json.loads(raw)
            for node in data.get('@graph',[data]):
                if node.get('@type')=='Person':
                    assert node['@id']=='https://katyashalel.com/#person'
                    assert node['image']==IMAGE
                    if 'about/' in path:del node['image']
                    else:node['image']='https://katyashalel.com/images/hero-portrait.jpg'
            return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':') if not raw.startswith('{"@context": ') else None)+'</script>'
        normalized=re.sub(r'<script type="application/ld\+json">(.*?)</script>',normalize,source,flags=re.S)
        if 'about/' in path:
            assert source.count('src="/images/ekaterina-shalel-portrait.webp"')==1
            normalized=normalized.replace('src="/images/ekaterina-shalel-portrait.webp"','src="/images/about-coat.webp"')
        assert normalized==old,path+' changed beyond image schema/hero source'
    print(json.dumps({'photoBinding':'passed','pages':4,'imageSha256':hashlib.sha256((ROOT/'images/ekaterina-shalel-portrait.webp').read_bytes()).hexdigest(),'unchangedPortraitBytes':True,'unrelatedContent':'byte-identical'}))
if __name__=='__main__':validate()
