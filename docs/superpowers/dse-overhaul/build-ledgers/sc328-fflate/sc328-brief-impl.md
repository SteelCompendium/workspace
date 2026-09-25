# SC-328 implementation brief (round 1) — DSE develop: JSZip → fflate, merge 6.0.2 forward, build gate

## 0. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/decisions.md`.
  It is the source of truth — Scott's ruling is quoted there verbatim; the "Owner calls" section is binding.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery,
  devbox shapes, freeze rules) and `draw-steel-elements/AGENTS.md` (or CLAUDE.md) in your worktree.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc328-fflate` — the repo you edit is
  `/home/scott/code/steelCompendium/worktrees/sc328-fflate/draw-steel-elements`, branch `sc328-fflate`.
  **Verify `pwd` / `git -C <repo> branch --show-current` before every write.** Never write under
  `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.
- Start: `git -C <repo> fetch origin`, confirm the branch is at `origin/develop` = `0c132d8`
  (if develop has moved, `git rebase origin/develop` BEFORE step 1 — never after the merge commit exists).
- Hard limits: never push anything; never touch dse `main`; never create tags/releases; never run
  `just deploy*`; never edit `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything under `.superpowers/`.
- **Commit after every coherent step** (conventional-commit messages prefixed with the ticket key, e.g.
  `fix(compendium): SC-328 — …`). Do NOT add any Claude/AI co-author trailer or attribution.

## 1. Merge the 6.0.2 hotfix forward (a real merge commit)

`git merge --no-ff origin/main` (brings ae86693/f860156 = #81 Carpentry/Cooking/Strategy skills and
e38d4de = the 6.0.2 fflate hotfix). Resolve conflicts:
- `manifest.json`, `package.json` `version`: develop's side (7.0.0).
- `package.json` deps: add `fflate` (devDependencies, `^0.8.3` as on main, or the current 0.8.x); REMOVE
  `jszip` and `jszip-utils`. Regenerate the tracked `package-lock.json` with `npm install` (devbox-wrapped),
  then `npm ci` to confirm it's consistent.
- `src/utils/CompendiumDownloader.ts`: develop deleted it — keep it deleted.
- `CHANGELOG.md`: develop's file wins, plus main's `## 6.0.2` entry placed ABOVE develop's `## 6.0.1`
  entry (released entries on top, the `## 7.0.0 (unreleased…)` section stays below them). Keep develop's
  longer 6.0.1 text, not main's short one.
- Skills files (`src/model/schemas/SkillsSchema.yaml`, `src/utils/SkillsData.ts`): take the three added
  skills; make sure they fit develop's current shape of those files.
Commit message: `merge: SC-328 — merge 6.0.2 hotfix (main e38d4de) forward into develop`.
The merge commit must build (step 2 may be a separate commit on top; that's fine).

## 2. Port CompendiumSyncService to fflate

Scott's ruling (verbatim from the ledger): "Port `CompendiumSyncService` to `fflate` (`unzipSync(Uint8Array)` →
`Record<path, Uint8Array>`; directory entries are keys ending in `/`), drop `jszip`/`jszip-utils`."

