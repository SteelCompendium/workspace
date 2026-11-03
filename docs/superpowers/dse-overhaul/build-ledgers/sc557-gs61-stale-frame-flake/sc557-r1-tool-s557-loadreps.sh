#!/bin/bash
# usage: s557-loadreps.sh <label> <bundle> <tag> <first> <last>
# starts 12 busy loops, runs G-S61 reps, and ALWAYS stops the loops (literal PIDs) before returning
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
cleanup() { bash "$S/s557-loadstop.sh"; }
trap cleanup EXIT
bash "$S/s557-loadstart.sh" 12
bash "$S/s557-reps.sh" "$1" "$2" "$3" "$4" "$5"
