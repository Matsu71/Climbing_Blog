"""Browser scenarios for research comparison. Run inside the existing Chromium and WebKit suites."""
import csv, io, json
from playwright.sync_api import expect

def research_checks(page, go, run, root, out, engine):
    data=json.loads((root/'dist/data/studies.json').read_text())
    def filters_and_restore():
        go('research/')
        assert page.locator('[data-item]:visible').count()==len(data)
        page.locator('[name=performance]').select_option('登攀課題の実測あり')
        assert page.locator('[data-item]:visible').count()==2
        page.locator('[name=q]').fill('存在しない-xyz')
        expect(page.locator('[data-empty]')).to_be_visible()
        page.locator('[data-filter] button[type=reset]').click()
        assert page.locator('[data-item]:visible').count()==len(data)
        page.locator('[name=access]').select_option('抄録のみ')
        assert page.locator('[data-item]:visible').count()==2
        page.reload(wait_until='load')
        page.wait_for_function("document.documentElement.dataset.ready==='true'")
        expect(page.locator('[name=access]')).to_have_value('抄録のみ')
        assert page.locator('[data-item]:visible').count()==2
    run(engine+' research four-axis filters, zero state, reset and refresh',filters_and_restore)
    def compare():
        go('research/?compare=hang-10wk,dynamic-2024,hang-10wk,../invalid')
        assert page.locator('[data-research-compare]:checked').count()==2
        expect(page.locator('[data-research-comparison]')).to_contain_text('登攀課題の実測あり')
        expect(page.locator('[data-research-comparison]')).to_contain_text('登攀課題の効果は未測定')
        page.locator('[data-research-compare="body"]').check()
        page.locator('[data-research-compare="hang"]').click()
        assert page.locator('[data-research-compare]:checked').count()==3
        expect(page.locator('[data-toast]')).to_contain_text('最大3件')
        page.locator('[data-research-show]').click()
        expect(page.locator('[data-research-comparison]')).to_be_focused()
        page.locator('[name=theme]').select_option('怪我・回復')
        assert 'compare=' in page.url
        page.locator('[data-research-remove="body"]').click()
        assert page.locator('[data-research-compare]:checked').count()==2
        expect(page.locator('[data-research-comparison]')).to_be_focused()
        page.reload(wait_until='load')
        page.wait_for_function("document.documentElement.dataset.ready==='true'")
        assert page.locator('[data-research-compare]:checked').count()==2
        expect(page.locator('[name=theme]')).to_have_value('怪我・回復')
        page.locator('[data-research-clear]').click()
        expect(page.locator('[data-research-dock]')).to_be_hidden()
        expect(page.locator('[name=q]')).to_be_focused()
        assert 'compare=' not in page.url
        # Back and forward restoration, not just refresh.
        go('research/?compare=hang-10wk')
        go('research/?compare=dynamic-2024')
        page.go_back(wait_until='load')
        expect(page.locator('[data-research-compare="hang-10wk"]')).to_be_checked()
        page.go_forward(wait_until='load')
        expect(page.locator('[data-research-compare="dynamic-2024"]')).to_be_checked()
    run(engine+' research comparison persistence, limit, hidden selection and keyboard focus',compare)
    def measurements():
        go('research/hang-10wk/#measurements')
        expect(page.locator('[data-measurement-panel="peak"]')).to_be_visible()
        expect(page.locator('[data-measurement-panel="average"]')).to_be_hidden()
        expect(page.locator('[data-measurement-panel="peak"]')).to_contain_text('515.3 ± 167.5')
        page.locator('[data-measurement-select]').select_option('hangtime')
        expect(page.locator('[data-measurement-panel="peak"]')).to_be_hidden()
        expect(page.locator('[data-measurement-panel="hangtime"]')).to_contain_text('p = 0.303')
        expect(page.locator('[data-measurement-panel="hangtime"]')).to_contain_text('56.2 ± 16.8')
        # Direct static CSV request avoids platform-dependent download MIME handling.
        response=page.request.get(page.url.split('research/')[0]+'data/research-measurements.csv')
        assert response.status==200
        rows=list(csv.DictReader(io.StringIO(response.text().lstrip('\ufeff'))))
        assert len(rows)==12 and rows[1]['mean']=='515.3' and rows[1]['n']=='18'
        go('read/stronger-fingers-not-sends/')
        page.locator('.article-research a').first.click()
        assert page.url.rstrip('/').endswith('/research/dynamic-2024')
        expect(page.locator('main')).to_contain_text('p = 0.39')
    run(engine+' measurement selector, SD values, source CSV and article connections',measurements)
    def narrow_layout():
        original=page.viewport_size
        for width in [320,390,768,1024]:
            page.set_viewport_size({'width':width,'height':900})
            for path in ['research/', 'research/?compare=hang-10wk,dynamic-2024,finger-extensors','research/hang-10wk/']:
                go(path)
                assert page.locator('html').evaluate('(e)=>e.scrollWidth<=innerWidth+1'),(width,path)
        page.set_viewport_size({'width':390,'height':844})
        go('research/hang-10wk/#measurements')
        page.screenshot(path=str(out/(engine+'-research-study.png')),full_page=True)
        go('research/?compare=hang-10wk,dynamic-2024')
        page.screenshot(path=str(out/(engine+'-research-compare.png')),full_page=True)
        page.set_viewport_size(original)
    run(engine+' research 320–1024px layout and comparison-table scrolling',narrow_layout)
    def nojs():
        browser=page.context.browser
        context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844},locale='ja-JP')
        try:
            p=context.new_page();base=page.url.split('research/')[0]
            p.goto(base+'research/hang-10wk/',wait_until='load')
            assert p.locator('[data-measurement-panel]:visible').count()==3
            expect(p.locator('main')).to_contain_text('515.3 ± 167.5')
            p.goto(base+'research/',wait_until='load')
            assert p.locator('[data-item]:visible').count()==len(data)
        finally:
            context.close()
    run(engine+' research descriptions and all measurement tables without JavaScript',nojs)
