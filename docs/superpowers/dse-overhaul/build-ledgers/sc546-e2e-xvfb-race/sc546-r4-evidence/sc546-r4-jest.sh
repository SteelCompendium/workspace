# SC-546 r4: xvfbOwned.test.ts 5x, then TEMPORARY uncommitted mutations of scripts/xvfb-owned.mjs (each reverted with git checkout).
cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
N=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r4-rereview
L=$N/sc546-r4-jest.log
: > $L
echo "head=$(git rev-parse --short HEAD) dirty=[$(git status --porcelain)] sleep30=$(pgrep -f -x 'sleep 30' | wc -l) tmpdirs=$(ls -d /tmp/dse-xvfb-owned-test-* 2>/dev/null | wc -l)" >> $L
for i in 1 2 3 4 5; do
  T0=$(date +%s%3N)
  npx jest test/unit/build/xvfbOwned.test.ts > $N/sc546-r4-jest-run$i.log 2>&1
  echo "run $i rc=$? ms=$(( $(date +%s%3N) - T0 )) $(grep -a '^Tests:' $N/sc546-r4-jest-run$i.log)" >> $L
done
for m in wrongnum belt shouldstop errlistener; do
python3 - scripts/xvfb-owned.mjs "$m" <<'PY'
import sys
p, m = sys.argv[1], sys.argv[2]
s = open(p).read()
rep = {
  'wrongnum': ("void finish(buf === `${n}\\n`)", "void finish(true)"),
  'belt': ("child.signalCode === null && hasSocket(n)", "child.signalCode === null"),
  'shouldstop': ("if (Date.now() >= deadline || shouldStop?.()) break;", "if (Date.now() >= deadline) break;"),
  'errlistener': ("\t\tchild.once('error', onExit);", "\t\t// SC546-R4-TEMP removed error listener"),
}[m]
assert s.count(rep[0]) == 1, (m, s.count(rep[0]))
open(p, 'w').write(s.replace(rep[0], rep[1]))
PY
  echo "=== mutation $m: $(git diff --stat | tail -1)" >> $L
  npx jest test/unit/build/xvfbOwned.test.ts > $N/sc546-r4-jest-mut-$m.log 2>&1
  echo "rc=$? $(grep -a '^Tests:' $N/sc546-r4-jest-mut-$m.log)" >> $L
  grep -a '●.*›' $N/sc546-r4-jest-mut-$m.log | sort -u >> $L
  git checkout -- scripts/xvfb-owned.mjs
done
echo "after: dirty=[$(git status --porcelain)] sleep30=$(pgrep -f -x 'sleep 30' | wc -l) tmpdirs=$(ls -d /tmp/dse-xvfb-owned-test-* 2>/dev/null | wc -l)" >> $L