- `src/data/CompendiumSyncService.ts` `readZip` (~:266): `unzipSync(new Uint8Array(buffer))`, skip keys ending
  in `/`, keep zero-byte FILE entries (JSZip kept them), keep the "no files" error. Wrap a corrupt-archive
  throw so the user gets a sensible error (check what JSZip's failure path surfaced before and match it).
- Leave the path-traversal defense (`isUnsafeRelativePath`) intact. NOTE: JSZip's writer cleaned `..` on
  write; fflate hands raw names through. So the defense is now load-bearing for raw `..` entries.
- Port `test/unit/data/compendiumSyncRelease.test.ts` off JSZip to fflate `zipSync`/`strToU8`. Replace the
  stale comment at ~:146 (the "a '..' segment can't survive JSZip's writer" note) and ADD cases now that
  fflate can author raw names: `../evil.md`, `a/../../evil.md`, `a\\..\\..\\evil.md` (backslash), and a
  directory entry (`dir/`) + zero-byte file — assert rejected / skipped / kept as appropriate. If any raw
  traversal name is NOT rejected by the existing defense, STOP and report it (STATUS: NEEDS_CONTEXT) —
  do not redesign the defense on your own.
- Remove every other `jszip` mention in the repo (`git grep -n -i jszip`), incl. `.repo-docs/architecture.md:632`
  (→ fflate). package-lock is regenerated, not hand-edited.

## 3. Build gate

Scott's ruling (verbatim): "Add a build gate: fail if the production `main.js` contains `createElement(\"script\")`."
Owner call: it runs on BOTH `npm run build` and `npm run build-no-check` (CI runs `build-no-check`).
- Implement as a small Node script (e.g. `scripts/check-no-dynamic-script.mjs`) run after the esbuild
  production build in both scripts (or inside `esbuild.config.mjs`'s production path). Match, case-insensitively,
  `createElement(` + optional whitespace + `"script"`, `'script'` or `` `script` ``. On a hit: print the byte
  offset + ~80 chars of context for each hit and exit non-zero.
- Prove it: (a) clean build passes; (b) temporarily inject `document.createElement("script")` into a src file,
  build fails with the context line; revert (don't commit the injection). (c) Build the pre-change tree
  (`git stash`/a scratch checkout of 0c132d8) and show the gate WOULD fail there (JSZip's polyfills) — record
  the hit count.
- Also grep the final production `main.js` for `new Function(`, `eval(`, `setImmediate`, `"lie"`-style
  polyfill markers and report counts (informational — do not act on non-script hits, just report them).
- If `just release` exists in the DSE repo, confirm it goes through the gated build.

## 4. 6.0.1 → 6.0.2 references

Owner calls (from the ledger): versions.json `"6.0.1": "0.15.0"` → `"6.0.2": "0.15.0"` (manifest.json stays
7.0.0). User-facing text: `README.md:22`, `README.md:28`, `docs/migrating-to-7.md:4-6`, `:23`, and the
CHANGELOG 7.0.0 header line "Upgrading from 5.x or 6.0.1?" → refer to 6.0.2 / "6.0.x". Wording must be
accurate: 6.0.2 is 5.1.1 plus the zip-library swap and three added skills — it is NOT "identical to 5.1.1"
(6.0.1 still is). Keep the edits minimal and plain. Check any test that reads versions.json/README.
Add one CHANGELOG bullet under `## 7.0.0 (unreleased…)` in that section's existing `[FIX]`/`[NEW]` style:
compendium download switched JSZip → fflate (Obsidian review), and 7.0.0 includes 6.0.2's three skills.

## 5. Gates (dse-verify battery, in order, all devbox-wrapped, output redirected to files)

Run from the worktree repo with absolute paths. Last recorded battery (SC-334 landing, dse e4bcd0f):
jest 3919 passed / 1 skipped / 202 of 203 suites; shots 524, 0 FAIL; freeze 260/260; parity 0 GAPs /
0 undeclared WARNs / 16 DECLARED. develop has moved since (SC-278 at 0c132d8), so FIRST run
`npx jest` on the untouched base (before step 1) to record the true baseline, then after your work:
tsc clean, lint clean, jest = baseline + your new tests (state the delta and why), `npm run build` AND
`npm run build-no-check` exit 0 with the gate passing, shots 0 FAIL, freeze `260/260` (this change should
move NO frozen bytes — if any freeze line fails, STOP and report; do not touch the baseline; the added skills
are the only plausible cause, so check them), parity 0/0/16 DECLARED.
Footguns: devbox eats `$?` — use wrapper script files that capture exit codes, or read the tool's own
summary line; never pipe a gate through `| tail`. `npm ci` after the lockfile changes. Run every gate in the
FOREGROUND with output to a per-run unique file path — never background a gate and wait for a notification,
never key a wait-loop on a scratch filename (scratch dirs hold stale logs from other branches). Redirect
long output to files (a silent 600 s stream kills you). On a timeout-shaped jest red, re-run the suite
alone before believing it (dse-verify explains the load issue).

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc328-fflate/sc328-report-impl-r1.md`,
opening with a ≤10-line executive summary. If the file write is blocked, return the report inline.
Include: commit shas (merge + each step), conflict list and how each was resolved, the gate proof from §3
(hit counts pre/post, injection result), the §3 informational grep counts, battery numbers (baseline vs
after), `Drive-by fixes:` and `Follow-ups:` lists, and the path of every log/evidence file.

## 7. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (STATUS: DONE | NEEDS_CONTEXT | BLOCKED,
shas, measured numbers, evidence paths), no prose. You cannot SendMessage me (a depth-2 agent can't reach
its parent; `to: "main"` goes to the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the
question. If you ever message anyway, the first word must be `SC-328:`.
