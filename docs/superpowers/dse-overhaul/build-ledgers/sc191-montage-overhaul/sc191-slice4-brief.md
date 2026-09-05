# SC-191 slice 4 brief — the controls: chrome menu, sheet, per-cell edit/note, docs, final rebaseline

You are an `orchestration:implementer` worker. Your final text goes to the SC-191
ticket-owner (an agent), not a human: raw facts, no prose. **You never call the tracker
(Linear) — not to read history, not to post.** You cannot message the ticket-owner; if you
need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question at the top
of your report. If you ever do send a message anyway, its FIRST WORD must be `SC-191:`.

## 1. Context loading (in this order)

1. Ledger — read fully; struck-through lines are superseded and must NOT be built:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. **The implementation spec is your task definition:**
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-impl-spec.md`
   Read it fully. This slice implements the section named in §2 below and nothing else.
3. Prior slice reports in the same dir (`sc191-slice*-report.md`) if any exist.
4. Worktree — verify `pwd` before ANY write; never write under
   `/home/scott/code/steelCompendium/workspace/`:
   `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
   Branch `sc191-montage-overhaul`. Current tip: `0c8fc27` (slice 3 commit). Tracked branch: `origin/develop`.
   **First:** `git fetch origin develop` inside that clone; expected tip `69eb5f7`. If
   it moved, `git rebase origin/develop`, then `npm ci` if `package.json`'s obsidian version
   changed, and report the new base sha. If the rebase conflicts, stop and report
   `STATUS: NEEDS_CONTEXT`.
5. The clone's `CLAUDE.md`, `docs/writing-blocks.md`, `docs/common-element-fields.md`.
6. Workspace-level files (DESIGN.md, CHANGELOG.md, docs/superpowers/…) live ONLY in your
   worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/<file>`
   — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. This slice

**Slice 4 — the controls: chrome menu, sheet, per-cell edit/note, docs.** (spec §I, slice 4)

Prerequisite: slices 1–3 are committed (slice 3 commit `0c8fc27`); read
`sc191-slice2-report.md`, `sc191-slice3-report.md`, `sc191-review1-report.md` first.

**Machine condition and first action.** Obsidian self-updated to 1.14.0 on this machine;
the SC-205 host-copy pin (`PINNED_OBSIDIAN = '1.13.7'`) therefore aborts `npm run shots` at
its FINAL in-run assertion with `HOST COPY DRIFTED` — strictly AFTER every PNG is written, so
shots byte-identity (sha256 across two runs), `check-freeze.sh`, and `npm run parity` (which
never calls the pin) still produce real numbers; the button host-leak sweep behind the abort
does not run. The pin fix is SC-202's and lands on `origin/develop` first — NOT in this
branch. Your first action after `git fetch origin develop`:
- If `origin/develop` has moved past `69eb5f7` (SC-202 landed): `git rebase origin/develop`
  (`npm ci` if `package.json`'s obsidian version changed), then run the FULL battery once on
  the rebased tree BEFORE writing slice-4 code; expect `host-copy pin OK` against 1.14.0 and
  the button host-leak sweep OK. Record it as "slice-3 battery, post-rebase". Red for any
  reason other than the 2 expected montage freeze lines → `STATUS: NEEDS_CONTEXT`.
- If it has NOT moved: proceed on `69eb5f7`. Gate slice 4 the way slice 3 did (see
  `sc191-slice3-report.md` "The host-pin condition"): shots via plain bash/npm on PATH with
  output to files, sha256 across two runs, `check-freeze.sh`, parity; list exactly which
  in-run assertions printed OK before the abort. A post-SC-202 rebase + full re-gate round
  will follow; the freeze package you regenerate here will be regenerated once more then.
Never touch the pin, the host-copy listings, `obsidian-host-pin.mjs`, `shoot.mjs`'s host
model, or the asar. Devbox swallows `$?` even inside `bash -c` (adapter footgun §8.1): run
exit-code-sensitive steps via plain bash/node with output to files and read the files.

Scope (spec §I slice 4, verbatim):
> SC-169 chrome items replace the hand-rolled menu; `openManagedModal` sheet (new + correct)
> with the tier hint, the skill-reuse warning, the Note field and the roll affordance; the
> `montage-sheet-log` capture; §H docs and CHANGELOG.

Spec sections that define it: **§C** (persistence — every write goes through the framework
path; the eight integrity probes are YOUR acceptance test), **§D** (the sc169 element-menu
panel mapping — read `docs/superpowers/sc169-element-menu-panel-spec.md` in the clone and
mirror the shipped pattern fully; the sheet pattern the spec names), **§F** (the sheet
capture; regenerate `rebaseline.txt` + crops from THIS final tree), **§G** (remaining test
rows incl. a11y), **§H** (user docs — plain-language, non-technical; the dse changelog per
the clone's `CLAUDE.md`; workspace `CHANGELOG.md` `## Unreleased` bullet ONLY at
`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/CHANGELOG.md`).

