# SC-338 round 1 — implementer brief

## 1. Context loading

- Read FIRST: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/decisions.md`.
- Background evidence (read its executive summary + the SC-338-relevant part only):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc334-montage-cleanup/sc334-rereview1-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus`, repo `draw-steel-elements/`, branch
  `sc338-chip-focus`. **Verify `pwd` is inside that worktree before every write.** NEVER write under
  `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir above (the main
  checkout is shared state; another session's live vault changes sit in its draw-steel-elements).
  Workspace-level files (DESIGN.md, CHANGELOG.md, docs/) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus/…` — never under `…/workspace/`.
- First: `git fetch origin` INSIDE the worktree's draw-steel-elements and confirm the branch sits on
  `origin/develop` = `6c4f6aa` (already fast-forwarded). If origin/develop has moved, rebase onto it and
  report the new base sha.
- **You never call the tracker (Linear)** — not to read history, not to post. The ledger is your context.
- DSE tracks `develop`. Never touch DSE `main`. Never create a tag, release or RC. Never run `just deploy*`.
- Commit after every coherent step (nothing uncommitted through a gate). No AI attribution / Co-Authored-By in commits.

## 2. The task

Problem (from the ticket): `.dse-optchip` (bare `<button>` chips — montage "Log an action…" form Result row,
Conditions modal) has no plugin focus ring. A **pressed** chip shows no focus indicator at all (the Steel pressed
rule `styles-source.css` ~2107, `box-shadow: var(--dse-chip-bevel)`, outranks Obsidian's `button:focus-visible`
ring). An **unpressed** chip only gets Obsidian's host ring `rgb(85,85,85) 0 0 0 3px` (~1.7:1 vs chip, under 3:1).
Every other DSE control joins the shared kit focus-ring rule (`styles-source.css` ~14022–14065,
`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`).

Owner rulings, quoted from the ledger:

> - R1 scope: minimal fix — chips join the shared kit focus ring (`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`).
>   The ring must be visible on BOTH pressed and unpressed chips, and Obsidian's host `button:focus-visible`
>   box-shadow ring must not stack underneath it (mirror however the other plugin buttons already neutralize it).
>   Moving chips onto `kit/iconButton` is NOT in scope for round 1; implementer reports cost/fit as a Follow-up and the owner rules.
> - R2 the SC-334 camera skip for `modal-montage-edit` ("focused control draws no outline") must stop skipping —
>   the check must actually run on the montage form's focused chip.
> - R3 a visual change (focus ring on chips) -> Scott's eye; evidence = before/after crops of a keyboard-focused
>   chip, pressed + unpressed, dark + light, from real Obsidian where possible.

Concretely:

