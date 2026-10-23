# SC-492 r1 independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-decisions.md`.
- The implementer's brief (what was asked): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-brief-r1-impl.md`. Its §4 command footguns apply to you in full — read them.
- The implementer's report (read its summary, then whatever you need): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-r1-impl-report.md`.
- Original observation: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-r1-review-report.md` §INFO-1.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil`, plugin branch `sc492-stamina-pencil` at `d41d19d` (base `d152ea4` = dse develop after SC-477). `git -C <path> fetch origin`; confirm origin/develop is still `d152ea4`. Review `git -C .../draw-steel-elements diff d152ea4..HEAD` and the superproject CHANGELOG commits (`9152067`, `f9d8f23` on origin/main `00e2f37`).
- **Do not commit to the branch.** You review; you do not fix. Probe scripts/tests go in your private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-review-r1/`; any temporary edit to the worktree for a probe must be reverted exactly (`git -C ... stash`/`checkout -- <exact file>`) and the tree left as you found it — verify with `git status` at the end.
- **You never call the tracker (Linear).**
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`/`demo-vault/*.md`) is Scott's vault; ignore it.

## 2. Task — adversarial review: execute and probe, do not just read

The ticket's expectation (verbatim): "**Expected:** the pencil opens only the edit form."

Probe at least:

1. **Real Obsidian**: with `experimental` + `authoringControls` on, click the stamina-bar pencil — only the edit form opens. Do it for a default block and a `style: sheet` block (the original repro hit both). Then click elsewhere on the bar — the Stamina modal still opens. Keyboard: Tab to the pencil, Enter and Space — only the form opens; Tab to the bar, Enter/Space — the Stamina modal still opens (if it did on base).
2. The new tests actually fail on base `d152ea4` (revert only the src fix, run them, restore). A test that passes on base is vacuous — HIGH.
3. Other chrome items on the stamina bar (any besides the pencil?) and other elements that host chrome inside a clickable region — is anything still double-firing, or did the fix break a chrome item that relied on bubbling?
4. Authoring controls OFF: bar behaviour unchanged.
5. The fix does not touch `FormModal.ts` (SC-488 in flight).
6. Re-run the full dse-verify battery at the branch head and compare with the implementer's numbers. Baseline at `d152ea4`: tsc/lint clean · jest 5769 passed / 1 skipped / 238 of 239 suites (plus the added tests) · lifecycle 32/32 (33/33 if G-S32 added) · e2e `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (plus any added) · shots 592, 0 FAIL · freeze `freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED. NOTE: if the Obsidian host-copy pin fix has not landed on develop yet, shots ends in `HOST COPY DRIFTED` (Obsidian 1.15.0 vs pinned 1.14.0) for every effort on this machine — environmental, do not count it as a finding and do not patch shoot.mjs; still check the PNG count, freeze and parity.
7. CHANGELOG bullet is in the worktree's superproject (not the main checkout), plain-worded and accurate.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-r1-review-report.md`, opening with a **≤10-line executive summary** (verdict: LAND-READY / FIX-REQUIRED, counts by severity, gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, and prescribed fix. If the report-file write is blocked, return it inline.

## 4. Return contract

Final text goes to the ticket-owner, not a human: verdict, sha reviewed, measured gate numbers, finding count by severity — no prose — plus the absolute path of every evidence artifact (report, logs, screenshots).

You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-492:`.

## 5. Notes from the implementer's report to check, not trust

- It says the collapse button had the same double-fire and that bug ships WITHOUT the experimental switch. Verify both on base `d152ea4` and on the fix.
- It says hero and initiative keep their chrome outside their bars (only ds-stamina-bar is exposed). Verify.
- It chose a guard in the bar handler over `stopPropagation` at the panel. Judge that choice.
- It says the bar has no keyboard path at all (plain div, no tabindex/keydown). That is already ruled a separate Backlog ticket (out of scope here); do not count it as a finding against this branch. Your keyboard probes in §2.1 should therefore expect the bar itself to be keyboard-unreachable on base and fix alike.
- Its green shots run pointed `HOME` at a dir holding only the 1.14.4 asar, which is a measurement workaround for the host drift. You may reproduce it the same way. Do not change the pin.
