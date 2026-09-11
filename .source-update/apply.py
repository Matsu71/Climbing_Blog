"""One-use, checked integration of the research feature into the existing site."""
from pathlib import Path
import hashlib, json, subprocess
root=Path.cwd()
original={
'data/articles.mjs':'a4186bd237f5aec5e5054ed64a776b2e6149c3ff74d4e2abb25c02b891a22fc7',
'data/catalog.mjs':'1832c7c11bab3f2e820859266679789db735a7dd8c4014f2195044938dd14828',
'public/app.mjs':'0f3cbbaf7220e75c04158aa174ecf526846c846fd42e4f2a8340db8c6ffd3093',
'scripts/build.mjs':'3062785e0f34a79c923eb109ce49d5908889bb5af4ab0b0de1e661061d07fb99',
'src/render.mjs':'8eabc94aa084f32c746fc291968ec62d64af74bc363738d66aeabd546e3eeae7',
'tests/browser_smoke.py':'113549a7b25f66c987795b0895b1463e6ee58cc3c82b021b9e1d2b8949cf686c',
'tests/webkit_smoke.py':'0286c14ff74496d9ed4edce4e53159d2e8db91491227ec028cacc543f2089adb'}
for name,expected in original.items():
    if hashlib.sha256((root/name).read_bytes()).hexdigest()!=expected:
        raise RuntimeError('Refusing to overwrite a changed source: '+name)
def patch(name,old,new):
    p=root/name;s=p.read_text()
    if s.count(old)!=1:raise RuntimeError('Replacement count mismatch: '+name)
    p.write_text(s.replace(old,new))
patch('data/catalog.mjs',"export const checkedAt=", "import {researchSources,extraStudies,existingResearchMetadata} from './research-extra.mjs';\nexport const checkedAt=")
patch('data/catalog.mjs','...extraGymSources,','...extraGymSources,...researchSources,')
patch('data/catalog.mjs','export const studies=[','const legacyStudies=[')
patch('data/catalog.mjs','const pumpGyms=[',"export const studies=[...legacyStudies.map(s=>({...s,...existingResearchMetadata[s.id],checked_at:checkedAt})),...extraStudies];\nconst pumpGyms=[")
patch('data/articles.mjs',"const A=", "import {researchArticles} from './research-articles.mjs';\nconst A=")
patch('data/articles.mjs',"],['gym-akiba','equilibrium'])\n];", "],['gym-akiba','equilibrium']),\n...researchArticles\n];")
patch('data/articles.mjs','このサイトの5施設は同一チェーンの試験収録で、全国の網羅やおすすめ順位ではありません。','このサイトは複数の運営元から選定した施設の部分収録で、全国の網羅やおすすめ順位ではありません。')
patch('data/articles.mjs','export const paths=[',"export const paths=[\n{title:'「効いた」の中身を読む',description:'保持力・完登成績・生理指標を、同じ効果だと思わない。',ids:['stronger-fingers-not-sends','read-training-change','blood-flow-not-performance']},")
patch('src/render.mjs',"import {glossary} from '../data/glossary.mjs';", "import {glossary} from '../data/glossary.mjs';\nimport {renderResearchIndex,renderResearchDetail} from './research-render.mjs';\nimport {researchMeasurements} from '../data/research-extra.mjs';")
s=(root/'src/render.mjs').read_text();old=next(x for x in s.splitlines() if x.startswith('function research(){'))
patch('src/render.mjs',old,'function research(){return renderResearchIndex(studies,helpers());}')
patch('src/render.mjs',"g=id&&gyms.find(x=>x.id===id);", "g=id&&gyms.find(x=>x.id===id),study=id&&studies.find(x=>x.id===id);")
patch('src/render.mjs',"else if(view==='gyms'&&g)","else if(view==='research'&&study){title=study.title;body=renderResearchDetail(study,studies,researchMeasurements,helpers());}else if(view==='gyms'&&g)")
patch('src/render.mjs',"...(view==='gyms'&&!id?{gyms}:{}),", "...(view==='gyms'&&!id?{gyms}:{}),...(view==='research'&&!id?{studies}:{}),")
patch('src/render.mjs','${articleTerms(a,helpers())}${references(a.sources)}', '${(a.study_ids??[]).length?`<aside class="article-research"><h2>元の研究を、条件から確かめる。</h2>${a.study_ids.map(id=>{const s=studies.find(s=>s.id===id);return link("research/"+id+"/",e(s.title)+" →");}).join("")}</aside>`:""}${articleTerms(a,helpers())}${references(a.sources)}')
patch('src/render.mjs',"${e(url('styles.css'))}\">", "${e(url('styles.css'))}\"><link rel=\"stylesheet\" href=\"${e(url('research.css'))}\">")
patch('src/render.mjs',"${studies.slice(0,3).map(s=>`<article class=\"card research-preview\">", "${studies.filter(s=>['dynamic-2024','hang-10wk','fatigue-2026'].includes(s.id)).map(s=>`<article class=\"card research-preview\">")
patch('public/app.mjs',"import {initNotebook}","import {initResearch} from './research-ui.mjs';\nimport {initNotebook}")
patch('public/app.mjs',"if(state.view==='gyms'){const existing=", "if(['gyms','research'].includes(state.view)){const existing=")
patch('public/app.mjs','initNotebook({base,download});','initNotebook({base,download});\ninitResearch({...state,toast});')
patch('scripts/build.mjs',"import {glossary}", "import {researchMeasurements} from '../data/research-extra.mjs';\nimport {measurementRows} from '../src/research-model.mjs';\nimport {glossary}")
patch('scripts/build.mjs',"['core','gym-model','notebook-model']", "['core','gym-model','notebook-model','research-model','research-render']")
patch('scripts/build.mjs',"['research',null],['gyms',null]", "['research',null],...studies.map(s=>['research',s.id]),['gyms',null]")
patch('scripts/build.mjs',"for(const [name,data]of Object.entries({sources", "await writeFile(resolve(dist,'data/research-measurements.json'),JSON.stringify(researchMeasurements,null,2)+'\\n');\nawait writeFile(resolve(dist,'data/research-measurements.csv'),csv(measurementRows(researchMeasurements),['study_id','source_id','source_locator','outcome','unit','group','n','phase','mean','standard_deviation']));\nfor(const [name,data]of Object.entries({sources")
patch('scripts/build.mjs',"'protocol','finding','limit','sources']", "'protocol','finding','limit','access_level','sample_n','sample_stage','duration','performance_test','outcomes','not_measured','source_locator','sources']")
for name,needle,insert in [
 ('browser_smoke.py',"        run('research anchor and theme filtering', research)","\n        from research_browser import research_checks\n        research_checks(page,go,run,ROOT,OUT,'chromium')"),
 ('webkit_smoke.py',"        run('glossary full-text search and article navigation',glossary)","\n        from research_browser import research_checks\n        research_checks(page,go,run,ROOT,OUT,'webkit')")]:
    patch('tests/'+name,needle,needle+insert)
