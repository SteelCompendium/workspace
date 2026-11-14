# SC-638 r2 independent review — dse `daf75fc5` on `afd1436c`

**Executive summary**
- Verdict: **LAND** (with optional LOW polish; nothing blocks). 0 HIGH, 0 MEDIUM, 3 LOW, 7 INFO.
- Gates measured on the branch tree: tsc clean, lint clean, jest `13022 passed / 2 skipped` (fresh), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` (pointer parked, no WARN), styles.css sha256 `18730938…f1f9` (= clean base). Lifecycle not run: no lifecycle scenario drives negotiation (0 mentions in `obsidian-lifecycle.mjs`) and the diff touches only negotiation model/views + the e2e driver.
- Every ledger input (ticket case 1, case 2, the 3 SC-637-comment inputs) and 30+ more renders with no raw JS text; R3 inputs write nothing; R2 holds on seal / chip / Complete / Reset / sidebar; R4 seal == ending for all 17 standings x 2 tracks, seal drawn identical to `afd1436c` for every one.
- Mutants: 6 of 6 killed (R4 reading reverted 14 red, item-shape check dropped 13 red, coerce-and-write 8 red, top-level map check 7 red, used-list text read 7 red, argument-end memory 1 red). Flipped markers W02/W03/K03/K04 have unchanged assertions.
- Driver change: with every negotiation card forced to an error card, 59/60 negotiation e2e tests go red; only NEGO-W02 stays green (vacuous) — LOW-2.
- LOW-1: `motivationsUsed: [5, "5"]` writes back `[5, 5]` (the quoted entry changes type). LOW-3: CHANGELOG says "written back exactly as you typed it" (value and type are kept, spelling is not).

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW-1 — the same text typed twice in one used-list with two types loses the type of one (R2).**
`src/model/NegotiationData.ts:62-67` (`rememberTyped` keys the memory by text per slot: `texts.set(String(raw), raw)`) and `:105-118` (`typedValueOf` / `restoreTypedText` map every entry by text).
Scenario: `motivations: [{name: 5}]`, `currentArgument: {motivationsUsed: [5, "5"]}`; click Patience seal 2. Written: `motivationsUsed: [5, 5]` — the untouched quoted `"5"` became the number 5 (probe `X mot 5 used [5, "5"]`). Text slots (`name`, `reason`, `i*`) cannot hit this (one value per slot per owner); only the two used-lists can, and only with a duplicate entry (which the UI never produces itself; SC-640-adjacent). Not data loss of the value, only of its type.
Fix: for the list slots remember by position, not by text: keep the raw list as read (`rawUsed[slot] = [...raw]`), and in `restoreTypedText` restore entry `i` to `rawUsed[i]` when `String(rawUsed[i]) === entry` at the same index, falling back to the text map only for entries the negotiation added. Add a unit row `motivationsUsed: [5, "5"]` -> `[5, "5"]`.

**LOW-2 — `openNote` now accepts an error card for every caller, so a test that asserts only absences passes on an error card.**
`e2e/driver/dse.ts:211-216`; vacuous example `e2e/specs/negotiation/wrong-values.e2e.ts:26-30` (NEGO-W02).
Probe: `parseModel` mutated to always throw `Invalid data: …` (every negotiation card is an error card), `npm run e2e -- --element=negotiation`: `1/60 ok, 59 failed, 0 known-bug` — the only green test is NEGO-W02 (it asserts only that the card text has no `is not a function|Cannot read properties|undefined`). On the old driver it would have timed out in `openNote`. Today the hole is covered for that fixture by NEGO-W10 (asserts the head and a write), and every knownBug went red too (their `failsWith` guards), so nothing is masked now. Future risk: when SC-641 flips NEGO-W06 (`openNote(MINIMAL); expect((await shown()).ended).toBeNull()`) to a plain test, it would pass on an error card (`shown()` returns `ended: null` when there is no `.dse-nt`).
Fix (either): (a) make error-card acceptance opt-in — `openNote(rel, { errorCard: true })` used by NEGO-W08/W09/W11, default keeps the old "every root has a registry entry" wait; or (b) at minimum, give NEGO-W02 a positive assertion (`.dse-error-card` absent and `.dse-nt__head` contains `2024`) and note in the e2e README that `openNote` returns on an error card, so absence-only assertions after it need a "the view is drawn" check.

**LOW-3 — CHANGELOG overclaims "written back exactly as you typed it".**
Worktree `CHANGELOG.md:22` (commit `de702d1e`). The value and its type are kept; the spelling is not: `name: 0x1F` -> `name: 31`, `1.50` -> `1.5`, `1e3` -> `1000`, `007` -> `7` (probes `X name …`), and quoting/comments are SC-599's.
Fix: "…is now read as text and written back as the same number or true/false you typed (not turned into text)."

### INFO

1. **Ruled-for-probe non-text wrong types (ledger r1 follow-up 2) — all DROP.** `initial_patience: [1]` (seal 1, by `Number([1])`), `initial_interest: [2]`, `current_patience: [3]`, `current_interest: {a: 1}` / `.nan` / `true`, `hasBeenAppealedTo: maybe` / `"yes"` / `0`, `lieUsed: 1`, `sameArgumentUsed: 1`, `reusedMotivation: "no"`: no raw JS error, seal and ending agree (R4), untouched values round-trip by value through seal, chip, Complete and Reset, outside text byte-identical; every write identical to `afd1436c` except the R4-intended endings. Oddities, all pre-existing and identical on base: `maybe`/`"yes"` count as spent (truthy); `"yes"` is re-written unquoted `yes` (still a string in YAML 1.2; SC-599); Reset of `initial_patience: [1]` + declared `current_patience: 3` writes a YAML alias `initial_patience: &a1 [1]` / `current_patience: *a1` (same array object; `yaml` `aliasDuplicateObjects`).
2. **Empty / comment-only block** still refused as on base (no controls, nothing written); its raw text moved from `Cannot read properties of null (reading 'name')` to `(… 'motivations')`. Already ruled for the fix round; SC-493 tests green.
3. **R3 now refuses inputs that rendered on base**: `currentArgument: false` / `0` / `""` / `[a]`, `motivations: 0` / `false` / `""`, `i3: [a]`, `motivationsUsed: [[a]]`, `pitfallsUsed: 3`. On base most of them rendered and the first write replaced or rewrote the value (e.g. `currentArgument: ""` -> a default argument map). Consistent with R3; listed so the owner knows the set is wider than the ticket's examples.
4. **Chrome summary** (`src/elements/negotiation/definition.ts:21`) still prints the raw standing (`Interest 0.4 · Patience banana`). It decides nothing, so it is outside R4; it can read oddly next to seal 0 / hostile.
5. **YAML dates are not an issue**: the real `parseYaml` is `yaml` v2 core schema, so `name: 2024-01-01` is a string (renders, writes back unchanged; identical to base).
6. **Hand-edit after a write** (jsdom: write, change the note to `name: "2024"` and `motivationsUsed: ["5"]`, re-render, write again): the second write keeps the quoted strings; the typed memory belongs to the parse that made it (WeakMap on the model), and an outside edit always rebuilds fresh (lifecycle G-S5). Real-Obsidian adoption was not separately probed.
7. **Leftover state not mine**: the shared main checkout `/home/scott/code/steelCompendium/workspace` shows ` M draw-steel-elements` (dirty: `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/montage 1.md`, mtimes 11:48, before this review began). The worktree superproject's ` M draw-steel-elements` was there at the start (unbumped pointer, by design). I did not touch either.

## What I checked and how

### 1. Ledger inputs (probe `zz-r2-probe.test.ts`, real ElementPipeline + ReadingModeBlockHost + FakeVault, run on head AND on `afd1436c`)
| Input | head | afd1436c |
|---|---|---|
| `name: 2024` | draws; seal click writes `name: 2024` (number) | `_a.trim is not a function` |
| motivation / pitfall `name: 5`, `reason: 42` | draws; write keeps numbers | `_a.trim` / `_c.trim is not a function` |
| `motivations: "foo"`, `pitfalls: "foo"`, `pitfalls: {a: 1}` | `Invalid data: '<key>' field must be a list.`, 0 controls, no write | `_e.map` / `_g.map is not a function` |
| blank `-` under motivations / pitfalls | `Invalid data: '<key>' item 1 must be an object.` | `Cannot read properties of null (reading 'name')` |
| `currentArgument: { motivationsUsed: "Peace" }` | `Invalid data: 'currentArgument.motivationsUsed' field must be a list.` | `….some is not a function` |
| `- Legacy` | `… 'motivations' item 2 must be an object.`, no write | rendered; first click wrote `- {}` (DATA LOSS) |
| `currentArgument: hello` | `… 'currentArgument' field must be an object.`, no write | rendered; first click wrote a default argument (DATA LOSS) |
| top-level `hello` / `- a` / `42` | `Invalid data: the block must be a map of keys.`, no write | rendered; first click wrote `current_patience: 1` (DATA LOSS) |
| `current_interest: 0.4` / `4.5` / `current_patience: banana` | seal 0 hostile / seal 5 deal / Patience 0 final | same seals, negotiation live |
No raw JS text (`/is not a function|Cannot read properties|undefined|_[a-z]\./`) on any head card except the ruled empty-block one.

### 2. R4 table (seal drawn / ending; head vs `afd1436c`)
Interest and Patience each set to `0.4, 0.5, 4.5, 4.49, -1, 7, "3", banana, ~, true, .nan, .inf, -.inf, [3], {a: 1}, "", [1, 2]` (34 cards): the drawn seal is identical to base for all 34; the ending equals the seal reading for all 34 (e.g. Interest `true` -> seal 1 live; `[3]` -> seal 3 live; `.inf` -> seal 5 deal; Patience `[1, 2]` -> 0 final).

### 3. R2 write paths
Seal clicks, pitfall chip un-press / re-press (`pitfallsUsed: [7]` -> `[]` -> `[7]`), motivation chip, Complete Argument, Reset, two blocks in one note (the other block byte-identical), content above/below the fence byte-identical on every write; `Object.keys` of the model, a motivation and the argument have no extra key; `JSON.stringify` carries nothing extra; `serialize` idempotent and re-parse stable; SC-637 keys (`note_to_self`, argument `zz`) survive seal writes (the argument's own keys end with the argument on Reset, per SC-637). Sidebar host: covered by the branch's jsdom test (re-run green).

### 4. Mutants (scratch worktree, 5 negotiation test files, 212 tests)
| Mutant | Result |
|---|---|
| m1 `ending()` back to `Number()` | 14 failed (incl. K04) |
| m2 item-shape check removed | 13 failed |
| m3 `restoreTypedText` returns `out` unchanged (writes strings) | 8 failed (incl. sidebar) |
| m4 top-level map check removed | 7 failed |
| m5 used-list entries not read as text | 7 failed |
| m6 `typedText.delete` in `CurrentArgument.resetData` removed | 1 failed |
| e2e: every negotiation card an error card | 59/60 failed; NEGO-W02 green (LOW-2) |
Flipped markers: W02, W03, K03, K04 lost only the wrapper and the `[known bug SC-638]` suffix; assertions byte-identical. Three existing-test edits checked: 4.5 -> 4.4 in the clamp test still kills a clamp deletion (5.4 unclamped); `lots` -> `'hostile'` is R4; the SC-637 serialize edits keep their no-unknown-key guards on hand-built instances.

### 5. Other checks
No bracketed ticket id in any new test title; no AI attribution in any dse or superproject commit message (`afd1436c..daf75fc5`, `origin/main..de702d1e`); `e2e/README.md` rows for `wrong-name`, `wrong-item`, `wrong-argument`, `wrong-block`, `fraction` updated and accurate.

## Artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r2-review/`:
- gates: `gates/tsc.log`, `gates/lint.log`, `gates/jest.log`, `gates/e2e.log`
- probes: `probe/probe-body.ts`, `probe/probe2-body.ts`, `probe/head.json`, `probe/base.json`, `probe/handedit.json`, `probe/head.log`, `probe/base.log`, `probe/handedit.log`, compare scripts `probe/cmp-*.py`
- mutants: `mutants/m1-r4-ending.{diff,log}`, `m2-item-shape`, `m3-coerce-write`, `m4-top-map`, `m5-used-text`, `m6-no-argument-forget`, `mutants/e2e-driver-mutant.{diff,log}`
- scratch plugin worktrees (registered in the plugin repo, left in place): `wt/` (detached `daf75fc5`, holds untracked `test/dom/elements/zz-r2-probe*.test.ts`), `base/` (detached `afd1436c`)
Branch tree `git status --porcelain` empty before and after; branch head still `daf75fc5`; superproject worktree head `de702d1e`.

