The shots gate passes again on Obsidian 1.15.0. Every in-run check prints OK, freeze stays 280/280 with no rebaseline, and nothing for you to decide. The branch is ready to land.

**What changed.** The harness keeps a copy of Obsidian's six button rules to check it against your installed Obsidian. I re-copied those rules from 1.15.0 and raised the minimum Obsidian version for that check from 1.14.0 to 1.15.0. 1.15.0 only respaced its CSS, for example `@media(hover:hover)` without the space and attribute values without quotes. No style values or selectors changed, so no screenshot pixels moved. Three comments were also corrected: two wrongly said the two Obsidian pins must always be bumped together, and one gave a wrong file size. Plugin code (`src/`) and tests are untouched.

**Checked independently.** A separate reviewer re-copied the rules from the 1.15.0 install and got the same six rules, byte for byte. It then re-ran shots and freeze and got the same numbers. On a machine that only has Obsidian 1.14.x, the check now reports "partial" and still passes.

**Two things found along the way, not fixed here:**
- The button host-leak check now skips 20 gallery buttons instead of 10. The base `develop` commit (d152ea4) already did this before the update, so an earlier landing caused it. Filed as SC-501 to confirm each skip is legitimate.
- Shots still prints a warning that its full copy of Obsidian's stylesheet is from 1.13.7. That warning predates this ticket, and SC-376 already tracks the deliberate bump.

**Which Obsidian each check uses** (documented, not aligned): the shots button-rule check uses the newest installed Obsidian (1.15.0). The shots full-stylesheet checks use the stored 1.13.7 sheet. Lifecycle uses the newest installed Obsidian (1.15.0). e2e uses its own pinned 1.14.4.

---
Mechanics: plugin branch `sc497-obsidian-115-pin`, `6576fd4` (re-extract + `PINNED_OBSIDIAN` 1.15.0) + `45dd1d1` + `907f55c` (comment fixes), base `develop` d152ea4.
Gates at 6576fd4: tsc and lint clean · jest 5769 passed / 1 skipped / 238 of 239 suites · lifecycle 32/32 · e2e 104/104 ok, 0 failed, 0 known-bug, 69/69 pairs · shots 592, 0 FAIL, rc 0 · freeze 280/280 · parity 0 GAP / 0 undeclared / 24 declared. 45dd1d1 and 907f55c are comment-only (node --check, lint, tsc rc 0; built styles.css and main.js byte-identical).
Shots lines: `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules … excluded, 0 unclassifiable)` · `button host-leak OK (113 kinds × 3 states = 678 comparisons)`, 20-record boundary · `modal button host-leak OK (10 scenarios / 9 classes / 38 kinds = 228 comparisons)`, 6-record boundary, no ALLOWLISTED line · `text scale OK (1626 …)` · `text scale once OK (107256 … 214 loads)`.
