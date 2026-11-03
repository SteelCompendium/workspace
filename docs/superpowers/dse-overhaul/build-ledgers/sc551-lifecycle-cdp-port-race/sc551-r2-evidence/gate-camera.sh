#!/bin/bash
# usage: gate-camera.sh <label> <display-num> <port|auto> <camera-script-relpath> [npm-less camera args...]
# One obsidian-shots equivalent: notes-gen + build-no-check + camera, on a private Xvfb, private DSE_CAMERA_TMP.
LABEL=$1; DNUM=$2; PORT=$3; CAM=$4; shift 4
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
TMPR=$S/camtmp-$LABEL
OUT=$S/shots-$LABEL
mkdir -p $TMPR/obsidian-harness-udd
cp /tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar $TMPR/obsidian-harness-udd/
$P/.devbox/nix/profile/default/bin/Xvfb :$DNUM -screen 0 1600x1200x24 -nolisten tcp > $E/$LABEL-xvfb.log 2>&1 &
XPID=$!
for i in $(seq 1 50); do [ -S /tmp/.X11-unix/X$DNUM ] && break; sleep 0.2; done
cd $P
rm -rf /home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements/visual-harness/shots
if [ "$CAM" = visual-harness/obsidian-camera.mjs ]; then
  node visual-harness/notes-gen.mjs > $E/$LABEL-notes.log 2>&1; echo "notes-gen rc=$?"
  npm run build-no-check > $E/$LABEL-build.log 2>&1; echo "build rc=$?"
fi
unset DSE_CAMERA_PORT
if [ "$PORT" != auto ]; then export DSE_CAMERA_PORT=$PORT; fi
export DSE_CAMERA_DISPLAY=:$DNUM DSE_CAMERA_TMP=$TMPR
t0=$(date +%s)
node $CAM "$@" > $E/$LABEL.log 2>&1; echo "camera rc=$? in $(( $(date +%s) - t0 )) s"
kill $XPID
tail -3 $E/$LABEL.log | cut -c1-250
command grep -a 'cdp:\|spawned\|attached' $E/$LABEL.log | cut -c1-200
cp -a $P/visual-harness/shots $OUT 2>/dev/null
ls $OUT 2>/dev/null | command grep -ac 'obsidian'
ls $OUT 2>/dev/null | wc -l
