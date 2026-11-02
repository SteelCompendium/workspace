cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
H=scripts/xvfb-owned.mjs
run() { npx jest test/unit/build/xvfbOwned.test.ts 2>&1 | grep -a "✓\|✕\|Tests:" ; }
echo "=== M1: belt reverted (hasSocket(n) dropped)"; sed -i 's/ && hasSocket(n);/;/' $H; run; git checkout -- $H
echo "=== M2: wrong-number check reverted (any line counts)"; sed -i 's/void finish(buf === `${n}\\n`)/void finish(true)/' $H; grep -c 'finish(true)' $H; run; git checkout -- $H
echo "=== M3: shouldStop check reverted"; sed -i 's/ || shouldStop?.()) break;/) break;/' $H; run; git checkout -- $H
echo "=== M4: spawn error throw reverted"; sed -i 's/^\t\tif (spawnError) throw/\t\tif (false) throw/' $H; run; git checkout -- $H
echo "=== M5: spawn error listener in ownsDisplay reverted"; sed -i "s/child.once('error', onExit);.*//" $H; run; git checkout -- $H
echo "=== clean"; git status --short
