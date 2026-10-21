# SC-468 implementer brief — round 1

## 1. Context loading

- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/decisions.md`.
  It is current state; quote from it, do not reinterpret.
- **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is here and in the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus`. Plugin repo:
  `/home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus/draw-steel-elements`, branch
  `sc468-conditions-pick-focus`, cut from `origin/develop` @ `ba20072`. Verify `pwd` / branch before any write.
  **Never edit under `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except writing your
  report into the ledger dir named in §4. Its modified `demo-vault/Welcome.md` and untracked
  `compendium-manifest.json` / `demo-vault/*.md` are Scott's live vault — expected, not yours, do not touch or flag.
- First step: `git -C <plugin repo> fetch origin && git -C <plugin repo> rebase origin/develop` — expect `origin/develop` = `ba20072`
  (if it moved, rebase onto it and say so in your report). **Every git command uses `git -C <absolute path>`**, never `cd X && git …`.
- Read `draw-steel-elements/AGENTS.md` (in your worktree) and the `dse-verify` skill:
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read-only for you).

## 2. Task

Ticket SC-468 (verbatim from the ledger): "pressing Enter/Space on a color swatch, a duration chip, or an effect chip
saves the choice, re-renders the list, and then sends keyboard focus to that row's cog button (`focusRowCog` in
`src/views/ConditionsModal.ts`, called from `setColor` ~L401 and the duration/effect setters ~L372/L430)."
"Likely fix: after the re-render, focus the newly pressed option in the same group instead of the cog (fall back
to the cog if it's gone). Check the e2e/lifecycle scenarios that assert focus after a pick."

Concretely:
1. Before changing anything, find out WHY the pick setters call `focusRowCog` (`git log -L` / `git blame` on those
   lines, the comment near L620, any test that pins it). If a prior ticket deliberately chose the cog for a reason
   that still holds (e.g. the options panel closes on pick, so the option no longer exists), STOP and return
   `STATUS: NEEDS_CONTEXT` with the evidence — do not override a deliberate design silently.
2. Otherwise: after a pick (swatch / duration chip / effect chip), focus the newly pressed option element in the same
   group in the re-rendered row — identify it robustly (by value/data attribute, not by DOM index alone). Fall back
   to the row's cog if the option is not present after re-render (e.g. the panel collapsed or the row is gone).
3. Pointer (mouse) picks: confirm what happens today and keep it sensible — moving focus to the chosen option is fine
   for both input types unless that would show a focus ring on mouse click where today none shows; report what you see.
4. Leave the other `focusRowCog` callers (add ~L257, remove ~L273) alone. Owner ruling (ledger): "Other focusRowCog
   callers (add L257, remove L273) keep their current behaviour unless the implementer shows they hit the same bug."
5. **Out of scope (dispatcher constraint, ledger, verbatim):** "SC-361 (swatch focus ring, same modal) is parked on
   Scott with no code yet; SC-356 (parked) restyles .dse-optchip — keep SC-468 to focus management, no swatch/chip CSS."
   No CSS changes at all.
6. Tests: TDD. Add jsdom tests that fail before the fix: for each of the three groups, a keyboard pick leaves
   `document.activeElement` on the chosen option (and it is the newly selected one, `aria-pressed`/selected state
   as the code expresses it); the fallback-to-cog path is covered. Update any existing test/e2e/lifecycle scenario
   that asserted cog focus after a pick, and say which in your report. If the e2e suite has a Conditions scenario
   area (e.g. COND-*), add or extend an e2e scenario that asserts focus stays on the picked option for at least the
   color swatch, following the suite's conventions (coverage pairs) — report the new coverage numbers.
7. Commit after each coherent step (message prefix `fix(conditions): SC-468 …`). No attribution trailers of any kind.
   Do not push, do not tag (never tag draw-steel-elements), do not run `just wt-finish`.

## 3. Gates — the full `dse-verify` battery, in its order

tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle (`npm run obsidian-lifecycle`), e2e (`npm run e2e`),
shots, freeze check, parity last. Expected at base `ba20072` (CURRENT block):

- tsc + lint clean
- jest **5260 passed / 1 skipped / 230 of 231 suites** + your new tests (fresh worktree reads one fewer passed and
  2 skipped until a shots run caches `visual-harness/dist/obsidian-app.css` — compare after shots)
- lifecycle **27/27**
- e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** (plus any scenario you add) — must end `0 failed`
- shots **572**, 0 FAIL
- freeze **`freeze OK (276/276 …)`** — this change is focus-only; any freeze delta is a finding to report, not to rebaseline
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

Footguns (all mandatory):
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus/draw-steel-elements -- bash -c 'cd <repo> && <cmd>'`.
  Devbox's sh wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures — run gates via a wrapper script FILE that
  records the exit code, output redirected to a log file.
- `npm ci` first if `node_modules` is missing or stale.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`
  is shared by every agent. Use ONLY a private subfolder `<scratchpad>/sc468-impl-r1-<your agentId or a random suffix>/`
  with uniquely named scripts and logs. Never a generic `gate.sh`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
  Run gates in the FOREGROUND (timeout up to 600000 ms); if a gate needs longer, split it, do not background it and wait.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc468-conditions-pick-focus/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*` etc.) or the shared `.superpowers/` dir — delete only paths you created and recorded.
- Freeze baseline `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` is read-only for you.
- Stale superproject pin can phantom-fail `token-coverage.test.ts` — diagnose per dse-verify before believing it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/sc468-impl-r1-report.md`.
It must OPEN with a ≤10-line executive summary. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
head sha, commit list, the root cause of the cog focus (who added it and why), each measured gate number vs expected,
tests added/changed (file paths), any existing assertion you changed and why, mouse-pick behaviour observed, and the
**absolute path of every evidence artifact** (report, gate logs). Separate sections `Drive-by fixes:` (made) and
`Follow-ups:` (left alone).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and
the question in your report — I see your completion notification and will resume you with the answer. If you ever do
send a message anyway, its FIRST WORD must be `SC-468:`.
