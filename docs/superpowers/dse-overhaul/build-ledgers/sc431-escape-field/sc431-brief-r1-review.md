# SC-431 r1 — independent review brief

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/decisions.md` (ledger: spec + owner decisions), the implementer's brief `sc431-brief-r1-impl.md` and report `sc431-r1-impl-report.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc431-escape-field`, repo `draw-steel-elements/`, branch `sc431-escape-field`, head `56c83b8`, based on `origin/develop` `d58cf6a`. Review the diff `git -C /home/scott/code/steelCompendium/worktrees/sc431-escape-field/draw-steel-elements diff d58cf6a..56c83b8` plus the superproject worktree's CHANGELOG commit.
- You review; you do NOT edit source or commit. Probes/scratch files go under your own `sc431-r1-review-*` paths in the ledger dir or your scratchpad.
- **Workers never call the tracker** (Linear).
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` and `draw-steel-elements/e2e/README.md`.

## 2. Task

Spec, verbatim from the ledger:

> **Expected (what the code intends):** the stepper swallows Escape and reverts only the half-typed draft; the modal stays open with the Damage still pending.
>
> **Fix direction:** register the draft-cancel on the modal's Obsidian `Scope` (or intercept Escape in the capture phase) so the first Escape cancels the draft and a second Escape closes the modal. The e2e scenario that records the current behaviour should then flip to asserting the intended one.

Adversarial review — **execute and probe, not just read**. At minimum:
1. Re-run e2e and lifecycle yourself (foreground). Confirm STAM-S06 passes as a plain test (no known-bug marker) and the Temporary Stamina scenario exists and passes. Confirm STAM-S07 / STAM-F07a (clean-draft Escape closes, no write) still pass.
2. Mutation probe: revert only the source fix (keep the tests) in a scratch copy / `git stash` on a throwaway worktree — NOT the shared branch — and show the new tests go red. A test that stays green without the fix is vacuous.
3. Edge cases in real Obsidian (write an ad-hoc e2e spec in a scratch location, or extend locally without committing): Escape on dirty draft in Stamina field then in Temp field in the same modal session; three Escapes (draft, close, nothing thrown); Escape while focus is on a non-stepper control with pending Damage (should close and discard, per F07a); close + reopen modal several times then Escape-with-draft (listener leak / stale-handler firing on a closed modal); IME / composition not required. Escape on a stepper that lives outside a modal (inline in a note, if one exists) must not regress.
4. Check the listener/Scope registration is torn down on close (no leak across opens), and that the handler cannot fire for a stepper in a different, already-closed modal.
5. Check every other stepper consumer (grep the stepper helper's call sites) — does the change alter behaviour anywhere else? Is that alteration correct?
6. Review the implementer's Follow-ups survey for accuracy (other Escape-in-modal controls with the same bug).
7. CHANGELOG bullet: user-facing, plain, in the worktree superproject under `## Unreleased`.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario for each, and a prescribed fix.

## 3. Gates

Expected (implementer-reported at `56c83b8`): tsc/lint clean; jest 4967 passed / 1 skipped / 229 of 230 suites (+17 vs baseline; implementer added 15 and did not explain the other 2 — explain them); lifecycle 26/26; e2e `73/77 ok, 0 failed, 4 known-bug, coverage: 52/52 pairs`; shots 572 0 FAIL; freeze 276/276; parity 0/0/24. Note: a fresh worktree needs `npm run host-css` (gitignored output) or one more jest test skips. Baselines at `d58cf6a`: jest 4950/1 skipped/229 of 230 suites; lifecycle 26/26; e2e 71/76 ok, 0 failed, 5 known-bug, coverage 51/51; shots 572 0 FAIL; freeze 276/276; parity 0 GAPs / 0 undeclared / 24 DECLARED. You need re-run only tsc, lint, jest, lifecycle, e2e; spot-check others only if the diff could touch visuals.

Command shape: `devbox run -c <dse abs path> -- bash -c 'cd <dse abs path> && npm run e2e > <ledger dir>/sc431-r1-review-e2e-<unique>.log 2>&1; echo rc=$? >> <same log>'`. Run gates in the FOREGROUND (timeout ≤600000 ms). Never pipe a gate through `| tail` (devbox eats exit codes).

Footguns (mandatory):
- `git -C <absolute path>` for every git command; never `cd X; git …`. Never commit/reset/stash on the shared branch `sc431-escape-field`; for mutation probes make a throwaway `git worktree add` at an absolute scratch path (and remove it after) or copy the tree.
- Never `pkill`/`killall` by pattern — kill only by PID whose command line contains your own path.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`); delete only paths you created and recorded.
- Never `rm -rf` `.superpowers/` or anything not yours.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- A timeout-shaped red: re-run once before believing it.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/sc431-r1-review-report.md`. If the write is blocked, return the report inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human — raw facts: verdict (LAND-READY / FIX-REQUIRED), findings list by severity with file:line, measured gate lines + exit codes, mutation-probe result, and the path of every artifact. The report file opens with a ≤10-line executive summary.

You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-431:`.

## Addendum (owner, after r1)

- Mechanism the implementer chose: `DseModal` overrides the undocumented `onEscapeKey` (cast; not in `obsidian.d.ts`) that the Modal constructor binds as the Scope's Escape handler; a new registry `src/framework/kit/draftCancel.ts` holds focused-field cancelers. Scrutinise: is relying on `onEscapeKey` sound across the Obsidian versions the plugin supports (check `manifest.json` `minAppVersion` and decompile/inspect the vendored Obsidian `app.js` in the e2e harness to confirm how `onEscapeKey` is bound — is it bound by reference at construction, so a prototype override works, or looked up at call time?). Is there a sturdier public-API alternative (e.g. `this.scope.register` with an earlier precedence, or `Scope` key handler ordering)? Prescribe one if so.
- Implementer's follow-up 1 (owner is folding it into the fix round): `src/views/ConditionsModal.ts:570` combobox Escape does `stopPropagation` + `closeAdd()` but the Scope runs first, so it likely closes the whole Conditions modal. **Probe this in real Obsidian** and report the actual behaviour, so the fix round has evidence.
