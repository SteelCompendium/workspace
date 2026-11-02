# SC-536 decisions ledger — reference cycle nests forever in Reading view; false "Reference nesting too deep" when one block is live twice

Ticket: SC-536 (Medium, Bug, DSE Plugin). Related: SC-525 (landed; filed this), SC-510.
Owner: ticket-owner session be71a0a9-199f-4e14-967b-191935312b05 (Opus 5.5; post with `--model opus-5.5`).
Worktree: /home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard (every submodule on branch `sc536-ref-cycle-guard`).
DSE base: `develop` @ 34f46cf (SC-525 landed). Superproject worktree cut at 8174d816.
Lifecycle id reserved for this effort: G-S56.

## Scope (from the dispatcher, 2026-11-02)
- "Reproduce in real Obsidian first."
- Overlap: SC-481 (running) is in `ReadingModeBlockHost.ts` reconcile/remountReused for identical blocks — coordinate via the dispatcher before touching `ReadingModeBlockHost.ts`.
- Prior evidence: `docs/superpowers/dse-overhaul/build-ledgers/sc525-ref-nesting-retype/sc525-r2-review-report.md` MEDIUM-1/MEDIUM-2, probe kit `sc525-r2-obsidian-*.txt`, logs `sc525-r2-obsidian-{cycle,probe}-{head,base}.log`.

## Ticket's suggested fix (filed by SC-525's owner, not a Scott ruling)
"make the guard follow ancestry, not block identity. Either pass the chain of references being resolved down through `RenderContext`, or refuse only when a live owner's root contains the new root. Add a hard depth cap as a backstop. Add a lifecycle scenario using the review's `Cyc.md` fixture. This could replace SC-525's owner map."

## Scott rulings
(none yet — the ticket thread has no comments as of 2026-11-02)

