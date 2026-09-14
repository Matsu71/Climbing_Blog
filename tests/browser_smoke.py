"""Real-browser smoke tests. No production dependencies; install Playwright for tests only."""
from pathlib import Path
import json, os, re, shutil, socket, subprocess, time, traceback, urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts'
OUT.mkdir(exist_ok=True)
manifest = json.loads((ROOT / 'dist/build-manifest.json').read_text())
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
BASE = f'http://127.0.0.1:{port}' + manifest['base']
log = (OUT / 'server.log').open('w')
server = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT,
                          env={**os.environ, 'PORT': str(port)}, stdout=log, stderr=subprocess.STDOUT)
results, page_errors, external_requests = [], [], []

def run(name, fn):
    try:
        fn()
        results.append({'name': name, 'passed': True})
        print('PASS', name, flush=True)
    except Exception as exc:
        results.append({'name': name, 'passed': False, 'error': str(exc), 'traceback': traceback.format_exc()})
        print('FAIL', name, str(exc), flush=True)
    (OUT / 'browser-tests.json').write_text(json.dumps({'results': results}, ensure_ascii=False, indent=2))

try:
    for _ in range(100):
        try:
            urllib.request.urlopen(BASE, timeout=1).close()
            break
        except Exception:
            if server.poll() is not None:
                raise RuntimeError('Preview server exited: ' + (OUT / 'server.log').read_text())
            time.sleep(.1)
    else:
        raise RuntimeError('Preview server did not become ready')
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('google-chrome-stable')
        browser = p.chromium.launch(headless=True, executable_path=executable,
                                     args=['--no-sandbox', '--disable-dev-shm-usage'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
        page = context.new_page()
        page.set_default_timeout(5000)
        page.on('pageerror', lambda exc: page_errors.append(str(exc)))
        page.on('request', lambda req: external_requests.append(req.url) if not req.url.startswith(f'http://127.0.0.1:{port}/') and not req.url.startswith('data:') else None)
        def go(path=''):
            response = page.goto(BASE + path, wait_until='load')
            page.wait_for_function("document.documentElement.dataset.ready === 'true'")
            return response
        def home():
            assert go().status == 200
            expect(page.locator('h1')).to_have_text(re.compile('クライミングデータ'))
            assert page.locator('.desktop-nav').is_visible()
            assert page.locator('html').evaluate('(e)=>e.scrollWidth <= innerWidth+1')
            page.screenshot(path=str(OUT / 'desktop-home.png'), full_page=True)
        run('desktop home, navigation and screenshot', home)
        from evidence_browser import evidence_checks
        evidence_checks(page,go,run,ROOT,OUT)
        def search_kana():
            go('search/?q=' + urllib.parse.quote('すろーぱー'))
            expect(page.locator('[data-filter] [name=q]')).to_have_value('すろーぱー')
            expect(page.locator('[data-item]:visible a[href$="read/sloper-friction/"]')).to_be_visible()
            page.locator('[data-filter] [name=q]').fill('ゼロ件となる架空の検索語1234')
            expect(page.locator('[data-empty]')).to_be_visible()
            page.locator('[data-filter] button[type=reset]').click()
            expect(page.locator('[data-empty]')).to_be_hidden()
            assert page.locator('[data-item]:visible').count() == len(json.loads((ROOT / 'dist/data/search.json').read_text()))
        run('kana search, URL restoration, zero state and reset', search_kana)
        def fullwidth_search():
            go('search/')
            page.locator('[name=q]').fill('ＤＡＮＩＥＬ ＷＯＯＤＳ')
            page.locator('[name=kind]').select_option('記録')
            assert page.locator('[data-item]:visible').count() >= 2
            assert 'q=' in page.url and 'kind=' in page.url
            page.reload(wait_until='load')
            expect(page.locator('[name=kind]')).to_have_value('記録')
            assert page.locator('[data-item]:visible').count() >= 2
        run('full-width Latin search and typed record filtering', fullwidth_search)
        def query_safety():
            go('search/')
            page.locator('[name=q]').fill('<img src=x onerror="window.cruxXss=1">')
            assert page.evaluate('window.cruxXss') is None
            assert page.locator('img').count() == 0
            expect(page.locator('[data-empty]')).to_be_visible()
        run('search text is not interpreted as HTML', query_safety)
        def compare():
            go('climbs/')
            for i in range(3):
                page.locator('[data-compare]').nth(i).check()
            page.locator('[data-compare]').nth(3).click()
            expect(page.locator('[data-compare]').nth(3)).not_to_be_checked()
            assert page.locator('[data-compare]:checked').count() == 3
            expect(page.locator('[data-toast]')).to_contain_text('最大3件')
            assert page.locator('[data-comparison] tbody tr').count() == 8
            assert 'compare=' in page.url
            page.reload(wait_until='load')
            assert page.locator('[data-compare]:checked').count() == 3
            page.locator('[data-remove-compare]').first.click()
            assert page.locator('[data-compare]:checked').count() == 2
            assert '未登録・未確認' in page.locator('[data-comparison]').inner_text()
        run('record comparison limit, persistence and removal', compare)
        def timeline():
            go('climbs/?view=timeline&sort=old')
            assert 'timeline' in page.locator('[data-results]').get_attribute('class')
            dates = page.locator('[data-results] [data-item]').evaluate_all('(els)=>els.map(e=>e.dataset.date)')
            known = [x for x in dates if x]
            assert known == sorted(known)
            assert dates[-1] == ''
            page.locator('[data-sort]').select_option('new')
            dates = page.locator('[data-results] [data-item]').evaluate_all('(els)=>els.map(e=>e.dataset.date)')
            known = [x for x in dates if x]
            assert known == sorted(known, reverse=True)
            assert dates[-1] == ''
        run('timeline orders known dates and leaves unknown dates last', timeline)
        def library():
            go('read/')
            page.locator('[name=category]').select_option('怪我・回復')
            assert page.locator('[data-item]:visible').count() == 4
            page.locator('[name=q]').fill('テープ')
            assert page.locator('[data-item]:visible').count() >= 1
            page.locator('[data-filter] button[type=reset]').click()
            assert page.locator('[data-item]:visible').count() == len(json.loads((ROOT / 'dist/data/articles.json').read_text()))
        run('article category and body-text search', library)
        def bookmarks():
            go('read/footwork-load/')
            page.evaluate('localStorage.removeItem("crux:v1:saved")')
            page.reload(wait_until='load')
            page.locator('[data-save]').first.click()
            expect(page.locator('[data-save]').first).to_have_attribute('aria-pressed', 'true')
            go('saved/')
            expect(page.locator('[data-saved] a[href$="read/footwork-load/"]')).to_be_visible()
            page.reload(wait_until='load')
            assert page.locator('[data-saved] article').count() == 1
            page.locator('[data-saved] [data-save]').click()
            expect(page.locator('[data-saved] .empty')).to_be_visible()
        run('private article bookmarks, reload and removal', bookmarks)
        def malicious_storage():
            go('saved/')
            page.evaluate('localStorage.setItem("crux:v1:saved", JSON.stringify(["<img src=x onerror=alert(1)>", "../privacy", "footwork-load", "footwork-load"]))')
            page.reload(wait_until='load')
            assert page.locator('[data-saved] article').count() == 1
            assert page.locator('[data-saved] img').count() == 0
            page.evaluate('localStorage.removeItem("crux:v1:saved")')
        run('saved data rejects unknown, duplicate and malicious IDs', malicious_storage)
        def gym_filters():
            data=json.loads((ROOT / 'dist/data/gyms.json').read_text())
            listed=[g for g in data if g['status']=='listed']
            go('gyms/')
            page.locator('[name=discipline]').select_option('リード')
            assert page.locator('[data-item]:visible').count()==sum('リード' in g['disciplines'] for g in listed)
            page.locator('[name=discipline]').select_option('ボルダー')
            assert page.locator('[data-item]:visible').count()==sum('ボルダー' in g['disciplines'] for g in listed)
            page.locator('[name=prefecture]').select_option('東京都')
            assert page.locator('[data-item]:visible').count()==sum('ボルダー' in g['disciplines'] and g['prefecture']=='東京都' for g in listed)
        run('multi-discipline gyms appear in both appropriate filters',gym_filters)
        def gym_defaults_history_and_comparison():
            go('gyms/')
            data=json.loads((ROOT / 'dist/data/gyms.json').read_text())
            expect(page.locator('[name=status]')).to_have_value('営業案内あり')
            assert page.locator('[data-item]:visible').count()==sum(g['status']=='listed' for g in data)
            page.locator('[name=status]').select_option('閉店（履歴）')
            assert page.locator('[data-item]:visible').count()==3
            assert '2026-01-12' in page.locator('[data-results]').inner_text()
            page.locator('[data-filter] button[type=reset]').click()
            expect(page.locator('[name=status]')).to_have_value('営業案内あり')
            for i in range(3):page.locator('[data-gym-compare]:visible').nth(i).check()
            page.locator('[data-gym-compare]:visible').nth(3).click()
            assert page.locator('[data-gym-compare]:checked').count()==3
            expect(page.locator('[data-toast]')).to_contain_text('最大3施設')
            page.locator('[name=prefecture]').select_option('東京都')
            assert 'compare=' in page.url
            page.reload(wait_until='load')
            expect(page.locator('[data-gym-comparison]')).to_contain_text('未登録・未確認')
            assert page.locator('[data-gym-compare]:checked').count()==3
            page.locator('[data-gym-remove]').first.click()
            assert page.locator('[data-gym-compare]:checked').count()==2
            page.locator('[data-gym-show]').click()
            expect(page.locator('[data-gym-comparison]')).to_be_focused()
            page.locator('[data-gym-clear]').click()
            expect(page.locator('[data-gym-dock]')).to_be_hidden()
            assert 'compare=' not in page.url
            go('gyms/?compare=rocklands,../x,rocklands,basecamp-iruma')
            assert page.locator('[data-gym-compare]:checked').count()==2
            expect(page.locator('[data-gym-comparison]')).to_contain_text('9.2 m')
            go('gym-history/')
            dates=page.locator('.history-list time').all_text_contents()
            assert dates==sorted(dates) and len(dates)==3
            go('gyms/gravity-sapporo/')
            assert page.locator('a[href*="maps/search"]').count()==0
            expect(page.locator('main')).to_contain_text('閉店しています')
        run('gym default status, historical dates, comparison limit and URL persistence',gym_defaults_history_and_comparison)
        def glossary_connections():
            go('glossary/#flash')
            expect(page.locator('#flash')).to_contain_text('最初のトライ')
            page.locator('[name=q]').fill('ふらっしゅ')
            # The documented search also searches definitions and cautions.
            visible=page.locator('[data-item]:visible').evaluate_all('(items)=>items.map(x=>x.id).sort()')
            assert visible==['flash','onsight','redpoint']
            expect(page.locator('#flash')).to_be_visible()
            page.locator('[data-filter] button[type=reset]').click()
            assert page.locator('[data-item]:visible').count()==manifest['counts']['glossary']
            go('read/footwork-load/')
            expect(page.locator('.article-terms')).to_be_visible()
            page.locator('.article-terms a').first.click()
            assert '/glossary/#' in page.url
            expect(page.locator('h1')).to_contain_text('言葉が分かる')
        run('glossary kana search, definitions and article-to-term navigation',glossary_connections)
        def notebook_save_edit_export():
            go('notebook/')
            page.evaluate('localStorage.removeItem("crux:v1:notebook")')
            page.reload(wait_until='load')
            form=page.locator('[data-note-form]')
            form.locator('[name=name]').fill('<img src=x onerror="window.badNote=1">青の3番')
            form.locator('[name=grade]').fill('2級')
            form.locator('[name=attempts]').fill('4')
            form.locator('[name=observation]').fill('右足が外れた')
            form.locator('[name=next]').fill('左足から先に上げる')
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")') is None
            form.locator('[data-note-save]').click()
            expect(page.locator('[data-note-status]')).to_contain_text('保存しました')
            assert page.locator('[data-note-id]').count()==1
            assert page.locator('[data-note-list] img').count()==0
            assert page.evaluate('window.badNote') is None
            page.reload(wait_until='load')
            expect(page.locator('[data-note-list]')).to_contain_text('左足から先に上げる')
            page.locator('[data-note-edit]').first.click()
            form.locator('[name=name]').fill('青の3番')
            form.locator('[name=next]').fill('最後の2手をつなぐ')
            form.locator('[data-note-save]').click()
            assert page.locator('[data-note-id]').count()==1
            expect(page.locator('[data-note-list]')).to_contain_text('最後の2手をつなぐ')
            page.locator('[data-note-query]').fill('ない語-0000')
            expect(page.locator('[data-note-list]')).to_contain_text('一致する記録がありません')
            page.locator('[data-note-query]').fill('')
            page.locator('details').filter(has=page.locator('[data-note-export]')).locator('summary').click()
            with page.expect_download() as info:page.locator('[data-note-export]').click()
            path=OUT/'notebook-backup.json';info.value.save_as(path)
            doc=json.loads(path.read_text())
            assert doc['schema_version']==1 and doc['notes'][0]['name']=='青の3番'
            assert doc['notes'][0]['attempts']==4 and len(doc['notes'])==1
            page.once('dialog',lambda dialog:dialog.dismiss())
            page.locator('[data-note-delete]').first.click()
            assert page.locator('[data-note-id]').count()==1
        run('private notebook explicit save, safe text, edit, filters and JSON export',notebook_save_edit_export)
        def notebook_import_and_validation():
            go('notebook/')
            form=page.locator('[data-note-form]')
            form.locator('[name=name]').fill('フラッシュ条件チェック')
            form.locator('[name=result]').select_option('flash')
            form.locator('[name=attempts]').fill('2')
            form.locator('[data-note-save]').click()
            expect(page.locator('[data-note-status]')).to_contain_text('フラッシュのトライ数は1')
            assert page.locator('[data-note-id]').count()==1
            page.once('dialog',lambda dialog:dialog.accept())
            page.locator('[data-note-new]').click()
            original=page.evaluate('localStorage.getItem("crux:v1:notebook")')
            existing=json.loads(original)['notes'][0]
            fresh={**existing,'id':'imported-0002','name':'新しい記録'}
            duplicate={**existing,'name':'勝手に上書きしない'}
            page.locator('details').filter(has=page.locator('[data-note-import]')).locator('summary').click()
            page.once('dialog',lambda dialog:dialog.accept())
            page.locator('[data-note-import]').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps({'schema_version':1,'notes':[duplicate,fresh]}).encode()})
            expect(page.locator('[data-note-status]')).to_contain_text('1件を追加')
            assert page.locator('[data-note-id]').count()==2
            assert '勝手に上書きしない' not in page.locator('[data-note-list]').inner_text()
            before=page.evaluate('localStorage.getItem("crux:v1:notebook")')
            page.locator('[data-note-import]').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{broken'})
            expect(page.locator('[data-note-status]')).to_contain_text('JSONとして読み込めません')
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")')==before
            page.locator('[data-note-import]').set_input_files({'name':'too-large.json','mimeType':'application/json','buffer':b'x'*(1024*1024+1)})
            expect(page.locator('[data-note-status]')).to_contain_text('1MBまで')
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")')==before
            page.once('dialog',lambda dialog:dialog.accept())
            page.locator('[data-note-delete="imported-0002"]').click()
            assert page.locator('[data-note-id]').count()==1
        run('notebook flash validation, non-overwriting merge, invalid file and size guard',notebook_import_and_validation)
        def notebook_cross_tab_conflict():
            go('notebook/')
            page.locator('[data-note-edit]').first.click()
            other=context.new_page();other.goto(BASE+'notebook/',wait_until='load')
            other.locator('[data-note-edit]').first.click()
            other.locator('[name=next]').fill('別タブで保存した内容')
            other.locator('[data-note-save]').click()
            expect(other.locator('[data-note-status]')).to_contain_text('保存しました')
            page.locator('[data-note-form] [name=next]').fill('古い入力で上書きしない')
            page.locator('[data-note-save]').click()
            expect(page.locator('[data-note-status]')).to_contain_text('別のタブで記録が更新')
            current=json.loads(page.evaluate('localStorage.getItem("crux:v1:notebook")'))
            assert current['notes'][0]['next']=='別タブで保存した内容'
            other.close()
        run('notebook cross-tab editing detects stale writes without discarding drafts',notebook_cross_tab_conflict)
        def notebook_corrupt_storage():
            go('notebook/')
            before=page.evaluate('localStorage.getItem("crux:v1:notebook")')
            try:
                page.evaluate('localStorage.setItem("crux:v1:notebook","{broken")')
                page.reload(wait_until='load')
                expect(page.locator('[data-note-list]')).to_contain_text('読み込めません')
                page.locator('[data-note-form] [name=name]').fill('上書き禁止')
                page.locator('[data-note-save]').click()
                assert page.evaluate('localStorage.getItem("crux:v1:notebook")')=='{broken'
            finally:page.evaluate('(v)=>localStorage.setItem("crux:v1:notebook",v)',before)
        run('notebook corruption cannot silently wipe the previous store',notebook_corrupt_storage)
        def research():
            go('research/#study-hang')
            expect(page.locator('#study-hang')).to_be_visible()
            page.locator('[name=theme]').select_option('怪我・回復')
            assert page.locator('[data-item]:visible').count() == 1
            assert '確かではありません' in page.locator('[data-item]:visible').inner_text()
        run('research anchor and theme filtering', research)
        from research_browser import research_checks
        research_checks(page,go,run,ROOT,OUT,'chromium')
        def calculations():
            go('tools/')
            expect(page.locator('#support [data-output]')).to_contain_text('294.2')
            page.locator('#support [name=x]').fill('100')
            expect(page.locator('#support [data-output]')).to_contain_text('左 0 N')
            expect(page.locator('#friction [data-output]')).to_contain_text('50 N')
            expect(page.locator('#load [data-output]')).to_contain_text('133.3%')
            page.locator('#load [name=r]').fill('81')
            expect(page.locator('#load [data-error]')).to_contain_text('超えています')
            page.locator('#load [name=r]').fill('0')
            expect(page.locator('#load [data-error]')).to_be_empty()
            page.locator('#load [name=m]').fill('')
            expect(page.locator('#load [data-error]')).to_contain_text('入力してください')
            expect(page.locator('#ape [data-output]')).to_contain_text('+5 cm')
            expect(page.locator('#ape [data-output]')).to_contain_text('1.029')
            page.locator('#week [name=d0]').select_option('hard')
            page.locator('#week [name=d6]').select_option('hard')
            expect(page.locator('#week [data-output]')).to_contain_text('隣り合う組 1')
        run('calculators, invalid inputs and cyclic week boundary', calculations)
        def project_note():
            go('tools/#project')
            page.locator('[data-project] [name=title]').fill('課題A')
            page.locator('[data-project] [name=observation]').fill('<b>右足が切れた</b>')
            page.locator('[data-project] [name=next]').fill('次は足を一つ変える')
            page.locator('[data-project] button[type=submit]').click()
            expect(page.locator('[data-project-status]')).to_contain_text('保存しました')
            page.reload(wait_until='load')
            expect(page.locator('[data-project] [name=title]')).to_have_value('課題A')
            expect(page.locator('[data-project] [name=observation]')).to_have_value('<b>右足が切れた</b>')
            with page.expect_download() as info:
                page.locator('[data-project-export]').click()
            path = OUT / 'project-note.json'
            info.value.save_as(path)
            doc = json.loads(path.read_text())
            assert doc['next'] == '次は足を一つ変える'
            page.once('dialog', lambda dialog: dialog.accept())
            page.locator('[data-project-delete]').click()
            expect(page.locator('[data-project] [name=title]')).to_have_value('')
            assert page.evaluate('localStorage.getItem("crux:v1:project")') is None
        run('project note explicit save, reload, safe text, export and deletion', project_note)
        def observation():
            go('tools/#observe')
            page.locator('[data-observe] [name=event]').fill('試験大会 M1')
            page.locator('[data-observe] [name=video]').fill('http://example.com/video')
            page.locator('[data-observe] [name=timestamp]').fill('12:34')
            page.locator('[data-observe] button[type=submit]').click()
            expect(page.locator('[data-observe-status]')).to_contain_text('https')
            page.locator('[data-observe] [name=video]').fill('https://example.com/video')
            page.locator('[data-observe] [name=timestamp]').fill('12:99')
            page.locator('[data-observe] button[type=submit]').click()
            expect(page.locator('[data-observe-status]')).to_contain_text('mm:ss')
            page.locator('[data-observe] [name=timestamp]').fill('01:12:34')
            page.locator('[data-observe] [name=grip]').select_option('0')
            with page.expect_download() as info:
                page.locator('[data-observe] button[type=submit]').click()
            path = OUT / 'competition-note.json'
            info.value.save_as(path)
            doc = json.loads(path.read_text())
            assert doc['timestamp_seconds'] == 4354
            assert len(doc['scores']) == 16
            assert doc['scores']['grip'] == 0 and doc['scores']['balance'] is None
            assert doc['official_video_verified'] is False
            assert doc['reviewer_status'] == 'user_observation_unreviewed'
        run('competition notes validate input and distinguish zero from unknown', observation)
        def quiz():
            go('quiz/')
            questions = json.loads((ROOT / 'dist/data/quiz.json').read_text())
            for i, q in enumerate(questions):
                choice = (q['answer'] + 1) % len(q['choices']) if i == 0 else q['answer']
                page.locator(f'[data-choice="{choice}"]').click()
                assert page.locator('[data-choice]:disabled').count() == len(q['choices'])
                expect(page.locator('.quiz-feedback')).to_contain_text(q['explanation'])
                page.locator('[data-quiz-next]').click()
            expect(page.locator('.quiz-score')).to_have_text('11 / 12')
            page.locator('[data-quiz-reset]').click()
            expect(page.locator('[data-quiz] .eyebrow')).to_contain_text('QUESTION 1 / 12')
            assert page.locator('[data-choice]:disabled').count() == 0
        run('quiz locks each answer, explains it, scores once and resets', quiz)
        def source_details():
            go('read/taping-evidence/')
            expect(page.locator('h1')).to_contain_text('テープ')
            page.locator('#source-tape summary').click()
            expect(page.locator('#source-tape')).to_have_attribute('open', '')
            assert page.locator('#source-tape a').get_attribute('rel') == 'noopener noreferrer'
            assert '専門家監修なし' in page.locator('.reader').inner_text()
        run('article sources and medical review status remain visible', source_details)
        def privacy():
            go('privacy/')
            page.evaluate('localStorage.setItem("other-app", "keep");localStorage.setItem("crux:v1:saved", JSON.stringify(["footwork-load"]))')
            page.once('dialog', lambda dialog: dialog.accept())
            page.locator('[data-clear-storage]').click()
            assert page.evaluate('localStorage.getItem("crux:v1:saved")') is None
            assert page.evaluate('localStorage.getItem("crux:v1:notebook")') is None
            assert page.evaluate('localStorage.getItem("other-app")') == 'keep'
        run('privacy deletion removes only this application’s keys', privacy)
        def not_found():
            response = go('does-not-exist/')
            assert response.status == 404
            expect(page.locator('h1')).to_contain_text('見つかりません')
        run('unknown paths return a usable HTTP 404 page', not_found)
        page.set_viewport_size({'width': 390, 'height': 844})
        for route in manifest['paths']:
            def mobile_route(route=route):
                go(route)
                assert page.locator('html').evaluate('(e)=>e.scrollWidth <= innerWidth+1'), f'horizontal overflow at {route}'
                assert page.locator('h1').count() == 1
                expect(page.locator('.mobile-nav')).to_be_visible()
            run('mobile route: /' + route, mobile_route)
        def screenshots():
            go()
            page.screenshot(path=str(OUT / 'mobile-home.png'), full_page=True)
            go('read/footwork-load/')
            page.screenshot(path=str(OUT / 'mobile-article.png'), full_page=True)
            go('tools/')
            page.screenshot(path=str(OUT / 'mobile-tools.png'), full_page=True)
            for route in ['notebook/','glossary/','gyms/?compare=rocklands,basecamp-iruma','gym-history/']:
                go(route)
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUT / ('mobile-'+route.split('/')[0]+'.png')),full_page=True)
            page.set_viewport_size({'width':1440,'height':1000})
            go('climbs/?compare=alphane,burden-of-dreams,silence')
            page.screenshot(path=str(OUT / 'desktop-comparison.png'), full_page=True)
        run('mobile and desktop feature screenshots', screenshots)
        def blocked_storage():
            blocked = browser.new_context(viewport={'width': 390, 'height': 844})
            blocked.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('blocked','SecurityError')}})")
            pp = blocked.new_page()
            pp.goto(BASE + 'read/footwork-load/', wait_until='load')
            pp.locator('[data-save]').first.click()
            expect(pp.locator('[data-toast]')).to_contain_text('保存できません')
            expect(pp.locator('[data-save]').first).to_have_attribute('aria-pressed', 'false')
            pp.goto(BASE + 'tools/', wait_until='load')
            expect(pp.locator('#support [data-output]')).to_contain_text('294.2')
            expect(pp.locator('[data-project-status]')).to_contain_text('読み込めません')
            pp.goto(BASE+'notebook/',wait_until='load')
            expect(pp.locator('[data-note-list]')).to_contain_text('読み込めません')
            pp.locator('[name=name]').fill('保存できない')
            pp.locator('[data-note-save]').click()
            expect(pp.locator('[data-note-status]')).to_contain_text('変更していません')
            blocked.close()
        run('denied storage fails honestly while the rest of the site works', blocked_storage)
        def no_js():
            nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
            pp = nojs.new_page()
            pp.goto(BASE + 'read/footwork-load/', wait_until='load')
            expect(pp.locator('.reader')).to_contain_text('600 N')
            expect(pp.locator('[data-save]').first).to_be_hidden()
            pp.goto(BASE + 'read/', wait_until='load')
            expect(pp.locator('[data-filter]')).to_be_hidden()
            assert pp.locator('[data-item]:visible').count() == manifest['counts']['articles']
            pp.goto(BASE + 'quiz/', wait_until='load')
            assert pp.locator('.no-js-quiz details').count() == 12
            pp.goto(BASE+'glossary/',wait_until='load')
            assert pp.locator('[data-item]:visible').count()==manifest['counts']['glossary']
            pp.goto(BASE+'gyms/',wait_until='load')
            assert pp.locator('[data-item]:visible').count()==manifest['counts']['gyms']
            assert '閉店' in pp.locator('main').inner_text()
            nojs.close()
        run('articles and quiz explanations are readable without JavaScript', no_js)
        def runtime_clean():
            assert not page_errors, page_errors
            assert not external_requests, external_requests
        run('no uncaught browser exceptions or automatic external requests', runtime_clean)
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
    log.close()
    report = {'passed': sum(x['passed'] for x in results), 'failed': sum(not x['passed'] for x in results),
              'results': results, 'uncaught_errors': page_errors, 'automatic_external_requests': external_requests}
    (OUT / 'browser-tests.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))

if not results or any(not x['passed'] for x in results):
    raise SystemExit(1)
print(f"All {len(results)} browser checks passed.")
