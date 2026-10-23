# SC-487 implementer report, round 1

**Executive summary**
- **Verdict: DONE.** O1-O6 implemented; no STOP condition hit (inside-the-name = the character ENDS the name, Obsidian does not strip it; a leading zero-width character renders in neither mode).
- **Commits:** dse (branch `sc487-pin-zwsp`, on `origin/develop` `d152ea4`, unmoved): `def98b2` O1 guard + jest, `26a86d1` O2/O3 name rule + e2e `typeOf` + tables/tests, `2bf8541` G-S33. Superproject worktree: `382f595` (CHANGELOG bullet + dse-verify lifecycle count 33). Submodule pointer NOT bumped. No push.
- **Gates:** tsc (incl. `-p e2e`) rc 0 · lint rc 0 · jest **5788 passed / 1 skipped / 238 of 239 suites** (+19 tests; 5787 / 2 skipped before `shots` cached the css, as the skill says) · lifecycle **`33/33 ok, 0 failed`** · e2e **`104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592 PNGs, 0 FAIL** but rc 1 on `HOST COPY DRIFTED` (known, see below) · freeze **`freeze OK (280/280 ...)`** · parity **0 gap(s), 0 undeclared, 24 declared** (run last, rc 0).
- **G-S33 fails on `d152ea4` and passes on HEAD** (both on Obsidian 1.14.4 and on the installed 1.15.0).
- **Environment caveat:** the machine's Obsidian is now 1.15.0 (`~/.config/obsidian/obsidian-1.15.0.asar`, 2026-10-22). The committed lifecycle driver takes the NEWEST asar, so the full lifecycle gate ran on 1.15.0; e2e uses the pinned 1.14.4. All measurements and G-S33 / integrity probes were also run on **1.14.4** (injected driver copy with an asar override; the committed driver is unchanged).

## O2 measurement (Obsidian 1.14.4, real app; probe copy of the lifecycle driver, never committed)

Each row: fixture note on disk, bytes confirmed (`openHex` in `measure-*.json`, and the escape-built fixtures contain no pasted characters). "rendered" = a `[data-dse-element="counter"]` mounted. "Before"/"after" = `fenceLanguage` before (d152ea4) and after this change (computed by bundling the real function; `langtable.txt`).

| Opener (after ```` ``` ````) | Reading view rendered | Live Preview rendered | LP "Pin to sidebar" on d152ea4 | DSE language before | DSE language after |
|---|---|---|---|---|---|
| `ds-counter` + U+200B | no (plain code, `language-ds-counter<U+200B>`) | **yes** | anchored, panel NOT mounted, "unavailable", write lost `[10]` | `ds-counter<U+200B>` | `ds-counter` |
| `ds-counter` + U+200B + `x` | no | **yes** | same bug | `ds-counter<U+200B>x` | `ds-counter` |
| `ds-co` + U+200B + `unter` (inside) | no | **no** (plain code block) | n/a | `ds-co<U+200B>unter` | `ds-co` (unregistered, not claimed) |
| U+200B + `ds-counter` (right after backticks) | no | **no** | n/a | `<U+200B>ds-counter` | `<U+200B>ds-counter` (unchanged, not claimed) |
| `ds-counter` + U+FEFF | **yes** | **yes** | anchored, panel mounted, write `[11]` (works) | `ds-counter` | `ds-counter` |
| `ds-counter` + U+FEFF + `x` | no | **yes** | works (`ds-counter`) | `ds-counter` | `ds-counter` |
| `ds-co` + U+FEFF + `unter` | no | no | n/a | `ds-co` | `ds-co` |
| U+FEFF + `ds-counter` | no | no | n/a | `<U+FEFF>ds-counter` | unchanged |
| `ds-counter` + U+200C | no | **yes** | bug (as U+200B) | `ds-counter<U+200C>` | `ds-counter` |
| `ds-counter` + U+200C + `x` | no | **yes** | bug | `ds-counter<U+200C>x` | `ds-counter` |
| `ds-co` + U+200C + `unter` / U+200C + `ds-counter` | no / no | no / no | n/a | unchanged | `ds-co` / `<U+200C>ds-counter` |
| `ds-counter` + U+200D (and `+x`) | no | **yes** | bug | `ds-counter<U+200D>[x]` | `ds-counter` |
| inside / leading U+200D | no / no | no / no | n/a | unchanged | `ds-co` / `<U+200D>ds-counter` |
| `ds-counter` + U+2060 (and `+x`) | no | **yes** | bug | `ds-counter<U+2060>[x]` | `ds-counter` |
| inside / leading U+2060 | no / no | no / no | n/a | unchanged | `ds-co` / `<U+2060>ds-counter` |

