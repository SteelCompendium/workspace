# SC-443 r4a review (scope A: items 1-7, 11, 12, 13) — branch `sc443-e2e-editor-insert` @ `6c5a073c`

## Executive summary
- **Verdict (scope A): NOT LAND-READY.** The base moved while this review ran. **SC-679 landed on dse develop `8c08bce2`** (workspace origin/main `6df665fd` bumps to it). I rebased the branch in a scratch worktree, with no conflicts. After the rebase, 4 tests go red: the SC-679 markers e2e AUTH-G13, AUTH-G14, AUTH-K09 ("appears fixed") and jsdom `authoringKnownBugs.test.ts:114`. The ledger says "whichever lands second flips them", and that is now SC-443. All other tests stay green on the rebased head.
- **Findings:** 0 CRITICAL / 1 HIGH / 0 MEDIUM / 4 LOW / 9 INFO. **New product bugs: 0 confirmed, 1 candidate (Low):** a right-click or middle-click on a compendium search row inserts the reference block. This is Obsidian's chooser `auxclick` reaching our `onChooseSuggestion`; the owner decides whether to file it.
- **The parts of scope A that hold at `6c5a073c`:**
  - The `src/` diff is the 3 `stampControl` attribute lines only.
  - All 4 paths have a round trip in both Live Preview and Source mode that checks the exact bytes.
  - 12 handler mutants, plus 3 gate-leak mutants, each turn a plain e2e test red. The one exception is the Shift routing on the snapshot command, which only jsdom catches (L-2).
  - Both censuses go red for an un-id'd button with a listener on all 3 surfaces (CENSUS-30..34 and jsdom).
  - No id collisions. All 8 sampled tests pass alone. No tracked vault file is written. Shared files: only additive edits.
- **Gates at `6c5a073c`:**
  - tsc (incl. `-p e2e`) rc 0; lint rc 0.
  - jest `14185 passed / 4 skipped` (14189), rc 0, 157 s, loadavg 23.1→26.2. The 2 extra skips are token-coverage's workspace-map tests: my scratch worktree sits outside the workspace. 14185 + 2 = the implementer's 14187.
  - Full e2e `OBSIDIAN-E2E done: 739/747 ok, 0 failed, 8 known-bug, coverage: 464/464 pairs`, rc 0, wall 487 s, loadavg 7.4 at start and 8.5 at end (about 33 at the peak).
- **On the rebased head (`8c08bce2` + 8 commits):** jest authoring + census `910 passed, 1 failed`; e2e `--element=authoring` `71/74 ok, 3 failed, 0 known-bug`.
- **Fix round needed (tests only):**
  1. Rebase onto `8c08bce2` and turn the 4 SC-679 markers into plain tests (H-1).
  2. Optionally fold L-1..L-4.
  3. Re-run the full battery. The superproject goes onto `6df665fd` with one pointer bump.

## Findings

### HIGH

**H-1. SC-679 landed on develop, so the branch's 4 SC-679 markers fail once it is rebased.**
- **Where:**
  - `e2e/specs/authoring/gate-on.e2e.ts:98-101` (AUTH-G13) and `:103-110` (AUTH-G14).
  - `e2e/specs/authoring/schema-suggest.e2e.ts:111-123` (AUTH-K09).
  - `test/dom/authoring/authoringKnownBugs.test.ts:113-114` (`test.failing`).
  - The workaround comment and `setCursor` at `gate-on.e2e.ts:58-59`.
- **Failure scenario:** dse `origin/develop` is `8c08bce2`, not the `d582e7ff` the dispatch named. Seven SC-679 commits landed (`35f3a682`..`8c08bce2`):
  - `schemaSuggest.ts selectSuggestion` now calls `setCursor` behind the value and `this.close()`.
  - The test mock gains `EditorSuggest.close()`.
  - Workspace `6df665fd` bumps the pointer to it.

  The branch's merge base is `d582e7ff`. On the CI e2e job, or after any rebase, the 3 e2e markers fail with "known bug SC-679 appears fixed - remove the marker". The jest marker fails with "Failing test passed even though it was supposed to fail".
- **Probe:**
  - `git rebase 8c08bce2` of a detached copy of `6c5a073c` went through with no conflicts. The `src/` diff is still the 3 attribute edits.
  - jest `test/dom/authoring test/dom/e2eCensus.test.ts`: `1 failed, 910 passed`. Only the SC-679 `test.failing` fails (`r4a-rebase-jest.log`).
  - e2e `--element=authoring`: `71/74 ok, 3 failed`. The 3 failures are exactly AUTH-G13, AUTH-G14 and AUTH-K09 (`r4a-e2e-rebase-auth.log`).
  - Every other AUTH and CENSUS test is green with the new `close()`. This includes `closeList()`, whose 1 s wait for a re-opened list simply times out now.
