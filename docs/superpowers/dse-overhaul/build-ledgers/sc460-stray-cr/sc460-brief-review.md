# SC-460 independent review brief — round 1

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/decisions.md` (ticket text + owner rulings — the spec). Then the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-impl-report.md` (exec summary first; body as needed). Trust nothing in it you can re-measure.
- Background: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-review-report.md` INFO-1/INFO-2 (the original probes P-R3/P-R5/P-R6); `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-impl-report.md` exec summary (blockquote-prefix helper + one-Notice rule this fix must compose with).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc460-stray-cr`, repo `draw-steel-elements/`, branch `sc460-stray-cr`, head `3045082`, base dse `develop` @ `188755b`. Do NOT commit to the branch; probe in scratch copies (`git worktree add` into an absolute path under your own unique `/tmp/sc460-review-<timestamp>/` dir) or leave the tree as you found it (`git status --porcelain` empty before and after). Use `git -C <absolute path>` for every git command.
- NEVER edit anything under `/home/scott/code/steelCompendium/workspace/` except your report/logs in the ledger dir. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected.
- Workers never call the tracker (Linear).

## 2. The task — adversarial review; EXECUTE AND PROBE, don't just read
1. Spec conformance against every numbered owner-ruling item in the ledger (quote the item, give the verdict + evidence).
2. Re-measure in real Obsidian 1.14.4 (base bundle vs head bundle): lone `\r` above a block in an LF note and a CRLF note (the old P-R3/P-R5), lone `\r` below (P-R6), several lone `\r`s, a lone `\r` inside a callout above a callout block, Live Preview if the implementer's step-1 measurement says it matters. Assert on-disk bytes: write landed, lone `\r`s preserved, every byte outside the block unchanged, all-CRLF stays all-CRLF.
3. Integrity probes (writes into user files): content above/below survives; two same-kind blocks with lone `\r`s between them don't cross-talk (both orders); a hand-edited block re-located after a write; a user-deleted block; a lone `\r` inside the block body (check the implementer's documented decision holds and loses nothing); a lone `\r` ON a fence line; mixed `\r`, `\r\n`, `\n`. Random/fuzz probe: generate notes with random line terminators around 1-3 blocks and compare head output to an independent oracle you write (the expected bytes), many cases.
4. Other sites: verify the implementer's survey of sidebar / `anchor.ts` / `registration.ts` / Live Preview — probe at least one lone-`\r` case on each.
5. Tests not vacuous: mutate the fix (revert the helper at each call site, off-by-one the mapping) and confirm the new tests fail; confirm FAIL-on-base counts.
6. No silent failure: a case that still can't land shows exactly one Notice; identical-content no-op shows none.
7. Re-run the full dse-verify battery at head (tsc, lint, jest, lifecycle, e2e; shots/freeze/parity may reuse the implementer's numbers only if the diff provably cannot change rendering — say which).

## 3. Gates — `dse-verify` (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)
Base numbers at 188755b (SC-364; unchanged since 71ac43a): tsc + lint clean · jest 5257 passed / 1 skipped / 229 of 230 suites · lifecycle 27/27 · e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED. Head should equal these plus the implementer's stated additions: jest 5307 / 1 skipped / 229 of 230 (+50) · lifecycle 28/28 (new G-S12) · e2e unchanged 83/87, 0 failed, 4 known-bug, 57/57 · shots 572 · freeze 276/276 · parity 0/0/24.

## 4. Footguns (all mandatory)
- Devbox: `devbox run -c <abs dse dir> -- bash -c 'cd <abs dse dir> && <cmd>'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, `| tail` eats failures: run gates via a wrapper script FILE that writes the exit code to a file, or redirect to a file and read the gate's summary line.
- `rm -f main.js styles.css` in the plugin root before `npx jest`.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND. Never end your turn waiting on a job you started.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match. Per-run unique paths (`sc460-review-<timestamp>`).
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains your own worktree/scratch path.
- Never `rm -rf` a shared `/tmp` glob (`/tmp/dse-obsidian-lifecycle-*` etc.) — delete only exact paths you created.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` under `.superpowers/` beyond your own `sc460-review*` files.
- ⛔ Never tag/release draw-steel-elements. Never push. Never `just deploy*` / `just wt-finish`.
- **Private scratch only (dispatcher, 2026-10-20):** the session scratchpad is shared by every agent (another effort's reviewer overwrote a shared `gate.sh`; an e2e run hit the wrong worktree). Keep every gate/wrapper script and log in a private subfolder `<scratchpad>/sc460-review-<timestamp>/` with uniquely named scripts (`sc460-review-gate-<step>.sh`); never a bare `gate.sh`/`run.sh`. Every script hard-codes the absolute sc460 worktree path; verify it before running.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` + the question. Any message you send anyway must start with `SC-460:`.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-review-report.md`, logs under `.../sc460-stray-cr/logs/sc460-review-*`. OPEN with a ≤10-line executive summary: VERDICT (LAND-READY / FIX-REQUIRED), counts by severity, gate numbers. Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 6. Return contract
Final text to the ticket-owner, not a human: raw facts — VERDICT, severity counts, head sha reviewed, measured gate numbers — plus absolute paths of every evidence artifact. No prose.

## 7. Specific items to scrutinise
- Drive-by: the implementer changed `SidebarBlockHost`'s `lastWritten` to be read back from the bytes written (said SC-453's own lone-CR test failed otherwise). Verify it is correct and does not change self-echo / external-change detection (SC-453 MEDIUM-1 cases: extBetween, abort, noop, crlfSrc).
- `\r\r\n` counts as two breaks per the implementer's measurement — probe it in real Obsidian yourself.
- Owner ruling on the implementer's follow-up (a note whose ONLY breaks are lone `\r` gets the rewritten block in LF): "fold into the fix round" — report what `detectEol` should do there and include it as a finding with the prescribed fix.
