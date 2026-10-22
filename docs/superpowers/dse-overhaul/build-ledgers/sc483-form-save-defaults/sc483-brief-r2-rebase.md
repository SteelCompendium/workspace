# SC-483 r2 brief (implementer A, resumed): review fixes + rebase onto 8d075db

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-decisions.md` (latest entries: develop moves to 772c3cd then 8d075db, r2 ruling, review rulings).
- Review report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r1-review-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults`. Plugin branch at `b6f73ed` (3 commits on `bc4a0c5`). Superproject branch at `f1f4dff` (CHANGELOG on `5cc6196`).
- Before starting: confirm `git -C <plugin repo> status --porcelain` is empty and `pgrep -af "worktrees/sc483-form-save-defaults/"` shows nothing (the reviewer may still be tidying). If either is not clear, end with STATUS: NEEDS_CONTEXT; do not wait in a loop.
- Workers never call the tracker. Scott's live-vault dirt in the main checkout is expected.

## 2. The task

Review fixes first (quoted verbatim from the ledger's review rulings; commit red test, then fix, before rebasing):

> LOW-1 (an empty schema'd block, e.g. empty ds-roll, saved untouched writes `{}\n`; FormModal.ts:217-224): FOLD. In `stringifyWorking`, an empty data object emits '' for the body (keep the `prefs:` prefix if present). Jest case: empty-source schema'd element with only optional selects, saved untouched, writes ''.

> INFO-2 (elements without `serialize` get a blank line before the closing fence — stringifyYaml's trailing `\n` plus the host splice's own line break; FormModal.ts:223): FOLD — same function as LOW-1, and it is a byte the user never typed. Trim the trailing newline of the stringify-path body so skills/roll Saves end like stamina's. Jest case asserting the written note has no blank line before the closing fence.

> INFO-4 (required-select guard covers top-level and allOf `required` only, not if/then / dependentRequired / oneOf): FOLD as a doc comment on the guard; no behaviour change.

Check for INFO-2: confirm what the host splice (`replaceSource` -> `replaceFenceBlock`) does with an empty body and with a body lacking a trailing newline, so an empty ds-roll Save leaves a well-formed empty fence (no stray blank line, no fence merged onto the body line). The prefs-prefix path must still end with exactly one line break between `prefs:` and the body.

Out of scope (filed; do not touch): SC-488 (dropdown shows enum[0]), SC-489 (validation transforms rewrite values), SC-492 (stamina pencil also opens the Stamina modal), SC-482 (model serializers).

Then:
1. `git -C …/draw-steel-elements fetch origin`, confirm `origin/develop` is `8d075db` (or newer — say so), rebase onto it.
2. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults fetch origin`, rebase the superproject branch onto `origin/main` (report its sha). Keep the CHANGELOG bullet under `## Unreleased`; resolve CHANGELOG conflicts by keeping both sides' bullets. Do not commit a submodule pointer bump.
3. `npm ci` only if `package.json`/lock changed across the rebase.
4. Report EVERY conflict: file, hand-resolved y/n, what you chose.
5. Full dse-verify battery, in order, on the rebased tip.

## 3. Gates — expected at 8d075db + this branch

tsc (incl. `tsc -p e2e`) and lint clean · jest **5564 (5552 + our 12, plus any r2 tests) / 1 skipped / 234 of 235** (after a shots run) · lifecycle **31/31** · e2e **89/93 ok, 0 failed, 4 known-bug, coverage 64/64** · shots **580**, 0 FAIL, with `text scale OK (1626 …)` and `text scale once OK (104184 / 208 loads …)` · freeze **280/280** (any delta = STOP and report) · parity **0 / 0 / 24 DECLARED**.

Same run rules as your r1 brief (`sc483-brief-r1-impl.md` §3): script files via `devbox run -c /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/draw-steel-elements -- bash <abs script>`, writing their own rc; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r2-impl-a/` with per-run unique log names (do not reuse r1 logs); one gate per Bash call; no compound `cd`; `git -C` everywhere; `rm -f main.js styles.css` before jest; no glob `rm`; `DSE_LIFECYCLE_PORT=9297`; PID-only kills of processes proven yours; never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; never `--headed`/`DISPLAY=:1`; output to files; foreground gates under the 600 s watchdog; never key a wait-loop on a scratch filename or its contents; no pushes, no tags, no AI attribution.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r2-report.md`, ≤10-line executive summary first (plugin sha + commits, superproject sha, conflicts y/n, gate numbers, e2e run id). If the write is blocked, return it inline.

## 5. Return contract

Raw facts: STATUS, shas, conflicts, measured numbers, artifact paths. You cannot `SendMessage` me; need input → STATUS: NEEDS_CONTEXT. If you message anyway, first word `SC-483:`.
