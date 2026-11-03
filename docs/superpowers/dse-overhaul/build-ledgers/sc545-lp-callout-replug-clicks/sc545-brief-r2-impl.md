# SC-545 r2 — implement fix AB + jest + lifecycle G-S63 (commit to the branch)

You are the SC-545 implementation worker. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/decisions.md` — section "Owner rulings on r1" is authoritative.
- The r1 diagnosis: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-r1-diag-report.md` (mechanism §2, options §3 incl. the G-S63 phase list and jest list).
- The r1 prototype to start from (read, do not trust blindly; copy, never write into that folder): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r1-diag-k3p9/protoAB.diff` (and `protoAB-src/`), plus probe tooling there (`r545-scenario.mjs`, `r545-instr.js`, `probe.sh`, `mkharness.py`) — useful for porting phases into G-S63.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, devbox shapes, lifecycle `--only` parts, CURRENT numbers). Read-only for you — do NOT edit it.
- Plugin guidance: `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements/AGENTS.md` and `.repo-docs/architecture.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks`, plugin at `.../draw-steel-elements`, branch `sc545-lp-callout-replug-clicks`. HEAD must be dse `f7c9c7ce` (= origin/develop at dispatch). First: `git -C /home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements fetch origin` and confirm `origin/develop` is still `f7c9c7ce`; if it moved, rebase onto it and report the new base (then `npm ci` if package.json's obsidian version changed). Verify `pwd`/paths before any write. Never work in `/home/scott/code/steelCompendium/workspace/` (shared main checkout); its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- `node_modules` was installed by r1 (`npm ci`); re-run `npm ci` if it is missing.

## 2. The task
Ticket, verbatim: "**Steps:** open a note with a `ds-counter` inside a callout in Live Preview. Turn Draw Steel Elements off and back on in Community plugins, without closing the note. Click + on the counter. **Result:** nothing is written to the file. There are no page errors. **Expected:** the click saves, or the card is redrawn so that it does."

Owner rulings, verbatim from the ledger:
- "Fix = option **AB**: A (stash at `ViewRegistry.onunload`, remount on layout-ready via `ReusedElementRemounter.mount`) is the normal path; B (`setViewData(getViewData(), true)` + ephemeral state) is a fallback ONLY for a view that still has a raw DSE fence or an unowned DSE card inside an LP callout or embed after A settles. Normal off/on must never trigger B (asserted)."
- "The stash is a cross-version contract (old build writes, new build reads, e.g. on a plugin update): pin a versioned key, store only Obsidian-owned objects and plain data (el, widget ctx, alias, body string) — never a reference to an old-instance DSE object/closure; the reader validates shape and falls through to B on mismatch. Document the contract in a comment at the key."
- "B's costs are accepted for its rare cases (first update from a pre-fix build, a write pending at disable, a note opened while the plugin was off): undo history of that note is lost; implementer should try to keep the pixel scroll position (e.g. restore `scrollDOM.scrollTop` after rebuild) and report the measured shift — best effort, not a gate."
- "Option C (route stale clicks to the live instance): rejected (r1 reasons)."
- "Option D (neutralise cards while the plugin is off): DROPPED — the plugin-off state is transient and enable now redraws the card; not worth a second code path."
- "Lifecycle scenario **G-S63** per the r1 proposal (phases a-g), placed in **part 2** (`G-S9b … G-S40`), appended at that part's end; part 3 unchanged (G-S56 stays last). Proposed dse-verify text goes in `sc545-dse-verify-proposal.md` in this dir, NOT in SKILL.md."
- "Jest: `test/dom/framework/replugRemount.test.ts` per r1 §3."

Concretely:
1. Implement AB in source (r1: new `src/framework/host/replugRemount.ts`; `viewRegistry.ts` `onunload` stashes before clearing; `remountReused.ts` `mount` made public; `registerFrameworkElements.ts` remount on `onLayoutReady`, then the fallback after remounts settle). Make sure a remount/fallback that runs while the plugin is unloading again (rapid off/on/off) is harmless, and that the old click shield's listeners do not survive on a remounted element (r1 says `replaceChildren` removes them — verify).
2. Jest: `test/dom/framework/replugRemount.test.ts` (~12 tests per r1 §3), including the shape validation (a stash with a wrong version/shape is ignored and leaves the view to the fallback) and "normal path does not call setViewData".
3. Lifecycle **G-S63** in `visual-harness/obsidian-lifecycle.mjs` with r1's phases (a) counter in a callout, (b) counter in an LP embed, (c) twin callouts 1,0,1, (d) stamina bar in a callout opens the Stamina modal, (e) tall note mid-pane: scrollTop and card top unchanged ±1 px, (f) `+` then off within 30 ms: write lands, card after enable, next `+` writes, (g) control: mixed note's plain fence + Reading view. Every phase: anti-vacuity real `+` first, tag the root, off/on, assert tagged root disconnected, new root owned by the live registry, disk +1, card shows disk value, no page error, no Notice; plus assert the fallback did NOT fire in a-e and g. Use `waitFor` polls, not fixed sleeps (target ≤ 90 s for the scenario). Add it to the part-2 `--only` list position as ruled. Fixtures go wherever the harness's existing fixtures live.
4. **Red/green:** G-S63 must FAIL on an f7c9c7ce bundle (record the failing phases/numbers) and PASS on HEAD. Run 2-3 source mutants (e.g. drop the stash call; drop the remount; make the fallback fire always or never) and record which jest tests / G-S63 phases catch each.
5. Measure the fallback's scroll shift in the mid-note pending-write case after your best-effort pixel restore; report numbers.
6. Proposal file `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-dse-verify-proposal.md`: the exact replacement text for dse-verify's lifecycle row (part 2 list gains G-S63, count 47→48, part-2 count 16→17, a one-clause G-S63 description in the same style as the others) and for the CURRENT block's numbers.
7. CHANGELOG: one bullet under `## Unreleased` in YOUR worktree's superproject — `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/CHANGELOG.md`, never under `/home/scott/code/steelCompendium/workspace/`. Plain user-facing words, e.g. "Turning Draw Steel Elements off and back on no longer leaves cards in Live Preview callouts and embeds unclickable — they are redrawn and save again (SC-545)." Commit it in the superproject branch (do NOT bump the submodule pointer; the dispatcher does that at landing).

