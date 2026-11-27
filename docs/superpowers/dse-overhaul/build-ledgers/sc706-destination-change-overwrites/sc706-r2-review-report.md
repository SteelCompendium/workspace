# SC-706 r2 independent adversarial review

**Executive summary**
- **Verdict: FIX REQUIRED.** Review head dse `6961239e` (superproject `0e32b647`), base `e783b068`; `origin/develop` still `e783b068`. Branch left exactly at the review head (plugin tree clean; superproject only ` M draw-steel-elements`, the unstaged pointer, as found).
- Counts: CRITICAL 0 · **HIGH 1** · **MEDIUM 1** · LOW 2 · INFO 5.
- Gates measured here: tsc (incl. `-p e2e`) rc 0, lint rc 0 · jest `Tests: 2 skipped, 15003 passed, 15005 total` (fresh, 321/322 suites) rc 0 · e2e full `OBSIDIAN-E2E done: 932/952 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` rc 0 · e2e `--element=sync` `87/98 ok, 0 failed, 11 known-bug` rc 0 · styles.css sha256 `50436d6b…e37e98`, identical to a clean `e783b068` build · lifecycle not re-run: no lifecycle scenario covers compendium sync, r1's 64/64 stands **unverified**.
- The integrity probes the brief lists pass. A user note in the new folder survives "Keep everything", Escape, an empty folder and an absent folder. Same-root re-sync still updates in place. Old-root hand edits are unchanged from base. Both D1 halves are killed by jest and by the e2e sync suite.
- **H1 (regression):** a user who renames or moves the compendium folder in Obsidian and points the Destination at the new name now gets the "Existing compendium folder found" window on their own compendium (with its trash button). After that, every file the release changed is skipped as "your changes", on every later sync too. Base updated them. Measured (probe, base vs head).
- **M1:** a migration into a changed Destination never adopts the moved files, because `reconcile` keys adoption on the stale manifest root. The next sync skips them all, so they stay at legacy content for good. D1(b) now routes users into this offer automatically. In the common case base updated them, by accident.
- Both fixes are small. H1: a differing file at the new root whose hash equals the old manifest's recorded hash is the plugin's own bytes, so it is updated. This refines D1(a)'s wording and needs an owner ruling. M1: re-key the manifest to the migration's root when the migration itself adopts.
- LOW: both CHANGELOGs say the old folder's files "are not removed". Phase 2 still trashes the ones the release dropped. The sync docs still say the window is for a folder "never synced by this plugin".

## Context checked

- Ledger D1–D4 read and applied as the spec. D1(a), quoted: "a differing file at `<options.root>/<rel>` counts as 'we installed it' only when the old manifest's root IS `options.root` (normalized compare)". D1(b), quoted: "a manifest whose root differs from the current Destination is treated exactly like 'no manifest' for the first-sync check of the NEW folder". D2: reuse `LegacyCompendiumModal` unchanged.
- Diff `e783b068..6961239e`: `main.ts` +6/−2, `src/data/CompendiumSyncService.ts` +7/−1, tests, CHANGELOG. `LegacyCompendiumModal` is untouched (D2 holds). No other marker moved; e2e known-bug went 21 → 20 (D4 holds).
- Out of scope per brief (not reported): SC-694, SC-695, SC-698, SC-702, SC-653 wording, SC-708 (old folder left behind; A→B→A skip).

## Findings

### HIGH

**H1. A renamed or moved compendium folder stops updating forever, and is offered for the trash first.**
`src/data/CompendiumSyncService.ts:192-193,220` (D1(a)) together with `main.ts:768-770` (D1(b)).

- **Scenario.**
  1. The user syncs 7.0.0 into `DS Compendium`.
  2. They rename the folder to `Compendium` in Obsidian (a plain folder rename; the plugin does not follow renames, since nothing in `main.ts`/`src` listens for it on the Destination setting).
  3. They set Destination to `Compendium` and sync a newer release.
- **What happens on head.**
  - (b) sees a manifest for `DS Compendium` and a non-empty `Compendium`, so "Existing compendium folder found" opens with "Move old compendium to trash" offered on the user's live compendium.
  - On "Keep everything", (a) skips every file the release changed: they differ from the incoming bytes and `installedHere` is false. The Notice counts them under "skipped to protect your changes".
  - The new manifest (root `Compendium`) lists only the unchanged and created files, so the skipped ones stay out of it.
  - Every later sync skips them again. The compendium is frozen at the old release for those files, and the only way out is deleting them by hand.
