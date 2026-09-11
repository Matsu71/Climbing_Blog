"""Read-only publishing preflight. Never enables Pages or changes repository settings."""
from datetime import datetime, timezone
from pathlib import Path
import json, os, urllib.error, urllib.request

EXPECTED_URL='https://matsu71.github.io/Climbing_Blog/'

def classify(status: int, site: dict, expected_url: str=EXPECTED_URL) -> dict:
    if status == 404:
        return {'ready':False,'state':'initial_configuration_required','detail':'Enable GitHub Pages and select GitHub Actions as its source.'}
    if status != 200:
        return {'ready':False,'state':'configuration_check_failed','detail':f'GitHub Pages configuration request returned HTTP {status}.'}
    if site.get('build_type') != 'workflow':
        return {'ready':False,'state':'workflow_source_required','detail':'Select GitHub Actions as the publishing source; no setting was changed.'}
    if str(site.get('html_url','')).rstrip('/') != expected_url.rstrip('/'):
        return {'ready':False,'state':'origin_review_required','detail':'The configured site URL differs from the verified build origin. Review BASE_PATH and SITE_ORIGIN.'}
    return {'ready':True,'state':'configured','detail':'Publishing configuration matches the verified build. Deployment is a separate step.'}

def main() -> None:
    repo=os.environ['GITHUB_REPOSITORY']
    if repo != 'Matsu71/Climbing_Blog':
        raise SystemExit('Publishing is restricted to the intended repository.')
    token=os.environ['GH_TOKEN']
    request=urllib.request.Request('https://api.github.com/repos/'+repo+'/pages',headers={
        'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28','User-Agent':'crux-publishing-preflight'})
    site={}
    try:
        with urllib.request.urlopen(request,timeout=20) as response:
            code=response.status
            site=json.load(response)
    except urllib.error.HTTPError as error:
        code=error.code
    except (urllib.error.URLError,TimeoutError,json.JSONDecodeError) as error:
        raise SystemExit('Publishing configuration could not be read: '+type(error).__name__) from None
    result={**classify(code,site),'http_status':code,'source_commit':os.environ.get('GITHUB_SHA'),
        'checked_at':datetime.now(timezone.utc).isoformat(),'planned_url':EXPECTED_URL,'settings_changed':False}
    target=Path('artifacts/deployment-status.json')
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    with open(os.environ['GITHUB_OUTPUT'],'a') as output:
        output.write('ready='+str(result['ready']).lower()+'\n')
        output.write('state='+result['state']+'\n')
    with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as summary:
        summary.write('## Publishing configuration\n\n'+result['state']+'\n\n'+result['detail']+'\n\n')
        summary.write('This is not a deployment success claim. See the deploy job for publication.\n')
    print(json.dumps(result,ensure_ascii=False))
    if result['state']=='configuration_check_failed':
        raise SystemExit(1)
    if not result['ready']:
        print('::warning::'+result['detail'])

if __name__=='__main__':
    main()
