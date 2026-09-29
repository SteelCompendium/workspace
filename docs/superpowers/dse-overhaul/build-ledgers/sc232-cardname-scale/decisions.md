# SC-232 decisions ledger — Steel card-head NAME type scale

Owner: Fable ticket-owner. Worktree: `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`
(branch `sc232-cardname-scale` in every submodule). DSE tracked branch: `develop`.
Base at cut: dse `origin/develop` = `619c4bd` (SC-340 landed).

Workers read THIS file, never the tracker.

## Ticket framing (from the ticket body, 2026-08-28; not a Scott ruling)

- Claim: plugin `.dse-head__primary--left` (the card NAME) is 20px / 23px line-height vs the
  site's `.sc-head__left-primary { font-size: 1.5rem; line-height: 1.04 }`, stated there as
  24px / 24.96px → plugin at 83%. Eyebrow 13.6px vs site `.9rem` stated as 14.4px (94%).
- Crest is already at parity (`.dse-crest--lg` 48 x 54.39 vs site 50 x 56). Re-check the
  crest/name ratio afterwards (site 56/24.96 = 2.24; plugin 54.39/23 = 2.37).
- Parity gate cannot see it: the `head` pair maps `.sc-head` <-> `.dse-head` (wrapper), so the
  name slot's font-size is never compared.
