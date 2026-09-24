# SC-328 independent review, round 1 (dse `sc328-fflate` @ 0d4ee5f)

**Verdict: APPROVE.** Findings: BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 5 / INFO 10. None of the LOWs blocks landing.
- Extraction parity on the real asset (data-unified `v4.20260924021540`, `md-dse-unified-en.zip`, 3,035,707 B, 3,733 entries): JSZip 3.10.1 and branch `readZip` both give **3,083 files, identical key sets, 0 byte mismatches**. JSZip took 319 ms; fflate took 94–167 ms, synchronous.
- Traversal: I drove 27 raw names through the real `sync()` under both the jest-mock `normalizePath` and **Obsidian 1.14.2's real `normalizePath`** (taken from the asar). **None writes outside the root** (checked with posix and win32 resolve). 12 are rejected and the rest stay inside the root.
- Malformed input (9 cases): every case gives a sane error. **0 vault files and no manifest are written** on any failure.
- Build gate: `build` and `build-no-check` both exit 0 with 0 hits. The BASE 0c132d8 bundle **fails the gate with 4 hits**. Missed shapes after esbuild minify: `createEl("script")`, a script tag name held in a variable, `createElementNS` (LOW-2).
- Freeze attribution is **PROVEN**. Reverting only the 6 skills-data lines (SkillsData.ts + SkillsSchema.yaml) gives `freeze OK (260/260)`. My own regeneration of the 16 files **matches `rebaseline.txt` byte for byte**. No mismatch outside the skills family.
- Battery (scratch clone @ 0d4ee5f): tsc 0 / lint 0 / jest 3935 passed + 3 skipped, 203 of 204 suites. The 2 extra skips are the workspace-map `token-coverage` block, which cannot run outside a workspace; it gives 9/9 in the real worktree, so this equals the implementer's 3937/1. Shots 524 / 0 FAIL, freeze 244/260 (exactly the 16 lines), parity 0 GAPs / 0 undeclared / 16 DECLARED.
- Merge resolution is correct. Nothing from develop is lost. Versions stay 7.0.0 (min 1.13.0). `CompendiumDownloader.ts` is absent. jszip is gone from package.json, package-lock and node_modules after `npm ci`. The 3 skills match the Heroes book text and pass schema validation (57 enum = 57 SKILL_DATA).
- Scott's sanction ask: `evidence/sc328-freeze-skills-before-after.png` and `evidence/sc328-freeze-skills-chips-before-after.png`. Both show 2 new Crafting rows (Carpentry, Cooking). Strategy (Lore) is also added, but it falls below the shots' existing 2400 px capture clip (INFO-9).

---

## Findings

### BLOCKER: none
### HIGH: none
### MEDIUM: none

### LOW-1: test comments say the wrong JSZip layer cleaned `..`, and a line reference is stale
- `test/unit/data/compendiumSyncRelease.test.ts:147-152` and `:175` (test title "unlike JSZip's writer").
- The claim is that JSZip's *writer* path-cleaned `..`. Probe `review-r1/jszipread.log` shows the opposite: JSZip 3.10.1's **writer** keeps `../q.md` raw (fflate reads back `["../","../q.md"]`). Its **reader** (`loadAsync`, the CVE-2022-48285 fix) resolved `../x.md` to `x.md`, `a/../../y.md` to `y.md` and `./c.md` to `c.md`, but left backslashes alone.
- Line 150 cites `CompendiumSyncService.ts:313-316`. `isUnsafeRelativePath` is actually at `:329-332`.
- Why it matters: a future reader will misjudge where the old defense lived.
- Fix: change "writer" to "reader (`loadAsync`)" in both places, and cite the function by name instead of by line numbers.

