# SC-533 r4 brief — fix round on 98ca88e (review findings), rebase, changelog, full battery

## 1. Context loading
- Ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/decisions.md` — read the entries dated 2026-11-01 in full; they are the rulings for this round and outrank this brief.
- Review: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-r3-review-report.md` (findings HIGH-1, MEDIUM-1, LOW-1, LOW-2 with file:line; its LP probes `sc533-r3-probe-r3{y,z,w}.mjs.txt` reproduce HIGH-1 and are yours to copy into your scratch and reuse).
- Worktree dse: `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements`, branch `sc533-chrome-border-reflow` @ `98ca88e` (on `a94995e` on `4deb8cf`). Worktree superproject: `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow`.
- **You never call the tracker (Linear).**

## 2. The task (rulings quoted from the ledger)
0. **Rebase first:** `git -C <dse> fetch origin`, then rebase the branch onto `origin/develop` = `34f46cf` (SC-525; no overlap with mountChrome expected). If it is not `34f46cf`, rebase onto what it is and report it. `npm ci` if `package.json` changed.
1. **HIGH-1 + MEDIUM-1** — "FOLD. Hybrid: keep the batched rAF flush for entries whose panel is connected at flush (they stay correct before first paint). Entries whose panel is NOT connected at flush are handed to a per-window IntersectionObserver (constructed from the anchor's own window, root null); its callback reads every intersecting entry's anchor borders first, then writes every panel's vars, then unobserves them. Unobserve on owner unload. No rAF polling loop."
   - Observe the PANEL or the ANCHOR — pick whichever reliably reports intersecting when reattached (the panel is `opacity: 0`, which still intersects; an `opacity` / zero-size edge must be checked — report which you observed and why).
   - A window without `IntersectionObserver` (jsdom) keeps today's fallback for those entries (no crash, no write); tests mock it.
   - Entries must not leak: an unloaded owner's entries leave both the rAF queue and the observer.
2. **New lifecycle scenario G-S54** — "framed blocks (stamina bar, tracker, statblock) below the first screen, in Live Preview AND Reading view; scroll to each; assert the panel's inset 10 / gap 0 against the card (same measure as the shots "chrome placement" check). It must FAIL on 98ca88e (LP phase) and on 4deb8cf (Reading phase), shown with controls."
   - Controls via temporary bundles run with `DSE_LIFECYCLE_BUNDLE` (built in your scratch, never committed): `98ca88e` bundle (expect LP phase FAIL), `4deb8cf`/`34f46cf`-stock bundle (expect Reading phase FAIL), final bundle (all phases PASS). Report each control's per-phase result lines.
   - Anti-vacuity per phase: the block's panel was disconnected at (or rendered detached before) the first flush, and the anchor really has a non-zero border.
   - Lifecycle authoring rule (dse-verify, SC-478 r4): never put a timed delay inside a step to win a race against Obsidian; wait on a condition or a hook.
   - Record the scenario in the WORKTREE superproject's skill `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/.claude/skills/dse-verify/SKILL.md` alongside the other `G-S*` descriptions (one entry: what it checks, phases, controls), and update the lifecycle expected count (41 -> 42, halves 21 + 21). **The workspace-level files live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/` — never under `/home/scott/code/steelCompendium/workspace/`.** Do not touch the CURRENT/PREVIOUS baseline records (the dispatcher writes those at landing).
3. **LOW-1** — "FOLD (drain the queue/observer in beforeEach; the suite must pass under jest --randomize with several seeds)." Report the seeds you ran.
4. **LOW-2** — "FOLD (comments + spec accurate; say opacity:0, mobile always visible, and the detached-then-reattached path)." Covers `mountChrome.ts` comment blocks (the reviewer cited ~81-85 and ~92-93) and `docs/superpowers/sc169-element-menu-panel-spec.md` ~170-173.
5. **jsdom tests:** rewrite `chromeRound2.test.ts` ~200-214 (it asserts the drop) to assert the hand-off: a panel disconnected at flush gets no read then, and gets its vars when the (mocked) observer reports it intersecting after reconnection — read-before-write across several entries, unobserve after, unobserve on unload. Show the new tests red on `98ca88e`'s mountChrome.ts and green on yours.
6. **CHANGELOG:** add the bullet in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-changelog-bullet.md` verbatim under `## Unreleased` in the WORKTREE superproject's `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/CHANGELOG.md` (top of the list), and commit it in the superproject (only that file and the SKILL.md; do NOT commit the submodule pointer — landing does that).
7. Out of scope: SC-535, SC-520's click handler (expect a trivial textual conflict there at landing, leave it), SC-522's scroll-hold files, the r3 "LP hover screenshot" follow-up (dropped).
8. Commit after every coherent step; messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and nothing else as attribution. Do not push.

## 3. Measurement
Re-run the r2 harness quickly to show the perf win survives the change: R and LP, `stock` (rebased base) / `final` / `stub`, ≥ 12 draws each, interleaved, load recorded. PASS bar unchanged (final within max(50 ms, 10 %) of stub). Plus re-run the r3 HIGH-1 probe on final: every panel inset 10 / gap 0 after scrolling, in LP and Reading view.

## 4. Gates (full battery on the FINAL sha, per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`; each a blocking foreground call)
CURRENT at `34f46cf`: jest **6184 passed / 1 skipped / 248 of 249** (fresh worktree without a shots cache: 6183 / 2) · lifecycle **41/41** · e2e **124/124 ok, 0 failed, 0 known-bug, coverage 87/87** · shots **592**, 0 FAIL, host-leak **157/942** · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Expected on yours: tsc + lint clean; jest = CURRENT + your new tests (state the exact delta); lifecycle **42/42** (G-S54 new; halves 21 + 21, report the union); e2e unchanged; shots 592, 0 FAIL, host-leak 157/942; freeze 280/280; parity 0/0/24. Shots byte diff vs a stock base shots run: expect 0 differing PNGs; any difference -> before/after crops `sc533-r4-crop-<name>-{before,after}.png` in the ledger dir and report.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-r4-fix-report.md`, ≤ 10-line executive summary first. Artifacts `sc533-r4-` prefixed in the ledger dir. Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r4-<random 8-hex>/`.

## 6. Return contract
Final text goes to the ticket-owner: raw facts (verdict, every sha — dse branch HEAD and the superproject commit — every gate's summary line, controls' per-phase lines, measured numbers), no prose, plus the absolute path of every artifact. If the report write is blocked, return it inline. End with `Drive-by fixes:` and `Follow-ups:`.

## Footguns (all mandatory)
- Never `cd X && …` in a compound command; `git -C <abs path>` for every git command; `devbox run -c /home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements -- bash <script file>` for node/npm; scripts via the Write tool, not heredocs.
- Devbox eats exit codes: record codes inside script files; read each gate's own summary line. Never pipe a gate into `tail`.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` pattern (`/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir. Delete only a literal path you created.
- Never `pkill`/`killall` by pattern; kill only a recorded PID whose cwd / command line is inside your worktree or scratch (`readlink /proc/<pid>/cwd`). SC-520 / SC-522 run real Obsidian concurrently.
- Every gate / timed batch is ONE blocking foreground call under 600 s (lifecycle as two `--only` halves); no `run_in_background`, no `Monitor`, no waiting for a notification. Redirect long output to a file and read the file. Set your own `DSE_LIFECYCLE_PORT`.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Never use display `:1`; never `--headed`. In LP measurement sessions, park the leaf on a Reading-view note before each plugin swap (SC-535).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; never touch the main checkout.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever do send a message, its first word must be `SC-533:`.
