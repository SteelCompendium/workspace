# SC-390 — decisions ledger

Ticket: SC-390 "compendium reference option fails to render" (Bug, DSE Plugin, Medium).
Owner: Fable ticket-owner, session ce805c79-1202-4669-936e-9d6ac82db903.
Worktree: /home/scott/code/steelCompendium/worktrees/sc390-companion-ref (every submodule on branch `sc390-companion-ref`).
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/ (shared global state — prefix every file `sc390-`).

## Scott's rulings (verbatim, dated)

- 2026-10-16 (ticket description): "Insert Draw Steel: compendium reference allows for this option:
  ```ds-scc
  mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
  ```
  but it fails to render [screenshot: `"Panther" (type: feature-group) has no renderer in this plugin.`] this should be able to be rendered"

## Owner findings (not rulings)

- 2026-10-16: All 14 `monster.companion.beastheart.statblock/<species>` entities are emitted by steel-etl as `type: feature-group`; their md-dse output is frontmatter + a markdown stat table + `##` ability sections, with NO `ds-*` block. DSE `ds-scc` (`src/elements/shared/RefUnwrapView.ts:205-213`) dispatches on entity `type` via `baseForType`; `feature-group` has no base → error card. The v2 site already parses this table into the shared statblock island (`steel-etl/internal/site/companion_statblock.go`, site-only).
- Baselines at dispatch: dse `origin/develop` = 9ad919d; freeze baseline 274 lines (`freeze OK (274/274)` expected); parity 0 gap / 0 undeclared (declared count per dse-verify); workspace main 180f107.

## Round log

- R0 (2026-10-16): survey round dispatched (orchestration:reviewer) — recommend the fix shape across steel-etl md-dse emitter + DSE.

## R0 survey outcome (2026-10-16, report `sc390-r0-survey.md`)

- Recommendation: companions become `type: statblock` in every format with a real `ds-sb` block (features[] from the coded L1 members; advancement stays its own `ds-fb` entity). DSE needs no dispatch change; additions: Skills kv cell, omit empty "EV" (2-line sanctioned rebaseline on `statblock-roleless-corpus` print+realprint), jest + harness `companion-corpus` fixture (widening 274→276), compendium-sync.md honesty line.
- Correction to owner finding: md-dse companion files have NO `##` ability sections — abilities are separate coded member files.
- Shared schema moves: `free_strike` integer→integer|string; optional `skills[]`. Both `statblock.schema.json` copies byte-identical today; data-sdk-npm must follow (dual-schema-sync rule).
- Site must stay identical (companion page, index preview, bestiary exclusion); gate rekeyed to SCC code and ordered before the generic statblock page.
- `feature-group` is NOT the only `ds-scc` orphan: 10 types / 233 md-dse files hit "no renderer" (skill 57, monster-group lore 51, saint 28, chapter 26, project 16, feature-group 14, movement 13, negotiation 12, god 11, skill-group 5). The other 9 are prose types → separate ticket.
- Open for Scott: approve the type flip + schema change; SDK release + DSE bump inside SC-390 (owner recommends yes); EV-omit in principle (formal sanction with crops at review); bestiary companion facet (owner recommends: keep excluded, out of scope).
- Follow-up rulings (owner): file Backlog tickets for (1) ds-scc orphan types, (2) companion advancement under the companion card in DSE, (3) EncounterData NaN on string stamina, (5) site: retire the markdown-table parse once frontmatter carries stats. Fold (6) stale `v2/site.yaml:76-78` feature-group include/comment into SC-390. (4) bestiary facet → Scott question.
- R0 done 2026-10-16: ask posted (comment `sc390-c1-ask.md`), ticket In Progress + `Needs Review` (labels verified: Bug, DSE Plugin, ETL, Needs Review). Backlog tickets filed: SC-391 (orphan prose types), SC-392 (companion advancement in DSE), SC-393 (EncounterData NaN stamina), SC-394 (site retires table parse). Waiting on Scott: approval of items 1–4 + bestiary-facet question.