1. Add `.dse-optchip:focus-visible` to the shared kit focus-ring rule, with a short comment in the file's existing
   style (SC-338: why — pressed bevel box-shadow outranked the host ring; unpressed host ring under 3:1).
   Verify the `--dse-focus-ring` token resolves to a real value at every place a chip lives (the modal is outside
   an element root — see the SC-203 tail CORRECTION comment in that rule about the token being invalid outside the
   steel scope; the chips live in `.dse-modal`, so PROVE the token resolves there, in real Obsidian, don't assume).
2. Find out how the Obsidian host `button:focus-visible` box-shadow ring is kept off other plugin buttons
   (SC-205 host re-grounding; `assertBtnHostLeak` in `visual-harness/shoot.mjs`; `OBSIDIAN_HOST_BUTTON_CSS`).
   Make the focused chip show the kit outline ONLY — no grey host box-shadow ring stacked beneath, and the
   pressed chip's bevel intact. Also explain why the existing button host-leak sweep did not flag the chip's
   focus-visible host leak (is `.dse-optchip` in the gallery? exempted?) — if it is absent, add it so the sweep
   covers it.
3. Remove the SC-334 skip in `visual-harness/obsidian-camera.mjs` so `modal-montage-edit`'s focus-ring-inside-the-body
   check actually runs on the focused chip (if the skip is generic "no outline -> skip", it will simply stop
   triggering; confirm by the camera's own ok line). If the ring is clipped by the modal body, that is a real bug —
   report it, don't hide it.
4. Tests: add a unit/guard test per repo conventions pinning that `.dse-optchip` carries the shared focus ring
   (look at `kit-index.test.ts`'s tabindex-vs-ring guard and similar CSS guard tests — extend the right one).
5. Update `dse-verify`'s SC-334 camera note ("`modal-montage-edit` skips today because … (SC-338)") in YOUR
   worktree's superproject copy `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus/.claude/skills/dse-verify/SKILL.md`
   to reflect that it now runs. Add a `## Unreleased` bullet to YOUR worktree's `CHANGELOG.md`
   (`/home/scott/code/steelCompendium/worktrees/sc338-chip-focus/CHANGELOG.md`) in the existing style — user-facing wording
   ("Option chips in the montage and conditions dialogs now show a visible keyboard focus ring"). Commit these in the
   superproject worktree on branch `sc338-chip-focus` (do NOT bump the draw-steel-elements pointer — the dispatcher does that at landing).

### Evidence for Scott (required)

Real Obsidian, on a PRIVATE Xvfb + port (`DSE_CAMERA_DISPLAY`, `DSE_CAMERA_PORT`) — never Scott's `:1`.
Produce BEFORE (origin/develop `6c4f6aa`) and AFTER (your branch) crops of a **keyboard-focused** chip:
pressed chip and unpressed chip, dark and light — 8 crops. Tight crops (chip + ~24px margin, 2x scale is fine) and
one combined side-by-side grid PNG (labels in the image: "before"/"after", "pressed"/"unpressed", "dark"/"light";
never rely on color to tell cells apart). Also record, per cell, the computed `outline` and `box-shadow` of the
focused chip, and the measured contrast of the ring against the chip and against the modal ground.
Save everything under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r1/`.
If the real-Obsidian route is impossible, say exactly why and fall back to the harness, labelled as such.

## 3. Gates — `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for command shapes and footguns.
Full battery in order, against the worktree's draw-steel-elements. Expected numbers right now (base 6c4f6aa; SC-282
added tests, so jest may exceed these — report exact counts, base AND branch):

- tsc clean; lint clean exit 0
- jest: SC-334 landing was 3919 passed / 1 skipped / 202 of 203 suites; SC-282 added more — measure base first if
  unsure. `rm -f main.js styles.css` in the plugin root before `npx jest` (stale main.js shadow footgun).
- obsidian-lifecycle: `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0
- shots: 524 PNGs, 0 FAIL; `host-copy pin OK` (or PARTIAL — expected on some machines); `button host-leak OK (…)`
  — report the exact line; the kind/comparison counts may rise if you add the chip to the gallery.
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc338-chip-focus/draw-steel-elements/visual-harness/shots`
  -> expected `freeze OK (260/260 …)`. Focus is never captured at rest in print shots, so 0 frozen bytes should move.
  **If ANY frozen line moves: do NOT touch the baseline** — write `.superpowers/sdd/sc338-chip-focus/rebaseline.txt`
  (ready-to-apply hash lines) + before/after crops and report it.
- parity LAST: 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0
- real-Obsidian camera (`obsidian-camera.mjs`, private Xvfb+port): `modal-montage-edit` must print the
  `focus ring inside the body` ok line, NOT the skip.

Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc338-chip-focus/draw-steel-elements && <cmd>'`
with the gate command LAST, output redirected to a per-run unique file; never pipe a gate (`| tail` eats failures).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r1-impl-report.md`.
It MUST open with a ≤10-line executive summary. Then: commits (sha + subject, both repos), what the host-ring
neutralization mechanism is and why the sweep missed the chip, every gate's exact output line (base vs branch
where relevant), evidence file paths, `Drive-by fixes:` and `Follow-ups:` sections (include the kit/iconButton
fit assessment as a Follow-up). Do NOT tidy or delete anything in `.superpowers/` outside `sc338-chip-focus/` —
never `rm -rf` the shared `.superpowers/` dir.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas, measured numbers — no prose,
plus the absolute path of every evidence artifact and the report.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches, and a stale log from another branch will match. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
  Run every gate in the FOREGROUND; never background a gate and "wait for a notification" — it will not come.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the
  dispatcher, not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in
  your report. If you ever do send a message anyway, its FIRST WORD must be `SC-338:`.