patch('data/research-articles.mjs','試験手順順を再現','試験手順を再現')
expected={
'data/articles.mjs':'3aea1b82af9fcccdc2c37ca34963032a3fb61d07',
'data/catalog.mjs':'c4085ad6b6270e3acabe8bf8cc74f55e75ec3a73',
'data/research-articles.mjs':'df8f9fcfb851863bc58509750fa73146d1f0f401',
'data/research-extra.mjs':'187cffa8c108d6f051771f07a425da2c55d0b5de',
'public/app.mjs':'b5743689070dc2cac63dc5ed293ed9d6e6497fa7',
'public/research-ui.mjs':'6f7032544336bf00e8e09a20dc56b7cbeda3a82a',
'public/research.css':'949f4721739dae07ef2b4a1fbb0817d3b5175e1b',
'scripts/build.mjs':'485ec75a4eb631fc7081d9f45849db14c50fd5ae',
'src/render.mjs':'94fc613d2f50098cb52b9cadebbea8541be61af8',
'src/research-model.mjs':'693e8f7abf0ee3941bf29bfd81b182856a20f31c',
'src/research-render.mjs':'505af5993216b9fa41a13c2dca0d52dc3cff43b0',
'tests/browser_smoke.py':'1b0220406649383c93fa4ceadbd4d7fcdb03f523',
'tests/research.test.mjs':'199c0cf413fd558ebdc0fb21f5632787054ad788',
'tests/research_browser.py':'101bf0893d20537a0c30db3015a6ac45cc523045',
'tests/webkit_smoke.py':'2bbf217ccbe3bdaa7df598d88411af4ff8b17c8d'}
for name,sha in expected.items():
    actual=subprocess.check_output(['git','hash-object',name],text=True).strip()
    if actual!=sha:raise RuntimeError('Output checksum mismatch: '+name+' '+actual)
Path('artifacts').mkdir(exist_ok=True)
Path('artifacts/integrated-files.json').write_text(json.dumps(list(expected)))
Path('artifacts/source-hashes.json').write_text(json.dumps(expected,indent=2))
print('Validated exact source hashes for',len(expected),'files')
