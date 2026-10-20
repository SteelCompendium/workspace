# SC-455 independent review brief — round 1

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/decisions.md` (spec + owner rulings — the review standard), then the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-impl-report.md` (exec summary first; body as needed), then the brief it worked from, `sc455-brief-impl.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc455-callout-write`, repo `draw-steel-elements/`, branch `sc455-callout-write`, base dse `develop` @ `d58cf6a` (the branch was cut at 6bcf9c8 and rebased onto d58cf6a). Review range: `d58cf6a..HEAD` (`git -C /home/scott/code/steelCompendium/worktrees/sc455-callout-write/draw-steel-elements …`). Use `git -C <absolute path>` for every git command; never `cd X; git …`.
- You are the reviewer, not the author: do NOT commit to the branch. Probe files go in your own scratch dir (below) or are removed from the worktree before you finish; record worktree `git status` before and after and confirm they match.
- NEVER edit anything under `/home/scott/code/steelCompendium/workspace/` except your report/scratch in the ledger dir. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected.
- Workers never call the tracker (Linear).

## 2. The task — adversarial review: EXECUTE and PROBE, don't just read
Standard: the owner ruling in the ledger (quote it, don't paraphrase it). Specifically probe:
1. **Every write/locate site**: independently survey the repo for every site that locates or rewrites an existing fenced block in a note (`vault.process`, `vault.modify`, `editor.replaceRange`/`transaction`, anchor stamping, `fenceLine.ts`, `anchor.ts` callers, `registration.ts` splice). Is any left that still assumes column-0 fences?
2. **Integrity probes** (jest probes and real Obsidian): content above/below the block, inside and outside the callout, survives byte-identical; two same-kind blocks in one callout and in different callouts don't cross-talk (both write orders); a hand-edited callout block survives a re-trigger; a user-deleted block / block moved out of the callout regenerates or fails loudly, never corrupts; prefix depth `>`, `> `, `> > `, `>>`, mixed `> >` vs `>>` on adjacent lines, empty body lines as `>` and `> `, trailing spaces after `>`; a multi-line body write gets the prefix on every new line; SC-290 info strings kept; SC-453 CRLF notes stay all-CRLF; an un-nested block's output byte-identical to base (run the same probe against base src).
3. **Notice paths**: every remaining failure path shows the Notice; legitimate no-ops (identical content, rejected-because-file-changed re-mount) do NOT. No Notice spam (one per attempt). Wording plain for non-technical users.
4. **Real Obsidian**: Reading view, Live Preview, and the sidebar each write a callout-nested block; confirm on disk. Confirm the implementer's measured `getSectionInfo` behaviour claims yourself.
5. **Not vacuous**: run the new tests against base src (`d58cf6a`'s `src/`) — which fail on base? Mutation-check the prefix helper (e.g. drop the prefix re-emit, or only handle one level) and confirm a test catches it.
6. **Docs**: unsupported shapes documented in plain language in the plugin's user-facing docs; CHANGELOG bullet present and accurate.
7. **Gates**: re-run the full battery yourself.

## 3. Gates — `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), full battery in order
Base d58cf6a numbers: tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **4950 passed / 1 skipped / 229 of 230 suites** (+ the branch's new tests; compare to the implementer's count) · lifecycle **26/26** (+ additions) · e2e **`OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`** (+ additions; must end `0 failed`, `Y/Y pairs`) · shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 4. Footguns (all mandatory)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc455-callout-write/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc455-callout-write/draw-steel-elements && <cmd>'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, `| tail` eats failures: use a wrapper script FILE that records the exit code, or redirect to a file and read the gate's own summary line.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms). Never end your turn "waiting for a notification" from a job you started.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match. Per-run unique paths (include `sc455-review` and a timestamp).
- Never `pkill`/`killall` by a bare pattern; kill only PIDs whose command line contains `worktrees/sc455-callout-write/`.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`); delete only paths you created and recorded.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything under `.superpowers/` except your own `sc455-review-*` files.
- ⛔ No tags/releases on draw-steel-elements. Never push. Never `just deploy*` / `just wt-finish`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its FIRST WORD must be `SC-455:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-review-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, counts by severity, gate numbers). Scratch dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-review-<timestamp>/`. Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), each with file:line, a concrete failure scenario, and a prescribed fix. Then probe results by brief item, gates with log paths, artifacts.

## 6. Return contract
Final text goes to the ticket-owner, not a human: raw facts — verdict, head sha reviewed, finding counts by severity with one-line titles, measured gate numbers — plus the absolute path of every evidence artifact. No prose.

## 7. Owner rulings already made on the implementer's follow-ups (do not re-litigate; do probe 4 and 6)
- OUT OF SCOPE, ticketed: list-indented fences (SC-461), Live Preview click opens the callout as source (SC-463), authoring inserts drop `> ` (SC-462). Do not raise these as findings; DO confirm the unsupported shapes show the Notice and leave the file unchanged.
- Implementer follow-up 4 (`blockKey()` changing once for an LP-callout block): probe whether it loses any session state the user would see. Default ruling is drop.
- Implementer follow-up 6 (`replaceSource` silent false when the TFile is missing): will be FOLDED in the fix round. Note any other silent-false path you find.
- Notice rate limit (one per note per 5 s, existing limiter): accepted.
