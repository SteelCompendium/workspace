# SDD ledger — plan: docs/superpowers/plans/2026-09-06-search-ranking.md

Worktree: /home/scott/code/steelCompendium/worktrees/sc306-search (branch sc306-search in superproject + every submodule).
Spec: docs/superpowers/specs/2026-09-06-search-ranking-design.md (copied into worktree, uncommitted until Task 9).
Submodule bases at start: steel-etl 81c89b7, v2 6562ace.

## Preflight scan (2026-09-06)

| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1 bench ↔ T7 worker | shim sets globals MiniSearch / SCSearchCore via importScripts; worker reads those globals + addEventListener("message") | consistent |
| T1 NAMED ↔ site pages | expected locations for fog-of-war (tactician/level-2), free-strike (common/main-actions), goblin-warrior, brutal-slam, to-the-death, hide ×2, knockback ×2 | all files exist in v2/docs/Browse |
| T3 stripFeatIDs ↔ T4 featID | regex ` id="sc-feat-[^"]*"` vs prefix `sc-feat-` | consistent |
| T4 writeCardHeadSlot signature | 6 call sites, all inside renderCardHead | consistent |
| T6 core ↔ T7 worker | createEngine(MS, docs) / search(q,{suggest}); UMD attaches self.SCSearchCore | consistent |
| T7 hook ↔ Material 9.7.6 | `{% block scripts %}` exists in base.html; bundle reads #__config at execute time | consistent |
| T1 baseline worker path | plan says `v2/.venv/...`; worktree has no v2/.venv | Ruling below |
| T5/T10 build | plan uses `just update false` (gen without --all; stamps mkdocs.yml) | Ruling below |
| T2/T3/T4/T6 self-consistency | tests vs code in each task's text | consistent |

Ruling: Material's worker for the baseline/Part-A bench lives in the WORKSPACE venv at the worktree root (`.venv/lib/python*/site-packages/material/templates/assets/javascripts/workers/search.2c215733.min.js`), not `v2/.venv` — the worktree's devbox provisions one venv at the root. Costs nothing if wrong (path resolves or the bench errors loudly).
Ruling: local site builds mirror `just deploy-v2` steps without committing/stamping: `cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all && go run ./cmd/steel-etl site --config ../v2/site.yaml`, then `cd v2 && mkdocs build`. `just update false` omits `--all` (no monsters → goblin pages missing) and stamps mkdocs.yml. Generated v2/docs changes are NEVER committed by implementers (deploy commits them); v2 working tree is restored before landing. Cost if wrong: a rebuild.
Ruling: `data/data-unified` is not cloned in the worktree; gen writes there. Task 5 creates the directory (or clones SteelCompendium/data-unified if gen insists on a git checkout). Cost if wrong: a rebuild.

