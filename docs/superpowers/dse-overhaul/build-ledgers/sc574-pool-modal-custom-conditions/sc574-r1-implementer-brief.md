# SC-574 r1 — implementer brief

## 1. Context

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc574-pool-modal-custom-conditions/decisions.md`
  (the ledger: spec, rulings, scope boundaries). It is the source of truth, not the tracker.
- **You never call the tracker (Linear)** — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc574-pool-modal-custom-conditions`.
  Code lives in its `draw-steel-elements/` submodule, branch `sc574-pool-modal-custom-conditions`,
  cut from dse `develop` at `6c7216e8`. First: `git -C <worktree>/draw-steel-elements fetch origin`
  and, if `origin/develop` moved past `6c7216e8`, rebase onto it (then `npm ci` if package.json's
  obsidian version changed). Verify `pwd`/paths before any write — **never write under
  `/home/scott/code/steelCompendium/workspace/`** except your report into the ledger dir above.
- Read `draw-steel-elements/AGENTS.md`, and the `dse-verify` skill at
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~290 KB:
  read it in parts — "The battery, in order", "Lifecycle and e2e notes", "THE exit-code footgun",
  "Current expected numbers").
- Prior art in the same modal (landed; ledgers in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`):
  SC-435, SC-572, SC-566, SC-567, SC-573. SC-572 is the closest (condition icons as keyboard
  buttons in this same `buildConditionIcons`).
- Main checkout dse dirt (`demo-vault/Welcome.md` modified, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. Task

Fix both gaps in `src/views/MinionStaminaPoolModal.ts` `buildConditionIcons` (around :625-680).
Spec, quoted verbatim from the ticket (via the ledger):

> 1. A custom condition (one that isn't a built-in Draw Steel condition) shows no icon in the
>    modal, so you can't see it or remove it there. The initiative tracker shows a fallback icon
>    for it (SC-186).
> 2. If the same condition appears twice as plain text in the note, one click removes both copies.
>
> **Expected:** custom conditions show the same fallback icon as the tracker, and one click
> removes one copy.

Requirements:

- (a) A condition the registry does not know (`getAnyConditionByKey` returns null at :642) must
  render as the same kind of button as a known one: same `condition-icon` class, the **same
  fallback icon the initiative tracker uses** for an unknown/custom condition (find it — grep the
  tracker's condition rendering; reuse a shared helper or constant if one exists rather than
  copying a string), an `aria-label` of `Remove <name>` using the best available display name
  (object entry's own name field if it has one, else the key), the `pool.condition` control stamp,
  color/effect applied for object entries exactly as for known ones, and keyboard/focus hand-off
  behaving the same as SC-572 built. A custom object entry's own `icon` field still wins over the
  fallback (mirror :652).
- (b) A click removes **exactly one entry — the clicked one, by position** — not every entry
  equal by value. Two identical plain strings: one click leaves one. Make sure removing the
  second of two duplicates removes the second (index-based), and that the focus hand-off index
  still lands correctly.
- Flip the two `test.failing` markers in
  `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:1107,1117` to plain `test`, and add any
  jest cases needed for: object-form custom condition with its own icon; custom condition color;
  removing the 2nd of two duplicates; duplicates of an object entry.
- e2e: add coverage in `e2e/specs/minion-pool/pool-conditions.e2e.ts` (and its manifest entry in
  `e2e/manifest/minion-pool-modal.ts`, following how existing scenarios are declared) for a
  custom condition shown + removed by click, and for one click removing one of two duplicate
  string conditions, asserting the saved note text. **Never put a bracketed ticket id (like
  `[SC-574]`) in a test title — the runner reads bracketed ids in titles as scenario ids.** Use
  the existing scenario-id scheme for that spec file.
- **Out of scope (ledger):** SC-592 — do not change the write-back format (strings becoming
  `{key: …}` objects). Do not touch the Conditions modal or the tracker. No new lifecycle phases;
  never extend G-S64.

Commit after each coherent step on the branch (conventional messages, e.g.
`fix(pool-modal): …`; no AI attribution trailers). Do not push.

## 3. Gates (dse-verify, full battery, in order) and expected numbers

Baseline at `6c7216e8`:

- tsc clean · lint clean
- jest **7191 passed / 1 skipped** (after a shots run; fresh worktree reads one fewer passed and
  2 skipped until shots caches `obsidian-app.css`). Expect passed to rise only by the cases you add.
- lifecycle **54/54** as five `--only` parts, each its own blocking foreground call:
  `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9);
  `G-S57 G-S62 G-S61 G-S56` (4); `G-S59 G-S49 G-S73 G-S77` (4). G-S56 stays last in its part.
  Report the union.
- e2e **`259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** — after your additions the
  ok and total rise by the scenarios you add; must still end `0 failed`, 6 known-bug, `Y/Y pairs`.
- shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 (expect unchanged)
- freeze 280/280 (expect unchanged; if any frozen byte moves, STOP and report — never touch the
  baseline)
- parity 0/0/24, last.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc574-pool-modal-custom-conditions/sc574-r1-implementer-report.md`.
It must open with a ≤10-line executive summary. Then: head sha, commit list, files changed, the
tracker's fallback icon you mirrored and where it comes from (file:line), every gate's summary
line verbatim, and two sections — `Drive-by fixes:` (made) and `Follow-ups:` (left alone).
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers),
no prose, plus the absolute path of every evidence artifact (report, gate logs).

## 6. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc574-pool-modal-custom-conditions/draw-steel-elements -- bash <script-file>`.
  Never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS`, and `| tail` eats
  failures: record exit codes from a script file, redirect output to a log, read each gate's
  summary line.
- Every git command as `git -C <absolute path>`; never `cd X; git …`.
- Run each gate as ONE blocking foreground call (tool timeout 600 s; split lifecycle into the
  five parts, e2e may need its own call). No `run_in_background`, no Monitor. If something must
  run in the background, poll its own log/exit file — never wait for a notification.
- Scratch: your own subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r1-impl/`
  with uniquely named scripts/logs. Use the Write tool for scratch files. Never key a wait-loop on
  a scratch filename or contents — the dir is shared and stale logs from other branches match.
- No `rm` with a variable or glob target; no `rm -rf` of `.superpowers/` or any `/tmp` glob.
  Delete only literal paths you created.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or
  command line is inside YOUR worktree.
- A worktree superproject pin can be stale: if `token-coverage.test.ts` fails, compare
  `docs/superpowers/dse-overhaul/D3-token-map.md` in the worktree vs main checkout and use
  `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy — not a code defect.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and
  the question in your report. If you message anyway, the first word must be `SC-574:`.