- **Fix:**
  1. Rebase onto `8c08bce2`.
  2. Make G13 / K09 / the jsdom test plain tests that pin the cursor: G13 `{line:1, ch:13}`, K09 `{line:1, ch:11}`, jsdom `{line:1, ch:13}`.
  3. Make G14 a plain test that pins the exact note: `'```ds-roll\nmode: opposed\n\n```\n'` after Escape and Enter.
  4. Drop the SC-679 comment and the `setCursor` at `gate-on.e2e.ts:58-59`, or keep the cursor move without the bug citation. Remove `failsWith`.
  5. Expected after the flip: known-bug count 8 → 5, ok +3.
  6. Superproject: one pointer bump on `6df665fd`.

### LOW

**L-1. The authoring specs have no throwing network guard, though the manifest comment says they do.**
- **Where:** `e2e/manifest/authoring-search.ts:8` and `:17-18` ("with the page-side `requestUrlFn` stubbed to throw", "the stub that throws unless a test installs its own"). `e2e/specs/authoring/compendium-search.e2e.ts:182-195` and `:202-213` install only `releaseStub` (from `settingsDrive.ts:107`), which records the request and never answers. The throwing guard exists only in `driver/settings.ts:42` (`openSettings`), which no authoring spec calls.
- **Failure scenario:** a future authoring test that reaches Sync without `releaseStub.install()` sends a real request to `api.github.com`, and the run stays green until some later assertion fails.
- **Probe:** I removed `releaseStub.install()` from AUTH-C10 (mutant N1, `mut-batch3.diff`).
  - The page showed the real "Draw Steel Elements: resolving compendium release…" Notice (`evidence/mut3-AUTH-C10/events.json`). The request went out.
  - C10 then failed only because `window.__stubCalls` was undefined.
  - This is the same gap as SC-440 r2 L-1. The ruling's "stub that throws unless a test installs its own" is not met for this surface.
- **Fix:** in `openEditor` (`driver/authoring.ts:39`), after `dse.openNote`, install the same guard as `settings.ts:42`: throw unless `__e2eStubbed`. Or export that one-liner from `settings.ts` and call it. Correct the manifest comment to match.

**L-2. AUTH-C09's title says "a Shift-click or Ctrl-click", but only Ctrl is driven. No e2e test pins that the snapshot command ignores Shift.**
- **Where:** `e2e/specs/authoring/compendium-search.e2e.ts:161-173`. Line 165 sends only `modifierClick(0, 'Control')`.
- **Failure scenario:** a regression that sends Shift on the snapshot command to the inline link (or to a reference block) passes the whole e2e suite.
- **Probe:** mutant M12 (`mut-m12.diff`): the snapshot command's `onChoose` does `evt.shiftKey ? insertInlineLink(...) : dispatchBlockChoice(...)`.
  - e2e AUTH-C07, C08, C09 stayed `3/3 ok` (`r4a-e2e-m12.log`).
  - jsdom caught it (`compendiumInsertMatrix` "the snapshot command ignores it": 1 failed, `r4a-jest-m12.log`).
- **Fix:** add a Shift-click drive to C09 on a second note, or a C12, asserting the snapshot bytes. Otherwise retitle C09 to say Ctrl only.

**L-3. The in-fence autocomplete round trip (AUTH-K01, AUTH-K02) has no screen assertion, the ruling's (f).**
- **Where:** `e2e/specs/authoring/schema-suggest.e2e.ts:16-37`.
- **Failure scenario:** the other three paths end on "the block draws as a DSE element, not an error card". The key path ends on bytes and the cursor only. Measured: right after a key accept the block is an error card ("Stamina bar: failed to render (schema) … type: must be object", `probe-results/REVA-P04.json`). That is expected, because the accept adds no `: ` (ledger, phase A: a rough edge with no marker). So the round trip as written cannot assert (f) at all.
- **Fix:** in K01 (Live Preview) and K02 (Source), after the accept type `: 20` (`: 30` for `max_stamina`). Then assert the note bytes and that the block draws as `stamina-bar` with no error: leave the block in Live Preview (put the cursor on the `after` line; `leaveBlock` puts it on line 0, the fence) and use Reading view in Source mode.

