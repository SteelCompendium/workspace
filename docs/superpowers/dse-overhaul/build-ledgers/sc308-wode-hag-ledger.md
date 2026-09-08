# SC-308 — decisions ledger (Wode Hag "Snackies for Sweeties" villain action)

Ticket: https://linear.app/tski-home/issue/SC-308 · Worktree: `/home/scott/code/steelCompendium/worktrees/sc308-wode-hag` (every submodule on branch `sc308-wode-hag`)
Owner: Fable ticket-owner, session 1ef34ad4-89db-4dcb-99a9-ac3d665aaffa.

## Scott's rulings (verbatim, dated)

**2026-09-07 — ticket description (user bug report, Urgent):**
> On the Wode Hag's 1st Villain Action 'Snackies for Sweeties' there is only one table, this table has the bonus to be the power roll for the pie explosion, but it has the results of the PC Agility Test to remove a pie. Instead the table should show the values of 6, 10, and 13 poison damage depending on the tear, and the tables current outcomes should be labeled as an Agility Test in a second table.

No comments on the thread yet.

## Owner findings (2026-09-07, pre-dispatch)

- Source (`steel-etl/input/monsters/Draw Steel Monsters.md` ~L12479) is correct: `**Power Roll + 3:**` → 6/10/13 poison tiers, then `**Special:** … **Agility test** …`, then a second, header-less `≤11/12-16/17+` list.
- Both parsers keep ONE tier triple and let the second list overwrite the first:
  - `steel-etl/internal/content/featureparse.go` (`RichFeature.PowerRoll`, site render + featureblock ToMap) — `fbParseTiers` writes into the same `[3]string`.
  - `steel-etl/internal/content/statblock_parse.go` (`effects[].roll/tier1-3`, JSON/YAML data output) — same single `tiers` map.
- Sweep of blocks with >1 tier list in the Monsters source (all must be fixed by the same change): Snackies for Sweeties (Wode Hag), Caustic Detonator (war dog), No Escape (cryptic; two labeled `Power Roll + 3`), Overpower (Lord Syuul; two bare `**Reason test**` lists), Roll the Wheel (exploding mill wheel; labeled roll + bare list). ~~Heroes book has none inside an ability (only the potency rules-prose example).~~ superseded 2026-09-07: implementer found the conduit talent **Divine Dragon** (two labeled `Power Roll + Intuition` lists) in the Heroes book — separate parser pair (`ability.go` + `ability_cards.go`), → **SC-310** (Todo, High).
- Pre-existing, separate data bug found while looking: `statblock_parse.go` emits ONLY the roll entry when tiers exist and discards Effect/Special/enhancement prose from the JSON/YAML `effects` list (~714 roll-bearing statblock abilities). Site render is unaffected (it uses `RichFeature`). → **SC-309** filed (Backlog, related to SC-308), out of scope here.

## Owner rulings

- 2026-09-07: Label rule for a header-less tier list — derive the head from the bold `**<Characteristic> test**` phrase in the nearest preceding paragraph (→ "Agility Test", "Reason Test"); otherwise render bare (existing bare-test convention). Same label goes into data `roll`.
- ~~2026-09-07: The FIRST power roll keeps its current card slot (under Distance/Target). Every LATER tier list renders in document order, immediately after the block (section or prose paragraph) it follows in the source. Existing single-roll output must stay byte-identical (statblock golden test).~~ superseded by Scott's 2026-09-07 13:07 ruling below (exact document order; golden test WILL change, intentionally).

## Dispatch log

- 2026-09-07 r1: implementer (`orchestration:implementer`, Sonnet) dispatched on `sc308-brief-impl-r1.md`. Author of the branch — must NOT review it.
- 2026-09-07: SC-308 state → Awaiting (agent working). SC-309 filed (Backlog) for the statblock effects prose-loss.