- **Measured.** Probe `sc706r2Probe2.test.ts` "PROBE rename", on head:
  - first sync: `updated=[] skipped=["class/shadow.md"] shadow="shadow A" manifestFiles=["kit/panther.md"]`;
  - second sync: `updated=[] skipped=["class/shadow.md"]`.
  - The same probe on `e783b068`: `updated=["class/shadow.md"] … shadow="shadow B"`, then `shadow="shadow C"`.
  - A regression against base.
- **Why it is not SC-708.** SC-708 is the old folder left behind and A→B→A. This is a one-way move of the compendium itself: the most ordinary way a user "changes the Destination folder" while keeping their compendium. The skip half of SC-708 has the same root cause, and the fix below cures both.
- **Prescribed fix (owner ruling needed: it refines D1(a)'s literal wording).**
  - In Phase 1, when `!installedHere`, treat a differing existing file as installed by the plugin iff `currentHash === oldManifest.files[rel]`, then `modifyBinary` as today. Such a file holds exactly the bytes the plugin wrote for that rel (a moved or renamed install), so updating it overwrites nothing the user wrote.
  - A user's own note at that path (the SC-706 case) has a different hash and stays skipped. A user-edited moved file stays skipped too, which is safer than the same-root SC-694 rule.
  - The window (D2) can stay as is; its wording ("Existing compendium folder found") is accurate for a moved compendium.
  - Tests to add:
    - jest service: renamed folder, unedited file, upstream changed → `updated`;
    - jest service: renamed folder, user-edited file → skipped;
    - e2e: rename the folder through `fileManager.renameFile`, set Destination, Keep everything, assert the changed file updated and the Notice count.
  - The SC-706 tests should stay green as written: their colliding note is the user's own text, not the plugin's bytes.

### MEDIUM

**M1. A migration into a changed Destination never adopts the moved files, so the next sync skips them as user content forever.**
`src/data/CompendiumMigration.ts:677` (`effectiveRoot = existing?.root ?? state.root ?? root`), reached through `:521-523` (`adopt` → `reconcile(plan.root)`), now routed to by `main.ts:770`.

- **Scenario.**
  1. A 7.0.0 sync into `Old Root` (manifest root `Old Root`).
  2. The Destination is set to a folder holding a pre-7.0.0 compendium. Probe 5 of the brief: D1(b) now offers the migration, as intended.
  3. The user runs it. The files move to their 7.0.0 paths under the new folder; `state.root` is the new folder.
  4. `reconcile` adopts against the MANIFEST's root (`Old Root`). When `Old Root`'s manifest already lists the same rels (the normal case: it is the same compendium), it adds nothing. Otherwise it hashes `Old Root/<rel>` files.
  5. The manifest stays rooted at `Old Root`, and the moved files are never claimed.
- **Next sync.** `manifestHere` is false, so the window opens. On Keep everything, `installedHere` is false, so every moved file (legacy content, which differs from upstream) lands in `skippedConflicts`. The saved manifest (root = new folder) has `files=[]` for them, so it repeats forever. This is exactly the "freezing them at legacy content forever" failure `reconcile`'s own doc comment exists to prevent.
- **Measured.** Probe `sc706r2Probe.test.ts`:
  - head, both variants: `skipped=["career/disciple.md","career/sage.md"] … disciple="disciple text"`;
  - base, same-rels variant: `updated=[…]`, `disciple="NEW disciple text"` (it worked by accident, through the old-root manifest entries that SC-706 removes);
  - base, other-rels variant: skipped too (a latent bug, made reachable on a common path by D1(b)).
- **Prescribed fix.** When the migration run itself adopts (`execute`'s `adopt()`, and the `reconcile` at `:491`), re-key the manifest to `plan.root` when its root differs (normalized): start `files` from `{}` (the old root's entries describe another folder), keep the old `releaseTag` / `migrated:` tag logic, set `root: plan.root`, then adopt `state.migrated`.
  - Do NOT change the `reconcile(options.root)` at the start of `syncCompendium`. If it re-keyed to `state.root`, a later Destination change would be pulled back to the migrated folder.
  - Turn the probe into a jest test (two variants) in `compendiumMigration.test.ts` under "the handoff to the sync engine". Ideally add one e2e: changed Destination → legacy folder → run migration → sync → files updated.

### LOW

**L1. Both CHANGELOG entries say the old folder's files "are not removed". Phase 2 still trashes the ones the new release dropped.**
`draw-steel-elements/CHANGELOG.md:27`; superproject `CHANGELOG.md:13`.

- `applySync` Phase 2 resolves old-manifest files absent upstream against `oldManifest.root` and trashes the unmodified ones. Probe "PROBE-OLDROOT": `trashed=["rule/turn.md"]` from `DS Compendium` after a sync into `Notes`. The r1 report's own Follow-up 1 says the same.
- Fix: "The compendium files in the folder you moved away from stay where they are, except files the new release no longer has, which go to the trash as before."

**L2. `docs/compendium-sync.md:61-63` ("First sync into an existing folder") still says the window appears when the folder "has never been synced by this plugin".**

- It now also appears after a Destination change (including back to a folder synced before). The page says nothing about changing or moving the Destination.
- Fix: one sentence there ("…or when you have changed the Destination folder since the last sync"). Once H1 is settled, add a line on moving or renaming the compendium folder.

### INFO

- **I1. Mutation coverage holds, but K12 alone is green under "only (b)"** (see the table). The e2e SUITE catches it (SYNC-D11 times out on its "0 updated" Notice), and jest catches it in three places. This matches K12's stated criterion ("asked first, or wrote nothing"), and SC-441 r5 records the same split (`sc706partial`). No change asked.
- **I2. The root compare uses Obsidian's `normalizePath`, while `options.root` comes from `classifyDestinationPath`, which trims and resolves `.`/`..`.**
  - The jest mock also strips a leading `./`; real Obsidian does not (per the comment in `CompendiumDestination.ts`).
  - A manifest root like ` DS Compendium`, `./DS Compendium` or `a/../DS Compendium` would read as "another folder".
  - It is unreachable from rc builds: every manifest writer uses the resolved root, and SC-643 is in `7.0.0-rc.1`.
  - Optional hardening: compare `classifyDestinationPath(x).path` on both sides at `main.ts:768-769` and `CompendiumSyncService.ts:192-193`, so there is one rule.
- **I3. A case-only Destination change (`DS Compendium` → `ds compendium`) on a case-insensitive FS behaves as before the fix.** `getAbstractFileByPath` misses, there is no window, and `createBinary` collides. The fix does not change this, and it cannot be measured on this Linux host.
- **I4. For the SC-653 relay (D2, accepted).** Pointing the Destination at a PARENT of the old folder (`Notes/DS Compendium` → `Notes`) now opens the window, and its "Move old compendium to trash" would trash `Notes` with all the user's notes. That is the general SC-653 exposure, made reachable here by D1(b). Worth naming in the SC-653 note.
- **I5. A manifest with no string `root` (corrupt; `ManifestStore.load` does not validate it, ledger O3) now goes down the H1 path:** window, then differing files skipped forever, where base updated them. It is not reachable from any writer. H1's hash rule would cover it too.

## Integrity probes (brief §2)

| # | Probe | Result | Evidence |
|---|---|---|---|
| 1 | User note in new folder survives: window → Keep everything | ✔ bytes kept, reported skipped | e2e SYNC-D11 ✓ (full + sync runs); jest harness "Keep everything…" |
| 1 | window → Escape / dismissed | ✔ tree unchanged | e2e SYNC-K12 ✓ (`t.expectChange({})` before and after Escape) |
| 1 | empty new folder | ✔ syncs, no window | e2e SYNC-D12 ✓; jest |
| 1 | absent new folder | ✔ syncs, no window | jest `syncCompendiumDestination` "does not exist yet" |
| 2 | Same-root re-sync updates in place | ✔ | jest "root unchanged → updated in place"; the 87 non-known-bug sync e2e green |
| 3 | Hand-edited managed file under the OLD root after a change | ✔ unchanged from base: edited files untouched; edited and dropped upstream → `keptModified`; unedited and dropped → trashed (see L1) | probe "PROBE-OLDROOT", identical on head and base |
| 4 | trailing `/`, `//` | ✔ same root | jest test.each (service) + routing test |
| 4 | leading `/` | ✔ (`normalizePath` strips it, real and mock) | reasoned |
| 4 | `./`, spaces, `..`, case | INFO I2 / I3 | reasoned; not reachable from rc manifests |
| 4 | new root a subfolder (`DS Compendium` → `DS Compendium/sub`) | ✔ absent → plain sync into it; old files Phase-2-handled | reasoned from code |
| 4 | new root a parent (`Notes/DS Compendium` → `Notes`) | window (with SC-653 trash) → INFO I4 | reasoned from code |
| 4 | moved / renamed compendium folder | ✘ **H1** | probe "PROBE rename" head vs base |
| 4 | back to the original after an intermediate sync | SC-708 (not re-reported) | — |
| 5 | changed root + legacy folder → migration offer | ✔ offer opens, not a sync | jest "the changed-Destination window follows the first-sync migration offer" |
| 5 | …then the migration's handoff to the sync | ✘ **M1** | probe `sc706r2Probe.test.ts` head vs base |
| 5 | `migrationPending` with a changed root | behaviour as base: the offer for the new folder, or `markSettled(new)` then (now) the window instead of a straight sync. The pending state belongs to the old folder but is settled by the new one; that is pre-existing (base takes the same branch) and not made worse | reasoned from `main.ts:770-797` |
| 6 | Window callback `latest.root !== options.root` | ✔ still right: `options.root` is the new folder the window names, both are resolver output; busy-lock order unchanged (prelude token released in `finally`, callback takes its own token before trash/sync) | code read `main.ts:819-858` |

## Mutation table

Jest = the six sync and migration files (175 tests; HEAD copy 175/175 green). E2E = `--only=SYNC-K12,SYNC-D11,SYNC-D12`, run from a scratch copy built from the mutant.

| Mutant | Change | jest | e2e K12 | e2e D11 | e2e D12 |
|---|---|---|---|---|---|
| M-a "only (b)" | `CompendiumSyncService.ts` back to `e783b068` | **killed, 3 failed**: service "root changed + DIFFERING", "no usable root", harness "Keep everything" | passes (by its criterion, I1) | **FAIL** (Notice "0 updated" timed out) | passes |
| M-b "only (a)" | `main.ts` back to `e783b068` | **killed, 6 failed**: routing ×3, harness ×3 | **FAIL** (window timed out) | **FAIL** | passes |
| M-b2 | only the inner arm `if (manifestHere)` → `if (manifest !== null)` | **killed, 4 failed** | not run | not run | not run |

No mutant survives the suites. D12 is green under both mutants by design (an empty folder needs neither half).

## Gates (measured by this review)

| Gate | Result |
|---|---|
| `npm run tsc` (both projects) | rc 0, clean |
| `npm run lint` | rc 0, clean (only the known `.eslintignore` warning) |
| `npx jest` (fresh, `main.js`/`styles.css` removed first) | `Test Suites: 1 skipped, 321 passed, 321 of 322 total` · `Tests: 2 skipped, 15003 passed, 15005 total` · rc 0 |
| `npm run e2e` (full) | `OBSIDIAN-E2E done: 932/952 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · rc 0 |
| `npm run e2e -- --element=sync` | `OBSIDIAN-E2E done: 87/98 ok, 0 failed, 11 known-bug, coverage: 59/540 pairs (partial run: gate skipped)` · rc 0 |
| lifecycle | not run: no scenario covers compendium sync; r1's 64/64 is **unverified** |
| styles.css | head (worktree, rebuilt by e2e) and a clean `e783b068` build both `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` |

r1's numbers match on every gate re-run.

## Working tree

- Before and after: plugin `git status --porcelain` empty, HEAD `6961239e`.
- Superproject ` M draw-steel-elements` (pre-existing unstaged pointer), HEAD `0e32b647`.
- Gitignored artifacts touched by the gates: `main.js` and `styles.css` were removed before jest and rebuilt by e2e (sha identical to base); new run dirs under `e2e/.out/`.
- Every probe and mutant ran in scratch `git archive` copies, never in the worktree.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r2-review/`:

- **Gate scripts:** `r2-gate-static.sh`, `r2-gate-e2e.sh`, `r2-mut-jest.sh`, `r2-mut-e2e.sh`, `r2-probe1.sh`, `r2-probe2.sh`.
- **Gate logs:** `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-static-rc.txt`, `r2-e2e-full.log`, `r2-e2e-sync.log`, `r2-e2e-rc.txt`, `r2-basebuild.log`, `r2-styles-sha.txt`.
- **H1 / probe-3 probe:**
  - test file `copy/test/unit/data/sc706r2Probe2.test.ts` (same file in `base/`);
  - logs `r2-probe-rename-head.log`, `r2-probe-rename-base.log`, `r2-probe2-rc.txt`.
- **M1 probe:**
  - test file `copy/test/unit/data/sc706r2Probe.test.ts` (same file in `base/`);
  - logs `r2-probe-migration-head.log`, `r2-probe-migration-base.log`, `r2-probe1-rc.txt`.
- **Mutants:**
  - source trees `mut-ma/`, `mut-mb/`, `mut-mb2/`;
  - jest logs `r2-mut-jest-{copy,mut-ma,mut-mb,mut-mb2}.log`, `r2-mut-jest-rc.txt`;
  - e2e logs `r2-mut-e2e-mut-ma.log`, `r2-mut-e2e-mut-mb.log`, `r2-mut-e2e-rc.txt`;
  - e2e failure bundles under `mut-ma/e2e/.out/20261127-095531-0ee3/SYNC-D11` and `mut-mb/e2e/.out/20261127-095556-57fd/`.