**L-4. A real interaction that reaches our handler is missing from the manifest: a middle-click or right-click on a search row.**
- **Where:** `e2e/manifest/authoring-search.ts:25` (`authoring.search.result`: `click`, `click:Shift`, `click:Control`) and `:26` (`authoring.search.sync`).
- **Failure scenario:** Obsidian 1.14.4's chooser binds `auxclick` on `.suggestion-item` to `onSuggestionClick → useSelectedItem → chooser.selectSuggestion(value, evt)` (app.js, the `t.on("auxclick",".suggestion-item",…)` next to the click delegation). For the search window that is our `onChooseSuggestion`.
- **Probe (real Obsidian, `probe-results/REVA-P02.json`, `REVA-P03.json`):**
  - A middle-click on the Panther kit row with the reference command wrote `` ```ds-scc\nmcdm.heroes.v1/kit/panther\n``` `` and closed the window.
  - A **right-click** did the same.
  - In the `/ds` list a middle-click dismissed the list and wrote nothing (`REVA-P01.json`); in the key list it did nothing (`REVA-P04.json`). So no pair is missing there.
- **Fix:** owner's call.
  - If it stays as is, add an `auxclick` kind (or `click:Middle`) to `authoring.search.result` with one plain driver asserting the note.
  - If the candidate product bug below is filed, a marker for the right-click instead.

### INFO

- **I-1. The `src/` diff is behaviour-neutral (item 2).** `git diff d582e7ff 6c5a073c -- src` touches 3 files (`CompendiumSearchModal.ts:11,107-108,140-142`, `schemaSuggest.ts:37,121-122`, `suggest.ts:7,59-60`): imports, comments and `stampControl` calls. `stampControl` is `el.setAttribute(...)` only (`src/framework/kit/controlId.ts:14-16`). `isSyncCtaEntry` is pure. Lifecycle, shots, freeze and parity were not re-run: attributes are not in any print path, and the implementer's numbers equal the baseline.
- **I-2. Breaking the gate restore turns nothing red (item 6).** I removed `after(() => dse.setPrefs({}))` from `gate-on.e2e.ts:19-21` and `census.e2e.ts:88-90` (in batch 1). Every test not hit by a mutant stayed green, including CENSUS-30..34, G11 and G12. Each spec file is its own wdio session, and `driver/session.ts:20-22` refuses a session that starts with the gate on. Within those two files the gate-on describe is last. This is the same structure as SC-440 r2 I-2; nothing to fix.
- **I-3. Gate OFF bites (item 6).**
  - **M9** (deferred elements leak into `/ds` with the gate off): S01, S05 (and S04, S06, S07) and CENSUS-30 went red.
  - **M10** (`insert-hero` plus the 8 deferred commands registered with the gate off): I22 (+9 commands) and G12 (24, contains `insert-hero`) went red.
  - **M11** (deferred schema keys with the gate off): K08 went red (`r4a-e2e-mut2.log`).
  - Gate on: G01..G08 cover the deferred inserts, G09 the `/ds` pick, G10 the enum value list.
- **I-4. The real census is listener-based (item 4).**
  - An un-id'd `<button>` **with** a click listener in a `/ds` row, a key / value row and the search window made CENSUS-30, 31, 32, 33 (`r4a-e2e-mut3.log`) and CENSUS-34 (`r4a-e2e-mut3b.log`) red, and made 4 jsdom census tests red (`r4a-jest-census3.log`).
  - A **listener-less** button is invisible to CENSUS-30..34 (`5/5 ok`, `r4a-e2e-mut4.log`). jsdom still goes red (4 failed, `r4a-jest-census4.log`). This is the develop census design.
  - The host allowlist (`census.e2e.ts:24`, `^(suggestion-container|suggestion|prompt-results|search-input-clear-button)(\s|$)` with no id) cannot match a node we draw: our rows are `suggestion-item …`, and our inner nodes are `dse-*`.
- **I-5. A red CENSUS-32 or CENSUS-33 hides CENSUS-34.** The two tests press Escape only after their assertions (`census.e2e.ts:71`, `:80`). A failing one leaves the search window open; the gate-on `before` (`setPrefs` → `closeModals`) then times out, and CENSUS-34 reports "did not run" (`r4a-e2e-mut3.log:77-90`). The run is still red. Optional: an `escapePrompts()` in the `before`.
- **I-6. Other list keys not in the manifest.** The chooser also registers Home, End, PageUp, PageDown, Ctrl+N and Ctrl+P. They only move the selection and never reach our code, like the arrows. `authoring.schema.key` declares no `press:ArrowUp` while `authoring.ds.item` does (`authoring-schema-suggest.ts:23`). The Cmd (`metaKey`) route of `dispatchReferenceChoice` (`compendiumInsert.ts:318`) is covered in jsdom only. All optional.
- **I-7. Weak spots that are acceptable.**
  - AUTH-C02 and AUTH-C08 (Source mode compendium) do not assert the cursor; the code sets none (`replaceSelection`; C01 pins the Live Preview cursor).
  - AUTH-S08 checks only "no `` ```ds- ``" after Tab.
  - `driver/authoring.ts:160`'s `waitUntil(… length >= 0)` is always true. It is harmless, because the settle loop follows.
