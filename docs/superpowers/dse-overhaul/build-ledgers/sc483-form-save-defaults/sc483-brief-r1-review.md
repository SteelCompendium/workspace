# SC-483 r1 independent review brief (reviewer B)

## 1. Context loading

- Ledger (spec + owner rule, read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-decisions.md`.
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r1-impl-report.md` (read its summary; treat its claims as claims to verify, not facts).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults`. Plugin repo `…/draw-steel-elements`, branch `sc483-form-save-defaults` at `b6f73ed` on base `bc4a0c5`. Superproject branch at `f1f4dff` (CHANGELOG). Review range: `git -C <plugin repo> log/diff bc4a0c5..b6f73ed`.
- You did not write this code. **Workers never call the tracker** (Linear).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- Do not commit fixes. You may write probe tests/scripts; revert anything you add to the plugin tree before you finish (leave `git status --porcelain` empty), and keep probes in your scratch dir.

## 2. The task — execute and probe, do not just read

Owner rule under review (verbatim from the ledger):

> Rule: a select field whose key was ABSENT from the source when the form opened, and which the user never changed (its dropdown onChange never fired), is not written by Save — it is stripped from the data before serialize/stringify. Validation and preview keep seeing the seeded value. A select the user changed is written, even if changed back to the first option (the first enum option is not always the parser's default, so "equals enum[0]" is not a safe omit test). Every key present in the source is written as today. Non-select widgets are unchanged (they do not seed).

Out of scope (do not raise as findings, but note if the fix makes them WORSE): SC-482 (model serializers re-adding defaults from parse()), and the dropdown displaying enum[0] when the parser default differs.

Probe at least:
1. The ticket repro in REAL Obsidian with authoring controls on (pref `authoringControls`): stamina bar `max_stamina: 20` / `current_stamina: 15`, change Max stamina to 25, Save → note file has no `style` key. Red on the base sha, green on the fix. Use the lifecycle/e2e harness's headless Obsidian (own Xvfb, never `:1`) or a throwaway script on the same machinery — your call; record how.
2. User-file integrity (this writes into user files): content above and below the fence survives; two same-kind blocks in one note don't cross-talk (Save on block 2 does not touch block 1); a source that already declares `style: default` keeps it; hand-written comments/order in the block — note what today's Save does vs. the fix (regressions only).
3. Touched-select cases: change then change back → written; change to a non-first option → written; an element with no `serialize` (stringifyWorking path) behaves the same.
4. Every other caller of the body/working data (preview, validation, any raw/copy path): does stripping leak somewhere it should not, or fail to apply where Save reads?
5. Reopening the form after a Save on the same view (adopted view / re-render) — is "absent from source" re-derived from the NEW source, not stale state?
6. Mutation-test the new jest tests: revert the fix (or break it a few ways) and confirm they go red.
7. Full dse-verify battery, independently. Expected at `bc4a0c5` + branch: tsc (incl. `tsc -p e2e`) and lint clean · jest **5469 passed / 1 skipped / 232 of 233 suites** (after a shots run) · lifecycle **30/30** · e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` · shots 580, 0 FAIL · freeze `freeze OK (280/280 …)` · parity 0 / 0 / 24 DECLARED.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT.

## 3. Run rules (each has cost real time before)

- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r1-review-b/`. Uniquely named scripts and logs only.
- Exit codes: gate as a script FILE (Write tool) with output redirected to a log and its own rc file, run as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/draw-steel-elements -- bash <abs script path>`. `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line.
- One gate per Bash call. Never `cd` inside a compound command. `git -C <abs path>` for every git command. To test the base sha, use a separate `git worktree add <scratch path> bc4a0c5` — never check out other shas in the review worktree while gates may run.
- `rm -f main.js styles.css` in the plugin repo before jest (explicit path). No glob `rm`. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; delete only paths you created.
- Lifecycle: `DSE_LIFECYCLE_PORT=9298`.
- Kills: PID only, proven yours (`pgrep -af "worktrees/sc483-form-save-defaults/"`, or `readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern.
- Never `--headed`, never `DISPLAY=:1`.
- Redirect long output to files; foreground gates; keep each call under the 600 s watchdog. Never background a gate and wait for a notification.
- Never key a wait-loop on a scratch filename or its contents. No pushes, no tags.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r1-review-report.md`, opening with a ≤10-line executive summary (verdict, finding counts by severity, gate numbers, e2e run id, real-Obsidian probe result red/green). If the write is blocked, return the report inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, shas, numbers, findings list, absolute paths of every artifact. You cannot `SendMessage` me; need input → end with STATUS: NEEDS_CONTEXT and the question. If you message anyway, first word `SC-483:`.

## 6. Owner notes on A's judgment calls (probe them)

- A never strips a REQUIRED select (the seed keeps the block valid). Owner accepts this provisionally; probe whether it is reachable by any built-in element and whether it introduces a wrong write.
- A re-asserted an existing test ("Minor: a select field with no value yet…") from expecting `style: default` to expecting no `style`. Check that the re-assertion is the ticket's intended behaviour change and does not hide another assertion that test made.
- Out of scope, already filed (do not re-raise): SC-488 (dropdown/preview show enum[0] instead of the block's real default for skills `style`, roll `mode`/`difficulty`), SC-489 (validation transforms rewrite typed values in place, e.g. `Climb` -> `climb`). SC-482 (model serializers). Do confirm the SC-489 claim with one probe and note whether it touches only fields the user edited or every field.
