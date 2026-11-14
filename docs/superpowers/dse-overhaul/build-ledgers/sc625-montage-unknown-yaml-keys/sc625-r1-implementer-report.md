# SC-625 r1 implementer report

**Executive summary**
- Verdict: DONE. Montage writes keep every key the montage does not read, at the top level and on each logged action.
- dse branch head `78d8658f` (branch `sc625-montage-unknown-yaml-keys`, on `11fbded6`; `origin/develop` still `11fbded6`, no rebase). Fix `8b7dc083`, e2e `78d8658f`.
- Superproject CHANGELOG commit `36dae9e2` (own commit; no pointer bump committed).
- tsc clean, lint clean. jest 12184 passed / 2 skipped (fresh worktree: 12166 + 18 new). Lifecycle 64/64. e2e `441/448 ok, 0 failed, 7 known-bug, coverage 235/235 pairs`.
- `styles.css` byte-identical to a clean `11fbded6` build (sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` both), so shots / freeze / parity carry.
- Fix is 47 lines in `src/elements/montage/model.ts`; nothing else in src changed. No Document API, no source-text editing (SC-599 untouched).

## Enumeration

Keys read by `parseModel` (top level): `title`, `description` (kept only if a non-empty string), `rounds`, `success_limit`, `failure_limit`, `successes`, `failures`, `participants` (via `sanitizeParticipants`), `entries` (via `sanitizeEntries`), `current_round`, `_dse_anchor`. Per action (`sanitizeEntry`): `hero`, `round`, `result` (required, else the action is dropped), `skill`, `note` (kept only if a non-empty string). There is no legacy alias or old spelling anywhere in the montage parser, so there was nothing to exclude beyond the known sets. A key that is read and then left off for being empty (`skill: ""`, `note: ~`, `description: 3`) counts as known, so it stays dropped, not resurrected as an "unknown" key. The pipeline pops `prefs:` before `parse` and the wrapper re-emits it, so it never reaches the model.

Write paths (all in `view.ts`, each mutates `this.model` then `commit()` -> `persist()` -> `serialize`): quick log (`commitNewEntry` -> `logMontageEntry`), sheet Log (same) and sheet edit (`correctMontageEntry`, mutates the entry in place), sheet remove (`removeMontageEntry`), Undo (`undoLastMontageEntry`), End round (`endMontageRound`), Back to round (`backMontageRound`), Add a round (`addMontageRound`), Reset progress / Clear all (`resetMontageProgress`), Add a hero (`addMontageHero`), Set limits (`setMontageLimits`). The strip / guide toggles do not write (view.ts ~146 "Never persists"). Every one goes through `def.serialize` = `serialize` in model.ts; there is no other writer.

`participants:` keeps extras because `sanitizeParticipants` keeps the raw typed items (same objects), and `addSkillOccurrence` etc. mutate those objects in place. Actions now behave the same way for extras (carried on the entry object) with one difference: the fixed key order is enforced at serialize, because a correction can append `skill` / `note` after the extras. Participants have no fixed-order rebuild, so their extras stay where they were typed; this is a pre-existing difference, I did not change it. Ledger placement ruling applied as written (known fixed order, unknown after, original relative order).

## Design

Extras live as own enumerable properties on the parsed model object and on each parsed entry object (no new field, no side table). `unknownPairs(source, known)` lists own string keys not in `KNOWN_MODEL_KEYS` / `KNOWN_ENTRY_KEYS` (none for a non-mapping, so a string body does not yield indices). `carryUnknown(target, pairs)` copies with `Object.defineProperty`, never assignment, so a hand-written `__proto__:` key becomes a plain own key and sets no prototype. `parseModel` and `sanitizeEntry` call it after the known keys. `serialize` reassembles as before, then maps entries through a new `orderEntry` (hero, round, result, skill, note, then extras) and appends the model's extras after `_dse_anchor`. SC-482's omit-untouched-defaults only filters known keys, so it is unaffected. A new action has no extras. A dropped action stays dropped (validity rules unchanged). Values are carried by value; formatting is whatever `stringifyYaml` does today.

Reset progress sets `entries` to undefined, so the actions (and their extras) go with them; the top-level extras stay. That is the existing meaning of reset (play state cleared), noted in test X09.

## Tests added (18 new + 2 flipped)

jest, `test/unit/model/montage-serialize.test.ts`, describe "keys the montage does not know survive a write (SC-625)" (10 tests):
1. top-level scalar / nested map / list survive another action logged. Fails on base: yes
2. top-level order: known fixed, then unknown in original order. Fails on base: yes
3. action keeps unknown keys (nested too) while another is logged; new action has none; order. Fails on base: yes
4. corrected action gaining note + new skill keeps extras after the known keys. Fails on base: yes
5. Add a hero + Set limits keep top-level and action extras. Fails on base: yes
6. second serialize pass is stable. Fails on base: no (guard)
7. dropped action stays dropped; kept action keeps its own. Fails on base: yes (the kept one loses `dc`)
8. empty `skill` / `note` not resurrected as unknown. Fails on base: no (guard for the "known means read" ruling)
9. block with nothing unknown serializes as before. Fails on base: no (guard)
10. `__proto__` key: no pollution, no crash, round-trips, prototypes intact. Fails on base: yes

jest, `test/dom/elements/montage-matrix.test.ts` (real pipeline, real clicks, real Reading-mode splice):
- [X09] x7 (`test.each(ACTIONS)`: quick log, sheet Log, End round, Add a round, Reset progress, Add a hero, Set limits): top-level extras kept, action extras kept (except Reset progress), order. Fails on base: yes, all 7
- [X10] two blocks in one note: write to the second leaves the first block byte for byte, the second's extras kept, text above and below kept. Fails on base: yes
- [K01], [K02]: `test.failing` markers flipped to plain `test` (titles lose the ticket tag). Fail on base as plain tests: yes

Base check: with `model.ts` reverted to `11fbded6`, 17 tests failed (7 unit + 7 X09 + X10 + K01 + K02); tests 6, 8, 9 pass on base by design.

e2e, `e2e/specs/montage/integrity.e2e.ts` (ids unused before, `MONT-X11`, `MONT-X12`):
- [MONT-X09], [MONT-X10]: `knownBug('SC-625')` flipped to `it` (quick-log path: top-level `table_notes`, action `dc`). Pass.
- [MONT-X11] Add a hero keeps both and orders `table_notes` after `current_round`. New.
- [MONT-X12] Set limits keeps both. New.
The e2e set covers quick log, Add a hero, Set limits; End round, the sheet, Add a round, Reset are covered by jsdom X09 (the splice is the product's own). `knownBug` import dropped from the file (no other use there).

## Gates

- tsc: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r1-impl/tsc.log` (exit 0); lint: `.../lint.log` (exit 0). Same directory below.
- jest: `.../jest-full.log`: `Test Suites: 1 skipped, 280 passed`; `Tests: 2 skipped, 12184 passed, 12186 total` (fresh worktree, no shots cache; expected 12166 + 18).
- lifecycle: `.../life1.log`: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed`. DEVIATION: I passed `--only A,B,...` (space-separated, as the brief shows) but the runner takes `--only=A,B`, so the "part 1" call ran the whole suite in one background run (about 30 min on a loaded host, shared with another worktree's run) instead of seven parts. Every scenario ran, 64 ok, no re-runs needed. Union is the same set.
- e2e: `.../e2e.log`: `OBSIDIAN-E2E done: 441/448 ok, 0 failed, 7 known-bug, coverage: 235/235 pairs` (expected 437 + 2 flipped + 2 new = 441; 446 + 2 = 448; known-bug 9 -> 7).
- styles.css: fix build `.../styles-fix.sha`, base build `.../styles-base.sha`, both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`. Shots / freeze / parity not run (carry). Build logs: `build-fix.log`, `build-base.log`.
- Setup: the fresh worktree had no `node_modules`; I ran `npm ci` (exit 0, `install.log`).

## Drive-by fixes:
None.

## Follow-ups:
- Pipeline side: `autoResolveRefs: false` for montage, so unknown values holding `@path` / `[[wikilink]]` text are not resolved and come back as typed. No issue here; noted because SC-637 (negotiation) uses a different resolve setting and may behave differently.
- `participants:` extras keep their typed position (no fixed-order rebuild), actions now follow the fixed-then-unknown order. Harmless, but inconsistent; the owner may want a note.
- I created one stray file by mistake: `/tmp/claude-1000/-home-scott/code-placeholder` (one line, "x"). I could not remove it (no `rm` in /tmp allowed); safe to delete.

## Proposed dse-verify SKILL.md text
- Replace the line about "jsdom test.failing markers for montage bugs: SC-625 x2" with: "jsdom `test.failing` markers for montage bugs: none left from SC-625 (flipped to plain tests, 2026-11-14; K04 SC-631 remains)".
- e2e CURRENT paragraph: `OBSIDIAN-E2E done: 441/448 ok, 0 failed, 7 known-bug, coverage: 235/235 pairs` (SC-625: MONT-X09/X10 flipped, MONT-X11/X12 added); jest fresh 12184 passed / 2 skipped (12185 / 1 with the shots cache); lifecycle 64/64 unchanged; styles.css sha256 `18730938...a7f1f9` unchanged.
- Lifecycle note: the flag is `--only=A,B,C` (an equals sign); `--only A,B,C` is silently ignored and runs everything.
