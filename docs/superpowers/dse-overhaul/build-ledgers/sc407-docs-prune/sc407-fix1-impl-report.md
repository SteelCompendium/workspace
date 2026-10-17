# SC-407 fix round 1 report

## Executive summary
- STATUS: DONE. Final sha `e7dbaa6` on dse `sc407-docs-prune` (origin/develop still `05a6ff3`, no rebase). Not pushed.
- All six LOWs and I1 folded as prescribed; owner-DROPPED items untouched.
- Gates on `e7dbaa6`: tsc clean; lint clean; jest 4432 passed / 1 skipped / 219 of 220 suites (+2 vs 4430: the two LOW-4 guard tests, new file `test/unit/build/docsDeferredGuard.test.ts`); lifecycle 25/25; shots 568 PNGs 0 FAIL; freeze `freeze OK (274/274 ...)`; parity 0 gaps / 0 undeclared / 24 declared, rc=0 (last).
- `npm run docs-shots` rc=0 with the guard in place: 14 browser + 16 obsidian = 30; `git status` clean afterwards (no Media drift, nothing regenerated or committed).
- Link check: 229 links, 0 broken. Main checkout `data.json` md5 unchanged (`26f70430...`).

## Commits (over eef9c63)
- `e24ee89` LOW-2 (CHANGELOG roster heading), LOW-3 (running-an-encounter), LOW-6 (CHANGELOG sentence), I1 (index wording)
- `50e23c1` LOW-1 (audit §7 "ten"), plus a restore-map line about the guard
- `0d3edf7` LOW-4 (guard + tests + visual-harness/README.md)
- `e7dbaa6` LOW-5 (AGENTS.md, .repo-docs/architecture.md)

## Per finding
- LOW-1: audit line 219 "eight" -> "ten".
- LOW-2: CHANGELOG SC-318 bullet now "— and the initiative tracker's group headers —".
- LOW-3: running-an-encounter.md now says plainly the example needs the compendium synced (else "not available in this vault" card; can type a creature with `name` + `max_stamina`); minion squad is `goblin-runner` (verified in data-unified md-dse: `organization: Minion`, stamina 4; code `scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-runner`).
- LOW-4: `visual-harness/docs-deferred-guard.cjs` derives the deferred set from `deferred: true` in `src/elements/*/definition.ts` (9 ids, throws if the scan finds none); `docs-shots.mjs` calls it before capturing and hard-errors on any browser entry whose `element` or `gallery` id is deferred (obsidian entries are not checked: that half runs switch OFF). visual-harness/README.md docs-shots section states which half runs ON/OFF. Tests: (1) scan returns the nine ids, (2) rejects element/gallery deferred ids, allows shipping ids and obsidian entries.
- LOW-5: architecture.md `experimental.ts` row and AGENTS.md release-gate bullet say docs-shots forces OFF (Obsidian half) and the browser half is guarded; AGENTS.md "§11" -> "§11a".
- LOW-6: CHANGELOG SC-142 bullet now "regenerates them from the real plugin".
- I1: index.md "set up the fight, then run it".

## Drive-by fixes
None.

## Follow-ups
None new.

## Evidence
Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/fix1-logs/` (tsc, lint, jest, lifecycle, shots, freeze, docs-shots, parity, linkcheck).

## fix2 (commit `a337460`, over e7dbaa6)
- NEW-LOW-A: `docs-deferred-guard.cjs` now rejects any non-array truthy `gallery` (`gallery: true` mounts every fixture). The assertion for `{ source: 'browser', gallery: true }` was added inside the existing rejection test in `docsDeferredGuard.test.ts` rather than as a separate test, so the jest count stays 4432 (not 4433).
- NEW-LOW-B: `docs/running-an-encounter.md` now says an unsynced compendium makes the tracker show an error card saying the reference is not available in this vault.
- Gates: tsc clean, lint clean, jest 4432 passed / 1 skipped / 219 of 220; docs-shots rc=0 (30 images), `git status` clean (no Media drift); link check 229 links, 0 broken. Logs: fix1-logs/{tsc2,lint2,jest2,docs-shots2,linkcheck2}.log.
