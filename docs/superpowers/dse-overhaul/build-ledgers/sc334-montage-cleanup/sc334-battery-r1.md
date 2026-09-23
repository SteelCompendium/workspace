# SC-334 battery r1 — dse 22aaae7..e6c551c on d124cc3 (2026-09-23)

| Gate | Result |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest (`rm -f main.js styles.css && npx jest`) | 3913 passed / 1 skipped / 202 of 203 suites / 3 snapshots (base d124cc3 = 3902: +12 new tests, −1 generated inputHostCoverage per-call-site test for the retired roll input) |
| shots | 524 PNGs, 0 FAIL; host-copy pin OK (Obsidian 1.14.2); button host-leak OK (114 kinds); input host-leak OK (13 kinds); montage track widths OK; quick-trio containment OK |
| freeze | `freeze OK (260/260 …)`, exit 0 |
| parity | 0 gap(s), 0 undeclared, 16 declared, exit 0 |
| obsidian-camera modal captures (private Xvfb) | 6/6 OK incl. the new sideways-scroll check |

Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/39e9758e-af5c-4490-a2ab-3a5ccb229f53/scratchpad/battery-r1/
