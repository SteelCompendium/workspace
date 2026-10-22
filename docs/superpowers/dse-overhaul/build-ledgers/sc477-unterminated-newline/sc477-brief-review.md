# SC-477 independent review brief (round 1)

## 1. Context loading
- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/decisions.md` (ledger — current state), then the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/sc477-impl-report.md` (executive summary first; body only where you need it), and the implementer brief `sc477-brief-impl.md` in the same dir (what was asked).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline`, dse submodule branch `sc477-unterminated-newline` (head: see report), base `develop` 424f47b. Diff: `git -C /home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/draw-steel-elements diff 424f47b...HEAD` (and the superproject branch's CHANGELOG commit vs its base). First `git -C … fetch origin` and say whether `origin/develop` moved past 424f47b.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- **You never call the tracker (Linear).** Do not commit to the branch; you review. You may write scratch probe tests in your private scratch folder or as uncommitted files you delete (by exact path) before you finish — the tree must be clean when you return.

## 2. The task
Owner ruling under review (verbatim from the ledger):
> Rule: **for the same note and the same new body, the durable (relocate-by-body) path must write byte-identical output to the in-place path** — the close fence is inserted after the last body line and the note's trailing newline(s)/blank lines that followed survive after it. Re-pin the SC-343 durable tests to the in-place outputs.

Execute and probe, don't just read. In particular:
1. **Integrity probes (this writes into user files):** content above the block survives; trailing newline(s)/blank lines/whitespace-only lines survive; CRLF stays all-CRLF; a note with no trailing newline gets none added; two same-language blocks (one closed earlier, the unterminated one last) don't cross-talk — the write lands in the right one; a hand edit to the body between mount and write → safe behaviour (not-saved Notice, not a wrong-place write); a body that itself ends in blank lines or contains a ``` line; a nested/indented or callout-prefixed unterminated fence (SC-455 says only un-nested are recovered — confirm unchanged).
2. **Data-loss traps from SC-343** (`/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc343-stale-write-guard-ledger.md` lines ~55–67, ~94, ~106): a terminated block misread as unterminated must not delete text between its close and EOF; the fix must not widen that.
3. **Parity claim:** independently drive both paths (section present vs navigate-away) for a table of shapes and diff the outputs byte-for-byte.
4. **Tests are not vacuous:** check out the new tests against the base `src/` (e.g. `git -C … stash` is NOT allowed; use `git -C … worktree add <your private scratch>/base 424f47b` or copy the base file into a scratch path) and confirm they fail there.
5. **Lifecycle:** G-S6u (or new G-S28) really asserts the trailing newline in real Obsidian, through the durable path. Re-run `npm run obsidian-lifecycle` and jest yourself. Re-run e2e only if src changes beyond `ReadingModeBlockHost.ts` touch write paths e2e covers (state why either way).
6. CHANGELOG bullets: plain user words, both files, under `## Unreleased`.

Expected numbers at base 424f47b: jest 5703 passed / 1 skipped / 238 of 239 suites (+ new tests) · lifecycle 31/31 (32/32 with G-S28) · e2e `96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` · freeze `280/280` · parity 0/0/24. The commands live in `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 3. Gate mechanics (each cost real time once)
- Devbox only: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command; `git -C <abs path>` always.
- Record exit codes from inside a script FILE; never pipe a gate. Read each gate's summary line.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc477-review-<random suffix>/`, unique names inside. Write scripts with the Write tool.
- One blocking foreground gate per Bash call (`timeout: 600000`), no `run_in_background`, no Monitor. Redirect long output to a log.
- Never key a wait-loop on a scratch filename or its contents.
- No glob `rm`; delete only exact paths you created. Never touch `.superpowers/` outside `sc477-unterminated-newline/`, never the freeze baseline.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree / scratch path.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/sc477-review-r1-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, gates you re-ran with numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario (input note bytes → output bytes), and a prescribed fix. Say for each finding whether it is a regression vs develop 424f47b. If the report write is blocked, return it inline.

## 5. Return contract
Final text goes to the ticket-owner: raw facts — verdict, finding counts, reviewed sha, gate numbers, absolute paths of the report and every log/probe file. No prose. You cannot `SendMessage` me; for input end with STATUS: NEEDS_CONTEXT and the question. If you message anyway, first word `SC-477:`.
