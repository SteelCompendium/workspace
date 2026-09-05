# SC-191 implementation slice brief — TEMPLATE (owner fills §2 per slice from the spec)

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
   Branch `sc191-montage-overhaul`. Current tip: `<SHA>`. Tracked branch: `origin/develop`.
   **First:** `git fetch origin develop` inside that clone; expected tip `<DEVELOP-SHA>`. If
   it moved, `git rebase origin/develop`, then `npm ci` if `package.json`'s obsidian version
   changed, and report the new base sha. If the rebase conflicts, stop and report
   `STATUS: NEEDS_CONTEXT`.
5. The clone's `CLAUDE.md`, `docs/writing-blocks.md`, `docs/common-element-fields.md`.
6. Workspace-level files (DESIGN.md, CHANGELOG.md, docs/superpowers/…) live ONLY in your
   worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/<file>`
   — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. This slice

<SLICE NAME — spec §I slice N>

Scope: <spec sections this slice implements, by letter>.
Out of scope (do NOT touch, even if tempting): <list; cite any Backlog tickets filed>.
Acceptance criteria (from the spec, verbatim): <list>.

Scott's rulings that bind this slice, verbatim from the ledger:
<quote>

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
Expected numbers at dispatch (on `origin/develop` `<DEVELOP-SHA>`):
- tsc clean; lint clean
- jest: `<N>` passed / 1 skipped / `<S>` suites, **plus** your new tests
- shots: `<P>` PNGs (plus any new capture ids this slice adds), 0 FAIL, byte-identical
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

One commit per slice on `sc191-montage-overhaul`, message `SC-191 slice N — <what>`.
No co-author trailers, no AI attribution. Do NOT push. Do NOT touch the superproject
pointer. ⛔ Never create a tag or release on draw-steel-elements.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice<N>-report.md`,
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
