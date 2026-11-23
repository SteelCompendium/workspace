# SC-672 r4 review report (head `ccacc3cc` on dse develop `bdf0255e`)

**Executive summary**
- VERDICT: FIX-THEN-LAND. HIGH 1 · MEDIUM 1 · LOW 4 · INFO 6.
- H1: running "Send block to sidebar" with the cursor in a `hello` counter block writes `_dse_anchor: <id>` into the block. This was already true on base `bdf0255e`, and it happens for any element (a montage `hello` block too). The brief's rule makes it HIGH. It needs an owner scope ruling: fix it in the framework, or file a ticket and correct the CHANGELOG claim that "the note is never written".
- M1: a block that YAML reads as a Date, Uint8Array, Set or Map (`!!timestamp`, `!!binary`, `!!set`, `!!omap`) gets past the shape check. It draws a counter at 0, and + replaces the user's text. This breaks R1's "not a plain map" rule. It is a one-line fix in `src/model/Counter.ts:45`.
- tsc + lint: clean (rc 0 / 0). jest: `Tests: 2 skipped, 13911 passed, 13913 total` (fresh worktree, no shots cache), rc 0.
- e2e full run: `OBSIDIAN-E2E done: 670/677 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` (rc 0). CTR-W03..W12 are all ok in it.
- lifecycle: not re-run in full, because the diff is counter-local (`src/model/Counter.ts` plus a comment in `src/elements/shared/undeclaredDefaults.ts`). ONE `--only=G-S61` run at loadavg 0.8: `OBSIDIAN-LIFECYCLE done: 1/1 ok, 0 failed`.
- `styles.css` sha256 is `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on both head and a clean `bdf0255e` build, so shots / freeze / parity carry.
- Regressions (C): a normal counter, a `{}` block and the shipped example write the same bytes on base and head, in Reading view and Live Preview. Wrong-typed values (D) behave the same on base and head.
- Tests (E): with the fix reverted, 48 of 50 new and changed jest tests go red, and all 10 new e2e tests go red, each for the right reason.
- Addendum F: the view-registry collision happens on base `twins.md` too, with the same bytes and screen. The bytes are always right. A keyboard user loses focus to `<body>`, and the next Enter does nothing. INFO for the owner's ticket. CTR-W11's ordering hides no byte-level cross-talk.

Worktree: plugin at `ccacc3cc`, `git status --porcelain` empty. Superproject shows only ` M draw-steel-elements`. Base scratch worktree removed. Evidence root:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r4-rev/` (called `$R` below).

## Findings

### HIGH

**H1. "Send block to sidebar" writes into a `hello` block. It does so on base too, and for every element.**
`src/framework/sidebar/registration.ts:278` (`ensureAnchor(body)`), `src/framework/sidebar/anchor.ts:93-101`.
- Scenario (probe PRB-A05, real Obsidian, experimental switch on). Note `ABOVE / ```ds-counter / hello / ``` / BELOW`. Open it in Live Preview, put the cursor on the `hello` line, run the command `draw-steel-elements:send-block-to-sidebar`.
  - On disk before: `` ```ds-counter\nhello\n``` ``.
  - On disk after: `` ```ds-counter\nhello\n_dse_anchor: a5eb0b\n``` ``.
  - The sidebar panel and the note now show `Implicit keys need to be on a single line at line 1, column 1: hello ^` (a YAML error card).
  - The user's text is kept, but a line is appended. Removing it means deleting that line by hand.
