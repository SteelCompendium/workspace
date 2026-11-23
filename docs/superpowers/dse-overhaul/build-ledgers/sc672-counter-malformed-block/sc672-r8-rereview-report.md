# SC-672 r8 scoped re-review (head `28402e57` on dse `d582e7ff`; superproject `0500eb78`)

**Executive summary**
- VERDICT: LAND. Findings: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3. The next round rebases onto `8c08bce2`.
- The rebase kept both tickets whole.
  - The `src/` diff against `d582e7ff` is exactly `src/model/Counter.ts` and `src/elements/shared/undeclaredDefaults.ts`.
  - In `wrapperDefaultKeys.test.ts` and `e2e/README.md`, no SC-671 line was dropped and no SC-672 line was lost.
- SC-671 × SC-672 in real Obsidian: (a) to (d) all hold, in Reading view and Live Preview. Every case that both branches can draw writes bytes IDENTICAL to base `d582e7ff`.
- The tests can fail. The rewritten SC-671 test matches the ruling exactly. The CHANGELOG sentence is true. The SC-671, SC-675 and SC-644 bullets are intact.
- tsc (incl. `-p e2e`) + lint: rc 0 / 0, clean.
- FULL jest (it finished before the narrowing addendum arrived): `Tests: 2 skipped, 14005 passed, 14007 total`, rc 0, fresh worktree.
- Counter jest files (`counter-wrong-block` unit and dom, `counter-serialize`, `counter-own-keys`, `wrapperDefaultKeys`): `Tests: 159 passed, 159 total`.
- `counter-wrong-block.e2e.ts` alone: `OBSIDIAN-E2E done: 14/14 ok, 0 failed, 0 known-bug`. `own-keys.e2e.ts` alone: `4/4 ok, 0 failed`.
- Full e2e: DROPPED per the r8 addendum. G-S61: not run (loadavg 15 to 40). `npm run build`: `styles.css` `18730938…f1f9` and `main.js` `9893e494…70cb` (the same as r7b's build).

Evidence root `$R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r8-rerev/`.

## Findings

No HIGH, MEDIUM or LOW.

### INFO

- **I1. A tagged value inside a normal map loses its tag on a write. This is SC-671 behaviour, identical on base `d582e7ff`.** (PRB8-D01, D02, real Obsidian, Reading view.)
  - `name: H` / `current_value: 2` / `extra: !!set {a}`: the counter draws 2. + writes `current_value: 3\nname: H\nextra:\n  - a`, so the set becomes a list. − keeps the list.
  - `name: D` / `current_value: 2` / `when: !!timestamp 2024-01-01`: + writes `when: 2024-01-01T00:00:00.000Z`.
  - Both blocks stay counters, as the brief requires. Nothing is lost that base does not lose. Owner's call whether to note this on SC-671.
- **I2. In Live Preview, + then − on a block holding only `note_to_self: x` gives `current_value: 0\nnote_to_self: x`.** In Reading view it gives `note_to_self: x` (PRB8-C02, C05). The key is always kept, and the body is never blank and never `{}`. A second cycle changes nothing. The cause is the same adoption mechanism as the r4 L3 result, and it is identical on base.
- **I3. With the pre-SC-672 `Counter.ts` restored, test (c) stays green.** That is correct: an only-unknown-keys map was always a counter. Test (c) guards that the blank-body rule never treats such a block as blank. CTR-W16 is Reading view only. My probe covered Live Preview (I2).

## 1. The rebase kept both tickets whole

- `git diff d582e7ff..28402e57 --stat -- src/` gives `undeclaredDefaults.ts` (3 lines) and `Counter.ts` (14 lines), nothing else.
- Range-diff `fefd9029..52cc1b49` against `d582e7ff..28402e57`:
  - Commits 1, 2, 4, 5 and 6 are `=`.
  - Commit 3 is `!`, only for the README context: SC-671's `own-keys.md` row is kept and the 7 SC-672 rows follow it.
  - Commits 7 (`079c9c7e`, the interaction tests) and 8 (`28402e57`, the rewritten SC-671 test) are new.
- `wrapperDefaultKeys.test.ts`:
  - Lines removed against `d582e7ff`: only SC-672's own three edits, the same three lines SC-672 removed against `fefd9029` (the comment and the `['montage', 'project']` filter).
  - Lines removed against `52cc1b49`: only the 5 `title: Deaths` lines that SC-671 itself replaced between `fefd9029` and `d582e7ff`.
- `e2e/README.md`: 0 lines removed against either side. +9 rows against `d582e7ff` (8 SC-672 fixtures plus `only-unknown-keys.md`).

## 2. SC-671 × SC-672 in real Obsidian

Throwaway probe, copies at `$R/probe/zz-r8-probe.e2e.ts` and `$R/probe/vault/R8Probe/*.md`. Head observations: `$R/obs/head-probe1.jsonl`, log `$R/e2e-probe1.log` (13/13). Base `d582e7ff` comparison: `$R/obs/base-base1.jsonl`, log `$R/e2e-base1.log` (C01..C05, D01, D02 IDENTICAL to head).

- (a) `hello`, `- a`, `5` and `!!set` with `? a`: in Reading view and Live Preview, all 4 are the plain card (`Invalid data: the block must be a map of keys.`, 0 controls). A click on each writes nothing, and the note is byte-identical.
- (b) Empty block: + writes exactly `current_value: 1`. In Reading view, − gives the blank body (one empty line, the original bytes). In Live Preview, − gives `current_value: 0`. A second cycle is identical in both views, matching CTR-W14 / W15 (B01, B02).
- (c) `note_to_self: x`: a counter at 0. + writes `current_value: 1\nnote_to_self: x`. In Reading view, − gives back `note_to_self: x`, the original bytes. Live Preview: see I2. The second cycle is identical (C01, C02).
- Unknown key plus a blank-looking remainder:
  - `note_to_self: x` + `# a comment`: + gives `current_value: 1\nnote_to_self: x`. The comment goes on the first write, as SC-599 covers. − gives `note_to_self: x`, and the second cycle is identical (C03).
  - `note_to_self: x` + blank and whitespace lines: the same result (C04).
- Two blocks, one empty and one holding only `note_to_self: x` (E01 Reading view, E02 Live Preview): no cross-talk. Each press changed only its own fence, the text outside the fences was byte-identical, and the cards showed the right values.
  - Reading view (E01): + on the 2nd, + on the 1st, − on the 2nd, − on the 1st.
  - Live Preview (E02): + on the 1st, then + on the 2nd.
- No path that loses text or keys through the card appeared that base does not also have.

## 3. The tests

- The 9 new jsdom tests assert:
  - (a): the element parse throws the plain message, the card shows it with no control, and a click plus flush write `[]`.
  - (b): writes are `['current_value: 1']`.
  - (c): writes are `['current_value: 1\nnote_to_self: x', 'note_to_self: x']`, and every write contains the key.
  - (d): writes are `['current_value: 1', '']`.
- CTR-W16 pins the whole note after + and after −.
- Red check: `src/model/Counter.ts` from `d582e7ff` copied in, then `git checkout`, `cmp` OK. `test/dom/elements/counter-wrong-block.test.ts` + `test/unit/model/counter-serialize.test.ts` gave `Tests: 31 failed, 18 passed, 49 total` (`$R/jest-red.log`, `$R/jest-red.json`).
  - (a) red ×4: "expect(received).toThrow".
  - (b) red ×3 and (d) red: a TypeError, because there is no counter to read.
  - (c) green (I3).
  - The rewritten SC-671 test is red.
- `counter-serialize.test.ts`: only the last test changed (+10 / −4). It matches the ruling:
  - `parseLikePipeline('hello')` and `parseLikePipeline('- a\n- b')` → `toThrow(new Error('Invalid data: the block must be a map of keys.'))`, an exact message match.
  - `parse(null, '')` does not throw: `current_value` 0, `name` undefined, `serialize` gives `''`.

## 4. CHANGELOG

`git diff b034ff73..HEAD` in the superproject is `CHANGELOG.md` +6 / −0, only the SC-672 bullet. The fourth sentence ends "…the first click on + fills the block in (`current_value: 1`); a number typed into the box fills it in with that number."
- That is true: + on an empty block writes `current_value: 1` (B01, B02). The jsdom test "a number typed into an empty block writes that number" passes on this head (`current_value: 7`), as r4 measured in real Obsidian.
- The SC-671 bullet (line 17), SC-675 bullet (line 23) and SC-644 bullet (line 159) are unaltered.

## Gates (`$R`)

- Run:
  - tsc / lint: `$R/tsc.log`, `$R/tsc.rc`, `$R/lint.log`, `$R/lint.rc`
  - full jest: `$R/jest-full.log`, `$R/jest-full.rc`, `$R/jest-full.load` (loadavg 11.7 → 40.7)
  - counter jest files: `$R/jest-green.log`, `$R/jest-green.json`
  - spec alone: `$R/e2e-spec1.log`, `$R/e2e-own1.log` (with their `.rc`)
  - build: `$R/build.log`, `$R/build.sha`
- Dropped (addendum): full e2e. Not run: lifecycle (as briefed), G-S61 (the machine was not quiet).
- Plugin at `28402e57`, `git status --porcelain` empty; superproject ` M draw-steel-elements` only. Probe files deleted, base worktree removed, `main.js` rebuilt from head after the red edit was restored.
