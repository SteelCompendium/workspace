# SC-457 implementer report, round 1

**Executive summary (updated after fix round 4)**
- Verdict: DONE. Fix round 4 folds re-review r4 MEDIUM-1: the name ends at the first whitespace of ANY kind after the leading spaces/tabs (develop's behaviour), so ```` ```ds-counter<NBSP>x ```` is `ds-counter` again (Live Preview pin works); leading NBSP/U+3000/FF/VT are still not claimed. One shared `fenceLanguage` (`blockPrefix.ts`).
- Bases: dse `origin/develop` `bc4a0c5`; superproject `origin/main` `72e548c`.
- Heads (not pushed): dse `772c3cda70ad029a473c3331c5608d30bdc0ce08` (11 commits on base); superproject `a61ad421e911407a71a482dd0a173054be9b6f1b` (1 commit, CHANGELOG only; no SKILL.md).
- Gates on the final head (`run11/`): tsc incl. `-p e2e` and lint clean; jest 5536 passed / 1 skipped / 233 of 234 suites (base 5457, +79); lifecycle 31/31; e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots 580, 0 FAIL; freeze `280/280`; parity 0 / 0 / 24.
- Decisions needed: none.

(The sections below up to "Fix round 1" are the round-0 report; its heads, bases and gate numbers are superseded by the above.)

## O2 - measured in real Obsidian 1.14.4 (lifecycle harness build, base code `84636a9`)
Probe: a scratch copy of the lifecycle harness (not committed) with one note per variant. Each ran in Reading view and Live Preview.

| fence opener | renders as DSE block (Reading / LP) | base `getBlockInfo().language`, blockKey |
|---|---|---|
| ```` ``` ds-counter ```` (1 space) | yes / yes | `''`, `Note.md::::4` |
| ```` ```   ds-counter ```` (3 spaces) | yes / yes | `''` |
| ```` ```<TAB>ds-counter ```` | yes / yes | `''` |
| ```` ``` ds-counter extra ```` | yes / yes | `''` |
| ```` ```ds-counter ```` (control) | yes / yes | `ds-counter`, `Note.md::ds-counter::4` |

Every whitespace variant Obsidian renders is claimed by DSE; none is rendered by Obsidian and rejected by the fix.

Base failure mode (stale snapshot):
- Reading view, +16 lines inserted above the block, click, navigate away 30 ms later (section gone at flush): the write is dropped. The disk stays at 10 and the SC-455 notice appears: "a change to a block in sp-one was not saved - the block changed on disk first." Not silent. Same for all four spaced variants.
- Reading view with the click followed by an edit above inside the 400 ms delay, and Live Preview in both shapes: the write landed on base. Obsidian hands a fresh section there, so no relocate by body is needed. The failure is the section-gone relocate, which is what G-S14 reproduces.
- Also dropped on base: the chrome "Pin to sidebar" item passed `info.language` = `''` to `requestPinToSidebar`, so it reported "couldn't find that block".

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/probe-base.log` (second probe run, the stale-shape probe; the first probe run, rendering and `getBlockInfo`, is quoted in the table above).

## O1 / O3 - the fix and the site survey
Shared definition: `fenceLanguage(info)` in `src/framework/host/blockPrefix.ts` = first whitespace-delimited token of the TRIMMED info string. `parseOpenFenceLine` (`fenceLine.ts`) uses it; `anchor.ts` `fenceAlias` delegates to it (and now trims, so an untrimmed `rest` is no longer `''`). `info` is unchanged: verbatim remainder, trailing whitespace dropped, leading whitespace kept.

| site | status |
|---|---|
| `fenceLine.ts` `parseOpenFenceLine` (feeds every host site below) | FIXED |
| `ReadingModeBlockHost`: `readSection`/`findOwnFence` (`ownFence.language`, `knownLanguage`), `getBlockInfo`, `blockKey`, `locateByBody`, `locateUnterminatedTrailingFence`, `resolveWriteTarget` durable path | FIXED via `parseOpenFenceLine` (they compare `open.language`) |
| `locateInSection` / `listFences` (SC-455 window) | not affected: `iterateFences` already used `matchFenceLine` (trimmed) + `fenceAlias`; the `getBlockInfo` language it feeds was fixed above |
| `anchor.ts` `iterateFences`, `findAnchoredBlock`, `findFenceAtLine`, `listFences` | not affected (trimmed `rest`); `fenceAlias` hardened |
| `registration.ts` `aliasAtLine` (send-block command) | not affected (`matchFenceLine` trims); pinned in jest |
| `SidebarBlockHost` | not affected (anchor-based; existing SC-290 test "a space before the language" already round-trips) |
| chrome "Pin to sidebar" (`pipeline.ts` ~744, `info.language`) | FIXED indirectly (was `''`) |
| `LivePreviewBlockHost` | n/a: unimplemented stub that throws (Live Preview goes through `ReadingModeBlockHost`) |
| Encounter view / `DseSidebarView` / `SidebarPanel` | no fence-language comparison (alias is passed in) |
| `authoring/fenceScan.ts` `scanFenceState` (`rest.trim().toLowerCase()`, whole info string) | not affected by leading whitespace (trims). Differs from first-token for `ds-x extra` - FOLLOW-UP, out of scope |
| `ReferenceResolver.extractFirstDsBlock` / `typeAdapters.extractFirstDsBlockText` (regex `^([\`~]{3,})ds-[\w-]+`) | out of scope, FOLLOW-UP: they read compendium files, need `ds-` directly after the fence, and would not see a spaced fence |
| `ReadingModeBlockHost` `CLOSE_FENCE` | close fences only, n/a |

Whitespace class: `\s` (same as `anchor.ts` `fenceAlias` before the change). Obsidian's own class is `[ \t]`; they differ only for exotic Unicode spaces, not measured.

## O4 - blockKey persistence
`blockKey` becomes `Note.md::ds-counter::N` (was `Note.md::::N`). Its only users are the in-memory `SessionStore` (`framework/session.ts`: nested Map, "cleared on plugin unload"), tab/collapse state (`kit/tabs.ts`, `kit/collapsible.ts`, pipeline chrome) and the roll service. Nothing writes it to `data.json`/settings. A user sees nothing: the key only changes across a plugin reload, when the session store is empty anyway. No collapse state is lost. No user-visible note in the CHANGELOG for this.

## O6 - integrity probes (all green)
- jest `test/dom/framework/reading-mode-host-spaced-fence.test.ts` (25 tests) and `test/unit/framework/blockPrefix.test.ts`: bytes above/below preserved; info string incl. leading space/tab/extra tokens byte-for-byte; spaced + unspaced twin with the same body, both write orders, no cross-talk; CRLF stays all-CRLF; lone CR above (SC-460) lands; unterminated spaced fence at EOF; spaced block in a callout; a body that vanished still gives exactly one "not saved" notice (O5).
- Real Obsidian, G-S14 (8 cases: 1 space, 3 spaces, tab, space+extra info, CRLF note, lone CR above, spaced twin of unspaced block, unspaced twin of spaced block): the note outside the block bodies is exactly original + shift (opening line with its whitespace, line endings, lone CR, text above/below), the target body got the edit, a twin body untouched, no notice, no page errors.

## G-S14 (O7) - fail on base
Commit order: scenario first (`22c96ef`), fix after. On base (`src/` at `84636a9`, harness at the final scenario):

```
OBSIDIAN-LIFECYCLE G-S13 FAIL: Lifecycle/spaced-one.md (one space): block #0 did not get the edit: "\nname: Health\ncurrent_value: 10\nmax_value: 20\nmin_value: 0"
```
(The id was G-S13 when run, renamed G-S14 later by O9.) Log: `.../sc457-impl-r1/gs13-base2.log`; screenshot `.../sc457-impl-r1/gs13-base2-FAIL.png`. Earlier run of the first form of the scenario: `gs13-base.log` / `gs13-base-FAIL.png` (disk 10, write dropped). With the fix: `gs13-fix.log` ok. jest on base src: 22 of the new tests fail (`jest-base-new.log`), the rest are regression pins of already-working sites (registration, locateInSection).

## Gates (final head `bf3a3b4`, base `c03db7a`), logs in `.../sc457-impl-r1/run3/`
| gate | result | log |
|---|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | clean, rc 0 | `tsc.log` |
| lint | clean, rc 0 | `lint.log` |
| jest | 5411 passed / 1 skipped / 232 of 233 suites (base 5374 -> +37) | `jest.log` |
| lifecycle (port 9347) | `done: 29/29 ok, 0 failed` | `lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs` | `e2e.log` |
| shots | 572 PNGs, 0 FAIL (host-copy pin OK, button host-leak OK 112 kinds / 672) | `shots.log` |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical ...)`, no rebaseline | `freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 | `parity.log` |

