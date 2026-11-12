# SC-602 r2 — implementation round (implementer)

## 0. Context loading (read first)
1. Ledger (binding; read Owner rulings and Rounds in full):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/decisions.md
2. Common gates/footguns brief (binding; every footgun applies):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-brief-common-gates-footguns.md
3. The design you build — read it in full, it is your spec:
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-r1-design-report.md
   (§3 = the design incl. five "Implementer adjustments", §4 = file footprint, §6 = test plan, §7 = risks), and the prototype diff
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-r1-prototype.diff
   (applies cleanly to 622b0904; start from it). Probe harness used in r1: `sc602-r1-probe.e2e.ts.txt`,
   `sc602-r1-probe-registry.e2e.ts.txt`, `sc602-r1-fixture-zz602-twins.md.txt`, `sc602-r1-run-probe.sh.txt` in the same dir.
4. Worktree /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save — dse at
   .../draw-steel-elements on branch `sc602-live-preview-focus-on-save`, HEAD `622b0904`. `git -C <dse> fetch origin` first; if
   origin/develop moved past 622b0904, rebase onto it and report the sha. Verify the branch before any write.
5. Workers never call the tracker (Linear) — not to read, not to post.

## 1. Task
Build the design in §3 of the r1 report, with all five implementer adjustments, plus the tests in §6. The owner accepted it as written
(ledger, "Owner rulings on r1"). Binding owner rulings, quoted from the ledger:
- "Scope: keyboard focus across an element's OWN save redraw in Live Preview, at the framework level (every persisted element: counter +, initiative actions, …). Reading view behaviour must not change."
- "Mouse behaviour unchanged: a mouse click never pulls focus into an element (SC-588/SC-609 rule). Restore only when focus was inside the redrawn block at the moment of the save."
- "SC-605 verdict NO … stays OUT of scope. No widening" — do not carry the quick-add text draft.
- "Real-Obsidian coverage goes in e2e … A lifecycle scenario only if e2e cannot express it" — r1 found none is needed; G-S104 stays unused.
- Do not touch `src/framework/host/ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `visual-harness/obsidian-lifecycle.mjs`
  (SC-607) or `src/views/ConditionsModal.ts` (SC-580). If you find you need one, STOP and return NEEDS_CONTEXT.

Steps:
1. Product code per §3 (new `src/framework/host/livePreviewFocusCarry.ts`; edits to `viewRegistry.ts`, `chrome/focusHandoff.ts`,
   `kit/controlFocus.ts`, `registerFrameworkElements.ts`). Include the funky-logic comment (render child released inside Obsidian's
   StateField, before the DOM update) at the top of the new file, cross-referencing `focusHandoff.ts` (SC-518). Commit.
2. jest per §6 (new `test/dom/framework/livePreviewFocusCarry.test.ts` + additions listed in §4), including: one-shot (an external
   edit after a successful claim takes nothing), disabled successor → root, `blockKey()` format pinned, twins no cross-talk,
   mouse/no-focus → nothing armed, Reading/sidebar roots never armed. Commit.
3. e2e per §6: `e2e/specs/initiative/focus-live-preview.e2e.ts` (INIT-L…), `e2e/specs/counter/counter-focus-live-preview.e2e.ts`
   (CTR-L…), `counter.inc` row in `e2e/manifest/counter.ts`, fixture `e2e/vaults/shipped/Counter/twins.md` + `e2e/README.md` table row.
   Scenario ids must be globally unique across `e2e/`; never a bracketed ticket id in a test title. Commit.
4. **Vacuity:** with the product files from step 1 reverted to 622b0904 (scratch copy or stash; restore and `cmp`-verify after), the
   new jest focus tests and the new LP e2e focus tests go red, the guard tests stay green. Report counts both ways.
5. **Probe (report-only):** an LP embed of another note (`![[Counter/…]]` inside a note open in Live Preview, keyboard + on the
   embedded counter): end state on base vs branch. Do not fix anything here; just report.
6. Docs: dse `CHANGELOG.md` entry under Unreleased, and the workspace entry in YOUR worktree's superproject
   `/home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save/CHANGELOG.md` (never the main checkout). User-facing
   wording, the SC-588/SC-609 shape: "In Live Preview, keyboard focus now stays on the button you pressed (or the control that
   replaced it) when the element saves and Obsidian redraws it; before, focus fell to the page about half a second later. A mouse
   click still never pulls focus into an element." Name what is not covered: the half-typed Malice quick-add draft is still lost on
   the save (SC-605); the Conditions window still closes when a write lands (SC-384). If an architecture doc in dse (`docs/`) already
   covers the LP host / focusHandoff, add a short paragraph there; otherwise the file comment suffices. Commit both repos (dse
   commit inside the submodule; superproject commit of CHANGELOG only — leave the dse pointer bump UNSTAGED, the dispatcher bumps it
   at landing).
7. Superproject: `git -C <worktree> fetch origin` and rebase its branch onto workspace `origin/main`; report the sha.

## 2. Gates (full battery per the common brief)
Expected: tsc/lint clean · jest 10715 + your new tests passed / 2 skipped (fresh; report the delta) · lifecycle 60/60 in the six
parts (no new scenario) · e2e `N/M ok, 0 failed, 4 known-bug, coverage: Y/Y pairs` with M = 284 + your new tests and Y >= 171
(the new `counter.inc` row adds a pair) · styles.css sha256 identical to a clean 622b0904 build → shots/freeze/parity carry
(skip them, say so).

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-r2-impl-report.md — opens with a
<=10-line executive summary: dse HEAD + commit list, superproject sha, every gate number, vacuity counts, embed probe result, any
deviation from the design (and why). Logs in your private scratch folder
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r2-implementer/ .

## 4. Return contract
Final text goes to the ticket-owner, not a human: raw facts (STATUS: DONE | NEEDS_CONTEXT, shas, numbers), no prose, plus the
absolute path of every evidence artifact. `Drive-by fixes:` and `Follow-ups:` listed separately.
