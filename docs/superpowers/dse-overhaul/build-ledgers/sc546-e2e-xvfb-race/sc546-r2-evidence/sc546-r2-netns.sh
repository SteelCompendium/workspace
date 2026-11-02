# SC-546 r2 INFO probe: does a -displayfd Xvfb in ANOTHER network namespace come up on a :n held by a live -displayfd Xvfb?
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
X=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb
L=$S/sc546-r2-netns.log
: > $L
$X :5366 -screen 0 640x480x24 -nolisten tcp -displayfd 1 > $S/sc546-r2-netns-holder.out 2>/dev/null &
HP=$!
sleep 1
echo "holder pid=$HP fd-out=$(cat $S/sc546-r2-netns-holder.out) inode=$(stat -c %i /tmp/.X11-unix/X5366)" >> $L
timeout 3 unshare -r -n $X :5366 -screen 0 640x480x24 -nolisten tcp -displayfd 1 > $S/sc546-r2-netns-second.out 2> $S/sc546-r2-netns-second.err
echo "second (other netns) rc=$? fd-out=[$(cat $S/sc546-r2-netns-second.out)] err=[$(grep -a 'already\|Cannot\|unshare' $S/sc546-r2-netns-second.err | head -2 | tr '\n' ' ')]" >> $L
echo "holder alive=$( [ -d /proc/$HP ] && echo yes || echo no) socket now=$(ls /tmp/.X11-unix | grep -c '^X5366$') inode=$(stat -c %i /tmp/.X11-unix/X5366 2>/dev/null)" >> $L
kill -TERM $HP; wait $HP
echo "after holder SIGTERM socket=$(ls /tmp/.X11-unix | grep -c '^X5366$')" >> $L
