# SC-408 pilot round P2a — control ids, coverage manifests and gates, the full stamina e2e set

## 0. Context loading

1. Re-read `sc408-brief-common.md` and the ledger `decisions.md` (new entries since P1: the
   P1 result, the P2 split, B5/B6 handling, ticket keys SC-425…SC-430).
2. Your own P1 report `sc408-p1-report.md` and the design `sc408-s2-tooling.md` §4.3–§4.6.
3. The ground truth for what to cover: `sc408-s1-stamina-inventory.md` §2 (inventory rows
   E, M, A, S, T, Q, F, W, R, K — NOT PM, the pool modal is rollout) and §4 (the 8
   needs-real-Obsidian items).
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `4464180`. `git -C … fetch origin`; if `origin/develop`
   moved off `be4f002`, rebase and report it.
5. A parallel worker (P2b) is adding jsdom tests in a DIFFERENT worktree
   (`worktrees/sc408-jsdom`). Its commits get merged into your branch later. You do not
   touch that worktree. Do not create jsdom matrix tests for the stamina logic yourself —
   that is P2b's job — except the census test below.
6. Workers never call the tracker.

## 1. Task

Scott's ask (verbatim, ledger): "I want to make sure that the dozens of interactions that are
possible in the stamina modal actually function properly, for example. what is the best way
to go about this? I want the tests to be comprehensive and able to be ran relatively easily
to find regressions and other bugs."

Pilot surfaces: **StaminaEditModal**, **ds-stamina-bar** (including its RecoveriesStrip /
Catch Breath / popover), and **initiative's stamina entry points** (detail row, grid cell,
hero and creature). Make them comprehensively covered and gated.

1. **Stable control ids.** Add a `control` option to the kit factories in
   `src/framework/kit/` (iconButton, stepper, the button/input helpers — whatever the modal
   and bar actually use) that stamps `data-dse-control="<id>"`. Stamp every interactive node
   of the pilot surfaces. Naming: `<surface>.<control>`, e.g. `sedit.damage`,
   `sedit.stamina.inc`, `stamina.bar`, `recov.catch-breath`, `init.detail.stamina`,
   `init.cell.stamina`. Obsidian's own modal close button / backdrop are host controls: give
   them manifest ids resolved by the driver from Obsidian's selectors. **Attributes only — no
   rendered pixel, class or text change.** Switch your P1 specs from `{css}`/`{name}` to ids.
