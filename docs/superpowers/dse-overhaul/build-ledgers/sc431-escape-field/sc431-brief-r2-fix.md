# SC-431 r2 — fix round brief (implementer)

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/decisions.md` (read the "Review rulings" block). Prior reports: `sc431-r1-impl-report.md`, `sc431-r1-review-report.md` (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc431-escape-field`; dse repo `draw-steel-elements/`, branch `sc431-escape-field`, head `56c83b8`. Superproject worktree CHANGELOG commit `a7f5d96`.
- **FIRST: rebase onto dse `origin/develop` = `7817133`** (SC-360 landed; unrelated sidebar YAML change). `git -C /home/scott/code/steelCompendium/worktrees/sc431-escape-field/draw-steel-elements fetch origin && git -C … rebase 7817133`. Run `npm ci` if `package.json` changed. Report the new sha.
- **Never call the tracker.** Main checkout dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault — expected, ignore.
- The workspace-level CHANGELOG lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc431-escape-field/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. Task — reviewer findings verbatim, with the owner's ruling (all FOLD)

1. **ConditionsModal combobox (confirmed in real Obsidian, probe PRB-06: Escape in the add-condition dropdown closes the whole Conditions modal, 0 modals open afterwards).** Reviewer's prescribed fix, owned by `this.lifecycle`:
   ```ts
   registerDraftCancel(input, () => { if (!this.addOpen) return false; this.closeAdd(); return true; }, this.lifecycle)
   ```
   - Switch its jest test to the stand-in keymap (`test/dom/_obsidianKeymap.ts`) so it sees the real ordering.
   - Add an e2e scenario (Escape with the add dropdown open closes only the dropdown, the Conditions modal stays open; a second Escape closes the modal; no write). It needs control ids and manifest rows (`e2e/manifest/*.ts`) so the coverage gate stays Y/Y. The reviewer's probe spec `sc431-r1-review-probe.e2e.ts` and failure bundle `sc431-r1-review-prb06-bundle/` in the ledger dir show how PRB-06 drove it.
   - Only the dropdown-open case is in scope; do not change what Escape does with the dropdown closed.
   - The `ConditionsModal` must be (or be made) a `DseModal` for the `onEscapeKey` override to apply — verify; if it is not, report how you wired it, in ≤3 lines.
2. **Rename the registry** — reviewer: "Consider renaming the registry (e.g. `registerEscapeConsumer`), since it would no longer only cancel drafts." Owner ruling: do it (file, function, and the `cancelDraftAt`-style helper names + test titles), keep the semantics.
3. **LOW-1, `CHANGELOG.md:17`:** "the number fields in the initiative minion Stamina window" overclaims. Only the pool stepper (`MinionStaminaPoolModal.ts:118`) is draft-first; the damage (`:144`) and minion-count (`:156`) boxes still close the window. Reword to "the pool Stamina field". Also extend the bullet to cover the Conditions window's add dropdown, in plain user-facing words.
4. **LOW-2, `test/dom/kit/managedModal.test.ts:490` (same pattern at `stamina-edit-modal.test.ts:1015`):** `detach()` runs at the end of each test, so a failed assertion leaves the stand-in keymap listener attached. Later Escapes then hit the dead modal first and the failures cascade: 4 of M1's 9 jest failures pass in isolation. Fix: detach in `afterEach` or `try/finally`. Apply to every test that attaches the stand-in keymap, including the new ConditionsModal ones.
5. **LOW-3, `managedModal.test.ts:572`:** the "torn down on close" test is vacuous. The closed modal's input is detached, so the event never reaches the window listener and the test passes even with the teardown deleted. Assert via `cancelDraftAt` (renamed per item 2) instead, or retitle it. Owner prefers the real assertion. **Prove it non-vacuous:** temporarily delete the teardown, show the test goes red, restore (do not commit the mutation); record the result.

Out of scope (owner DROPPED, do not do): a minion e2e fixture for the pool modal; an Escape-target-inside-modal check; anything else about the `onEscapeKey` host pin.

Commit after each coherent step. Do NOT push. Never tag.

## 3. Gates (full dse-verify battery on the final rebased head, in order)

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Baselines at `7817133`: jest **5013 passed / 1 skipped / 229 of 230 suites**; lifecycle **26/26**; e2e **71/76 ok, 0 failed, 5 known-bug, coverage 51/51 pairs**; shots **572** + `pressed toggle parity OK (96 comparisons …)`; freeze **276/276**; parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after r2: tsc/lint clean; jest ≈ 5013 + 17 (r1) + your new tests, 0 failed; lifecycle 26/26; e2e **74/78 ok, 0 failed, 4 known-bug**, coverage Y/Y (≥52/52; +rows for the Conditions scenario); shots 572 0 FAIL; freeze 276/276 (if red, STOP — never touch the baseline); parity 0/0/24. Fresh worktree: `npm run host-css` first or one more jest test skips.

Command shape: `devbox run -c <dse abs path> -- bash -c 'cd <dse abs path> && npm run e2e > /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/sc431-r2-e2e-<unique>.log 2>&1; echo rc=$? >> <same log>'` (or the wrapper `sc431-r1-run.sh` pattern). Never pipe a gate through `| tail`. **Run every gate in the FOREGROUND** (timeout ≤600000 ms per call) — a backgrounded gate's notification will not wake you.

Footguns (mandatory):
- `git -C <absolute path>` for every git command; never `cd X; git …`.
- Never `pkill`/`killall` by pattern — kill only a PID whose command line contains `worktrees/sc431-escape-field/`.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`); delete only paths you created and recorded.
- Never `rm -rf` `.superpowers/` or any non-`sc431-` file in it.
- Timeout-shaped red: re-run once before believing it.
- Phantom red in `token-coverage.test.ts`: stale superproject pin — use `DSE_TOKEN_MAP_PATH` → main checkout's `docs/superpowers/dse-overhaul/D3-token-map.md`.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/sc431-r2-fix-report.md`, logs prefixed `sc431-r2-`. If the write is blocked, return inline.

## 5. Return contract

Final text to the ticket-owner, raw facts: STATUS; new dse head sha + commit list since `7817133`; superproject CHANGELOG sha; per-item done/how (≤2 lines each); LOW-3 mutation result; each gate's exact line + rc; `Drive-by fixes:` / `Follow-ups:`; path of every artifact. Report opens with a ≤10-line executive summary. You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-431:`.