- Base `bdf0255e`: the same write (`_dse_anchor: a0e7bb`). A `ds-montage` `hello` block on head gets the same write (PRB-A08). The cause is `ensureAnchor`. It appends whenever the body is not a map that already holds the key, and the SC-360 r4 ruling deliberately stamps bodies that do not parse.
- Where it does not happen: the chrome Pin item. An error card draws no chrome: in real Obsidian it has 0 buttons and 0 `[data-dse-control]`, and there is no pencil, no Pin and no collapse toggle. So the command palette is the only route.
- Why HIGH: the brief says "If something can still write into a `hello` block, that is HIGH". The CHANGELOG bullet (worktree `CHANGELOG.md:13`) also says "the note is never written", which is not true for this route.
- Prescribed fix (owner picks one):
  - (a) In branch: in `bindBlockToSidebar`, before `ensureAnchor`, parse the body. If it parses to a value that is not null and not a plain map, return a new `'not-a-map'` result. Show a Notice ("this block is not a map of keys, so it was not sent to the sidebar and the note was not changed"), write nothing, and add e2e for counter and montage. This keeps SC-360's stamp-on-YAML-error behaviour and only refuses bodies that parse to a non-map. It is framework scope, outside the ledger's "counter only".
  - (b) File a Backlog ticket for (a) and change the CHANGELOG sentence to "the card never writes to the note".

### MEDIUM

**M1. A tagged scalar that YAML turns into an object is drawn as a counter, and + replaces the text.** `src/model/Counter.ts:45`.
- The check `typeof data !== "object" || Array.isArray(data)` lets through any non-array object. Obsidian's parser (eemeli `yaml`, the same package the jest mock uses) returns these shapes (`$R/yaml-shapes.log`):
  - `!!binary aGVsbG8=` gives a Uint8Array
  - `!!timestamp 2024-01-01` gives a Date
  - `!!set\n? a\n? b` gives a Set
  - `!!omap\n- a: 1` gives a Map
- Scenario (PRB-A03, real Obsidian, Reading view): each block draws a counter at 0 with no error. One + on each wrote:
  - `!!omap / - a: 1` became `current_value: 1`
  - `!!set / ? a / ? b` became `current_value: 1`
  - `!!timestamp 2024-01-01` became `current_value: 1`
  - `!!binary aGVsbG8=` became `current_value: 1`
  - In each case the text outside the fence was untouched.
- This is the exact loss R1 removes, and R1 says "anything `parseYaml` returns that is not a plain map". The behaviour is the same on base. Montage (`src/elements/montage/model.ts:336`) and negotiation (`isMap`, `src/model/NegotiationData.ts:131`) use the same leaky predicate. The input is contrived: a bare `2024-01-01` stays a string and is refused correctly. The owner may downgrade this.
- Prescribed fix: require a plain object. For example: `const plain = typeof data === "object" && data !== null && !Array.isArray(data) && [Object.prototype, null].includes(Object.getPrototypeOf(data));` and throw when `data != null && !plain`. Add unit cases for the four tagged sources through the real `yaml` parse. A `!!map {}` block is still `[object Object]` and stays a counter.

### LOW

**L1. The docs and CHANGELOG say the first click on "+ or -" fills an empty block. On a fresh counter at 0, - is disabled.**
`docs/counter.md:50`, worktree `CHANGELOG.md:14`. Measured in jsdom and real Obsidian (CTR-W06, PRB-B01, PRB-B15): minus is disabled at 0, the same as for `{}`. Fix: "the first click on + (or a number typed into the box) fills in the block".

**L2. Plain-wording contradiction in the docs.**
- `docs/counter.md:51` says "The block has to be a **list** of keys … If it holds … a bulleted list … the card shows an error". "List" names exactly the shape that is refused.
- The dse commit subject `ccacc3cc` and the superproject commit `4765ecf2` subject say "not a list of keys" too.
- The field table at `docs/counter.md:36` still marks `name` Required **Yes**, while the new line says an empty block is a valid counter with no name. That row was already wrong before (`{}` always worked), but the new line now sits next to it.
- Fix: say "a set of `key: value` lines like the example above", and mark `name` not required.