## Task log
Task 1: implemented (v2 9cfc74e); baseline recorded in task-1-report.md: #1 51.8%, feature/ability 46/100, MISS: brutal slam, goblin warrior, fog of war, to the death, free strike. Review dispatched.
Note (env): `devbox run -- bash -c '…'` breaks `$(...)` substitution; write a script file and run `devbox run -- bash <file>` when substitution is needed. Carry into every later dispatch.
Task 1: fix round 1/5 (1 addressed, 0 open — commit trailers stripped; v2 9cfc74e amended to a0caf79). Ruling: re-review skipped — the finding was the commit message only, controller verified `git log -1 --format=%B` shows the bare subject. Costs nothing if wrong (message is visible in git).
Task 1: complete (commits 6562ace..a0caf79, review clean after fix)
Note (env): the harness auto-appends Co-Authored-By/Claude-Session trailers to subagent commits. Every implementer dispatch must require `git log -1 --format=%B` verification + amend.
Task 2: implemented (steel-etl 2d2f863, trailer-free). Review dispatched.
Task 2: complete (steel-etl commits 81c89b7..2d2f863, review clean)
Task 2: minor (deferred): docs/site-builder.md reworded "before the four Rival Fury statblocks" → "before the statblocks" beyond the brief (harmless).
Task 3: implementer dispatched (steel-etl base 2d2f863).
Task 3: implemented (steel-etl 6677235, trailer-free). Review dispatched.
Task 4: implementer dispatched (steel-etl base 6677235).
Task 3: complete (steel-etl commits 2d2f863..6677235, review clean)
Task 3: minor (deferred): stripFeatIDs regex needs a leading space before `id=`; unreachable today, comment-worthy if reused.
Task 4: implemented (steel-etl 545b65e, 4 goldens regenerated + 2 string tests updated). Review dispatched.
Task 5: runner dispatched (build + bench Part A; no commits). Ruling carried: deploy-v2-style build commands, script files for $(), root venv worker path.
Task 6: implementer dispatched (v2 base a0caf79; explicit-path staging because v2/docs is dirty from the Task 5 build).
Task 6: implemented (v2 4ed751c, trailer-free, 13 + 99 tests). Review dispatched.
Task 4: review → Important: monster_malice.go buildMaliceBandCache renders features without f.ID (family Malice bands spliced into statblock leaf pages get no sc-feat- id). Fix round 1 dispatched to the original implementer.
Task 4: minor (deferred): slugify on raw markdown link names in test fixtures yields ugly ids (sc-feat-solo-solo-md-monster); test-only.
Note: Task 5's build used steel-etl 545b65e (pre malice fix). Task 7 must regenerate fully (gen --all + site + mkdocs build) so the Part B bench includes the Task 4 fix.
Task 4: fix round 1/5 (fix committed steel-etl 8d21c38 malice-band ids + TestBuildMaliceBandCache_FeatureIDs; re-review dispatched)
Task 4: fix round 1/5 (1 addressed, 0 open — malice-band ids; commits 545b65e..8d21c38)
Task 4: complete (steel-etl commits 6677235..8d21c38, review clean after fix)
Task 6: review → Important ×2: (1) suggestFor scans all groups instead of items[0] (`fury` → ["furyrival"] on live index); (2) stripTags deletes tags with "" welding words (715/7,936 docs). Fix round 1 dispatched to the original implementer.
Task 6: minor (deferred): earlier query terms highlighted as prefixes not whole words; single-letter terms dropped from highlight and shift the prefix slot; orphan section drops its group silently; two tests pass without boostDocument / without last-term-only prefix (no direct boostDocument test); untested 300-cap/snippet window; `tags` not carried into Doc (Material renders tag chips; site has no tags plugin); per-hit highlight cost paid before the 300 cap (~170-200 ms for one-letter queries on 7,936 docs); lookbehind regex built at call time (Safari <16.4 would throw).
Note: live index after Part A has 7,936 docs (was 5,401) — nested feature sections added more than embedded-card exclusion removed. Check bytes in the Task 5 report.
Task 6: fix round 1/5 (fix committed v2 92d39c3; re-review dispatched)
Task 5: DONE_WITH_CONCERNS — build ok (mkdocs 230 s), index 7,936 docs / 5.80 MB (prod 5.85 MB), polluted titles 1 (a statblock embed), #1 61.4% (target ≥85%), feature/ability 60/100; brutal slam + goblin warrior ok; fog of war, to the death, free strike MISS.
  Root cause (verified by the runner against Material's Parser class): Material's `skip` set hashes Elements by tag name, so a `data-search-exclude` on a <div>/<section>/<article> root is REMOVED from the skip set at the first nested close of the same tag — the rest of the card leaks into the container page's section text/title.
Ruling (plan defect, Task 3): wrap each spliced card in a block-level tag that never occurs inside any card — `<address class="sc-embed" data-search-exclude="">…</address>` (aside/figure/fieldset/dl/div/section/article all recur or carry Material/UA styling or an ARIA group role; address has role=generic and no Material CSS) — plus `.sc-embed{display:contents;font-style:inherit}` in v2 CSS so the box tree and typography are unchanged. Task 3's markSearchExcluded becomes a wrapper; tests updated. Cost if wrong: one more round on the wrapper tag; container-page CSS selectors using `+`/`>` on card roots are the risk to audit (62 combinator selectors in v2 CSS).
Task 3b: dispatched (steel-etl base 8d21c38, v2 base 92d39c3): wrapper + CSS + rebuild + Parser check + Part-A bench rerun.
Task 6: fix round 1/5 (2 addressed, 0 open — suggest top-group only; stripTags with separator; commits 4ed751c..92d39c3)
Task 6: complete (v2 commits a0caf79..92d39c3, review clean after fix)
Task 3b: implemented — steel-etl 34b08d9 (address wrapper), v2 f6bb746 (.sc-embed CSS). Material Parser check on fury class + goblin group pages: 0 polluted sections; index polluted titles 0; 3,668 nested feature sections. Part-A bench (Material worker): #1 75.4%, feature/ability 85/100; ok: fury, brutal slam, goblin warrior, fog of war, hide, knockback; MISS: to the death (→ death-death), free strike (→ rule/monster/creature-free-strike).
Ruling: Part A accepted at 75.4% (< the plan's 85% estimate). The plan's number was a guess; the verified root cause (embed pollution) is fixed to zero, and the remaining misses are lunr's OR/wildcard/stop-word behaviour, which is Part B's job. The binding acceptance is A+B ≥95% (Task 7 gate). Cost if wrong: Part B fails its gate and we revisit.
Task 3b: selector audit found one regression: steel-kit.css:80 `.sc-kit + h3[data-scc] + .sc-ability` no longer matches the wrapped card. Fix round 1 dispatched (selector list gains `+ .sc-embed > .sc-ability`).
Task 7: implementer dispatched (v2 base 92d39c3 + f6bb746; mkdocs build only, bench --gate).
Task 3b: fix round 1/5 committed (v2 6d329f6 kit selector). Review dispatched (steel-etl 8d21c38..34b08d9 + v2 92d39c3..6d329f6).
Task 3b: complete (steel-etl 8d21c38..34b08d9, v2 92d39c3..6d329f6, review clean)
Task 3b: minor (deferred): embed_cards_test.go not gofmt-clean (map literal alignment) — fold into the final fix wave; kit selector alternatives differ in specificity (mutually exclusive, harmless).
Task 5: complete (verification only; superseded by Task 3b's rerun — Part A final: #1 75.4%, pollution 0).
Task 7: implemented (v2 91d16e0 core boost rule + 47b777b worker/hook). Bench gate PASS: #1 98.2%, feature/ability 100/100, setup ~1.6 s, all 8 named ok.
Ruling: accept the core rule change — a page's `boost` applies only to its root doc (location without `#`), not to its heading-anchor sections. steel-etl stamps boost on every chunk; a boosted class page's empty {data-scc} heading section ("Aspect Triggered Action") otherwise ties the exact-title tier with the real leaf and wins on boost. Deviation from spec rule 2 ("boostDocument = the doc's boost"); spec to be amended in Task 9. Cost if wrong: class-page sections rank below leaves for their own names — which is the desired behaviour anyway.
Task 7: minor (deferred): main.html comment references the ADR path Task 9 creates; 9 residual sweep misses from BM25 length normalization.
Task 7: review dispatched. Task 8: implementer dispatched (v2 base 47b777b; site already built with the worker).
Task 9: implementer dispatched (workspace + v2 docs; measured numbers and the two discovered facts supplied; spec amendments a-d).
Task 8: implemented (v2 4855220; 3/3 ok twice; waitForFunction on h= param instead of waitForSelector). Review dispatched.
Task 9: implemented (workspace daf78c5, v2 2d9a458). Review dispatched.
Task 7: review → Important: root half of the boost rule untested (mutation `return 1` stays green). Fix round 1 dispatched (new tie fixture + assertion; also guard `stored.location` undefined).
Task 7: minor (deferred): worker header says Material 9.7.6 but installed is 9.7.7 and mkdocs-material is unpinned everywhere (devbox.json, v2/devbox.json, v2 CI) — final fix wave: say "9.7.x" and note the unpinned install; worker header points at a troubleshooting section title that Task 9 must match ("Search results wrong after upgrade"); setup failure posts no {type:1} (same as stock Material); bench shim bypasses the real UMD global-attach path (reviewer covered it manually).
Task 8: complete (v2 commits 47b777b..4855220, review clean)
Task 8: minor (deferred): header run-instructions omit the `mkdocs build` step the sibling e2e lists; async IIFE lacks a top-level .catch (timeout crashes via unhandled rejection rather than a clean FAIL line) — final fix wave.
Task 7: fix round 1/5 committed (v2 e08dae3, on top of Task 9's 2d9a458; re-review dispatched)
Task 9: review → Important ×2: fact 1 (address wrapper) only linked, not stated, in architecture.md; 45% vs 46/100 class-ability baseline inconsistency in ADR + spec. Fix round 1 dispatched.
Task 9: minor (deferred): spec acceptance section still reads "≥95%" above the Results table (a target, not a result) — add "met" note in the final fix wave if cheap.
Task 7: fix round 1/5 (2 addressed, 0 open — root-boost tie test + location guard; commits 2d9a458..e08dae3)
Task 7: complete (v2 commits 6d329f6..47b777b + e08dae3, review clean after fix)
Task 9: fix round 1/5 committed (v2 6ec12e7, workspace c7e224d); re-review dispatched
Final whole-branch review dispatched (opus) over steel-etl 81c89b7..34b08d9, v2 6562ace..6ec12e7, workspace 9db185c..c7e224d, with the deferred-minor list.
Task 9: fix round 1/5 (2 addressed, 0 open — architecture.md recap; 46/100 everywhere; commits v2 e08dae3..6ec12e7, workspace daf78c5..c7e224d)
Task 9: complete (review clean after fix)
All tasks 1-9 complete; Task 10 (land + report) waits on the final whole-branch review.
Final review: Ready "with fixes". Important: (1) lookbehind regex in sc-search-core.js:67 throws on Safari <16.4 → silent empty results; (2) Task 10 brief's `just update false` contradicts the build ruling; (3) dirty trees before wt-finish: v2/devbox.lock (tracked, non-generated!), regenerated v2/docs/**, steelCompendium.github.io/docs/api/v1/*.json. Minor: duplicate sc-feat id when a statblock feature and its malice-band feature share a name (1 page); md-link feature names → junk anchors (53 pages, NOT test-only — earlier triage wrong); kitSignatureCardHTML splice path not excluded (docs overstate "every card"); site-builder.md wrapper documented under card_head not embed_cards; worker header 9.7.6/heading drift; gofmt regression; no CI tripwire for the soft hook (follow-up ticket).
Fix wave dispatched (single fixer): lookbehind→\b, gofmt, worker header, site-builder.md section, wrap kitSignatureCardHTML, malice id namespace, md-link unwrap in featID.
Final fix wave committed: v2 5fce582, steel-etl 5035174 (19/19 core, 105/105 suite, gate PASS 98.2%, go test ok, link-test golden id-only regen). Scoped re-review dispatched.
Landing prep (controller, worktree only, nothing pushed): restored build byproducts (v2 devbox.lock + 755 regenerated docs files; steelCompendium.github.io docs/api/v1/*.json); v2 branch rebased onto origin/main fcf60d5 (SC-201 CSS, no file overlap) → tip d0864cd, 12 commits, 0 trailers; superproject merged origin/main 79f94cd (CHANGELOG auto-merged, both bullets present; data-sdk-npm pin synced to 0cc5ff8); v2 unit tests 105/105 after rebase. Removed the uncommitted plan/spec copies from the shared main checkout (they are committed in the worktree).
Ruling: STOP before `wt-finish`. docs/git-workflow.md: "Pushing v2 main IS a deploy" (CI gh-deploys every push) — landing puts the new worker live immediately against the currently deployed (old-format) docs, and Part A's regenerated content needs a `just deploy-v2`. Deploy timing is Scott's call; present the choice.
Pending before pointer-bump commit: final fix-wave re-review verdict.
Final fix wave: re-review clean (8/8 addressed). Final whole-branch review: satisfied with fixes.
Landing: pointer bumps committed in the worktree superproject (steel-etl 5035174, v2 d0864cd); ledger preserved to docs/superpowers/dse-overhaul/build-ledgers/sc306-search-ledger.md. wt-finish NOT run — awaiting Scott (v2 push = live deploy of the worker; content regen needs `just deploy-v2`).
