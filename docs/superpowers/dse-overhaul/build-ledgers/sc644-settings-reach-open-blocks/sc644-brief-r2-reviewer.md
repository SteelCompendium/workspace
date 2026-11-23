# SC-644 r2 reviewer brief — independent adversarial review

Final text goes to the SC-644 ticket-owner, not a human. Raw facts only.

## 0. Context loading

- Ledger (current state, rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md`.
- The implementation brief the author worked from: `sc644-brief-r1-implementer.md` (same dir). Read §1-§4 for the
  required behaviour. Do NOT read the author's report until you have formed your own view of the diff; then check its
  claims (numbers, mutants) against reality.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks` (plugin under
  `draw-steel-elements/`, branch `sc644-settings-reach-open-blocks`). Diff: `git -C <plugin> diff 620d5774..HEAD` (or the
  base the report names if the author rebased). Superproject: `git -C <worktree> log --oneline origin/main..HEAD`.
- **Never edit the shared main checkout** `/home/scott/code/steelCompendium/workspace/` (only your report goes into the
  ledger dir). Use `git -C <abs path>`. Its dse dirt (`demo-vault/Welcome.md`, untracked manifest/vault notes) is Scott's
  live vault — expected.
- **You never call the tracker.**
- Gate mechanics: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 1-241 (read in
  parts with `sed -n | cut -c1-1500`; the file is ~370 KB). All the brief-§5 battery mechanics and §7 safety footguns of the
  implementer brief apply to you verbatim — read them there.

## 1. What to do — execute and probe, do not just read

- Review the diff for correctness against the ledger's O1 / O2 and the brief's §2-§3: chrome rebuilt on each of the three
  pref flips on open blocks; body not re-rendered; collapse state kept (except O1 forced expand); block keys win; pencil
  gate unchanged (embeds / canPersist=false / ds-hero never get one); focus not stolen; collapse invariant kept;
  subscription disposed on unload (no leak; flip after unload harmless); settings-tab preview still fine; mechanism
  reusable for SC-645.
- Probe at runtime: write throwaway jsdom probes and/or e2e `--only=` runs that try to break it — rapid repeated flips, flip
  while a block is collapsed by hand, flip with two panes / an embed of the same note, flip while a form/modal from the block
  is open, flip during a pending write (400 ms persist debounce), plugin disable/enable then flip, many blocks in one note.
  Leave probes uncommitted in your private scratch dir (never in the worktree's tracked tree; never `rm` anything).
- Mutation-test the new tests: break each product line the fix adds and check a test goes red. Report survivors.
- Check the e2e tests: SET-L01 / SET-G06 are plain tests now, new SET ids are unique globally, no bracketed ticket ids in
  titles, no retries / settle-wait rescues.
- Re-run the gates yourself: tsc, lint, jest (full), e2e full run, lifecycle all seven parts. Shots/freeze/parity only if
  the diff touches CSS or rendered DOM shape of a frozen shot — say which you ran and why.

Baselines at dse develop `620d5774` (workspace main `11ee0b00`): jest 12913 passed / 2 skipped fresh (12914 / 1 with the
shots cache) · lifecycle 64/64 · e2e `567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. Expected: known-bug 22, 0 failed,
coverage Y/Y. The branch must sit on 620d5774 and the superproject on 11ee0b00 with ONE pointer bump — check it.

## 2. Report

`<ledger dir>/sc644-r2-review-report.md`, opening with a ≤10-line executive summary: verdict (LAND / FIX), counts by
severity, gate numbers you measured. Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a failure
scenario, and a prescribed fix. Then mutants (killed / survived). If the report write is blocked, return it inline.

Scratch: private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r2-rev/`.
Never `rm` anything in /tmp or the scratchpad. Never key a wait-loop on a scratch filename. Redirect long output to files.
Never wait on a background notice: poll your own pid. You cannot `SendMessage` me; if you need input end with
`STATUS: NEEDS_CONTEXT` and the question (any message you do send starts with `SC-644:`).

Final text: the executive summary plus the absolute path of every evidence artifact.

## 3. Author's state (r1 result) and two questions for you

Author reports dse head `92940547` on `620d5774`, superproject `85869486` on origin/main `28ed9439` (one changelog commit +
one pointer bump). Mechanism `src/framework/livePrefs.ts` (`watchPrefs`); O2 switch `START_COLLAPSED_REACHES_OPEN_BLOCKS`
in `pipeline.ts`. Author's report: `sc644-r1-impl-report.md` (read after forming your own view).

Rule on these author follow-ups with a severity and a prescribed fix (or "drop" with a reason):
- F1: e2e `dse.setPrefs({})` can lose to the previous scenario's debounced pref save, flushed on plugin unload; SET-L05/L06
  work around it with `diskData()`. Proposed root fix: `prefsStorage.flush()` before `saveData` in `e2e/driver/dse.ts`.
  Is the race real, could it flake other specs, and is the proposed fix right?
- F2: focus inside the chrome panel when it is rebuilt falls to `body`. Is it reachable (settings opens in a POPOUT window
  in Obsidian 1.14.4; think also of keyboard users, a hotkey/command that flips a pref, sync of data.json from another
  device)? Is it worth fixing?