Out of scope: any redesign of slices 1–3. Findings from review 1 already ruled on are
listed here: review-1 L-5, I-1, I-2, I-3, I-4, I-6, I-7 were DROPPED by owner ruling (see the ledger's "Owner rulings" section) — do not re-open them. Everything folded from review 1 landed in fix 1 (7d4451a) and was verified by re-review 1..

Acceptance criteria (spec §I, verbatim):
> *Acceptance:* the eight §C integrity probes pass in a real vault; a11y tests green; battery
> green; the rebaseline package still matches the final bytes (regenerate it here — hashes
> must come from the landing tree, not from slice 2).

Scott's rulings that bind this slice, verbatim from the ledger:
> "Edit button should allow quick notes for a test. For example, if a character makes a
> test and there is a consequence that the Director wants to take note of, they should be
> able to hit the edit button in the cell and type in something to remember later.  The
> footer portion that shows the outcome should list out these notes" (2026-08-28)

> "Still looks like there are a few padding issues on some of the header/footer rows.  Also
> the edit button in a cell needs some padding/margin" (2026-08-28)

> ""record" button functionality is fine, although it feels a bit out of place at the
> bottom… not sure there is a better home for it.  The "record" label on the button is
> really confusing though.  Lets change that to something else." (2026-08-29) — resolved:
> the button is `Log an action…`, at the bottom.

> "Some of the screenshots from this round had a "+" column to the left of the "tally"
> column - what is that, why do we need it, can we remove it?" (2026-08-29) — removed; the
> ⋯ menu carries "add a round".

> "Anything we are delaying … needs to get clearly documented in the site documentation.
> Clarity with what works and what doesnt is important so I dont need to be addressing a
> ton of 'why doesnt X work?'" (working-preferences, 2026-08-16) — if anything in the
> settled design ships deferred, the user docs say so in plain language.

> "i dont really want to go back-and-forth again.  Im ready  to get this ticket finished"
> (2026-08-30) — the spec is final; implement it, do not redesign it. If the spec is
> internally inconsistent or impossible on a point, STOP with `STATUS: NEEDS_CONTEXT` and
> name the lines; do not pick your own answer.

The approved look for the sheet is `sc191-r5-sheet-log-dark.png` / `-light.png` and
`sc191-r5-sheet-edit-dark.png`; the menu is `sc191-r5-menu-dark.png` (ledger dir).

Colorblind rule: Scott is colorblind. Shape and words carry every state; color only
reinforces. Name colors in prose in your report.

Scott's standing rules that bind every slice (from `docs/working-preferences.md`):
- "Stop trying to minimize work. We will always try to do the right thing, even if that
  means taking extra time to do it. Consistency is important." When an existing pattern
  (stamina-bar, negotiation, the sc169 menu panel, the Power Roll row) already solves a
  parallel problem, **mirror it fully** — do not approximate it with a local copy.
- "Anything we are delaying … needs to get clearly documented in the site documentation."
  If this slice ships something partially, the plugin's user docs get a plain-language
  "what works / what deliberately doesn't yet" note, written for non-technical users.
- Explicit read-only states: the pipeline stamps `data-dse-readonly` when it cannot
  persist (e.g. Obsidian canvas). Every new control must honor it — disabled affordance,
  shared badge CSS — never a control that looks live and silently drops the edit.

## 3. Tests

Tests ship with the code, per the repo's conventions (jest DOM tests under `test/dom/`,
unit under `test/unit/`). The spec §G names them. A test that cannot fail is not a test —
each new test must be shown red before the code that makes it green (say so in the report
with the failing assertion).

