# SC-474 implementer brief — round 1

## 1. Context loading

- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/decisions.md`.
  It is current state; quote from it, do not reinterpret.
- Background (read-only): the SC-468 ledger and reports in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/`
  — especially `sc468-review-r1-report.md` (PROBE-06, the "add dropdown" note) — SC-468 just landed focus changes in this modal.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click`. Plugin repo:
  `/home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click/draw-steel-elements`, branch
  `sc474-conditions-dropdown-click`, cut from `origin/develop` @ `3480231`. Verify `pwd` / branch before any write.
  **Never edit under `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except writing your report
  into the ledger dir in §4. Its modified `demo-vault/Welcome.md` and untracked `compendium-manifest.json` / `demo-vault/*.md`
  are Scott's live vault — expected, not yours, do not touch or flag.
- First step: `git -C <plugin repo> fetch origin && git -C <plugin repo> rebase origin/develop` — expect `origin/develop` = `3480231`
  (if it moved, rebase onto it and say so). **Every git command uses `git -C <absolute path>`**, never `cd X && git …`.
- Read `draw-steel-elements/AGENTS.md` (in your worktree), `e2e/README.md`, and the `dse-verify` skill
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read-only for you).

## 2. Task

Ticket SC-474 (verbatim from the ledger): "With the \"Add condition\" dropdown open, clicking a row's cog or a colour
swatch sometimes does nothing: the dropdown collapses on mousedown, the modal shrinks and re-centres, and the mouseup
lands somewhere else, so the click misses its target." "Likely fix: collapse the dropdown on click rather than
mousedown, or keep the modal's height/position fixed while it collapses."

