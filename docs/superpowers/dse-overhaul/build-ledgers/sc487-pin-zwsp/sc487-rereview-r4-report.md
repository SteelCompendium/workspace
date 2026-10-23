# SC-487 scoped re-review, round 4 (fresh reviewer)

**Executive summary**
- **Verdict: FIX-FIRST** on one LOW. The fix is one regex plus 4 table rows. Reviewed dse `37f575f` (delta `4ec83ea..37f575f`, base `9f08f06`) and superproject `28e03da` (delta `101bfdd..28e03da`).
- **Counts:** HIGH 0 · MEDIUM 0 · **LOW 1** · INFO 5.
- **Ruling followed exactly.** `fenceChar` is required (no default), and all 7 call sites pass the opener's own `marker[0]`. A backtick fence keeps r3's behaviour. A tilde fence returns `/^[^ \t]*/`. The SC-476 row is byte-identical to `9f08f06`. Every backtick-fence row keeps its value. The CHANGELOG is fixed. The behaviour is identical to `candidate-fix.patch` (dropping the default argument is better).
- **Real Obsidian 1.14.4 and 1.15.0, head bundle.** These openers render in Reading view, and the in-note write, the pin (anchor + panel + panel write) and the bytes above, below and on the opening line all pass: `~~~ds-counter `x``, `~~~ds-counter x`y`, `~~~ds-counter<TAB>`x``, plus `~~~~` and quoted variants. These openers are not claimed (one Notice, note byte-identical): `~~~ds-counter`x`, NBSP, ```` ```ds-counter`x ````, ```` ```ds-counter `x ````, `~~~ `ds-counter`. The U+200B opener still pins in Live Preview.
- **LOW-R4-1:** Reading view also splits a tilde fence's first word at a **form feed**. So `~~~ds-counter<FF>`x`` is drawn, but DSE does not claim it: Pin is refused, and in a quote the click is not saved. On `d152ea4` all of these worked. Fix: `/^\f*[^ \t\f]*/` at `blockPrefix.ts:74`.
- **Gates at 37f575f (own clone).** tsc + lint rc 0. Jest **5909 passed / 4 skipped / 5913**, 241 of 242 suites; this equals 5912/1, because a clone outside the workspace skips 3 more tests: token-coverage x2 and the app.css cache test. Lifecycle **35/35 ok, 0 failed** (G-S33 ok). e2e **108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs**. Shots / freeze / parity come from the implementer's r4 logs, which postdate the head commit: shots rc 0 to the end, freeze 280/280, parity 0/0/24.
- **Implementer's question:** right. `matchFenceMarker` reads `~~~`ds-x y` as the mixed run `~~~`` with rest `ds-x y` (no backtick), so only the spaced form `~~~ `ds-x y` tests the leading-backtick tilde branch. Mixed runs are a separate, pre-existing gap (INFO-1).
- **Working tree:** dse worktree and superproject status are identical before and after (`status-before-*.txt` = `status-after-*.txt`).

## Findings

### LOW-R4-1: a form feed before the backtick: Reading view draws the block, DSE no longer claims it (regression vs d152ea4)
- **Where:** `src/framework/host/blockPrefix.ts:74`, `return /^[^ \t]*/.exec(trimmed)![0];`
- **Measured (head bundle, 1.14.4 and 1.15.0).** In a tilde fence whose info string has a backtick, Reading view ends the first word at a space, a tab **or a form feed (U+000C)**. These characters do NOT end it, and the fence is not drawn: U+000B, U+00A0, U+0085, U+1680, U+2000, U+2003, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF, U+180E. A leading form feed (`~~~<FF>ds-counter `x``) is not drawn.
- **Failure scenario (head):**
  - `~~~ds-counter<FF>`x``: Reading view draws the counter. DSE's language is `ds-counter\f`x``. The in-note click is saved, but **Pin is refused** with "this block's type ("ds-counter<U+000C>`x`") is not one the sidebar can show". The command path refuses it too.
  - `> ~~~ds-counter<FF>`x`` (quoted): Reading view draws it, and **the click is not saved**: "a change to a block in tq-ff-bt was not saved — the plugin can't tell where this block sits in the note."
- **On d152ea4 (base bundle, same probe):** all three work (write, pin, quoted write). `fenceLanguage` there ended the name at `\s`. So this is a regression. It started in r3, which refused every backtick info string, and r4 only restored space and tab. It also breaks O2 ("claim what either mode renders"), and the new CHANGELOG clause says "as before, and still pins".
- **Prescribed fix:** `return /^\f*[^ \t\f]*/.exec(trimmed)![0];`
  - Keep the leading `\f*`. Plain `/^[^ \t\f]*/` returns `''` for `~~~<FF>ds-counter `x``, and the command then goes silent: no Notice, measured on the candidate. With `\f*` that opener still gives the unregistered alias `\fds-counter` and its one Notice, as on head.
  - Add rows (blockPrefix tilde table + e2eIntegrity):

    | Opener | Expected |
    |---|---|
    | `~~~ds-x\f`x`` | `ds-x` |
    | `> ~~~ds-x\f`x`` | `ds-x` |
    | `~~~\fds-x `x`` | `\fds-x` |
    | `~~~ds-x\v`x`` | `ds-x\v`x`` |
  - Update the doc comment at `blockPrefix.ts:61-64,69-71` ("split on space / tab" → "space / tab / form feed").
