#!/bin/bash
# usage: r2-run.sh <label> <harness.mjs> <bundle-dir|-> <loops> <first-rep> <last-rep> [--only list]
# Runs the harness (default --only=G-S61) once per rep; one log per run in $S/logs (r2-<label>-repN.log) with loadavg header/footer.
# <loops> > 0: starts that many busy loops (PIDs in $S/r2-load.pids) BEFORE the first rep and ALWAYS stops them (literal PIDs, cmdline marker checked) on exit.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-r2k7vx
P=/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements
label="$1"; harness="$2"; bundle="$3"; loops="$4"; first="$5"; last="$6"; only="${7:-G-S61}"
PIDF="$S/r2-load.pids"
export XVFB_BIN="$P/.devbox/nix/profile/default/bin/Xvfb"
stop_loops() {
  [ -s "$PIDF" ] || return 0
  for pid in $(cat "$PIDF"); do
    if tr '\0' ' ' < /proc/$pid/cmdline 2>/dev/null | grep -q 'sc557-r2-load-busy'; then kill "$pid" && echo "killed $pid"; else echo "skip $pid"; fi
  done
  : > "$PIDF"
  echo "loops stopped; loadavg $(cat /proc/loadavg)"
}
trap stop_loops EXIT
if [ "$loops" -gt 0 ]; then
  if [ -s "$PIDF" ]; then echo "pid file not empty: $PIDF"; exit 3; fi
  i=0
  while [ "$i" -lt "$loops" ]; do
    nohup sh -c 'while :; do :; done # sc557-r2-load-busy' > /dev/null 2>&1 &
    echo $! >> "$PIDF"
    i=$((i + 1))
  done
  sleep 2
  echo "started $loops loops: $(tr '\n' ' ' < "$PIDF") loadavg $(cat /proc/loadavg)"
fi
rep="$first"
while [ "$rep" -le "$last" ]; do
  out="$S/logs/r2-$label-rep$rep.log"
  start=$(date +%s)
  {
    echo "label=$label rep=$rep harness=$harness sha=$(sha256sum "$harness" | cut -c1-16) bundle=$bundle main.js=$( [ "$bundle" = "-" ] && echo worktree || sha256sum "$bundle/main.js" | cut -c1-16) loops=$loops env_delay=${SC557_DOC_DELAY_MS} env_inj=${SC557_INJ} env_badread=${SC557_BADREAD} env_flip=${SC557_FLIP} start=$(date -Is) loadavg_start=$(cat /proc/loadavg)"
    if [ "$bundle" = "-" ]; then
      node "$harness" --only="$only"
    else
      DSE_LIFECYCLE_BUNDLE="$bundle" node "$harness" --only="$only"
    fi
    echo "rc=$? elapsed=$(( $(date +%s) - start ))s loadavg_end=$(cat /proc/loadavg)"
  } > "$out" 2>&1
  echo "$out: $(grep -E '^rc=' "$out") $(grep -oE 'G-S[0-9]+ (ok|FAIL)' "$out" | tr '\n' ' ')"
  rep=$((rep + 1))
done