Earlier batteries on bases `84636a9` (`.../sc457-impl-r1/*.log`) and `3480231` (`run2/`, partial; stopped by PID at the shots step when the base moved) were superseded.

## Commits
dse (on `c03db7a`): `22c96ef` G-S13 scenario (failing on base), `a259757` fix + jest pins, `510c3e9` scenario compares outside block bodies, `3a71021` dse CHANGELOG, `bf3a3b4` rename to G-S14 + O8.
superproject (on `3d18dd5`): `9344eb1` CHANGELOG bullet + dse-verify list, `928764b` list names G-S14. Commit messages of the first dse commits still say G-S13 (allowed).

## Drive-by fixes
None.

## Follow-ups
1. `scanFenceState` (`authoring/fenceScan.ts`) takes the whole trimmed info string as `lang`, while the hosts take the first token: a fence like ```` ```ds-counter extra ```` gets in-fence autocomplete under the language `ds-counter extra`. Unrelated to leading whitespace.
2. `ReferenceResolver.extractFirstDsBlock` and `typeAdapters.extractFirstDsBlockText` require `ds-` immediately after the fence run, so a compendium file written with a spaced fence is not read as a ds block.
3. Durable-path write to an unterminated trailing fence drops the note's trailing newline(s) (existing behavior, pinned by the SC-343 tests; seen while writing my test). Not changed.
4. dse-verify table row 4 still says `28/28`; CURRENT block untouched as briefed.

## Fix round 1 (review r1 + O10)
Base moved e31e1a0 -> aaa88b7 during the round; rebased dse and superproject, no conflicts. No package-lock change.

- MEDIUM-1 (base moved): rebased dse onto `aaa88b7`, superproject onto `e0d3f47`. The superproject keeps ONE commit (`e9c51ce`, CHANGELOG bullet). No `.claude/skills/dse-verify/SKILL.md` change is carried (the dispatcher owns it); `origin/main`'s SKILL.md does not yet name G-S14.
- LOW-1 (NBSP / U+3000 / FF / VT are not claimed): `fenceLanguage` now skips only leading `[ \t]` and ends the token at space, tab or line end (`/^[ \t]*([^ \t\r\n]*)/`); the doc comment says why. `anchor.ts` `matchFenceLine` now strips only leading `[ \t]` and keeps the old `trimEnd()` for the tail, so the close-fence test (`rest === ''`) and trailing-whitespace behaviour are unchanged (pinned: a trailing NBSP after a bare close fence still closes). `info` stays verbatim. The e2e scanner's `typeOf` (`e2e/driver/noteFences.ts`) uses the same rule written independently, so the `e2eIntegrity` table stays a real agreement check; the table gained NBSP / U+3000 / FF / VT / space+NBSP / tab openers.
- Pins added: blockPrefix (4 whitespace kinds, `parseOpenFenceLine` + `fenceLanguage`), anchor (`fenceAlias`, `listFences`, `findAnchoredBlock` do not claim them; trailing-NBSP close still closes), reading-mode host (4 kinds: `locateByBody` never relocates onto the impostor even when it is nearer, an impostor-only note gives null, host reports the other language), e2eIntegrity table (6 new opener lines).
- LOW-2 (CHANGELOG trigger): both bullets (dse and workspace) now name the measured trigger: a click made just before leaving the note (switching notes or closing the tab).
- LOW-3: the "(29 total)" in the G-S14 header comment of `obsidian-lifecycle.mjs` is dropped.
- O10: `src/authoring/fenceScan.ts` `scanFenceState` now calls the shared `fenceLanguage(rest)` (SC-476's local regex copy deleted); SC-476's tests stay green; two pins added to `test/dom/authoring/schemaSuggest.test.ts` (NBSP and U+3000 before the name give the language `\u00a0ds-counter` / `\u3000ds-counter`, i.e. no ds type, so no autocomplete). `grep` finds exactly one `fenceLanguage` definition.
- Out of scope, untouched: SC-480, SC-481, SC-477, SC-476's own items.

### Fix round 1 commits
dse (on `aaa88b7`): `b0e56cf` G-S13 scenario (fails on base; renamed later), `18c724e` fix, `c05b864` scenario assertion, `bbee596` dse CHANGELOG, `d4f7ad3` rename G-S14 + O8, `7f32b1a` LOW-1 + LOW-3, `52f10d8` dse CHANGELOG LOW-2, `24b2703` fenceScan O10.
superproject (on `e0d3f47`): `e9c51ce` CHANGELOG bullet (reworded for LOW-2).

### Fix round 1 gates (final head `24b2703`), logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run5/`
tsc.log clean; lint.log clean; jest.log 5447 passed / 1 skipped / 232 of 233 suites; lifecycle-retry.log `done: 29/29 ok, 0 failed` (lifecycle.log = first attempt, exit 2: `MutationObserver.observe ... not of type 'Node'` at harness start-up, load average 15); e2e.log `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots.log 0 FAIL, 572 PNGs; freeze.log `freeze OK (276/276 ...)`; parity.log `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. An intermediate battery on `e31e1a0` is in `run4/` (jest 5430, lifecycle 29/29, e2e 88/92; stopped at shots when the base moved) and is superseded.

