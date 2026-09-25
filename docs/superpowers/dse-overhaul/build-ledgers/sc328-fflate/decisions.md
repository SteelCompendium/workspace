# SC-328 decisions ledger (effort: sc328-fflate)

Ticket: SC-328 "DSE 7.0.0: replace JSZip with fflate (Obsidian review rejects JSZip's dynamic <script> polyfills)"
Worktree: /home/scott/code/steelCompendium/worktrees/sc328-fflate (branch `sc328-fflate` in every submodule)
Repo in scope: draw-steel-elements (tracked branch `develop`; NEVER touch DSE `main`; NEVER tag/release).
Base at start: dse origin/develop = 0c132d8 (SC-278). origin/main = e38d4de (= tag 6.0.2).

## Scott's rulings (verbatim, dated)

2026-09-18 — ticket description (Scott, the ticket's author):

> **To do on develop:**
>
> * Port `CompendiumSyncService` to `fflate` (`unzipSync(Uint8Array)` → `Record<path, Uint8Array>`; directory entries are keys ending in `/`), drop `jszip`/`jszip-utils`.
> * Add a build gate: fail if the production `main.js` contains `createElement("script")`.
> * When the 6.0.2 hotfix is merged forward, reconcile the CHANGELOG 6.0.2 entry into develop's CHANGELOG.
>
> **Update 2026-09-18:** 6.0.2 is released (dse `main` = tag `6.0.2` = `e38d4de`). Additional develop to-dos: bump `manifest.json`/`versions.json` "latest released" from 6.0.1 → 6.0.2, and update the 6.0.1 references in `docs/migrating-to-7.md`. Also: `main`'s `npm run build` (and so `just release`) fails on 11 pre-existing type errors from unlocked deps (`package-lock.json` is gitignored) — 6.0.2 was built with `build-no-check`.

No comments on the ticket as of 2026-09-23.

## Owner calls (ticket-owner judgment, 2026-09-23 — not Scott rulings)

1. **Merge `origin/main` (e38d4de) into the branch — a real merge commit, not a cherry-pick.**
   The release model (docs/git-workflow.md, SC-163) advances dse `main` by FAST-FORWARD to a
   develop sha. main has 3 commits develop lacks (ae86693 + f860156 = #81 Carpentry/Cooking/
   Strategy skills; e38d4de = 6.0.2 fflate hotfix). Without a merge, the 7.0.0 release cannot
   fast-forward. The ticket's own wording ("when the 6.0.2 hotfix is merged forward") expects it.
   Resolution: develop's side wins for version fields (manifest 7.0.0, package.json 7.0.0);
   `src/utils/CompendiumDownloader.ts` stays deleted (develop removed it); the #81 skills come in.
   LANDING NOTE: the branch carries a merge commit — it must not be flattened by a plain rebase.
2. versions.json: replace `"6.0.1": "0.15.0"` with `"6.0.2": "0.15.0"` (ticket: "bump … from 6.0.1 → 6.0.2").
   manifest.json on develop is 7.0.0 and has no 6.0.1 reference — nothing to bump there.
3. User-facing 6.0.1 references on develop (README.md:22, :28; docs/migrating-to-7.md:4-6, :23)
   move to 6.0.2 / "6.0.x" with accurate wording: 6.0.2 = 5.1.1 + zip-library swap + 3 skills
   (it is no longer "identical to 5.1.1").
4. The build gate runs on BOTH `npm run build` and `npm run build-no-check` (CI uses the latter).
5. The `main`-branch type-error note in the ticket is informational (6.0.2 already shipped) — out of scope.
6. `unzipSync` (sync, main thread) — same as the 6.0.2 hotfix; fflate's async `unzip` spins
   Web Workers and is not wanted.
7. (2026-09-24) origin/develop moved to 46c0c4c (SC-241). The branch holds a merge commit of dse main, so it
   is NOT flattened by a plain rebase: bring develop in with `git merge origin/develop` (routine CHANGELOG
   conflict — keep both sides' bullets). The land-stack FF check (origin/develop ancestor of branch) then passes.
   The final battery runs on the post-merge tip.
8. (2026-09-24) origin/develop moved again to f6fb208 (SC-240: initiative resolveRefs/view + tests + CHANGELOG
   bullet; freeze 260/260 at that tip). The reviewer is mid-review on 0d4ee5f, so the tree is NOT moved under it.
   The fix round merges origin/develop (f6fb208 or newer) along with the review fixes, re-runs the battery, and
   the scoped re-review covers that merge too.

## Review r1 rulings (owner, 2026-09-24) — reviewer verdict APPROVE, 0 BLOCKER/HIGH/MEDIUM, 5 LOW, 10 INFO
- LOW-1..LOW-5: FOLD into fix round 1 (all small, same files).
- INFO-1 (notice may not paint before sync unzip): FOLD — yield one macrotask before unzipSync.
- INFO-5 (empty entry name ""): FOLD — skip empty names in readZip.
- INFO-7 (duplicate concurrent production build in checkNoDynamicScript.test.ts): FOLD — keep the detector unit
  tests, drop the test's own production build (cssNesting.test.ts's build already runs the wired gate).
- INFO-9 (skills print shots clipped at 2400 px): FILED SC-349 (Backlog) — OUT OF SCOPE for this branch.
- INFO-4 (no CRC/size cap): DROP — same as before the change; source is a GitHub release over HTTPS.
- INFO-8 (evil merge / non-bisectable intermediate commit): DROP — rewriting merge history is riskier than the bisect cost.
- INFO-2, 3, 6: no action (informational, no defect). INFO-10: shared-checkout dirt is another session's; relayed to dispatcher.
- Re-review r1 (db2a206): APPROVE, 0 findings above INFO. RR-INFO-1 (CLI guard realpath throws on a
  nonexistent argv[1]) and RR-INFO-2 (createElementNS branch stops at first ")") — DROP: no importer/emitted shape triggers them.
- OPEN: freeze rebaseline of 16 skills lines (rebaseline.txt) needs Scott's written sanction on SC-328.

## Scott ruling 2026-09-24 11:44 UTC (comment afd0e15a-7db4-492f-b9ae-7bb58987bf40), verbatim, answering the
## ask "may I rebaseline 16 frozen print screenshots of the Skills element? … Reply "sanctioned"":
> sanctioned
Scope of the sanction: the skills-family lines moved by the 3 merged-in skills (Carpentry, Cooking, Strategy).
Any moved line OUTSIDE the skills family is NOT covered and needs a new ask.
9. (2026-09-24) origin/develop moved to 3b25127 (SC-343 → 48ac20c, SC-288 → 3b25127). Merge in (no flatten),
   re-run battery, refresh rebaseline.txt if the skills-line hashes changed.
10. (2026-09-24) Final tip c524fd2 (merge develop 3b25127). Battery green; freeze 244/260 = the sanctioned 16
    lines, rebaseline.txt unchanged (16 lines). Owner-verified: FF-safe onto origin/develop, tree clean, CHANGELOG
    merge lost no line except develop's superseded "5.x or 6.0.1?" header (replaced by "6.0.x" per LOW-4). LAND-READY.