**L3. A + then - cycle on an empty block returns it to a blank body only in Reading view, and only when the view is adopted. An empty block with nothing between the fences gains a blank line inside the fence.**
The ledger expects "a blank source goes back to a blank body". Measured in real Obsidian:
- One empty block per note, Reading view: three blank lines, whitespace lines, `# c`, `null` and `~` all go `current_value: 1` → (one empty line). They re-parse as counters at 0 and stay stable after that (PRB-B17..B21).
- Nothing between the fences (`` ```ds-counter\n``` ``, PRB-B03 and PRB-B09 `ds-ct`): + then - gives `` ```ds-counter\n\n``` ``. One blank line appears inside the fence, then it is stable.
- Live Preview (PRB-B04, B08, B22): - writes `current_value: 0`, not a blank body.
- Reading view after a twin collision (PRB-B01, blocks 2..8): - writes `current_value: 0`, because the rebuilt view has lost its blank-source record.
- `{}` behaves the same way on base: Live Preview + then - gives `current_value: 0` (PRB-C02 is identical on base and head). So this is the generic adoption mechanism, not a branch defect. Three repeated cycles neither grew nor shrank the note (PRB-B01 lengths 379/379/379). Everything re-draws as a counter.
- The only + then - test is jsdom (`test/dom/elements/wrapperDefaultKeys.test.ts`, one-blank-line source).
- Fix: none in code. Optionally state the Live Preview / adjacent-fence results in the ledger, or add an e2e that pins "re-parses as a counter, the note is stable after a cycle".

**L4. CTR-W11 avoids the most natural two-empty-counters sequence.** `e2e/specs/counter/counter-wrong-block.e2e.ts:122-138`.
- The natural sequence is one + on each block, in any order. It triggers the collision (see F), and the after-each-test invariant fails on it. A user with two fresh counters hits this on their first press of each.
- Bytes stay correct in that order (PRB-F02, B10, B01), so the test hides no cross-talk. But the suite never runs that sequence.
- Fix: once the owner files the collision ticket, add a test in the natural order (+ on 2nd, + on 1st) marked `knownBug('<that ticket>')`.

### INFO

- **I1 (addendum F).** The collision reproduces on clean base `bdf0255e` with `Counter/twins.md` (PRB-F01 and PRB-F03, base and head identical).
  - Bytes after each step, on both: open 1/1 → +2nd gives `current_value: 2` in block 2 → +1st gives 2/2 (collisions 0 → 1) → +1st gives 3/2 → +2nd gives 3/3. Every write landed in the block clicked.
  - What the user sees: the right numbers after every press, no console error (`errs: []`), no stale number.
  - Keyboard: Enter on + of the 1st block right after the mouse + on the 2nd writes correctly, but focus falls to `<body>` with no focus ring, and the next Enter writes nothing.
  - Control (single counter, PRB-F05): focus stays on `counter.inc` with the ring, and the next Enter writes.
  - On this branch with `two-empty.md` (PRB-F02, F04) it is the same, with right bytes and right screen. It is reachable much more easily here, because any two fresh counters pressed once each become twins. PRB-B01 counted 13 collisions in one note of nine counters.
  - Not a branch defect. It belongs to the owner's Backlog ticket (`src/framework/host/viewRegistry.ts:223`).
- **I2.** A counter inside a list item (indented fence) draws, but + writes nothing, on base and head alike (PRB-B16 and B07/B08 block 1). The SC-675 CHANGELOG already says list-item blocks cannot save yet. A list-item `hello` is the plain error card (PRB-A06).
- **I3.** A typed `-2` + Enter on a fresh counter and on `{}` writes nothing on both (PRB-B15). That is SC-673 territory.
- **I4.** The pinned empty counter works (PRB-B12):
  - The pin writes `_dse_anchor: f32956` into the empty body.
  - The sidebar shows 0.
  - + in the sidebar writes `current_value: 1\n_dse_anchor: f32956`.
  - Unpin leaves the anchor, as for every block.
- **I5.** The block edit form on an empty counter (PRB-B13, authoringControls on): the box opens empty and Save is enabled.
  - Saving the empty box leaves the note byte-identical.
  - Saving `name: Torches` writes `` ```ds-counter\nname: Torches\n``` ``, and the card shows "Torches".
- **I6.** Rapid presses (PRB-B14): 5 quick + on an empty block make 1 write, `current_value: 5`, and the screen shows 5.

