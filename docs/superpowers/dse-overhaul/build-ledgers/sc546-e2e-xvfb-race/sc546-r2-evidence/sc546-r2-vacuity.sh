# TEMPORARY uncommitted probe edit of scripts/xvfb-owned.mjs (old "socket exists = mine" logic), reverted at the end.
cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
L=$S/sc546-r2-vacuity.log
: > $L
echo "TMPDIR=$TMPDIR os.tmpdir=$(node -e 'console.log(require("os").tmpdir())')" >> $L
echo "status before: [$(git status --porcelain)]" >> $L
for variant in e2e-old lifecycle-old; do
python3 - scripts/xvfb-owned.mjs "$variant" <<'PY'
import sys
p, v = sys.argv[1], sys.argv[2]
s = open(p).read()
start = s.index('/** Resolves true only if')
guard = "if (child.exitCode !== null) return false; " if v == 'e2e-old' else ""
old = ("function ownsDisplay(child, n, hasSocket, timeoutMs) {\n"
       "\treturn (async () => { for (let i = 0; i < 40; i++) { " + guard + "if (hasSocket(n)) return true; await sleep(100); } return false; })();\n"
       "}\n")
s = s[:start] + "// SC546-R2-TEMP old logic (" + v + ")\n" + old
open(p, 'w').write(s)
PY
  echo "=== variant $variant: $(git diff --stat | tail -1)" >> $L
  npx jest test/unit/build/xvfbOwned.test.ts > $S/sc546-r2-vacuity-$variant.log 2>&1
  echo "rc=$? $(grep -a '^Tests:' $S/sc546-r2-vacuity-$variant.log)" >> $L
  grep -a '✕\|✓' $S/sc546-r2-vacuity-$variant.log >> $L
  git checkout -- scripts/xvfb-owned.mjs
done
echo "status after revert: [$(git status --porcelain)]" >> $L
echo "HEAD $(git rev-parse --short HEAD)" >> $L
echo "test tmp dirs left in os.tmpdir: $(ls -d "$(node -e 'console.log(require("os").tmpdir())')"/dse-xvfb-owned-test-* 2>/dev/null | wc -l)" >> $L
echo "sleep30 left: $(pgrep -f -x 'sleep 30' | wc -l)" >> $L
