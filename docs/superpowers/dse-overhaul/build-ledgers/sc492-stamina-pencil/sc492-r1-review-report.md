# SC-492 r1 independent review — dse `d41d19d` on `d152ea4`, superproject `f9d8f23` on `00e2f37`

## Executive summary
- Verdict: **LAND-READY**. 0 HIGH / 0 MEDIUM / 1 LOW (a stale scenario count in a comment) / 6 INFO. Two of the INFO items are pre-existing bugs outside this ticket (owner to triage).
- Real Obsidian 1.15.0, my own probe scenarios, base bundle vs fix bundle. Base: pencil by mouse, Enter and Space each opened `["form","stamina"]`. Collapse opened `["stamina"]`, with `experimental` ON and OFF. Fix: pencil gives `["form"]` every time, collapse and expand open no modal, and a bar click still gives `["stamina"]`.
- New tests are not vacuous. With only the src fix reverted, 4 of the 6 new or changed jest tests fail. The 2 that pass are positive controls: a track click still opens the modal, and the updated listener-registration test. Branch G-S32 on the base bundle FAILs with `got ["form","stamina"]`, and it passes on the fix bundle.
- Survey re-done as a jsdom sweep: 30 element ids, every harness fixture, authoring ON and OFF, 2590 button×action rows. Only `stamina-bar` has an ancestor click listener above a chrome button. Pin was affected too. No keydown/keyup listener on any chrome ancestor. Nothing depended on the click bubbling.
- Gates at `d41d19d`: tsc/lint clean · jest **5774 passed / 1 skipped / 239 of 240** · lifecycle **33/33** · e2e **104/104 ok, 0 failed, 0 known-bug, 69/69 pairs** · shots plain = `HOST COPY DRIFTED` (environmental, 592 PNGs). With `HOME` set to a 1.14.4-only dir: rc 0, 592 PNGs, 0 FAIL, host-copy pin OK, button host-leak 113/678, text scale once 107256/214 · freeze **280/280 OK** · parity **0 / 0 / 24 DECLARED**.
- `FormModal.ts` is untouched. The diff is 4 files: `StaminaBarPanel.ts`, two jest files and `obsidian-lifecycle.mjs`. The CHANGELOG bullet is in the worktree superproject only, plain-worded and accurate.
- Working tree left as found (`git status --porcelain`: superproject ` M draw-steel-elements` before and after; plugin clean).

## Findings

### LOW-1 — the lifecycle header comment gives the wrong scenario count after the rebase
- `visual-harness/obsidian-lifecycle.mjs:54`: "SC-492 appends G-S32 (32 scenarios in all)". The file now has 33 `id: 'G-…'` scenarios (G-S28 came in with the rebase onto `d152ea4`), and the gate prints `33/33`.
- Scenario: the next person to add a scenario reads 32 and gets the count wrong. Documentation only.
- Fix: change it to "(33 scenarios in all)".

### INFO-1 — "Pin to sidebar" (experimental) had the same double-open; it is fixed, but no test names it
- jsdom sweep on base (`d152ea4` src): with authoring ON and OFF, clicking `pin:Pin to sidebar` on every stamina-bar fixture opened the Stamina modal as well as pinning. The fix stops it. In real Obsidian, Pin opens no modal, and the pinned sidebar copy behaves correctly: pencil `["form"]`, collapse `[]`, bar `["stamina"]`.
- The CHANGELOG's "the buttons in a Stamina bar's menu panel" already covers Pin. The report and tests name only the pencil and collapse.
- Optional: add a pin row to `test/dom/framework/chromeInsideStaminaBar.test.ts`. Not required.

### INFO-2 (pre-existing, out of scope; the owner may want a Backlog ticket) — in Live Preview the stamina-bar chrome panel cannot be clicked with the mouse
- Base and fix are identical. In Live Preview with authoring on, a real mouse click on the Edit pencil opens nothing, and the editor cursor lands on line 3, the blank line above the fence.
- `document.elementFromPoint` at the pencil's centre and at the collapse button's centre both return `div.cm-line.cm-active`. The panel hangs above the block's top edge (pencil bottom 231.6px, block top 232.6px), and CodeMirror's line paints over it.
- A JS `.click()` on the same pencil opens the form, and a bar click opens the Stamina modal. Only the overhanging panel is affected. This is the SC-169 "seated above the cluster plate" placement meeting Live Preview, not this branch.

### INFO-3 — `style: sheet` blocks never had this bug; SC-483 INFO-1's "including a `style: sheet` block" does not reproduce
- `renderStaminaBar` returns before building a bar when `style === 'sheet'` (`StaminaBarPanel.ts:98`). The view's anchor then falls back to root. Without a clickable bar there is no handler for the pencil's click to reach.
- Real Obsidian, base and fix: `style: sheet` and `style: Sheet` each render the notice with no bar, and the pencil opens `["form"]` only. The `style: default` control block in the same note opens `["form","stamina"]` on base and `["form"]` on the fix.

### INFO-4 — the guard's `closest` is not limited to the bar
- `StaminaBarPanel.ts:140`: `(evt.target as Element | null)?.closest?.('.dse-chrome')` would also match a `.dse-chrome` above the bar. Today only `mountChrome.ts:181` creates that class, and it holds just the toolbar's buttons, so no such ancestor exists. No failure is reachable.
- Optional hardening: `const c = (evt.target as Element | null)?.closest?.('.dse-chrome'); if (c && bar.contains(c)) return;`.

