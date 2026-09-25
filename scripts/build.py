"""Synchronize the standalone HTML with the editable guide, styles, and application."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='Fail if the HTML is out of date.')
args = parser.parse_args()
html_path = ROOT / 'index.html'
html = html_path.read_text()
data = json.loads((ROOT / 'guide-data.json').read_text())
json_text = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
blocks = [
    (r'(<style id="map-style">).*?(</style>)', (ROOT / 'vendor/leaflet/leaflet.css').read_text()),
    (r'(<script id="map-lib">).*?(</script>)', (ROOT / 'vendor/leaflet/leaflet.js').read_text()),
    (r'(<script id="map-app">).*?(</script>)', (ROOT / 'map.js').read_text()),
    (r'(<style>).*?(</style>)', (ROOT / 'styles.css').read_text()),
    (r'(<script id="guide-data" type="application/json">).*?(</script>)', json_text),
    (r'(<script>).*?(</script>)', (ROOT / 'app.js').read_text()),
]
for pattern, content in blocks:
    if len(re.findall(pattern, html, re.S)) != 1:
        raise SystemExit(f'Expected exactly one embedded block: {pattern}')
    html = re.sub(pattern, lambda m: m[1] + '\n' + content + '\n' + m[2], html, flags=re.S)
if args.check:
    if html != html_path.read_text():
        raise SystemExit('index.html is out of date. Run python3 scripts/build.py.')
    print('Embedded guide, CSS, and JavaScript are current.')
else:
    html_path.write_text(html)
    print('Updated index.html.')
