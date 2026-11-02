cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
export SC546_HELPER=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/scripts/xvfb-owned.mjs
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl
node $S/sc546-r1-stress-orch.mjs 4 25 > /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-gate-stress.log 2>&1
echo "rc=$?" >> /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r3-fix/sc546-r3-gate-stress.log
