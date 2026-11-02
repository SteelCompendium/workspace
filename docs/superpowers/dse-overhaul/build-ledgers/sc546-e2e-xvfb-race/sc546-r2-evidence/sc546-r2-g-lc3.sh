cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
export DSE_LIFECYCLE_PORT=9477
echo "pwd=$(pwd) head=$(git rev-parse --short HEAD) dirty=[$(git status --porcelain)]" > /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review/sc546-r2-gate-lifecycle3.log
npm run obsidian-lifecycle -- --only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S57,G-S56 >> /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review/sc546-r2-gate-lifecycle3.log 2>&1
echo "rc=$?" >> /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review/sc546-r2-gate-lifecycle3.log
