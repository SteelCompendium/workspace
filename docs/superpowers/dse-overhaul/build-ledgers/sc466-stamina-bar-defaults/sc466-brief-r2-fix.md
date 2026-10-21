# SC-466 r2 fix brief (implementer A, resumed)

## 1. Context

- Re-read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/decisions.md` (new "Review rulings" section) and the reviewer's report `sc466-r1-review-report.md` (LOW-2 section) in the same dir.
- Same worktree/branch: `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements`, branch `sc466-stamina-bar-defaults`, currently `e0e2fdc` on `0ce76dd`. `git -C … fetch origin`; if `origin/develop` is no longer `0ce76dd`, rebase and say so. Verify `pwd`/branch before any write.
- Workers never call the tracker. Scott's live-vault dirt in the main checkout is expected.

## 2. The task

Owner ruling (verbatim from the ledger):

> LOW-2 (`model.ts:60` hasOwnProperty counts a key present-but-`undefined` as declared; FormModal clear-field -> `height: 1` written): FOLD. One-line fix `declared[key] === undefined` = absent, plus a jest test feeding parse data with `height: undefined` (and one for a cleared textarea-style string key if applicable).

Reviewer's finding (verbatim):

> - Where: `src/elements/stamina-bar/model.ts:60`, `!Object.prototype.hasOwnProperty.call(declared, key)`.
> - Scenario: only FormModal's `working` can hold an `undefined` value. `parseYaml` never produces one. The cases are `FormModal.ts:149` (a cleared number field becomes `undefined`) and `FormModal.ts:129` (a cleared textarea). Example: type a Height, then clear it, then Save. `height: 1` is written, a key the user never kept (probe B4: `{…, height: undefined}` serializes to `…\nheight: 1`).
> - Prescribed fix (optional, one line): treat `declared[key] === undefined` as absent, i.e. `.filter((key) => declared[key] === undefined)`. Mutation M6 (exactly this change) keeps all 89 implementer tests green, so it is safe. A test would need a FormModal clear-field case.

Do: write the failing test(s) first (commit), then the fix (commit). Update the model.ts comment that describes "declared" to say a key present with value `undefined` counts as absent.

OUT OF SCOPE (filed, do not touch): SC-483 — the FormModal select seeding `style: default` (LOW-1); SC-482 — other ComponentWrapper blocks. Do not edit `src/authoring/FormModal.ts`.

## 3. Gates — full dse-verify battery in order

Expected after your change: tsc (incl. `tsc -p e2e`) and lint clean · jest **5423 + your new tests / 1 skipped / 232 of 233** (after a shots run) · lifecycle **29/29** · e2e **89/93 ok, 0 failed, 4 known-bug, coverage 64/64** · shots **572**, 0 FAIL · freeze **276/276** (any delta = STOP and report) · parity **0 / 0 / 24 DECLARED**.

**Exit-code capture changed (review INFO-3):** `devbox run … bash -c '…; echo rc=$? > file'` always records rc=0 under devbox. Instead write a script file (Write tool) in your private scratch dir that runs the gate, redirects output to a log and writes its own rc file, and run it with `devbox run -c /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements -- bash <abs path to script>`. Take gate numbers from the summary lines in the logs, not only from rc.

Run rules (unchanged): one gate per Bash call; never a compound `cd X && devbox …`; `rm -f main.js styles.css` in the plugin root before jest; private scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r2-impl-a1/` with unique names; Write tool for scratch files; no glob `rm`; own `DSE_LIFECYCLE_PORT` (9293); never `pkill`/`killall` by pattern (PID with `worktrees/sc466-stamina-bar-defaults/` only); never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; never `--headed`/`DISPLAY=:1`; redirect long output to files; run gates in the FOREGROUND; never key a wait-loop on a scratch filename or its contents; `git -C <abs path>` for every git command; no tags/pushes; no AI attribution in commits.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/sc466-r2-fix-report.md`, opening with a ≤10-line executive summary (shas, gate numbers, e2e run id). If the write is blocked, return it inline.

## 5. Return contract

Raw facts to the ticket-owner: STATUS, new sha(s), measured gate numbers, paths of every artifact. You cannot `SendMessage` me; need input → STATUS: NEEDS_CONTEXT. If you message anyway, first word `SC-466:`.
