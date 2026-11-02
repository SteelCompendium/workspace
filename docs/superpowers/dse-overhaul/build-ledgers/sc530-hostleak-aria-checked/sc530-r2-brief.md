# SC-530 r2 — productionize + full battery (orchestration:implementer)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path of every evidence artifact. Report file must open with a ≤10-line executive summary.

## 0. Context loading (first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc530-hostleak-aria-checked/decisions.md` — read all of it; obey the "Owner rulings" sections.
- r1 report: `.../sc530-hostleak-aria-checked/sc530-r1-survey-report.md` (exec summary, §5 vertical seals, "For r2"). r1 evidence + prototype patch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r1-a6e9f21b0f51c4756/` (read-only for you; reuse its probe diffs `leakprobe.diff`, `canfail-noclick.diff`, `vertprobe.diff`).
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`: battery table (rows 1-7), "Button host-leak sweep" bullet. `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns.
- **You never call the tracker (Linear)** — not to read, not to post.

## 1. Environment
- Worktree `/home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked`; dse at `.../draw-steel-elements`. Every git command is `git -C <absolute path>`.
- `git -C <dse> fetch origin`; origin/develop must be **fb24f8a2** (SC-536). If it moved further, report it and continue on fb24f8a2.
- Branch `sc530-hostleak-aria-checked`: reset it to fb24f8a2 (it is at f81a277 with no commits of its own), then cherry-pick r1's prototype `d1ab0bd` (local branch `sc530-r1-proto`; leave that branch untouched — it must never land). Resolve, commit. Then your r2 commit(s) on top. Commit after every coherent step. Do not push.
- Do not edit anything under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir. Do not edit dse-verify SKILL.md, CHANGELOG, or any workspace doc (owner drafts dse-verify text). Main-checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, ignore.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r2-<your agentId>/`; unique script/log names.
- If `package.json`'s obsidian version changed across the rebase, `npm ci` first (footgun 2).

## 2. Task
Owner rulings (verbatim from the ledger):
- "Key form: (A) `|checked` only when `aria-checked="true"`. Rejected (B): renames 2 kinds, adds no coverage."
- "Vertical-seal context gap: FOLD as form (C) (`|in:track--vertical`, or the equivalent context suffix r2 finds cleanest). Same file, same sweep key, same failure class (a styled variant hidden behind a shared key), +2 kinds, no click. Both new vertical kinds go in `SC530_EXPECT` (named FAIL if untagged); r2 must measure (C) LIVE (r1 measured it offline only) and prove it can fail with r1's vertical-seal probe (head rc 1 naming the vertical kind)."
- From the earlier rulings: "Every new kind must be asserted tagged (named FAIL, never skip). Existing kinds stay compared; no existing kind's first node may move. A key RENAME of an existing kind (same first node, new string) must be listed explicitly in the report, never silent." and "Do NOT mount the Recoveries popover, add `staminaRecoveryPopover`, or click the pips (SC-526). Keep any SC-530 additions in their own named constants/helper (`SC530_*`) or in the existing SC-527 section data, one call site, so SC-526 rebases cleanly."

Do:
1. Add the (C) context suffix in `tagButtons` (pick the selector from the real DOM — the vertical track's container class; a comment says why: own-box CSS differs from horizontal seals, cite SC-530). It must append only for seals inside a vertical track; no other key may change. Extend `SC530_EXPECT` with the vertical kinds actually produced (expected 2: the idle and the checked vertical seal — confirm against the live run and list them).
2. Comments: check r1's `tagButtons` comment and the replaced SC-527 "Known gap (SC-530)" header text read correctly and mention (C).
3. Jest seam tests in `test/dom/visual-harness/fixtures.test.ts` beside SC-527's, per r1 "For r2": (1) `SC530_EXPECT` literal = exactly the expected keys, all prefixed `negotiation`; (2) `tagButtons` read from `shoot.mjs` source and run in jsdom on the gallery + SC-527 mount: at load gives `negotiation|dse-track__slot|checked` and the vertical kinds, no `negotiation|dse-pr__row|checked`; after clicking section 38's `.dse-pr__row` #0 gives `negotiation|dse-pr__row|checked`; never any `aria-checked:` string; `negotiation|dse-pr__row` and `negotiation|dse-track__slot` still present (no renames); (3) call-site order: `assertSc530Tagged(` exactly twice (declaration + 1 call), after `assertSc527Tagged(` in `assertBtnHostLeak`. Break-prove each test (a one-line break, rc 1, revert) and list the breaks.

## 3. Gates (dse-verify battery, in order, on the final head)
Expected (ledger, at fb24f8a2 + SC-530):
- tsc clean; lint clean; jest **6228 + your new tests passed / 1 skipped / 249 of 250 suites** (compare after a shots run — dse-verify row 3).
- shots: first a clean **fb24f8a2** base run (record its 592-PNG sha256 list and host-leak lines), then head. Head: rc 0, **592 PNGs sha256-identical to the fb24f8a2 base**, 0 FAIL, `button host-leak OK (161 … 966 …)`, **boundary 34 records with names identical to base**, modal 228, input 15/176, checkbox 7/116, prose 106 [212]. If the numbers differ from 161/966, stop and explain (report kinds new/renamed/lost/moved vs base, dark and light).
- freeze `280/280` 0 FAILED.
- lifecycle 44/44 and e2e 124/124 0 failed 0 known-bug 87/87: run them, OR carry them only if `main.js` + `styles.css` built at head are byte-identical to a build at clean fb24f8a2 (record both sha256). If you run lifecycle, use two `--only` halves (22 + 22), each a separate foreground call.
- parity LAST: 0 GAPs / 0 undeclared / 24 DECLARED.
- Can-fail on the head (revert each, confirm clean): (a) r1 `leakprobe.diff` (checked tier row) → rc 1 naming only `negotiation|dse-pr__row|checked`; (b) `canfail-noclick.diff` → rc 1 named; (c) `vertprobe.diff` (vertical seal) → rc 1 naming the vertical kind. Each also 592 PNGs identical.
- Report the head's full button host-leak line + the 34 boundary records by name.

## 4. Footguns (obey all)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked/draw-steel-elements -- bash <script file>`; never `cd` in a compound command; record exit codes inside a script file written with the Write tool (devbox eats `$?`); never pipe a gate into `tail`.
- One gate per Bash call, foreground, output redirected to a unique log. No `run_in_background`/Monitor EXCEPT shots under load (dse-verify row 5): background with a unique per-run log + rc file, then poll that log/rc in foreground calls. Never wait on a completion notice; never key a wait on a generic scratch filename or another run's log.
- Never `rm` with a shell-variable target or a glob; never `rm -rf` under `/tmp/dse-*` or `.superpowers/` — delete only literal paths you created. Write scratch files with the Write tool, not heredocs.
- Never `pkill`/`killall` by pattern. Kill only PIDs verified yours (`pgrep -af "worktrees/sc530-hostleak-aria-checked/"`, or `readlink /proc/<pid>/cwd` inside your worktree).
- Redirect long output to files — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me). Need input → end your turn with `STATUS: NEEDS_CONTEXT` + the question in your report. If you ever send a message, its FIRST WORD is `SC-530:`.
- If the report-file write is blocked, return the report inline.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc530-hostleak-aria-checked/sc530-r2-impl-report.md`, opening with a ≤10-line executive summary (verdict, head sha + commit list, base, every gate number, can-fail rc's, build identity). Then details, `Drive-by fixes:` and `Follow-ups:`. Final text: verdict, shas, numbers, absolute evidence paths. Leave the dse tree clean; the superproject worktree should show only ` M draw-steel-elements`.
