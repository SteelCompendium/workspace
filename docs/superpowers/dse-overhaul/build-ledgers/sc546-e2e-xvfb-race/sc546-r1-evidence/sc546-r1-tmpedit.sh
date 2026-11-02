# usage: bash sc546-r1-tmpedit.sh <plugin dir>   -- TEMPORARY private range + start barrier (never committed)
D="$1"
python3 - "$D/e2e/run.mjs" <<'PY'
import sys
p=sys.argv[1]; s=open(p,'rb').read().decode()
assert 'const XVFB_RANGE = [200, 239];' in s and 'async function startXvfb() {\n' in s
s=s.replace('const XVFB_RANGE = [200, 239];','const XVFB_RANGE = [5300, 5339]; // SC546-TEMP')
s=s.replace('async function startXvfb() {\n','async function startXvfb() {\n\tif (process.env.SC546_BARRIER) { const b = Number(process.env.SC546_BARRIER); while (Date.now() < b - 5) await sleep(1); while (Date.now() < b) { /* spin */ } } // SC546-TEMP\n',1)
open(p,'wb').write(s.encode())
PY
