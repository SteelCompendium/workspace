# SC-580 r2 — independent adversarial review brief

Your final text goes to the SC-580 ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/decisions.md`.
- What was asked: `…/sc580-r1-implementer-brief.md` §2 (behaviour spec + tests). Read the
  implementer's report `…/sc580-r1-implementer-report.md` executive summary only — form your own
  view from the code, not from its claims.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc580-conditions-type-to-search`; plugin
  branch `sc580-conditions-type-to-search`, base develop `3ad68185`. Review
  `git -C <plugin path> diff 3ad68185..HEAD` and the superproject branch's CHANGELOG commit.
  First `git -C <plugin path> fetch origin`; if `origin/develop` moved past `3ad68185`, say so
  (do not rebase — report it).
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~370 KB — read in parts: "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes",
  "THE exit-code footgun", CURRENT block of "Current expected numbers").
- Never write under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger
  dir. Scott's live-vault dirt in the main checkout's dse is expected; ignore it.

## 2. Task — execute and probe, not just read

Hunt for ways the new type-to-search handler is wrong. At minimum probe, in **real Obsidian**
(e2e driver or a throwaway spec you do not commit), and in jest where it suffices:

- Fast `daz` typed with no pause: input reads exactly `daz`, Dazed offered, no lost/doubled chars.
- Keys that must NOT be taken: Space and Enter on focused buttons (incl. "+ Add condition" and a
  condition row's controls), Tab / Shift+Tab, arrows, Escape (SC-431 behaviour unchanged: dropdown
  open → closes dropdown; closed → closes window per today), modifier chords (Ctrl/Cmd+P, Ctrl+Z…),
  a select's own type-ahead (duration picker), IME composition.
- A second modal stacked above this one (anything this window opens, e.g. the pool/confirm paths)
  — typing there must not leak into this window's Add search.
- Listener lifetime: close and reopen the window several times; keys typed after close do nothing;
  no duplicated handlers (one keypress → one char).
- Already-open search with focus elsewhere in the window: the char appends and focus moves to input.
- Shift+letter gives the uppercase char; digits/punctuation behave sanely (no throw).
- Does anything else in the plugin open a ConditionsModal-like window that shares this code path
  (hover preview, sidebar, embed)? Check the handler works or is harmless there.
- Test quality: would the new jest and e2e tests fail if the handler were deleted? Mutate it
  (delete the handler, drop the text-entry guard, drop the modifier guard) and run the affected
  tests; report which mutants survive.
- Scenario-id hygiene: no bracketed ticket id in a test title; new COND ids unique (`grep -rn`).

Then re-run the full battery yourself and compare with the expected numbers below.

## 3. Gates and expected numbers

Baseline at `3ad68185`: jest 10676 passed / 2 skipped (fresh worktree; 10677/1 after shots) ·
lifecycle 59/59 (six `--only` parts: 21 + 16 + 9 + 4 + 7 + 2; part 3 =
`G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`, part 4 = `G-S57,G-S62,G-S61,G-S56`,
part 5 = `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`, part 6 = `G-S92,G-S96`; take parts 1–2's
exact ids from the skill's battery row) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`
· shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
Expected after the branch: e2e 0 failed and 3 known-bug (SC-257, SC-355, SC-384), coverage Y/Y;
lifecycle 59/59; shots/freeze/parity unchanged.

Gate-running rules: `devbox run -c <plugin path> -- bash <script file>`; no `cd` inside compound
commands; never trust an echoed `$?` in `bash -c`; no `| tail` on a gate; `rm -f` the plugin root's
`main.js styles.css` (literal absolute paths) before jest; load-sensitive jest reds → check
`/proc/loadavg`, re-run alone. Calls over 180 s get backgrounded: wait with
`timeout 175 tail --pid=<your own pid> -f /dev/null` (check `/proc/<pid>/cwd` is in this worktree),
then read the log. Never key a wait-loop on a scratch filename or contents. Redirect long output to
files. Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc580-r2-review/`,
files written with the Write tool. **Never `rm -rf` a `/tmp` glob or shared dir; never `rm` with a
shell-variable path; never `pkill`/`killall` by pattern** — kill only your own PIDs. `git -C <abs path>`
for every git command. Do not commit to the branch; leave the worktree clean (revert any probe spec).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/sc580-r2-review-report.md`,
opening with a ≤10-line executive summary: verdict (LAND / FIX), count by severity, gate numbers.
Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario, and prescribed fix.
Gate logs alongside as `sc580-r2-gate-<gate>.log`. If the write is blocked, return the report inline.

## 5. Return contract

Raw facts: verdict, findings list (severity, file:line, one line each), mutation results, gate
numbers, artifact paths. You cannot `SendMessage` me; if you need input end with STATUS: NEEDS_CONTEXT.
Any message you send anyway starts with `SC-580:`.
