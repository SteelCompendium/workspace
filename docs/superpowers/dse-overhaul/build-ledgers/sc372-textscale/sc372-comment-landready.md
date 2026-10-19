The three text-size settings (Small, Large and Control text size) now change the text in cards. Before this fix all three did nothing. At default settings nothing looks different, and no frozen screenshot moved. This is ready to land; nothing is needed from you unless an AFTER image below looks wrong to you.

**Small text size at 120%** — before (develop) on the left, after (this branch) on the right. Labels such as ABILITY, DISTANCE and TARGET, and the power-roll tier badges, are 20% bigger. Body text is unchanged. The "12-16" badge stays on one line.

{{IMG:sc372-small-120.png}}

**Large text size at 120%** — card names, band titles, stat numbers and the ability keyword and action chips (MAGIC, MELEE, MAIN ACTION, LEADER, EV 20) are 20% bigger. The chips follow Large because they are slightly above body size; that was decided when the size roles were set up, and the setting's help text now names them. The card names wrap onto two lines here only because this capture is narrow: at 120% a name like "Human Bandit Chief" wraps below roughly an 800px-wide pane, against 660px at 100%. Nothing overflows.

{{IMG:sc372-large-120.png}}

**Control text size at 120%** — button, stepper and tab text is 20% bigger. Control size never changes print, as the setting's help text says.

{{IMG:sc372-control-120.png}}

**What was wrong.** The setting was written onto each card, but the size tokens were computed once at the page level, so every card kept the 100% value. The tokens are now computed on each card and each plugin modal.

**A second problem the fix exposed, also fixed here.** Some small text sits inside other small text (the tier badges, the malice log heading, montage round headers). Once the setting worked, that text got it twice: 144% instead of 120%, and the "12-16" badge wrapped. Each setting now applies exactly once.

**Split out:** SC-422 (Backlog). A few surfaces sit outside any card or plugin modal and still ignore the Small/Control settings. They are the Compendium search hints (ships in 7.0.0), the settings preview caption, and the sidebar header (experimental). This was already true before this ticket. Fixing it needs a call on whether plugin chrome should follow these settings.

---
Mechanics
- dse branch `sc372-textscale` @ 1a4c6d3 on develop 1640ed0 (gates measured at 6737031; 1a4c6d3 adds only a CHANGELOG wording fix); superproject docs commit 51e5d8d (D3-token-map).
- Gates: tsc/lint clean · jest 4732 passed / 1 skipped · lifecycle 25/25 · e2e 59/71 ok, 0 failed, 12 known-bug, coverage 47/47 · shots 572, 0 FAIL · new in-run gates `text scale OK (1146 comparisons)` and `text scale once OK (102,969 comparisons over 199 page loads)` · freeze 276/276 (0 frozen bytes moved) · parity 0 GAPs / 0 undeclared / 24 declared.
- Both new gates were shown to fail with the fix removed. Pipeline: implement → independent review (found the double-scaling) → fix → scoped re-review (land-ready) → wording folds + rebase → scoped check.