- **I-8. Fixture and vault hygiene (item 7).** The compendium is copied at run time by `installCompendium` (`driver/authoring.ts:312`) and the destination folder is deleted at each `openEditor` (`:44-47`). After the full run, `git status --porcelain` of the gate worktree was empty, so `e2e/vaults/**` and `plugin-data.shipped.json` were not written.
- **I-9. Shared files and ids (items 11, 12).**
  - Shared files: no existing `e2e/driver/*` file, `_census.e2e.ts`, `host/` or `livePreviewFocusCarry.ts` changed. `e2e/README.md` gains +1 line. `e2eCensus.test.ts` is additive (imports + one describe; `setExperimental` is restored in `finally`). No `allowPageErrors` / `allowedErrors` anywhere on the branch.
  - Ids: 69 unique `[AUTH-*]` plus CENSUS-30..34, with no duplicates. None appears on develop `8c08bce2`, sc442 `ed7130d9` (CENSUS-18 and 19 only) or sc679 `1412820d`. The sc679 worktree is gone, now landed. Titles hold literal ids, with no bracketed ticket id.
  - Alone: `--only=AUTH-I25,AUTH-S04,AUTH-K02,AUTH-C05,AUTH-G10,AUTH-C10,CENSUS-32,AUTH-I12` gave `8/8 ok` across all 6 spec files.

## Item checks (scope A)

**Item 1 — surface.** The DOM nodes ours to name are the `/ds` row (`authoring.ds.item`), the key row and value row, the search input, the result row and the Sync row: all stamped and all in the manifests. The commands (13 shipped + 2 compendium + 8 gate-on) match `registerInsertCommands` / `registerCompendiumInsertCommands` (`main.ts:587-602`), with `insert-hero` absent. `sync-compendium` and `migrate-compendium-layout` are SC-441's. Real interactions missing: middle-click and right-click on search rows (L-4); selection-only keys (I-6).

**Item 3 — round trips.** Each path has a Live Preview and a Source mode test:

| Path | Live Preview | Source mode | Checks |
|---|---|---|---|
| Insert command | I01..I13 (+I16, I18, I21, I23, I25) | I14, I15 (+I17, I24, I26) | Exact file and editor bytes via `spliced`, cursor, draws with no error card |
| `/ds` | S02 (Enter) | S03 (click), S04, S09 | Exact file with only the token replaced, cursor `{3,0}` / `{2,2}` / `{2,0}`, draws |
| Key autocomplete | K01 (Enter) | K02 (click) | Exact file, cursor; **no screen check (L-3)** |
| Compendium | C01 (Enter, reference), C07 (click, snapshot golden), C03 (Shift, link + cursor) | C02 (click, reference), C08 (Enter, snapshot golden) | Exact file, draws; Source cursor not asserted (I-7) |

No drive asserts only that a window closed. C04, C06, C10 and C11 assert the note unchanged.

**Item 5 — mutants.** Each mutant ran in a scratch worktree. Diffs: `mut-batch1.diff`, `mut-batch2.diff`, `mut-batch3.diff`, `mut-batch4.diff`, `mut-m12.diff`.

| Mutant | What it breaks | Red |
|---|---|---|
| M1 | Scaffold text (`scaffold.ts` +`# M1`) | I01..I18, I20, I21, I23..I26, S02, S03, S04, S09, G01..G09 (I19 undo stays green, as expected) |
| M2 | `/ds` token range (`suggest.ts` `+3`→`+2`) | S02, S03, S09, G09 (a `/` is left behind) |
| M3 | `/ds` fence guard removed | S06, S07 |
| M4 | Key accept writes at `end` (`schemaSuggest.ts`) | K01, K02, K03, G10 |
| M5 | Shift → inline link removed | C03 |
| M6 | SC-149 snapshot filter removed | C07 |
| M7 | `type:` filter ignored | C05 |
| M8 | Sync row does nothing | C10, C11 |
| M9 / M10 / M11 | Gate leaks | See I-3 |
| M12 | Snapshot command routes on Shift | **e2e green**, jsdom red (L-2) |
| Census | Listener button / plain button | See I-4 |

