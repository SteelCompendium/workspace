#!/usr/bin/env bash
set -uo pipefail
cd /home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/v2
export PLAYWRIGHT_PATH=/home/scott/.npm/_npx/e5af6bbc29da0270/node_modules/playwright-core
export CHROMIUM_PATH=/opt/brave.com/brave/brave
export E2E_BASE=http://127.0.0.1:8124/
for t in tests/e2e/pins-custom-links.e2e.cjs tests/e2e/pins-sections.e2e.cjs tests/e2e/pins-layout.e2e.cjs; do
  echo "=== ${t} ==="
  node "${t}"
  echo "EXIT=${?}"
done
