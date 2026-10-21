# SC-476 independent review, round 1 (plugin 37d625c, superproject c3eca47)

**Verdict: APPROVE-WITH-FIXES.** The code fix is correct and well pinned. The one required fix is in the docs: both CHANGELOG bullets are wrong.
- The fix `fenceScan.ts:54` matches SC-457's `fenceLanguage` rule. 47 jest probes plus 16 real-Obsidian 1.14.4 probes show completions now appear for `ds-stamina-bar extra`, tab, leading space, `{x}`, `~~~` and callout variants, and still do NOT appear for `js ds-stamina-bar`, a bare fence or `ds-stamina-bar{x}`. `/ds` is unaffected.
- The pins are real. With the fix reverted, 7 of the 10 new tests fail (the same 7 the implementer reported).
- **MEDIUM, must fix:** both CHANGELOG bullets use ```` ```ds-counter extra ```` as the example. `ds-counter` has NO schema, so it gets no completions before or after the fix (measured in jest and in real Obsidian). The changelog promises something users will not see. Change the example to `ds-stamina-bar` (or `ds-skills`).
- **O2 measured:** real Obsidian does NOT render ```` ```DS-Counter ```` or ```` ```DS-Stamina-Bar ```` as DSE blocks, in either Reading view or Live Preview. They stay plain code blocks. The suggester still offers 9 completions inside them, so it offers completions for a block that never renders. This is old behaviour, but the new test at `schemaSuggest.test.ts:203` pins it. Follow-up ticket (LOW).
- Gates I re-ran: tsc clean, lint clean, jest 5394 passed / 1 skipped / 231 of 232 suites. Lifecycle and e2e were not re-run because the diff touches only `src/authoring/`, tests and changelogs. I ran one throwaway Obsidian probe instead. `git status` is identical before and after.

## Findings

### MEDIUM-1: the CHANGELOG example names an element that never gets completions
- `draw-steel-elements/CHANGELOG.md:25-28` and the superproject `CHANGELOG.md:11-14`.
- `ds-counter` has no schema (`src/elements/counter/definition.ts:29`: "Deliberately NO schema"). `DsSchemaSuggest.onTrigger` returns null at `schemaSuggest.ts:77` (`!def?.schema`) for every ds-counter block.
- Measured: jest on the real registry gives `keysAt('```ds-counter')` = null and `keysAt('```ds-counter extra')` = null. In real Obsidian, p14 and p15 show `suggestions: None` both with and without the extra word.
- Failure scenario: a user reads "a block opened with ```` ```ds-counter extra ```` … now reads only the first word", tries it, and still gets no suggestions.
- Elements that do get completions (with experimental ON): ds-skills, ds-stam/ds-stamina/ds-stamina-bar, ds-roll/ds-r/ds-power-roll, ds-conditions/ds-cond, ds-resource, ds-surges, ds-tokens, ds-hero. With the release default (experimental OFF), only ds-skills and the stamina-bar aliases get them. The others are deferred and gated off by SC-406.
- Fix: in both bullets, replace ```` ```ds-counter extra ```` with ```` ```ds-stamina-bar extra ```` (both sentences in each bullet). The `fenceScan.ts:50` code comment can keep ds-counter, because it is about block identity, not completions.

### LOW-1 (O2, follow-up): lowercasing offers completions in blocks Obsidian never renders
- `src/authoring/fenceScan.ts:54` (`.toLowerCase()`). The new test at `test/dom/authoring/schemaSuggest.test.ts:203` pins it.
- Measured in Obsidian 1.14.4, lifecycle-harness binary, scratch vault, Reading view and Live Preview:

