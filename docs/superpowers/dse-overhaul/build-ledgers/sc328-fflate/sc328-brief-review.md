# SC-328 independent review brief (round 1)

You are the independent adversarial reviewer. You did not write this code. **Execute and probe, do not just read.**

## 0. Context loading

- Ledger (source of truth, Scott's ruling verbatim + binding owner calls):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/decisions.md`
- The implementer's brief and report (same dir): `sc328-brief-impl.md`, `sc328-report-impl-r1.md`.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, devbox shapes).
- Repo under review: `/home/scott/code/steelCompendium/worktrees/sc328-fflate/draw-steel-elements`, branch
  `sc328-fflate`, HEAD must be `0d4ee5f`; diff range `origin/develop..HEAD` (origin/develop = 46c0c4c; the branch merged develop in at 0d4ee5f and the 6.0.2 hotfix at b69ec1a). The
  branch contains a merge commit of dse `origin/main` (e38d4de, the 6.0.2 hotfix) — review the merge
  resolution too (`git show --remerge-diff <merge>` or `git diff <merge>^1 <merge>`).
- **Workers never call the tracker.** Never push, tag, or touch dse `main`; never `just deploy*`; never edit
  the freeze baseline; never `rm -rf` under `.superpowers/`. Do NOT commit to the branch — you review only.
  Scratch work goes under a scratch dir of your own (e.g. `/tmp/claude-1000/sc328-review-<random>/`), not the repo.

## 1. What to probe (at minimum)

1. **Extraction parity on the REAL asset.** Download the real compendium release asset the service fetches
   (see `CompendiumSyncService` for the repo/asset name — likely `md-dse-unified-en.zip` on the
   SteelCompendium data-unified GitHub releases; `gh release download` works). In a scratch Node project,
   extract it with jszip 3.10.x (the old path: skip `entry.dir`, `entry.async("uint8array")`) AND with the
   branch's new `readZip` logic (fflate `unzipSync`). Diff: key sets identical? every byte identical? any
   non-ASCII filenames (UTF-8 flag vs CP437/latin1 decoding differences)? Report counts. Time both
   (unzipSync is synchronous on the main thread — report ms and asset size).
2. **Traversal defense with raw names.** fflate passes raw entry names through (JSZip cleaned `..` on write).
   Author archives with fflate `zipSync` containing `../x.md`, `a/../../x.md`, `a\..\..\x.md`, `/x.md`,
   `C:/x.md`, `C:\x.md`, `./x.md`, `a//b.md`, a NUL-containing name, and a very long name; drive them through
   the real `CompendiumSyncService.sync` (the unit test's fakes show how) and report which are rejected,
   created, or crash. Any entry that could write outside the compendium root is BLOCKER.
3. **Malformed input.** Truncated zip, zero-length buffer, a non-zip (HTML error page bytes), a zip with only
   directory entries, a zip bomb-ish entry (high compression ratio) — confirm error messages are sane and
   nothing is half-written into the vault.
4. **Build gate.** Confirm it runs on `npm run build` AND `npm run build-no-check` (and CI's path in
   `.github/workflows/plugin-ci.yml`, and `just release` if present). Try to evade it: `createElement( 'script' )`,
   `createElement("SCRIPT")`, `createElement(\`script\`)`, and minified shapes esbuild actually emits. Build the
   BASE (0c132d8) in a scratch clone and confirm the gate would have failed there. Grep the new `main.js`
   for other things Obsidian's review scanner is known to flag (`innerHTML` assignments are out of scope;
   focus on dynamic script creation, `eval`, `new Function`) and report counts — informational.
5. **Merge resolution.** Nothing from develop lost (diff develop vs branch outside the intended files must be
   empty apart from the 3 skills); versions stay 7.0.0 in manifest/package.json; `CompendiumDownloader.ts`
   absent; CHANGELOG order sane; the 3 skills (Carpentry, Cooking, Strategy) are correctly placed in
   develop's current data shape and render/validate (schema tests). `jszip` fully gone (`git grep -i jszip`,
   `package-lock.json`, `node_modules` after `npm ci`).
6. **Docs accuracy.** versions.json, README, docs/migrating-to-7.md, CHANGELOG: every 6.0.x statement is
   true (6.0.1 = 5.1.1; 6.0.2 = 5.1.1 + fflate + 3 skills; pre-1.13 clients get 6.0.2).
7. **Freeze attribution (decisive — Scott must sanction a rebaseline).** The implementer reports 16 freeze
   mismatches (8 skills-family print + realprint pairs; list in `rebaseline.txt` in the ledger dir) and
   attributes them to the three added skills. PROVE or refute: in a scratch copy of the branch, revert ONLY
   the skills data additions (SkillsData.ts / SkillsSchema.yaml hunks from ae86693), regenerate shots, and
   confirm `check-freeze.sh` then reports 260/260 OK. Also confirm `rebaseline.txt`'s hashes equal your own
   regeneration of those 16 files on the branch tip. Any mismatch outside the skills family = HIGH.
   Then produce Scott's evidence: before (origin/develop 46c0c4c) / after (branch) side-by-side PNGs for
   `skills--steel-print.png` and `skills-chips--steel-print.png` (label each half "BEFORE develop" /
   "AFTER sc328" in text on the image; crop to the region that changed if the full shot is tall), saved to
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/evidence/sc328-freeze-<name>-before-after.png`.
   State in words what changed in each (e.g. "two new rows, Carpentry and Cooking, under Crafting").
8. **Re-run the battery yourself** (dse-verify order: tsc, lint, jest, shots, freeze, parity) and compare to
   the implementer's numbers. Expected (implementer's numbers): tsc/lint clean; jest 3937 passed / 1 skipped, 203 of 204 suites; build +
   build-no-check exit 0 with 0 gate hits; shots 524, 0 FAIL; freeze 244/260 with exactly the 16 rebaseline.txt
   lines failing; parity 0 GAPs / 0 undeclared WARNs / 16 DECLARED.

## 2. Footguns

- devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>'`; devbox eats `$?`; use wrapper script files that
  capture exit codes; never pipe a gate through `| tail`.
- Run every gate in the FOREGROUND with output to a per-run unique file. Never background a job and wait for
  a notification; never key a wait-loop on a scratch filename (stale logs from other branches exist).
  Redirect long output to files (the 600 s stream watchdog kills silent agents).
- On a timeout-shaped jest red, re-run that suite alone before believing it (machine load, see dse-verify).
- If the report-file write is blocked by your harness, return the report inline.
- You cannot SendMessage me; `to: "main"` reaches the dispatcher, not me. If you need input, end with
  STATUS: NEEDS_CONTEXT and the question. Any message you send anyway must start with `SC-328:`.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/sc328-report-review-r1.md`, opening
with a ≤10-line executive summary: verdict (APPROVE / APPROVE-WITH-FIXES / REJECT), finding counts by severity.
Then findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, prescribed
fix. Then probe results with numbers, battery numbers, and the path of every evidence file.
Final text to me: raw facts — verdict, counts, the report path, evidence paths. No prose.
