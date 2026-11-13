# SC-605 r2 — implementation round (implementer role, identity I1)

## 0. Context loading (read first)
1. The ledger (spec verbatim, baseline, owner rulings — BINDING; the r1 rulings section is your spec):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/decisions.md
2. The common gates/footguns brief (binding; every footgun applies to you, including the off-limits files):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-brief-common-gates-footguns.md
3. The accepted design (R1): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-r1-design-report.md
   and its artifacts in the same dir: `sc605-r1-prototype.diff` (src; applies with `git apply` on `711844f3`),
   `sc605-r1-proposed-jest.diff` (jest S01–S15 + initiative-matrix Q19–Q23), `sc605-r1-proposed-malice-live-preview.e2e.ts.txt`
   (e2e INIT-L09..L17), `sc605-r1-proposed-fixture-Initiative-twins.md.txt` (fixture `e2e/vaults/shipped/Initiative/twins.md`),
   and the probe harness (`sc605-r1-probe.e2e.ts.txt`, `sc605-r1-run-probe.sh.txt`, `sc605-r1-summarize.py.txt`).
4. Worktree: /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save — dse at
   /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save/draw-steel-elements, branch
   `sc605-lp-quickadd-draft-on-save`, HEAD `711844f3`. `git -C <dse> fetch origin` first; if origin/develop moved past `711844f3`,
   rebase onto it and report the sha (expected numbers then move — report both). Superproject:
   /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save (branch `sc605-lp-quickadd-draft-on-save`).
5. Workers never call the tracker (Linear) — not to read history, not to post.

## 1. Task

Build R1's design as committed code. Apply the prototype, the jest diff, the e2e spec and fixture, then read each line as if you
wrote it — you own it now. The behaviour (ledger owner ruling, verbatim): "in Live Preview, when the tracker's OWN save redraws the
block (…), the new tracker shows the same quick-add draft (amount and label) the old one held at the moment it was removed.
Everything derived from the boxes (hint text, Add enabled state, validation styling) is recomputed from it, exactly as SC-589 does
in Reading view. The draft is still cleared only by a successful Add, and never written to the note."

Required on top of the prototype:
1. **Funky-logic comments** at each non-obvious point: why capture is armed by the own-write ticket and not focus (the press is a
   mouse click; the outside-edit guard); why take-before-mount is safe (root connected after `prepareModel`'s awaits, measured
   16/16) and what happens if Obsidian's ordering changes (nothing carried = old behaviour, never a wrong draft); the 1500 ms
   expiry; the "empty capture drops an older carry" rule; the hidden `display:none` widget copy risk (R1 §6 risk 2).
2. **Doc note** in `draw-steel-elements/.repo-docs/architecture.md`, next to SC-602's `livePreviewFocusCarry` note: what
   `livePreviewStateCarry.ts` does, the `carryState()` / `receiveCarriedState()` opt-in seam on `ElementView`, and that only the
   initiative tracker opts in today.
3. **CHANGELOGs** (dse `draw-steel-elements/CHANGELOG.md` and the workspace one in YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save/CHANGELOG.md` — never under the main checkout):
   - a new bullet under `## Unreleased`, plain words, in the style of the SC-589 / SC-602 entries: in Live Preview a half-typed
     Malice quick-add (amount and label) now survives the tracker's own save (Advance round, the Malice - / + stepper, any other
     tracker action); still cleared only by Add; never written to the note. Say plainly that another copy of the same tracker (an
     identical twin block, or the same note in a second pane) still loses its own draft when this one saves (SC-620).
   - edit the stale sentences so they no longer claim Live Preview empties the boxes: dse CHANGELOG.md:31 (SC-602 entry, "Not
     covered: the half-typed Malice quick-add draft is still lost when the tracker saves (SC-605)") and :54 (SC-589 entry, "In Live
     Preview the boxes are still emptied when the note saves a moment later (SC-605)"); workspace CHANGELOG.md:15 and :101 (same two
     sentences). Replace with "Since SC-605 this holds in Live Preview too." (SC-589) and drop the SC-605 clause from the SC-602
     "Not covered" sentence (keep the SC-384 part). Line numbers are at `711844f3` / workspace `a11ad144`; find them by text.
4. **Vacuity.** Show each new e2e test that should be red on base IS red with the src change reverted (R1 lists L09–L13, L15, L17
   red on base; L14 and L16 are guards — show each goes red under its mutation as R1 did). Re-run R1's 13 jest mutations or an
   equivalent set and report red counts per mutation.
5. **Commits** (no pushes, no tags, no co-author or AI lines): feat (src), jest, e2e (spec + fixture + README row if `e2e/README.md`
   lists fixtures), docs (architecture.md + dse CHANGELOG); superproject: one CHANGELOG commit. Leave the dse pointer UNSTAGED in the
   superproject (the dispatcher bumps it at landing). Rebase the superproject branch onto current workspace `origin/main`
   (`git -C <superproject> fetch origin`) and report its sha; no interim pointer commits.

Do not widen scope: SC-620 (other copies' drafts) is out of scope. No CSS change; no lifecycle scenario (G-S107 unused) unless e2e
cannot express something — then STOP and return NEEDS_CONTEXT.

## 2. Gates (full battery per dse-verify; numbers in the common brief)
Expected on the branch: tsc (incl. `-p e2e`) and lint clean · jest about 10808 passed / 2 skipped fresh (10784 + 24; report the
exact delta) · lifecycle 60/60 in the six parts, each its own foreground call, walls reported (G-S91 flake: see common brief) ·
e2e `313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (304/307 + 9 new) · styles.css sha256 identical to a clean
`711844f3` build (`5e5ff488…2b27`) → shots/freeze/parity carry (say so); if it differs, STOP and return NEEDS_CONTEXT.

## 3. Report
Write: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-r2-impl-report.md
Opens with a <=10-line executive summary: dse HEAD + per-commit shas, superproject sha and its origin/main base, every gate line,
vacuity counts. Then: any deviation from R1's prototype and why, `Drive-by fixes:`, `Follow-ups:`.
Private scratch folder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r2-impl/

## 4. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute
path of every evidence artifact. STATUS: DONE | NEEDS_CONTEXT (with the question). If the report-file write is blocked by your
harness, return the report inline.
