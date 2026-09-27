# SC-231 r2: scoped re-review (delta 05e26ea..f229986)

## Executive summary
- **Verdict: LAND-READY.** Scott still has to sanction the 55-line freeze rebaseline. HEAD is `f229986`; `origin/develop` is still `6c4f6aa` (checked with ls-remote), so no rebase. The tree was clean before and after.
- **HIGH-1 fixed.** All 6 `statblock-kwusage-{text,grid,ledger}--steel-{dark,light}.png` have sha256 identical to origin/develop. Measured against 05e26ea, only those kwusage screen shots moved, and they moved back to base. The crest chips are byte-identical to 05e26ea.
- **MEDIUM-1 fixed.** The new real-renderer test fails with renderFeature.ts at 5bdef15 (the `<p>` stays nested) and passes at 05e26ea and at HEAD.
- **LOW-1 fixed.** Separators are now visually hidden (`position:absolute`, 1x1, `clip-path: inset(50%)`), have `tabIndex -1` and no focusables inside, and don't change the layout. The aria text is now "Keywords: Attack , Weapon", and copy-paste keeps the commas.
- **LOW-3 fixed.** The `~4442` pointer is gone. The raw-string keywords fold is 7 lines and has a test, which fails at 05e26ea and passes at HEAD. The CHANGELOG is accurate.
- **Freeze:** `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`, the same 55 names as rebaseline.txt, and `sha256sum -c rebaseline.txt` passes. Against origin/develop, 109 files changed: the 55 print files (exactly the rebaseline set) and 54 steel screen shots of Keywords-bearing cards.
- **Gates:** tsc and lint clean. jest 4005 passed / 1 skipped / 206 of 207 suites. The first full run hit 1 load flake in `sidebarInitiative`: load was 17, and the suite passes 11/11 in isolation. Lifecycle 6/6. Shots 524 ok, 0 FAIL. Parity 0/0/16.
- Findings: none blocking. Two INFO items below.

## Verification detail
- **HIGH-1** (`styles-source.css:8416-8448, 8479-8490, 8506-8511`). `--keywords` is back in the shared chip group and its light-mode twin. In crest mode only, the cell's box is reset (padding, border, radius, background), and `.dse-feature__kw` uses `font-size: inherit`.
  - Before-side: my r1 origin/develop sweep. Its 20 overlapping files match the stray `sc231-keyword-chips-baseline5` @ 6c4f6aa shots byte for byte.
  - sha256 results:

    | Shot | Hash (base = head) |
    |---|---|
    | text-dark | `fdee8e69…` |
    | text-light | `ec240481…` |
    | grid-dark | `df37420b…` |
    | grid-light | `cd93c2fe…` |
    | ledger-dark | `e5db90ba…` |
    | ledger-light | `0bbacef4…` |

    All six are IDENTICAL.
  - HEAD against 05e26ea, all 524 PNGs: exactly 5 files changed. They are `statblock-kwusage-grid--steel-{dark,light}`, `statblock-kwusage-ledger--steel-{dark,light}` and `statblock-kwusage-text--steel-light`, all back to base. `kwusage-text--steel-dark` never moved. Every crest capture (feature*, kit, statblock*, chrome*) is byte-identical to 05e26ea. So the chip look and layout didn't move with the fix.
- **MEDIUM-1** (`test/dom/elements/feature.test.ts:486-514`).

  | renderFeature.ts at | Result | Failing tests |
  |---|---|---|
  | 5bdef15 | 2 failed / 64 | real-renderer test ("Received: `<p>Attack, <a href="x">Weapon</a></p>`"); scalar test |
  | 05e26ea | 1 failed / 64 | scalar test only |
  | HEAD | 64/64 | none |

  The test also asserts the moved `<a>` is the same node and that the value holds exactly one link.
