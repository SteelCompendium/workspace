# SC-522 r3 brief — independent adversarial review (reviewer, FRESH)

You are the r3 reviewer for SC-522. You authored none of this code. Your final text goes to the ticket-owner, not a human. **Execute and probe; do not just read.**

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/decisions.md` — all of it; "Owner rulings on r1 (2026-10-30)" lists what r3 must probe. The newest baseline entry supersedes older ones.
- r1 report `sc522-r1-repro-report.md` (mechanisms, prototype, G-S52, Risks, Follow-ups) and r2 report `sc522-r2-implement-report.md` (executive summaries first), both in that ledger dir. r1's probes/scripts (`sc522-r1-probe-*.txt`, `sc522-r1-mkharness.cjs.txt`, `sc522-r1-*.sh`) are reusable — copy into your scratch folder; never edit in place.
- Gate rules + numbers: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

Code under review: worktree `/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll`, dse branch `sc522-lp-embed-scroll` @ `86ab9a2` on develop `4deb8cf`; superproject @ `4ebefdd` on origin/main `49fc600`. Verify both with `git -C <abs path> log --oneline -1` first. Review range: `git -C …/draw-steel-elements diff 4deb8cf..86ab9a2` plus the superproject CHANGELOG diff. **Leave the tree exactly as you found it** (commit nothing; variant bundles are built from temporary edits you restore, or from a scratch copy). Main checkout `/home/scott/code/steelCompendium/workspace` is shared state — write only your report/evidence there in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. The task

Adversarial review of the diff for correctness, regressions and lifecycle leaks. Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, and prescribed fix. The owner's bar (ledger, verbatim): "**never worse than stock in any measured geometry**, Reading view and SC-478's own-file LP hold must not regress (G-S8, G-S15, G-S18, G-S42 stay ok)."

Required probes (real Obsidian via the lifecycle harness / CDP, base `4deb8cf` vs head, 2 reps each):
1. **Part 2 behaviour change** (ruling, verbatim): "r3 must probe the unmeasured parts: double-click on a DSE card in an LP embed, Mod+A inside a card, and that B's source is still reachable from the embed (click embed content outside the card / the embed's open-link affordance) — any of these broken where stock worked is a finding." Also: real-mouse clicks on DSE chrome (Edit pencil, Pin, Collapse/Expand — SC-502) in a card inside an LP embed still work.
2. **Risk 1** (information only): one CDP trace with screenshots (or screencast) of geometry (d)/(f) remove-hero on head — is the one-sample ±110 px frame actually painted? Report yes/no with the frame.
3. **Risk 5** integrity: B with two DSE blocks (release waits for every root; nothing stuck after TTL); host with two embeds of B (each held and released independently; neither stretched after); a user-deleted/edited block in B while held; closing the host pane mid-hold (no leaked observer/timer; `releaseAll`/`destroy` paths).
4. **Follow-up 1**: Form Save from inside an LP embed in a tall host (EmbAE/EmbAS geometries) on head — drive it (the pencil); report scrollTop and on-screen text, base vs head. SC-518 changed form focus — confirm the click shield composes with it.
5. **Follow-up 4**: reproduce base vs head: B reset on disk while the host is closed, reopen the host, click in the embed — does the embed show B's old body / refuse the click "changed on disk first"? Report which shas show it.
6. Re-run G-S52 discrimination yourself once (head ok; base FAIL; at least ctl-noclick and ctl-norelease rebuilt from head sources FAIL as designed) and `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52`. Check G-S52 for outcome-deciding timed delays (dse-verify authoring rule) and vacuity (would it pass if the embed were never redrawn?).
7. Read for: hold applied to views it should not touch (Reading view, own-file LP views, embeds of other notes, non-DSE embeds), floor never lowered, MutationObserver attached in the widget's own window (popout), `requestMeasure` on release, cost per `modify` with many LP views open.
8. Re-run tsc/lint/jest; one lifecycle half containing G-S52 is enough unless you change nothing — e2e/shots not required unless your probes suggest a risk.

## 3. Footguns — follow exactly

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command. `git -C <absolute path>` for every git command.
- Exit codes from inside a script file run through devbox; `devbox run … bash -c '…; echo rc=$?'` always records 0. Read each gate's own summary line. Since SC-531, a lifecycle exit 2 at start-up is a real signal.
- **One blocking foreground gate per Bash call** (`timeout: 600000`). No `run_in_background`, no `Monitor`, no detached subshells, no background jobs. Redirect long output to a file.
- **No `rm` with a shell-variable target**, no glob `rm`, never `rm -rf` a shared `/tmp` glob such as `/tmp/dse-obsidian-lifecycle-*` — delete only paths you created, by literal absolute path.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Scratch: ONLY a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r3-<your agentId>/`, uniquely named files, written with the Write tool.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match). Read the process's own output.
- Never `rm -rf` anything under `.superpowers/` other than files you created.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r3-review-report.md`. **Open with a ≤10-line executive summary**: verdict APPROVE / REQUEST_CHANGES, finding counts by severity, gate numbers you re-ran, probe results table (base vs head). Copy deciding logs/screenshots into the ledger dir with the `sc522-r3-` prefix. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts — verdict, findings (severity, file:line, one line each), measured numbers, dse HEAD + porcelain at exit (must equal what you found), and the absolute path of every evidence artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-522:`.
