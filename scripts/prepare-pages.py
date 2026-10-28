"""Assemble prebuilt applications for GitHub Pages, fixing runtime asset URLs."""
from pathlib import Path
import shutil
import sys

repo = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=True)
for app, route in [('experience-center', ''), ('admin', 'admin'), ('elder-screen', 'elder-screen'), ('elder-miniapp', 'elder-mobile'), ('family-mobile', 'family-mobile')]:
    source = repo / 'apps' / app / 'dist'
    target = output / route
    shutil.copytree(source, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns('server.cjs', 'server.cjs.map'))
    prefix = '/singapore-eldercare-demo/' + (route + '/' if route else '')
    for file in target.rglob('*'):
        if file.is_file() and file.suffix in {'.js', '.css', '.html', '.json'}:
            text = file.read_text()
            for quote in ['"', "'", '`', '(']:
                text = text.replace(quote + '/assets/', quote + prefix + 'assets/')
            file.write_text(text)
(output / '.nojekyll').touch()
# Keep the former elder-miniapp URL usable.
legacy = output / 'elder-miniapp'
legacy.mkdir(exist_ok=True)
(legacy / 'index.html').write_text('<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../elder-mobile/"><a href="../elder-mobile/">老人移动端</a>')
print(output)
