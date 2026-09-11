"""Keep the no-JavaScript coverage assertion aligned with the actual article catalogue."""
from pathlib import Path
import hashlib, json, subprocess
path=Path('tests/browser_smoke.py')
before=subprocess.check_output(['git','hash-object',str(path)],text=True).strip()
if before!='1b0220406649383c93fa4ceadbd4d7fcdb03f523':
    raise SystemExit('Unexpected browser test source; refusing stale amendment')
text=path.read_text()
old="assert pp.locator('[data-item]:visible').count() == 22"
new="assert pp.locator('[data-item]:visible').count() == manifest['counts']['articles']"
if text.count(old)!=1:
    raise SystemExit('The original coverage assertion must occur exactly once')
path.write_text(text.replace(old,new))
after=subprocess.check_output(['git','hash-object',str(path)],text=True).strip()
if after!='277168a04f4eb436dbae93930c5fec4030659009':
    raise SystemExit('Unexpected amended browser test output')
Path('artifacts/test-amendment.json').write_text(json.dumps({'path':str(path),'before_blob':before,'after_blob':after,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},indent=2)+'\n')
