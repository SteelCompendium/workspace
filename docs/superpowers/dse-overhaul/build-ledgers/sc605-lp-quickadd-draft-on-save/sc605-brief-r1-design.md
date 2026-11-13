# SC-605 r1 — design + prototype round (reviewer role; no product commits)

## 0. Context loading (read first)
1. The ledger (spec verbatim, baseline, owner rulings — BINDING):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/decisions.md
2. The common gates/footguns brief (binding; every footgun applies to you, including the off-limits files):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-brief-common-gates-footguns.md
3. Prior art (read executive summaries first; bodies only where needed):
   - SC-602 design report — §1 trace (why an LP own save is a fresh mount, never an adoption), §3 the landed mechanism, and §5 the
     SC-605 sketch (your starting point):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc602-live-preview-focus-on-save/sc602-r1-design-report.md
     Its probe harness (reuse it): same dir, `sc602-r1-probe.e2e.ts.txt`, `sc602-r1-run-probe.sh.txt`, `sc602-r1-summarize.py.txt`,
     `sc602-r1-fixture-zz602-twins.md.txt`.
   - SC-602 ledger (landed decisions): same dir, `decisions.md`.
   - SC-589 ledger + r2 review (the draft, its rulings, probes PRB589-09/-11 that found this bug):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc589-malice-quickadd-lost-on-rebuild/
     (`decisions.md`, `sc589-r2-review-report.md`).
4. Worktree: /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save — dse at
   /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save/draw-steel-elements, branch
   `sc605-lp-quickadd-draft-on-save`, HEAD `711844f3` (= origin/develop at dispatch). `git -C <dse> fetch origin` first; if
   origin/develop moved, report the new sha (do not rebase — you commit nothing to this branch).
5. Workers never call the tracker (Linear) — not to read history, not to post.

## 1. Task

The bug, in the spec's words: "In Live Preview, type an amount and label into the Malice quick-add boxes, then press Advance round
(or the Malice + / - stepper). Both boxes keep what you typed for a moment, then empty about half a second later when the tracker
saves to the note." The behaviour the owner ruled (ledger, verbatim): "the new tracker shows the same quick-add draft (amount and
label) the old one held at the moment it was removed. Everything derived from the boxes (hint text, Add enabled state, validation
styling) is recomputed from it, exactly as SC-589 does in Reading view. The draft is still cleared only by a successful Add, and
never written to the note." Read every owner ruling in the ledger; the guards list there is the acceptance list.

Deliver a DESIGN, backed by real-Obsidian measurement and a working prototype, that an implementer (Sonnet) can build without
further judgment calls. Bounded steps — do not explore beyond them:

1. **Mechanism.** Start from SC-602 §5: capture at SC-602's point (`ViewRegistry.beforeRelease` + the CM ViewPlugin, keyed by
   `writtenBlockKey`), but armed by the own-write ticket, not by focus; a view-to-view seam on `ElementView`
   (e.g. `carryState?(): unknown` / `receiveCarriedState?(s: unknown)`); a claim by the next mount for that written block key.
   Resolve the open problem SC-602 named: at processor time the LP widget is detached, so the pane is unknown — choose between
   take-before-mount (key-only) and claim-after-connect + a partial update, and show which one keeps the two-pane and twin guards.
   Prefer the option that does not flash empty boxes before the draft appears (say whether it flashes; measure if you can).
   Say how the claim expires (one-shot, and a time bound) so a later outside redraw never resurrects a draft.
2. **Measure on base `711844f3`** in real Obsidian, Live Preview: (a) draft typed (amount + label), mouse click Advance round;
   (b) draft typed, mouse click the Malice + stepper; (c) draft typed, keyboard Enter on Advance round (focus is carried by SC-602 —
   does the draft come back too?). End state after write + settle + 1 s: both box values, hint text, Add enabled, activeElement.
3. **Prototype** (uncommitted edits in the worktree; revert to a clean `711844f3` tree before you finish and prove it:
   `git -C <dse> status --porcelain` empty). Re-measure (a)–(c), and the guards from the ledger:
   - outside edit (no own-write ticket) → nothing carried (base behaviour);
   - two trackers in one note → only the written one gets the draft (type a draft in BOTH with different values, press Advance in
     one: each keeps its own; the unwritten one is not redrawn or keeps its own — report which);
   - identical twin blocks → only the written twin;
   - the same note in two panes → the draft appears only in the pane it was typed in;
   - one-shot → type, Advance (carried), then Add (clears + saves) → empty after the redraw; then an outside edit → still empty;
   - text typed AFTER the click but before the save lands is carried (ledger: "the moment it was removed");
   - mouse → carrying never moves focus (activeElement unchanged vs base);
   - Reading view and the pinned sidebar tracker unchanged: run e2e INIT-M10, INIT-M11 and the SC-602 LP tests (INIT-L01..L08,
     CTR-L01..L05, CALL-L04) against the prototype;
   - focus-in-box case (ledger ruling 3): is it reachable (a save landing while the caret is in a quick-add box, e.g. mouse +
     stepper then click into the label and type within the 400 ms debounce)? If yes, measure base vs prototype: focus, value,
     caret. Say what restoring the caret costs.
4. **File footprint.** Every file the fix touches; flag any off-limits file (common brief) and give an alternative that avoids it.
5. **Test plan** for the implementer: jest cases (seam, capture, claim, every guard, vacuity mutations), e2e cases (LP variant of
   INIT-M10, a stepper case, the guards that e2e can express; spec file + manifest entry; scenario ids globally unique across
   `e2e/`; never a bracketed ticket id in a test title). Each new test must go red on base — say how you checked. Lifecycle only if
   e2e cannot express something (then G-S107, part 6) — say so explicitly.

Gates: you commit nothing, so no battery is required. But do run the full e2e once on the prototype and report its summary line
(expected at base: `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`), with probe specs parked outside `e2e/`.

## 2. Report
Write: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-r1-design-report.md
Opens with a <=10-line executive summary: chosen mechanism in one sentence, base vs prototype end state for (a)–(c) and each guard,
flash yes/no, focus-in-box verdict, file footprint + off-limits flag, prototype full-e2e line.
Then: the measurement tables, the design (numbered, file:line), the prototype as a diff saved to `sc605-r1-prototype.diff` in the
ledger dir (must apply cleanly with `git apply` on `711844f3`), the test plan, risks. Scratch probe specs/scripts saved in the
ledger dir with `.txt` suffixes and `sc605-r1-` prefixes. Your private scratch folder:
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r1-design/

## 3. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute
path of every evidence artifact. STATUS: DONE | NEEDS_CONTEXT (with the question). Report `Follow-ups:` (left alone).
If the report-file write is blocked by your harness, return the report inline.
