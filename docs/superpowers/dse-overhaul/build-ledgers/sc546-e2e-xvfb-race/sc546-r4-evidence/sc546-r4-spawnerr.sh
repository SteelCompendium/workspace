# SC-546 r4: spawn errors fail fast, naming the binary (helper + all three real callers), on 4b14600d.
P=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
N=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r4-rereview
L=$N/sc546-r4-spawnerr.log
: > $L
cd $P
echo "head=$(git rev-parse --short HEAD) dirty=[$(git status --porcelain)]" >> $L
for B in $N/sc546-r4-noexec-xvfb /nonexistent/sc546-r4/Xvfb; do
  T0=$(date +%s%3N)
  node --input-type=module -e "
    import { startOwnedXvfb } from '$P/scripts/xvfb-owned.mjs';
    const spawned = [];
    try { const g = await startOwnedXvfb({ bin: '$B', candidates: [5340, 5341, 5342], args: [], onSpawn: (c, n) => spawned.push(n) }); console.log('returned', g); }
    catch (e) { console.log('threw', e.constructor.name + ': ' + e.message, 'spawned=' + JSON.stringify(spawned)); }
  " >> $L 2>&1
  echo "  helper bin=$B ms=$(( $(date +%s%3N) - T0 ))" >> $L
done
T0=$(date +%s%3N)
XVFB_BIN=$N/sc546-r4-noexec-xvfb node e2e/run.mjs --only=CTR-F01 --shards=1 > $N/sc546-r4-spawnerr-e2e.log 2>&1; RC=$?
echo "e2e rc=$RC ms=$(( $(date +%s%3N) - T0 )) (includes build) $(grep -a 'environment' $N/sc546-r4-spawnerr-e2e.log | tr '\n' ' ')" >> $L
T0=$(date +%s%3N)
DSE_LIFECYCLE_PORT=9581 XVFB_BIN=$N/sc546-r4-noexec-xvfb node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > $N/sc546-r4-spawnerr-lc.log 2>&1; RC=$?
echo "lifecycle rc=$RC ms=$(( $(date +%s%3N) - T0 )) $(grep -a 'environment' $N/sc546-r4-spawnerr-lc.log | tr '\n' ' ')" >> $L
T0=$(date +%s%3N)
XVFB_BIN=$N/sc546-r4-noexec-xvfb node visual-harness/docs-shots.mjs --only=settings-index.png > $N/sc546-r4-spawnerr-docs.log 2>&1; RC=$?
echo "docs-shots rc=$RC ms=$(( $(date +%s%3N) - T0 )) $(grep -a 'could not execute\|Xvfb unavailable\|Xvfb up' $N/sc546-r4-spawnerr-docs.log | tr '\n' ' ')" >> $L
echo "after: dirty=[$(git status --porcelain)] xvfb534x=[$(ps -eo pid,args | grep -a 'Xvfb :53[4-7][0-9]' | grep -av grep)]" >> $L
