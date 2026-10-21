# SC-470 decisions ledger — reading view jumps up when a tracker changes in another pane or from Sync

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05. Posts with `--model opus-5.5`.
Worktree: /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes (every submodule on branch `sc470-scroll-pin-panes`; dse cut at develop `c03db7a`).
~~Baselines at c03db7a (dse-verify CURRENT): tsc/lint clean; jest 5374 passed / 1 skipped / 231 of 232 suites (fresh worktree without shots cache: 5373 / 2); lifecycle 28/28; e2e `85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`; shots 572, 0 FAIL; freeze 276/276; parity 0 GAPs / 0 undeclared / 24 DECLARED.~~ superseded by the 2026-10-21 dispatcher move to e31e1a0 below.

## Spec (ticket description, verbatim, 2026-10-21)

> Found by the SC-459 measurement round (2026-10-20, Obsidian 1.14.4).
>
> **What:** open the same note with a tall tracker in two panes, scroll both down, click a control in pane A. Pane B jumps from scrollTop 3020 to 0 on every write (2/2), with view adoption on and the scroll pin working. A bare edit of a tracker's body from outside the plugin (Sync, git, another device, another plugin) clamps the open reading view the same way (2416 -> 0, 4831 -> 0 on a one-tracker note).
>
> **Why:** the SC-198 pin (`src/framework/host/previewScrollPin.ts:76`) only pins the scroller of the view that made the write. Any other reading view of the note, and every external write, rebuilds the DSE block fresh, the sizer's inline min-height collapses, and the browser clamps scrollTop.
>
> **Fix direction (not decided):** pin every open reading view of the file on a DSE write, and/or pin on the vault `modify` event for external changes.
>
> Evidence: `.superpowers/sdd/sc459-scroll-pin-gate/sc459-r1-measure-report.md` (finding F1, M1).

