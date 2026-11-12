# SC-602 r1 — design + probe round (reviewer role; no product commits)

## 0. Context loading (read first)
1. The ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/decisions.md
   (spec verbatim, baseline, owner rulings — binding).
2. The common gates/footguns brief (binding; every footgun applies to you):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-brief-common-gates-footguns.md
3. Prior art (read executive summaries first, bodies only where needed):
   - SC-588 review r2, MEDIUM-1 (the finding that filed this ticket; probes ZZ-Q01, ZZ-Q03, ZZ-P04, ZZ-P15):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc588-initiative-focus-after-rebuild/sc588-r2-review-report.md
   - SC-588 ledger: .../build-ledgers/sc588-initiative-focus-after-rebuild-ledger.md (controlFocus.ts helpers).
   - SC-518 ledger + dir: .../build-ledgers/sc518-form-save-focus-ledger.md and sc518-form-save-focus/ — SC-518 restored focus
     after a block edit form Save INCLUDING Live Preview (keyboard), via `src/framework/chrome/focusHandoff.ts`
     (`armChromeFocus` / `claimChromeFocus`). Find out how it survived the LP redraw — it is the closest working precedent.
   - SC-589 ledger (.../sc589-malice-quickadd-lost-on-rebuild-ledger.md) MEDIUM-1: the LP draft loss (now SC-605), same cause.
   - SC-609 ledger (.../sc609-roster-click-focus-ledger.md) INFO I-1: LP focus lost ~435 ms after a roster click.
4. Worktree: /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save — dse at
   /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save/draw-steel-elements, branch
   `sc602-live-preview-focus-on-save`, HEAD `622b0904` (= origin/develop at dispatch). `git -C <dse> fetch origin` first; if
   origin/develop moved, report the new sha (do not rebase — you commit nothing to this branch).
5. Workers never call the tracker (Linear) — not to read history, not to post.

## 1. Task

The bug, in the spec's words: "In Live Preview, a keyboard user who presses a button inside a DSE element loses focus to the page
body about half a second later. The element saves its change to the note, Obsidian redraws the block with a new root, and the
focused button is gone." Fix shape named in the spec: "carry the focused control's `data-dse-control` id + instance key across the
widget redraw (SC-588's `src/framework/kit/controlFocus.ts` helpers) at the framework level, so every element benefits."

Deliver a DESIGN, backed by real-Obsidian measurement, that an implementer (Sonnet) can build without further judgment calls.
Bounded steps — do not explore beyond them:

1. **Trace the path.** From an element's `persist()` / `rebuildAndPersist` (`src/framework/view.ts`, `src/framework/pipeline.ts`)
   through the Live Preview host (`src/framework/host/LivePreviewBlockHost.ts`, `livePreviewReconcile.ts`,
   `livePreviewScrollHold.ts`, `remountReused.ts`, `replugRemount.ts`, `adoptView.ts`, `viewRegistry.ts`) to the moment the
   CodeMirror widget is redrawn with a new root. Answer: why does Reading view keep focus (adoptView captures and restores it)
   while Live Preview does not — is the LP redraw a fresh mount, or an adoption that skips focus? Where is the one place a
   framework-level capture/restore belongs? file:line for each claim.
2. **Measure on base `622b0904`** in real Obsidian, Live Preview, keyboard only: (a) `ds-counter` + by Enter, (b) initiative
   Advance round by Enter, (c) one more element of your choice with a persisted keyboard control (e.g. stamina or montage).
   For each: the timeline (focus on control → write lands → `document.activeElement` after settle + 1 s). Use whatever probe
   harness SC-588 r2 used (e2e driver `--only` with a scratch spec, or a scratch lifecycle scenario — keep scratch specs OUT of
   committed tree and never put a bracketed ticket id in a test title).
3. **Prototype the fix** in a scratch copy or uncommitted edits in the worktree (revert to a clean `622b0904` tree before you
   finish, and prove it: `git -C <dse> status --porcelain` empty). Re-measure (a)–(c) with the prototype. Also measure the guards:
   - mouse: click the counter + with the mouse (focus was outside the block) → focus must NOT be pulled into the block after the
     save (owner ruling: "a mouse click never pulls focus into an element");
   - focus moved away before the save lands (Tab out of the block, or click into the note text, within the ~400 ms debounce) →
     the save must not steal focus back;
   - two blocks in one note (twins / two counters): the save of block A never moves focus into block B;
   - an external edit / revert (not the element's own save) → no focus claim (rebuild fresh, as today);
   - a modal open from the element while the write lands (SC-384 family; SC-384 is a known e2e bug — do not fix it, just report
     whether the prototype changes its behaviour).
   - Reading view: unchanged (run the SC-588 INIT-F e2e tests + SC-609 INIT-F13/F14 against the prototype).
4. **SC-605 verdict.** SC-605 = "Live Preview: a half-typed Malice quick-add is still lost when the tracker saves" (same cause).
   Does the same mechanism carry a text draft (SC-589's draft-carry code path) cheaply? Answer YES-cheap (name the extra lines/files)
   or NO (why). Do NOT build it beyond a measurement.
5. **File footprint.** List every file the fix touches. Flag explicitly if it needs ANY of: `src/framework/host/ReadingModeBlockHost.ts`,
   `hoverLinks.ts`, `lineMap.ts`, `visual-harness/obsidian-lifecycle.mjs` (parallel owner SC-607 is editing them) or
   `src/views/ConditionsModal.ts` (SC-580). If it does, give an alternative that avoids them, and its cost.
6. **Test plan** for the implementer: jest cases (unit-level on the capture/restore, plus the guards above), and e2e cases — the
   spec asks for "a Live Preview variant of the SC-588 INIT-F tests and a counter + button case". Name the e2e spec files and
   manifest entries to add, the new scenario ids (check they are globally unique across `e2e/`), and how a test opens a note in
   Live Preview (does the e2e driver already support LP? if not, the cost of adding it). Vacuity: each new test must go red on
   base — say how you checked or how the implementer should.

Gates: you commit nothing, so no battery is required. Report the probe harness commands so the implementer can re-run them.

## 2. Report
Write: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/sc602-r1-design-report.md
Opens with a <=10-line executive summary: root cause in one sentence (file:line), chosen mechanism in one sentence, base vs prototype
end-state per probe (a)–(c) and each guard, SC-605 verdict, file footprint + SC-607/SC-580 conflict flag, e2e LP driver support yes/no.
Then: the trace, the measurement tables, the prototype as a diff saved to
`sc602-r1-prototype.diff` in the ledger dir, the test plan, risks. Scratch probe specs/scripts saved in the ledger dir with `.txt`
suffixes and `sc602-r1-` prefixes.

## 3. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute
path of every evidence artifact. STATUS: DONE | NEEDS_CONTEXT (with the question). Report `Follow-ups:` (left alone).
