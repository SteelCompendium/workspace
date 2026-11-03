# SC-557 r2 brief — independent reviewer: G-S61 load-aware stale-frame rule

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/decisions.md`; the r1 brief `sc557-brief-r1-impl.md` and the r1 report `sc557-r1-impl-report.md` in the same dir (read its executive summary, then the parts you test).
- Read `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, row 4 G-S61 clause + CURRENT block).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake`; plugin at `draw-steel-elements/`, branch `sc557-gs61-stale-frame-flake`, head `f2f25f9f` on base `31d8f779`. Do NOT commit to that branch. If you need to build variants, do it in an export in your private scratch dir (`git -C <plugin path> archive <sha> | tar -x -C <your scratch>/…`).
- **You never call the tracker.** Scott's live-vault dirt in the main checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected; ignore it.

## 2. The task — execute and probe, not just read

Constraint (dispatcher, verbatim):

> The fix must keep G-S61 discriminating: it must still FAIL on the pre-SC-544 bundle and on SC-544's controls (see dse-verify row 4's G-S61 clause), so measure red/green after the change.

Ticket expectation (ticket text): "G-S61 (e) passes reliably under load. Either the frame recorder is made load-aware or the limit has a measured margin."

Review `git -C <plugin path> diff 31d8f779..f2f25f9f`. Find out, by running things:

1. **Vacuity / escape.** Can the new "catching up" exemption swallow a real wrong card? Build at least one NEW mutant that the implementer did not use, which makes a card show a wrong value for many frames while the editor document lags (e.g. delay the editor's document update / or make a card show its disk value long before Obsidian applies it, or a card that shows another block's value while doc ≠ disk) and check that G-S61 still fails it. Check the wall-time cap actually fires (a mutant/probe where the doc never catches up).
2. **Disk tracking correctness.** Is the recorder's notion of "latest disk content" race-free (modify events reading the file asynchronously, two writes in quick succession, a read that resolves out of order)? Could a stale read make a genuinely wrong frame look like catching up?
3. **Red/control re-runs.** Re-run G-S61 yourself on the red `f7c9c7ce` bundle and at least two of the four SC-544 controls (pick "flush after `await Vault.process`", which fails only through the recorder, and one other) on `f2f25f9f`'s harness; compare with r1's phase sets.
4. **Green under load.** ≥5 runs of G-S61 alone under your own CPU load (busy loops you start and stop by recorded PID) + 1 idle; 0 FAIL expected. Record loadavg.
5. **Two r1 claims to verify (r1 report, Follow-ups).** (i) On `31d8f779` the SC-544 controls fail FEWER phases than dse-verify row 4 lists (no flush (a)-(f), after-await (a)-(f), fromView (e), callouts-only (f) — through the pending check), identically with and without the SC-557 change; r1 attributes it to SC-552's position pins. Confirm with one control run on the unmodified `31d8f779` harness vs `f2f25f9f`. Say whether G-S61 is still adequately discriminating on `31d8f779` (every control still fails at least one phase; red fails (a)-(i)). (ii) r1 says the exact "flush only for callouts" (M4) patch is ambiguous (sibling-is-a-callout vs writer-is-a-callout). Find SC-544's actual M4 definition in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc544-lp-callout-quick-clicks/` (`sc544-r3-review-report.md`, `sc544-r3-g61-mutant-M4-calloutonly.log`, `sc544-r3-mutants*` if any) and state it precisely, so the proposal can pin it.
6. **Mid-write disk reads.** r1 treats a disk read that lands mid-write (file holds fewer values than the document) as catching up, under the cap. Probe whether that branch can mask a real wrong card.
7. Code quality of the diff: readable outcome lines, comments state the rule plainly, nothing outside the G-S61 block changed (SC-552 is adding G-S64 to the same file; overlap must stay minimal), the proposal file `sc557-dse-verify-proposal.md` is accurate.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND or FIX.

## 3. Gates

You do not need to re-run the full battery; re-run lifecycle part 4 (`--only=G-S57,G-S62,G-S61,G-S56`, expected 4/4) once on `f2f25f9f`. Full numbers at dispatch (dse develop `31d8f779`, SC-552): jest 6460 / 1 / 256 of 257, lifecycle 51/51 in five parts (21 + 16 + 9 + 4 + 1), e2e 128/128 89/89.

## 4. Footguns (all apply)

- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-<random 6-char tag>/`; uniquely named scripts/logs; Write tool for scratch files, not heredocs.
- `devbox run -c <abs plugin path> -- bash <script>`; no `cd` inside compound commands; `git -C <abs path>` always.
- No `rm` with a shell-variable target, never a glob `rm` (never `/tmp/dse-obsidian-lifecycle-*`); delete only literal paths you created, or don't delete.
- Never `pkill`/`killall` by pattern; kill only PIDs you recorded or whose `readlink /proc/<pid>/cwd` is inside your scratch dir / this worktree. Other efforts run lifecycle concurrently.
- No background gates / Monitor waits; every gate is one blocking foreground call (≤600 s). Start and stop your CPU-load loops INSIDE the same script/call as the run they load (r1's loops outlived a session cut and loaded other efforts' gates for 89 min); never leave them running between calls. Keep under-load sets short — other efforts share this machine.
- Devbox eats exit codes and pipes eat failures: exit codes from a script file; read summary lines.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never edit `.claude/skills/dse-verify/SKILL.md`, the freeze baseline, or anything under the main checkout except your report files. Never tag draw-steel-elements.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` goes to the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-557:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/sc557-r2-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, new-mutant results, red/control re-run results, green-under-load result). Copy cited logs into the ledger dir prefixed `sc557-r2-`.

## 6. Return contract

Final text to the ticket-owner, not a human: verdict, findings (severity, file:line, one line each), measured numbers, and the absolute path of every artifact. No prose.
