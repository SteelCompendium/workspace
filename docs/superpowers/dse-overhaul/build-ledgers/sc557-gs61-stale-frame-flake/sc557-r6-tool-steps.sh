#!/bin/bash
# r6: follow sc557-dse-verify-proposal.md §3 literally for probe T on d689b719, then one idle green G-S61 alone run.
# usage: r6-steps.sh prep | T | green
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-r2k7vx
P=/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements
D=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake
X=$S/r6-tree
case "$1" in
prep)
  if [ -e "$X" ]; then echo "exists: $X"; exit 3; fi
  mkdir -p "$X"
  git -C "$P" archive HEAD | tar -x -C "$X" || exit 4
  echo "exported $(git -C "$P" rev-parse HEAD)"
  ln -s "$P/node_modules" "$X/node_modules"
  python3 -I "$D/sc557-r5-tool-probe-patch.py" "$X/visual-harness/obsidian-lifecycle.mjs" "$X/visual-harness/obsidian-lifecycle-probe.mjs"; echo "patch rc=$?"
  ls "$X/main.js" 2>/dev/null || echo "no main.js in the export (harness does not build; proposal says unset = fresh build)"
  devbox run -c "$P" -- bash -c "cd $X && node esbuild.config.mjs production" > "$S/logs/r6-build.log" 2>&1
  sha256sum "$X/main.js" "$X/styles.css"
  ;;
T)
  devbox run -c "$P" -- bash -c "cd $X && echo loadavg_start=\$(cat /proc/loadavg) > $S/logs/r6-T.log && DSE_LIFECYCLE_BUNDLE=$X SC557_BADREAD=torn SC557_INJ=2:7:400 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 >> $S/logs/r6-T.log 2>&1; echo rc=\$? loadavg_end=\$(cat /proc/loadavg) >> $S/logs/r6-T.log"
  grep -E "^rc=|G-S61 (ok|FAIL)" -o "$S/logs/r6-T.log" | sort | uniq -c
  ;;
green)
  devbox run -c "$P" -- bash -c "cd $X && echo loadavg_start=\$(cat /proc/loadavg) > $S/logs/r6-green-idle.log && DSE_LIFECYCLE_BUNDLE=$X node visual-harness/obsidian-lifecycle.mjs --only=G-S61 >> $S/logs/r6-green-idle.log 2>&1; echo rc=\$? loadavg_end=\$(cat /proc/loadavg) >> $S/logs/r6-green-idle.log"
  grep -E "^rc=|G-S61 (ok|FAIL)" -o "$S/logs/r6-green-idle.log" | sort | uniq -c
  ;;
esac