---

# r4 — scoped re-review of the r3 fix delta (dse `daf75fc5..ef1c9f07`, superproject `de702d1e..4df72822`)

**Summary**
- Verdict: **FIX** (one small fix). 0 HIGH, 1 MEDIUM, 0 LOW, 2 INFO.
- MEDIUM-r4-1: the LOW-1 fix (`restoreUsed`, matching by position from the end) **regressed** the common case. Toggle a chip off and on and an untouched typed entry turns into quoted text: `motivationsUsed: [5, 7]`, chip "5" off then on, now writes `["7", 5]`. `daf75fc5` wrote `[7, 5]`.
- LOW-1's own cases are right: `[5,"5"]` untouched, removing the first of two equal entries, a pushed entry, Complete, Reset. Nothing leaks into the YAML or the own keys.
- LOW-2 is fixed. With every negotiation card forced to an error card, the run was `0/60 ok, 60 failed`: 57 timed out in `openNote` (W02 included), and W08 / W09 / W11 (the only opt-ins) failed on the message.
- The empty-block message and the chrome summary are right. Reverting the summary in a mutant turns 3 tests red. The CHANGELOG wording is accurate once MEDIUM-r4-1 is fixed.
- Gates measured on the branch tree: tsc clean, lint clean, jest `13029 passed / 2 skipped` (fresh), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` (pointer parked), styles.css `18730938…f1f9`.

## MEDIUM-r4-1: re-pressing a chip makes the earlier untouched typed entries quoted text (R2 regression from the LOW-1 fix)

`src/model/NegotiationData.ts:97-110` (`restoreUsed`). Matching walks the list from the end and moves a single cursor `from` backwards (`from = k - 1`, line 107) through the snapshot. A chip press appends at the END (`ArgumentView.ts:205` / `:227`) after a removal by `indexOf`. So a re-added entry matches an EARLY snapshot slot, and the cursor then skips every snapshot entry after that slot. The entries now before it in the list find no match (line 105: `continue`) and are written as plain text.

Measured (probe `r4/probe3-body.ts`, the same file on `ef1c9f07` and on `daf75fc5`):
| Case | `ef1c9f07` | `daf75fc5` |
|---|---|---|
| real chip clicks: motivations `5`, `7`; `motivationsUsed: [5, 7]`; chip 5 off, then on | `["7", 5]` (`- "7"` in the note) | `[7, 5]` |
| model `[A, 5]`: remove `A`, push `A` | `["5", "A"]` | `[5, "A"]` |
| pitfalls `[7, 8]`: toggle 7 | `["8", 7]` | `[8, 7]` |
| `[5,"5"]` untouched / remove first / `["5",5]` remove first / `[5,"5",5]` remove first | `[5,"5"]` / `["5"]` / `[5]` / `["5",5]` (right) | `[5,5]` / `[5]` / `[5]` / `[5,5]` |
| `[5]` push 7; after Complete or argument reset, push 5; Reset; `[~, 5]` | `[5,"7"]`; `["5"]`; `[]`; `[null,5]` (right) | same |

The 7 was not changed by the negotiation, so R2 says it is written back as `7`. The value is not lost, because the text still matches motivation 7 on the next read; only its type is. Ordinary use reaches it: toggling a motivation or pitfall in an argument that already lists another typed one. r2's code handled this; r3 broke it. The CHANGELOG's "written back as the same number or true/false you typed" is false on this path until it is fixed.

Fix: match per text, not with one cursor. Group the snapshot by text, keeping order. For each text with `n` snapshot entries and `c` occurrences in the list:
- If `c <= n`, the occurrences take the LAST `c` snapshot entries of that text, in order. A removal takes the first equal entry, so the survivors are a suffix.
- If `c > n`, the first `n` occurrences take the snapshot entries and the rest are plain text (pushed).
Order across different texts no longer matters. Add tests:
- jsdom, real chip clicks: `[5, 7]` with chip 5 off then on writes `[7, 5]`.
- unit: `[A, 5]` with `A` toggled gives `[5, "A"]`.
- unit: pitfalls `[7, 8]` with 7 toggled gives `[8, 7]`.
Keep the r3 `[5,"5"]` tests.

## Checks
1. **LOW-1 (by-position memory).** The table above covers it. No leak: `Object.keys` of the model and the argument list only schema keys, `JSON.stringify(argument)` holds only the text entries, and the serialized YAML has no extra key. `usedSnapshot` is a module-private WeakMap, dropped in `CurrentArgument.resetData` (Complete, Reset). Real chip clicks, then Complete, then Reset: the text above and below the fence is byte-identical.
2. **LOW-2 (opt-in).** `errorCard: true` is passed only by NEGO-W08, W09 and W11 (`command grep` over `e2e/`). Without it, an error-card root counts as a root that needs a registry entry, so `openNote` times out, as before SC-638. The forced-error-card mutant on `ef1c9f07` (log `mutants/r4-e2e-driver-mutant.log`): `0/60 ok, 60 failed`. 57 failed with "timed out waiting for … to render its blocks" (W02 among them); W08, W09 and W11 failed on the message. In r2 the same mutant gave `1/60` (W02 green). W02 also now asserts no `.dse-error-card` and that the head shows `2024`.
3. **Empty block.** `Invalid data: the block is empty.` for nothing, whitespace and comment-only, through both `parse` and `parseNegotiationData`. SC-493 `formModalEmptyYaml` is green inside the full jest run (unchanged; it pins no raw text).
4. **Summary.** `definition.ts:22` reads `NegotiationData.standingOf` for both standings. Mutant `r4-m7-summary-raw` reverts both to the raw values: 3 of the 4 new rows go red (the `3 / 2` guard row passes, as expected). The `import type` became a value import of `NegotiationData`; `model.ts` already imports it at runtime, so there is no new cycle.
5. **CHANGELOG** (`4df72822`): "written back as the same number or true/false you typed (not as quoted text)". Accurate apart from MEDIUM-r4-1.

## INFO
- r4-INFO-1: in `restoreUsed`, a list with no typed entry returns early (`!snapshot.some(raw)`), so plain lists are untouched, and that path is unchanged.
- r4-INFO-2: the remaining ambiguity the implementer names is pushing a text equal to an existing entry. Chips toggle, so the UI cannot do it. Agreed.

## r4 artifacts
Under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r2-review/`:
- gates: `r4/gate-tsc.log`, `r4/gate-lint.log`, `r4/gate-jest.log`, `r4/gate-e2e.log`
- probes: `r4/probe3-body.ts`, `r4/probe3-head.json` (ef1c9f07), `r4/probe3-daf75fc5.json`, with their `.log` files
- mutants: `mutants/r4-m7-summary-raw.{diff,log}`, `mutants/r4-e2e-driver-mutant.{diff,log}`
- the scratch worktree `wt/` is now detached at `ef1c9f07` (untracked `zz-r2-probe*.test.ts`, `zz-r4-probe3.test.ts`); `base/` is unchanged at `afd1436c`.

