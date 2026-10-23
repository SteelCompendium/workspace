# SC-478 r7 report: rebase onto the 1.15.0 pin fix, shots/freeze/parity regate

## Executive summary
- dse head `2c61511` on origin/develop `907f55c` (SC-497; rebase clean, no conflict). Superproject head `a0b229c` on origin/main `8fafc7b` (CHANGELOG clean). Nothing pushed.
- Porcelain: dse empty; superproject ` M draw-steel-elements` (unstaged pointer).
- jest (`rm -f main.js styles.css` first): 5797 passed / 1 skipped / 239 of 240 suites, rc 0.
- shots: rc 0, 592 PNGs, 0 FAIL. `host-copy pin OK (… the host model is verbatim Obsidian 1.15.0; 18 further rules …)`; `button host-leak OK (113 button kinds × 3 states × dark/light = 678 comparisons …)` with a 20-record at-rest boundary; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states × dark/light = 228 comparisons)`; `text scale OK (1626 comparisons …)`; `text scale once OK (107256 comparisons over 214 loads …)` (the brief expected 104184 / 208: the count follows the 592-shot tree; same check, 6 more loads). `OBSIDIAN APP.CSS PIN DRIFT` warning present (expected). No DRIFTED, no ALLOWLISTED line.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`. parity: rc 0, `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- lifecycle and e2e NOT re-run: `obsidian-host-pin.mjs` is imported only by `shoot.mjs`, `fetch-obsidian-app-css.mjs` and `obsidian-light-island.mjs` (checked by grep); `obsidian-lifecycle.mjs` imports only node builtins and `e2e/` has no reference to the pin, shoot, light-island or fetch scripts. SC-497 states built `styles.css`/`main.js` are byte-identical, and no SC-478 code changed. Last results on the previous base (d152ea4, r6): lifecycle 33/33 on Obsidian 1.15.0, e2e 104/104 (0 known-bug, 69/69) on app 1.14.4.

## Details
- Rebase: dse 10 commits replayed over `907f55c` (SC-497 changed `styles-source.css`, `fetch-obsidian-app-css.mjs`, `obsidian-host-pin.mjs`, `obsidian-light-island.mjs`, `shoot.mjs`; none of SC-478's files). Superproject: one commit (CHANGELOG bullet) replayed over `8fafc7b`.
- Logs in scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`: `gate-jest11.{log,rc}`, `gate-shots11.{log,rc}`, `gate-parity11.{log,rc}`. Freeze was read directly from `check-freeze.sh <dse>/visual-harness/shots`.
