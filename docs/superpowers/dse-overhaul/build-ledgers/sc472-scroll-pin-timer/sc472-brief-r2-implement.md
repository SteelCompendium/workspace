# SC-472 r2 — implement release-on-redraw with a load-aware backstop (implementer)

You are a worker for ticket-owner SC-472. **You never call the tracker (Linear)** — not to read history, not to post. Your context is this brief plus the files it names.

## 1. Context loading

Read first:
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/decisions.md` — especially "Owner rulings on r1". It is the current state; where this brief and the ledger disagree, the ledger wins.
- r1 design report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/sc472-r1-design-report.md` (sections A, C, D, Risks) and the prototype `sc472-r1-prototype.patch` in the same dir. r1's probe tooling (for measurements and to build G-S59 from): `sc472-r1-probe-block.mjs.txt`, `sc472-r1-mkharness.cjs.txt`, and its `sc472-r1-*` logs/summaries.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery table (rows 1-7), lifecycle authoring rules, the G-S8 / G-S15 / G-S18 / G-S42 / G-S52 / G-S56 entries, temporary-bundle controls via `DSE_LIFECYCLE_BUNDLE`.
- The draw-steel-elements `AGENTS.md`/`CLAUDE.md` in your worktree.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer`. The dse submodule is `draw-steel-elements/` on branch `sc472-scroll-pin-timer`, currently at `ad018cd`. **First:** `git -C /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements fetch origin`, then rebase the branch onto **`97284051`** (dse develop; harness-only commits since ad018cd, `src/` unchanged). Also `git -C /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer fetch origin` and rebase the superproject branch `sc472-scroll-pin-timer` onto `origin/main` (needed for the CHANGELOG edit). If `package.json`'s obsidian version changed, `npm ci`. Verify paths before any write.

**The workspace-level files live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.** Do not edit `dse-verify/SKILL.md` anywhere; its proposed text goes in the ledger dir (see §2 item 8).

The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; never touch it.

Overlap: SC-537 (running in another worktree) adds a Live Preview editor update listener near `test/dom/framework/livePreviewScrollHold.test.ts`. If it lands on develop while you work, expect a conflict there at a later rebase; keep your changes to that test file well-structured (separate `describe` blocks) so the merge is mechanical.

## 2. The task

The owner's design ruling (quoted from the ledger, verbatim):

> **DESIGN: r1's prototype, adopted as recommended.** Every pin and hold releases on the redraw; the timer becomes a load-aware backstop: PIN_TTL_MS (2500 ms, unchanged) wall clock, then 30 painted frames, last 2 quiet; never fires while a DSE root is mounting or (Reading pins) while a started redraw is unfinished unless 60 quiet frames pass; hard cap 20 s. Reading pins (own + SC-479 host) gain the release-on-redraw rule (all roots mounted + every protected sizer back, 2 px tolerance, re-pin re-arms). SC-522 embed hold, SC-478 restore / widget hold / pending entry keep their release rules and switch to the new backstop. **Do NOT lengthen the timer** (10 s measured to still clamp).

Commit after every coherent step. Suggested commit sequence (each its own commit):

1. **64 px padding fix** — ruling: "**64 px padding phantom (`previewScrollPin.ts:388`, first pin height = scrollHeight incl. padding) → FOLD as its own commit** with its own test and its own CHANGELOG clause". First pin height = `scrollHeight − padding` as in the prototype.
2. **`redrawBackstop.ts`** (new) — the `Backstop` from the prototype, unit-tested.
3. **Reading pins** (`previewScrollPin.ts`) — release-on-redraw + `Backstop`, from the prototype.
4. **LP holds** (`livePreviewScrollHold.ts`) — SC-522 embed hold, SC-478 widget hold and pending entry use `Backstop`; release rules unchanged.
5. **Jest** — ruling: "**Jest: rewrite the 10 timer-only tests** (fake timers + stubbed animation frames); every new guard (redraw-start detection, redraw-done check per sizer kind, re-pin re-arm, busy rules, 30-frame count, quiet frames, 20 s hard cap, rAF-less fallback) must have a test that goes red when the guard is removed — run a mutation check and report one line per mutation." Also show the new tests FAIL on stock `src/` where they encode new behaviour (run them against a stock export; report counts).
6. **G-S59 lifecycle scenario** — ruling: "**Lifecycle: new G-S59 under CDP 8x throttle, its own `--only` part.** Phases (a) LP sibling, (b) SC-522 two-pane, 3 writes each; event-based wait (pin/hold attribute gone AND tracker mounted, 30 s cap); per write: scrollTop identical every frame, release seen, tracker redrawn; throttle only around the writes, reset in `finally`. **Anti-vacuity: record write -> redraw latency per write and FAIL as vacuous unless at least one write per phase redraws after PIN_TTL_MS** (otherwise the race was not exercised). Controls via `DSE_LIFECYCLE_BUNDLE`: base bundle FAILs (a) and (b); "plain-timer backstop" control FAILs (b). The 10 s-timer control is not a gate control (escapes ~42 %). G-S56 stays last in SCENARIOS order." Add fixtures under the lifecycle fixture dir as needed (reuse existing ones such as `tall.md` / `Lifecycle/lpemb*.md` where r1 did). Follow dse-verify's lifecycle authoring rules (no outcome-deciding `t.sleep`; every phase runs even after one fails; FAIL lines with a shot). Run the discrimination: head ok, base bundle FAIL (a)+(b), plain-timer control FAIL (b) — **2 runs each**; build controls from `git archive` exports in your scratch dir, never in the tree.
7. **Harness comments** — ruling: "**Harness comments** "TTL 2500 ms" (G-S8 :1631, G-S18 :2391, G-S42 :3190, G-S52 :3970) → reword to the backstop. Caps unchanged unless a measurement says otherwise."
8. **Docs** — ruling: "Docs: `previewScrollPin.ts` / `livePreviewScrollHold.ts` headers (mechanism + measurements + KNOWN LIMITS); CHANGELOG `## Unreleased` bullet in the WORKTREE superproject; dse-verify text in `sc472-dse-verify-proposal.md` in this ledger dir (lifecycle row count + G-S59 entry with its controls + part layout), not SKILL.md." Also fold: "**Follow-up "G-S52 cannot run under heavy load" → FOLD into the dse-verify proposal**: drop/reword G-S52's "false red under load" sentence to match the new backstop (the anti-vacuity (c) timeout under heavy load remains environment)." The proposal must also give the new lifecycle part layout (the three existing `--only` parts + G-S59's own part; confirm each part fits a 600 s tool call and say how long each took). CHANGELOG bullet: plain words, user-visible consequence first (a note no longer jumps up after a tracker change on a slow or busy machine; the 64 px snap-back at the end of a note is gone). Commit the superproject CHANGELOG on the superproject branch; leave the dse pointer bump unstaged (the dispatcher lands).

