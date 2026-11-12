# SC-607 decisions ledger — open hover preview, outside edit leaves part text unchanged, + writes a different identical counter

Worktree: /home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write (branch `sc607-open-preview-stale-card-write` in every submodule)
Cut from: dse develop c6077860 (2026-11-12)
Lifecycle id reserved: G-S99

## Ticket statement (Scott-facing description, 2026-11-12, verbatim "Expected")

> Expected: the click is saved into the counter the preview was drawn from, or it is refused with the "changed on disk first" Notice. It must never go into a different counter.

## Standing rulings that apply (inherited, quoted from SKILL / prior ledgers)

- Scott 2026-11-10 ruling (via SC-596 ledger): refusals that are safe (a Notice, never a twin) are acceptable where base saved, when they need a click within ~20-45 ms of an outside write or a transient section loss. (See SC-596 build ledger for the verbatim text.)
- SC-596 forms share this limit: a block edit form's pin is placed by `rebaseCardPin` the same way; the fix should cover forms too.

## Scott rulings on SC-607

(none yet)

## Owner rulings

- 2026-11-12: no Scott decision needed to start — the ticket's Expected line defines the outcome. Pipeline: Opus design/survey round (r1) -> Sonnet implementer (r2) -> independent Opus review -> fix rounds -> scoped re-review -> land-ready.
- 2026-11-12: new lifecycle scenario G-S99 goes in part 6 (after G-S96, before G-S56 in SCENARIOS order) if it fits well under the ~420 s limit (part 6 is ~175 s now).

## Baseline at c6077860

jest 10624 passed / 2 skipped · lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (known bugs SC-257, SC-355, SC-384, SC-580) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Rounds

| Round | Role | Agent | Report | Result |
|---|---|---|---|---|
| r1 design/survey | orchestration:reviewer | designer-r1 (a2f0d40e) | sc607-r1-design-report.md | done: option 2 proposed; TWIN 162->0 jest, 12/12 real cells write nothing; G-S92+G-S96 2/2 175 s on probe; mutants 14 / 11 killed (M5, M7 equivalent, M8 defence in depth) |
| r2 implementation | orchestration:implementer | impl-r2 (a4ff340e) | sc607-r2-impl-report.md | DONE_WITH_CONCERNS: dse 1daa7d8a on 622b0904, superproject b3b94384 on 38d8c695; jest 11509/2; lifecycle 61/61 (p6 297 s); e2e 280/284 0 failed 171/171; styles = base; shots/freeze carry; mutants 28/22 killed; R-Q3 deviation |
| r3 independent review | orchestration:reviewer | reviewer-r3 (aab6d351) | sc607-r3-review-report.md | FIX (docs + tests; no code change required): 0 new different-counter writes; MEDIUM F1 (moved section refused while preview open); LOW F2-F4 residuals; F5 docs; F6 test gaps (N6 via P19b); NIT F7; G-S91 0/6 vs 0/6 |
| r4 fix round | orchestration:implementer | impl-r2 resumed (a4ff340e) | sc607-r4-fix-report.md | DONE: dse c329ff35 on dcc53f0f, superproject 807cec69 on f108e5e9; jest 11595/2 fresh; lifecycle 61/61 (p6 298 s); e2e 304/307 0 failed 174/174; styles = base; mutants 41/32 killed (9 equivalent/defence); F7 only code change |
| r5 scoped re-review | orchestration:reviewer | reviewer-r3 resumed (aab6d351) | sc607-r5-rereview-report.md | LAND at c329ff35 on dcc53f0f: LOW L1 (N18 reason incomplete), NITs; jest 11596/1 warm; p6 4/4 310 s |

