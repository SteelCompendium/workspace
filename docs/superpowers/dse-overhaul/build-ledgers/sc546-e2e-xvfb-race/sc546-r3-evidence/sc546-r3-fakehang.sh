#!/bin/sh
# fake Xvfb: logs its pid, never writes fd 3, never exits
echo "$$ $1" >> "$FAKE_LOG"
exec sleep 60