## Owner rulings on r1 follow-ups (2026-09-07)
- Divine Dragon (Heroes ability path) → **SC-310** filed, Todo/High. Out of scope for SC-308 (different parser pair and render; SC-308 is Urgent for the Wode Hag).
- Three duplicate feature parsers (`featureparse.go` / `statblock_parse.go` / `statblock_page.go`) → **SC-311** filed, Backlog. Out of scope.
- r1 result: impl DONE — steel-etl `45db131`, data-sdk-npm `9cd46aa` (schema hand-sync), superproject `a8fd52c` (CHANGELOG). Owner eyeballed `sc308-wode-hag-villain-actions.png`: matches Scott's ask.
- r1 review dispatched (`orchestration:reviewer`, Opus) on `sc308-brief-review-r1.md`.

## Owner rulings on review r1 (2026-09-07) — verdict MERGEABLE, 0C/2I/6L/6INFO
- I-1 (no featureblock multi-roll render test) → **fold** into fix round r2.
- I-2 (Divine Dragon) → already **SC-310**.
- L-1 (sc-dice.js cross-highlights both panels; v2 hand-authored JS) → **fold** (v2 is on branch `sc308-wode-hag` in the worktree; user-visible glitch made reachable by this change).
- L-2, L-3 (schema descriptions for `trailing`/`post` precedence, both copies) → **fold**.
- L-4 (pointer-into-slice aliasing) → **fold** (store index or value copy).
- L-5 (test panics before nil-guard) → **fold**.
- L-6 (`sbFeature.Post` json:"-") → **fold** (`json:"post,omitempty"`, regenerate island inputs, expect 0 change).
- INFO-1 (single-list header-less test lists stay bare while multi-list ones get "Reason Test") → recorded as a deliberate r1 choice (byte-identity ruling wins). **Owner will put the universal-label question to Scott** in the review comment; not changed in r2.
- INFO-2 (`DeriveTestLabel` takes the first phrase, not the nearest) → **fold** (use the last/nearest match; add the comment).
- INFO-3 (data-sdk-npm has no test for `post`) → **drop**: schema is a hand-synced copy, `npm test` not runnable here.
- Fix round r2 → implementer (same identity, resumed). Scoped re-review of the delta → reviewer identity from r1 (did not author the fixes).
- 2026-09-07 r2 impl DONE: steel-etl `0eab815`, data-sdk-npm `7a18926`, v2 `09aabfe41f`. 8/8 ok, island inputs 0 diff, five abilities byte-identical to r1 evidence. Scoped re-review dispatched to r1 reviewer identity.
- 2026-09-07 review r2: MERGEABLE, all 8 folded findings OK, 2 new LOW advisory. N-1 (v2 now carries a branch too → landing pushes three submodules; a `deploy-v2` before landing would discard the sc-dice.js fix) → carried into the land-ready report. N-2 (CHANGELOG lacks the dice clause) → folded by owner (doc-only edit in the worktree superproject). Nit (line wrap) → dropped.
- 2026-09-07: Review comment posted; SC-308 → In Progress + Needs Review. Land-ready reported to dispatcher; the universal-label question does not block landing.

**2026-09-07 13:07 — Scott, comment on SC-308 (verbatim):**
> No these are not correct.  The order needs to be preserved exactly.  In "Snackies for sweetie" the order is
>
> * Effect with a Power Roll below/within it
> * Special with a Power Roll below/within it

