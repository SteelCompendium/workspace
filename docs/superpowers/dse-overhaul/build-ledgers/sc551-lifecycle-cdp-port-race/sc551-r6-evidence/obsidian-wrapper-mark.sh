#!/bin/bash
# non-exec launcher wrapper that records that it ran (its own pid and the pid of the Obsidian it starts)
echo "wrapper pid=$$ args=$*" >> /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl/wrapper-marker.log
/usr/bin/obsidian "$@"