- Same 20px name on feature, statblock, kit — one shared Steel rule.
- Deliberately a cross-family Steel type-scale change (interacts with head row-gap and the
  right rail's optical centering).

## Owner notes (2026-09-25)

- **The ticket's 24px target is suspect.** v2 `extra.css` pins `html { font-size: 125% }` =
  20px rem base, so the site's 1.5rem = 30px (x `--md-large-header-scale`), and per-family
  overrides exist: ability card 1.85rem, statblock 2.3rem, featureblock 2.1rem, project
  1.35rem, index preview 1.3rem. SC-235's ticket uses the 20px rem base; SC-232's used 16px.
  The plugin also has in-source site->plugin ratio comments (styles-source.css ~7816, ~7915).
  Round 1 (survey) settles the real target before any code moves.
- SC-235 (section-title scale) is run as a PAIR with this ticket; Scott decides both the same
  morning. Its ledger (when it exists): `.superpowers/sdd/sc235-section-title-scale/`. The two
  asks must use the same rem-base convention and not contradict each other.

## Session constraints (dispatcher, 2026-09-25)

- No tags/releases/RCs on draw-steel-elements, ever. Never touch DSE `main`. No `just deploy*`.
- No freeze-baseline change without Scott's written sanction on the ticket; never edit the
  shared baseline (`.superpowers/sdd/freeze-baseline.sha256`, 260 lines). If frozen print
  bytes move, ship `rebaseline.txt` + before/after crops in this dir.
- Kill processes only by PID, and only ones whose command line contains this worktree's path.
- Commit after each coherent step.
- Overlap watch: SC-284 (`.dse-head` narrow stacking, cardHead block in styles-source.css),
  SC-231 (`.dse-feature__kw*`), SC-236, SC-255, SC-338, SC-272, SC-230, SC-317 — all unlanded.

## Scott rulings

(none yet)

## Round 1 result (survey, 2026-09-25) — report `sc232-r1-survey-report.md`

- Ticket's 24px target is wrong: site root is 20px, `--md-large-header-scale` 0.90. Measured
  site names: generic 27px/28.08, ability 33.3/33.3, statblock 41.4/39.33, featureblock
  37.8/37.04. Plugin 20px/23px everywhere (74% / 60% / 48% / 53%) from the unscoped rule
  `styles-source.css:13636-13643` reading `--dse-fs-heading`.
- Convention (parity README rule 4): compare raw computed px. SC-235 uses the same one.
- Site statblock drops its name to 33.3px below a 34em viewport (`steel-statblock.css:630`).

## Owner rulings (2026-09-25; not Scott's — he decides the size)

- **Implement Option A (per-family site parity, screen-only)** on the branch as the proposal
  Scott will see; Option B (one shared 27px) and "leave as is" are the alternatives in the ask.
- **Narrow widths must not get worse than a readable wrap.** Mirror the site's own narrow
  step-down (statblock 41.4 -> 33.3 under 34em) as a container-width rule scoped inside the
  new SC-232 rule group. Do NOT edit SC-284's cardHead hunks (~13588, ~13671).
- **Follow-ups:** per-family parity name pairs -> FOLD (separate commit; it is the ticket's
  own "why"). Stale `.fb__feat-name` comment ~7911 and the ~7816/~7915 ratio comments -> FOLD
  (comments only; they must describe the new truth). Crest / eyebrow / right-rail sizes ->
  FILED as **SC-367** (Backlog) — OUT OF SCOPE here.

## Posting correction (dispatcher relaying Scott, 2026-09-25)

- This owner runs on Opus 5.5, not Fable. Post every comment with `--model opus-5.5`
  (never `--model fable`).

## Round 2 result (implementer, 2026-09-25) — report `sc232-r2-implement-report.md`

- dse head `690582f` (b96ba51 rule + narrow guard; 2ec888b comments; 611c638 parity pairs +
  site-baseline regen; 690582f harness `scrollToPrint` for statblock-sticky-narrow).
- Gates: jest 4038/1/208 of 209/3; lifecycle 19/19; shots 524 0 FAIL; freeze 260/260;
  parity 0 GAPs / 0 undeclared / 24 DECLARED (+8 `ink` rows).

## Owner rulings, round 2 (2026-09-25)

- Name `ink` divergence -> FILED as **SC-368** (Backlog). The 8 declared `ink` rows must cite
  SC-368, not SC-367 (SC-367 is sizes only). Retarget in the fix round.
- Degenerate 0-width grid column in `statblock-sticky-narrow` nested names (pre-existing):
  pending reviewer's check of whether SC-284 fixes it; file only if it does not.
- Owner eyeball of `r2-evidence/sc232-compare-wide.png` (2026-09-25): REJECTED as evidence.
  (a) The "Option B (shared 27px)" column renders at Today's size — the probe did not apply.
  (b) The "Site" column is a 1440-wide capture downscaled into the same tile width as the
  900-wide plugin crops, so the site's name looks smaller than it is. Every column must be at
  the SAME CSS-px-to-image-px scale (crop, never rescale one column differently). Redo in the
  fix round.

## Round 3 result (independent review, 2026-09-25) — `sc232-r3-review-report.md`

FIX-FIRST: 1 HIGH, 2 MEDIUM, 4 LOW. Gates all green at `690582f`; print clean; parity pairs
proven able to fail; harness `scrollToPrint` correct; parity site-baseline regen legitimate;
0-width grid column is pre-existing and fixed by SC-284 (-> not filed, per the round-2 ruling).

## Owner rulings, round 3 (2026-09-25)

- **HIGH-1 (narrow names break mid-word worse than today without SC-284): fix in THIS branch,
  standalone — do NOT stack on SC-284** (it is parked on Scott; SC-232 must land in either
  order). Rule: at the narrow threshold, the band names (statblock, featureblock) and any
  generic/sub-feature name that gains a mid-word break fall back to TODAY's size, so the
  narrow captures are no worse than base `619c4bd` (0 new mid-word breaks, line counts <= base).
  Revisiting narrow sizes after SC-284 lands is noted in the Scott ask, not filed.
- **LOW-2 folded and upgraded:** do NOT add a new `container-type` to `.dse-sb` (collapses the
  card to 2px under a fit-content ancestor). Reuse an ancestor that ALREADY carries
  `container-type` in develop; if none reaches these heads, stop with NEEDS_CONTEXT.
- **MEDIUM-1: fix as the reviewer prescribed** (trait stays generic 27px; kit signature ability
  inline gets 33.3px; add a `name-kit-signature` parity pair).
- **MEDIUM-2 + owner evidence rejection: redo all evidence** (see the round-2 rejection above).
- **LOW-1 fold** (SC-368 citations). **LOW-3 fold** (project name 28.8px) if the plugin renders
  a project head; else drop with a line in the report. **LOW-4 fold** (CHANGELOG `## Unreleased`
  bullet in the WORKTREE superproject's CHANGELOG.md).
- Landing note for the dispatcher: SC-235 will conflict on parity declared-deferral counts;
  land the two in sequence.

## Base moved (dispatcher, 2026-09-27)

- origin/develop = `e9bc15e` (SC-243 landed on 619c4bd: compendium Sync/Check busy state).
  Freeze baseline unchanged at 260. Round 4 rebases onto it before final gates.

## Round 4 result (implementer, 2026-09-27) — `sc232-r4-fix-report.md`

- dse head `9f61345` rebased on `e9bc15e`; superproject CHANGELOG commit `de8b5cf5`.
  MEDIUM-1, MEDIUM-2, LOW-1, LOW-3 (project 28.8px), LOW-4 done. Gates: jest 4063/1/210 of
  211/3 (base 4063 too); lifecycle 19/19; shots 524/0; freeze 260/260; parity 0/0/26 DECLARED.
- HIGH-1 BLOCKED: no existing `container-type` ancestor reaches the heads; narrow unguarded
  (6 of 12 names gain lines; "Bloodstones" a new mid-word break).

## Owner ruling, round 4 (2026-09-27) — supersedes part of the round-3 LOW-2 ruling

- ~~"Reuse an ancestor that ALREADY carries `container-type` in develop; if none reaches these
  heads, stop with NEEDS_CONTEXT."~~ superseded by: **make `.dse-head` itself the query
  container, EXACTLY as the unlanded SC-284 branch does** (`container-type: inline-size;
  container-name: dse-head;` — SC-284 `33b58c3`, worktree `sc284-cardhead-narrow`, whose
  comment carries the per-consumer containment analysis incl. Chromium 106 layout
  containment). Differences: SC-232's copy is Steel **screen-only**
  (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-head`), lives in the SC-232 rule
  group (not SC-284's cardHead hunks), and its comment cites SC-284's analysis. Same name and
  type, so the two branches land in either order; whichever lands second may drop the
  redundant copy. Still forbidden: `container-type` on `.dse-sb` / `.dse-fb` / any card root.
- Narrow rule unchanged: under `@container dse-head (max-width: <X>px)` the names fall back to
  TODAY's size. Pick X by measurement so the acceptance bar holds (0 new mid-word breaks, line
  counts <= base, every narrow capture); report X and the table.

## Base moved again (dispatcher, 2026-09-27)

- origin/develop = `1adfe29` (SC-230 landed: DSE modals follow the text-size setting; modal
  body and title type scale with it). Freeze unchanged at 260. SC-232 must not override or
  break SC-230's modal title scaling: check every name rule's reach inside `.dse-modal`
  (incl. `:is([data-dse-element], .dse-modal) .dse-head__primary--left` ~7523).
- origin/develop = `36635e9` (SC-272 landed: by-SCC rule-card eyebrow, singular rule group).
  Freeze unchanged at 260. Final gates measured at a head rebased on `36635e9`.
- Owner eyeball of `r4-evidence/sc232-compare-wide.png` (2026-09-27): still REJECTED. The
  Option B column matches Today's apparent size; the kit row carries the whole kit body; the
  "trait" row shows an ability (COVERAGE STRIKE). Rebuild ordered with a per-row
  measured-width table.

## Round 5 result (implementer, 2026-09-27) — report updated in place `sc232-r4-fix-report.md`

- dse head `91c7100` on `36635e9`. `.dse-head` container (Steel screen-only) + `@container
  dse-head (max-width: 480px)` fallback to today's size. Wrap table base==head (0 new breaks).
  SC-230 modal scaling unaffected. jest 4099/1/211 of 212/3 (== base); lifecycle 19/19;
  shots 524/0; freeze 260/260; parity 0/0/26 DECLARED.
- Owner eyeball of the rebuilt wide composite: ACCEPTED.
- Tidy-up note: SC-284 and SC-232 both declare `container-name: dse-head` on `.dse-head`;
  whichever lands second drops its copy (land-time note, no ticket).
- origin/develop = `ade5064` (SC-236 landed: ds-feature example.yaml, entry.ts fixture, feature
  tests). Freeze baseline changed 8 lines (feature, feature-collapsed, feature-spend,
  chrome-collapsed-rollout × steel-print/realprint), still 260. SC-232 ships no rebaseline.txt.
  Rebase after the r6 re-review; expect a possible entry.ts overlap (SC-232's scrollToPrint).
- origin/develop = `b029baa` (SC-255 landed: ds-skills collapse header removed). Freeze 20 lines
  changed (10 Skills ids × twin/realprint), still 260. SC-232 ships no rebaseline.txt. Final
  rebase target is now `b029baa` (or later).

## Round 6 result (scoped re-review, 2026-09-27) — `sc232-r6-rereview-report.md`

- LAND-READY-AS-PROPOSAL. 0 CRIT/HIGH/MED. LOW-1 CHANGELOG wording stale (narrow still
  "in progress"); LOW-2 comment ~7355 says `.dse-head` "never" loses natural width (negotiation
  under a fit-content ancestor narrows 662 -> 464, no collapse). Both FOLD into the final
  rebase round. INFO: 482–590px statblock mixed sizes (in the ask); dse-verify expected
  numbers -> 26 DECLARED at landing (dispatcher note).

## Final state (2026-09-27)

- dse `bd2087e` on `develop` `b029baa`; worktree superproject CHANGELOG `60ae70b`. LOW-1/LOW-2
  folded. jest 4101/1/211 of 212/3 (== base); lifecycle 19/19; shots 524/0; freeze 260/260;
  parity 0/0/26. No rebaseline.txt (print unchanged).
- Consolidated ask POSTED (A / B / leave), ticket In Progress + Needs Review. PARKED.
- Landing notes for the dispatcher: update dse-verify expected parity to 26 DECLARED; SC-235
  will conflict on parity declared counts (land in sequence); SC-284 and SC-232 both declare
  `container-name: dse-head` on `.dse-head` (second to land drops its copy); SC-284 merges
  cleanly except SC-284's own dse CHANGELOG vs develop.

## Scott ruling 1 (2026-09-27 16:49, comment b45ad7e4) — VERBATIM

> I think there is more going on here.  Some cards are missing some of the header chips (or
> whatever they are called).  For example, in the screenshots you posted, the "Determination"
> trait is missing the lower-left "human" part.  There needs to be more work done to fix these up

Owner reading (2026-09-27): Scott did NOT pick A/B/leave explicitly. He widened SC-232 to the
card-head SLOT CONTENT: the plugin's heads are missing slots the site fills. In the r4 wide
composite the site shows a lower-left line under the name (trait "Human", ability "Tactician",
statblock "Human, Humanoid", kit signature "Panther") and extra right-rail lines (kit
signature "MAIN ACTION"); the statblock site eyebrow is "MONSTER" where the plugin's eyebrow
carries "HUMAN, HUMANOID". Working assumption: keep Option A (his direction is toward MORE site
parity); the next ask re-confirms the size together with the slot work. Ticket -> Awaiting,
Ready for Agent label removed.

## Dispatcher session update (2026-09-27)

- origin/develop = `afd6ae3` (SC-231, SC-284, SC-338 landed; SC-317 landing — fetch right before
  rebasing). SC-284 landed its `.dse-head` container (`container-name: dse-head`): DROP
  SC-232's duplicate declaration on rebase (keep the Steel screen-only @container rule).
- SC-235 in flight at 10 declared on its branch; whoever lands second reconciles parity count.
- develop gates: freeze 260 (≈95 hashes changed by sanctioned rebaselines), lifecycle 19,
  parity 16 declared.
- origin/develop = `5a20d5f` (SC-317 landed: external-link ::after icon in styles-source.css).
  Freeze unchanged at 260. Next implementation round rebases onto it (or later).

## Round 7 result (slot survey, 2026-09-27) — `sc232-r7-slot-survey-report.md`

21 differing slots: 12 (b) data present/unmapped, 5 (d) different slot, 3 (a) fixture-only,
1 (c) not in input. Scott's "Human" = (b): `metadata.ancestry` present, `renderFeature.ts`
cardHead never passes `leftDeck`. Work items W1–W8 in report §3 with frozen-line counts.

## Owner rulings, round 7 (2026-09-27)

- Scope for SC-232, per Scott ruling 1 ("There needs to be more work done to fix these up"):
  implement **W1, W8, W5 (+ fixtures a1–a3)** first (print-neutral), then **W3 → W2, W7, W4**
  and W1's inline-kit-signature parent-kit name (print-moving), each item its own commit(s)
  so any one can be dropped. "Signature Ability" -> "Signature" normalization: include as its
  own commit (its ids are a subset of W4's 27 statblock ids, so it adds no lines once W4 is in).
- Print-moving items ship ONE combined `rebaseline.txt` (final-state hashes) + a per-item map
  of which ids each item moves + before/after crops per item. No baseline edit without Scott's
  written sanction.
- W6 -> folded into **SC-367** (crest-size territory; appended to that ticket). NOT here.
- c1 book chip -> filed **SC-371**. Companion statblocks render no card -> filed **SC-370**.
- Option A name sizes stay as the working proposal; the next ask re-confirms size + slots.

## Round 8a result (2026-09-27) — `sc232-r8a-report.md`

- dse head `6828e11` on `5a20d5f` (7d6b110 rebase+drop dup container; 9429630 W1; 4855897 W8;
  fdd028b W5; ca34ab6 cardHead.test fallout; 6828e11 compendiumInsert.ts fallout fix — OUT OF
  the planned scope, must be reviewed). Superproject `d66c6fe` (worker bumped the pointer).
- jest base 4118 -> 4147 (+29); lifecycle 19/19; shots 532 -> 540 (2 new fixtures × 4);
  freeze 260/260; parity 0/0/26.
- Owner eyeball of `r8-evidence/sc232-slots-neutral.png`: content correct (Human / Tactician /
  Fury / Feature / Malice). Site column was shot in LIGHT scheme vs plugin DARK — redo in dark
  for the ask.
- Summoner origin in featureblock left-deck: FOLD into 8b if purely data-driven, else drop
  with one line.

## Resume after 429 (2026-09-27 18:11)

- 8b worker killed ~16:20 after items 1–6 (dse `fa9addc`: ef4e1ff W3+W2+W7+Signature;
  b68e97f W4; fa9addc W1b) and `rebaseline.txt` (78 lines) + `rebaseline-map.md`. Resumed to
  finish: scratch-baseline freeze check, determinism, item 7, CHANGELOG, evidence (site DARK),
  battery, report. origin/develop still `5a20d5f`.

## Round 8b result (2026-09-27) — `sc232-r8b-report.md`

- dse head `fa9addc` on `5a20d5f`; superproject `6fe097f` (CHANGELOG only, no pointer bump).
- `rebaseline.txt` 78 lines / 39 ids, deterministic ×3, scratch-substituted baseline clean;
  per-item map in `rebaseline-map.md`. jest 4170 (base 4118); lifecycle 19/19; shots 540/0;
  parity 0/0/26.
- Item 7 (summoner origin) dropped -> filed as Backlog (see tracker). 
- Owner eyeball of `sc232-slots-print-screen.png` + `sc232-print-before-after.png`: content
  matches the site except (to review) the statblock sub-feature shows a "MAIN ACTION" chip the
  site does not; the sub-feature's "ABILITY" eyebrow + shield are SC-367 (W6). Print crops look
  intact (no overlaps/clipping seen).
- Round 9 independent review dispatched (reviewer a3cc…, did not author 8a/8b).

## Round 9 result (independent review, 2026-09-27) — `sc232-r9-review-report.md`

FIX-FIRST: 1 HIGH, 2 MEDIUM, 5 LOW. rebaseline.txt mechanically correct but contains HIGH-1
bytes -> REGENERATE after fixes. Site fidelity exact on 25 real entities otherwise.
Process note: reviewer killed orphaned children (npm 322323, node 322334) of its OWN wrapper
PID 322322 after verifying parent PID + cwd = worktree; their command lines lacked the path.
Recorded; acceptable only under that exact parent-PID + cwd verification.

## Owner rulings, round 9 (2026-09-27)

- HIGH-1 (usage chip on every statblock ability head; meta "Type" cell dropped): FIX as
  prescribed — opt-in usage-in-head flag set only by the standalone Feature view and the inline
  kit signature; restore the Type cell for statblock abilities; pin with a test.
- MEDIUM-1 (pasted snapshot loses statblock `metadata.scc` / featureblock `kind`): FIX as
  prescribed + retainer and malice-featureblock snapshot test cases; fix the `:95` comment.
- MEDIUM-2 (synced kit's nested signature has no kit name): FIX plugin-side if the kit layout
  can hand its own name to the nested feature render cleanly; if not, correct the comments and
  CHANGELOG, and report back so the owner files a steel-etl ticket. Either way the claims in
  comments/CHANGELOG must be true.
- LOW-1 summoner statblock provenance -> folded into **SC-373** (appended). NOT here.
- LOW-2 usage wording -> FOLD: chip text uses the site's labels ("Triggered Action",
  "Move Action", …) and plain text, never a link.
- LOW-3 hidden ability_type when cost present -> FOLD: match the site's behaviour.
- LOW-4 `kwUsage` help text -> FOLD. LOW-5 CHANGELOG overclaim/process wording -> FOLD.
- Empty left-deck span on a keyword-less statblock -> FOLD (don't mount it).
- Pre-existing dynamic-terrain/fixture featureblock type+role/EV gaps -> filed **SC-374**.

## Round 10 progress (2026-09-27 ~20:20)

- dse commits on fa9addc: 6f19b8b (HIGH-1, LOW-2, LOW-3), 31f54d8 (empty left-deck), e1705ba
  (MEDIUM-1), f3085d5 (MEDIUM-2 = comments corrected, plugin-side NOT done; LOW-4, LOW-5).
- MEDIUM-2 -> filed **SC-375** (steel-etl emits metadata.kit in the nested kit fence).
- `rebaseline.txt` regenerated 20:18; `rebaseline-map.md` still the stale 8b one.
- Worker a75424b parked on a background job 3× this round -> REPLACED by a fresh worker for the
  remainder (map attribution, evidence, gates, report, scratch worktree removal).
- Scratch worktree `worktrees/sc232-r10-scratch-fa9addc` exists (detached fa9addc) — must be
  removed (`git worktree remove`) before reporting.

## Round 10b result (replacement worker, 2026-09-27) — `sc232-r10-fix-report.md`

- dse `f3085d5` on `fa9addc` (base develop `5a20d5f`); superproject `8e7291d`. No new commits in
  10b (verification only). rebaseline.txt 78 lines / 39 ids (unchanged count; 35 ids re-hashed
  by r10). Deterministic ×2; FAILED set == rebaseline set; scratch baseline 260/260.
  jest 4189 (+19); lifecycle 19/19; shots 540/0; parity 0/0/26. Scratch worktree removed.
- Owner eyeball of `sc232-slots-print-screen.png`: content right (statblock abilities no usage
  chip; Kneel, Peasant! matches site) BUT its "Before" column is `fa9addc` (already slotted),
  not develop — useless for Scott. Rebuild with Before = develop `5a20d5f`, untruncated row
  labels. Queued after the r11 re-review (to avoid concurrent harness builds).
- r11 scoped re-review dispatched (reviewer a3cc).

## SC-235 landed (dispatcher, 2026-09-28)

- origin/develop = `6dca388` (SC-235: section titles 15px / 0.12em). develop parity 14 declared
  (was 16); freeze unchanged 260. SC-232 lands second -> reconcile on rebase:
  `selector-map.json` declaredDeferrals, compare.test.ts documented-count guard, parity README.
  Expected with both in: **24 declared** (14 + SC-232's 10). Report the final count.
- Pairing consistency: SC-235 chose 15px, not site 18px — note in the ask (SC-232's Option A
  is site-exact; Scott may want the two consistent in spirit).

## Round 11 result (scoped re-review, 2026-09-28) — `sc232-r11-rereview-report.md`

LAND-READY-AS-PROPOSAL. All r9 findings fixed; +19 tests proven red on revert; rebaseline
reproduced independently (78 lines / 39 ids). LOW-1 CHANGELOG wording -> FOLD (reviewer's
suggested text). LOW-2 sanction evidence must be develop->head -> FOLD (rebuild).
INFO level + ability_type on a hand-authored block -> DROP (no corpus case; site has no such
combination to match). INFO unfrozen SC-284 narrow captures -> DROP here (baseline policy,
dispatcher/Scott's call; mentioned in the land report).

## Owner rulings, round 12 (final prep, 2026-09-28)

- Rebase onto `origin/develop` (`6dca388`+): reconcile parity to 24 declared (SC-235 + SC-232).
- Fold r11 LOW-1 CHANGELOG wording.
- Re-verify rebaseline.txt at the rebased head (regenerate if any hash moved); determinism ×2.
- Rebuild ALL Scott-facing evidence with Before = rebased develop, Site dark, full row labels.
- origin/develop = `dfb7395` (SC-318: Obsidian heading scale restored on screen; new
  `perk-headings` capture). Freeze baseline now **262** lines (additions-only). Parity develop
  14 -> SC-232 expects 24. Rebaseline re-verified against 262. Adapter §8.10: briefs use
  `git -C <abs path>` only. Remove sc232-r12-scratch-* worktrees before reporting.

## Round 12 result + second ask (2026-09-28)

- dse `9ded832` on `dfb7395`; superproject `9ba7798` on origin/main `e1aa610` (worker rebased the
  superproject too — diff vs main is CHANGELOG.md only; pointer NOT bumped). Parity 24 declared.
  rebaseline.txt 78 lines / 39 ids, unchanged by SC-318; deterministic ×2; scratch 262/262.
  jest 4218; lifecycle 19/19; shots 544/0. Scratch worktrees removed.
- Consolidated ask #2 POSTED (name size A / B / leave / "A plus 6%"; slots OK?; print
  "sanctioned" for 78 lines). Ticket In Progress + Needs Review. PARKED.
- Landing notes: dse-verify parity -> 24 declared; freeze applies 78 lines only after Scott's
  literal "sanctioned" (quote + comment id); baseline stays 262 lines.

## Scott ruling 2 (2026-09-29 23:07 UTC, comment bd88a398-e4af-43bd-b028-17b1a370d7e4) — VERBATIM

> 1. A
> 2. ok
> 3. sanctioned

- Name size: **Option A** (site px per family) — as implemented. ~~"A plus 6%"~~ not chosen.
- Header slots: approved as implemented.
- Print: **literally "sanctioned"** for the 78-line `rebaseline.txt` (39 ids). (The ask said
  "78 of the 260"; the baseline is 262 after SC-318's additions-only widening — the 78-line set
  is unchanged and was verified against 262.)

## LAND-READY (2026-09-29)

- dse `9ded832` on develop `dfb7395`; superproject `5d35810` on origin/main `85db23f`
  (CHANGELOG.md only; pointer not bumped). jest 4218/1; lifecycle 19/19; shots 544/0;
  freeze FAILED set == rebaseline.txt (78) exactly, scratch 262/262; parity 0/0/24.
- Sanction: Scott, comment bd88a398-e4af-43bd-b028-17b1a370d7e4, literal "sanctioned".