## Probe matrix

All probes ran in real Obsidian 1.14.4 (pinned, headless) with a throwaway spec plus fixtures. Copies: `$R/probe/zz-r4-probe.e2e.ts`, `$R/probe/vault/R4Probe/*.md`. Observations are JSONL: head `$R/obs/head-probe{2,3,4,5}.jsonl`, base `$R/obs/base-probe1.jsonl`. Logs: `$R/e2e-probe{2..5}.log`, `$R/base-e2e-probe1.log`.

The probe tests' "FAIL" lines are almost all the collision invariant (stats are cumulative inside one session), plus the declared-edit invariant on probes that wrote deliberately. They are not product failures. The recorded observations are what count.

**A. R1 (non-map shapes).**
- Reading view (PRB-A01 plus PRB-A06 for the shapes Reading view had not drawn on screen): `hello`, multi-line paragraph, `- a`, `[1, 2]`, `5`, `0`, `-3`, `1.5`, `true`, `false`, `"x"`, `2024-01-01`, `|` block scalar, `ds-ct`, `~~~` fence, a `>` callout, an indented list-item fence, `.inf` and `''`.
  - Every one is the plain card: title `Counter: failed to render (render)`, message exactly `Invalid data: the block must be a map of keys.`, 0 controls, 0 widgets, 0 buttons or inputs in the whole view.
  - Real clicks and double-clicks on every card, then Tab ×3 / Enter / Space / arrows / `+` / `-` / Delete: the note is byte-identical, with no write and no page error.
- Live Preview (PRB-A02, PRB-A07): all 22 drawn cards show the same message. A click on the card writes nothing.
- Embed `![[R4Probe/wrong-small]]` (PRB-A04): the embedded card shows the message, and a click plus keys write nothing to either note.
- Paths that could write: there is no collapse toggle, pencil or Pin on an error card, and no view is created (`Counter.parse` runs in `prepareModel` before `createView`, `src/framework/pipeline.ts:485`). So prefs changes and the form have nothing to persist from. The one route that does write is the palette command (H1). Tagged scalars are M1.

**B. R2 integrity.**
- Every empty form draws the `{}` counter: one blank line, three blank lines, whitespace lines, nothing between the fences, `# c`, `null`, `~`, `---`, plus `ds-ct`.
  - In Reading view and Live Preview, `innerHTML` is identical to the `{}` card for all 9.
  - Value 0, name empty, - disabled, + enabled (PRB-B01, B02).
- + on each form wrote exactly `current_value: 1` inside its own fence (PRB-B01, reverse order 8→1). The text above and below each block, the `{}` block and the empty `ds-montage` (which stayed a non-error card) were byte-identical, and every closing fence stayed on its own line.
- A typed 7 + Enter wrote `current_value: 7`. A typed 3 into a nothing-between-the-fences block in Live Preview wrote `current_value: 3`.
- The block as the last thing in the note with no trailing newline (PRB-B03, B04): the write is correct and no trailing newline is added. The first thing in the note (PRB-B05): correct.
- Inside a `>` callout (PRB-B07, B08): it writes `> current_value: 1`, keeping the prefix, and - goes back to `>`.
- Two and three identical empty blocks (PRB-F02, B10; and nine forms in PRB-B01): no cross-talk in the bytes in any order tried.
- + then -: see L3.
- Hand edits (PRB-B11): deleting the written `current_value: 1` line gives a fresh counter at 0. An outside edit to `current_value: 4` is picked up and shows 4, and the next + writes 5.
- Pin, form and rapid presses: I4, I5, I6.

**C. Regressions.**
- PRB-C01 (Reading view: + / - / - / typed 3 on `Counter/counter.md`, `{}` and the shipped example; Live Preview + on `counter.md`): the observation JSON is IDENTICAL on base and head. PRB-C02 / C03 (`{}` + then - in Live Preview and Reading view): IDENTICAL.
- `Counter.parse` callers: `Counter.parseYaml` (`src/model/Counter.ts:38`) and the element `parse` (`src/elements/counter/model.ts:41`). Both go through the check. There are no other callers in `src` or `main.ts`.
- Shared `undeclaredDefaults.ts`: comment-only diff. `wrapperDefaultKeys` negotiation / party / encounter / montage cases pass in full jest.