Owner ruling (ledger, verbatim): "Prefer a behaviour-only fix (defer the outside-close until the click/mouseup
completes) over a layout/CSS fix (overlaying the menu or pinning the modal height). Reason: no freeze/visual delta, no
taste call for Scott, and it keeps SC-186 HIGH-2's guarantees (mouse pick on a menu item still works; click-away still
closes; no focusout dependency). A CSS/layout route only if the implementer shows the behaviour route cannot work — then
STOP and report (it would need Scott's eye). No CSS on `.dse-swatch` / `.dse-optchip` under any route."

Owner ruling (ledger, verbatim): "The e2e workaround at `conditions-pick-focus.e2e.ts` L25-26 should go once the fix
lands (or a new e2e scenario must pin the mouse-click-with-dropdown-open path for both cog and swatch, failing before
the fix)."

Concretely:
1. **Reproduce first, in real Obsidian.** Write an e2e scenario (Conditions area, following the suite's ID and
   coverage-pair conventions — COND-E04 or whatever is next) that, with the Add dropdown OPEN, (a) mouse-clicks a row's
   cog and asserts the inline editor opened, and (b) with the editor open and the dropdown open, mouse-clicks a colour
   swatch and asserts the colour was written to the note file and the swatch is pressed. Run it on the unfixed code and
   record that it FAILS (log path). If you cannot make it fail on the unfixed code at all, STOP with
   `STATUS: NEEDS_CONTEXT` and the evidence (how many attempts, what the modal geometry did).
2. Read the SC-186 HIGH-2 comment block (`src/views/ConditionsModal.ts` ~L44-50, ~L138-155, ~L576-590) and `git log -L`
   that outside-close listener before changing it. Understand why it is `mousedown` at document level.
3. Fix (behaviour-only per the ruling): the outside-close must no longer collapse the menu before the click that
   triggered it reaches its target. E.g. note the outside mousedown and collapse on the matching `click`/`mouseup`
   (after the target's own handler), or equivalent. Must still hold: a mouse pick on a menu item (its own
   mousedown+preventDefault) still adds; a real click-away (incl. on empty modal space and outside the modal) still
   closes the menu; a mousedown inside the menu/input never closes it; a drag that starts outside and ends elsewhere
   does not leave the menu in a stuck state; right-click behaviour is unchanged from today; Escape (SC-431 consumer)
   unchanged; SC-468's focus-after-pick behaviour unchanged. Keep the change inside `ConditionsModal.ts` unless a shared
   helper genuinely owns this. Update the HIGH-2 comments so they describe the new mechanism truthfully.
4. Then remove the workaround in `e2e/specs/initiative/conditions-pick-focus.e2e.ts` (L25-26 note + the Escape that
   exists only to dodge this bug) if those tests still pass without it; if the Escape is also there for SC-431 coverage,
   keep it and just correct the note — say which.
5. jsdom tests (TDD): pin the ordering — with the menu open, a document mousedown outside does NOT collapse the menu
   synchronously; the following click does; a mousedown+click on a cog with the menu open runs the cog's handler AND
   ends with the menu closed. Existing SC-186 tests must stay green; if any asserts "mousedown outside closes
   immediately", change it and explain why in the report.
6. Commit after each coherent step (prefix `fix(conditions): SC-474 …`). No attribution trailers of any kind. Add a
   bullet to the dse `CHANGELOG.md` Unreleased section and to the workspace `CHANGELOG.md` `## Unreleased` — **the
   workspace-level file lives in YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click/CHANGELOG.md` — never under
   `/home/scott/code/steelCompendium/workspace/`**; commit it in the worktree superproject (do not bump the dse pointer
   there; landing does that). Do not push, do not tag (never tag draw-steel-elements), do not run `just wt-finish`.

## 3. Gates — the full `dse-verify` battery, in its order

tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle (`npm run obsidian-lifecycle`), e2e (`npm run e2e`),
shots, freeze check, parity last. Expected at base `3480231` (CURRENT block):

- tsc + lint clean
- jest **5336 passed / 1 skipped / 230 of 231 suites** + your new tests (a fresh worktree reads one fewer passed and
  2 skipped until a shots run caches `visual-harness/dist/obsidian-app.css` — compare after shots)
- lifecycle **28/28** (G-S1 drives ConditionsModal — watch it)
- e2e **`OBSIDIAN-E2E done: 85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`** plus your new scenario(s) — must end `0 failed`
- shots **572**, 0 FAIL
- freeze **`freeze OK (276/276 …)`** — this change is behaviour-only; any freeze delta is a finding to report, not to rebaseline
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

Footguns (all mandatory):
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click/draw-steel-elements -- bash -c 'cd <repo> && <cmd>'`.
  Devbox's sh wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures — run gates via a wrapper script FILE that
  records the exit code, output redirected to a log file.
- `npm ci` first if `node_modules` is missing or stale.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`
  is shared by every agent. Use ONLY a private subfolder `<scratchpad>/sc474-impl-r1-<random 4-char suffix>/` with
  uniquely named scripts and logs (prefix them with the suffix). Never a generic `gate.sh`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
  Run gates in the FOREGROUND (timeout up to 600000 ms); if a gate needs longer, split it, do not background it and wait.
- Lifecycle: set your own port, e.g. `DSE_LIFECYCLE_PORT=9291`, so a concurrent session's run cannot collide.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc474-conditions-dropdown-click/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*` etc.) or the shared `.superpowers/` dir — delete only paths you created and recorded.
- Freeze baseline `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` is read-only for you.
- Stale superproject pin can phantom-fail `token-coverage.test.ts` — diagnose per dse-verify before believing it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/sc474-impl-r1-report.md`.
It must OPEN with a ≤10-line executive summary. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
dse head sha + superproject head sha, commit list, the reproduction result on unfixed code (log path), the mechanism you
chose and why, each measured gate number vs expected, tests added/changed (file paths), any existing assertion you
changed and why, and the **absolute path of every evidence artifact** (report, gate logs). Separate sections
`Drive-by fixes:` (made) and `Follow-ups:` (left alone).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and
the question in your report — I see your completion notification and will resume you with the answer. If you ever do
send a message anyway, its FIRST WORD must be `SC-474:`.
