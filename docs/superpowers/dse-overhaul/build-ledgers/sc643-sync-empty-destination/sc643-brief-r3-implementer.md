# SC-643 r3 — fix round + rebase (implementer, resumed)

Context: same worktree, same rules and footguns as your r1 brief
(`sc643-brief-r1-implementer.md`, all of §4 still applies: no `rm` in /tmp or scratch, `git -C <abs>`, script
files for exit codes, no pattern kills, no background-notice waits, never `--headed`, never a real Sync / move /
trash on any vault but a throwaway test vault). Read the ledger `decisions.md` again: the entries
"Baseline move … SC-625", "r2 result" and "r3" are new. The r2 review is `sc643-r2-review-report.md` (read the
summary and the L1 / L2 / L3 sections). Never call the tracker. Use a fresh private scratch folder
`…/scratchpad/sc643-r3-impl/`.

## Tasks

1. **Rebase the plugin branch onto dse `develop` `76520b1f`** (`git -C <plugin abs> fetch origin` first; if
   `origin/develop` moved past `76520b1f`, rebase onto the new tip and report it). SC-625 touched only montage
   code; expect no conflict.
2. **L1 (fold):** in the legacy-window choice callback (~`main.ts:799-812`), if the re-resolved root differs
   from the root the window offered, show a Notice (plain words: the Destination folder changed while the window
   was open; nothing was moved; run Sync again) and do nothing: no trash, no sync. Test it, including the
   reviewer's probe shape (window offered `DS Compendium`, setting changed to `Notes` → nothing trashed, nothing
   written, every file byte-identical).
3. **L2 (fold):** tests that kill the reviewer's surviving mutants M12 (`syncAnyway` re-read, ~`main.ts:905`),
   M13 (`syncAfter` re-read, ~`main.ts:917`), M14 (`offerMigration` guard, ~`main.ts:847`). Prove each new test
   goes red with its guard removed (report it). M19 is dropped — no test.
4. **L3 (fold):**
   - Correct the comment at `src/views/LegacyCompendiumModal.ts:11-12`: the trash is NOT always recoverable
     (real `trashFile` deletes permanently when Obsidian's "Deleted files" option is "Permanently delete"). Comment
     only; no behaviour change (that is SC-653, out of scope).
   - `draw-steel-elements/docs/compendium-sync.md` (~lines 35-38): say that a blank or spaces-only Destination
     folder means `DS Compendium`, that spaces at the ends are ignored, and that a Destination at the vault root or
     outside the vault is refused with a Notice.
   - CHANGELOG: add the bullet in
     `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-changelog-bullet.md`
     verbatim as the FIRST bullet under `## Unreleased` in YOUR worktree superproject's
     `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/CHANGELOG.md` — NEVER the file under
     `/home/scott/code/steelCompendium/workspace/`. If your Notice wording or behaviour differs from the bullet,
     adjust the bullet to match the code and report the diff.
5. **Superproject branch** (`/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination`, branch
   `sc643-sync-empty-destination`): `git -C <that path> fetch origin`, rebase onto `origin/main` (report its sha),
   then exactly TWO commits on top: `docs(SC-643): changelog …` and ONE pointer bump
   `chore: bump draw-steel-elements to <final dse sha> (SC-643: …)`. If you have to amend the dse head after the
   bump, re-make the single bump commit (amend it); there must be no interim pointer commits. Do not push.
   No other submodule pointer may change: `git -C <superproject> diff origin/main --stat` must show only
   `CHANGELOG.md` and `draw-steel-elements`.

Out of scope (filed, do not touch): SC-653 (the window offers to trash any non-empty folder), SC-654 (INIT-W10
flake), SC-440's `settings-matrix.test.ts` (`syncOptions()?.releaseTag` is fixed by whoever lands second), any e2e
spec change.

## Gates — expected at `76520b1f` plus your tests

tsc + lint clean · jest fresh **12575 passed / 2 skipped** at base, so about **12671 / 2 plus your r3 tests** ·
lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`**.
`styles.css` sha256 must stay `18730938…f1f9` (or equal to a build of `76520b1f`) → shots / freeze / parity carry;
report both hashes. If it differs, run shots, freeze, parity (shots 592, host-leak 163/978, modal 40/240, clip 147;
freeze 280/280; parity 0/0/24).

Run tsc, lint, full jest, lifecycle (all SEVEN parts, `--only=A,B,…` WITH the equals sign — with a space it runs
the whole suite; part lists in r1 brief §3; one part per call, logs per part, poll your own pid), full e2e.
INIT-W10 (SC-654) failed once under load in the r2 review: if it alone fails, re-run the full e2e once and report
both runs; any other failure is real.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-r3-implementer-report.md`,
≤10-line executive summary first. Return contract as in r1: raw facts — final dse head + commit list, superproject
head + its two commits + the `origin/main` sha it sits on, every gate line, red-without-guard proofs, styles.css
hashes, the CHANGELOG bullet as committed, `Drive-by fixes:` / `Follow-ups:`, and absolute paths of every artifact.
If you need input: `STATUS: NEEDS_CONTEXT` and the question.