Credits:
- `executeCommandById` is never used to credit (`driver/authoring.ts:136-153` credits `palette` only after Ctrl+P, the name and Enter).
- `pressList` credits the selected row's id (`:230-235`).
- Search keys credit the input, and Sync `press:Enter` only when the Sync row is selected (`:364-368`).
- Every authoring pair has a plain driver (`r4a-auth-coverage.txt`).

## Product bugs

- **Candidate, new, Low (owner decides; host behaviour):** a right-click or middle-click on a compendium search result row inserts the default action and closes the window.
  - **Repro (real Obsidian 1.14.4):**
    1. Run "Insert Draw Steel: compendium reference" with the fixture compendium.
    2. Type `pan`.
    3. Right-click the kit row. The note gets `` ```ds-scc\nmcdm.heroes.v1/kit/panther\n``` `` at the cursor.
    4. Middle-click gives the same result.
  - **Where:** `src/authoring/CompendiumSearchModal.ts:177-186` (`onChooseSuggestion` does not read `evt.button`) and `src/authoring/compendiumInsert.ts:312-325`. Cause: Obsidian's chooser delegates `auxclick` on `.suggestion-item` to `useSelectedItem`.
  - **Not a known ticket.** In the `/ds` and key lists a middle-click does not accept.
  - **Evidence:** `probe-results/REVA-P02.json`, `REVA-P03.json`.
- **No other new bug.** The key-only error card in L-3 is the ledger's "no `: ` after accept" rough edge (phase A), not a new bug.

## Gates and logs
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-rev-r4a/`. The scratch worktrees `wt-gate`, `wt-mut` and `wt-rebase` were removed with `git worktree remove`. The branch worktree is unchanged: dse clean at `6c5a073c`, and the superproject still shows only its pre-existing unstaged ` M draw-steel-elements`.

**Gate runs**

| Gate | Log | Result |
|---|---|---|
| tsc | `r4a-tsc.log` / `.rc` | rc 0 |
| lint | `r4a-lint.log` / `.rc` | rc 0 (only the `.eslintignore` warning) |
| jest | `r4a-jest.log` / `.rc` / `.load-start` / `.load-end` | `Tests: 4 skipped, 14185 passed, 14189 total`; suites 308 passed / 1 skipped; 156.6 s; rc 0; load 23.11 → 26.20 |
| full e2e | `r4a-e2e-full.log` / `.rc` / `.start` / `.end` / `.load-*` | `OBSIDIAN-E2E done: 739/747 ok, 0 failed, 8 known-bug, coverage: 464/464 pairs`; rc 0; 487 s; pointer parked on :200; run `20261123-142031-6049`; coverage copy `evidence/gate-full-coverage.json`, authoring rows in `r4a-auth-coverage.txt` |
| alone sample | `r4a-e2e-alone.log` | `8/8 ok` |

**Rebased onto `8c08bce2` (H-1 evidence)**

| Run | Log | Result |
|---|---|---|
| jest authoring + census | `r4a-rebase-jest.log` | `1 failed, 910 passed` |
| e2e `--element=authoring` | `r4a-e2e-rebase-auth.log` | `71/74 ok, 3 failed` |

Supporting files: `evidence/rebase-AUTH-G13|G14|K09/error.txt`, `evidence/rebase-log.txt`.

**Mutant runs**

| Batch | Log | Result |
|---|---|---|
| batch 1 | `r4a-e2e-mut1.log` | `23/74 ok, 48 failed, 3 known-bug` |
| batch 2 | `r4a-e2e-mut2.log` | `58/74 ok, 13 failed, 3 known-bug` |
| batch 3 (listener census + N1) | `r4a-e2e-mut3.log`, `r4a-e2e-mut3b.log` | `0/6 ok`; CENSUS-34 `0/1` |
| batch 3 jest | `r4a-jest-census3.log` | 4 failed |
| batch 4 (plain button) | `r4a-e2e-mut4.log` | `5/5 ok` |
| batch 4 jest | `r4a-jest-census4.log` | 4 failed |
| M12 | `r4a-e2e-m12.log`, `r4a-jest-m12.log` | e2e `3/3 ok`; jest 1 failed |

Supporting files: `mut-batch*.py`, `mut-*.diff`, `evidence/mut3-AUTH-C10/`.

**Probes**

| Probe | Log | Result |
|---|---|---|
| probe spec | `evidence/probe.e2e.ts`; `r4a-e2e-probe.log`, `r4a-e2e-probe2.log` | `probe-results/REVA-P01..P04.json` |

The first P01 failed on a probe error: `/dsct` also matches Characteristics. It was re-run with `/dsstam`.

Not re-run: lifecycle, shots, freeze and parity (I-1).
