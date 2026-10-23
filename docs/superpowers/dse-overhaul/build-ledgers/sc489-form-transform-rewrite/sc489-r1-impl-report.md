# SC-489 r1 implementation report (implementer A)

## Executive summary
- STATUS: DONE. dse branch `sc489-form-transform-rewrite` tip `6cfc338`, rebased onto origin/develop `9f08f06` (re-based twice: 0dff966 -> 53e1e48 -> 9f08f06 after the owner's mid-task message).
- Superproject tip `220c0a7` (CHANGELOG only), rebased onto origin/main `6a176e6`. Submodule pointer not bumped, nothing pushed.
- Files: `src/authoring/FormModal.ts`, `test/dom/authoring/formModal.test.ts` (+ CHANGELOG). No other src/schema/parser edits.
- Tests: 11 new in `describe('SC-489')`; 9 red at base, 2 pins pass at base (as the survey predicted). No existing assertion changed or went red.
- Gates on 9f08f06 + branch: tsc+tsc -p e2e clean, lint clean; jest 5858 passed / 1 skipped / 241 of 242 suites (post-shots); lifecycle 34/34; e2e 108/108 ok, 0 failed, 0 known-bug, 69/69; shots 592 rc 0 with all in-run lines; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Deviations: none from the ledger Design. Earlier 53e1e48 logs are superseded (one load-timeout flake in initiative-default-keys.test.ts under load 26 was seen there, unrelated, not reproduced on the final run).

## Commits
dse (`/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/draw-steel-elements`):
- `3708b54` test(SC-489): form Save must not rewrite values validation normalises (red)  <- RED commit
- `6cfc338` fix(SC-489): form validation normalises a copy; Save writes the raw working data

Superproject:
- `220c0a7` docs(changelog): SC-489 block edit form no longer rewrites saved values

## What changed
`src/authoring/FormModal.ts`
- D1: module helper `cloneContainers(v)` (arrays and plain objects recursively copied, everything else by reference). `private checked`; `normalise()` clones `working`, validates the clone, stores it as `checked`, returns messages. Called once in `onOpen` before the field loop (non-raw mode) and by every `revalidate()` (fresh clone each time).
- D2: `currentBody()` / `save()` unchanged: they write the raw `working`.
- D3: `renderPreview` calls `def.parse(this.checked, this.currentBody())`; `refreshDefaultLabels` builds `absent` from `checked`.
- D4: `displayValue(key, current, options)` used by the required and optional select branches: raw value if it is an option, else `checked[key]` if that is an option, else raw (stays blank). `working` untouched, no change event.
- D6: doc comments updated (`currentBody` comment; the SC-488 label comment now says `checked`).

`test/dom/authoring/formModal.test.ts`: new `describe('SC-489: Save does not rewrite values the user did not change')`, real elements and real ValidationService (a local required-select schema with `transform` for the Alpha row).

CHANGELOG (`/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/CHANGELOG.md`): one bullet under `## Unreleased`.

## Tests (survey section 5 rows) and red/green at base
1. untouched `- Climb` saves `Climb`: RED
2. `style: Chips` + toggle saves `style: Chips ...`: RED
3. stamina `style: Sheet` untouched and with Max 25: RED
4. select opens on `chips` / `sheet` / `alpha`: RED
5. preview parity (chips layout, sheet notice): green at base (preview already ran on the transformed data); pins D3
6. typed `- " Climb "`: preview shows climb owned, Save writes it as typed: RED (Save half)
7. Chips -> list, Chips -> Default (label stays `Default (ledger)`): RED
8. untouched custom `skill_group: " Exploration "` kept: RED
9. required select `style: Alpha` valid and saved as `Alpha`: RED
10. `style: Grid` stays blank, Save disabled: green at base (pin)
11. validate never receives `working`: each call gets a fresh deep copy (distinct object and distinct `skills` array): RED

Red run: 9 failed / 43 passed in the file (log `.../sc489-r1-impl-a-x7k2qp/jest-fm-red.log`). Green: 52/52 (`jest-fm-green.log`).

## Gates (final tip 6cfc338 on 9f08f06; logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-impl-a-x7k2qp/)
| gate | result | log |
|---|---|---|
| tsc (incl. -p e2e) | clean, rc 0 | r2-tsc.log |
| lint (incl. e2e) | clean, rc 0 | r2-lint.log |
| lifecycle (port 9313) | `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed` | r2-life.log |
| e2e | `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` | r2-e2e.log |
| shots | 592 PNGs, rc 0; host-copy pin OK; button host-leak OK (113 ... 678); modal button host-leak OK (10 ... 228); no ALLOWLISTED; pressed toggle parity OK; pipette selected look OK; text scale once OK (107256 ... 214 loads); PIN DRIFT warning present | r2-shots.log |
| jest (after shots) | 5858 passed / 1 skipped / 241 of 242 suites, rc 0 | r2-jest.log |
| freeze | `freeze OK (280/280 ...)` | r2-freeze.log |
| parity | 0 gap(s), 0 undeclared, 24 declared | r2-parity.log |

(`text scale OK (1626 ...)` line also present in r2-shots.log.)

## Drive-by fixes:
none

## Follow-ups:
- FYI (D5, for the land-ready comment): an untouched `style: Chips` shows as option `chips` while Save keeps `Chips`.
- Stale-state note: other load-sensitive jest test `test/dom/elements/initiative-default-keys.test.ts` ("pool back at its parse value ...") timed out at 5 s once at load ~26 on the 53e1e48 run; passed at load 5 on the final run. Not related.
- Not touched, per scope: SC-493, SC-494, SC-404, SC-504.
