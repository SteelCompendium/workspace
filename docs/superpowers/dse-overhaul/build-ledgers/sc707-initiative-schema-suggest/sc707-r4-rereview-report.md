# SC-707 round 4: scoped re-review of 4da5ef69..3a09fc95

**Executive summary**
- Verdict: **LAND-READY**. Head `3a09fc95`, merge-base with `origin/develop` `e38f7838` (develop has not moved, no rebase). Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 4 · INFO 2.
- MEDIUM-1 is fixed. The reviewer's cases (a)-(d), their single-quote and flow twins, and 21 adversarial variants all give the right list (or nothing where YAML says the cursor is inside text). r2's 80 probe2 points: only the 4 MEDIUM-1 points changed, and all 4 are now right. The other 76 are identical to `4da5ef69`, gate on and off.
- Mutation check: with `schemaPath.ts` back at `4da5ef69`, 3 of the 4 new jest tests fail. The 4th, (d), passes on the old code too: it is a regression guard. The 3 fail the same way with "quote never opens".
- AUTH-K21 passes in the full e2e and compares the saved note byte for byte. With nested lookup turned off (`resolveKeyScope` result forced to null), it fails while AUTH-K17 still passes, so it tests the nested path.
- The CHANGELOG and `docs/writing-blocks.md` no longer mention Roll or `tiers`. The remaining examples (hero `max_stamina`; Skills `custom_skills` `name`, `has_skill`) match what the code offers.
- The four LOWs are all rare or contrived YAML. LOW-1 and LOW-2 are two shapes where this delta's quote handling departs from YAML. LOW-3 is an older bug of the same class from R1. LOW-4 is five rules of the new strip that no test pins. The owner decides whether to fold them in or file them.
- Gates at `3a09fc95`: tsc + lint clean · jest 15094 passed / 2 skipped (fresh) · lifecycle 64/64 · e2e `949/969 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · styles.css sha256 `50436d6b…e37e98` (as expected).

## Findings

### LOW-1: a quote opens after any whitespace, which YAML does not do inside a plain scalar

- **Where:** `src/authoring/schemaPath.ts:66` (`stripComment`). A quote opens when it is preceded by `\s` or by `[ { , :`.
- **YAML rule:** a quoted scalar can only start where a scalar starts: at the start of the value, or after `[`, `{`, `,` or `:` (plus optional spaces) in flow. Inside a plain scalar, `'` and `"` are ordinary characters, also after a space. The implementer's `Bob's` case is right. `Bob 'x` is wrong: the strip opens a quote at `'x`, it never closes, and the ` # comment` that follows is kept as text.
- **Effect:** none on `valueOf`, because only the first character of the value matters and it is not a quote. On a flow line the comment's brackets are then counted.
- **Measured:** `conditions: [Bob 'x, y] # {` followed by an enemy group offers nothing at head, where `4da5ef69` offered the group keys. Add a later plain value with a stray `}` (`- name: G}`) and head offers the **hero** keys inside the group (probe5 `wl-apos-flow-then-brace`; `4da5ef69` gave the group keys). That needs three unusual things on two lines, so this is LOW.
- **Fix:** open a quote only at the start of the text, or when the previous non-space character is one of `[ { , :`. Never open one after a space that follows a plain character. Add a test with the two lines above, expecting the group keys.

### LOW-2: a multi-line quoted string inside a multi-line flow list loses its closing bracket

- **Where:** `schemaPath.ts:82` (`flowBalance` now calls `stripComment`) together with `:150-152` (continuation lines of a flow list are balanced one line at a time).
- **Cause:** each continuation line starts from a fresh, unquoted state. In `conditions: [a, "b⏎      c # d", e]`, the second line is inside the string, but the strip sees an unquoted ` # d` and cuts it, so the `]` is lost and the flow list stays open.
- **Measured:** head offers nothing for the group that follows. `4da5ef69` gave the group keys, because its `flowBalance` did not strip comments. With a later stray `]` (`- name: G]`), head offers the hero keys (probe5 `wl-flow-quote-across-then-bracket`). Very rare.
- **Fix:** carry the quote state across flow continuation lines. Or, the smaller change: when `stripComment` ends with a quote still open on a flow line, make the walk give up (`feed` returns `'abort'`, so the result is null).

### LOW-3 (older than this delta, same class as MEDIUM-1): inside a multi-line quote, a line that starts with `#` is skipped as a comment

- **Where:** `schemaPath.ts:143` (the `BLANK_OR_COMMENT` test) runs before `:146-149` (the `st.quote` block). The code dates from R1 (`aa06a043`), not from this delta.
- **Measured:** `- name: "Bob⏎      #1 the Orc"`, then `max_stamina: 3`, then `enemy_groups:` / `- name: "Orcs"`. The second line, the one that closes the quote, is skipped as a comment. The walk then treats `- name: "Orcs"` as the closing line and offers the **hero** keys inside the group, at both head and `4da5ef69` (probe5 `wl-ml-cont-hash-then-quote`). This is the MEDIUM-1 symptom, but it needs a wrapped quoted name whose next line starts with `#`.
- **Fix:** check `st.quote` before `BLANK_OR_COMMENT` in `feed`. A blank line inside a quote stays harmless. Test: the shape above gives the group keys. Owner's call: fold it in or file it.

### LOW-4: five rules of the new strip are not pinned by any test

- **Where:** `test/dom/authoring/schemaPath.test.ts:228-248` (the 4 new tests).
- **Measured:** each mutant was run against all 174 tests in `schemaPath`, `schemaSuggest`, `schemaSuggestMatrix` and `initiativeSuggestSchema`. All of these pass every test:
  - M1: a quote opens anywhere (the token-start rule removed);
  - M2: `flowBalance` without `stripComment`;
  - M3: no `\` escape;
  - M4: no `''` handling;
  - M5: `#` starts a comment even with no space before it.

  Test (d)'s apostrophe assertion (`Bob's # first`) cannot fail on the token-start rule: the value starts with `B`, so the quote state never matters there.
- **Fix:** add the probe cases that kill each mutant (measured):

  | Mutant | Case that kills it |
  |---|---|
  | M1 | `conditions: [it's, grabbed] # don't [`, then a group: expect the group keys |
  | M2 | `heroes:\n  - {name: "a #b"} # c {\n  - `: expect the hero keys (this was wrong at `4da5ef69` too) |
  | M3 | `- name: "Bob \" #1"`, then a group: expect the group keys |
  | M4 | `- name: 'Bob''s #1'`, then a group: expect the group keys |
  | M5 | no probe case tells it apart from the real code; it is close to equivalent and needs no test |

### INFO-1: shapes that now give the right list where `4da5ef69` did not, beyond (a)-(d)

These all give the right list at head:
- an escaped quote, `"Bob \" #1"`;
- `"a\\ #b"`;
- `'Bob''s #1'`;
- a creature `"Minion #1"` with the cursor right under it;
- a `- {name: "a #b"} # c {` item.

They also hold at head (and at `4da5ef69`):
- `#` right after a closing quote, with or without a space;
- invalid `"Bob" the Orc`;
- real multi-line quotes, with ` #` on the first line;
- the cursor inside an unclosed quote (nothing offered);
- comment-only values (`malice: # it's "x`);
- `"Bob" # the first`;
- multi-line flow lists holding `"x #y"` or a `# note [` comment.

### INFO-2: no regression in round 2's edge cases

I copied r2's `zzProbe2Sc707r2.test.ts` unedited and ran it at head and with `schemaPath.ts` at `4da5ef69`. The old run is byte-identical to r2's `probe2-head.json`. Head differs only at `flow-hash` and `hash-quote-same`, gate off and on (4 of 80 points), and both are now right.

## What I checked and how

- **Probe 4** (`zzProbe4Sc707r4.test.ts`, 47 initiative cases) and **probe 5** (3 cases that give a wrong list). Both run through the real `DsSchemaSuggest` over a CodeMirror `EditorState` (`_cmEditor.ts`). Each ran at head and with `schemaPath.ts` taken from `4da5ef69`, in a private detached worktree (`probe-wt`, removed afterwards).
- **Mutation check:** `schemaPath.test.ts` with `4da5ef69`'s `schemaPath.ts` gave 3 failed / 32 passed. The 3 that fail: "a quoted value with a ` #`…", "directly under a hero named "Bob #1"…", "a flow list holding a quoted `#`…". Mutants M1-M6 were run on the 4 SC-707 jest files (control 174/174) and on probe 4 to find the cases that kill them.
- **AUTH-K21 controls** (run in `probe-wt`, `npm run e2e -- --only=AUTH-K21,AUTH-K17`):
  - `schemaSuggest.ts` back at `e38f7838`: both fail ("the suggestion list never showed 1 row(s)").
  - Nested lookup forced to null (`schemaSuggest.ts:109`): K17 ok, K21 FAIL.
  - The spec compares the saved file with `spliced(note, {6,8}, undefined, 'squad_role: captain')` (a whole-file comparison) and checks the cursor at `{6,27}`.
- **Docs:** `grep -i 'roll\|tiers'` finds nothing in `docs/writing-blocks.md` or in the SC-707 CHANGELOG bullet. `CustomSkill` reads `name` / `has_skill` (`src/model/Skills.ts:82` and nearby); r2 had measured hero `max_stamina` and the Skills keys.

## Gates (measured at `3a09fc95`, in the ticket worktree)

| Gate | Result |
|---|---|
| tsc (`npm run tsc`, incl. `tsc -p e2e`) | clean, exit 0 |
| lint | clean, exit 0 (only the usual `.eslintignore` warning) |
| jest, fresh (no `visual-harness/dist/obsidian-app.css`; `main.js`/`styles.css` removed first) | `Tests: 2 skipped, 15094 passed, 15096 total` · `Test Suites: 1 skipped, 324 passed` · exit 0 (15044 + 50, matching the implementer) |
| lifecycle parts 1-7 | 21/21 (186 s) · 16/16 (326 s) · 9/9 (419 s) · 4/4 (302 s) · 7/7 (410 s) · 4/4 (298 s) · 3/3 (199 s) = **64/64 ok, 0 failed** |
| e2e (full, 712 s, loadavg 12-17) | **`OBSIDIAN-E2E done: 949/969 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`**, exit 0. The pointer was parked. AUTH-K17..K21 all ok |
| styles.css | sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` (as expected), so shots 636, freeze 280/280 and parity 0/0/24 carry |

The ticket worktree's `git status --porcelain` was empty before and after. The only worktree left is the ticket's own.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r4-rereview/`)

| What | Files |
|---|---|
| Gate logs | `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log` .. `gate-lc7.log`, `gate-e2e.log` |
| Gate records | `gate-head.sha`, `styles-head.sha`, `gate-shots-cache.txt`, `status-before.txt` |
| Probes | `zzProbe4Sc707r4.test.ts`, `probe4-head.json`, `probe4-old.json`, `zzProbe5Sc707r4.test.ts`, `probe5-head.json`, `probe5-old.json` |
| r2 probe re-run | `zzProbe2Sc707r2.test.ts` (copy), `probe2-head.json`, `probe2-old.json` |
| Mutation runs | `probe.py`, `probe-results.json`, `run-*.log`, `mutprobe.py`, `mutprobe-results.json`, `probe4-M*.json` |
| AUTH-K21 controls | `k21ctl*.sh`, `k21ctl-e2e.log`, `k21ctl2-e2e.log`, `k21ctl2-diff.txt` |