**Measurement required in this round** — ruling: "**Risk 3 (shrink at the note's end: blank band ~1 s longer than stock) → MEASURE in r2** (Reading view, a block deleted at the note's end, unloaded): ACCEPT if the band is ≤ stock + 1.5 s and the settled position equals stock's; otherwise report it as a finding." Report stock vs head: band duration (ms), settled scrollTop, 2 runs each.

Out of scope: SC-548 (LP hidden Reading view re-renders embeds) — do not touch. Do not change unrelated scroll behaviour. List anything else under `Follow-ups:`; obviously correct local fixes in files you touch go under `Drive-by fixes:`.

## 3. Gates — full battery, in order (dse-verify)

Expected at `97284051` before your change: tsc + lint clean · jest **6252 passed / 1 skipped / 249 of 250 suites** (fresh worktree without a shots cache: one fewer passed / 2 skipped) · lifecycle **45/45** in three `--only` parts (21 + 16 + 8, G-S56 last) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592, 0 FAIL, button host-leak 161/966** · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after: jest = 6252 + your net new tests, all green; lifecycle **46/46** (the three parts plus G-S59's own part; report every part's summary line and the union); e2e unchanged; shots 592 / 0 FAIL / 161/966 (this change should move no pixels — any frozen-byte change is a finding: stop and report, never touch the baseline); freeze 280/280; parity 0/0/24 (run LAST). Lifecycle and e2e are required to land.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/sc472-r2-implement-report.md`. Keep every evidence file in that dir prefixed `sc472-r2-` (shared global dir). The report must OPEN with a ≤10-line executive summary: dse head sha + base, superproject sha, every gate's summary line, G-S59 discrimination results, Risk 3 numbers, mutation-check survivors (if any).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path of every evidence artifact. Separate `Drive-by fixes:` and `Follow-ups:` lists.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-472:`.
- Devbox: tools are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements -- <cmd>` (or `-- bash <script file>`). **Never a compound `cd X && …`**; never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS`, and `bash -c '…; echo rc=$? > f'` always records 0: record exit codes from a script FILE run through devbox, and read each gate's summary line. Never pipe a gate into `tail`.
- **One gate per Bash call, foreground, blocking.** No `run_in_background`, no `Monitor`, no waiting on completion notices — they never wake you. Lifecycle runs as separate `--only` part calls. If a run may pass 600 s (shots under load), start it with output to a unique log plus an rc file and poll that log/rc file with short foreground checks.
- `git -C <absolute path>` for every git command.
- Scratch: a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r2-<your agentId>/`, uniquely named scripts and logs; write scratch files with the Write tool, not heredocs.
- **Never `rm` with a shell-variable target** (it hangs on a permission prompt). Never `rm -rf` a glob, never a shared `/tmp/dse-obsidian-lifecycle-*` glob, never `.superpowers/` — delete only a literal path you created. Overwrite logs with `>` instead.
- **Never `pkill`/`killall` by pattern** — concurrent efforts run the same commands. Kill only by PID whose command line contains `worktrees/sc472-scroll-pin-timer/` or whose `readlink /proc/<pid>/cwd` is inside it (`node visual-harness/shoot.mjs` has no path in its cmdline).
- Lifecycle: own Xvfb `:160–:199`, CDP port 9262; e2e `:200–:239`. Never `:1`. A port-busy exit 2 is environment (other efforts run lifecycle concurrently) — retry. Record `/proc/loadavg` with every timing measurement; G-S59 depends on CDP throttle, not machine load, but note load anyway.
- Never run `steel-etl site` or any `just deploy*`. Never create a tag or release on draw-steel-elements. Never touch `.superpowers/sdd/freeze-baseline.sha256`.