- **LOW-1** (`styles-source.css:8514-8533`). Playwright, crest mode, feature dark and light, kit dark, statblock dark:
  - Every separator is `display:block`, `position:absolute`, 1x1, `clip-path: inset(50%)`, `tabIndex -1`, with 0 focusables inside.
  - Chip x, width and height are unchanged: feature chips 79.4 and 88.4 wide, 36.9 tall, 8px apart. The page doesn't scroll sideways.
  - aria snapshot of the feature cell: `Keywords: Attack , Weapon`. For kit: link Melee, text ",", link Strike, text ", Weapon".
  - A selection copy of the cell gives `keywords\nattack\n,\nweapon`. The commas are there, but each flex item lands on its own line (INFO-1). Log: `sc231-r2rev-sepprobe.log`.
- **Raw-string fold** (`renderFeature.ts:464-479`). A bare string is wrapped as a one-entry array, and chipify splits it at the DOM level. Test: `feature.test.ts:521-529`. Any other non-array value behaves as it did before this change.
- **CHANGELOG.md:28-32.** "Grid/Ledger/Inline text look the same as before" is verified byte-identical. "Printed output moves by a sub-pixel amount at the Keywords line" is accurate.

## Findings
- **INFO-1:** in crest mode on screen, copy-paste gives `keywords\nattack\n,\nweapon`. That's the visually hidden key, then one line per flex item. The commas the ruling asked for are there, but it doesn't read as "attack, weapon". Normal flex behaviour; no action proposed. Print, text, grid and ledger copy `Attack, Weapon`.
- **INFO-2:** the new comment at `styles-source.css:8416-8421` points to `~8641`, `~8814`, `~8747` and `~8448`. The real lines are 8705 (kwUsage text), 8844 (L-6), 8782 (grid wash) and 8452 (crest block): approximate, 4–64 lines off. Cosmetic; fix only if touching the file again.
- **INFO-3 (site comparison, evidence d):** on the live site, the Type chip sits in the header ("MAIN ACTION" under SIGNATURE). In the plugin it's at the right end of the chip row. The plugin's link chips are underlined; the site's aren't. The plugin's chips are about 4px taller. All of this predates SC-231 or is outside it, and the chip-metrics item was DROPPED per the ledger.

## Gates (f229986, foreground)
| Gate | Result | Log |
|---|---|---|
| tsc / lint | clean | sc231-r2rev-tsc.log, sc231-r2rev-lint.log |
| jest | run 1: 1 failed (`sidebarInitiative` SC-288 undo test; load 16.96); isolated rerun 11/11; run 2: **4005 passed / 1 skipped / 206 of 207 / 3 snapshots** | sc231-r2rev-jest.log, -jest-sidebarInit-isolated.log, -jest-2.log |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed` | sc231-r2rev-lifecycle.log |
| shots | 524 ok, 0 FAIL, all host-leak / host-copy pin OK | sc231-r2rev-shots-1.log |
| freeze | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`; same name set as rebaseline.txt; `sha256sum -c rebaseline.txt` OK | sc231-r2rev-freeze-1.log |
| parity (last) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**` | sc231-r2rev-parity.log |

## Evidence (Scott-facing), `evidence-r2/`
- (c) `rev-freeze-feature-print-before-after-diff.png` (1360x1576) and `rev-freeze-statblock-kwusage-ledger-print-before-after-diff.png` (1180x872). Each shows BEFORE, AFTER, changed pixels in red, the diff amplified x12, and for feature a 7x zoom on the diff box. Each is labeled with its capture id.
- (d) `rev-site-vs-plugin-keyword-chips-dark.png` (1396x268). Live steelcompendium.io "Brutal Slam" (Melee, Strike, Weapon; slate) beside the plugin kit fixture's ability card (same three keywords) in steel-dark at f229986. Both are scaled to 88%.
- (e) `rev-feature-card-steel-dark-light-before-after.png` (1368x618). A 2x2 grid of steel dark and light, before and after, `feature` card at full width (top section).

## Housekeeping
- The stray worktree `sc231-keyword-chips-baseline5` was checked at 6c4f6aa, removed with `git worktree remove --force`, and its parent directory was removed. `git worktree list` now shows only `sc231-keyword-chips`.
- No commits. Scratch probes were reverted byte-clean. The ignored-file set is unchanged from the start.
