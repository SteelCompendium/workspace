# SC-707 round 6: scoped re-review of 3a09fc95..b8eb0aaa

**Executive summary**
- Verdict: **LAND-READY**. Head `b8eb0aaa`, merge-base `e38f7838`. Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 2 · INFO 1.
- LOW-1, LOW-2 and LOW-3 are fixed. Every shape from my r4 report now gives the right list, and so do the variants with a stray `}`. LOW-2's shapes give nothing, by design, as O16 allows.
- **LOW-5 (new regression, contrived):** after a tag, an anchor or `?` inside a flow list, a quote no longer opens. Example: `[!!str "x #y"]`. The `#` inside the string is then read as a comment. With a stray `]` later in the block, this offers the hero keys inside a group; `3a09fc95` got it right.
- **LOW-6 (test gap):** the give-up on a flow continuation line (`schemaPath.ts:167`) is not tested. Mutant M10 passes all 179 tests.
- M1-M4 now each fail exactly 1 test, and so do M1b, M7, M8 and M9. With `schemaPath.ts` back at `3a09fc95`, 3 of the 5 new tests fail.
- Probes, head against `3a09fc95`:
  - probe2: 80 of 80 points identical;
  - probe4, probe5: every difference is a fix or the intended give-up;
  - probe6 (29 new cases): 2 fixes and the 4 LOW-5 regressions.
- Gates at head: tsc + lint clean · jest fresh **15099 passed / 2 skipped**. I did not re-run lifecycle or e2e, as you instructed; the implementer reported 64/64 and 949/969 ok, 0 failed, 20 known-bug, 540/540.

## Findings

### LOW-5: a quote after a tag, an anchor or `?` in a flow list no longer opens

- **Where:** `src/authoring/schemaPath.ts:70`. A quote opens only when `prev` is `''` or one of `[ { , :`. YAML also starts a scalar after node properties (`!tag `, `&anchor `) and after the explicit-key indicator `? `.
- **Measured (probe6):**

  | Case | `3a09fc95` | head |
  |---|---|---|
  | `conditions: [!!str "x #y"]`, then a group | group keys | nothing |
  | `conditions: [&a 'x #y', b]`, then a group | group keys | nothing |
  | `conditions: [? 'a #b', c]`, then a group | group keys | nothing |
  | `[!!str "x #y"]`, then `- name: G]` | group keys | **hero keys** (wrong list) |

  In each case the ` #y"]` is cut off as a comment, so the flow list stays open.
- **Not affected:** the block-context `key: &a "Bob #1"` and `key: !!str "Bob #1"` give the same result at head and at `3a09fc95` (right), because `valueOf` only looks at the first character.
- **Severity:** LOW. It needs a tagged or anchored quoted item inside a flow list, with ` #` in it and a stray closing bracket later in the block. This is the same class as LOW-1, which O16 folded.
- **Fix:** also let a quote open when the text before it, with trailing spaces removed, ends in a run of node properties or indicators that follow a scalar start, i.e. matches `/(?:^|[[{,:])\s*(?:(?:[&!]\S*|\?)\s+)*$/`. Add a test: `[!!str "x #y"]` followed by `- name: G]` gives the group keys or nothing, never the hero keys.

### LOW-6: the give-up on a flow continuation line is not tested

- **Where:** `schemaPath.ts:167`, the continuation-line branch `if (balance === null) st.giveUp = true;`. The test at `test/dom/authoring/schemaPath.test.ts:262` only covers a string opened on the line where the flow list starts, which goes through `startFlow` at `:101`.
- **Measured:** mutant M10 counts a null balance as 0 on continuation lines. It passes 179 of 179 tests in the 4 SC-707 jest files.
- **Effect of the mutant:** in `conditions: [a,⏎      "b⏎      c # d", e]`, the `]` is lost again. This brings back LOW-2 for a string that starts on a continuation line.
- **Fix:** add a test for that shape, plus a variant with a stray `]` later in the block. Expect nothing (null) for both.

### INFO-1: what (2) and (3) found

No change is needed for any of these.

**Where quotes may open (2).** All right at head:
- `{name: 'a #b', …}` (after `:`);
- `[a,'b #c']` and `[a,"b #c"]` (no space after the comma);
- `['b #c', d]` (start of the list);
- `- 'x #y'` and `- "x #y"` as block list items (the dash path never scans them);
- `name: it's`, `Bob 'x`, `Bob 'x # it's`, `at 12:30 'pm # c`.

**The give-up does not silence legitimate cases (3).** All right at head:
- a flow list that closes on its own line;
- a one-line `[a, "b c", d]`;
- `[⏎ "x #y",⏎ z]`;
- a comment line inside a flow list;
- multi-line flow maps holding `'Bob'` or `it's`;
- `'b #c'` on a continuation line;
- multi-line quotes outside flow: double quotes, single quotes with a `#`-leading line (newly right), a blank line inside, a tab-indented line inside (newly right; it used to abort);
- the cursor inside a multi-line quote, or inside a flow string: nothing offered.

The intended give-ups return null, as ruled: `fl-multiline-quote-across` and `wl-flow-quote-across-then-bracket`. The latter was the hero keys at `3a09fc95` and is now nothing.

## Mutants

Each mutant was applied in a private worktree and run on the 4 SC-707 jest files (control: 179 of 179 pass).

| Mutant | Tests failed | Which test |
|---|---|---|
| M1: a quote opens anywhere | 1 | "a quote does not open after a space inside a plain word…" |
| M1b: the r4 rule (opens after a space) | 1 | same test |
| M2: `flowBalance` without the comment strip | 1 | "a flow item's trailing comment is stripped…" |
| M3: no `\` escape | 1 | "an escaped quote…" |
| M4: no `''` | 1 | same test |
| M7: `giveUp` ignored | 1 | "a string that runs over lines inside a flow list…" |
| M8: null balance read as 0 in `flowBalance` | 1 | same test |
| M9: comment test before quote test | 1 | "inside a quote that runs over lines…" |
| **M10: continuation-line give-up off** | **0** | none (LOW-6) |
| `schemaPath.ts` at `3a09fc95` | 3 of 40 | the LOW-1, LOW-2 and LOW-3 tests |

## Gates (at `b8eb0aaa`, ticket worktree)

| Gate | Result |
|---|---|
| tsc (incl. `-p e2e`) | exit 0 |
| lint | exit 0 |
| jest, fresh (no `obsidian-app.css`; `main.js` / `styles.css` moved aside during the run, then restored byte-identical) | `Tests: 2 skipped, 15099 passed, 15101 total` · suites 324 passed / 1 skipped · exit 0 |

Implementer's `styles.css` sha256 `50436d6b…e37e98` (as expected). `git status --porcelain` was empty before and after. The private worktree has been removed.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r6-rereview/`)

| What | Files |
|---|---|
| Gate logs | `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-head.sha` |
| Build artifacts restored | `artifacts-before.sha`, `artifacts-after.sha` |
| Probe sources | `zzProbe2Sc707r2.test.ts`, `zzProbe4Sc707r4.test.ts`, `zzProbe5Sc707r4.test.ts`, `zzProbe6Sc707r6.test.ts` |
| Probe results | `zzProbe*-head.json` (head), `zzProbe*-r4.json` (`schemaPath.ts` at `3a09fc95`) |
| Mutation runs | `probe.py`, `probe-results.json`, `run-*.log`, `mutprobe-*.json` |
