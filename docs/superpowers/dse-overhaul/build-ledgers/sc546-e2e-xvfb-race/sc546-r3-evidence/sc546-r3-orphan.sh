cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
S3=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix
check() { # label logfile nodepid
  sleep 4
  alive=0; total=0
  for p in $(cut -d' ' -f1 $2); do total=$((total+1)); if [ -d /proc/$p ] && grep -aq "sc546-r3-fakehang\|sleep" /proc/$p/cmdline 2>/dev/null; then alive=$((alive+1)); kill -TERM $p; fi; done
  echo "$1: fake Xvfb spawned=$total orphans_alive_4s_after_SIGTERM=$alive" 
}
export XVFB_BIN=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-fakehang.sh
# e2e x1
export FAKE_LOG=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-orphan-e2e.fakelog; : > $FAKE_LOG
node e2e/run.mjs --only=CTR-F01 --shards=1 > /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-orphan-e2e.log 2>&1 &
NP=$!
for i in $(seq 1 600); do [ -s $FAKE_LOG ] && break; sleep 0.1; done
kill -TERM $NP; wait $NP; echo "e2e node rc=$?"
check e2e $FAKE_LOG
# lifecycle x4
for k in 1 2 3 4; do
export FAKE_LOG=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-orphan-lc$k.fakelog; : > $FAKE_LOG
DSE_LIFECYCLE_PORT=9392 node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-orphan-lc$k.log 2>&1 &
NP=$!
for i in $(seq 1 600); do [ -s $FAKE_LOG ] && break; sleep 0.1; done
kill -TERM $NP; wait $NP; echo "lifecycle run $k node rc=$?"
check lifecycle$k $FAKE_LOG
done
