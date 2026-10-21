# SC-422 r2 — independent adversarial review of r1

You are an orchestration:reviewer working for the SC-422 ticket-owner. Your final text goes to the owner, not a human. You did not write this code.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/decisions.md` (owner decisions O1–O5 bind the work).
- r1 brief + report (same dir): `sc422-brief-r1-implement.md`, `sc422-r1-implement-report.md`. Read the report's executive summary first.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces/draw-steel-elements`, branch `sc422-textscale-surfaces` @ `487b444` on base `ab34293`. Review `git -C <path> diff ab34293..487b444`. Do not commit to the branch; probes go in a scratch copy or are reverted, and you report the revert.
- **Use `git -C <absolute path>` for every git command; verify `pwd` before every write.** Never write under `/home/scott/code/steelCompendium/workspace/` except your report/evidence in the ledger dir.
- Also review the superproject doc commit `c44b5b2` (D3-token-map.md) in `/home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces` on origin/main `b21e48b`. Note: r1 stamps a new `.dse-fs-root` class via `src/framework/kit/textScaleRoot.ts`; the harness mounts the chrome surfaces via a new `surface=` param (`visual-harness/chromeSurfaces.ts`) — check the harness mounts the REAL production code paths, not a re-implementation, or the browser gate proves nothing about Obsidian. The after-evidence crops were taken on a b6b08f3 build.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected.
- **You never call the tracker (Linear).**

## 2. The task — execute and probe, don't just read

The ticket (verbatim):

> The Small and Control text-size prefs only take effect inside roots the plugin stamps with the pref values: element roots and DseModal dialogs. These surfaces use the size tokens but sit outside any stamped root, so they ignore the prefs: Compendium search modal hints […] Settings preview caption […] Sidebar panel header and sidebar empty message. […] If yes, fix all four surfaces together. The search modal needs a lifetime owner for the pref subscription.

Probe at least:
1. **Lifetime/leaks:** open/close the Compendium search modal repeatedly (and settings tab display/hide, sidebar open/close): subscriptions released on close; no writes to a detached element; reopening after a pref change shows the current value; a pref change WHILE the modal is open updates it live.
2. **Exactly-once (O5):** at Small/Large/Control 1.2 and 0.8, every text in the new roots scales by exactly the knob, never squared — including any element root nested inside a new chrome root (sidebar panels host element roots; the settings preview hosts a stamped preview root). Measure computed sizes in a real browser, not jsdom.
3. **Defaults (O4):** at default prefs nothing moves — re-run shots + freeze yourself.
4. **Survey completeness:** independently grep for `--dse-fs-*` consumers outside any stamped root that r1 missed.
5. **Gate non-vacuity:** remove the stamping (scratch) and confirm the new rows/tests fail.
6. **Popout windows:** a modal or sidebar in an Obsidian popout window — does the stamp land in the right document?
7. Re-run the full `dse-verify` battery (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) and compare to r1's numbers. Expected base (develop @ ab34293): jest 5262 / 1 skipped / 230 of 231; lifecycle 27/27; e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24.
8. Eyeball r1's evidence images in `evidence/`: do they show what the captions say?

Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Footguns

- Devbox: `devbox run -c <dse path> -- bash -c 'cd <dse path> && <cmd>'`; its sh wrapper eats `$?`; never pipe a gate into `tail`; run gates via wrapper script files, output redirected to per-run unique files.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the foreground; a background job you start will not wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- Never `pkill`/`killall` by pattern — kill only by PID whose command line contains `worktrees/sc422-textscale-surfaces/`. Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/sc422-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, finding counts, gate numbers you measured). If the write is blocked, return it inline.

## 5. Return contract

Final text to the ticket-owner: verdict, finding counts, measured gate numbers, and the absolute path of every artifact you produced. You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me). If you need input, end with STATUS: NEEDS_CONTEXT and the question; if you ever message anyway, the first word must be `SC-422:`.