(Ticket was filed by the SC-459 owner, not Scott; "not decided" is an implementation choice — owner's call, informed by a measurement round.)

## Scott rulings

(none yet)

## Dispatcher constraints (2026-10-21)

- "SC-457 and SC-471 are in flight in host/fence code — keep scope to the scroll pin and coordinate via rebase." (SC-457 touches `fenceLine.ts` + `ReadingModeBlockHost.ts`; SC-471 touches `sidebar/registration.ts`.)
- Related out-of-scope ticket: **SC-472** (pin's fixed 2500 ms TTL expires before the redraw under 8x CPU throttle). Do not change the TTL here.

- 2026-10-21 (dispatcher, verbatim): "dse develop has moved c03db7a → e31e1a0 (SC-474 landed: the Conditions \"Add condition\" dropdown now closes on click instead of pointer-down, plus new e2e COND-E04/E05/E06 and control id cond.icon-search). New baselines: jest 5384 / 1 skipped / 231 of 232, lifecycle 28/28, e2e 88/92 ok with 0 failed, 4 known-bug, coverage 64/64; freeze 276/276; parity 0/0/24. Land-ready must be on e31e1a0, with the superproject rebased onto origin/main (the CHANGELOG moved again)."
  Owner: r1 (measure-only, commits nothing) stays on c03db7a — SC-474 touches the Conditions modal, not the pin path. r2 rebases onto e31e1a0 and gates against these numbers; superproject branch rebased onto origin/main before land-ready.

## Owner decisions

- 2026-10-21: run a bounded design+measure round first (reviewer), then implement (implementer), then a FRESH reviewer (author-independence: the r1 reviewer authors the prototype, so it may not review).

## Rounds

- r1 (reviewer, agent aaf0d4aa9a52890af, dispatched 2026-10-21): design+measure round, commits nothing. Brief `sc470-brief-r1-design.md`, report `sc470-r1-design-report.md`, prototype `sc470-r1-prototype.patch`. r1 authors the prototype → r1 may NOT review the implementation; r3 must be a fresh reviewer.
- r1 DONE (2026-10-21): recommend **D2** — a vault `modify` listener pins every open Reading view of the modified file containing `[data-dse-element]`; `modify` fires before any view's rebuild on every path (42/42). Keep the writer-side call. New scenario **G-S15** (G-S13/G-S14 claimed by SC-326/SC-471/SC-457 in flight): stock FAIL 3/3, proto ok 3/3, CSS-deleted FAIL 3/3, D1 FAIL 2/2. Full lifecycle with proto 29/29. Tree clean at c03db7a. Prototype `sc470-r1-prototype.patch`.

## Owner rulings on r1 (2026-10-21)

- **Design: D2 + keep the writer-side pin call** (r1 recommendation). Do not edit `ReadingModeBlockHost.ts` (SC-457 in flight there).
- **Risk 1 (pin cost ~200 ms set + ~200 ms clear of style recalc per pinned view, from the inherited `--dse-scroll-pin` custom property on the scroller) → FOLD into r2.** Reason: D2 widens how often the cost is paid (every external write / autosave to a DSE note, every other Reading view), and the cost also delays the rebuild (external-write collapse 13-31 ms -> 310-400 ms; popout redraw ~1.5 s -> ~2.5 s, at the TTL edge), which worsens the SC-472 TTL race. Switch to a per-pin stylesheet rule (measured 2-4 ms set, 2-32 ms clear, holds): an injected `<style>` in the scroller's own `ownerDocument` keyed on the attribute's value, no custom property, removed on release and on `releaseAll`; the static rule in `styles-source.css` goes. The G-S8 / G-S15 "CSS rule deleted" control becomes "the injected rule never inserted". Measure the before/after cost with r1's `P470-COST` probe.
- **Risk 4 (re-pin keeps the FIRST px while autosave keeps refreshing the TTL) → FOLD:** a re-pin of an already-pinned scroller takes max(current pinned px, current scrollHeight) — never lower than the pinned value — so a long typing session cannot hold a stale height. Prove it never captures a collapsed height (jest).
- **Risk 2 / TTL race data point → appended to SC-472** (done). Out of scope here; `PIN_TTL_MS` unchanged.
- **Live Preview panes also clamp on an external / other-pane write → filed SC-478** (Backlog). Out of scope.
- **Embeds (a DSE block inside an embed in a tall note) not pinned by either path → filed SC-479** (Backlog, unmeasured). Out of scope.
- **Scenario-id collision (SC-326/SC-471 both G-S13, SC-457 G-S14) → tell the dispatcher** (landing order). SC-470 uses G-S15.
- **Docs:** `previewScrollPin.ts` header updated by r2 (D2 + stylesheet-rule pin; the "Not covered (SC-470)" line goes). Workspace `dse-verify/SKILL.md` lifecycle row/G-S15 entry/G-S8 phrase ("FAILs with the CSS rule deleted" -> per the new control) → dispatcher at landing, text supplied in the land-ready report. CHANGELOG bullet → r2 in the worktree superproject.
- r2 (implementer, agent a19a20db9fdf47fdd, dispatched 2026-10-21): rebase onto e31e1a0 + superproject onto origin/main, apply r1 prototype (D2), stylesheet-rule pin (Risk 1), re-pin max px (Risk 4), header/docs, CHANGELOG, full battery, discrimination. Brief `sc470-brief-r2-implement.md`. r3 = FRESH reviewer (not r1 aaf0d4aa9a52890af, which authored the prototype; not r2).
- 2026-10-21 (dispatcher, verbatim): "dse develop has moved e31e1a0 → aaa88b7 (SC-476 landed: authoring autocomplete in src/authoring/fenceScan.ts plus test/dom/authoring/schemaSuggest.test.ts, with a CHANGELOG bullet). New baselines: jest 5399 / 1 skipped / 231 of 232, lifecycle 28/28, e2e 88/92 with 4 known-bug and 64/64, freeze 276/276, parity 0/0/24. Land-ready must be on aaa88b7 (or newer), with the superproject rebased onto origin/main. Lifecycle ids are now reserved as SC-326 G-S13, SC-457 G-S14, SC-470 G-S15 and SC-471 G-S16."
  ~~Land-ready on e31e1a0~~ superseded: land-ready on aaa88b7 (or newer). Baselines: jest 5399 / 1 skipped / 231 of 232 (fresh worktree w/o shots cache 5398 / 2). SC-470 keeps G-S15 (reserved). r2 implementer told to rebase onto aaa88b7 mid-round.
- r2 DONE (2026-10-21): dse head `03e589c` on `aaa88b7` (331fc63 D2, 47ac50e stylesheet pin + re-pin rule + header, 03e589c tests); superproject `17064b0` on origin/main (CHANGELOG bullet). tsc/lint clean, jest 5410/1 (5409/2 fresh), lifecycle 29/29, e2e 88/92 0 failed 4 known-bug 64/64, shots 572 0 FAIL, freeze 276/276, parity 0/0/24. Discrimination: base G-S15 FAIL 2/2; mine ok 2/2; style append disabled → G-S8 + G-S15 FAIL 2/2. Pin cost old ~300-400 ms set/clear → new ~2-16 ms.
- Owner rulings on r2 concerns (2026-10-21):
  - Risk 4 deviation (re-pin = max(pinned px, scrollHeight minus the scroller's vertical padding), because raw scrollHeight while pinned reads pinned+64 px and would ratchet) → ACCEPT; r3 to verify live that repeated autosave re-pins stay flat.
  - P470-REPRO 30 s Runtime.evaluate timeouts at load 8-16 (probe only; G-S15/lifecycle never failed) → r3 to re-check; no action unless r3 reproduces with a cause.
  - Descendant sizer selector also hits nested `.markdown-preview-sizer` (embeds) inside the pinned scroller (pre-existing SC-198 shape, now pinned more often by D2) → r3 to probe; if it puts phantom height into an embed, FOLD the child-combinator fix (`>`, which r1's probe used and which held) into the fix round.
- r3 = fresh reviewer (not r1 aaf0d4aa9a52890af, not r2 a19a20db9fdf47fdd).
- r3 (reviewer, agent a4497bfa86ebad2da, dispatched 2026-10-21): independent review of 03e589c on aaa88b7. Brief `sc470-brief-r3-review.md`, report `sc470-r3-review-report.md`. Fix round → r2 implementer (resume); scoped re-review → r3 reviewer.
- 2026-10-21 (dispatcher, verbatim): "dse develop has moved aaa88b7 → 0ce76dd (SC-326 landed: montage board scroll, with lifecycle G-S13 added to visual-harness/obsidian-lifecycle.mjs and a scroll-position-preserve path in the montage view). Your G-S15 makes lifecycle 30/30, or more if others land first. New baselines: jest 5408 / 1 skipped / 231 of 232, lifecycle 29/29, e2e 88/92 with 4 known-bug and 64/64, freeze 276/276, parity 0/0/24. Land-ready must be on 0ce76dd (or newer), with the superproject rebased onto origin/main."
  ~~Land-ready on aaa88b7~~ superseded: land-ready on 0ce76dd (or newer); lifecycle with G-S15 = 30/30. Owner: r3 finishes its review on 03e589c/aaa88b7 (not interrupted); the fix round rebases onto 0ce76dd (expected conflict in obsidian-lifecycle.mjs: keep SC-326's G-S13 intact, re-apply only SC-470's G-S15 hunks) and checks SC-326's montage scroll-preserve path for interaction with the pin; the scoped re-review re-runs lifecycle 30/30 on the rebased head.
- 2026-10-21 ~10:01Z: r3 reviewer (and owner) killed by session-limit 429; r3 resumed via SendMessage with a state-check instruction (worktree clean at 03e589c, own PIDs, scratch logs). dse develop still 0ce76dd.
- r3 DONE (2026-10-21): **REQUEST_CHANGES** on 03e589c/aaa88b7. 1 HIGH, 2 MED, 2 LOW, 4 INFO. D2 itself works (G-S8 + G-S15 ok 2/2, FAIL 2/2 rule-never-inserted); all gates green (jest 5410/1, lifecycle 29/29, e2e 88/92 0 failed 64/64, shots 572/0, freeze 276/276, parity 0/0/24). Pin cost ~2-3 ms set/clear on the real path.

## Owner rulings on r3 findings (2026-10-21)
- **HIGH-1** (descendant selector also matches an embed's nested `.markdown-preview-sizer`: embed grew 535 -> 4024 px, on-screen text moved 3489 px for the whole pin; `>` keeps it 535 px and G-S8/G-S15 pass 2/2) → FOLD: child combinator `>` in `pinRule` + header comment; jest test that a nested sizer does not match.
- **MEDIUM-1** (re-pin "raise on growth" never fires live — the `!important` pin replaces Obsidian's inline min-height, so scrollHeight-minus-padding always equals the pinned px; Obsidian wanted 5901/7101 px, pin held 5565 px for up to 12 s while autosaving) → FOLD, make the pin a true FLOOR: rule px = max(captured px, the sizer's latest inline `min-height` that Obsidian writes), kept current while pinned by a MutationObserver on the pinned scroller (subtree, `attributeFilter: ['style']`, plus childList for a replaced sizer), disconnected at release/TTL/`releaseAll`; never lowers. A re-pin applies the same max (captured px, inline min-height, scrollHeight minus padding). If the observer proves unworkable, fall back to r3's option (a) at re-pin only and say why.
- **MEDIUM-2** (a popout closed while pinned: its TTL timer never fires, the Map entry holds detached DOM until unload) → FOLD: on every pin call, sweep entries whose scroller is disconnected or whose window is closed; also release on the workspace `window-close` event (registered via `plugin.registerEvent`).
- **LOW-1** (comment says pin ids are unique across plugin instances; they restart at 1 after disable/enable) → FOLD: correct the comment (no id-scheme change needed; every rule is removed on unload).
- **LOW-2** (old "no ratchet" jest test now only checks padding arithmetic) → FOLD with MEDIUM-1: tests drive the re-pin and the floor the way the browser behaves (inline min-height overridden by the rule; Obsidian writing a larger / collapsed inline min-height while pinned).
- INFO-1 (autosave re-pins flat, released 2.5 s after the last write) → no action. INFO-2 (P470-REPRO timeouts are the probe's rAF recorder under popout focus, not the diff) → DROP: scratch probe tooling only. INFO-3 (Obsidian mirrors main-window `<style>` into popouts and removes the copy) → no action. INFO-4 (no runtime interaction with SC-326; expect rebase conflicts in obsidian-lifecycle.mjs header line + end of SCENARIOS, maybe styles-source.css, superproject CHANGELOG) → informs the fix-round rebase.
- r4 = fix round + rebase onto 0ce76dd by the r2 implementer (resume a19a20db9fdf47fdd). r5 = scoped re-review by the r3 reviewer (a4497bfa86ebad2da), who did not author the fixes.
- r4 (implementer a19a20db9fdf47fdd, resumed 2026-10-21): fix round + rebase onto 0ce76dd. Brief `sc470-brief-r4-fix.md`, report `sc470-r4-fix-report.md`.
- r4 DONE (2026-10-21): dse head `1c271b5` on `0ce76dd` (737a099 fix, 1c271b5 tests; rebase conflict only in obsidian-lifecycle.mjs, SC-326 G-S13 kept whole); superproject `bb1addf` on origin/main. All five findings fixed (child combinator; MutationObserver floor; sweep + `window-close`; comment; tests 27 -> 36, mutation-checked). Live: embed 535 -> 535 px; floor follows Obsidian 5565 -> 5901 / 7838; scrollTop held; popout close clean. Cost set ~2 ms, floor update ~0.3 + ~2.5 ms layout, clear ~2-4 ms. Gates: tsc/lint clean, jest 5428/1, lifecycle 30/30, e2e 88/92 0 failed 4 known-bug 64/64, shots 572/0, freeze 276/276, parity 0/0/24. Discrimination base G-S15 FAIL 2/2; mine ok/ok; style append disabled FAIL/FAIL.
- Owner ruling on r4 concern (floor follows Obsidian's transient over-estimates: up to ~740 px bottom phantom space, e.g. 7838 vs final 7101, until the TTL release) → ACCEPT / DROP the follow-up: bottom phantom space for at most the TTL is the pin's documented fail-safe worst case since SC-198, nothing clamps, and never-lower is what prevents the clamp. Capping it would need settle detection, which is SC-472's territory.
- r5 scoped re-review → r3 reviewer a4497bfa86ebad2da. Brief `sc470-brief-r5-rereview.md`.
- r5 DONE (2026-10-21): **APPROVE** on `1c271b5` / `0ce76dd`, no new findings. All r3 findings proved fixed live. Gates re-run: tsc/lint clean, jest 5428/1/231 of 232, `--only=G-S8,G-S15` ok 2/2, style append disabled → G-S15 FAIL 2/2, G-S8 FAIL 2/3 (third stopped at its own "did not rebuild" guard under load ~13), lifecycle 30/30, e2e 88/92 0 failed 4 known-bug 64/64; shots/freeze/parity carried from r4 (delta src/test only).
- r5 INFOs → no action: overshoot reached ~1259 px in a 40-paragraph growth case (covered by the r4 accept ruling — TTL-bounded, never clamps); a link-follow within the 2.5 s pin makes the reused scroller's floor follow the new note until TTL (bounded); G-S8 guard run under load (guard working); popout mirror not observed this time.
- Owner: superproject rebased onto origin/main `76f2f1a` → `4be9331` (CHANGELOG commit; autostash of the unstaged dse pointer, still ` M draw-steel-elements` → 1c271b5).
- **LAND-READY 2026-10-21:** dse `sc470-scroll-pin-panes` @ `1c271b5` on develop `0ce76dd`; superproject `sc470-scroll-pin-panes` @ `4be9331` on origin/main `76f2f1a`. Dispatcher at landing: update workspace `.claude/skills/dse-verify/SKILL.md` (lifecycle row 30/30 with G-S15; G-S15 entry; G-S8 phrase "FAILs with the pin disabled" → "FAILs with the pin's style rule never inserted"; CURRENT block: jest 5428 / 1 skipped / 231 of 232), and preserve this ledger dir to build-ledgers.
