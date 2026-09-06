#!/usr/bin/env bash
set -uo pipefail
cd /home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/v2
for t in tests/e2e/cardhead-mobile.e2e.cjs tests/e2e/featureblock.e2e.cjs tests/e2e/featureblock-fixture.e2e.cjs tests/e2e/nav-drawer-keep.e2e.cjs tests/e2e/page-titles.e2e.cjs tests/e2e/settings-panel.e2e.cjs tests/e2e/statblock-band.e2e.cjs tests/e2e/statblock-featstyle.e2e.cjs tests/e2e/pins-custom-links.e2e.cjs tests/e2e/pins-sections.e2e.cjs; do
  echo "=== ${t} ==="
  node "${t}"
  echo "EXIT=${?}"
done
