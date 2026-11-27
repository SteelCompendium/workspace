# SC-707 round 4 — scoped re-review brief (delta only)

You are a fresh reviewer for ticket SC-707 (draw-steel-elements). You did not write this code and did not do the round-2 review. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/decisions.md` (rulings O11–O15 are this round's spec).
- Round-2 review report: `…/sc707-r2-review-report.md` (section "### MEDIUM-1" and "### LOW-1"). Implementer's round-3 notes: the "## Round 3" section of `…/sc707-r1-impl-report.md`.
- Plugin: `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest/draw-steel-elements`, branch `sc707-initiative-schema-suggest`. Reviewed-before head: `4da5ef69`. Review ONLY `git -C <plugin> diff 4da5ef69..HEAD` (if the branch was rebased, compare with `git -C <plugin> range-diff`). Do not commit to the branch; leave `git status` clean.
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's vault — ignore.

## Task

1. MEDIUM-1 is fixed: re-run the reviewer's four cases (a)–(d) and the single-quote/flow variants. Probe the new quote-aware comment strip adversarially: escaped `\"` inside double quotes, an apostrophe inside a plain word (`Bob's Orcs` — the implementer made a quote open only at the start of a token; check that against YAML rules), a value starting with a quote but continuing after it, `''` inside single quotes, a `#` immediately after a closing quote with and without a space, an unclosed quote that really is multi-line, a real ` # comment` after an unquoted value, `- {name: "a #b"}`. Confirm no regression in the other edge cases round 2 measured (its probe file `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r2-review/zzProbe2Sc707r2.test.ts` — copy it into your own scratch, do not edit the original).
2. The new jest cases fail with the fix reverted (mutation check).
3. AUTH-K21 accepts a nested enum value in real Obsidian and asserts saved bytes.
4. CHANGELOG and `docs/writing-blocks.md` no longer name the Roll block; text is accurate and plain.
5. Gates at head: tsc (incl. `-p e2e`) + lint clean; jest fresh (base e38f7838 15044 + the branch's delta, 2 skipped — expect what the implementer reported); lifecycle 64/64; full e2e `0 failed`, 20 known-bug, coverage Y/Y; styles.css sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98`.

Out of scope: SC-712, SC-713, ds-hero `state.*` (O9), SC-678, the SC-419 pages.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/sc707-r4-rereview-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-ROUND, counts by severity). Findings with file:line, failure scenario, prescribed fix; then measured gate lines.

## Return contract

Final text: verdict, findings by severity (one line each), head sha, measured gate numbers, absolute paths of report and logs. No prose.

## Footguns (mandatory)

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to files. Each gate one blocking foreground call (split lifecycle / e2e); no background jobs, no Monitor.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input. Any message you do send starts with `SC-707:`.
- `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound command; record exit codes inside the script; never pipe a gate into `tail`.
- Every git command as `git -C <absolute path>`.
- Scratch: private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r4-rereview/`, files via the Write tool.
- No `rm` with a glob or shell-variable path; never `rm -rf` under `.superpowers/` or a `/tmp` glob.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line or `/proc/<pid>/cwd` is inside your worktree.
- Never tag, release, push, deploy, or run `just wt-finish`.