**D. Wrong-typed values (INFO; identical on base and head, PRB-D01; no raw JS message on any card).**

| block | card | one + writes | data lost? | same on base |
|---|---|---|---|---|
| `max_value: banana` | counter 0, no cap | `max_value: banana` + `current_value: 1` | no | yes |
| `max_value: [1]` | counter 0 | `max_value:\n  - 1` + `current_value: 1` (re-flowed) | no (reformatted) | yes |
| `current_value: {a: 1}` | counter with an EMPTY number box, - enabled | `current_value: "[object Object]1"` | YES (`{a: 1}` replaced by a garbage string) | yes |
| `name: [a]` | name shows `a` | `current_value: 1` + `name:\n  - a` | no (reformatted) | yes |
| `name: 2024` | name `2024` | `current_value: 1` + `name: 2024` | no | yes |
| `min_value: true` | counter 0 | `current_value: 1` + `min_value: true` | no | yes |
| `value_height: x` | counter 0 | `current_value: 1` + `value_height: x` | no | yes |

`current_value: {a: 1}` is the one row with loss and a visibly broken card (empty box). It is not covered by SC-671 / 673 / 674 / 680 / 599 as described. The owner may want a ticket.

**E. The tests themselves.**
- Fix reverted locally (base `Counter.ts` over the head file, then `git checkout`, verified with `cmp` against `$R/Counter.head.ts`).
  - jest on the 4 touched files: 48 failed / 103 passed (`$R/jest-red.log`, `$R/jest-redj.json`).
  - The 5 new tests that stay green are legitimate guards that do not depend on the fix: the YAML-error message (unit and jsdom), the `{}` baseline, a map read as before, and a map with only unknown keys.
  - e2e CTR-W03..W12: 0/10 ok (`$R/e2e-red.log`). W03–W05 fail because a counter was drawn instead of the card. W06–W12 fail because the empty block was an error card.
- No new test passes on a raw-JS card. The jsdom and e2e card tests assert the exact message, `not.toMatch(/Cannot read properties|TypeError|undefined/)`, zero controls and widgets, and byte-identical notes.
- Test ids and fixtures: ids CTR-W03..W12, with no bracketed ticket id in the titles. `wrong-block.md` and `empty-block.md` `cmp` identical to the sc442 worktree copies.
- Changed existing tests are correct:
  - In `formModalEmptyYaml.test.ts`, counter flips to `acceptsEmpty: true`, and real Obsidian confirms Save is enabled with an empty box (I5). The two tests moved to `CASES[1]` (negotiation, which still refuses an empty box) keep their meaning.
  - In `wrapperDefaultKeys.test.ts`, counter is added to the blank-body case and nothing is weakened.
- CHANGELOG and `docs/counter.md`: plain wording, but see L1, L2 and H1's "never written".

**F.** See I1 and L4. **G.** See the summary: G-S61 is green on head at low load (`$R/life-gs61.log`).

## Gate evidence (`$R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r4-rev`)
- tsc / lint: `$R/tsc.log`, `$R/tsc.rc`, `$R/lint.log`, `$R/lint.rc`
- jest: `$R/jest-full.log`, `.rc`, `.load` (loadavg 13.4 → 11.5)
- e2e full: `$R/e2e-full1.log`, `.rc`, `.load` (loadavg 10.6 → 8.1)
- lifecycle G-S61: `$R/life-gs61.log`, `.rc`, `.load`
- styles: `$R/styles-head.sha`, `$R/styles-base.sha`, `$R/build-head.log`, `$R/build-base.log`
- Probe scripts: `$R/g-*.sh`, `$R/yaml-shapes.cjs`, `$R/yaml-shapes.log`
