"""Shared Chromium / WebKit checks for claim-level data and source navigation."""
import csv, json
from urllib.parse import quote
from playwright.sync_api import expect

def evidence_checks(page,go,run,ROOT,OUT):
    def body_data():
        go('athlete-data/')
        assert page.locator('tbody [data-item]').count()==30
        for name,values in [('tomoa-narasaki',['169','170']),('laura-rogora',['152','154'])]:
            for value in values: expect(page.locator('#athlete-'+name)).to_contain_text(value)
        page.locator('[name=metric]').select_option('リーチ')
        assert page.locator('tbody [data-item]:visible').count()==13
        expect(page.locator('#athlete-laura-rogora')).to_be_visible()
        page.locator('[name=q]').fill('一致しない名前0000')
        expect(page.locator('[data-empty]')).to_be_visible()
        page.locator('button[type=reset]').click()
        assert page.locator('tbody [data-item]:visible').count()==30
        page.locator('[name=conflict]').select_option('複数の身長値')
        expect(page.locator('#athlete-laura-rogora')).to_be_visible()
    run('evidence: field filter, conflicting values, empty state and reset',body_data)

    def source_anchor():
        go('athlete-data/')
        page.locator('#athlete-tomoa-narasaki .ref-link').first.click()
        source=page.locator('#source-jmsca-tomoa-narasaki')
        expect(source).to_have_attribute('open','')
        expect(source).to_contain_text('測定日')
        assert source.locator('a').get_attribute('href').startswith('https://www.jma-climbing.org/')
    run('evidence: source links open the relevant disclosure',source_anchor)

    def ascent_download():
        go('ascent-data/')
        assert page.locator('tbody [data-item]').count()==64
        page.locator('[name=q]').fill('Captain Nemo')
        expect(page.locator('tbody [data-item]:visible')).to_contain_text('再登')
        with page.expect_download() as event:
            page.locator('[data-evidence-download="evidence-ascents.json"]').click()
        destination=OUT/'evidence-ascents-downloaded.json';event.value.save_as(str(destination))
        rows=json.loads(destination.read_text())
        assert len(rows)==64
        assert next(r for r in rows if r['id']=='excalibur-bosi')['ascent_date']=='2025-02-03'
        assert next(r for r in rows if r['climb']=='DNA')['grade'] is None
    run('evidence: ascent semantics and local JSON download',ascent_download)

    def medical():
        go('injury-data/')
        assert page.locator('.study-entry').count()==12
        expect(page.locator('.medical-boundary')).to_contain_text('未実施')
        page.locator('.filter-extra > summary').click()
        page.locator('[name=design]').select_option('系統的レビュー')
        assert page.locator('.study-entry:visible').count()==1
        expect(page.locator('.study-entry:visible')).to_contain_text('限界')
        page.locator('button[type=reset]').click()
        page.locator('[name=access]').select_option('抄録')
        assert page.locator('.study-entry:visible').count()==5
        expect(page.locator('#study-physeal-algorithm')).to_contain_text('不整合')
        page.locator('button[type=reset]').click()
        page.locator('[name=purpose]').select_option('受診判断')
        expect(page.locator('.study-entry:visible')).to_have_attribute('id','study-finger-triage')
    run('evidence: medical design, abstract-only limits and triage filter',medical)

    def athlete_style():
        go('athlete-data/?q=Laura')
        page.locator('#athlete-laura-rogora .athlete-record-link').click()
        expect(page.locator('[name=athlete]')).to_have_value('ローラ・ロゴラ')
        assert page.locator('tbody [data-item]:visible').count()==5
        page.locator('.filter-extra > summary').click()
        page.locator('[name=style]').select_option('オンサイト')
        expect(page.locator('tbody [data-item]:visible')).to_have_attribute('id','ascent-continental-laura')
        expect(page.locator('#ascent-continental-laura')).to_contain_text('公表 2026-05-05')
        expect(page.locator('#ascent-continental-laura time')).to_have_text('未確認')
        go('ascent-data/?athlete='+quote('ローラ・ロゴラ')+'&style='+quote('オンサイト'))
        expect(page.locator('tbody [data-item]:visible')).to_have_attribute('id','ascent-continental-laura')
    run('evidence: athlete cross-link, onsight, publication date and URL persistence',athlete_style)

    def filtered_anchor():
        go('evidence/?q=unmatched0000#source-pulley-pps-2016')
        source=page.locator('#source-pulley-pps-2016')
        expect(source).to_be_visible();expect(source).to_have_attribute('open','')
        expect(page.locator('[name=q]')).to_have_value('')
        page.locator('[name=access]').select_option('抄録')
        assert page.locator('.source-register [data-item]:visible').count()==5
        page.locator('[name=q]').fill('成長期')
        expect(page.locator('.source-register [data-item]:visible')).to_have_attribute('id','source-physeal-algorithm-2021')
        page.locator('button[type=reset]').click()
        assert page.locator('.source-register [data-item]:visible').count()==67
        go('ascent-data/?q=unmatched0000#ascent-excalibur-brooke')
        expect(page.locator('#ascent-excalibur-brooke')).to_be_visible()
        expect(page.locator('[name=q]')).to_have_value('')
    run('evidence: source filter and hidden-anchor recovery',filtered_anchor)

    def clinical_csv():
        go('injury-data/')
        with page.expect_download() as event:
            page.locator('[data-evidence-download="evidence-clinical.csv"]').click()
        destination=OUT/'evidence-clinical-downloaded.csv';event.value.save_as(str(destination))
        with destination.open(encoding='utf-8-sig',newline='') as handle: rows=list(csv.DictReader(handle))
        assert len(rows)==12
        p=next(r for r in rows if r['id']=='pulley-pps')
        assert json.loads(p['outcome_counts'])[0]['denominator']==43
        assert '[object Object]' not in destination.read_text()
    run('evidence: clinical CSV preserves structured denominators',clinical_csv)

    def named_climb():
        go('ascent-data/?athlete='+quote('ブルック・ラバトゥ'))
        page.locator('#ascent-box-therapy-brooke .climb-record-link').click()
        expect(page.locator('[name=climb]')).to_have_value('Box Therapy')
        expect(page.locator('[name=athlete]')).to_have_value('')
        assert page.locator('tbody [data-item]:visible').count()==3
        expect(page.locator('#ascent-box-therapy-katie')).to_contain_text('8C+')
        expect(page.locator('#ascent-box-therapy-shawn')).to_contain_text('未確認')
        assert page.locator('[data-grade-climb]:visible').count()==1
        expect(page.locator('[data-grade-climb]:visible')).to_contain_text('Brooke Raboutou')
        page.locator('[name=q]').fill('unmatched0000')
        expect(page.locator('[data-grade-history]')).to_be_hidden()
        page.locator('button[type=reset]').click()
        assert page.locator('[data-grade-climb]:visible').count()==3
    run('evidence: named climb cross-link and filtered grade history',named_climb)

    def applicability():
        go('injury-data/?scope='+quote('一般スポーツ')+'&purpose='+quote('再発予防'))
        expect(page.locator('.study-entry:visible')).to_have_attribute('id','study-ankle-recurrence-rct')
        expect(page.locator('.study-entry:visible')).to_contain_text('解析分母未確認')
        page.locator('[name=purpose]').select_option('復帰評価')
        expect(page.locator('.study-entry:visible')).to_have_attribute('id','study-ankle-paass')
        expect(page.locator('.study-entry:visible')).to_contain_text('患者集団ではない')
        go('injury-data/?scope='+quote('一般患者')+'&access='+quote('抄録'))
        expect(page.locator('.filter-extra')).to_have_attribute('open','')
        expect(page.locator('.study-entry:visible')).to_have_attribute('id','study-elbow-injection-rct')
        go('ascent-data/?style='+quote('フラッシュ')+'&climb=Nascondino')
        expect(page.locator('.filter-extra')).to_have_attribute('open','')
        expect(page.locator('tbody [data-item]:visible')).to_have_attribute('id','ascent-nascondino-brooke')
    run('evidence: applicability, prevention/consensus distinction and secondary filter restoration',applicability)

    def data_screenshots():
        original=page.viewport_size
        cases=[('body','athlete-data/?q=Laura'),('ascents','ascent-data/?q=Bibliographie'),('injury','injury-data/?condition='+quote('プーリー')),('sources','evidence/?q=EDELRID'),('box','ascent-data/?climb=Box%20Therapy'),('ankle','injury-data/?scope='+quote('一般スポーツ'))]
        try:
            for width in [320,390,1280]:
                page.set_viewport_size({'width':width,'height':900})
                for name,route in cases:
                    go(route)
                    assert page.locator('html').evaluate('(e)=>e.scrollWidth<=innerWidth+1'),str((width,route))
                    if width!=320:
                        page.evaluate('scrollTo(0,0)')
                        page.screenshot(path=str(OUT/f'evidence-{name}-{width}.png'),full_page=True)
        finally:
            if original: page.set_viewport_size(original)
    run('evidence: 320–1280px layouts and filtered data screenshots',data_screenshots)
