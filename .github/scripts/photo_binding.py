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
# Q138801513 does not resolve. The definition clause is unchanged; the lead names its author.
DEAD_WIKIDATA='https://www.wikidata.org/wiki/Q138801513'
OLD_EN='AI legibility is the discipline of measuring and improving whether AI systems can retrieve, understand, corroborate, compare and select a company, product, founder or specialist under real decision conditions.'
NEW_EN='By Ekaterina Shalel\u2019s definition (Legibi): '+OLD_EN
OLD_RU='AI legibility это дисциплина, которая измеряет и улучшает, насколько AI-системы способны извлекать, понимать, подтверждать, сравнивать и выбирать компанию, продукт, основателя или специалиста в реальных условиях принятия решения.'
NEW_RU='По определению Екатерины Шалель (Legibi): '+OLD_RU
SHORT_EN='AI legibility: measuring and improving whether AI systems can retrieve, understand, corroborate, compare and select a company, product, founder or specialist under real decision conditions.'
SHORT_EN_NEW='AI legibility, as defined by Ekaterina Shalel (Legibi): measuring and improving whether AI systems can retrieve, understand, corroborate, compare and select a company, product, founder or specialist under real decision conditions.'
SHORT_RU='AI legibility: измеряет и улучшает, насколько AI-системы способны извлекать, понимать, подтверждать, сравнивать и выбирать компанию, продукт, основателя или специалиста в реальных условиях принятия решения.'
SHORT_RU_NEW='AI legibility, по определению Екатерины Шалель (Legibi): измеряет и улучшает, насколько AI-системы способны извлекать, понимать, подтверждать, сравнивать и выбирать компанию, продукт, основателя или специалиста в реальных условиях принятия решения.'
def approve_attribution(text):
    text=text.replace('\n      "'+DEAD_WIKIDATA+'",','')
    text=text.replace(', "'+DEAD_WIKIDATA+'"','')
    text=text.replace('"'+DEAD_WIKIDATA+'",','')
    return text.replace(OLD_EN,NEW_EN).replace(OLD_RU,NEW_RU).replace(SHORT_EN,SHORT_EN_NEW).replace(SHORT_RU,SHORT_RU_NEW)
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
