# SC-260 round 1 — implementer brief

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/decisions.md`
  (the ledger — it is the current-state source of truth; owner rulings O-1..O-4 below are quoted from it).
- **Workers never call the tracker (Linear)** — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc260-noop-write`. The repo you change is
  `/home/scott/code/steelCompendium/worktrees/sc260-noop-write/draw-steel-elements`, branch
  `sc260-noop-write`, cut from `develop` @ `c78a06b`. First: `git -C <that path> fetch origin`
  and confirm `origin/develop` is still `c78a06b`; if it moved, `git -C <path> rebase origin/develop`
  and say so in your report (run `npm ci` if `package.json` changed).
- **Never touch the shared main checkout** `/home/scott/code/steelCompendium/workspace/` (except
  writing your report into the ledger dir). Verify `pwd` before any write. Use
  **`git -C <absolute path>`** for every git command — never `cd X; git …` (a failed `cd` once put
  a worker's git commands in the main checkout).
- Devbox: Node/npm are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc260-noop-write/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc260-noop-write/draw-steel-elements && <cmd>'`.
  Devbox eats `$?`/`$PIPESTATUS` and piping a gate through `tail` masks failures — redirect gate
  output to a file and read the file.

## 2. The task

`ReadingModeBlockHost.replaceSource` (`src/framework/host/ReadingModeBlockHost.ts`, ~L352-420)
pins the reading-view scroll (`this.scrollPin?.pin(this.containerEl)`, SC-198) BEFORE calling
`vault.process`, unconditionally. When the serialized body is byte-identical to what is on disk,
Obsidian no-ops the write (no `modify`, no rebuild), so the pin then holds phantom scroll space at
the bottom of the note for the full `PIN_TTL_MS` (2500 ms; see `previewScrollPin.ts`).

Owner rulings, verbatim from the ledger:

> O-1. **Do NOT add a cached-body shortcut that skips `vault.process` entirely** (e.g.
> `if (newSource === this.knownBody) return true`). `knownBody` is a cache; if a body edit
> landed on disk that this host has not observed yet, the shortcut would silently drop a real
> write. Obsidian already no-ops an identical `vault.process` result (SC-198 experiment 5:
> no `modify`, no rebuild), so the read + diff inside `process` is the cheap, correct
> equality check — it already exists as `changedContent` (ReadingModeBlockHost.ts ~L402).
>
> O-2. **The real cost of a no-op write today is the SC-198 scroll pin.** `replaceSource`
> calls `this.scrollPin?.pin(this.containerEl)` BEFORE `vault.process`, unconditionally. On a
> no-op write no rebuild comes, so the pin holds phantom scroll space at the bottom of the
> note for the full `PIN_TTL_MS` (2500 ms). Fix: pin only when the write will actually change
> the file — i.e. decide inside the `vault.process` callback, after computing `next`, and pin
> only when `next !== content` (still synchronously before Obsidian writes, so it still
> precedes the rebuild). The `section` guard stays.
>
> O-3. Return value unchanged: a no-op write still resolves `true` (the disk already holds the
> requested body). Claim-ticket drop on `!changedContent` stays as is.
>
> O-4. `SidebarBlockHost.replaceSource` has no scroll pin; leave its behaviour alone unless the
> implementer finds a concrete no-op cost there (report it, don't fix it).

Implementation notes:
- Keep the `section` capture where it is (before `vault.process`, nothing async in between); move
  only the `pin` call into the callback, gated on `section && next !== content`. Update the
  SC-198 comment beside it to say why it is inside the callback now (SC-260).
- If a pin call inside the callback could throw, it must not abort the write — check what
  `PreviewScrollPin.pin` can throw (it should be fail-safe by construction; confirm).
- Tests (jest, follow the existing host test files' conventions — find them with
  `grep -rln "ReadingModeBlockHost" tests src --include=*.test.ts`):
  (a) a no-op `replaceSource` (body identical to disk) does NOT call `scrollPin.pin`, still
      resolves `true`, and still drops the claim ticket;
  (b) a changing `replaceSource` DOES call `scrollPin.pin` exactly once, and the pin happens
      before the vault's write lands (order assertion against the mock vault);
  (c) a missed/aborted target (`'miss'` / `'abort'`) does not pin.
  Make sure (a) fails on the unmodified code (show the red run in your report).
- CHANGELOG: if `draw-steel-elements/CHANGELOG.md` has an `## Unreleased` section with bug-fix
  bullets in the same style as recent SC entries, add one plain-language bullet (e.g. a save that
  changes nothing no longer leaves extra blank scroll space at the bottom of the note for a
  couple of seconds). Otherwise skip and say so.
- Commit after each coherent step on branch `sc260-noop-write`. Conventional message, e.g.
  `fix(host): pin preview scroll only when replaceSource changes the file (SC-260)`. No
  co-author/AI attribution lines in commit messages. Do not push.

Out of scope: any change to `SidebarBlockHost`, `previewScrollPin.ts` TTL, or the claim-ticket
logic. No tags, no releases, ever.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the
battery section and the footguns) and run the whole battery in order. Expected at base
`c78a06b` (CURRENT block of that skill):

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **4787 passed / 1 skipped / 227 of 228 suites** at base → expect 4787 + your new tests
- lifecycle (`npm run obsidian-lifecycle`) **25/25**
- e2e (`npm run e2e`) **`OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`** (required to land)
- shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**

(Before jest: `rm -f main.js styles.css` in the plugin root per the skill.) Any deviation: report
the measured number and your diagnosis; do not rebaseline anything — agents never touch
`.superpowers/sdd/freeze-baseline.sha256`.

Footguns:
- **Run every gate in the FOREGROUND**, output redirected to a per-run unique file (e.g.
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-r1-<gate>-$(date +%s).log`),
  then read that file. Never background a gate and wait for a notification — it never comes.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog
  kills silent agents. Use a long Bash `timeout` (max 600000) and, for e2e/shots, split into
  calls that stay under it if needed.
- **Never `pkill`/`killall` by a bare pattern** — concurrent efforts run the same commands.
  Kill only by PID whose command line contains `worktrees/sc260-noop-write/`.
- Never `rm -rf` the shared `.superpowers/` dir; touch only `.superpowers/sdd/sc260-noop-write/`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-r1-implement-report.md`.
It must open with a ≤10-line executive summary (verdict, head sha, every gate number). If the
report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS
(DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT), branch + head sha, each gate's measured
number, the red-then-green evidence for test (a), `Drive-by fixes:` and `Follow-ups:` lists, and
the absolute path of every artifact you produced (report, gate logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
`to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I will
resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be
`SC-260:`.
