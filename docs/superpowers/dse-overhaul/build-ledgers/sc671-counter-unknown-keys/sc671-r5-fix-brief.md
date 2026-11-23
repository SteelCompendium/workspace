# SC-671 r5 — fix round brief (review findings LOW-1, LOW-2, LOW-3, INFO-3)

The independent review (r4) returned LAND-READY with three LOW and five INFO findings on plugin `16cbd05f`. The owner
ruled four of them into this round. Everything else is out of scope.

## 1. Context loading (do this first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/decisions.md`
  (owner rulings; the "r4 findings ruled" entry).
- Review report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r4-review-report.md`
  — read the `## Findings` section (LOW-1, LOW-2, LOW-3, INFO item 3). The four findings are quoted in section 2 below.
- Your own r3 brief and report in the same directory (gate command shapes, footguns, scratch conventions) still apply:
  `sc671-r3-rebase-brief.md` sections 3 and 4. Use a NEW private scratch dir
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r5-fix/`
  with `r5-` prefixed scripts and logs.
- **You never call the tracker (Linear).**
- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys`
  Plugin: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements`
  Start state: plugin `16cbd05f` on `bdf0255e`; superproject `cfd52772` (pointer bump) on `cd79d841` (CHANGELOG) on
  `8e7a7bbe`. `git -C <abs path> fetch origin` in both first. At brief time plugin `origin/develop` = `bdf0255e`
  (no rebase needed) and workspace `origin/main` = `565a35c1` (docs only; the superproject needs a plain rebase).
  If plugin `origin/develop` has moved, rebase the plugin branch onto it BEFORE the fixes and say so in the first line
  of the report (any conflict outside `e2e/README.md`: stop, `STATUS: NEEDS_CONTEXT`).
- The workspace-level `CHANGELOG.md` you edit is
  `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/CHANGELOG.md` — never the one under
  `/home/scott/code/steelCompendium/workspace/`.

## 2. The task — the four findings, verbatim from the review, each with the owner's ruling

### LOW-1 (fold)

> **Where:** `test/dom/elements/wrapperDefaultKeys.test.ts:392-397`, `:456-458`, `:495-498` (commit `16cbd05f`).
> **What changed:** r1 changed the three sources from `title: Deaths` to `{}` / `PREFS`, and left the expectations alone. What those three tests pinned for SC-482 and SC-652 is still pinned: a mapping source goes back to `{}` and not to `''`, and a block with only a `prefs:` map goes back to that map.
> **What is lost:** the case the ticket creates. Nothing in the suite now runs this: a block that holds only keys the counter does not read, + then −, on the same live view, comes back byte-identical, with and without reserved keys. For example `title: Deaths` -> `current_value: 1\ntitle: Deaths` -> `title: Deaths`, and the same with `prefs:` in front.
> **Fix:** keep the `{}` cases and add the three `title: Deaths` cases back with the new expectations (`title: Deaths`, `prefs:\n  sbDensity: compact\ntitle: Deaths`, `collapsed: false\ntitle: Deaths`). Adding one O-test in `counter-own-keys.test.ts` would also do.

Ruling: do the first form (keep the `{}` cases, add the three `title: Deaths` cases back with the new expectations).
Derive each expected body from what the code writes and check it against the reviewer's three strings; if one
differs, report the difference — do not bend the test.

### LOW-2 (fold)

> **Where:** `src/elements/counter/model.ts:57-59`, and `:87` (`Object.fromEntries([...Object.entries(model), ...extras])`).
> **Failure scenario:** someone later adds a field to `Counter.parse`, say `step`, and forgets `KNOWN_KEYS`. The source value of `step` is then carried as an unknown pair. Because `fromEntries` keeps the last value for a duplicate key, the stale source value overwrites the model's live value on every write. Mutant M3 shows the effect with `current_value`: a + is written as the old value, so the press never lands.
> **Why it is LOW:** today the list is correct, and the unit test "the model has exactly the seven fields" pins the instance keys. But no test ties `KNOWN_KEYS` to those keys.
> **Fix (any one):**
> - In `serialize`, drop extras whose key the model owns: `extras.filter(([k]) => !Object.prototype.hasOwnProperty.call(model, k))`.
> - Derive the set: `new Set(Object.keys(Counter.parse({})))`.
> - Add a unit test that asserts `KNOWN_KEYS` equals the instance keys.

Ruling: do the FIRST (the `serialize` filter, with a one-line comment saying why) AND a unit test that fails when a
`Counter` field is missing from `KNOWN_KEYS` (shape is yours: export the set for the test, or assert through
`parse` / `serialize`; say which). Constraints: a block with no unknown keys still returns through the early
`stringifyOmittingUntouched(model)` line untouched; a hostile key (`__proto__`, `constructor`, `toString`,
`hasOwnProperty`, `toJSON`) is still carried and written back — the existing tests for those must stay green
unedited; `src/model/Counter.ts` stays unchanged. Add one test that shows the filter working (an extra whose key the
model owns is not written over the model's value) — if that cannot be reached through the public `parse` /
`serialize` without changing product code further, say so and leave the `KNOWN_KEYS` test as the guard.

### LOW-3 (fold)

> **Where:** worktree `CHANGELOG.md:11-15`.
> **Failure scenario:** a block with `2024: year` comes back with `"2024": year` on the first line, above `max_value`, now quoted. Owner ruling: "document it". It is documented only in the code comment (`model.ts:53-55`) and in a unit test, not in anything a user reads.
> **Fix:** add "(a key that is a number, like `2024:`, moves to the top)" to the parenthesis.

Ruling: add that clause inside the bullet's existing parenthesis, in plain words, e.g. after "your extra keys follow
the counter's own keys": `, except a key that is a number, like `2024:`, which moves to the top and comes back in
quotes`. Change nothing else in the bullet or the file.

### INFO-3 (fold, bounded)

> **r1's jsdom harness skips a step production takes.** `test/dom/elements/counter-own-keys.test.ts:56-63` never calls `host.setMountedBody(body)`; production does at `src/framework/registerFrameworkElements.ts:149`.
> - Without it, writes go out without the SC-552 pin. An outside edit that lands inside the debounce is then overwritten: the branch writes the stale unknown value back (`changed: before`), base drops every unknown key.
> - With it, as in production, both builds refuse the write with the dropped-write Notice, and the outside edit stays. Real Obsidian shows the same (R4C, branch and base).
> - Not a product bug. Suggest seeding the harness.

Ruling: seed the harness the way production does (`host.setMountedBody(body)` before `pipeline.run`). Any test whose
outcome changes is rewritten to assert the PRODUCTION behaviour (for an outside edit inside the debounce: the write is
refused, the dropped-write Notice is shown, the outside edit and its unknown keys are intact in the note). **Bound:**
this touches `test/dom/elements/counter-own-keys.test.ts` only. If seeding turns more than three tests red, or needs
a product-code change, stop and report (`STATUS: NEEDS_CONTEXT`) with the list.

### Out of scope — do not touch

- SC-684 (stamina bar and project drop unknown keys), SC-685 (identical-twins `view registry collisions`), SC-599
  (formatting and number rewrite on write), SC-672, SC-673, SC-674, SC-680, SC-668 (G-S61 torn read).
- INFO-1, INFO-2, INFO-4, INFO-5 of the review. Montage and negotiation code. The jest `stringifyYaml` mock. The e2e
  driver. `.claude/skills/dse-verify/SKILL.md`.
- No new e2e scenario, no new fixture, no file name or scenario id that SC-442 holds (see the ledger's "SC-442
  overlap" ruling), no further edit to `e2e/README.md`.

### Commits

- Plugin: small commits on top of `16cbd05f` (suggested: one `fix(counter): …` for LOW-2 with its tests, one
  `test(counter): …` for LOW-1 + INFO-3). Do not rewrite the four existing commits.
- Superproject, final shape on top of the then-current `origin/main`: the existing CHANGELOG commit, ONE new
  `docs(changelog): SC-671 …` commit for LOW-3, then exactly ONE pointer-bump commit. Procedure: confirm
  `git -C <worktree> log -1 --format=%s` is the `chore: bump draw-steel-elements to 16cbd05f …` commit, drop it
  (`git -C <worktree> reset --hard HEAD~1` — this does not touch the submodule checkout), `git -C <worktree> rebase
  origin/main`, commit the CHANGELOG clause, and AFTER the gates are green commit the new bump
  `chore: bump draw-steel-elements to <short sha> (SC-671: a Counter write keeps the keys it does not use)` with only
  `draw-steel-elements` staged. `git -C <worktree> status --short` must then print nothing.
- No AI attribution in any commit message. No push.

## 3. Gates — full battery on the final plugin head

Baseline is r3's measurement on `16cbd05f`. Expected after this round:

- tsc exit 0, lint exit 0.
- jest **13890 + N passed / 2 skipped** fresh, where N is the number of tests you add (state N and list them). No
  existing test may be deleted; a rewritten test (INFO-3) keeps the count.
- For each new or rewritten test, state whether it fails without the matching change (LOW-2 filter test: revert the
  filter line locally, run that test, restore; LOW-1 cases: they guard today's behaviour, so "passes on `16cbd05f`"
  is the expected answer — say so).
- lifecycle **64/64** over the seven `--only=` parts (accepted: 63/64 only with G-S61's torn-read line and 0 stale
  frames, SC-668 — re-run part 4 once first).
- e2e **`OBSIDIAN-E2E done: 664/671 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`** (unchanged).
- `styles.css` sha256 = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (the clean `bdf0255e`
  build; if the plugin was rebased onto a newer develop, rebuild the clean base and compare). Identical → shots /
  freeze / parity carry.

A number that differs is reported as measured, with the log path.

## 4. Footguns

All of `sc671-r3-rebase-brief.md` section 4 applies unchanged (devbox script files for exit codes, no `cd` in compound
commands, `git -C`, no `rm` in /tmp or scratch, the one literal `rm -f …/main.js …/styles.css` before jest, kill by
own PID only, Bash backgrounds at about 120 s so poll your own pid with `timeout 100 tail --pid=<pid> -f /dev/null`,
no Monitor, no waiting on notices, unique per-run log names, never key a wait-loop on a scratch file from another
run, long output to files, no tags, no push, no `just wt-finish` / `deploy*` / `sync`). Scratch worktrees registered
in the plugin clone (`base-bdf0`, the reviewer's `dse-probe`, two stale `prunable` ones): leave them, no
`git worktree prune`. If the report-file write is blocked by your harness, return the report inline. You cannot
`SendMessage` me: end with `STATUS: NEEDS_CONTEXT` and the question if blocked; a message sent anyway must start with
`SC-671:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r5-fix-report.md`,
opening with a ≤10-line executive summary: verdict, plugin head sha + base, superproject head sha + base, N new
tests, each gate's measured summary line. Then per finding: what changed (file:line), the test that guards it and
whether it fails without the change; `git -C <plugin> diff --stat 16cbd05f HEAD`; gate log paths; `Drive-by fixes:`;
`Follow-ups:`.

## 6. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, shas, N, measured numbers per gate — no prose,
plus the absolute path of every evidence artifact.