2. **Manifests** `e2e/manifest/stamina-edit-modal.ts` and `e2e/manifest/stamina-bar.ts`
   (+ initiative's entry points under `reach`, per S2 §4.6), seeded from S1's inventory.
   Annotate each control with the S1 row ids it covers.
3. **Three coverage checks** (S2 §4.6): (a) jsdom census `test/dom/e2eCensus.test.ts`, scoped
   to the pilot surfaces, failing on any interactive node without an id or with an id not in
   the manifest; (b) real-Obsidian census `e2e/specs/_census.e2e.ts` using CDP
   `DOMDebugger.getEventListeners` to catch non-semantic nodes with click/pointer/key
   listeners, scoped to the pilot surfaces; (c) the exercised-set gate in `run.mjs`: a FULL
   run fails (exit 1) if any manifest (control, kind) pair was exercised by zero tests,
   listing them; `--only`/`--element` runs print coverage but skip the gate. Summary line
   gains `coverage: X/Y pairs`. Prove each check bites: temporarily add an un-id'd button /
   remove a scenario, show the failure, revert.
4. **L2 scenarios** — every manifest pair at least once, end-to-end through real input,
   asserting the note file and the DOM:
   - ds-stamina-bar host: every modal control, the Catch Breath / Recoveries strip controls,
     and the entry click.
   - initiative host: open from the detail row and from a grid cell; one end-to-end edit for
     a creature and one for a hero, each asserted against the note; S1's B2 (SC-426) — if it
     reproduces, `knownBug('SC-426', …)`.
   - S1 §4's needs-real-Obsidian list, each as a scenario: B7 (swap the key to `SC-430`);
     Escape semantics (dirty-draft Escape, clean Escape, X, backdrop — record what Obsidian
     actually does, and assert "no write unless Apply"); end-to-end edit per host → note
     integrity; B2 under adoption; a real double-click on a cell with a selection write in
     between (E20); steel bar hit-testing over the stood-down numeric control (E21); an
     external edit to the note while the modal is open (W08); modal stacking (K03).
   - Known bugs reachable through shipped UI get `knownBug` with their ticket: SC-428 (Catch
     Breath at full Stamina spends a Recovery), SC-427 item 1 (typed out-of-range value: label
     disagrees with what is applied), SC-430 (B7), SC-426 (B2). SC-425 (ds-hero) and SC-429
     (pool modal) are out of the pilot's shipped surfaces.
   - B5 and B6 (ledger): pin CURRENT behaviour, title suffix
     "[current behaviour — ruling pending SC-408]".
   - Do per-test setup (call `openNote` inside each test or a shared per-test helper), not a
     throwing `beforeEach` (your P1 follow-up).
   - Ids `[STAM-…]` / `[RECOV-…]` / `[INIT-STAM-…]` in titles, unique.
5. **Docs** (part of done):
   - DSE `e2e/README.md`: update for ids, manifests, coverage gate, known-bug markers.
   - DSE `AGENTS.md`: one short bullet under Quick Start / visual harness area — "`npm run
     e2e` — functional tests in a real Obsidian (headless); see `e2e/README.md`".
   - DSE `.repo-docs/`: if there is a testing doc, add a short section; else add a pointer
     line in `.repo-docs/index.md`.
   - The workspace gate skill — **in YOUR worktree's superproject, at
     `/home/scott/code/steelCompendium/worktrees/sc408-functest/.claude/skills/dse-verify/SKILL.md`,
     never under `/home/scott/code/steelCompendium/workspace/`**: add battery step "4b. e2e"
     (`npm run e2e`, expects `OBSIDIAN-E2E done: N/M ok, 0 failed, K known-bug` + `coverage:
     Y/Y pairs`, exit 0; builds `main.js`; runs after lifecycle), the `DISPLAY=:1` footgun
     (never `--headed` on `:1` from an agent), the cache path, and the known-bug rule.
     Commit that in the superproject worktree:
     `git -C /home/scott/code/steelCompendium/worktrees/sc408-functest add .claude/skills/dse-verify/SKILL.md && git -C … commit -m "docs(SC-408): …"`.
     Do NOT commit the superproject's submodule pointer.

Commit after every coherent step. No push. No Claude/AI attribution in commit messages.

## 2. Gates (dse-verify order; absolute paths; devbox from the workspace shape)

1. `npm run tsc` clean · 2. `npm run lint` clean ·
3. `rm -f main.js styles.css` then `npx jest`: P1 measured **4451 passed / 2 skipped / 220 of
   221 suites**; expected = 4451 + your census tests, 0 failures. (Settings-tab timeouts under
   load = noise; `sidebarInitiative` "SC-288 r2" ~3% flake = SC-383.)
4. `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle` → 25/25 ok.
5. `npm run e2e` → 0 failed, coverage Y/Y; then **3 back-to-back repeats** (0 flakes
   expected; a flake is a finding — never add retries) and one `--shards=1` run for the
   serial wall time. Report per-run wall time and the scenario count.
6. `npm run shots` → 0 FAIL (expected count **568**, or report the current count if it
   differs at `be4f002`).
7. Freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/visual-harness/shots`
   → **0 FAILED** (baseline 274 lines). Attributes must not move a byte; if any frozen shot
   moves, STOP and report STATUS: NEEDS_CONTEXT with the list.
8. `npm run parity` LAST → 0 GAPs / 0 undeclared / 24 DECLARED.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-p2a-report.md`,
opening with a ≤10-line executive summary: verdict, final sha(s) (DSE + superproject docs
commit), every gate number, e2e scenario count / known-bug count / coverage pairs, wall times,
repeatability, which known bugs reproduced, Escape-semantics findings. Then: control-id list,
manifest summary, the three checks' bite proofs, deviations, NEW suspected bugs (steps,
expected vs actual, severity), evidence paths. End with `Drive-by fixes:` and `Follow-ups:`.

Return contract: final text to the ticket-owner, not a human — raw facts, shas, numbers, and
the absolute path of every evidence artifact. Copy any failure bundle you cite out of
`e2e/.out/` (12-run retention prunes it) into `/tmp/claude-1000/sc408-p2a/evidence/`. If
the report write is blocked, return it inline. If you need input, end with
`STATUS: NEEDS_CONTEXT`.