### LOW-2: the build gate misses Obsidian's own `createEl("script")` and a few other shapes
- `scripts/check-no-dynamic-script.mjs:24`, regex `/createElement\s*\(\s*["'`]script["'`]/gi`.
- I compiled 16 shapes through esbuild minify (`review-r1/evasion.log`).
- **Caught:** double quotes, single quotes with spaces, `SCRIPT`, backticks, `["createElement"]`, `"scr"+"ipt"`, `"\x73cript"` and an inline comment. esbuild folds the last four into the plain literal form.
- **Missed:**
  - `createEl("script")` / `el.createEl("script", …)`. This is Obsidian's DOM helper and this plugin uses it everywhere, so it is the most plausible way plugin code would reintroduce the pattern.
  - `createElementNS(xhtml, "script")`.
  - The tag name held in a variable or parameter.
  - `insertAdjacentHTML("<script …>")`.
- The ticket's literal ask (`createElement("script")`) is met, and the JSZip polyfill shape is caught.
- Fix (cheap): extend the pattern to `/createEl(?:ement)?\s*\(\s*["'`]script["'`]|createElementNS\s*\([^)]{0,80}?["'`]script["'`]/gi`, and add the two shapes to `checkNoDynamicScript.test.ts`. The existing `createElementNS … "script"` must-NOT-match assertion would then flip. Owner's call whether to widen.

### LOW-3: the CLI entry point reports a false green (exit 0, no output) for paths with a space or a symlink
- `scripts/check-no-dynamic-script.mjs:83`: `if (import.meta.url === \`file://${process.argv[1]}\`)`.
- Run through a copy at `…/sp ace/gate.mjs`, or through a symlink, against the BASE `main.js` that has 4 hits: **exit 0 with no output**. The guard compares a percent-encoded realpath URL with a raw argv path, so `main()` never runs. The same would happen on Windows (`C:\…`).
- The wired gate is unaffected, because `esbuild.config.mjs` imports `checkBuiltFile`. The CLI is documented in the file header but nothing invokes it today.
- Fix: `import { realpathSync } from "fs"; import { pathToFileURL } from "url"; if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();`

### LOW-4: README and the CHANGELOG 7.0.0 header say "5.x or 6.0.2", leaving out 6.0.1 installs
- `README.md:28` "Upgrading from a 5.x or 6.0.2 install?" and `CHANGELOG.md:22` "Upgrading from 5.x or 6.0.2?".
- A user still on 6.0.1 with Obsidian 1.13 or later goes straight to 7.0.0, because Obsidian does not auto-update plugins by default. These two lines do not address them literally.
- `docs/migrating-to-7.md:5-7` already says "6.0.x", and ledger owner call 3 allows "6.0.x".
- Fix: change both lines to "5.x or 6.0.x". `README.md:22` ("last compatible build, 6.0.2") is correct as written.

### LOW-5: the CHANGELOG lost the blank line before `## 5.1.1`
- `CHANGELOG.md:1167-1168`. It is a merge artifact: the diff against develop shows a `-` blank line.
- It still renders, because an ATX heading interrupts the paragraph, but it is inconsistent with every other entry.
- Fix: restore the blank line.

### INFO
1. **Main-thread block.** On this desktop, `unzipSync` on the real asset takes 94–167 ms (8.8 MB uncompressed, 3,083 files); mobile will be slower. Also, `sync()` calls `notice.setMessage("reading archive…")` and then goes straight into the synchronous unzip with no yield, so the message may never paint (`CompendiumSyncService.ts:188-189`, `:274`). Optional: add `await new Promise(r => setTimeout(r, 0))` before `unzipSync`. This matches owner call 6, so it is not a finding.
2. **Filename decoding.** fflate decodes names without the EFS flag as latin1, while JSZip decoded them as UTF-8. There is no impact: the asset is built with `git archive --format=zip` (workspace `justfile:201`), and git sets bit 11 on non-ASCII names. I checked this with a `Tÿrgal Çé.md` archive: both libraries give identical keys (`review-r1/utf8-run.log`). The real asset has 0 non-ASCII names.
3. **Name normalization change.** JSZip's reader rewrote `./x.md` and `a/../b.md` before our guard saw them. fflate passes them raw: `./x.md` becomes vault path `DS Compendium/./x.md` (contained), and `a/../b.md` is now *rejected* rather than written as `b.md`. Both are safer or harmless, and the real asset has no such names.
4. **No integrity check in either version.** Neither the old nor the new path verifies CRC32, and neither caps decompressed size. A 50 MB zero-bomb (51 KB zipped) extracts in 368 ms. The source is a GitHub release over HTTPS.
5. **Empty entry name (pre-existing).** An entry named `""` normalizes to the root folder path. In the probe it was skipped as a folder conflict, but whether that happens depends on batch order: in theory `createBinary("DS Compendium")` could run first. Only a malicious archive can trigger it, and it cannot escape the root.
6. **Suspicious APIs in the bundle (all pre-existing, from dependencies; informational for Obsidian's review).** Branch `main.js` (1,276,890 B): `createElement("script")` 0, `eval(` 1 (gray-matter's JS front-matter engine), `new Function(` 3 (ajv codegen, and js-yaml/esprima `!!js/function`), `new Worker` 0, `createObjectURL` 0 (fflate's worker code is tree-shaken out), `setImmediate` 0, `onreadystatechange` 0.
7. **Two jest suites now build production concurrently.** `cssNesting.test.ts` and the new `checkNoDynamicScript.test.ts` both run `node esbuild.config.mjs production` into the repo-root `main.js`/`styles.css`, in parallel jest workers. 12 of 12 paired runs were green, so the race did not reproduce and is theoretical. The new build is also redundant: cssNesting's build already runs the gate and would exit 1 on a hit.
8. **Implementer-report accuracy.** The 7.0.0 `[FIX]` bullet and the "6.0.2?" header line were written *inside merge commit b69ec1a* (an evil merge), not in bb5653a. Also, b69ec1a's `package.json` drops jszip without the lockfile regeneration (that came in c23a319), so that intermediate commit cannot be `npm ci`'d. This matters only for bisect.
9. **Pre-existing harness clip; suggest a Backlog ticket.** Every skills-family `*--steel-print.png` is white below device row 2400 (`chrome-skills-menu` below 2512), even though the page is 4,030–4,682 px tall. The frozen print gate is therefore blind to the lower half of the skill list, including Lore, where Strategy landed. The +186 px height change (3 rows × 62 px) is the only trace of Strategy in the shots.
10. **Shared-checkout observation (not this branch).** During the review, the shared main checkout's `draw-steel-elements` became dirty (`M demo-vault/Welcome.md`, `M justfile`, untracked `compendium-manifest.json` and `demo-vault/montage 1.md`), and the superproject HEAD moved to d892b7a. Another session did this; I never touched the main checkout.

---

## Probe results

### 1. Extraction parity on the real asset (`review-r1/parity-run1.log`, script `review-r1/parity.js`)

| Measure | Result |
|---|---|
| Asset | `md-dse-unified-en.zip` from `v4.20260924021540`, 3,035,707 B |
| Central directory | 3,733 entries (650 stored dirs, 3,083 deflate) |
| UTF-8 flag / non-ASCII names | 0 / 0 |
| JSZip 3.10.1 | 3,083 files, 650 dirs skipped, 318.6 ms (async) |
| fflate 0.8.3 `readZip` logic | 3,083 files, 650 `/` keys skipped, 167 / 94 / 100 / 101 / 141 ms (sync) |
| Key diff | onlyOld 0, onlyNew 0 |
| Byte mismatches | **0** across 3,083 files (8,818,509 B); 0 zero-byte files |
| Unsafe or backslash names | 0 |

Because the key sets are identical, upgrading from a JSZip-built manifest causes no trash-and-recreate churn.

### 2. Traversal (`review-r1/probe-mock.tsv`, `review-r1/probe-real.tsv`)

Every name was authored raw with fflate `zipSync` next to `safe.md` and run through the real `CompendiumSyncService.sync`. The real-`normalizePath` run swaps in Obsidian 1.14.2's actual implementation, extracted from `~/.config/obsidian/obsidian-1.14.2.asar`:

```js
function Ol(e){return Sl(Fl(e)).normalize("NFC")}
function Fl(e){return""===(e=e.replace(/([\\/])+/g,"/").replace(/(^\/+|\/+$)/g,""))&&(e="/"),e}
```

The mock and real runs differ only for the NBSP name, which real Obsidian turns into a plain space (still contained).

- **Rejected (12):** `../x.md`, `a/../../x.md`, `a\..\..\x.md`, `/x.md`, `C:/x.md`, `C:\x.md`, `..`, `a/..`, `..\x.md`, `\\server\share\x.md`, `a/./../../x.md`, `\x.md`.
- **Created, contained (13):** `./x.md`, `a//b.md` (becomes `a/b.md`), NUL-in-name, a 5,003-char name, `C:x.md`, `.. /x.md`, `... /x.md`, `a/.../x.md`, `%2e%2e/x.md`, `‥/x.md`, `a/<NBSP>../x.md`, `a/b\` (becomes `a/b`), `c:../x.md`.
  - "Contained" means `path.posix.resolve` and `path.win32.resolve` both stay under the root.
  - On a real filesystem, NUL and over-long names would throw at write time: the sync fails partway with no manifest saved, and the next sync adopts the already-written files as "unchanged". This is pre-existing behavior.
- **Skipped (2):** `x.md/` (treated as a directory) and `""` (folder conflict, INFO-5).
- **Crashes:** none.

### 3. Malformed input (same TSVs)

| Input | Result | Vault files | Manifest |
|---|---|---|---|
| zero-length | "Downloaded compendium asset is empty." | 0 | none |
| HTML 502 page | "…not a valid zip file (invalid zip data)." | 0 | none |
| truncated half | invalid zip data | 0 | none |
| truncated −10 B | invalid zip data | 0 | none |
| real asset −5,000 B | invalid zip data | 0 | none |
| real asset cut at 1.5 MB | invalid zip data | 0 | none |
| dirs only | "Downloaded archive contains no files." | 0 | none |
| corrupted deflate body | "…not a valid zip file (unexpected EOF)." | 0 | none |
| 50 MB zero-bomb | OK, 1 file, 368 ms | 1 | saved |

### 4. Build gate

- Branch clone: `npm run build` exit 0 and `npm run build-no-check` exit 0. Each prints `check-no-dynamic-script OK — 0 …`, and the two builds produce byte-identical `main.js` (`review-r1/r1-4-build.log`, `r1-5-build-no-check.log`).
- CI (`plugin-ci.yml:42`) runs `npm run build-no-check`, which is gated, and `npm test -- --ci`, which includes the gate's integration test. `just release` runs `npm run build`, which is gated (`justfile:23`); I read the recipe but did not execute it.
- BASE 0c132d8 (fresh clone, `npm ci`, `build-no-check`) checked with the branch's gate: **exit 1, 4 hits** at offsets 47530, 47582, 97510 and 97575, all in the `onreadystatechange … createElement("script")` polyfills (`review-r1/base-gate.log`).
- Evasion matrix: `review-r1/evasion.log` (see LOW-2). CLI guard probe: `review-r1/cli-space.log` and `cli-symlink.log` (see LOW-3).

### 5. Merge resolution

- `git diff 46c0c4c..0d4ee5f` touches only the 15 intended files. The lockfile removes only jszip's subtree (jszip, jszip-utils, lie, pako, immediate, setimmediate, readable-stream, core-util-is, isarray, process-nextick-args, string_decoder, util-deprecate) and adds fflate 0.8.3.
- I re-ran the hotfix merge (`0c132d8 + e38d4de`, `--no-commit`) in a scratch clone and compared it with b69ec1a (git 2.34 has no `--remerge-diff`):
  - manifest.json and package.json: develop's side wins (7.0.0, minApp 1.13.0; main's older `obsidian 1.8.7` and `sdk 2.1.5` pins correctly not taken).
  - CompendiumDownloader.ts: modify/delete, kept deleted.
  - CHANGELOG: 6.0.2 placed above 6.0.1, both above `7.0.0 (unreleased…)`; develop's longer 6.0.1 text kept.
  - SkillsSchema.yaml and SkillsData.ts: auto-merged.
  - Resolution evidence: `review-r1/remerge-attempt.log`.
- Ancestry: e38d4de and 46c0c4c are both ancestors of HEAD, so a later 7.0.0 fast-forward of `main` is possible.
- `git grep -i jszip`: prose and comments only. `package-lock.json`: 0 hits. `node_modules` after `npm ci`: no jszip, lie, pako, setimmediate or immediate.
- Skills content matches `Draw Steel Heroes.md:20710-20711` and `:21043` verbatim.
- Scratch schema probe: `Carpentry` / ` cooking` / `STRATEGY` validate, `woodworking` is rejected, and the 57 schema enum entries equal the 57 SKILL_DATA names.

### 6. Docs accuracy

- versions.json becomes `{"6.0.2":"0.15.0","7.0.0":"1.13.0"}`. Obsidian therefore offers pre-1.13 clients 6.0.2.
  - Release 6.0.2 exists and is not a draft or prerelease, with main.js, manifest.json and styles.css. Its manifest has minApp 0.15.0.
  - The repo's default branch is `main`, which has no versions.json today; one arrives with the 7.0.0 fast-forward.
- CHANGELOG 6.0.2 ("zip swap, no behavior change; + 3 skills") is true.
- migrating-to-7 ("6.0.1 identical to 5.1.1; 6.0.2 = 5.1.1 + zip swap + three skills; pins pre-1.13 to 6.0.2") is true.
- README:22 is true. README:28 and CHANGELOG:22 are the LOW-4 nit.

### 7. Freeze attribution

| Step | Result |
|---|---|
| Branch tip, full `npm run shots` | 524 PNGs, 0 FAIL |
| Freeze on branch tip | `FREEZE VIOLATED (16 checksum mismatches, 0 missing)`: exactly the 16 `rebaseline.txt` names, 244/260 OK (`review-r1/r1-7-freeze.log`) |
| `sha256sum` of those 16 files vs `rebaseline.txt` | empty diff, **match** (`review-r1/r1-branch-16-hashes.txt`) |
| Revert only the 6 skills lines (SkillsData.ts +3, SkillsSchema.yaml +3), full shots, freeze | **`freeze OK (260/260 …)`** (`review-r1/r1-attr-freeze-skills-reverted.log`) |
| Scratch clone restored | clean (`git status` empty) |
| develop 46c0c4c filtered shots (`--element=skills`, `--element=chrome-skills-menu`) | byte-identical to the reverted run and to the frozen baseline: `05efdb23…` skills, `13c11c5c…` skills-chips, `96c2fb8d…` chrome-skills-menu |

What changed in each shot:
- **`skills--steel-print.png`**: 2 new rows under Crafting in alphabetical order, Carpentry and Cooking, between Blacksmithing and Fletching. Everything below moves down 2 rows (124 device px). Rows that land on a different sub-pixel phase show antialiasing-only differences; I checked a sample visually and the content is identical. Page height grows 4030 → 4216 (+186 px = 3 rows including Strategy under Lore), but Lore sits below the capture's 2400 px clip.
- **`skills-chips--steel-print.png`**: the same 2 Crafting rows and the same 2-row shift below. Height 4206 → 4394 (+188).
- **`chrome-skills-menu`**: the same shift; rows above 466 px are identical.

---

## Battery (scratch clone `/tmp/claude-1000/sc328-review-r1q7/branch` @ 0d4ee5f, fresh `npm ci`)

| Gate | Mine | Implementer | Log (under `logs/review-r1/`) |
|---|---|---|---|
| tsc | exit 0 | clean | `r1-1-tsc.log` |
| lint | exit 0 | clean | `r1-2-lint.log` |
| jest | 203 of 204 suites; 3935 passed / 3 skipped / 3938 | 3937 / 1 | `r1-3-jest.log`; the 2 extra skips pass in the worktree (9/9, `r1-3b-jest-tokencov-worktree.log`) |
| build | exit 0, gate OK | same | `r1-4-build.log` |
| build-no-check | exit 0, gate OK | same | `r1-5-build-no-check.log` |
| shots | 524, 0 FAIL, exit 0; host-copy pin OK (1.14.2); button host-leak OK (114 kinds × 3 × 2 = 684) | 524 / 0 | `r1-6-shots.log` |
| freeze | 244/260, exactly the 16 `rebaseline.txt` lines | same | `r1-7-freeze.log` |
| parity | 0 gaps / 0 undeclared / 16 declared, exit 0 | same | `r1-8-parity.log` |

Load average was 4–13 during the runs, and no suite hit a timeout-shaped failure.

## Evidence paths

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/evidence/sc328-freeze-skills-before-after.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/evidence/sc328-freeze-skills-chips-before-after.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/logs/review-r1/`: all gate logs and `.rc` exit-code files, the parity and traversal TSVs and scripts, the evasion log, the remerge log, and the full-frame before/after PNGs for skills and skills-chips.
- Scratch clones, untracked and outside the repo: `/tmp/claude-1000/sc328-review-r1q7/{branch,base,develop,parity}`.

Working tree under review: `git status --porcelain` was empty before and after, and HEAD is 0d4ee5f. I made no commits, pushes or tags, did not edit the freeze baseline, and did not use the tracker.

---

# Re-review r1 (scoped: 0d4ee5f..db2a206, fix round 1 + the develop f6fb208 merge)

**Verdict: APPROVE.** New findings: BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 2. LOW-1..5, INFO-1, INFO-5 and INFO-7 are all verified fixed.
- (a) Widened gate regex, run on each shape raw and after esbuild minify: all 13 must-match shapes are flagged after minify, and all 12 benign shapes give 0 hits in both forms. Benign shapes include `createElementNS(svg,"svg")`, an svg element followed by a separate `"script"` string, a `scriptTag` identifier, `createEl("scriptTag")`, `cls:"script-block"`, `text:"script"`, and `noscript`/`scripts`. BASE 0c132d8 `main.js` still gives **4 hits**. The db2a206 production build has 0 hits, exit 0.
- (b) LOW-3 CLI: a path with a space, a symlink, and a space-plus-symlink path each run against the dirty BASE `main.js` now give **exit 1 and FOUND 4**. The r1 result was a silent exit 0. The same paths against a clean file give exit 0 OK; a missing file gives exit 2.
- (c) develop merge 36a5826 (parents 0d4ee5f, f6fb208) is lossless:
  - The changes it brings in (0d4ee5f→36a5826) equal develop's own delta (46c0c4c→f6fb208) exactly, CHANGELOG excluded.
  - Every `## `/`- ` CHANGELOG line from both sides is present at db2a206; 0 are missing.
  - `f6fb208..db2a206` touches only the same 15 SC-328 files as before.
  - Both f6fb208 and e38d4de are ancestors of the tip.
- (d) Wired gate via cssNesting: I injected `document.createElement("script")` into `main.ts` in the scratch clone. `cssNesting.test.ts` went **red (3 failed)**, and the log shows `esbuild.config.mjs: FOUND 1 … byte offset 1276853`. I then reverted it; `git status` is clean.
- (e) db2a206 in the /tmp clone: tsc 0, lint 0, jest **3944 passed / 3 skipped, 203 of 204 suites**, which equals 3946/1 in the worktree. Shots 524, 0 FAIL. Freeze **244/260**: the same 16 names, and the hashes are **byte-identical to `rebaseline.txt`**.
- Extra check: INFO-5's new test is genuinely red-first. With the `entryPath === ""` guard removed, it fails 3 of 3 runs, because `""` gets **created** (written at the root folder path). This confirms INFO-5 was a real batch-order hazard, not just a theoretical one.

## New INFO (no action needed)
- **RR-INFO-1.** `scripts/check-no-dynamic-script.mjs` guard: `realpathSync(process.argv[1])` runs at import time. If a module imports the gate while `argv[1]` names a path that does not exist (for example `node -e "<import>" somearg`), the import throws ENOENT. Neither current importer hits this: `esbuild.config.mjs` passes an argv[1] that exists, and jest's `node --input-type=module -e` passes no argv[1]. Optional hardening: wrap the guard in try/catch.
- **RR-INFO-2.** The `createElementNS` branch uses `[^)]{0,80}?`, so it stops at the first `)`. A namespace argument that itself contains a call, like `createElementNS(ns(),"script")`, is missed. esbuild would not produce that shape from a constant namespace, which is why this is informational only. Also, as in r1, the raw-source (unminified) shapes `["createElement"]`, `"scr"+"ipt"`, `"\x73cript"` and an inline comment do not match, but the gate only scans the minified bundle, where esbuild folds all four into a form it catches.

## Evidence (under `logs/review-r1/`)
- `rr1-regex.log` and `rr1-regex.mjs`: the match / no-match matrix plus the BASE hit count.
- `rr1-cli-*.log` and `.rc`: CLI guard cases.
- `rr1-cl-{0d4ee5f,f6fb208,db2a206}.txt`: CHANGELOG line sets.
- `rr1-d-cssnesting-injected.log`: the injected jest red.
- `rr1-info5-without-fix-{1,2,3}.log`: the red-first check.
- `rr1-1-tsc.log`, `rr1-2-lint.log`, `rr1-3-jest.log`, `rr1-5-build-no-check.log`, `rr1-6-shots.log`, `rr1-7-freeze.log`, `rr1-16-hashes.txt`.

Worktree under review: clean, HEAD db2a206, before and after. The scratch clone at `/tmp/claude-1000/sc328-review-r1q7/branch` (db2a206) was restored to clean after both injections. I made no commits, pushes or tags, did not edit the baseline, and did not use the tracker.