## Owner decisions
- 2026-11-02: r1 is a reproduce + design survey round (orchestration:reviewer, Opus): reproduce Bug 1 and Bug 2 on 34f46cf in real Obsidian, instrument the nested-render path (blockKey, sourcePath, DOM attachment of the nested block's el to the parent card's root at mount and at resolve time, whether any RenderContext survives Obsidian's MarkdownRenderer), and recommend one design. No branch code in r1.
- 2026-11-02: Must keep SC-525's guarantees: the form-preview retype case stays fixed, and `resolveGen` stale-write protection stays.
- 2026-11-02: Full dse-verify battery required for any `src/` change (tsc, lint, jest, lifecycle two halves, e2e, shots, freeze, parity). New lifecycle scenario G-S56 covers Bug 1 (Cyc.md) and Bug 2 (two panes + plugin off/on) unless the design round shows a scenario cannot be deterministic.

## Rounds
- r1 reproduce + design (orchestration:reviewer, id a8dc3ea22e7ab9edd) dispatched 2026-11-02 — brief `sc536-brief-r1-design.md`, report `sc536-r1-design-report.md`. Writes no branch code, so it is eligible as a later reviewer of the implementation only if no fresher identity is available (prefer a fresh reviewer).
- r1 DONE 2026-11-02: both bugs reproduced on 34f46cf in real Obsidian 1.15.0 (Bug 1: 137 levels / 20 s, 0 error cards; Bug 2: two panes + plugin off/on 3/3 ×2 runs, split+redraw 3/5 and 4/5, held variants 100%). Root cause measured: nested block = fresh RenderContext + host + docId-fallback blockKey; nested el is inside the parent card root (and connected) at processor call, mount and after lookup; processor runs synchronously inside parent's MarkdownRenderer.render. Prototype (scratch copy) fixes both in real Obsidian; ReadingModeBlockHost.ts untouched.

## Owner rulings on r1 (2026-11-02)
- ADOPT r1's recommended design (report §4) as written: DOM-ancestry guard in `src/elements/shared/RefUnwrapView.ts` only — `REF_CHAIN = WeakMap<HTMLElement, {targets, depth}>`, `nearestChain` walks `parentElement`, `REF_CHAIN.delete(root)` at the top of `onMount` beside `this.resolveGen++`, cap check before any lookup, `claimChain` immediately before each `mountBase` after the last `resolveGen` check; target identity = resolved target (`file:<path>` for `@`/`[[ ]]`, fallback `raw:<base.id>|<trimmed>`; SCC = `scc:<code>` + `file:<entity.file.path>`). REMOVE `IN_FLIGHT_REFS` and `ElementView.isUnloaded()` (keep the private `unloaded` flag — SC-519 uses it). KEEP `resolveGen` exactly as is. Prototype diff `sc536-r1-proto-RefUnwrapView.diff.txt` is the starting point.
- `ReadingModeBlockHost.ts`: NO change (SC-481's area). If the implementer finds it must change, stop and return NEEDS_CONTEXT.
- Cap: `MAX_REF_DEPTH = 5` (reference-resolved roots on the DOM chain, outermost = 1).
- Wording (owner ruling): cycle card → `Reference loop: <raw ref> is already shown by a card this one is inside.`; cap card → `Reference nesting too deep: more than 5 references inside one another.` Drop "already resolving in this block". Any existing test/lifecycle/e2e matcher on the old text is updated deliberately, never loosened to pass.
- Tests: r1 §5.2 verbatim — rewrite the 3 OOM cycle tests on the nested-host model, invert/delete the 3 Bug-2 pins, rewrite displayCardHybrid (d), add the 9 new tests (awaited + fire-and-forget variants, view brake ~30), run the 6-mutant table.
- Lifecycle: add G-S56 per r1 §5.1 phases (a), (a′), (b), (c), (d) + the 7-chain cap anti-vacuity; in the second lifecycle half; must fail on 34f46cf (show it). Natural-timing variants stay out of the gate.
- FOLD r1 §6: one line in `renderMarkdown`'s doc comment that the guard requires rendering into an element already inside the card. FOLD `view.ts:291-298` comment update.
- Docs in the worktree superproject: CHANGELOG `## Unreleased` bullet; dse-verify SKILL lifecycle row gains G-S56 (lifecycle becomes 42). CURRENT block is the dispatcher's at landing — do not edit it.
- Sidebar host was reasoned, not measured in r1 → the r3 reviewer must probe it in real Obsidian (pinned card holding the cycle note).
- r2 implementer (orchestration:implementer, id a1aa84aae41d82a21) dispatched 2026-11-02 — brief `sc536-brief-r2-impl.md`, report `sc536-r2-impl-report.md`. Author of the fix; must NOT review it. r3 review → a FRESH orchestration:reviewer (not r1, which designed the prototype).
- 2026-11-02 (dispatcher FYI): SC-481 landed; dse develop now `458abe3` (was 34f46cf). Touches ReadingModeBlockHost.ts (reconcile / identical-twin reuse, `fenceOnElement` helper), remountReused.ts, adds lifecycle G-S53. ReadingModeBlockHost.ts no longer contended (still tell the dispatcher if changed — design still needs no change there). New rebase target `458abe3`. Baselines @458abe3: jest 6201 passed / 1 skipped / 249 of 250 · lifecycle 42/42 (halves 21 + 21) · e2e 124/124, 87/87 · shots 592, 0 FAIL, 157/942 · freeze 280/280 · parity 0/0/24. With G-S56 SC-536 expects lifecycle 43/43 (21 + 22). Relayed to the r2 implementer.
- r2 DONE 2026-11-02: plugin head `432c50e2` on develop `458abe3` (36cd8edb RED, 8c1269fb guard, 514946db G-S56, 432c50e2 G-S56 fresh leaf); superproject worktree `2f5eb7d1` (CHANGELOG + dse-verify lifecycle row; fast-forwarded to main 367015f3 first; pointer bump unstaged). ReadingModeBlockHost.ts untouched. Gates: tsc/lint clean, jest 6221/1/249 of 250 (+20), lifecycle 21/21 + 22/22 = 43/43, e2e 124/124 87/87, shots 592 0 FAIL 157/942, freeze 280/280, parity 0/0/24. Mutants 6/6 red. G-S56 fails all 6 phases on 458abe3 src.
- Owner ruling on r2 follow-ups (2026-11-02): (1) "other lifecycle scenarios counting lookups in a leaf previously in Live Preview need a fresh-leaf start" → DROP as a ticket (no scenario is failing); the reviewer checks G-S56's fresh-leaf setup carries an explanatory comment. (2) self-cycle costs one extra lookup → as ruled, no action. (3) sidebar → r3 reviewer probes. (4) CURRENT block → dispatcher at landing.
- r3 review: FRESH orchestration:reviewer dispatched 2026-11-02 — brief `sc536-brief-r3-review.md`, report `sc536-r3-review-report.md`.
- r3 reviewer id aff3adcb32d2c2b92; asked (2026-11-02) to also capture sc536-r3-shot-{cycle,twopanes}-{head,base}.png for the ticket.
- 2026-11-02: r3 reviewer hit a session-limit 429 mid-review; dispatcher resumed it (same id). Owner does not re-spawn.
- 2026-11-02 (dispatcher FYI): SC-533 landed; dse develop now `f81a277` (was 458abe3). Changes `src/framework/chrome/mountChrome.ts` only + lifecycle G-S54. Baselines @f81a277: jest 6208 passed / 1 skipped / 249 of 250 · lifecycle 43/43 (halves 22 + 21) · e2e 124/124, 87/87 · shots 592, 0 FAIL, 157/942 · freeze 280/280 · parity 0/0/24.
- Owner decision: do NOT interrupt the running r3 review (on 432c50e2). Rebase onto f81a277 in the fix round (or a dedicated rebase round if r3 has no fixes), resolve the `obsidian-lifecycle.mjs` G-S54/G-S56 merge keeping both, then full battery. Expected with G-S56: lifecycle 44/44; jest 6208 + 20 = 6228 if nothing else moves.
- r3 DONE 2026-11-02: LAND-READY at plugin `432c50e2` / superproject `2f5eb7d1`; 0 HIGH / 0 MEDIUM / 2 LOW / 5 INFO. Gates re-run: tsc/lint clean, jest 6221/1/249 of 250, lifecycle 43/43, e2e 124/124 87/87. Real Obsidian: Bug 1 fixed (self/alias/A→B→A/LP stop with one loop card; 7-chain 5 cards + cap), Bug 2 fixed (0/5, 0/3, held clean); sidebar measured OK; SC-481 twins OK. Mutants 12 run, 10 red (2 survivors behaviour-neutral).
- 2026-11-02 dispatcher instruction: "your superproject branch edits .claude/skills/dse-verify/SKILL.md (row 4) — that file is dispatcher bookkeeping and row 4 has moved (now 43/43 with G-S53 + G-S54); please drop that hunk from the branch and put the proposed G-S56 text in a proposal file. Your rebase target is f81a277."

## Owner rulings on r3 findings (2026-11-02)
- LOW-1 (sidebar Pin on a reference-only ds-feature writes `_dse_anchor` into the body, breaks it; pre-existing): FILED **SC-541** (Backlog, Low, related SC-536). Out of scope.
- LOW-2 (nested error card in sidebar wraps one letter per line; pre-existing CSS, newly reachable): FILED **SC-542** (Backlog, Low, related SC-536). Out of scope (CSS, freeze/parity risk).
- INFO-1, INFO-2 (surviving mutants are behaviour-neutral / pre-existing): DROP.
- INFO-3 (G-S56 base-failure text reads calls and raws in two evals): FOLD into r4 — read both in one `t.ev`.
- INFO-4 (LP: two identical tall `@Outer.md` blocks show one widget; same on base): not SC-536 → relayed to dispatcher for SC-537's owner; no ticket from here.
- INFO-5 (G-S56 detaches other leaves and runs last): FOLD into r4 — a comment at G-S56 saying so, and that a later scenario must set up its own leaves.
- r4 = rebase onto f81a277 (keep G-S54 and G-S56 both; G-S56 last) + INFO-3 + INFO-5 + drop the dse-verify SKILL.md hunk from the superproject branch → proposal file `sc536-dse-verify-row4-proposal.md` in the ledger dir. Full battery. Expected: jest 6208 + 20 = 6228 / 1 / 249 of 250, lifecycle 44/44. r4 by the r2 implementer (author); scoped re-review of the r4 delta by the r3 reviewer.
- r4 DONE 2026-11-02: plugin head `fb24f8a2` on develop `f81a277` (55cb698c RED, 1f305e06 guard, 1be1ebc7 G-S56, effbb9d8 fresh leaf, fb24f8a2 INFO-3/INFO-5). Superproject `5325f33b` reset onto main `e0f5c76a` (net diff CHANGELOG.md only; SKILL.md hunk gone; old 2f5eb7d1 replaced). Gates: tsc/lint clean, jest 6228/1/249 of 250, lifecycle 22 + 22 = 44/44 (second half 542 s), e2e 124/124 87/87, shots 592 0 FAIL 157/942, freeze 280/280, parity 0/0/24. G-S56 fails all 6 phases on f81a277 src. Proposal: `sc536-dse-verify-row4-proposal.md`.
- r5 scoped re-review of the r4 delta → r3 reviewer (aff3adcb32d2c2b92) resumed with `sc536-brief-r5-rereview.md`.
- r5 DONE 2026-11-02: LAND-READY at plugin `fb24f8a2` / superproject `5325f33b`; 0 HIGH/MEDIUM/LOW, 1 INFO. src/ patch byte-identical to r3-reviewed; lifecycle merge additive (G-S54 intact, G-S56 last); INFO-3/INFO-5 done; superproject net diff CHANGELOG only; proposal anchors match row 4 on origin/main. Re-ran: tsc/lint clean, jest 6228/1/249 of 250, lifecycle half B 22/22 (535 s), G-S56 alone 1/1.
- r5 INFO-1 (lifecycle second half ~535-542 s, ~60 s headroom): DROP for SC-536 — the proposal file §1 already suggests moving G-S9c–G-S9f to the first half; flagged to the dispatcher in the land-ready report.
- LAND-READY 2026-11-02: reported to dispatcher.