- **Checked on a candidate** (`candidate-ff.patch`, tried in my clone and reverted):
  - 1.14.4: `~~~ds-counter<FF>`x`` and the quoted variant are claimed. Write, pin, panel write and bytes all pass.
  - Every V4 claimed and unclaimed row is unchanged, and so are U+000B and U+0085.
  - The 5 fence suites (blockPrefix, e2eIntegrity, registration, anchor, schemaSuggest) pass: 432/432.
- **Severity reasoning:** a form feed in a fence's info string is rare, and the failure is visible (it shows a Notice). But this is the rule this round exists to get right, it regresses vs base, and the fix is one regex. Owner's call whether to fold it or file it.

### INFO-1: mixed fence runs: claimed by the command though neither mode draws them (pre-existing, same on d152ea4)
- **Where:**
  - `blockPrefix.ts:28`: `FENCE_MARKER = /^(…)?([`~]{3,})([^\n]*)$/` accepts mixed runs.
  - `authoring/fenceScan.ts:16` `FENCE_LINE` uses same-character runs (`(`{3,}|~{3,})`), so the two parsers disagree.
- **Measured (1.14.4, head and base alike):**
  - `~~~`ds-counter y` closed by `~~~~`, and ```` ```~ds-counter ```` closed by ```` ```` ````: neither mode draws them. "Send block to sidebar" still stamps `_dse_anchor` and mounts a panel.
  - With a 3-character closer the command does nothing and shows no Notice. The note is unchanged.
- **Prescribed:** a Backlog ticket (owner files it), not this branch. Make `FENCE_MARKER`'s run same-character: `(`{3,}|~{3,})`. Then `~~~`ds-x` gives rest `` `ds-x`` and the tilde-backtick branch.

### INFO-2: a lone CR inside the opening line (pre-existing, same on d152ea4)
- `~~~ds-counter\r`x`` (a lone U+000D mid-line): both modes draw a counter, and a click is **not saved, with no Notice**. The command pins it. The editor splits lines at `\r`; DSE's text split does not.
- Rare, and the same on base. Mention it in INFO-1's ticket if the owner likes.

### INFO-3: a trailing form feed is dropped from the opening line on a pin/write (pre-existing)
- `~~~ds-counter `x`<FF>`: the pin stamps the anchor and the panel mounts, but the opening line loses its trailing `\f`. Cause: `fenceLine.ts:44` `info: match.rest.trimEnd()`, the SC-290 normalization.
- This is the same class as the U+FEFF INFO the owner already DROPPED. No action.

### INFO-4: comments that no longer match the code (cosmetic)
- `registration.ts:23` still says "the alias is `fenceAlias(match.rest)`".
- `anchor.ts:267` says "the first token of the TRIMMED info string".
- `test/unit/e2eIntegrity.test.ts:199-201` says "(either fence kind) is no opener in either mode", then qualifies it with "...but a TILDE fence".
- Optional touch-up while folding LOW-R4-1.

### INFO-5: one r3-only assertion changed, correctly
- `blockPrefix.test.ts`: the backtick-info test's alias assertion used `~~~${info}`, and is now ```` ```${info} ````. That assertion was added in r3 (`4ec83ea`, `git log -S`), so it is not a pre-existing backtick row.
- Its tilde coverage moved to the new tilde table. Every row that predates SC-487 r3 changed only its call signature.

## Check-by-check
1. **Ruling** — met (see summary). `tsc --noEmit && tsc --noEmit -p e2e` rc 0 with the parameter required. `git diff 9f08f06 37f575f -- test/dom/authoring/schemaSuggest.test.ts` is empty.
2. **vs candidate-fix.patch** — the same code. The only difference is the missing default `= '`'`. That is better: a caller added later must say which fence it is, instead of silently getting backtick behaviour.
3. **Real Obsidian** — results are in `meas-head-114.json`, `meas-head-115.json`, `unreg.json`, plus the `after/` byte snapshots.
4. **Caller hunt** — the 7 call sites are `fenceLine.ts:43`, `fenceScan.ts:60`, `anchor.ts:270,328`, `registration.ts:39`, `noteFences.ts:43,71`. Each passes its own opener's `marker[0]`.
   - Quoted and `~~~~` openers were measured correct.
   - Nested scans (iterateFences, aliasAtLine, the ReadingModeBlockHost scan) read the fence kind from each opener.
   - `ReferenceResolver.ts:26` and `typeAdapters.ts:26` have their own regexes. They do not call `fenceLanguage`, and nothing in the delta touches them.
   - Remaining gaps: INFO-1 (mixed runs) and LOW-R4-1 (form feed).
5. **Gates** — see summary.

## Evidence
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r4/`:
- **Gates:** `r4-gate-tsc.log`, `r4-gate-lint.log`, `r4-jest-full.log`, `r4-gate-lifecycle.log`, `r4-gate-e2e.log`.
- **Probes:**
  - `probe-head-114/` (V4 set, 1.14.4)
  - `probe-v5-head-114/` (which characters split the word, mixed runs, CR)
  - `probe-v5-base-114/` (d152ea4 bundle)
  - `probe-head-115/` (1.15.0)
  - `probe-cand-114/` (form-feed candidate)
- **Candidate:** `candidate-ff.patch`, `r4-jest-cand.log`.
- **Harness:** `r4-fixtures.mjs`, `r4-scenarios.mjs`, `r4-probe-*.sh`, `r4-summ.py`.
- **Bundles:** `bundle-head/` (main.js sha256 `c72d17a9…`), `bundle-cand/`.
- **Status snapshots:** `status-{before,after}-{dse,super}.txt`.
