# SC-328 implementation report — round 1

**STATUS: DONE_WITH_CONCERNS**

- Merged 6.0.2 hotfix forward (`b69ec1a`), ported `CompendiumSyncService` to `fflate`
  (`7247053`), added the build gate (`42b8287`), bumped 6.0.1→6.0.2 references (`bb5653a`),
  fixed a merge-fallout test (`e0b4971`), merged develop's SC-241 landing forward
  (`0d4ee5f`, since origin/develop moved mid-round). Final HEAD: `0d4ee5f`.
- tsc clean, lint clean, jest 203/204 suites, 3937 passed/1 skipped/3938 total (baseline
  3925/1/3926 + 12 new: 2 fflate-traversal tests, 5 build-gate-detector tests, 5 SC-241's
  own tests). `npm run build` and `npm run build-no-check` both exit 0 with the gate
  passing (0 `createElement("script")` hits); pre-change tree (`0c132d8`) proven to fail
  the same gate with 4 hits (JSZip's polyfills).
- `npm run shots`: 524 PNGs, 0 FAIL, deterministic across 3 independent regenerations.
- **`check-freeze.sh`: 16 checksum mismatches, NOT touched** — all 8 skills-family
  twin+realprint pairs, caused by the 3 skills (carpentry, cooking, strategy) the 6.0.2
  merge legitimately added to the catalog (Crafting group 8→10, Lore +1) — a theme-agnostic
  CONTENT change that necessarily reaches print, same shape as every prior sanctioned
  rebaseline in this file. Deliverable ready at `rebaseline.txt` (16 lines, deterministic
  across 2 independent `npm run shots` regenerations, byte-diff empty); **needs Scott's
  sanction before the ticket-owner applies it at landing** — this is the concern behind
  `DONE_WITH_CONCERNS`.
- `npm run parity`: 0 GAPs / 0 undeclared WARNs / 16 DECLARED, exit 0 — unchanged
  composition.
- No `jszip`/`jszip-utils` mentions remain outside historical-context prose (CHANGELOG,
  code comments contrasting old vs. new behavior). No raw traversal name evaded
  `isUnsafeRelativePath` — no NEEDS_CONTEXT trigger.

## 0. Context

Worktree: `/home/scott/code/steelCompendium/worktrees/sc328-fflate/draw-steel-elements`,
branch `sc328-fflate`. Base at start: `origin/develop` = `0c132d8` (matched brief). Never
touched `main`, never pushed, never tagged, never touched
`.superpowers/sdd/freeze-baseline.sha256` (read-only), never ran `just deploy*`.

Mid-round, `origin/develop` moved to `46c0c4c` (SC-241, landed after I'd already created
the `b69ec1a` merge commit). Per the brief's own contingency rule ("if develop has moved,
rebase BEFORE step 1 — never after the merge commit exists") I merged `origin/develop`
forward instead of rebasing (`0d4ee5f`), preserving both merge commits intact — verified
`git merge-base --is-ancestor origin/develop HEAD` and `git merge-base --is-ancestor b69ec1a
HEAD` both pass.

## 1. Merge the 6.0.2 hotfix forward — commit `b69ec1a`

`git merge --no-ff origin/main` (brought `ae86693`+`f860156` = #81 Carpentry/Cooking/
Strategy skills, `e38d4de` = the 6.0.2 fflate hotfix). Conflicts and resolution:

| File | Resolution |
|---|---|
| `manifest.json` | develop's side (7.0.0 / minAppVersion 1.13.0) |
| `package.json` `version` | develop's side (7.0.0) |
| `package.json` deps | kept develop's dep list, added `fflate": "^0.8.3"`, removed `jszip`/`jszip-utils` |
| `src/utils/CompendiumDownloader.ts` | `git rm -f` (develop deleted it; kept deleted — main's side would have resurrected it) |
| `CHANGELOG.md` | develop's file wins; main's `## 6.0.2` entry placed above develop's `## 6.0.1` (both above `## 7.0.0 (unreleased…)`); kept develop's longer 6.0.1 text |
| `src/model/schemas/SkillsSchema.yaml`, `src/utils/SkillsData.ts` | auto-merged clean (git resolved with no conflict marker) — verified the 3 skills (carpentry, cooking in `crafting`; strategy in `lore`) landed in develop's alphabetically-sorted shape |

`package-lock.json` (tracked on develop, NOT tracked on main — matches the ledger's note)
regenerated via `npm install` (commit `c23a319`), confirmed consistent via `npm ci` exit 0.

## 2. Port `CompendiumSyncService` to fflate — commit `7247053`

`readZip` now: `unzipSync(new Uint8Array(buffer))` → `Record<path, Uint8Array>`; skips keys
ending in `/` (directory entries); keeps zero-byte FILE entries (matching JSZip's prior
behavior); a corrupt-archive throw from `unzipSync` (message `"invalid zip data"`) is
wrapped as `Downloaded archive is not a valid zip file (…)`, still caught by `sync()`'s
outer catch which surfaces it via `Notice` + rethrow (unchanged). `isUnsafeRelativePath`
left untouched.

**Raw-traversal-name check (brief's STOP condition): none evaded the defense.** Verified
with a new test (`test/unit/data/compendiumSyncRelease.test.ts`, "SC-328: raw traversal
names…") using fflate's `zipSync`/`strToU8` to author `../evil.md`, `a/../../evil.md`,
`a\..\..\evil.md` raw (fflate hands names through unchanged, unlike JSZip's writer, which
used to path-clean `..`) — `isUnsafeRelativePath` rejects all three (via `normalizePath`'s
backslash-unification + the `..`-segment check), test green. Second new test covers a
directory entry (`dir/`) skipped + a zero-byte FILE entry kept.

Ported `test/unit/data/compendiumSyncRelease.test.ts` fully off JSZip's writer/reader onto
fflate's `zipSync`/`strToU8` (the `zipOf` helper); replaced the stale ~:146 comment; renamed
the "real JSZip archive" integration test to "real fflate archive". 12 tests in this file,
all green.

Remaining `jszip`/`JSZip` mentions in the repo are historical-context prose only (CHANGELOG
entries, code comments contrasting old-vs-new behavior) — no functional/import usage
remains. `.repo-docs/architecture.md:632`'s dependency-table row updated to `fflate`.

## 3. Build gate — commit `42b8287`

`scripts/check-no-dynamic-script.mjs`: case-insensitive `createElement\s*\(\s*["'`]script["'`]`
scan of the built `main.js`; on a hit prints byte offset + ~80 chars of context per hit,
exits non-zero. Wired into `esbuild.config.mjs`'s production path (`if (prod) { … }`, after
`context.rebuild()`), so a single check point covers both `npm run build` (`tsc --noEmit &&
node esbuild.config.mjs production`) and `npm run build-no-check` (`node esbuild.config.mjs
production` alone — CI's script).

**Proof (brief §3):**
- (a) Clean build: `npm run build-no-check` → `esbuild.config.mjs: check-no-dynamic-script
  OK — 0 dynamic createElement("script") calls`, exit 0. Log:
  `.superpowers/sdd/sc328-fflate/logs/build-no-check-clean.log`.
- (b) Injection: appended `document.createElement("script");` to `main.ts`, rebuilt →
  `FOUND 1 dynamic createElement("script") call(s) … byte offset 1276409: …
  this.saveData(this.settings)}};document.createElement("script"); /*! Bundled license
  information: is-…`, exit 1. Reverted (`git diff --stat -- main.ts` empty afterward, not
  committed). Log: `.superpowers/sdd/sc328-fflate/logs/build-no-check-injected.log`.
- (c) Pre-change tree: `git worktree add` at `0c132d8` (scratch, removed after), `npm ci` +
  `node esbuild.config.mjs production` (that tree has no gate wired in, so the build itself
  succeeds), then ran this branch's `check-no-dynamic-script.mjs` against that tree's
  `main.js` → **`FOUND 4 dynamic createElement("script") call(s)`** (JSZip's legacy-browser
  polyfills, 2 distinct call sites × 2 near-duplicate matches each from `onreadystatechange`
  detection). Log: `.superpowers/sdd/sc328-fflate/logs/precheck-gate-result.log`.

**Informational grep on the final production `main.js`** (post full merge, 1,276,886
bytes): `new Function(` **3** (marked's template-compilation path), `eval(` **1** (a
template-literal eval in a bundled dependency), `setImmediate` **0**,
`createElement("script")` **0**. Not acted on (informational only per the brief). Note: a
naive substring grep for `"lie"` (polyfill-marker check) hits **1**, but it's a
false-positive — it's the literal Interpersonal skill named "lie" ("Convince someone that a
falsehood is true"), not a polyfill marker; the regex-based script above doesn't have this
false-positive class.

`just release` runs `npm run build` (justfile's `release` recipe) → goes through the gated
build; confirmed by reading the recipe, not executed (it pushes + creates a GitHub release,
out of scope/destructive).

**Test coverage**: `test/unit/build/checkNoDynamicScript.test.ts` (5 tests) — detector
sanity (all 3 quote styles × case-insensitivity × whitespace, and confirms
`createElementNS` does NOT false-positive), byte-offset/context reporting, a clean sample,
multiple hits in order, and a real-build integration test (rebuilds production, asserts the
live `main.js` is clean). Uses the repo's established `node --input-type=module -e <code>`
subprocess pattern for exercising an ESM `.mjs` from jest (documented precedent:
`test/unit/build/obsidianAppCssPin.test.ts`'s header) since this repo's jest has no ESM
support.

## 4. 6.0.1 → 6.0.2 references — commit `bb5653a`

`versions.json`: `"6.0.1": "0.15.0"` → `"6.0.2": "0.15.0"`. `README.md:22,28`,
`docs/migrating-to-7.md:4-6,23`: 6.0.1 → 6.0.2. Wording kept accurate: migrating-to-7.md's
intro now says "6.0.1 is identical to 5.1.1; 6.0.2 is 5.1.1 plus a zip-library swap (no
behavior change) and three added skills" rather than claiming 6.0.2 is also identical to
5.1.1. CHANGELOG 7.0.0 header line "Upgrading from 5.x or 6.0.1?" → "Upgrading from 5.x or
6.0.2?" (done during the merge-conflict resolution in step 1, same file). Added the required
CHANGELOG bullet under `## 7.0.0 (unreleased…)` in the `[FIX]` style, naming the JSZip→fflate
swap (Obsidian review) and that 7.0.0 carries forward 6.0.2's three skills.

No test reads `versions.json`/`README.md` (checked, none found). One unrelated code comment
(`src/model/Settings.ts:59`, "latest tag 6.0.1") is dated history describing the state *at
the time that migration code was authored* (true then) — not user-facing, not in the
brief's scope list, left untouched (see Follow-ups).

## 5. Gates — battery on final tip (`0d4ee5f`)

Baseline (measured on untouched `0c132d8` before step 1, `rm -f main.js styles.css` per the
stale-artifact footgun):
**jest 202 of 203 suites, 3925 passed / 1 skipped / 3926 total.**
Log: `.superpowers/sdd/sc328-fflate/logs/baseline-jest.log`.

Final tip (`0d4ee5f`, after both merges):

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `logs/final-1-tsc.log` |
| `npm run lint` | clean, exit 0 | `logs/final-2-lint.log` |
| `npx jest` | **203 of 204 suites, 3937 passed / 1 skipped / 3938 total**, exit 0 | `logs/final-3-jest.log` |
| `npm run build` | exit 0, gate OK | `logs/final-4-build.log` |
| `npm run build-no-check` | exit 0, gate OK | `logs/final-5-build-no-check.log` |
| `npm run shots` | 524 PNGs, 0 FAIL, exit 0 (3 independent regenerations, all 524 ok, deterministic) | `logs/final-6-shots.log` + `-determinism.log` + `-determinism2.log` |
| `check-freeze.sh` | **16 checksum mismatches, 0 missing — NOT applied** (see below) | `logs/final-7-freeze.log` (+ 2 re-runs, identical) |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED**, exit 0, composition unchanged | `logs/final-8-parity.log` |

Jest delta: 3926 → 3938 = **+12**, all accounted for: 2 (fflate raw-traversal +
dir/zero-byte tests) + 5 (build-gate detector suite) + 5 (SC-241's own
`minion-stamina-pool-modal.test.ts` additions, not mine). Suite count 203→204: +1
(`checkNoDynamicScript.test.ts`).

One flaky red seen and dismissed per the dse-verify skill's documented load-sensitivity
note: `sidebarEncounterHandoff.test.ts` failed once mid-battery under load (another
worktree's concurrent `npm run shots` was running), re-ran clean alone
(`logs/jest-flaky-recheck.log`, 10/10 passed) and clean again in the next full-battery run
(`logs/battery-3-jest-final2.log`) — not a regression, not touched.

### Freeze: 16 mismatches, diagnosed as legitimate, NOT applied

All 16 are the twin+realprint pairs of the **8 skills-family fixtures**: `chrome-skills-menu`,
`skills`, `skills-chips`, `skills-chips-narrow`, `skills-hero-picks`, `skills-ledger`,
`skills-ledger-narrow`, `skills-narrow`. Cause: the 6.0.2 merge's 3 new skills (carpentry,
cooking → Crafting 8→10; strategy → Lore +1) are real catalog content, so every skills-card
fixture's rendered print DOM legitimately changed — the same "theme-agnostic CONTENT
change necessarily reaches print" shape as the SC-121 C-5 precedent in the dse-verify
skill's log, not a CSS leak. This is also why two pre-existing jest assertions in
`test/dom/elements/skillsStyles.test.ts` needed updating (`'0/8'` → `'0/10'` for the
Crafting tally, commit `e0b4971`) — same root cause, different gate.

Per the dse-verify skill's division of labor, **I did not touch
`.superpowers/sdd/freeze-baseline.sha256`.** Deliverable prepared instead:
- `.superpowers/sdd/sc328-fflate/rebaseline.txt` — the 16 `<sha256>  <filename>` lines
  (after-bytes), verified **deterministic across 2 independent `npm run shots`
  regenerations** (`diff` of the two hash captures is empty:
  `logs/final-hashes-run1.txt` vs `logs/final-hashes-run2.txt`), plus a 3rd regeneration
  that reproduced the same 16 mismatched filenames (`logs/final-6-shots-determinism.log`,
  `logs/final-7-freeze-determinism.log`).
- Before-hashes (the currently-frozen baseline values these 16 lines would replace) pulled
  from `freeze-baseline.sha256` and confirmed to match what `check-freeze.sh` reports as
  mismatching — consistent with "old catalog bytes vs. new catalog bytes", not noise.
- 3 sample after-PNGs saved as crop-ready evidence at
  `.superpowers/sdd/sc328-fflate/evidence/` (`skills--steel-print.png`,
  `skills-chips--steel-print.png`, `chrome-skills-menu--steel-print.png`) — full frames,
  not yet cropped to the Crafting-group region; the ticket-owner or a follow-up round can
  crop these (or regenerate) for the sanction ask.

**This needs Scott's explicit sanction before the ticket-owner applies it at landing** —
per the skill's established protocol, I do not apply it myself. This is the sole reason
for `DONE_WITH_CONCERNS` rather than `DONE`.

## Drive-by fixes

None. The two `skillsStyles.test.ts` count-fix edits (`'0/8'` → `'0/10'`) are a required
mechanical consequence of step 1 (bringing the 6.0.2 skills forward, explicitly asked for
by the brief), not an unrelated pre-existing bug — reported here for visibility, not as a
drive-by.

## Follow-ups

- `src/model/Settings.ts:59`'s code comment ("the theme picker never shipped (latest tag
  6.0.1; …)") is now one release behind the truth of "latest tag" as of today, though it
  remains an accurate historical statement about the moment that migration code was
  authored. Not in the brief's scope list (README/migrating-to-7/versions.json/CHANGELOG
  only), not user-facing, not touched. Low value, but the owner may want a one-word comment
  update in a future pass touching that file.
- The freeze rebaseline above needs Scott's sanction and the dispatcher's apply-at-landing
  step (division of labor per dse-verify skill) — not something I can or should resolve as
  a worker.

## Evidence index

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/`:
- `logs/baseline-jest.log` — pre-work jest baseline (`0c132d8`)
- `logs/npm-ci-baseline.log`, `logs/npm-install-merge.log`, `logs/npm-ci-postmerge.log`,
  `logs/final-npm-ci.log` — lockfile install/consistency checks
- `logs/tsc-postmerge.log`, `logs/tsc-r1.log`, `logs/tsc-r2.log` — intermediate tsc runs
  during the fflate port
- `logs/jest-compendium-r1.log` — the ported compendium test file alone, 12/12 green
- `logs/build-no-check-clean.log`, `logs/build-no-check-injected.log`,
  `logs/build-no-check-reverify.log` — build-gate proof (a)/(b)/re-clean
- `logs/precheck-npm-ci.log`, `logs/precheck-build.log`, `logs/precheck-gate-result.log` —
  build-gate proof (c), the pre-change-tree scratch worktree (removed after)
- `logs/jest-gate-test-r1.log`, `logs/jest-gate-test-r2.log` — the new
  `checkNoDynamicScript.test.ts` file alone
- `logs/lint-r1.log` — early lint check
- `logs/battery-1-tsc.log` … `logs/battery-6-shots.log` — first full-battery attempt
  (pre-SC-241-merge tip, superseded by `final-*` below; the `battery-6-shots.log` run was
  interrupted mid-sweep by a concurrent agent action, see `logs/jest-flaky-recheck.log` /
  `logs/battery-3-jest-final2.log` for the retry story)
- `logs/final-1-tsc.log` … `logs/final-8-parity.log` — the battery that matters, run on
  final tip `0d4ee5f`
- `logs/final-hashes-run1.txt`, `logs/final-hashes-run2.txt` — the 16 skills-fixture hashes
  from 2 independent shots regenerations (empty diff)
- `rebaseline.txt` — the 16-line ready-to-apply hash file (after Scott's sanction)
- `evidence/*.png` — 3 sample after-shots for the sanction ask

## Commits (branch `sc328-fflate`, on top of `0c132d8`)

1. `b69ec1a` — merge: SC-328 — merge 6.0.2 hotfix (main e38d4de) forward into develop
2. `c23a319` — chore(deps): SC-328 — regenerate package-lock.json after fflate/jszip swap
3. `7247053` — fix(compendium): SC-328 — port CompendiumSyncService to fflate, drop jszip
4. `42b8287` — fix(build): SC-328 — gate the production build against dynamic createElement("script")
5. `bb5653a` — docs: SC-328 — bump 6.0.1 references to 6.0.2
6. `e0b4971` — test(skills): SC-328 — update Crafting group tally counts, 8 -> 10
7. `0d4ee5f` — merge: SC-328 — merge develop 46c0c4c (picks up SC-241, landed mid-round)

Final HEAD (before fix round 1): `0d4ee5f`. Not pushed (per brief's hard limits). `dse main`
untouched, no tags, no releases, `.superpowers/sdd/freeze-baseline.sha256` untouched.

---

# Fix round 1

**STATUS: DONE_WITH_CONCERNS** (unchanged reason: the freeze rebaseline still needs Scott's
sanction — see below, now re-verified byte-identical against the independent review's own
regeneration too)

- Independent review verdict: **APPROVE**, 0 BLOCKER/HIGH/MEDIUM, 5 LOW, 10 INFO
  (`sc328-report-review-r1.md`). Owner folded LOW-1..5, INFO-1, INFO-5, INFO-7 into this
  round (`decisions.md` → "Review r1 rulings"); INFO-9 filed as SC-349 (Backlog, out of
  scope); INFO-4/8 dropped; INFO-2/3/6/10 no action.
- `origin/develop` moved twice during this ticket (mid-round-1 to `46c0c4c`, mid-fix-round
  to `f6fb208`) — merged both forward (never rebased, preserving the `b69ec1a` main-hotfix
  merge commit), resolving a CHANGELOG conflict each time by keeping both sides' bullets.
- Folded all 8 findings, one commit each: LOW-1 (stale JSZip-writer/reader comment + line
  ref), LOW-2 (build gate now also catches `createEl("script")` and `createElementNS(...,
  "script")`), LOW-3 (CLI guard no longer silently exits 0 on a symlink or a space in the
  path), LOW-4 ("5.x or 6.0.2" → "5.x or 6.0.x", stops leaving out 6.0.1 installs), LOW-5
  (restored a dropped blank line), INFO-1 (yield a macrotask before the synchronous
  unzip — plus one follow-up commit fixing a lint violation that fix introduced), INFO-5
  (skip an entry named `""` in `readZip`), INFO-7 (dropped this test file's own redundant/
  racy production build, since `cssNesting.test.ts`'s build already exercises the wired-in
  gate).
- Full battery on the final tip (`db2a206`), all foreground, no Monitor/background: tsc
  clean, lint clean, jest 203/204 suites, 3946 passed/1 skipped/3947 total (fully
  accounted for: prior tip 3938 + SC-240's own 7 new tests + this round's net +2), both
  builds exit 0 with the gate passing, shots 524/0 FAIL, **freeze 244/260 with exactly the
  same 16 skills lines**, and — the STOP-condition check — **my regenerated hashes for
  those 16 files are byte-identical to `rebaseline.txt`** (`diff` empty). Parity 0/0/16,
  exit 0.

## 1. Merge develop forward twice more

- `36a5826` — `git merge origin/develop` (f6fb208, SC-240). CHANGELOG conflict: kept both
  sides' `## 7.0.0` bullets (SC-328's and SC-240's), no dedup needed (distinct findings).
  Verified `git merge-base --is-ancestor origin/develop HEAD` and `--is-ancestor b69ec1a
  HEAD` both pass (merge preserved, not flattened).
- (The brief also reported `origin/develop` had moved once already, to `46c0c4c`
  (SC-241), before this fix round started — that merge, `0d4ee5f`, was already committed
  as part of round 1's own work; see the round-1 section above.)

## 2. LOW findings — one commit each

- **LOW-1** (`fe85903`): the test comments blamed JSZip's *writer* for path-cleaning `..`
  on write; the review's probe (`review-r1/jszipread.log`) showed it was actually the
  *reader* (`loadAsync`, the CVE-2022-48285 fix). Changed "writer" → "reader (`loadAsync`)"
  in both the inline comment and the test title; replaced the stale
  `CompendiumSyncService.ts:313-316` line citation (drifted from the function's real
  `:329-332`) with a citation by function name, which can't drift.
- **LOW-2** (`8ee7be3`): widened `DYNAMIC_SCRIPT_PATTERN` from `createElement(...)`-only to
  an alternation also covering `createEl(...)` (Obsidian's own DOM helper, used throughout
  this plugin — the review called it "the most plausible way plugin code would reintroduce
  the pattern") and `createElementNS(...)`. Added 2 new detector tests (one per new shape,
  each with a same-shape must-NOT-match case: `createEl("div")`,
  `createElementNS(..., "div")`); the prior `createElementNS(..., "script")` must-NOT-match
  assertion became a must-MATCH case in the new `createElementNS` test. 7/7 green
  (`logs/fix1-low2-jest.log`).
- **LOW-3** (`4dc32c6`): the CLI entry-point guard
  (`import.meta.url === \`file://${process.argv[1]}\``) compared a percent-encoded realpath
  URL against a raw argv path, so a symlinked entry point or a path with a space in it never
  matched — `main()` silently never ran, exit 0, no output, even against a `main.js` full of
  hits. Fixed with `realpathSync` + `pathToFileURL`. **Proved both failure modes**, live
  (scratch, not committed): a copy at a `sp ace/` path and a symlink to it, both run against
  a synthetic dirty file → `FOUND 1 … call(s) …`, exit 1 (was: silent exit 0); both against a
  clean file → `OK …`, exit 0 (unaffected). No jest regression (`logs/fix1-low3-jest.log`,
  7/7).
- **LOW-4** (`4375292`): `README.md:28` and the CHANGELOG 7.0.0 header both said "5.x or
  6.0.2", leaving out users still on 6.0.1 (Obsidian doesn't auto-update plugins by
  default). Changed both to "5.x or 6.0.x", matching `docs/migrating-to-7.md`'s existing
  wording and ledger owner call 3. `README.md:22` ("last compatible build, 6.0.2") is
  correct as written, untouched.
- **LOW-5** (`74c70bc`): restored a blank line the merge had dropped before `## 5.1.1` in
  `CHANGELOG.md` — cosmetic, matches every other entry's spacing.

## 3. INFO findings folded — one commit each

- **INFO-1** (`475eec7` + follow-up `d1a64bb`): `unzipSync` is synchronous and takes
  94–167ms on the real asset with no yield between it and the "reading archive…" `Notice`
  set right before it — long enough the Notice might never paint. Added
  `await new Promise((resolve) => setTimeout(resolve, 0))` in `readZip`, before the
  `unzipSync` call. First commit introduced a lint violation
  (`obsidianmd/prefer-window-timers`, since `readZip` — like the pre-existing identical
  yield in `applySync`'s batch loop, `CompendiumSyncService.ts:139` — runs under the plain
  Node jest project with no DOM `window` global, so `window.setTimeout` would throw there);
  follow-up commit matches the pre-existing pattern's `eslint-disable-next-line` +
  justification comment instead of switching to `window.setTimeout`. tsc clean, lint clean,
  compendium test file 12/12 green after both commits (`logs/fix1-info1-jest.log`).
- **INFO-5** (`157b00f`): an entry named `""` normalizes to the root folder path; only a
  malicious archive would carry one and it can't escape the root, but whether it collided
  with the vault root on write depended on batch order. Now skipped explicitly in `readZip`,
  same treatment as any directory-shaped entry. New test authors one raw via fflate's
  `zipSync` (JSZip never round-tripped this shape) and asserts it's never created. 13/13
  green (`logs/fix1-info5-jest.log`).
- **INFO-7** (`db2a206`): `checkNoDynamicScript.test.ts` and `cssNesting.test.ts` each ran
  their own `node esbuild.config.mjs production` into the same repo-root `main.js`/
  `styles.css` from separate jest workers — redundant (`cssNesting`'s build already
  exercises the wired-in gate for real, since `esbuild.config.mjs`'s production path calls
  it) and a theoretical concurrent-write race (review: "12 of 12 paired runs were green …
  theoretical"). Removed the duplicate `beforeAll`/build/assert block; kept the detector
  unit tests; left a comment at the removal site naming `cssNesting.test.ts` as the real-
  build proof. 6/6 green (`logs/fix1-info7-jest.log`).

## 4. Battery on final tip (`db2a206`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `logs/fr1-1-tsc.log` |
| `npm run lint` | clean, exit 0 | `logs/fr1-2-lint.log` |
| `npx jest` | **203 of 204 suites, 3946 passed / 1 skipped / 3947 total**, exit 0 | `logs/fr1-3-jest.log` |
| `npm run build` | exit 0, gate OK | `logs/fr1-4-build.log` |
| `npm run build-no-check` | exit 0, gate OK | `logs/fr1-5-build-no-check.log` |
| `npm run shots` | 524 PNGs, 0 FAIL, exit 0 | `logs/fr1-6-shots.log` |
| `check-freeze.sh` | **244/260 — exactly the same 16 skills lines**, hashes byte-identical to `rebaseline.txt` (`diff` empty) | `logs/fr1-7-freeze.log`, `logs/fr1-hashes.txt` |
| `npm run parity` | **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 | `logs/fr1-8-parity.log` |

Jest delta fully accounted for: prior tip (`0d4ee5f`) 3938 → this tip 3947 = **+9** = **+7**
(SC-240's own new tests, confirmed by counting `test(`/`it(` blocks added across its 3
touched test files: `initiative-portrait-missing.test.ts` +3,
`initiative-resolve-refs.test.ts` +4, `encounter.test.ts` +0) **+2** (this round's own net:
`checkNoDynamicScript.test.ts` 5 → 7 (LOW-2) → 6 (INFO-7) = **+1**;
`compendiumSyncRelease.test.ts` 12 → 13 (INFO-5) = **+1**). Suite count unchanged at
203/204 (no file added or removed).

The freeze/parity numbers match the independent review's own battery exactly (review
table: freeze 244/260 same 16 lines, parity 0/0/16) and my regenerated 16 hashes match
both `rebaseline.txt` (prepared in round 1) and the reviewer's own independently-generated
hashes (per the review report: "My own regeneration of the 16 files matches
`rebaseline.txt` byte for byte") — three independent generations (round 1 implementer,
review, this fix round) now agree on the exact same 16 byte values. This strengthens, not
changes, the round-1 conclusion: **still needs Scott's sanction before the ticket-owner
applies `rebaseline.txt` at landing.**

## 5. Commits (fix round 1, on top of `0d4ee5f`)

1. `36a5826` — merge: SC-328 — merge develop f6fb208
2. `fe85903` — SC-328: fix round 1 LOW-1 — test comments blamed the wrong JSZip layer
3. `8ee7be3` — SC-328: fix round 1 LOW-2 — build gate now also catches createEl("script") and createElementNS(..., "script")
4. `4dc32c6` — SC-328: fix round 1 LOW-3 — CLI entry-point guard no longer silently exits 0
5. `4375292` — SC-328: fix round 1 LOW-4 — '5.x or 6.0.2' left out 6.0.1 installs
6. `74c70bc` — SC-328: fix round 1 LOW-5 — restore the blank line before ## 5.1.1
7. `475eec7` — SC-328: fix round 1 INFO-1 — yield a macrotask before the synchronous unzip
8. `157b00f` — SC-328: fix round 1 INFO-5 — skip an entry named "" in readZip
9. `d1a64bb` — SC-328: fix round 1 INFO-1 follow-up — lint: bare setTimeout, not window.setTimeout
10. `db2a206` — SC-328: fix round 1 INFO-7 — drop this file's own duplicate production build

**Final HEAD: `db2a206`.** Not pushed. `dse main` untouched, no tags, no releases,
`.superpowers/sdd/freeze-baseline.sha256` untouched. Working tree clean
(`git status --short` empty) before and after.

## 6. Evidence added this round

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/logs/`:
`fix1-low2-jest.log`, `fix1-low3-jest.log` (space/symlink proof output shown inline above,
not logged separately — ephemeral scratch files, removed after), `fix1-info1-jest.log`,
`fix1-info5-jest.log`, `fix1-lint-r2.log`, `fix1-info7-jest.log`, `fix1-info7-tsc.log`,
`fr1-1-tsc.log` … `fr1-8-parity.log`, `fr1-hashes.txt`.

---

# Final sync

**STATUS: DONE**

- Scott sanctioned the 16-line skills rebaseline (`decisions.md`, "sanctioned", scoped to
  the skills-family lines moved by the 3 merged-in skills). Merged `origin/develop`
  forward once more (now `3b25127` — SC-343's 13-commit block-position-tracking series +
  SC-288), never rebased; `b69ec1a`/`0d4ee5f`/`36a5826` merge commits all still ancestors of
  HEAD.
- Only conflict: `CHANGELOG.md` — kept every bullet from both sides, each `##` header once
  (no other file conflicted; `package.json`/`.repo-docs/architecture.md` auto-merged clean,
  `fflate` intact, no `jszip` reintroduced). `package-lock.json` unchanged by the merge, so
  `npm ci` was not needed (checked first).
- Full battery on final tip `c524fd2`, all foreground: tsc clean, lint clean, jest 205 of
  206 suites, 3983 passed / 1 skipped / 3984 total (net +37 over the fix-round-1 tip,
  entirely from develop's SC-343/SC-288 batch — 2 new suite files
  (`dropped-write-notice.test.ts`, `reading-mode-host-durable.test.ts`) plus additions to
  several existing framework/sidebar test files; none of my own files changed test count
  this round), both builds exit 0 with the gate passing, shots 524/0 FAIL.
- **Freeze: 244/260, exactly the same 16 skills-family names as every prior round.**
  Regenerated hashes for those 16 files are **byte-identical to `rebaseline.txt`**
  (`diff` empty) — **`rebaseline.txt` is unchanged, no rewrite needed** (develop's
  SC-343/SC-288 batch didn't touch skills rendering). No non-skills name failed, so no
  STOP condition. Parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0.
- `.superpowers/sdd/freeze-baseline.sha256` untouched (per protocol — the dispatcher
  applies `rebaseline.txt` at landing, now that it's sanctioned). Working tree clean before
  and after. Not pushed, `dse main` untouched, no tags/releases.

## 1. Merge develop forward — commit `c524fd2`

`git merge origin/develop` (`3b25127`). Only `CHANGELOG.md` conflicted (both sides added a
bullet under the same `## 7.0.0 (unreleased…)` header) — kept both: SC-328's fflate bullet
first (already there from round 1), then develop's SC-343 block-position-tracking bullet
and SC-288 sidebar-recovery bullet, in the order git presented them, header once. Verified
`git merge-base --is-ancestor origin/develop HEAD` and `--is-ancestor b69ec1a HEAD` both
pass.

Everything else auto-merged clean: `package.json` (kept `fflate`, no `jszip`),
`.repo-docs/architecture.md`, and every SC-343/SC-288 source/test file
(`src/framework/host/*`, `src/framework/sidebar/SidebarPanel.ts`,
`src/framework/registerFrameworkElements.ts`, `src/framework/view.ts`, plus new files
`src/framework/host/droppedWriteNotice.ts` and `visual-harness/obsidian-lifecycle.mjs`) —
none of these touch anything SC-328 changed, so there was nothing to reconcile beyond the
CHANGELOG. `git grep -i jszip` (repo-wide, excluding `package-lock.json`): only
historical-context prose (CHANGELOG entries, code comments contrasting old-vs-new
behavior), same as every prior round.

## 2. Battery on final tip (`c524fd2`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `logs/fsync-1-tsc.log` |
| `npm run lint` | clean, exit 0 | `logs/fsync-2-lint.log` |
| `npx jest` | **205 of 206 suites, 3983 passed / 1 skipped / 3984 total**, exit 0 | `logs/fsync-3-jest.log` |
| `npm run build` | exit 0, gate OK | `logs/fsync-4-build.log` |
| `npm run build-no-check` | exit 0, gate OK | `logs/fsync-5-build-no-check.log` |
| `npm run shots` | 524 PNGs, 0 FAIL, exit 0 | `logs/fsync-6-shots.log` |
| `check-freeze.sh` | **244/260 — exactly the same 16 skills lines**, hashes byte-identical to `rebaseline.txt` (`diff` empty) | `logs/fsync-7-freeze.log`, `logs/fsync-hashes.txt` |
| `npm run parity` | **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 | `logs/fsync-8-parity.log` |

Jest delta: fix-round-1 tip (`db2a206`) 3947 → this tip 3984 = **+37**, suite count 204 →
206 (**+2**: `dropped-write-notice.test.ts`, `reading-mode-host-durable.test.ts`, both
new files from the SC-343/SC-288 merge). The remaining +35 land across existing files the
merge touched (`element-view.test.ts`, `register-framework-elements.test.ts`,
`sidebarBlockHost.test.ts`, `sidebarInitiative.test.ts`) — none of which SC-328 has ever
touched, so this is develop's own batch landing whole, not a fallout fix on my side (unlike
round 1's Crafting-tally case). None of my own touched files (`checkNoDynamicScript.test.ts`,
`compendiumSyncRelease.test.ts`) changed test count this round.

Informational grep on the final production `main.js` (1,280,085 bytes, unchanged shape from
prior rounds): `new Function(` 3, `eval(` 1, `setImmediate` 0, `createElement("script")` 0.

## 3. Freeze — sanction consumed, rebaseline.txt unchanged

Same 16 names every round (`chrome-skills-menu`, `skills`, `skills-chips`,
`skills-chips-narrow`, `skills-hero-picks`, `skills-ledger`, `skills-ledger-narrow`,
`skills-narrow`, twin+realprint each). Regenerated hashes
(`logs/fsync-hashes.txt`) diffed against `.superpowers/sdd/sc328-fflate/rebaseline.txt`
(prepared round 1, re-verified fix round 1, reviewer's own independent regeneration also
matched it) — **empty diff, byte-for-byte identical.** `rebaseline.txt` needed no rewrite:
develop's SC-343 (save-by-content tracking) and SC-288 (sidebar panel recovery) batches
don't touch skills rendering, so nothing moved these bytes again. `rebaseline.txt` is now
**ready for the dispatcher to apply at landing** against the sanction recorded in
`decisions.md`. I did not touch `.superpowers/sdd/freeze-baseline.sha256` myself.

## 4. Commits (final sync, on top of `db2a206`)

1. `c524fd2` — merge: SC-328 — merge develop 3b25127

**Final HEAD: `c524fd2`.** Not pushed. `dse main` untouched, no tags, no releases,
`.superpowers/sdd/freeze-baseline.sha256` untouched. Working tree clean
(`git status --short` empty) before and after.

## 5. Evidence added this round

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/logs/`:
`fsync-1-tsc.log` … `fsync-8-parity.log`, `fsync-hashes.txt`.
`rebaseline.txt` (unchanged, re-verified) at
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/rebaseline.txt`.
