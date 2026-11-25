# SC-682 r3 — implementer brief: rebase onto the moved base, three small folds, full battery

You are the implementer for SC-682 (you wrote r1; a fresh worker reading this must be able to do
the round from the files alone). Your final text goes to the ticket-owner (an agent), not a human.
**You never call the tracker (Linear).**

## 1. Context loading

1. Ledger (spec + rulings; read "Base moved" and "r2 findings — owner rulings"):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-decisions.md`
2. Prior rounds, same dir: `sc682-brief-r1-impl.md` (section 8 footguns apply unchanged — re-read
   them), `sc682-r1-impl-report.md`, `sc682-r2-review-report.md` (executive summary + LOW-1 + INFO-1
   + MEDIUM-2's last bullet).
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row`; plugin repo
   `draw-steel-elements` inside it, branch `sc682-ds-list-picked-row` @ `8b32ac9b` (base was
   `bb3a3d10`); superproject branch `sc682-ds-list-picked-row` @ `f67003ad`.
   Verify the absolute path before every write. Every git command is `git -C <absolute path>`.
   Never push, tag or release. No co-author / AI attribution in commits.

## 2. Step 1 — rebase (do this first)

SC-690 landed. Fetch inside the worktree clones, then:

- plugin: `git -C <plugin repo> fetch origin`, confirm `origin/develop` is **`a0e55f6b`** (if it
  moved again, use the new sha and say so), `git -C <plugin repo> rebase a0e55f6b`.
- superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row fetch origin`,
  confirm `origin/main` is **`0d6f4897`**, rebase the branch onto it. Its only commit is the
  workspace `CHANGELOG.md` bullet; the submodule pointer stays unstaged (` M draw-steel-elements`
  is expected; do NOT commit a pointer bump, and do not run `git submodule update` — it would move
  the plugin checkout off your branch).
- Expected conflicts: both `CHANGELOG.md` files (SC-690 added bullets in the same place). Keep
  both sides; the SC-682 bullet stays in the place the file's convention puts the newest entry.
  A conflict anywhere else (e.g. `e2e/driver/authoring.ts`, `e2e/README.md`): resolve only if it
  is a plain both-sides-added case, and list it in the report; anything that needs judgment →
  STATUS: NEEDS_CONTEXT.
- `npm ci` again if the rebase changed `package.json` / `package-lock.json`.

## 3. Step 2 — the three folds (owner rulings, quoted from the ledger)

> **MEDIUM-2, the `finally` part only: FOLD into r3.** `this.close()` moves into a `finally` so a
> throw from `insertBlock` cannot leave the list up (R1: "after any pick the list is closed"). The
> error still propagates; no stale-range guard (that is SC-693).

- `src/authoring/suggest.ts` `selectSuggestion`: `try { insertBlock(…) } finally { this.close() }`.
  Add one jsdom test: `insertBlock` (or the editor write under it) throws → `close()` was called
  exactly once and the error still reaches the caller. Red first (it fails on your r1 head).
- **Out of scope, do not add:** any check of the token / range before writing, any re-run of
  `onTrigger`, any change to `schemaSuggest.ts`. That is **SC-693** (Backlog).

> **LOW-1** (changelog bullets and the code comment name "Stamina bar and Skills" as if the full
> list; "first few milliseconds" is 40-80 ms): **FOLD into r3.**

- Plugin `CHANGELOG.md`, the workspace `CHANGELOG.md` in YOUR worktree
  (`/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/CHANGELOG.md`, never under
  `/home/scott/code/steelCompendium/workspace/`) and the comment in `suggest.ts`: the row stayed up
  "for some blocks, depending on the block and where the token was (Stamina bar and Skills on an
  empty line, for example)" — or drop the parenthetical; and "just after the pick" instead of "in
  the first few milliseconds" / "in the first moments". Keep the rest of the bullets. Reviewer's
  measurements are in its LOW-1 section.

> **INFO-1** (AUTH-S03 and AUTH-I40 still use `waitNoList()` after a `/ds` pick): **FOLD into r3**
> (`expectNoList()`)

- `e2e/specs/authoring/ds-suggest.e2e.ts` AUTH-S03 and `e2e/specs/authoring/insert-commands.e2e.ts`
  AUTH-I40: the `waitNoList()` directly after the `/ds` pick becomes `expectNoList()`. No other
  assertion in either test changes. Both must be green.

Commit each fold separately in the plugin repo (`fix(SC-682): …`, `docs(SC-682): …`,
`test(SC-682): …`); the workspace changelog wording in the superproject.

## 4. Step 3 — gates on the rebased head, `dse-verify`, in order

New CURRENT baselines (dse `develop` @ `a0e55f6b`, from the dispatcher): jest **14716 passed /
1 skipped** with the shots cache; lifecycle 64/64; e2e `OBSIDIAN-E2E done: 833/843 ok, 0 failed,
10 known-bug, coverage: 486/486 pairs`; shots 592, freeze 280/280, parity 0 / 0 / 24.

Expected on your head:

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: baseline + 8 (r1) + your new r3 test(s). With the shots cache that is 14724 + r3 delta /
  1 skipped; in this worktree WITHOUT the cache it reads one fewer passed and 2 skipped. State
  which case you measured and the delta arithmetic.
- lifecycle: 64/64 as the union of the seven `--only=` parts. Your r1 part 2 read 12/16 once under
  load (G-S11, G-S12, G-S33, G-S40) and 16/16 alone: a red part is re-run alone before it is
  believed; report both runs.
- e2e, full run: `OBSIDIAN-E2E done: 841/851 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`
  (833/843 + 8; the INFO-1 edits add no test).
- `styles.css`: sha256 on your head vs a clean `a0e55f6b` build (scratch `git worktree add` at an
  absolute path under your scratch folder; remove it by literal path afterwards). Identical → carry
  shots 592 / freeze 280/280 / parity 0/0/24 and report both hashes. Not identical → run shots,
  freeze check, parity (last).

Scratch folder for this round:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-impl-r3/`
(new unique log names; never reuse or read r1 logs as this round's result). Each gate is one
blocking foreground call with output to a log file; no `run_in_background`, no Monitor; no `rm`
with a variable or glob target; no `pkill` by pattern; devbox via
`devbox run -c <abs plugin dir> -- bash <script file>`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r3-fix-report.md`,
opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## 6. Return contract

Raw facts, no prose: STATUS (DONE | NEEDS_CONTEXT | BLOCKED); plugin head sha + the sha it is
rebased onto; superproject head sha + the sha it is rebased onto; conflicts met and how resolved;
the r3 commits (sha + subject); each gate's measured summary line; both `styles.css` hashes;
`git status --short` of both repos; the absolute path of every log and the report;
`Drive-by fixes:` / `Follow-ups:`. You cannot `SendMessage` me — need input → end with
STATUS: NEEDS_CONTEXT and the question; any message you do send must start `SC-682:`.