- **2026-10-17 (Scott, in the owner session, replying to the SC-390 ask `sc390-c1-ask.md`): "approved"** — read as approving all four numbered items: (1) companions flip to `type: statblock` in every format, site byte-identical; (2) schema `free_strike` integer|string + optional `skills`, both schema copies move, data-sdk-npm release + plugin SDK pin bump inside SC-390; (3) empty-"EV" omit in principle (formal 2-line sanction with crops at review); (4) compendium-sync.md "what renders / what doesn't yet" line. The bestiary-facet question got no answer → companions stay excluded from the bestiary (owner's recommendation stands; no ticket).
- R1a dispatched 2026-10-17 (orchestration:implementer): steel-etl + data-sdk-npm.
- Note for R1b (2026-10-17): dse `origin/develop` moved 9ad919d → a337460 (SC-407 docs prune + SC-406 experimental switch). `ds-scc` and statblock are shipping scope (not among the 9 deferred elements), so R1b is unaffected except: rebase dse onto a337460; the "renders any entry" promise appears in `docs/compendium-sync.md:82` AND `docs/index.md:70,124-125` — the honesty line must touch all three; docs-shots now run with the experimental switch OFF.

## R1a outcome (2026-10-17, `sc390-r1a-report.md`)
- DONE. steel-etl `8d1c062` (3 commits on 0c74f4f), data-sdk-npm `5ec5a8e` (on v3 69c8d49, version 3.1.0, NOT published), v2 `2af78d0` (site.yaml only), worktree superproject `753e212` (docs). go test 847/0/0; SDK 416/416; registry 3,096 unchanged; `--scc-stable` pass; site diff = 14 companion pages, frontmatter only.
- Owner rulings on R1a follow-ups: (1) em-dash placeholder → `immunities: null` / `movement: "—"` in ~150 other statblocks: **Backlog ticket SC-412** (the R1b brief mis-cites it as SC-395; same item) (cross-book data rewrite). (2) sc-md statblock reader/writer lack a Skills cell: **fold** into the review-fix round (approved item 1 says every format). (3) drake immunity link stripped in structured data: **drop** — by design, book table keeps the link; mention in final evidence. (4) `validate <file> --scc-stable` single-book scoping: **drop** — the default whole-registry gate is the one used. (5) gofmt drift: **drop**, pre-existing. (6) stray `<wt>/.devbox/`: **fold** — R1b deletes it. Open question (embedded member `metadata` bloat): reviewer checks what existing statblock `features[]` carry and rules for consistency.
- R1b (dse, implementer) and R2a (steel-etl+sdk review, reviewer) dispatched in parallel 2026-10-17. SDK 3.1.0 unpublished → R1b codes against a local typed extension; pin bump is the last step after Scott publishes.

## R2a review outcome (2026-10-17, `sc390-r2a-review.md`): FIX ROUND NEEDED — 0 CRIT / 1 HIGH / 1 MED / 2 LOW / 7 INFO
- HIGH-1: data-sdk-npm branch sits on stale v3 (69c8d49) missing SC-155; every companion ds-sb throws `dto.isTrait is not a function` through `Statblock.modelDTOAdapter` (DSE's readYaml path) under npm 3.0.0 AND the prepared 3.1.0. Works after rebase onto origin/v3 0c924b3. **Consequence: the DSE pin bump to the rebased 3.1.0 is a hard requirement, not a nicety; Scott must publish 3.1.0 before the plugin fix ships.** Reviewer rejected the alternative of emitting `feature_type: trait` (contradicts ANNOTATION-GUIDE). Owner: agree.
- MEDIUM-1: embedded member features carry full `metadata` (house pattern across 513 statblocks: none). Fix: trim to `{scc}` only. Owner: fix.
- LOW-1 (docs accuracy incl. SCC API `types.json` bucket change), LOW-2 (stale comment + dead `feature-group` map entries in embed_cards.go): **fold** into R3a, incl. removing the dead entries and re-proving the site diff.
- INFO-4 (328 statblock json fail own schema on `features[].keywords: null` etc., pre-existing): **extend SC-412**. INFO-5 (SCC API `url` wrong for 685 entries, pre-existing): **Backlog ticket**. INFO-3 (companion features lack `icon`): drop, no render effect; noted for SC-392. INFO-7: superproject must rebase onto main 92e0bbf at landing (dispatcher).
- Also folded into R3a (from R1a follow-up 2): Skills handling in data-sdk-npm `MarkdownStatblockReader/Writer`.
- R3a dispatched 2026-10-17 by resuming the R1a implementer with findings verbatim. R1b told to hold the real-panther jest render until the rebased SDK tarball path arrives (NEEDS_CONTEXT if it gets there first).

## R1b interim (2026-10-17, `sc390-r1b-report.md`): NEEDS_CONTEXT (SDK tarball)
- dse `sc390-companion-ref` @ 9353f02 (5 commits on a337460). Done: Skills cell, empty-EV omit, `companionFields.ts` local type, companion-corpus fixture (panther only → 274→276), panther md-dse jest fixture + tests (red-first), docs/CHANGELOG. Baseline on clean a337460: jest 4431/2 skipped/219 of 220; shots 568, 0 FAIL; freeze 274/274. Provisional after (with a since-removed shim): jest 4441/1; shots 572; freeze exactly the 2 roleless-corpus mismatches. Parity not yet run. Hash files pending 2 identical runs on the final tree.
- Owner eyeballed `sc390-r1b-ev-before.png` / `-after.png`: the empty "EV" chip under the "Champion" role chip is gone; the keyword line tightens by a few px; nothing else moves. Good for Scott's sanction.
- Owner rulings on R1b questions: absent `ev` keeps "EV N/A" (existing pinned behaviour; real data always carries `ev`), only empty omits — keep. Single-companion fixture — keep. Other docs still saying "any entry" (`README.md:67,96`, `docs/migrating-to-7.md:218-221`, `docs/advanced-usage.md:152`): **fix them all** in the resume (consistency; Scott's deferral-docs rule).
- Waiting on R3a for the rebased SDK tarball + `sc390-r3a-panther-mddse.md`; then resume R1b for the final battery (2 shots runs, parity last).

## R3a outcome (2026-10-17, `sc390-r3a-report.md`): DONE
- steel-etl b42b901 (+8674e46 metadata trim, +b42b901 embed_cards cleanup); data-sdk-npm 8bfa335 rebased onto origin/v3 309061a (f995afe schema/types, c623f10 regression test, 8bfa335 sc-md Skills); superproject 65700aa; v2 unchanged 2af78d0. go test 847/0/0; SDK 426/426; registry 3,096; --scc-stable pass; Ajv companions 0 invalid; site diff byte-identical to R1a's (frontmatter only). Panther md-dse 86 lines. Tarball: `.superpowers/sdd/sc390-companion-ref/sc390-r3a-steel-compendium-sdk-3.1.0.tgz`.
- R1b resumed with the tarball + the three doc fixes; R4a scoped re-review of the R3a delta dispatched to the R2a reviewer (author-independent).
- R4a (2026-10-17, `sc390-r4a-rereview.md`): **APPROVE** — all four findings + folded sc-md item closed; tarball hash reproduced from 8bfa335; writer output byte-identical for 513 non-companion statblocks. New INFO: SDK sc-md reader's fixed organization set lacks Companion (and Retainer) → round-trip swaps `organization` into `role`. Owner: **Backlog ticket** (SDK bug, pre-existing class). steel-etl + data-sdk-npm side is land-ready pending R1b/R2b.

## R1b final (2026-10-17): DONE — dse `sc390-companion-ref` @ 5e4cdc2 (8 commits on a337460)
- Against the 3.1.0 tarball: tsc/lint clean; jest 4440/1 skipped/0 failed (219 of 220); shots 572, 0 FAIL, host-copy pin OK, button host-leak 112×3 = 672; freeze `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly the 2 roleless-corpus prints; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. `rebaseline.txt` (2) + `widening.txt` (2), identical across 2 runs; name diff 274→276, 0 removed. Committed tree is back on the 3.0.0 pin (tsc green) but the 2 panther tests + companion-corpus shots FAIL at runtime under 3.0.0 → **the dse branch cannot land until SDK 3.1.0 is published and the pin bumped.** Landing order: steel-etl + data-sdk-npm + superproject docs → Scott `just release 3.1.0` → dse pin-bump commit + battery → dse lands.
- Owner eyeballed `statblock-companion-corpus--steel-light.png`: eyebrow "Companion", PANTHER, keywords, Level 1 chip, stats 1M / 7 / = yours / 1 / 1 + M, Immunity/Weakness "-", Movement Climb, Skills Sneak, characteristics, Pounce (signature, Ferocity spend) + Mighty Spring (trait), no EV. Observation: the role chip reads "COMPANION" and the eyebrow also "COMPANION" (organization fills the role slot) — same mechanism as champions; cosmetic, to mention to Scott, not block.
- R2b independent review (fresh reviewer) dispatched 2026-10-17.

## R2b review (2026-10-17, `sc390-r2b-review.md`): FIX ROUND NEEDED (small) — 0/0/2 MED/2 LOW/6 INFO
- Battery + hashes reproduced byte-for-byte. Provenance-line ruling: trimmed state is the consistent one (no other statblock feature or the site shows origin/level in feature heads).
- MED-1: **Scott published SDK 3.0.1 (npm has 3.0.0, 3.0.1; not 3.1.0) and dse `origin/develop` is now 0ecb90e pinning 3.0.1.** With 3.0.1 the committed dse branch is fully green (jest 4440/1; all 572 shots byte-identical to the 3.1.0 run). → The plugin branch does NOT wait for a 3.1.0 publish; it rebases onto 0ecb90e. ~~Landing order: … Scott `just release 3.1.0` → dse pin-bump → dse lands~~ superseded: land everything after R3b; the 3.1.0 release + DSE pin bump (approved item 2) stays inside SC-390 as a final small round when Scott publishes, no longer blocking.
- MED-2: whitespace-EV test assertion vacuous (duplicate yaml key) → fix as prescribed. LOW-1 (`ev: null` prints "EV null"; site omits) → **fold**. LOW-2 (scalar `skills:` dropped) → **fold** with the prescribed coercion. Owner: do the right thing, both are one-liners in a file the round touched.
- data-sdk-npm `origin/v3` moved again → 544b3f0 (release-recipe commit); SDK branch re-rebases (expected clean).
- R3b (dse fix round, R1b author) + SDK re-rebase (R1a author) dispatched in parallel 2026-10-17.
- R3a2 (2026-10-17): data-sdk-npm rebased onto v3 544b3f0 → **c63cda2** (9fd6ee3 schema/types, afae0de regression test, c63cda2 sc-md Skills); 426/426; 12 SC-390 files only; schemas identical. Release for Scott: on v3 after landing, `just release 3.1.0` (check-auth → version commit → npm publish → push; no tags).
- R3b (2026-10-17): DONE — dse `sc390-companion-ref` @ **39cf35a** on 0ecb90e (9 commits); clean 0ecb90e freeze 274/274; final on 3.0.1 pin with no tarball: tsc/lint clean, jest 4440/1/0, shots 572 0 FAIL, freeze exactly the 2 roleless-corpus lines, parity 0/0/24; M3 mutation red; rebaseline.txt + widening.txt hashes unchanged. R4b scoped re-review dispatched to the R2b reviewer.
- R4b (2026-10-17, `sc390-r4b-rereview.md`): **APPROVE** — all findings closed, battery + hashes reproduced on the committed tree (3.0.1 pin). INFO: dse `origin/develop` moved 0ecb90e → be4f002 (SC-417 minions; no file overlap; freeze baseline still 274 lines, no SC-417 freeze record → no frozen bytes moved). Owner: final rebase round R5b (R1b author) onto be4f002 + battery, in parallel with the Scott evidence/sanction post (`sc390-c3-evidence-draft.md`).
- 2026-10-17: evidence + sanction ask posted (`sc390-c3-evidence.md`, 3 images); ticket In Progress + `Needs Review` (verified). Waiting on Scott: "sanctioned" for the 2-line roleless-corpus rebaseline (+ optional word on the duplicate COMPANION chip). R5b final rebase onto be4f002 running.
- R5b (2026-10-17): DONE — dse `sc390-companion-ref` @ **135716d** on be4f002 (9 commits, clean rebase). tsc/lint clean; jest 4458 passed / 1 skipped / 220 of 221 (+18 = SC-417's own tests); shots 572 0 FAIL; freeze exactly the 2 roleless-corpus lines; parity 0/0/24; rebaseline.txt + widening.txt hashes unchanged.
- **LAND-READY (pending Scott's "sanctioned"):** steel-etl b42b901 (→ main 0c74f4f); data-sdk-npm c63cda2 (→ v3 544b3f0); v2 2af78d0 (→ main 3aacc9a); draw-steel-elements 135716d (→ develop be4f002); superproject worktree 65700aa (docs; rebase onto workspace main at landing). Dispatcher applies at landing: `rebaseline.txt` (2 in-place) + `widening.txt` (2 appended), backup `freeze-baseline.sha256.pre-sc390-bak`, dated record in dse-verify SKILL.md; expected line after: `freeze OK (276/276 …)`.

## Scott ruling (2026-10-18, in-session): "sanctioned. land it."
- Verbatim: "sanctioned. land it." → the 2-line roleless-corpus print rebaseline is sanctioned; Scott (acting as dispatcher here, no separate dispatcher session) orders the landing. Owner runs `land-stack` on his explicit instruction. No word on the duplicate COMPANION chip → leave as is.
- 2026-10-18 LANDED by the owner on Scott's "land it": steel-etl main 1b57338 (rebased over SC-416 b155140, go test 9/9 ok), v2 main e95d2dc (rebased over b7dcce5), data-sdk-npm v3 c63cda2, dse develop 135716d, workspace main 3e0e526 (merge; CHANGELOG conflict = keep branch bullet) + 19969db (ledger + dse-verify record). Freeze baseline: backup pre-sc390-bak, 2+2 applied, `freeze OK (276/276)` against landed-tree shots. Env removed. Posted `sc390-c5-landed.md`. Remaining: Scott `just release 3.1.0` → final dse pin-bump round → close. Ticket stays In Progress + Needs Review for the publish ask.
