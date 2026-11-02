# usage: bash sc546-r2-trees.sh <sha> <label>  -- export <sha> into two throwaway trees (git archive, no repo state touched),
# symlink node_modules, apply the TEMPORARY private range :5340-:5379 + wall-clock barrier (never committed anywhere).
SHA="$1"; LBL="$2"
P=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
for T in A B; do
  D=$S/sc546-r2-tree-$LBL-$T
  mkdir -p $D
  git -C $P archive $SHA | tar -x -C $D
  ln -sfn $P/node_modules $D/node_modules
  python3 - "$D/e2e/run.mjs" <<'PY'
import sys
p=sys.argv[1]; s=open(p,'rb').read().decode()
assert 'const XVFB_RANGE = [200, 239];' in s and 'async function startXvfb() {\n' in s
s=s.replace('const XVFB_RANGE = [200, 239];','const XVFB_RANGE = [5340, 5379]; // SC546-R2-TEMP')
s=s.replace('async function startXvfb() {\n','async function startXvfb() {\n\tif (process.env.SC546_BARRIER) { const b = Number(process.env.SC546_BARRIER); while (Date.now() < b - 5) await sleep(1); while (Date.now() < b) { /* spin */ } } // SC546-R2-TEMP\n',1)
open(p,'wb').write(s.encode())
PY
  echo "$D: $(grep -ac 'SC546-R2-TEMP' $D/e2e/run.mjs) temp lines; helper present: $(test -f $D/scripts/xvfb-owned.mjs && echo yes || echo no)"
done