## Owner rulings after Scott's 13:07 comment (2026-09-07)
- Render every statblock/featureblock feature's body in exact source order: spec table first (unchanged), then every block (Effect/Trigger/Special section, power-roll panel, prose paragraph, Malice enhancement) in the order the source writes it. No hoisting of the power roll above a preceding section. Applies to single-roll features too (62 Monsters abilities have a section before their Power Roll header; today's render hoists the roll above it — that is the same bug in a milder form, and "book-faithful" is the Read tab's contract). Golden test changes are intended this round; the diff must be shown and must consist only of reordering.
- The label rule for header-less test lists stands (derive from the nearest bold `**<Char> test**` in the preceding paragraph, else bare). The "≥2 lists" gate on the label rule is dropped: with document order universal, the same label rule applies to every header-less list (this also answers the open question from the first review comment — Scott's "exactly" makes consistency the rule).
- Heroes ability cards (`ability_cards.go`) remain SC-310's scope.
- SC-308 → Awaiting, `Needs Review` removed (Scott's answer landed). r3 fix round → implementer (resume).

**2026-09-07 — Scott, in session (verbatim):**
> Just to be clear, it migth be worth looking at the `data-sdk-npm` repo to see how it is handling statblocks like this.  The `effects` are expected to support nesting for strange abilities like this

## Owner rulings after the SDK look (2026-09-07) — supersede the r3 "blocks" design
- SDK model (`data-sdk-npm/src/schema/feature.schema.json` `definitions.effect`, `feature.schema.json.md` "Effects", `MarkdownFeatureWriter.writeEffect`): ONE effect entry may carry `name`, `cost`, `effect` (prose), `roll`, `tier1..3`, and nested `features[]`; the writer emits `**Name:** prose` → `**roll:**` → tiers → nested features. That is "Effect with a Power Roll below/within it".
- Therefore the statblock body model IS the ordered `effects` list, each entry = one labeled/prose paragraph plus the tier table that directly follows it. ~~r3 "blocks"/"post" ordered block list~~ dropped; the r1/r2 `post` schema addition is removed from both featureblock schema copies.
- Attachment rule: a tier list (with or without a `**Power Roll + N:**` header) attaches to the paragraph immediately before it (labeled section, cost enhancement, or bare prose) as that entry's roll/tiers. A tier list whose header follows the spec table directly (no paragraph between) is its own `{roll, tier1..3}` entry (today's common case, unchanged).
- Data `roll` value: the `**Power Roll + N:**` header text when present ("Power Roll + 3"); omitted for a header-less list (the entry's `effect` prose names the test, matching the SDK's "test effect" example). The site derives the display head for a header-less table from the label rule (nearest bold `**<Char> test**` in that entry's prose → "Agility Test"; else no head).
- Site render: walk the effects list in order; an entry renders its section head + prose, then its tier panel directly below, inside the same section container. Single-roll features included (no hoisting). Golden test changes intended.
- **SC-309 is folded into SC-308**: emitting the full ordered effects list carries the Effect/Special/enhancement prose that the statblock data path used to drop. Close SC-309 as done-by-SC-308 at landing.
- Featureblock features (`RichFeature.ToMap`, malice/terrain pages): the same internal model; `ToMap` emits `effects` in the SDK shape in addition to the existing flat `power_roll/sections/enhancements/trailing` fields (kept for the SDK featureblock schema + its test); `post` removed. Both schema copies updated.
- Heroes ability path stays SC-310 (note there: mirror the attachment rule).
- 2026-09-07: SC-309/SC-310 description patches no-op'd twice via MCP; notes posted as comments via linear-post.py instead. SC-309 closes at SC-308 landing.

## 2026-09-07 — r3b work lost; root cause (owner-verified from the worker transcript)
- The implementer ran `./steel-etl site --config pipeline.yaml` (wrong config — the site config is `../v2/site.yaml`). `pipeline.yaml` has no `docs_dir`, so the site builder resolved its output dir to the cwd and cleaned it: transcript shows `Output: /home/scott/code/steelCompendium/worktrees/sc308-wode-hag/steel-etl, Sections: 0, SITE_EXIT=0`. That emptied the steel-etl working tree (git-dir intact → `-` in `submodule status`). Uncommitted r3b work (5 source files, 6 tests, schema, docs, regenerated golden) lost. NOT systemic: `sc-300` and `sc201-finish` have every submodule but `v2` uninitialised with mtimes 2026-09-05/06 — never fully set up, not wiped today.
- Ruling: redo r3b. **Commit early and often on the branch** (WIP commits are fine; no squash required) so nothing is ever more than one step from git. **Never run `site` with `pipeline.yaml`; the only site config is `../v2/site.yaml`.**
- Ruling: fold a safety guard into this branch as its own commit — `steel-etl site` must refuse to run when `docs_dir` is empty, resolves to the cwd, or the resolved dir contains a `.git` entry; with a unit test. Record the footgun in `steel-etl/docs/site-builder.md`. (In-repo, small, clearly correct, and it just cost a full round.)
- 2026-09-07 r3c impl DONE: steel-etl `ff0614b` (docs_dir guard) … `8a4ce06` (6 commits), data-sdk-npm `69c8d49`, superproject `ca88d94`. 8/8 ok; golden 24 hunks (reorder/nest/rename); sweep 5292 files changed, 0 removed. Owner eyeballed `sc308-r3c-snackies.png` (Effect ⊃ Power Roll +3, Special ⊃ Agility Test) and `sc308-r3c-turned-upside-down-after.png` (Trigger above roll, Effect below): match Scott's ruling.
- Follow-up from r3c: 178 pre-existing schema-validation failures (null keywords/weaknesses/immunities; missing role/organization) → **SC-312** filed (Backlog). Out of scope.
- r3 FULL review dispatched (fresh `orchestration:reviewer`) on `sc308-brief-review-r3.md`.

## Owner rulings on review r3 (2026-09-07) — verdict FIX-NEEDED, 2C/1I/4L/6INFO
- C-1 (table-less statblock features lose every labeled section on the site card: End Effect/Solo Turns/Ajax Turns, 22 entities) → **fold**.
- C-2 (featureblock features with `body:` and no `effects:` render empty; 14 beastheart advancement featureblocks / 42 features) → **fold**.
- I-1 (`fbLabelRe` rejects linked labels → 154 data entries keep raw `**3 [Malice](…):**` markdown in `effect` instead of `{cost}`/`{name}`) → **fold**; label must be `linkDisplay`'d before classification, in all three parsers.
- L-1 (Trigger: data emits top-level `trigger` + standalone roll entry; site nests the roll in the Trigger section) → **accept the data shape** (the statblock schema declares top-level `trigger`; DSE renders `trigger` before `effects`, so consumer order is document order); **fold a doc sentence** in `docs/statblocks.md` stating this deliberate divergence.
- L-2 (`.fb__feat-intro` no longer emitted) → **fold**: emit `.fb__feat-intro` for the bare-prose entry that precedes the first roll (keeps the design's 0.65rem gap; no CSS change).
- L-3 (flat `power_roll` now = FIRST list, base was last) → **fold** as a documented, intended change: one sentence in `docs/statblocks.md` + CHANGELOG bullet.
- L-4 (superproject branch 1 commit behind origin/main; landing as-is would revert 6 docs) → **fold**: implementer fetches and rebases the worktree superproject branch onto `origin/main` (2 CHANGELOG commits) — and carried into the land-ready note for the dispatcher.
- INFO-1 (164 vs 178 schema failures — doc-set difference; no role/organization failures in the unified tree) → SC-312 stands; no action.
- Fix round r4 → implementer (resume). Scoped re-review of the r4 delta → r3 reviewer identity.
- 2026-09-07 r4 impl DONE: steel-etl `e7a19f5` … `bdab23e` (5 commits, HEAD `bdab23e`), superproject rebased onto origin/main → `9bfdf15` (CHANGELOG only). 8/8 ok; golden 0 HTML changes; lost-body-lines vs base = 0 (2 re-split instances hand-verified); I-1 fixed 154 entries. Scoped re-review r4 → r3 reviewer identity.
- 2026-09-07 review r4: MERGEABLE (0 new C/I/L, 7 INFO). Lost content vs base = 0 (word-multiset over 349 pages). End Effect 19/19 restored; beastheart pages 14/14 render; I-1 155 cost entries. Land-ready: steel-etl `bdab23e` (main), data-sdk-npm `69c8d49` (v3), v2 `09aabfe41f` (main), superproject `9bfdf15` (rebased on origin/main; CHANGELOG only). Comment posted; SC-308 → In Progress + Needs Review.
