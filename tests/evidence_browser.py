"""Behavior checks for the sourced data pages. Run from browser_smoke.py."""
import json
from playwright.sync_api import expect

def evidence_checks(page,go,run,ROOT,OUT):
    def body_data():
        go('athlete-data/')
        assert page.locator('tbody [data-item]').count()==15
        tomoa=page.locator('#athlete-tomoa-narasaki')
        expect(tomoa).to_contain_text('169')
        expect(tomoa).to_contain_text('170')
        page.locator('[name=metric]').select_option('リーチ')
        assert page.locator('tbody [data-item]:visible').count()==1
        expect(page.locator('tbody [data-item]:visible')).to_have_attribute('id','athlete-sorato-anraku')
        page.locator('[name=q]').fill('一致しない名前0000')
        expect(page.locator('[data-empty]')).to_be_visible()
        page.locator('button[type=reset]').click()
        assert page.locator('tbody [data-item]:visible').count()==15
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
        assert page.locator('tbody [data-item]').count()==24
        page.locator('[name=q]').fill('Captain Nemo')
        expect(page.locator('tbody [data-item]:visible')).to_contain_text('再登')
        with page.expect_download() as event:
            page.locator('[data-evidence-download="evidence-ascents.json"]').click()
        download=event.value
        destination=OUT/'evidence-ascents-downloaded.json';download.save_as(str(destination))
        rows=json.loads(destination.read_text())
        assert len(rows)==24
        assert next(r for r in rows if r['id']=='excalibur-bosi')['ascent_date']=='2025-02-03'
        assert next(r for r in rows if r['climb']=='DNA')['grade'] is None
    run('evidence: ascent semantics and local JSON download',ascent_download)
    def medical():
        go('injury-data/')
        assert page.locator('.study-entry').count()==4
        expect(page.locator('.medical-boundary')).to_contain_text('未実施')
        page.locator('[name=design]').select_option('系統的レビュー')
        assert page.locator('.study-entry:visible').count()==1
        expect(page.locator('.study-entry:visible')).to_contain_text('限界')
    run('evidence: medical study design and limits remain visible',medical)