## Fix round 2 (re-review r2: HIGH-1, MEDIUM-1, INFO-1)
- HIGH-1: `fenceLanguage` = `/^[ \t]*([^ \t]*)/.exec(info.trimEnd())![1]` (leading space/tab skipped, token ends at space/tab, info read without trailing whitespace of ANY kind). Round 1's `[^ \t\r\n]` token kept a trailing NBSP/U+3000/FF/VT, so ```` ```ds-counter<NBSP> ```` (an Obsidian block that saved on develop) lost its write and the host and anchor parses disagreed. The e2e `typeOf` uses the same rule, written independently. Doc comment updated.
- Pins: (1) the three-way agreement pin is the existing `test/unit/e2eIntegrity.test.ts` open-line test, which runs the e2e scanner (`typeOf`), the host parse (`parseOpenFenceLine`) and the anchor parse (`fenceAlias(matchFenceLine(..).rest)`) over ONE case table; the table gained trailing space / NBSP / U+3000 / FF / VT, leading+trailing combinations, `\t..\t`, NBSP-after-space and NBSP-then-word openers. (2) `blockPrefix.test.ts`: six trailing-whitespace kinds, host and anchor alike. (3) `reading-mode-host-spaced-fence.test.ts`: trailing NBSP, trailing U+3000, leading space + trailing U+3000: `getBlockInfo` language `ds-counter`, block key, section-gone durable write lands (trailing whitespace of the opening line is dropped by the SC-290 `info`, unchanged). (4) `schemaSuggest.test.ts`: `scanFenceState` gives `ds-counter` for trailing NBSP / U+3000. Probe: with the round-1 code these pins fail (10 failures, `run6/jest-prefix-old.log`, rc 1 = that deliberate probe, not a gate failure).
- MEDIUM-1: rebased dse onto `0ce76dd` (SC-326 added G-S13): kept SC-326's G-S13 and my scenario as G-S14 (ids set to G-S14 already in the first commit, so no intermediate duplicate ids); the lifecycle diff against base is +80 lines, all mine. Lifecycle now 30/30. Superproject rebased onto `ca333c6`, one CHANGELOG-only commit.
- INFO-1: both CHANGELOG bullets say "the space before the block name is kept" instead of claiming the opening line is untouched. `info` behaviour unchanged (still drops trailing whitespace).
- Out of scope, untouched: SC-477, SC-480, SC-481.