| opener | Reading view | Live Preview | suggester |
|---|---|---|---|
| ```` ```DS-Stamina-Bar ```` | plain `pre > code.language-ds-stamina-bar`, no DSE root | no DSE root | **9 completions** |
| ```` ```DS-STAMINA-BAR extra ```` | plain code block | no DSE root | **9 completions** |
| ```` ```DS-Counter ```` | plain code block | no DSE root | none (no schema) |

  So Obsidian's code-block processor lookup is case-sensitive. The suggester, by lowercasing, offers schema keys inside a block that will never render as an element. This answers the owner's question: completions are offered for a block that never renders. The reverse case does not occur.
- This existed before the fix: a bare ```` ```DS-Stamina-Bar ```` was already lowercased. The fix extends it to mixed-case openers with extra words.
- Fix (follow-up ticket, outside O2's scope): drop `.toLowerCase()` at `fenceScan.ts:54`. That makes the swap to SC-457's `fenceLanguage` an exact one-for-one import. Flip the `:203` pin to expect `lang === 'DS-Counter'` and add a suggest-level "no completions for ```` ```DS-Stamina-Bar ````" test. Update the `FenceState.lang` doc comment (`fenceScan.ts:20`), which says "lowercased".
- If the owner rules lowercasing out now (one line), it fits this ticket: the comment already says the code mirrors `fenceLanguage`, which does not lowercase.

### LOW-2: a backtick fence whose info string contains a backtick now gets completions (new)
- `src/authoring/fenceScan.ts:54`, with the opener detection at `:15` and `:46`.
- ```` ```ds-stamina-bar `x` ```` is NOT a fence opener in CommonMark (backtick fences cannot have a backtick in the info string). Real Obsidian renders it as paragraph text, with no DSE root in either mode. The suggester now offers 9 completions on the line below it (measured, p11).
- Before the fix the whole info string was used, `registry.get` missed, and no completions appeared. The wrong opener detection itself is older (the scanner already treated that line as an opener for `inFence` and `/ds` suppression). The fix newly turns it into wrong completions.
- This is very unlikely in practice. Fix (follow-up, not this ticket): in `scanFenceState`'s opener branch, skip a backtick-run opener whose `rest` contains a backtick, as CommonMark does.

### INFO-1: NBSP / em-space separators and glued `{x}`: Obsidian disagrees with itself
- Measured: ```` ```ds-stamina-bar<NBSP>extra ```` and `<U+2003>extra` are NOT rendered in Reading view (code class `\xa0extra language-ds-stamina-bar`) but ARE rendered in Live Preview. ```` ```ds-stamina-bar{x} ```` is the same: not rendered in Reading view, rendered in Live Preview.
- The suggester (`\S`, same as SC-457's `fenceLanguage`) offers completions for NBSP/em-space (matching Live Preview) and none for `{x}`-glued (matching Reading view). No single rule can match both modes. Not a finding against this fix. Recorded so SC-457's rule is not mistaken for Obsidian's exact rule (`anchor.ts:255` cites the reading renderer's `/^[^ \t]+/`).

### INFO-2: the new tests use only the synthetic `ds-x` element
- `schemaSuggest.test.ts:214-229`. They are valid red/green pins (both failed on the old code). An optional extra pin on a real definition (`staminaBarElement` with ```` ```ds-stamina-bar extra ````) would also guard MEDIUM-1's class of mismatch. My probe of exactly that passed: the same 9 keys as the bare opener.

### INFO-3: trailing `\r` on an opener is not a fence to `FENCE_LINE` (old, not reachable)
- `fenceScan.ts:15`: `.` does not match `\r`, so `"```ds-counter extra\r"` does not match. Obsidian's `Editor.getLine` never returns a `\r`, so this cannot happen in practice. No action.

