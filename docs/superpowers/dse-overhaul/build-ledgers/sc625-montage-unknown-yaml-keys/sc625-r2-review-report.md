# SC-625 r2: independent adversarial review report

**Executive summary**
- Verdict: **LAND-READY.** Reviewed dse `78d8658f` (fix `8b7dc083`, e2e `78d8658f`) on base `11fbded6`; superproject CHANGELOG `36dae9e2`. `origin/develop` has not moved (still `11fbded6`).
- Findings: HIGH 0, MEDIUM 0, LOW 3, INFO 6. None blocks the landing. Each LOW is a small fix the owner can fold in or drop.
- Measured gates (fresh worktree): tsc exit 0, lint exit 0, jest **12184 passed / 2 skipped** (12166 + 18), lifecycle **64/64** over seven real `--only=` parts (21+16+9+4+7+4+3, 0 failed, no re-runs), e2e **`441/448 ok, 0 failed, 7 known-bug, coverage: 235/235 pairs`** (pointer parked; no SC-625 marker left).
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on a clean `11fbded6` build, the `78d8658f` build and after e2e. Shots, freeze and parity carry over.
- Base check: with `src/` at `11fbded6` and the tests at `78d8658f`, **17 of 269** montage tests fail (7 unit, 7 X09, X10, K01, K02). At head 0 fail. No `knownBug('SC-625')` or `test.failing` marker is left. No new bracketed ticket id in a title. No duplicate `MONT-*` id.
- Probed every write path (11, including Undo, sheet edit, sheet remove, Back to round, Clear all and Reopen, which r1's X09 table leaves out). Every one keeps the unknown top-level and per-action keys. Hostile key names (`__proto__`, `constructor`, `toString`, `hasOwnProperty`, `valueOf`, `toJSON`) round-trip at both levels without pollution or a crash. Real Obsidian keeps a hand edit or a hand delete of an unknown key (R2P-01/02).
- **Ordering recommendation: keep r1's order (known keys in the fixed order, then unknown keys) for actions, and amend the ledger ruling.** The M-2 rationale covers the top level only. The fixed entry order comes from spec §B.5 and `sanitizeEntry`. Aligning actions with participants would change pre-existing known-key behaviour. It would cost only r1's 2 order tests (measured: the whole suite on an aligned variant gives 2 failed / 12182 passed).
- SC-599 untouched: no Document API, no source-text editing, no comment, quote or flow-list decision. Values are kept by value and formatted by `stringifyYaml`.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**L-1: keys that look like integers are written first, ahead of the montage's own keys, at both levels.**
`src/elements/montage/model.ts:150` (`unknownPairs` → `Object.entries`) and `:157` / `:299` / `:335` (`carryUnknown` onto a plain object). JavaScript always puts integer-like own keys (`"2"`, `"10"`) before string keys, in ascending order, whatever the insertion order. The placement ruling ("known keys first, then unknown keys in their original order") therefore does not hold for them. Measured (probe P8, real pipeline and Reading-view splice):
YAML in (top level): `k_null: ~ … 2: numeric key` then `10: ten` then `rounds: 3 …`. Entry in: `hero: Kira`, `round: 1`, `result: success`, `7: seven`.
YAML out: `"2": numeric key` then `"10": ten` as the first two lines of the block, before `rounds:`. The entry comes out as `- "7": seven` then `hero: Kira …`.
The values survive, the output is stable on the next pass (P14), and the YAML key changes from an int `2` to a string `"2"`. Model-level probe P14: `title: T … notes: a, 2024: year` serializes `"2024"` first, before `title`. Pre-existing for `participants:` items too (raw objects). Rare in practice (a Director would have to key notes by number).
Prescribed fix: do not restructure. Add one sentence to the SC-625 doc comment at `model.ts:132-140` ("a key that looks like an integer is written first: JS object key order, not a choice"). Add a unit test that pins it, so a later change does not "fix" it by accident. A strict fix would need a `Map` DTO through `omitUntouchedDefaults`/`stringifyOmittingUntouched`, which costs more than this edge is worth.

**L-2: the CHANGELOG bullet overclaims "written back as you typed them".**
`/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/CHANGELOG.md:14`. The values are kept, but not how they were typed. `tags: [a, b]` comes back as a block list (P8: `k_list: [x, y]` → `k_list:\n  - x\n  - y`). Comments are still dropped (SC-599). A key typed above the montage's own keys moves below them. An integer key gains quotes (L-1). A user who reads "as you typed them" and then sees their flow list reflowed will report a regression. That formatting question belongs to SC-599, and the bullet should not answer it.
Prescribed fix: replace "They are now written back as you typed them." with "They are now kept, with the same values (the block's layout may still change on a write)." Or simply "They are now kept."

**L-3: the jsdom write-path table misses six paths, and the hostile-key test covers only `__proto__`.**
`test/dom/elements/montage-matrix.test.ts:1139` (`ACTIONS`, used by X09) covers 7 paths: quick log, sheet Log, End round, Add a round, Reset progress, Add a hero, Set limits. It does not cover **Undo, sheet edit (correct), sheet Remove, Back to round, Clear all (done bar), Reopen**. The unit test covers only `correctMontageEntry`. I ran all six through the real pipeline (probes P1-P5) and all keep the extras, so this is a coverage gap, not a bug. `montage-serialize.test.ts` "a `__proto__` key…" covers only `__proto__`. P6 shows `constructor`, `toString`, `hasOwnProperty`, `valueOf` and `toJSON` also round-trip, at both levels, with no crash.
Prescribed fix: add a second `test.each` (or extend `ACTIONS`) for Undo, sheet edit, sheet Remove and Back to round on the `OWN` fixture. Add one done-state case each for Clear all and Reopen (P5 fixtures: `success_limit` = successes, and `current_round = rounds + 1`). Extend the `__proto__` test YAML with `constructor:`, `toString:` and `hasOwnProperty:` at both levels. The probe source to copy from is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r2-review/zz-sc625r2-probe.test.ts`.

### INFO

**I-1: ordering, actions vs participants. Recommendation: keep r1 and amend the ruling (owner decision).**
- *What M-2 covers.* sc191 review-2 M-2 (`docs/superpowers/dse-overhaul/build-ledgers/sc191-montage-overhaul/sc191-review2-report.md:388-415`) is about the **top level only**. `logMontageEntry`/`addMontageHero` assigned `entries`/`participants` for the first time on a fresh or old-shape model, so the keys landed after `current_round`/`_dse_anchor`. The next write then moved them back, a second gratuitous diff. The fix (fix-3 report:99-105) reassembles the top-level object in §B.5 order. It never touched entries: `serialize` passed `model.entries` through unchanged.
- *Where the fixed entry order comes from.* Spec §B.5 (`sc191-impl-spec.md:151-154`) says "Entry key order (fixed): hero, round, result, skill, note". Before SC-625, `sanitizeEntry` built every entry fresh in that order, so a hand-typed `{result, hero, round}` already came back as `hero, round, result` on any write. That is pre-existing behaviour for known keys. (One pre-existing drift: `correctMontageEntry` adding `skill` to an entry that already had `note` produced `note, skill`. r1's `orderEntry` fixes that drift too.)
- *Why participants differ.* `participants` items are SC-610's "kept as typed and in place" contract: raw objects, items that are not heroes kept, nothing rebuilt. It is a different contract, not a precedent the entry contract broke.
- *Cost of aligning (measured).* I made a variant where `sanitizeEntry` keeps each entry's typed key order and `serialize` does not reorder (`model.aligned.ts` in the scratch dir) and ran the whole suite: **2 failed / 12182 passed**. The 2 failures are r1's own `montage-serialize.test.ts:547` and `:556`. No pre-existing jest test or snapshot pins entry key order. The e2e entry assertions are `toEqual`/`toMatchObject`, which ignore order (MONT-X11's order check is top-level only). So aligning is cheap in tests. But it would change known-key behaviour that predates the ticket, depart from §B.5, and let a correction append `skill`/`note` after the extras, which is the drift `orderEntry` exists to stop. The only gain is zero first-write churn on an entry typed out of order. r1's order churns once, then stays stable (unit test "serialize is stable on a second pass", probe P14).
- *Suggested ledger text:* "Actions follow the top-level rule (known keys in §B.5 order, then unknown keys in original order). `participants:` items keep SC-610's as-typed contract. The difference is deliberate."

**I-2: "known means read" holds, with no duplicate and no stale alias.** I enumerated every property read on the model in `src/elements/montage/`: `title, description, rounds, success_limit, failure_limit, successes, failures, participants, entries, current_round, _dse_anchor`, which equals `KNOWN_MODEL_KEYS` (`model.ts:142`). Entry reads: `hero, round, result, skill, note`, which equals `KNOWN_ENTRY_KEYS`. The parser has no alias. The framework keys never reach `parse`: `prefs:` and the collapse keys are popped in `pipeline.ts:338-353` and re-emitted by `withReservedKeys`. Probe P9 (`collapsed`, `collapsible`, `prefs`, `_dse_anchor` beside `table_notes`) found no duplicate line. Keys read and then dropped stay dropped: `description: 3` and `entries: []` (P15), `entries: a scalar` (P7), and an empty `skill`/`note` (r1 unit test).

**I-3: a stale model in jsdom overwrites a hand edit for every key, not only unknown ones. Real Obsidian does not.** In jsdom with no re-render (P10/P11), a hand edit to `table_notes` or a hand delete of it, followed by a click on the old view, writes the old value back. The same happens to a **known** key (P10k: a hand edit `success_limit: 9 → 7` comes back as 9). This is the whole-block rewrite from a model drawn before the edit. It is not new to SC-625 and only shows because the harness never re-renders. In real Obsidian the hand edit re-renders the block first. My e2e probes against the shipped `Montage/unknown-keys.md` both pass: **R2P-01** (a hand edit of `table_notes` and an entry's `dc` while the block is drawn, then a quick log: both edits kept) and **R2P-02** (both keys deleted by hand, then a quick log: neither comes back). Together with MONT-X08 (the known-key twin) this closes brief item 5. No action needed. Optionally, promote R2P-01/02 into `integrity.e2e.ts` as MONT-X13/X14.

**I-4: pre-existing framework key loss, not montage and not in SC-625's scope (follow-up candidates for the owner).** Measured in P9:
- `collapsed: yes` (a string, not a boolean) is popped by `extractCollapseKeys` (`src/framework/chrome/collapsedKey.ts:107-111`) but never added to `popped`, so the first write deletes it.
- A `prefs:` map whose keys are all unknown or ungated (`prefs: {boardDensity: compact}`) is deleted whole on the first write (`src/framework/prefOverrides.ts:66-84`; only SC-406 gated keys pass through).
- `entries: <scalar>` (P7) and `description: <non-string>` are dropped because the montage reads them and rejects them.
All are framework-wide (every element), and none comes from r1. If the owner wants a ticket: "a write deletes a `prefs:` map or collapse key the framework could not read".

**I-5: a design note on where the extras live.** r1 keeps the extras as own enumerable properties on the parsed model and entries. `serialize` writes back every own key outside the known sets. So if a future change attaches a transient own property to a montage model (a cache, a flag), it will now be written to the note. Before SC-625 the fixed-key rebuild filtered such a property out. Today nothing does this: the only model fields assigned anywhere in `src/elements/montage/` are the known keys, and nothing in the framework sets properties on models. No action needed. A one-line warning in the `model.ts:132` comment ("never put a non-schema own property on the model: serialize writes it") would make the rule visible.

**I-6: housekeeping for the owner.**
- `test/dom/elements/montage-matrix.test.ts:1530-1532`: the `[K] filed bugs (test.failing)` header now holds plain K01/K02 (and K03 from SC-626). This is cosmetic and SC-626 set the precedent.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md:202` still says "jsdom `test.failing` markers for montage bugs: SC-625 x2, SC-631". Line 31 (the e2e CURRENT text) needs `441/448 ok, 0 failed, 7 known-bug, coverage: 235/235 pairs` and jest fresh 12184/2. r1's proposed text is correct.
- The lifecycle note r1 proposed (the flag is `--only=A,B`, and `--only A,B` runs everything) matches what I saw: each `--only=` part reported exactly its own scenario count.
- r1's stray `/tmp/claude-1000/-home-scott/code-placeholder` is outside my remit (not touched).

## Probes and results

Probe sources: `.../sc625-r2-review/zz-sc625r2-probe.test.ts` (jsdom, real `ElementPipeline` + `ReadingModeBlockHost` over a fake vault) and `.../sc625-r2-review/zz-r2-probe.e2e.ts` (real Obsidian). Each was copied into the worktree for its run and then **removed** (`git status --porcelain` empty afterwards). Logs: `probe-run3.log` (final, 16/16), `probe-run2.log` (P6-P9 output), `e2e-probe.log`.

| # | Probe | Result |
|---|---|---|
| P1 | Undo (two entries with extras) | the remaining entry keeps `dc: 12`; `table_notes` and `zz_after` kept, after `current_round` |
| P2 | sheet edit via cell click (note + result change) | `hero, round, result, skill, note, dc` (fixed order, then the extra); the other entry keeps `dc, tag` |
| P3 | sheet Remove | the remaining entry keeps `dc: 15, tag: second` |
| P4 | Back to round | all extras kept |
| P5 | Clear all (done bar) / Reopen (rounds exhausted) | top-level extras kept; Clear all removes entries (reset, by design); Reopen keeps entry extras |
| P6 | `__proto__` (map), `constructor`, `toString`, `hasOwnProperty`, `valueOf`, `toJSON` at top level and in an action | no crash; all written back as own keys at both levels; `({}).polluted` undefined; `Object.prototype` still 12 own names |
| P7 | entries that are not maps (`"str"`, `5`, `[a,b]`, `null`) / `entries: scalar` | non-map items dropped as before; the valid entry keeps `dc: 3`; scalar `entries` dropped (known key, as before) |
| P8 | unknown values: null, nested map with list of maps, flow list, `\|` block, `""`, `false`, date-like, integer keys | every value equal by value after the write; integer keys move first (L-1); flow list becomes a block list (formatting, SC-599) |
| P9 | `collapsed`/`collapsible`/`prefs`/`_dse_anchor` beside `table_notes` | no duplicate key; `prefs:` with an unknown key dropped and `collapsed: yes` dropped, both pre-existing framework behaviour (I-4) |
| P10/P11/P10k | hand edit / hand delete then click on a stale jsdom view | old value written back, for unknown AND known keys alike (pre-existing, I-3) |
| P12 | hand edit then fresh render then click; hand delete then fresh render then click | edit kept; deleted keys stay deleted |
| P13 | two blocks with the same unknown keys, write to the FIRST | second block byte-identical; prose above, middle and below intact |
| P14 | model-level integer key; stability | `"2024"` before `title`; second serialize byte-identical |
| P15 | known-but-invalid values (`description: 3`, `participants: []`, `entries: []`) | dropped, not resurrected as unknown |
| R2P-01 | real Obsidian: hand edit of `table_notes` and an entry's `dc` while drawn, then quick log | `table_notes: edited by hand`, `dc: 14` kept |
| R2P-02 | real Obsidian: both deleted by hand while drawn, then quick log | neither comes back |
| Base | `src/` at `11fbded6`, tests at head (`montage-serialize` + `montage-matrix`) | 17 failed / 252 passed of 269; head 269/269 |
| Align | aligned-order variant (actions keep typed order), whole jest suite | 2 failed (r1's `:547`, `:556`) / 12182 passed |

Ticket-id and marker checks: `grep` finds no `knownBug('SC-625'` and no `test.failing` for SC-625 (the only montage `test.failing` left is K04/SC-631). New titles `[X09]`, `[X10]`, `[MONT-X11]`, `[MONT-X12]` carry no bracketed ticket id. Each `MONT-X11`/`MONT-X12` id appears once in `e2e/specs`, and no `MONT-*` id is duplicated. The unit describe's "(SC-625)" is in parentheses and sits in a jsdom suite the e2e runner never reads.

SC-599 check: the diff is 47 lines in `model.ts` (a key set, two helpers, `orderEntry` and three call sites), plus tests. It has no `yaml` import, no `Document`/`parseDocument`, and no source-text splicing. Formatting is left to `stringifyYaml`.

## Gate logs

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r2-review/`:
- `gate1.rc` (head `78d8658f`, tsc=0, lint=0, jest=0), `r2-tsc.log`, `r2-lint.log`, `r2-jest.log` (`Tests: 2 skipped, 12184 passed, 12186 total`; 0 "Exceeded timeout").
- `r2-life-p1.log` … `r2-life-p7.log` with `.rc` files: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 ok, 0 failed. Union **64/64**. No flake re-runs needed.
- `r2-e2e.log`, `r2-e2e.rc`: `OBSIDIAN-E2E done: 441/448 ok, 0 failed, 7 known-bug, coverage: 235/235 pairs`. The known bugs are SC-257, SC-384, SC-355, SC-627, SC-628 x2 and SC-629.
- `styles-base.sha`, `styles-head.sha`, `styles-after-e2e.sha` (all `18730938…a7f1f9`); `base-build.log`, `head-build.log`.
- `base-check-jest.log`, `head-check-jest.log`, `base-check-status*.txt`; `aligned-jest.log`, `aligned-status-after.txt`, `model.aligned.ts`.

Working tree: the dse worktree was clean at start and is clean at end (`git status --porcelain` empty, HEAD `78d8658f`). The superproject shows only the pre-existing uncommitted pointer ` M draw-steel-elements` (r1 did not commit a bump, by brief). The build artefacts `main.js` and `styles.css` are rebuilt from head and are git-ignored.