## 4. Gates — the full `dse-verify` battery, in its order, after the slice is complete

Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` —
read it for the exact command shapes, the freeze/parity rules, and the steel scoping rule.
Expected numbers at dispatch (on `origin/develop` `69eb5f7`):
- tsc clean; lint clean
- jest: 3593 passed / 1 skipped / 192 suites (post-slice-3, on 69eb5f7), **plus** your new tests
- shots: 506 PNGs (plus any new capture ids this slice adds), 0 FAIL, byte-identical
  across two runs
- freeze: baseline is 210 lines. **2 montage print lines are expected to move by design
  once the new look ships** — that is a sanctioned-rebaseline case, NOT a green. Report
  the exact FAIL lines. If this slice moves them, ship
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`
  (`<sha256>  <filename>` lines for ONLY the moved files, verified identical across 2 runs)
  plus before/after crops named `sc191-freeze-<id>-before.png` / `-after.png` in the ledger
  dir. **Never edit the baseline file itself.** Any frozen line that moves and is NOT a
  montage capture is a real regression — stop and report it.
- parity: 0 GAPs / 0 undeclared / 16 declared

Run gates via wrapper script files or with output redirected to a file, never piped
(`| tail` eats failures; devbox's `sh` wrapper eats `$?`). Read the tools' own summary
lines (jest's `Tests:` line, `freeze OK`, parity's totals) — never infer from exit code.

Integrity probes (mandatory for any slice that touches persistence — spec §C): run each and
record the result: content above/below the block survives a write; two montage blocks in
one note don't cross-talk; a hand-edited YAML value survives a re-trigger; a user-deleted
block regenerates cleanly; an old-shape block upgraded on write loses nothing.

## 5. Commit

One commit per slice on `sc191-montage-overhaul`, message `SC-191 slice 4 — menu, sheet, notes, docs`.
No co-author trailers, no AI attribution. Do NOT push. Do NOT touch the superproject
pointer. ⛔ Never create a tag or release on draw-steel-elements.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice4-report.md`,
opening with a ≤10-line executive summary, then: base sha and commit sha; every gate's
measured numbers vs expected; the freeze FAIL lines (if any) and the rebaseline.txt path;
integrity probe results; `Drive-by fixes:` (made — obviously correct, local to a touched
file, cannot move a gate baseline) and `Follow-ups:` (left alone) as two separate lists;
paths of every PNG/log you produced. If the report-file write is blocked by your harness,
return the report inline.

## 7. Footguns

- Go/Node/Python are NOT on PATH — `devbox run -- bash -c 'cd <clone> && <cmd>'`.
- `npm ci` after any rebase that changed `package.json`'s obsidian version.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents.
  **Never background a gate and wait for a notification** — it never comes. Run it in the
  foreground with output to a file, or poll the process's own log.
- Never key a wait-loop on a scratch filename or its contents; scratch is shared across
  sessions/branches. Use per-run unique paths under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`.
- If `token-coverage.test.ts` goes red on a token you did not touch, compare the worktree
  superproject's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's
  copy (`grep -c` the token in both) — a stale superproject pin is not a code defect;
  clear it with the test's `DSE_TOKEN_MAP_PATH` override pointed at the main checkout copy
  and say so in the report.

## 8. Return contract

Final text: `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, base sha, commit sha, report path,
the executive summary verbatim, each gate's numbers, freeze FAIL lines + rebaseline.txt
path (or "none"), integrity probe results, and every artifact path. No prose beyond that.