### INFO-5 — fix choice: guard vs `stopPropagation` — the guard is the right call
- The sweep shows exactly one exposed handler. The other listeners on chrome ancestors are the pipeline's click-shield `mousedown`/`pointerdown` capture listeners (`pipeline.ts:237-238`), which are on every root and have nothing to do with click.
- Stopping the click at the panel would also hide it from document-level listeners. The guard changes nothing else, and every other region of the bar still opens the modal (real Obsidian: cluster numbers, cluster left edge).
- Clicking the revealed panel's background (`div.dse-chrome`, between buttons) now does nothing. On base it opened the Stamina modal. That is correct: the panel strip is chrome. When the panel is hidden it lets clicks through, and the point resolves to `markdown-preview-sizer`, not the bar.
- Optional, owner's call: a permanent version of my sweep could become a jest invariant ("no chrome button's click reaches an ancestor click listener"), so a future element that seats chrome inside a clickable region fails CI.

### INFO-6 — landing bookkeeping
- The superproject branch sits on `00e2f37`. origin/main is now `21455cc`: 2 commits touching only `docs/handoffs/HANDOFF.md`. `git merge-tree` is clean. Rebase at land time.
- origin/develop is still `d152ea4`, so the Obsidian pin bump (SC-497) has not landed. Re-run shots after rebasing onto it, per the ledger.

## Probe results (brief §2)

1. **Real Obsidian (1.15.0, my scenarios R-default / R-sheet / R-off / R-livepreview, `DSE_LIFECYCLE_BUNDLE` = scratch base and fix builds):**

| Step | base d152ea4 | fix d41d19d |
|---|---|---|
| default block, mouse click on pencil | `["form","stamina"]` | `["form"]` |
| Tab from the preceding link (1 Tab reaches the pencil), Enter | `["form","stamina"]` | `["form"]`; focus returns to the pencil |
| Tab to pencil, Space | `["form","stamina"]` | `["form"]` |
| Tab order inside the block | pencil → Pin → Collapse → out | same; the bar is never a tab stop (SC-498, as ruled) |
| bar click (cluster numbers / cluster left edge) | `["stamina"]` | `["stamina"]` |
| revealed panel background click | `["stamina"]` | `[]` |
| collapse, then expand | collapse opens `["stamina"]` | `[]` / `[]`; the bar click after expand gives `["stamina"]` |
| Pin, then the sidebar copy's pencil / collapse / bar | — (base run cascaded after the collapse modal) | `[]`; `["form"]` / `[]` / `["stamina"]` |
| `style: sheet`, `style: Sheet` pencil | `["form"]` (no bar) | `["form"]` |
| `style: default` pencil (same note) | `["form","stamina"]` | `["form"]` |
| authoring OFF (experimental ON): items | pin, collapse, expand | same; collapse `[]`, bar `["stamina"]` |
| **experimental OFF** (shipped config): collapse | `["stamina"]` | `[]`; bar `["stamina"]` |

   The implementer's claim that collapse is broken in the shipped product is **confirmed** (experimental OFF, base). The pin step changed the note: it added `_dse_anchor: b00914`, which is the pin anchor working as designed. Every other step left the note byte-identical. No page errors.
2. **New tests on base** (src fix reverted, then restored): `Tests: 4 failed, 18 passed`. Failing: pencil, keyboard-style click (detail 0), collapse, and the kit chrome-click test. The 2 that pass are the track-click control and the updated "registers the click listener" test. G-S32 on the base bundle: `FAIL: mouse click on the Edit pencil: expected only the edit form, got ["form","stamina"]`.
3. **Other chrome / other elements:** jsdom sweep, 30 ids, all fixtures. The only ancestor click hit is `div.dse-stamina.dse-stamina--clickable`, 33 rows, all stamina-bar. Base vs fix: 33 rows differ (stamina pencil, pin and collapse no longer open the Stamina modal), and every other row is identical. Hero and initiative keep their chrome outside their bars (**confirmed**: no hit). The hero's own "Edit definition" sits in a non-clickable header.
4. **Authoring OFF:** bar behaviour unchanged (the bar opens the Stamina modal). The collapse fix also applies with authoring off.
5. **`FormModal.ts`:** untouched (`git diff --stat d152ea4..HEAD` = 4 files, none of them FormModal).
6. **Battery:** see the summary. Shots plain: `HOST COPY DRIFTED … obsidian-1.15.0.asar` after `chrome host-leak OK`, 592 PNGs. HOME→1.14.4: `host-copy pin OK`, `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (… 228 …)`, `text scale OK (1626 …)`, `text scale once OK (107256 … 214 loads …)`, `nested corner-radius OK`, 0 FAIL lines.
7. **CHANGELOG** (`worktrees/sc492-stamina-pencil/CHANGELOG.md`, commits `9152067` + `f9d8f23`): one bullet under Unreleased, in the same style as the neighbouring bullets. It says the collapse button opened the Stamina window (shipped) and that the pencil did so with the experimental authoring controls on. Both statements are accurate.

## Probe footnote
The first jsdom base sweep was invalid because a `main.js` left at the plugin root shadowed the src (the dse-verify "stale main.js" footgun). It was re-run with `main.js`/`styles.css` removed first, and the numbers above come from that run. The branch's own jest base-failure run is not affected: it imports `main` through the `^main$` mapper.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-review-r1/`)
- Gates: `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `e2e.log`, `shots-plain.log`, `shots-1144.log`, `freeze.log`, `parity.log`
- Base-failure: `jest-new-on-base.log`, `gs32-base.log`, `G-S32-base-d152ea4-FAIL.png`, `gs32-head.log`
- Real-Obsidian probes: `rv-head-exp1.log`, `rv-base-exp1.log`, `rv-head-exp0.log`, `rv-base-exp0.log` (scenario source `review-scenarios.mjs.txt`, spliced by `splice.py` into a temporary copy that is deleted after each run)
- jsdom sweep: `probe-head2.json`, `probe-base2.json` (source `zz-sc492-review-probe.test.ts`)