## Probe evidence
- jest probes (47 cases, real registry + `DsElementSuggest`, run together with the 23 tests in `schemaSuggest.test.ts`): on the fix, 69 of 70 passed (only INFO-3's `\r` case failed). With the fix reverted, 32 failed and 38 passed: 25 probes plus the implementer's 7.
  - Passing on the fix: lang = `ds-counter` for extra word, leading space, leading tab, tab separator, `~~~`, `~~~ ` + extra, `{x}`, ```` ```` ```` longer fence, NBSP, mixed case (lowercased), `> ` and `> > ` callout, 3-space indent. Spaces-only and tab-only fences give `''`. ```` ```js ds-counter ```` gives `js`. ```` ```ds-counter{x} ```` gives `ds-counter{x}`.
  - Nested shorter fence inside a ```` ```` ```` block is literal; the ```` ```` ```` closer closes. A closer with trailing spaces closes. A ```` ``` ds-roll more ```` line inside an open fence neither closes it nor changes `lang`. A second block takes its own first token.
  - Suggest level, real `ds-stamina-bar`: 8 opener variants give exactly the bare opener's 9 keys. `js`/`python`/`text ds-stamina-bar`, bare, spaces-only, `{x}`-glued and `ds-stamina-barx` give null. Enum completions with extra words match the bare opener on 3 real elements. `/ds` is suppressed inside every open fence variant and fires after the block closes.
- Real Obsidian 1.14.4, 16 notes: each note was checked in Reading view and in Live Preview (cursor parked outside the block), and the plugin's registered `DsSchemaSuggest` was driven against the live editor.
  - Extra word, tab, leading space, `{x}` and `~~~` + extra all render as `stamina-bar` in both modes and give 9 completions.
  - `js ds-stamina-bar` renders as `language-js` with no completions.
  - `ds-counter extra` renders as `counter` in both modes, with no completions (no schema).

## Gates (measured by me at 37d625c)
- `npm run tsc` (incl. `-p e2e`): clean, exit 0.
- `npm run lint`: clean, exit 0 (only the known `.eslintignore` deprecation warning).
- `npx jest` (after `rm -f main.js styles.css`, shots cache present): **Tests 5394 passed / 1 skipped / 5395; Suites 231 passed / 1 skipped / 232**. This matches the implementer's numbers.
- Lifecycle and e2e: not run (the diff touches only `src/authoring/fenceScan.ts`, a jest test and the changelogs). One throwaway lifecycle-harness probe ran (`PROBE476`, port 9297, display :161): 1/1 ok.
- Worktree `git status --porcelain` before and after: identical. Only ` M draw-steel-elements` in the superproject (the pointer, expected); the plugin is clean. Plugin HEAD `37d625c`, superproject HEAD `c3eca47`. The throwaway test and harness copy were deleted from the worktree. `main.js`/`styles.css` (gitignored) were rebuilt so the worktree is as I found it. No leftover processes; the probe's temp vault was deleted.

## Artifacts
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-rev-r1/`
- `obsidian-probe.json` and `obsidian-probe.log`: real-Obsidian measurements.
- `zzSc476ReviewProbe.test.ts.txt` and `zzSc476ReviewProbe.mjs.txt`: copies of the throwaway probes.
- `make_probe.py`: the harness patcher.
- `probe-green2.log` and `probe-red.log`: jest probe runs on the fix and with the fix reverted.
- `jest-full.log`, `tsc.log`, `lint.log`.
- `status-before.txt` and `status-after.txt`.

## Re-review r2 (plugin aaa88b7 on 37d625c; superproject 27092fe)

**Verdict: APPROVE.** All four folded findings are fixed as ruled. There are no new findings.
- MEDIUM-1, LOW-1, LOW-2 and INFO-2 are fixed exactly as the ledger's "Review r1" rulings say. The 4 new tests fail on the r1 code (15 failed with `fenceScan.ts` reverted to 37d625c).
- LOW-2 changes `inFence`, and so `/ds`, only in the CommonMark-correct direction. A real fence after the line still opens and closes correctly, and a later bare ```` ``` ```` is read as an opener, as CommonMark reads it (17 probes, all passed).
- The CHANGELOG change touches only the SC-476 bullet. The SC-290 entry is intact.
- tsc clean, lint clean, jest **5399 passed / 1 skipped / 231 of 232 suites**. `git status` is unchanged.

### (1) Each folded finding
- **MEDIUM-1:** fixed. Plugin `CHANGELOG.md:26` and the superproject `CHANGELOG.md:12` now read ```` ```ds-stamina-bar extra ````. That example is measured to give 9 completions in real Obsidian (r1 p04).
- **LOW-1:** fixed. `src/authoring/fenceScan.ts:59` is now `/^\S*/.exec(rest.trim())![0]`, character-for-character SC-457's `fenceLanguage` body, so the swap to an import is exact. The doc comment at `:20` says "case kept".
  - The test at `schemaSuggest.test.ts:203` now expects `DS-Counter`.
  - The suggest-level test at `:249-255` gives no completions for ```` ```DS-Stamina-Bar ```` and ```` ```DS-Stamina-Bar extra ```` on the real definition.
  - My probes: `Ds-stamina-bar`, `DS-STAMINA-BAR extra` and `~~~DS-Stamina-Bar` give no completions. `ds-stamina-bar extra` and `ds-stam` give 9.
- **LOW-2:** fixed. `fenceScan.ts:47-50` skips a backtick-run line whose info string contains a backtick, in the not-in-fence branch only. Tilde fences are unaffected (`schemaSuggest.test.ts:204`; my probe e). The test at `:209-212` pins it, and the suggest-level test at `:257-261` gives no completions.
- **INFO-2:** fixed. `schemaSuggest.test.ts:237-247`: the real `ds-stamina-bar` with `extra` gives the same keys as the bare opener, and contains `max_stamina`.

### (2) LOW-2's effect on `inFence` and `/ds` (`suggest.ts:35`)
- After ```` ```ds-stamina-bar `x` ````, `/ds` fires on the next line. Before the fix it was suppressed, which was wrong.
- A following real ```` ```ds-stamina-bar ```` opens: 9 keys inside it, `/ds` suppressed inside, and its bare ```` ``` ```` closes it (`/ds` fires after it, including when the closer has trailing spaces).
- A lone ```` ``` ```` after the backtick-info line OPENS a fence (lang `''`), and `/ds` is suppressed after it. CommonMark and Obsidian agree: in r1 p11, the following ```` ``` ```` opened a `<pre>`.
- Inside an open fence, a ```` ```ds `x` ```` or ```` ``` `x` ```` line is literal and does not close the fence. The real bare closer still closes.
- A single line `` ```inline code``` text `` is no longer treated as an opener, so `/ds` now works after it. This is an improvement, and correct CommonMark.
- Four-backtick and `> `-prefixed variants are not openers either.

### (3) CHANGELOG clobber check
- `git diff e31e1a0..aaa88b7 -- CHANGELOG.md` is one hunk of 4 added lines, the SC-476 bullet only, with no deletions. The SC-290 and SC-474 entries are untouched.
- The superproject `27092fe` (parent `fa40cac`) changes `CHANGELOG.md` only, +5 lines.
- Note: origin/main has since gained `2d4ece3` (a handoff doc). That shows up in `diff origin/main..HEAD` as a HANDOFF.md removal, but it is not part of the branch. It needs a rebase at landing, not a fix.

### (4) Gates (measured by me at aaa88b7)
- tsc (incl. `-p e2e`): exit 0. Lint: exit 0.
- jest: **Tests 5399 passed / 1 skipped / 5400; Suites 231 passed / 1 skipped / 232**, matching the expected numbers.
- Lifecycle and e2e: not run (the diff touches only `src/authoring/`, a test and the changelogs).
- `git status --porcelain` at exit: ` M draw-steel-elements` in the superproject only (pointer, expected); the plugin is clean. HEADs are `aaa88b7` and `27092fe`. My throwaway probe test was deleted, and the gitignored `main.js`/`styles.css` were rebuilt.

### r2 artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-rev-r1/`:
- `r2-probe-cases.txt`: the probe cases.
- `r2-probe.log` and `r2-red.log`: probe runs on aaa88b7 and with the r1 code.
- `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-status-after.txt`.
