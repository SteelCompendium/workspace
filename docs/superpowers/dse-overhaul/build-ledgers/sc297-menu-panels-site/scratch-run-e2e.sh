#!/usr/bin/env bash
set -uo pipefail
cd /home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/v2
for t in tests/e2e/*.e2e.cjs; do
  echo "=== ${t} ==="
  node "${t}"
  echo "EXIT=${?}"
done
