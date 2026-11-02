cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
export SC546_TREE=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
export SC546_HELPER=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/scripts/xvfb-owned.mjs
for v in e2e lifecycle docs; do
node /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl/sc546-r1-fnrace-orch.mjs $v 40 /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl/sc546-r1-fnrace-worker-fixed.mjs > /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl/sc546-r1-D-fnrace-fixed-$v.log 2>&1
echo "rc=$?" >> /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl/sc546-r1-D-fnrace-fixed-$v.log
done