- **2026-11-12, owner rulings on r1 open questions (sc607-r1-design-report.md §D). No Scott decision needed: the ticket's Expected allows "saved into the drawn-from counter" or "refused with the changed-on-disk-first Notice", and Scott's 2026-11-10 ruling "Save nothing with a notice is fine." covers every safe refusal.**
  - **R-Q1: option 2** (`sc607-r1-probe-rule.diff.txt`): a part-of-note pin (embed or hover; card write AND form) is placed through the link on the note as it is now, and accepted only when the drawn-from block (mount snapshot or this host's own last write, the newer first) maps STRICTLY (head-first and tail-first `mapLine` agree) to that same line; such pins are strict at write time too (`pinnedTarget`). Option 1 rejected: it wrote the pasted counter in N6.
  - **R-Q2a / Q2b / Q2d: accept** the saved->refused classes (block link, lower of two ADJACENT identical blocks hovered, upper deleted; a preview that could not be placed when drawn stays refused; an identical block added right beside the card's block after its own + while the part is stale). No `^id` marker refinement. Re-model jest flip 1 (SKILL "an identical block is added ... Save still lands"): the adjacent case expects refused, keep a NON-adjacent addition that still saves.
  - **R-Q2c: do NOT accept a blanket refusal when the line map gives up** (`LINE_MAP_MAX_EDITS`, a still-open embed whose note changed by >400 lines around the block). Fallback: when either strict map gives up (returns "too many edits", not "deleted"/"disagree"), place by the link as base does ONLY IF the known body occurs exactly once in the drawn-from text AND exactly once in the note now; otherwise refuse. jest flip 2 ("the embed was redrawn after the + ... hundreds of lines ... still saves") must keep saving (re-model it with `host.rebind` where it models a redraw), and add a control: same >400-line change with the body twice -> refused. Reason: a dashboard embed left open while Sync brings a large rewrite is a shape a user could hit; with a unique body there is no identical counter to confuse.
  - **R-Q3: implement the hover-window guard**: at click/Save in a hover preview, when `hoverPopover.embed.data` is a string, require the snapshot text to equal it, else refuse; when it is not a string (internal API absent), skip the check (never refuse on its absence). jest model required for both branches.
  - **R-Q4: accept** one `cachedRead` per card mount (snapshot discarded for whole-note sections); no lazy variant. Shots/freeze/e2e/lifecycle timings are the check.
  - **R-Q5: G-S99** as r1 proposed (cells (a) heading hover RV + LP, (b) RV, (c) embed (a) RV, (d) block hover swap RV, (e2) block-hover form with a second pane, (e3) form after the swap; one no-edit control that saves; one note per cell); in part 6 after G-S96, before G-S56 in SCENARIOS order. Must be red on a 3ad68185 bundle except the control (and any cell that refused at base, named).
  - **R-Q6: keep** the strict-miss no-fallback (M8) as defence in depth; document it as equivalent-by-SC-480 in the report.
  - **Follow-ups:** whole-note head-trim bias -> filed **SC-612** (Backlog, related SC-607/SC-480); OUT OF SCOPE here. The jest redraw models without `rebind` -> FOLD into r2 for the tests r2 touches.

## Baseline moves

- 2026-11-12 (dispatcher): SC-610 landed; dse develop is now **3ad68185** (supersedes c6077860; `src/elements/montage/` only). New CURRENT: jest 10676 passed / 2 skipped (fresh worktree) · lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Dispatcher: "Rebase onto 3ad68185 before you report land-ready, and make sure your superproject branch is on current workspace main too." r1 (design, no commits) stays on c6077860; r2 implementation rebases onto 3ad68185 first and rebases the superproject branch onto workspace origin/main.
- 2026-11-12 (dispatcher): SC-601 landed; dse develop is now **231f2a3b** (supersedes 3ad68185; compendium search: new `src/framework/kit/hoverPreviewGuard.ts`, `DseModal.keepHoverPreviewAlive` calls it; `compendiumInsert.ts`; new lifecycle G-S97). Lifecycle 60 scenarios; part 6 is `G-S92 G-S96 G-S97` (3; ~230 s, "room for about one more scenario that size"). New CURRENT: jest 10711 passed / 2 skipped (fresh worktree) · lifecycle 60/60 (21 + 16 + 9 + 4 + 7 + 3) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto 231f2a3b and the superproject onto workspace main before land-ready.
  - Owner ruling: G-S99 goes in part 6 as `G-S92 G-S96 G-S97 G-S99` (SCENARIOS order after G-S97, before G-S56) if the part's wall stays <= ~380 s; otherwise G-S99 runs alone as part 7. Lifecycle total becomes 61/61.
- 2026-11-12 (dispatcher): SC-609 landed; dse develop is now **622b0904** (supersedes 231f2a3b; initiative tracker roster focus; new e2e INIT-F13, INIT-F14). New CURRENT: jest 10715 passed / 2 skipped (fresh worktree) · lifecycle 60/60 (21 + 16 + 9 + 4 + 7 + 3) · e2e `280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto 622b0904 and the superproject onto workspace main before land-ready.

## Owner rulings on r2 (2026-11-12)

- **R-Q3 amended (supersedes the R-Q3 wording above for the implementation):** ~~"at click/Save in a hover preview, when `hoverPopover.embed.data` is a string, require the snapshot text to equal it, else refuse"~~ superseded by: the `embed.data` equality check applies only to a hover MOUNT snapshot (not a re-bind snapshot, not the own-write position, not an embed), and only while `embed.data` still contains the card's part; when `embed.data` is not a string, skip. Reason (r2, measured): `embed.data` is not refreshed when the preview is redrawn from a changed part, so the ruled form refused G-S92 (e) (a second + 450 ms after the first). Accepted residual: a redraw from a changed part whose new text also occurs in the stale data is refused (safe, a Notice). r3 must probe that the amended guard still closes the hover mount race.
- **Follow-up: G-S91 "title rv" flake** (1 of 4 on clean base; 3 on branch) -> filed **SC-616** (Backlog, related SC-598/SC-607). r3 checks whether the branch raises the rate; if it does, it is in scope here.
- **Follow-up: three jest files still model a redraw with `section.current = …` without `host.rebind`** (`reading-mode-host-form-pin.test.ts` ~170, `reading-mode-host-hover-card.test.ts` ~193/335/557) -> FOLD into the post-review fix round (same area, now load-bearing since a rebind takes the snapshot); r3 says whether any of them is vacuous under the new rule.
- **Follow-up: embed race window (6.8-7.9 ms, no popover data for embeds)** -> DROP as a ticket; documented residual in the dse-verify proposal (0/6 race trials hit it; no Obsidian handle).

## Baseline moves (cont.)
- 2026-11-12 (dispatcher): SC-580 landed; dse develop is now **93e8e48c** (supersedes 622b0904; Conditions window printable key opens Add search; e2e COND-N07..N10). New CURRENT: jest 10746 passed / 2 skipped (fresh worktree) · lifecycle 60/60 (21 + 16 + 9 + 4 + 7 + 3) · e2e `285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (known bugs SC-257, SC-355, SC-384) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Dispatcher: "Rebase onto 93e8e48c (and your superproject branch onto current workspace main, one pointer bump, no interim pointer commits) before you report land-ready." Owner: r3 reviews 1daa7d8a on 622b0904 as dispatched; the fix round rebases onto 93e8e48c and re-runs the full battery there.
- 2026-11-12 (dispatcher): SC-583 landed; dse develop is now **d0561a68** (supersedes 93e8e48c; condition keys case-insensitive; e2e COND-K01..K05). New CURRENT: jest about 10759 passed / 2 skipped fresh (10760 / 1 with the shots cache) · lifecycle 60/60 · e2e `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto d0561a68 and the superproject onto workspace main (one pointer bump) before land-ready. The fix round targets d0561a68.

## Owner rulings on r3 (2026-11-12)

- **F1 (MEDIUM) — ACCEPT as a documented refusal; no code change.** A section with a unique body moved (atomically: Sync, outline drag) while its hover/embed stays open is refused ("changed on disk first") until the preview/embed is redrawn (reopen). Reason: covered by Scott's 2026-11-10 ruling "Save nothing with a notice is fine."; the only measured narrower rule (M19) re-opens three different-counter writes (P10b, P11c, P9c), which the ticket forbids ("It must never go into a different counter."). Pin it in jest (move cells: hover and embed, heading and block link; to the end and below another section), name it in both CHANGELOGs and the proposal. It will be named to Scott in the land-ready comment.
- **F2 (redraw race ~20-23 ms), F3 (unrelated edit inside the ~104-128 ms hover mount window refuses that card for good), F4 (R-Q2c give-up + a different counter edited to match AND given the link's name/^id; base writes too) — DOCUMENT as residuals** in the proposal (F2/F4 as residual writes that base also makes; F3 as a refusal). No code change (F3's embed.data-as-drawn-text idea: not taken; keep the code the reviewer passed).
- **F5 — FIX the docs:** CHANGELOG headline no longer absolute (name the shapes it fixes; say rare timing races remain, as before); name the new refusals (F1 move, >400-line change with a twin, F3, R-Q2a adjacent block); delete the stale SC-594 "Known limit (SC-607 …)" sentence in both CHANGELOGs; proposal: add F1-F4, restate mutants from the r4 run (no stale M9 anchor / "M19 not constructible").
- **F6 — FIX the tests:** add P19b (kills N6) and the F1 move cells (kill M19); add tests for N10 (end-of-text cache check) and N14 (drawn-as-whole-note path); try to kill N11 (one map gives up, the other does not) and N7; classify N1, N2, N15 as equivalent / defence in depth with one line each.
- **F7 (NIT) — FOLD:** clear `drawnToken` / `drawnRead` on unload.
- **Folded follow-up (from r2):** re-model the 4 redraw tests (`reading-mode-host-hover-card.test.ts` J5 ~190, J17 ~553, ~335; `reading-mode-host-form-pin.test.ts` the 12 "+ (part redrawn after +)" cells) with `host.rebind`; keep N18 killed by at least one test that reaches the own-write-first branch through a state Obsidian produces, or record N18 as equivalent with the reason.
- **G-S91:** r3 measured 0/6 branch vs 0/6 base, no rate change -> stays SC-616, out of scope.
- **Follow-up filed:** CRLF note + hover + identical twin refuses on base and head -> **SC-619** (Backlog). Out of scope.
- 2026-11-12 (dispatcher): SC-602 landed; dse develop is now **711844f3** (supersedes d0561a68; framework: new `src/framework/host/livePreviewFocusCarry.ts`, plus `viewRegistry.ts`, `chrome/focusHandoff.ts`, `kit/controlFocus.ts`, `registerFrameworkElements.ts`; 14 new LP e2e tests). New CURRENT: jest 10784 passed / 2 skipped (fresh worktree) · lifecycle 60/60 · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. G-S91 flaked once in SC-602's run too (SC-616). Rebase onto 711844f3 and the superproject onto workspace main (one pointer bump) before land-ready. Owner note: `registerFrameworkElements.ts` registers `registerHoverLinks` — check the rebase for an interaction.
- 2026-11-12 (dispatcher): SC-582 landed; dse develop is now **dcc53f0f** (supersedes 711844f3; Conditions window swatch accessible names only). New CURRENT: jest 10787 passed / 2 skipped (fresh worktree) · lifecycle 60/60 · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto dcc53f0f and the superproject onto workspace main (one pointer bump) before land-ready.

## Owner rulings on r5 (2026-11-12)

- **L1 (LOW) — reword only, no new test.** The proposal's N18 reason is reworded by the owner (ledger-file bookkeeping): "unreached in measured runs; reachable only when the cache lags this host's own + at a re-bind and the write changed the block's line count". The optional test is DROPPED: the state was not reached in 6/6 real re-binds, a test-only round would cost another review cycle for a mutant on a defence branch, and the probe is preserved in the ledger (`sc607-r5-n18-probe.test.ts.txt`).
- NIT N1 (CHANGELOGs don't name F4): no change, consistent with the F4 ruling and the "in the shapes below" headline. NIT N2 (no fresh-jest log): land-ready reports the logged warm number 11596 / 1 and the r4-reported fresh 11595 / 2 as unlogged. NIT N3 ("an unique"): already absent in the current proposal text.
- **LAND-READY** 2026-11-12: dse `sc607-open-preview-stale-card-write` c329ff35 on develop dcc53f0f; superproject 807cec69 on main f108e5e9 (CHANGELOG only; the dse pointer is unstaged; one pointer bump at landing). Both verified on tip at report time.

## Done (2026-11-12)

- LANDED by the dispatcher: dse develop c329ff35 (dcc53f0f..c329ff35); workspace main 71b17faa (CHANGELOG commits; pointer bump cf834cd4); worktree removed; ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc607-open-preview-stale-card-write/` (bookkeeping 8c4f06b9); dse-verify proposal applied ("The drawn-from rule (SC-607)", lifecycle 61/61, part 6 `G-S92 G-S96 G-S97 G-S99`, CURRENT at c329ff35).
- SC-607 moved to **Done** via linear-post.py `--state Done` (Done comment posted); state verified Done with get_issue. Follow-ups in Backlog: SC-612, SC-616, SC-619.