Commit in the plugin after every coherent step (`fix(SC-545): …`, `test(SC-545): …`); never leave work uncommitted through a gate. No co-author or AI attribution trailers in commit messages.

## 3. Gates (dse-verify battery, in order, on your final HEAD)
tsc, `tsc -p e2e`, lint clean; jest — baseline 6297 passed / 1 skipped / 251 of 252 suites → expect +1 suite and +your new tests, 0 failed (compare after a shots run, per the skill's note); lifecycle in THREE `--only` parts per dse-verify row 4 with G-S63 in part 2 → expect 48/48 as 21 + 17 + 10; e2e 128/128, 0 failed, coverage 89/89; shots + freeze + parity per the skill (no frozen bytes should move; if any do, stop and report). Every lifecycle/e2e run with `DSE_LIFECYCLE_PORT=9545` (your own port; if SC-551 has landed and the env var name changed, read the harness).

Save each gate's log in the ledger dir as `sc545-r2-gate-<name>.log`, red/green logs as `sc545-r2-red-*.log` / `sc545-r2-green-*.log`, mutant logs as `sc545-r2-mut-<n>-*.log`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-r2-impl-report.md`, opening with a **≤10-line executive summary**: verdict, plugin HEAD sha + superproject sha, gate numbers, red/green result, mutants caught, fallback scroll shift, any deviation from the rulings. List `Drive-by fixes:` (already made, obviously correct, local) and `Follow-ups:` (left alone) separately. Save 1 deciding screenshot (LP callout after off/on and a click, value updated) as `sc545-r2-*.png` in the ledger dir.

## 5. Return contract
Final text: raw facts, no prose — verdict, shas, measured numbers, and the **absolute path of every evidence artifact**.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run each gate as ONE blocking foreground Bash call (under 600 s; lifecycle as three separate `--only` calls; e2e/shots separately). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; use `git -C <abs path>` for every git command. Devbox eats `$?` and piping a gate eats failures — record exit codes from inside a script file and read each gate's summary line.
- Stale `main.js`/`styles.css` in the plugin root shadow `main.ts` for jest — see the skill.
- Scratch: your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r2-impl-<your agentId>/`, uniquely named scripts and logs. Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target and no glob `rm` (both hang on a permission prompt nobody answers); overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern; kill only a PID you started, whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree or scratch folder. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only paths you created and recorded. Never touch the shared `.superpowers/` dir beyond writing your own `sc545-` files.
- Out of scope: SC-535 (off/on hang), SC-544's pending-write flush, SC-472's scroll pin, SC-551's port handling. Do not edit those areas beyond what the fix strictly needs; report anything you notice as a Follow-up.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-545:`.
