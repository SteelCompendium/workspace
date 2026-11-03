# SC-552 r2 brief — implement B+K wide, tests, G-S64, full battery

You are the r2 implementer for Linear ticket SC-552. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)
- Ledger (current state, rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/decisions.md`. Read all of it, especially "Owner rulings on r1".
- Design: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-r1-diag-report.md` §2 (mechanism), §3 B / K / Wide, §4 (overlap), §5 (test design: jest list, jest mutants j1-j7, G-S64 phases (a)-(o), lifecycle mutants M1-M6).
- Prototype patches to start from (they are prototypes, not final code): `.../sc552-r1-proto-pbk.patch` (B+K) and `.../sc552-r1-proto-pbw.patch` (wide). Probe scripts `sc552-r1-probe-*` in the same dir if you want them. All built on 711f740d.
- Prior art: SC-519 (`openAfterPendingWrite`, G-S45 debounce-timer hold) and SC-544 (`ViewRegistry.flushPendingWrites`, G-S61 twin fixtures) ledgers under `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click`; plugin `.../draw-steel-elements`, branch `sc552-twin-form-after-click`, currently at 711f740d with no commits. **First:** `git -C /home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements fetch origin`, then rebase/fast-forward onto **`367a2f1d`** (SC-551 landed: lifecycle and the obsidian-shots camera now start Obsidian with `--remote-debugging-port=0` and use only a port proven theirs by `scripts/cdp-owned.mjs`; the start-up blocks of `visual-harness/obsidian-lifecycle.mjs` and `obsidian-camera.mjs` changed). If `origin/develop` is past 367a2f1d, use 367a2f1d and report the newer sha. Run `npm ci` if `package.json` changed. Verify `pwd`-equivalent: every write path must be under the worktree.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, footguns, "never a timed delay inside a lifecycle step") and the plugin's `AGENTS.md`.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and is expected. Never touch `/home/scott/code/steelCompendium/workspace/draw-steel-elements`.

## 2. The task
Implement the owner's ruling, quoted verbatim from the ledger:

> - SCOPE: take **B+K WIDE**. It covers SC-549 (measured). This widens scope beyond SC-552; said so to the dispatcher (SendMessage) and on the land-ready comment. The wide pin is its OWN commit so review can drop it cleanly if it misbehaves. SC-549 is closed by this landing only if the review confirms the SC-549 phases.
> - K risk (block deleted while its form is open and the view released; Save would fall back to a twin): FOLD — a kept-open (K) form's Save is strict: a pin that cannot be placed -> no write, the existing "changed on disk first" Notice, form stays open. Forms that were not kept open keep today's fallback.
> - Unterminated trailing fence: FOLD — `pinnedTarget` also places a pin on an unterminated trailing fence (same rule as `locateUnterminatedTrailingFence`), so pinned writes and the K-strict Save work there; G-S6u/G-S28 must stay green.
> - Registry close-callback build-up: FOLD — use a child Component of the registry (or equivalent) removed when the form closes; no growth across opens.
> - Global strict ("a pinned write goes to its pin or nowhere" for every form): DROP from this ticket; FILE a Backlog ticket (outside/Sync edit of the form's OWN block while it is open still writes into a twin; needs Scott's call, relates to SC-480).
> - r5 script-only case (two writers to one block behind the modal): DROP — not reachable by a person (the modal covers the card; SC-519 already flushes the form's own write before opening).
> - K narrows the "form closes when its view unloads" contract (FormModal.ts:17, F1 §4.5) for one case: ACCEPT, document it in the code comment and .repo-docs/architecture.md. SC-523's own LP self-close stays SC-523's.

Out of scope (filed / other owners): global strict = **SC-556**; SC-523 (LP pencil / LP self-close); SC-480 (no body search, no new refusal among equal twins); SC-545, SC-472 (`previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`), the SC-540 click shield in `pipeline.ts` — do not touch.

### Commit plan (commit after every coherent step; separate commits so review can range-diff)
1. Red tests (jest) for B and K — show them failing on 367a2f1d; save the red log.
2. B: `host/lineMap.ts` + `BlockHost.pinPosition?` + `replaceSource({ pin })` + `pinnedTarget` (incl. the unterminated-trailing-fence case) + `FormModal` pins at construction, Save passes the pin.
3. K: kept-open pinned form via a child Component of the registry, removed on close; K-strict Save (pin cannot be placed → no write, "changed on disk first" Notice, form stays open).
4. Wide (its OWN commit): pin each card's first click of a pending round (`pendingPin` in `notePersistIntent`); the view's `fromView` write uses and clears it; jest for it.
5. G-S64 lifecycle scenario in `visual-harness/obsidian-lifecycle.mjs`, placed in part 3 after G-S52 (part 3 becomes `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S64`), written against the post-SC-551 start-up block. Phases (a)-(o) from report §5, plus two folds: **(p)** K-strict: RV c2, + 0 held, form on block 1, fire, form stays open, then delete block 1's fence from outside, Save → no write, Notice shown, form still open, disk unchanged; **(q)** a pinned form Save on an unterminated trailing fence twin lands on the pinned block. No timed delays — holds and condition waits only (G-S45 / G-S61 are the models). The Notice-count assertion of (p) must use `t.noticesSince` (the harness's own hook), not the hidden container.
6. Docs: code comments (FormModal.ts contract note), `draw-steel-elements/.repo-docs/architecture.md`; a CHANGELOG bullet under `## Unreleased` in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. Plain user words, e.g. "An edit form opened right after a click on an identical block now saves into the block you opened it on, and no longer closes by itself when there are two identical blocks. A click on an identical block followed quickly by typing or an outside edit now also counts in the block you clicked." (Commit the CHANGELOG in the superproject; do not bump the dse pointer — the dispatcher lands.)
7. Proposed dse-verify text (CURRENT block numbers; row 4 part 3 ids/timing; a G-S64 line) in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-dse-verify-proposal.md`. **Do NOT edit `.claude/skills/dse-verify/SKILL.md`.**

### Red/green and mutants (required)
- jest: red on 367a2f1d, green on HEAD; run mutants j1-j7 from §5 (plus one for K-strict and one for the registry child Component removal) and record which tests go red.
- G-S64: FAIL on a 367a2f1d bundle (`git archive` build, as SC-544 did) for (a)-(k), and PASS on HEAD; run lifecycle mutants M1-M6 (plus M7: K-strict removed → (p) fails). Mutants are uncommitted edits you revert; tree clean afterwards.

## 3. Gates — the full dse-verify battery on your final HEAD
Expected at 367a2f1d plus your change (from the ledger): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6326 passed / 1 skipped / 252 of 253 suites** before your tests (fresh worktree 6325 / 2 until shots caches `obsidian-app.css`) — report your new count and the delta · lifecycle **48/48 → 49/49** in four `--only` parts (part 1 `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a`; part 2 `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40`; part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S64`; part 4 `G-S57 G-S62 G-S61 G-S56`), each part one foreground call, each under 540 s — report each part's seconds · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] — use a private `DSE_CAMERA_TMP` under your scratch folder (SC-554) · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. After rebasing onto 367a2f1d a private `DSE_LIFECYCLE_PORT` is no longer needed. If `styles.css` is byte-identical to 367a2f1d's, say so (shots/freeze/parity should then carry, but run them anyway).

## 4. Footguns (mandatory)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements -- <cmd>`; never `cd` inside a compound command; `git -C <abs path>` for every git command.
- Exit codes: devbox's wrapper eats `$?`; record exit codes from a script FILE run through devbox (`devbox run -c <path> -- bash <script>`) and read each gate's summary line. Never pipe a gate into `tail`.
- One gate per Bash call, foreground, output redirected to a file; no `run_in_background`, no Monitor (exception: shots under load via poll-the-log, dse-verify row 5). Never key a wait on a scratch filename or its contents — the scratch dir is shared and pre-populated; read the process's own output or a per-run unique path.
- Redirect long output to files rather than streaming it (the 600 s stream watchdog kills silent agents).
- Scripts and logs in a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r2-<your agentId>/`, uniquely named, written with the Write tool. Evidence kept goes to the ledger dir with the `sc552-r2-` prefix.
- Never `rm` with a shell-variable target; never a glob `rm` under /tmp (other efforts' `/tmp/dse-obsidian-lifecycle-*` vaults match). Delete only dirs your own run created, by literal path; list any you leave.
- Never `pkill`/`killall` by pattern. Kill only by PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never touch `.superpowers/` outside `sc552-*` names; never `rm -rf .superpowers`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever send a message anyway, its first word must be `SC-552:`.
- Drive-by fixes are allowed only if obviously correct, local to a touched file and unable to move a baseline — list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` untouched.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-r2-impl-report.md`, opening with a ≤10-line executive summary (shas, gate numbers, red/green, mutants caught, SC-549 phases (n)/(o) result).

## 6. Return contract
Final text: raw facts, no prose — dse commit shas (one line each), superproject sha, rebase base, every gate's summary line and seconds, jest delta, red/green and mutant table, `git status --short` for plugin and superproject, Drive-by fixes / Follow-ups, and the absolute path of every evidence artifact (report, logs, screenshots, proposal file).