The branch tree's `git status --porcelain` is empty before and after (head `ef1c9f07`); the superproject worktree head is `4df72822`.

---

# r4b — scoped re-review of the MEDIUM-r4-1 fix (dse `ef1c9f07..12aaf5b5`)

**Summary**
- Verdict: **LAND**. 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO. MEDIUM-r4-1 is fixed.
- The three toggle cases, by real jsdom chip clicks: `[5,7]` chip 5 off then on writes `[7, 5]` (`- 7`, `- 5`); `[A,5]` chip A off then on writes `[5, "A"]`; pitfalls `[7,8]` chip 7 off then on writes `[8, 7]`. The text above and below the fence is byte-identical every time.
- The r3 LOW-1 cases are still right: `[5,"5"]` untouched, then removing the first of the equal entries, gives `["5"]`; `["5",5]` with the first removed gives `[5]`; `[5,"5",5]` gives `["5",5]`; a push is plain text; Complete and Reset are right; `[~,5]` gives `[null,5]`. No leak: only schema own keys, and nothing extra in the JSON or the YAML.
- Mutant m8 put `NegotiationData.ts` back to the `ef1c9f07` single cursor: 3 tests red (the jsdom chip test, the unit toggle table, and the unit "more of a text than was read" row).
- Gates on the branch tree: tsc clean, lint clean, jest `13032 passed / 2 skipped` (fresh). e2e not re-run: the delta is `restoreUsed` (`src/model/NegotiationData.ts:103`) plus jest files. That code only does work when a used list holds a typed entry, and no e2e fixture has one (`command grep` over `e2e/vaults`). For every e2e note the early return is unchanged from `ef1c9f07`, which ran `576/597 ok, 0 failed, 21 known-bug, 416/416`.

## INFO
- r4b-INFO-1: `restoreUsed` builds one `seen` map per write and filters the snapshot once per distinct text (quadratic in the list length). Used lists are a handful of entries, so this costs nothing.

## Probes and artifacts
Under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r2-review/`:
- probes: `r4b/probe3-12aaf5b5.json` (model-level table plus the chip-driven `[5,7]` case, then Complete and Reset), `r4b/probe4-body.ts` and `r4b/probe4-12aaf5b5.json` (the three toggles and the `[5,"5"]` seal then chip-off case, by real chip clicks), with their `.log` files
- mutant: `mutants/r4b-m8-single-cursor.sh`, `.diff`, `.log`
- gates: `r4b/gate-tsc.log`, `r4b/gate-lint.log`, `r4b/gate-jest.log`
- scratch worktree `wt/` is now detached at `12aaf5b5` (untracked probe tests only)

The branch tree's `git status --porcelain` is empty before and after (head `12aaf5b5`). The commit message has no AI attribution.
