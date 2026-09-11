"""Independent WebKit/mobile regression checks; not a claim of physical iPhone testing."""
from pathlib import Path
import json, os, socket, subprocess, time, traceback, urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'webkit'
OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'dist/build-manifest.json').read_text())
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0))
    port=sock.getsockname()[1]
BASE=f'http://127.0.0.1:{port}'+manifest['base']
server_log=(OUT/'server.log').open('w')
server=subprocess.Popen(['node','scripts/serve.mjs'],cwd=ROOT,env={**os.environ,'PORT':str(port)},stdout=server_log,stderr=subprocess.STDOUT)
results,errors,requests=[],[],[]

def run(name,fn):
    try:
        fn()
        results.append({'name':name,'passed':True})
        print('PASS WebKit',name,flush=True)
    except Exception as exc:
        results.append({'name':name,'passed':False,'error':str(exc),'traceback':traceback.format_exc()})
        print('FAIL WebKit',name,str(exc),flush=True)
    (OUT/'tests.json').write_text(json.dumps({'engine':'webkit','physical_device':False,'results':results},ensure_ascii=False,indent=2))

try:
    for _ in range(100):
        try:
            urllib.request.urlopen(BASE,timeout=1).close()
            break
        except Exception:
            if server.poll() is not None:
                raise RuntimeError('Preview server exited')
            time.sleep(.1)
    else:
        raise RuntimeError('Preview server did not start')
    with sync_playwright() as p:
        browser=p.webkit.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,locale='ja-JP',timezone_id='Asia/Tokyo')
        page=context.new_page()
        page.set_default_timeout(8000)
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('request',lambda req:requests.append(req.url) if not req.url.startswith(f'http://127.0.0.1:{port}/') and not req.url.startswith('data:') else None)
        def go(path=''):
            response=page.goto(BASE+path,wait_until='load')
            page.wait_for_function("document.documentElement.dataset.ready==='true'")
            return response
        for route in manifest['paths']:
            def check_route(route=route):
                response=go(route)
                assert response.status==200,route
                assert page.locator('h1').count()==1,route
                assert page.locator('html').evaluate('(e)=>e.scrollWidth<=innerWidth+1'),route
            run('mobile route /'+route,check_route)
        def search():
            go('search/')
            page.locator('[name=q]').fill('すろーぱー')
            expect(page.locator('[data-item]:visible a[href$="read/sloper-friction/"]')).to_be_visible()
            page.locator('[name=q]').fill('存在しないテスト語0000')
            expect(page.locator('[data-empty]')).to_be_visible()
            page.locator('[data-filter] button[type=reset]').click()
            expect(page.locator('[name=q]')).to_have_value('')
            expect(page.locator('[data-empty]')).to_be_hidden()
        run('kana search and reset on touch viewport',search)
        def gym_comparison():
            go('gyms/')
            expect(page.locator('[name=status]')).to_have_value('営業案内あり')
            assert page.locator('[data-item]:visible').count()==18
            for i in range(3):
                page.locator('[data-gym-compare]:visible').nth(i).check()
            page.locator('[data-gym-compare]:visible').nth(3).click()
            assert page.locator('[data-gym-compare]:checked').count()==3
            page.locator('[data-gym-show]').click()
            expect(page.locator('[data-gym-comparison]')).to_be_focused()
            assert 'compare=' in page.url
            page.reload(wait_until='load')
            page.wait_for_function("document.documentElement.dataset.ready==='true'")
            assert page.locator('[data-gym-compare]:checked').count()==3
            page.locator('[data-gym-clear]').click()
            expect(page.locator('[data-gym-dock]')).to_be_hidden()
            page.locator('[name=status]').select_option('閉店（履歴）')
            assert page.locator('[data-item]:visible').count()==3
        run('gym selection, touch dock, persistence and closed facilities',gym_comparison)
        def glossary():
            go('glossary/')
            page.locator('[name=q]').fill('ふらっしゅ')
            ids=page.locator('[data-item]:visible').evaluate_all('(items)=>items.map(x=>x.id).sort()')
            assert ids==['flash','onsight','redpoint']
            page.locator('#flash a.text-link').click()
            expect(page).to_have_url(BASE+'read/reading-records/')
            expect(page.locator('h1')).to_be_visible()
        run('glossary full-text search and article navigation',glossary)
        def notebook():
            go('notebook/')
            form=page.locator('[data-note-form]')
            form.locator('[name=date]').fill('2026-09-11')
            form.locator('[name=name]').fill('WebKit検証用の課題')
            form.locator('[name=attempts]').fill('3')
            form.locator('[name=next]').fill('次は左足から')
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")') is None
            form.locator('[data-note-save]').click()
            expect(page.locator('[data-note-status]')).to_contain_text('保存しました')
            page.reload(wait_until='load')
            page.wait_for_function("document.documentElement.dataset.ready==='true'")
            expect(page.locator('[data-note-list]')).to_contain_text('次は左足から')
            page.locator('[data-note-edit]').first.click()
            form.locator('[name=next]').fill('最後の2手をつなぐ')
            form.locator('[data-note-save]').click()
            assert page.locator('[data-note-id]').count()==1
            page.locator('details').filter(has=page.locator('[data-note-export]')).locator('summary').click()
            with page.expect_download() as info:
                page.locator('[data-note-export]').click()
            path=OUT/'notebook-backup.json'
            info.value.save_as(path)
            doc=json.loads(path.read_text())
            assert doc['notes'][0]['next']=='最後の2手をつなぐ'
            before=page.evaluate('localStorage.getItem("crux:v1:notebook")')
            page.locator('[data-note-import]').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{invalid'})
            expect(page.locator('[data-note-status]')).to_contain_text('JSONとして読み込めません')
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")')==before
        run('notebook date, explicit storage, edit, backup and invalid import',notebook)
        def saved_and_privacy():
            go('read/footwork-load/')
            page.locator('[data-save]').first.click()
            expect(page.locator('[data-save]').first).to_have_attribute('aria-pressed','true')
            go('saved/')
            expect(page.locator('[data-saved] a[href$="read/footwork-load/"]')).to_be_visible()
            go('privacy/')
            page.evaluate('localStorage.setItem("other-application","preserve")')
            page.once('dialog',lambda dialog:dialog.accept())
            page.locator('[data-clear-storage]').click()
            assert page.evaluate('localStorage.getItem("crux:v1:saved")') is None
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")') is None
            assert page.evaluate('localStorage.getItem("other-application")')=='preserve'
        run('bookmarks and privacy deletion preserve other applications',saved_and_privacy)
        def responsive_edges():
            for width in [320,375,768,1024]:
                page.set_viewport_size({'width':width,'height':900})
                for route in ['', 'gyms/', 'glossary/', 'notebook/', 'read/footwork-load/']:
                    go(route)
                    assert page.locator('html').evaluate('(e)=>e.scrollWidth<=innerWidth+1'),f'{width}px: {route}'
            page.set_viewport_size({'width':390,'height':844})
            for name,route in [('home',''),('notebook','notebook/'),('gym-comparison','gyms/?compare=rocklands,basecamp-iruma')]:
                go(route)
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
        run('320–1024px boundary layouts and Japanese mobile screenshots',responsive_edges)
        def no_javascript():
            nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844},locale='ja-JP')
            try:
                pp=nojs.new_page()
                pp.goto(BASE+'glossary/',wait_until='load')
                assert pp.locator('[data-item]:visible').count()==28
                pp.goto(BASE+'read/footwork-load/',wait_until='load')
                expect(pp.locator('h1')).to_be_visible()
                assert len(pp.locator('main').inner_text())>400
            finally:
                nojs.close()
        run('content remains readable with JavaScript disabled',no_javascript)
        def clean_runtime():
            assert not errors,errors
            assert not requests,requests
        run('no uncaught errors or automatic third-party requests',clean_runtime)
        context.close()
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait(timeout=5)
    server_log.close()
    (OUT/'tests.json').write_text(json.dumps({'engine':'webkit','physical_device':False,'results':results,'errors':errors,'external_requests':requests},ensure_ascii=False,indent=2))
if not results or any(not item['passed'] for item in results):
    raise SystemExit(1)