### Fix round 2 commits (dse, on `0ce76dd`)
`2f219ba` G-S13 scenario (fails on base; id G-S14 in this rebase), `a3bf17c` fix, `54a6e30` scenario assertion, `8e11443` dse CHANGELOG, `13dcc8a` rename note + O8, `d81c3a2` LOW-1/LOW-3, `c2cb305` dse CHANGELOG LOW-2, `a18fc4e` fenceScan O10, `a601e94` HIGH-1, `690c783` INFO-1 wording (shas as of the final head; `git log 0ce76dd..HEAD`).
Superproject (on `ca333c6`): `d4b10f829de7a8957329c1d01b96aa2af68a8dfb` CHANGELOG bullet.

### Fix round 2 gates (final head), logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run7/`
tsc.log clean; lint.log clean; jest.log 5467 passed / 1 skipped / 232 of 233; lifecycle.log `done: 30/30 ok, 0 failed`; e2e.log `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots.log 0 FAIL, 572 PNGs; freeze.log `freeze OK (276/276 ...)`; parity.log `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. `run6/` holds the focused probe runs and a partial battery (tsc, lint, jest 5467) on the same code.

## Fix round 3 (re-review r3 MEDIUM-1)
- Fix: `fenceLanguage` = `/^[ \t]*([^ \t]*)/.exec(info)![1].trimEnd()` (trim the first WORD's trailing whitespace, not the whole info string); the e2e `typeOf` uses the same rule. Round 2's `info.trimEnd()` left `ds-counter<U+3000>` as the token in `ds-counter<U+3000> extra`, so that block (an Obsidian block that saved on develop) got a language no panel could find: the pin stamped an anchor but the panel was 'unavailable' and its write did not land. Doc comment rewritten.
- e2eIntegrity open-line table now has an EXPECTED-language column for every row (new rows: `ds-x  extra`, `ds-x<U+3000> extra`, `ds-x<NBSP><tab>x`, `ds-x<NBSP>x`); host `parseOpenFenceLine`, anchor `fenceAlias(matchFenceLine().rest)` and e2e `typeOf` must each EQUAL it (agreement alone masked two bugs). `scanFenceState` expectations added in `schemaSuggest.test.ts` (`ds-counter  extra`, `ds-counter<U+3000> extra`).
- Pin-path tests: `registration.test.ts` (host `getBlockInfo().language` -> `requestPinToSidebar`: no Notice, anchor stamped, panel holds `alias: ds-counter` and the stamped id, opening line unchanged; three openers) and `sidebarBlockHost.test.ts` (the pinned block resolves by anchor and `replaceSource` lands with the opening line verbatim; same three openers). With the round-2 code these fail (6 failures, `run8/jest-old.log`; run8 also holds a partial battery on the old base `0ce76dd`, superseded).
- Rebase onto `1c271b5` (SC-470, G-S15): the only conflicts were in `visual-harness/obsidian-lifecycle.mjs`; resolved by applying my net lifecycle diff (+80 lines, 0 deletions vs base) once in the first commit and taking the branch side for the later lifecycle hunks. G-S13 and G-S15 are byte-identical to `origin/develop` (net diff against base is only my additions). One intermediate commit became empty and was dropped; per-file diffstat of the branch is unchanged. Superproject rebased onto `7e48d25`, still one CHANGELOG-only commit.
- Out of scope, untouched: SC-477, SC-480, SC-481.

### Fix round 3 gates (final head), logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run9/`
tsc.log clean; lint.log clean; jest.log 5495 passed / 1 skipped / 232 of 233; lifecycle.log `done: 31/31 ok, 0 failed`; e2e.log `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots.log 0 FAIL, 572 PNGs; freeze.log `freeze OK (276/276 ...)`; parity.log `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Fix round 4 (re-review r4 MEDIUM-1)
- Rule, stated once (doc comment in `blockPrefix.ts`): skip leading spaces and tabs only; the name then ends at the first whitespace character of any kind. Implementation: `token = /^[ \t]*([^ \t]*)/.exec(info)![1]; name = /^\s*\S*/.exec(token)![0]`, then `''` if `name` is whitespace only. The last step is an addition to the prescribed two lines: without it a bare fence whose remainder is only a CR or no-break space (```` ```\r ````, which the e2e scanner sees because it keeps CRs) would get that whitespace as its language, and the table row `['```\r', '']` failed. The e2e `typeOf` uses the same rule written separately.
- A leading no-break space / U+3000 / FF / VT is still part of the name (`\u00a0ds-x`, not claimed), as the table rows expect; `ds-x<NBSP>x`, `ds-x x`, `ds-x  x`, `ds-x<NBSP><NBSP>x`, `ds-x<U+3000>x` now expect `ds-x`.
- Pins: e2eIntegrity expected-language table (new rows above), `blockPrefix.test.ts` (name ends at NBSP/U+3000/FF/VT/space/tab + `x`, host and anchor), `schemaSuggest.test.ts` (`scanFenceState` for `ds-counter<NBSP>x`), `reading-mode-host-spaced-fence.test.ts` (section-gone durable write for `ds-counter<NBSP>x`), and the Live Preview pin path: `registration.test.ts` (`ds-counter<NBSP>x` and `ds-counter x`: host language -> `requestPinToSidebar` -> anchor stamped, panel holds `alias: ds-counter` + id) and `sidebarBlockHost.test.ts` (anchored write lands, opening line verbatim). Against the round-3 `fenceLanguage` (c290e89) 9 of these fail (`run10/jest-old.log`: registration, sidebarBlockHost, e2eIntegrity, 4 blockPrefix rows, reading-mode host, scanFenceState).
- Rebased dse onto `bc4a0c5` (SC-362) and the superproject onto `72e548c`, no conflicts; `G-S13` and `G-S15` unchanged (lifecycle diff vs base is still +80 lines, 0 deletions). One CHANGELOG-only superproject commit.
- Out of scope, untouched: SC-487 (zero-width space), SC-477, SC-480, SC-481.

### Fix round 4 gates (final head), logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run11/`
tsc.log clean; lint.log clean; jest.log 5536 passed / 1 skipped / 233 of 234 suites; lifecycle.log `done: 31/31 ok, 0 failed`; e2e.log `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots.log 0 FAIL, 580 PNGs; freeze.log `freeze OK (280/280 ...)`; parity.log `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. `run10/` = focused runs and the round-3-code probe, plus a partial battery on base `08206e3` (superseded).