Extra openers (U+200B family, all LP only, same bug before / works after): `ds-counter<U+200B> extra`, `ds-counter<U+200B><U+200B>`, `~~~ds-counter<U+200B>`, CRLF note. `ds-counter <U+200B>` (space first) renders in BOTH modes and works (the space already ended the name).

Reading of the table: Live Preview ends the language at a zero-width character (trailing and trailing+`x` render), and the character is NOT stripped (inside the name nothing renders, and a leading one renders in neither mode). So the expected outcome holds: the name ends at the first whitespace or zero-width terminator; leading skip stays `[ \t]`. A leading zero-width character stays part of the name (like a leading no-break space), so it is never claimed.
Side note: U+FEFF + `x` renders only in Live Preview (Reading view splits the class on it and does not mount); DSE's language is `ds-counter` there before and after (unchanged).

Terminator set implemented: JS `\s` plus U+200B, U+200C, U+200D, U+2060 (U+FEFF is already `\s`). Not measured, not included: U+200E/F, U+00AD, U+180E.

## Diff summary (dse repo, 3 commits on d152ea4)
- `src/framework/sidebar/registration.ts` (+18/-1): `isMountableAlias(services, alias)` = `registry.get(alias)` defined AND `def.aliases.includes(alias)` (SC-471's definition, re-written locally, nothing imported from that branch); `bindBlockToSidebar` returns the new `'unregistered'` result FIRST, before the file lookup and any `vault.process`; `sendToSidebar` and `requestPinToSidebar` show one Notice for it. Every stamping entry point (chrome pin item, "Send block to sidebar" command, the initiative command, the encounter hand-off) goes through `bindBlockToSidebar`.
- `src/framework/host/blockPrefix.ts` (+10/-5): `fenceLanguage` ends the name at `\s` or U+200B-D / U+2060; zero-width-only token is `''`.
- `e2e/driver/noteFences.ts`: `typeOf` now calls `fenceLanguage` (imported, not copied; the module already imported `matchFenceMarker` from the same dependency-free file).
- Tests: `test/dom/framework/registration.test.ts` +13 (SC-487 describe: 4 aliases x requestPinToSidebar, 4 x sendToSidebar, the command on a ```` ```js ```` fence, a registered alias still pins; plus 3 rows in the existing pin-path table); `test/unit/framework/blockPrefix.test.ts` +6 (5 zero-width characters, re-emit of the opening line); `test/unit/e2eIntegrity.test.ts` +65 table rows (13 openers x 5 characters, generated with `flatMap`; every parse (host, anchor, e2e) is asserted EQUAL to the expected language). 9 + 8 of these tests fail on the old code (checked by reverting only `src`).
- `visual-harness/obsidian-lifecycle.mjs`: fixture `Lifecycle/zwsp.md` (U+200B via `String.fromCharCode`), scenario **G-S33** appended after G-S14, header comment.
- Superproject: `CHANGELOG.md` Unreleased bullet; `.claude/skills/dse-verify/SKILL.md` lifecycle row 32 -> 33 (+ G-S33 note). The CURRENT block at ~line 1212 of that skill is left for the owner at landing.

## G-S33 fail-on-base evidence
- Base bundle: `d152ea4` `src` built to `base-bundle/` (`main.js` has no "sidebar can show"), run with the HEAD driver's G-S33 through `DSE_LIFECYCLE_BUNDLE`:
  - Obsidian 1.14.4: `G-S33 FAIL: timed out waiting for the counter mounted in the sidebar panel` (screenshot `gs33-base-1.14.4/G-S33-FAIL.png`; the anchor was already stamped, panel never mounted).
  - Obsidian 1.15.0: the same FAIL (`gs33-base-1.15.0/`).
- HEAD: `G-S33 ok` on 1.14.4 (`gs33-head-1.14.4/`) and on 1.15.0 (`gs33-head-1.15.0/`, and inside the full 33/33 run).

## Integrity probes (O4), Obsidian 1.14.4
- Pin of the trailing-U+200B block in Live Preview (G-S33 asserts all of it): anchor stamped, panel counter mounted, no `data-dse-sidebar-unavailable`, panel holds the on-disk anchor id, panel write lands (`current_value: 11`), note starts with `# zwsp\n\nTOP\n\n` + ```` ```ds-counter<U+200B> ```` + `\n` byte for byte and ends with `\n```\n\nBELOW\n`, exactly one anchor line, 0 Notices, 0 page errors.
- Unregistered alias (probe `M-UNREG`, `unreg-head/unreg.json`, command run with the cursor in the block in Live Preview): ```` ```js ````, ```` ```statblock ````, ```` ```ds-nonesuch ````, ```` ```ds-co<U+200B>unter ```` (-> `ds-co`): note byte-identical to the fixture (`identical: true`), `_dse_anchor` absent, **exactly one Notice** each, 0 sidebar leaves.

## Drive-by fixes:
none.

## Follow-ups:
1. **Lifecycle driver follows the newest asar**, now 1.15.0 on this machine, while e2e is pinned 1.14.4 and the measurements in these tickets say 1.14.4. Suggest a `DSE_LIFECYCLE_ASAR`-style override (I used an injected copy instead). Owner already knows about the shots `HOST COPY DRIFTED` (1.15.0 vs pinned 1.14.0); not touched.
2. **SC-471 rebase:** it gates the command in `editorCheckCallback` and adds its own `sendFromCommand` -> `bindBlockToSidebar`. Whoever lands second must (a) map the new `'unregistered'` result in `sendFromCommand` (its gate should make it unreachable) and (b) update my test "the command refuses a fence of another plugin (```js)", which will then see the command disabled instead of one Notice. SC-471's inline `def.aliases.includes(alias)` can be swapped for `isMountableAlias`.
3. Reading view does not mount `ds-counter<U+FEFF>x` while Live Preview does (DSE's language is `ds-counter` both before and after): pre-existing Obsidian mode difference, no action taken.
4. Terminator set is exactly the five measured characters; other invisibles (U+200E/F, U+00AD) were not measured.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r1/`)
- Measurement: `meas-a14/measure-a14.json`, `meas-b14/measure-b14.json` (1.14.4), `meas-a-1.15.0/measure-a.json` (z/f on 1.15.0, same results), `langtable.txt`; probe sources `sc487-r1-probe-fixtures.mjs`, `sc487-r1-probe-scenario.mjs`, `sc487-r1-unreg-scn.mjs`, `sc487-r1-inject.mjs`, runners `sc487-r1-probe-run.sh`, `sc487-r1-lc-run.sh`.
- G-S33: `gs33-base-1.14.4/`, `gs33-base-1.15.0/` (FAIL + png), `gs33-head-1.14.4/`, `gs33-head-1.15.0/`; `base-bundle/`.
- Unregistered probe: `unreg-head/{unreg.json,lifecycle.log}`.
- Gates: `gate-tsc.log`, `gate-lint.log`, `jest-full.log`, `jest-full2.log`, `gate-lifecycle.log`, `gate-e2e.log`, `gate-shots.log`, `gate-freeze.log`, `gate-parity.log`; test-reversion checks `jest-reg-base.log`, `jest-p2-base.log`.
