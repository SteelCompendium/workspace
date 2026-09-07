# SC-202 — decisions ledger (RECONSTRUCTED 2026-09-06)

> **This file was reconstructed on 2026-09-06 ~21:40 ET by owner session
> `d852ad9f-24fb-42f1-b597-fda69a829da0`** after the entire workspace `.superpowers/sdd/`
> directory (this ledger, every SC-202 brief/report/crop from phases 1–3, the shared
> `check-freeze.sh` + `freeze-baseline.sha256` and all its dated backups, and ~100 other
> efforts' ledgers) was deleted from disk at ~12:46 ET by an unidentified process in the
> shared main checkout. Rulings below are verbatim from the SC-202 Linear thread (the
> tracker is the audit trail and is intact). Effort-state entries are condensed from the
> owner's own context; the round 1–3 reports and reviews are GONE — their conclusions
> survive only in the ticket comments and in the plugin's own commits/tests/CSS comments.

Effort: `sc202-visual-harness-obsidian` (worktree of the same name).
Ticket: SC-202 "Visual harness models no Obsidian host CSS — an entire defect class is
invisible to every gate" (Medium, project DSE 7.0.0, labels `DSE Plugin` + `Bug`).

## Founding directive

**Scott, on SC-189, 2026-08-26 (quoted in the SC-202 description):**

> "make the ticket for modeling obsidian properly (or maybe a better approach is to
> actually use obsidian's real UI for testing?)"

## Rulings (verbatim, newest last)

**Scott, SC-202 comment, 2026-08-28 20:49 UTC — a question, not a ruling:**

> Do these help?  And do they actually look well made?
> https://mnaoumov.dev/obsidian-test-mocks/
>
> https://mnaoumov.dev/obsidian-integration-testing/

Answered 2026-08-29: test-mocks is the wrong axis (JS API mocks, zero CSS) → SC-286
(Backlog); integration-testing is the same axis as our obsidian-camera → its version
pinning filed as SC-287 (Backlog). Neither changed the recommended shape.

**Scott, SC-202 comment, 2026-08-29 19:24 UTC (verbatim):**

> * [SC-286] - make a note that I dont particularly have any appetite to adopt a new
>   framework unless its actually solving a problem.  Change for the sake of it is wasted
>   effort
> * `host-model.css` is fine if thats the best option
> * I do want to postulate on vendoring `app.css` - if im not mistaken, this is likely the
>   best long-term solution if not for the ToS violation.  What if we went with this
>   approach, but the `app.css` lived in `.gitignore`?  Is that the ideal option?  We can
>   have a basic just recipe or `npm run` that can extract the `app.css` on behalf of other
>   devs from a live install on their machine.  Reality is that Im the solo dev for the
>   time being so I dont really mind the odd situation.

**Scott, SC-202 comment, 2026-09-02 01:21 UTC (verbatim), replying to the owner's ask
"What you're approving: 1. Shape: pinned, fetched, gitignored `app.css` … 2. Phase 2
sequencing — fix leaks first (each with its own sanction ask), then turn the host sheet on,
then realprint and the assertion re-formulation. 3. Starting pin: Obsidian 1.13.7, app.css
sha256 `f612f1e8…`":**

> approved

Effect — phase-2 shape DECIDED: real `app.css`, gitignored, fetched by a recipe from
Obsidian's public release asset
`https://github.com/obsidianmd/obsidian-releases/releases/download/v<ver>/obsidian-<ver>.asar.gz`,
verified against a committed pin file (version + sha256); installed-copy fallback offline;
warn-on-drift vs the installed Obsidian; pin bumps are deliberate with their own sanctioned
rebaseline. ~~Phase-1 "authored host-model.css"~~ superseded. Spike `e821c59` NOT FOR MERGE
(local branch `sc202-spike-archive`; a branch, never a tag).

**Scott, SC-202 comment, 2026-09-04 02:08 UTC (verbatim), replying to the consolidated
two-decision ask ("(1) approve round 1 … (2) pick the direction for the print capture …
Approve C = the 'turn the sheet on' round builds it … Say 'B' or 'leave print alone' to
pick otherwise"):**

> approved

Effect: round 1 APPROVED (landed on develop at `9227dd9`; vault input widths stay as the
harness renders them). **Print direction = option C**: `--steel-realprint` re-pointed at
Obsidian's real print conditions (`.print` chain + forced `theme-light`, black on white);
the twin==realprint byte rule replaced by the enumerated-delta assertion; the ~202-line
frozen move rides in the "turn the sheet on" round's sanction ask, **which must restate C
explicitly** so this reading gets a cheap correction point before any baseline moves.
Print font token (serif in the real PDF) is that round's implementation detail. SC-293
filed (hero PDF export = 34,205 pages).

**Scott, SC-202 comment, 2026-09-05 13:29 UTC (verbatim), replying to the round-2 ask
("Approve = round 2 lands on `develop` and round 3 (lists and blockquotes inside cards)
starts."):**

> Approved.  I dont think I really need to approve each round.  You can work through all
> the rounds and ill approve at the end

Effect: round 2 APPROVED (landed on develop). **Per-round sanction asks RETIRED** —
~~"fix leaks first (each with its own sanction ask)"~~ superseded: each remaining leak
family (lists/blockquotes, headings/emphasis/links, checkboxes) gets an independent review
and then lands on `develop` with a short progress note on the ticket (no ask, no `Needs
Review`). Real-vault crops still captured per round for the owner's eye and the final
consolidated ask. **The one remaining ask is at the end**: the "turn the sheet on" round
(the ~202-line frozen rebaseline needs his explicit sanction — the freeze-delta flow is not
waived), restating option C and summarising every round's user-visible change. Owner
posted this reading as an acknowledgement (2026-09-05 13:31) so he has a cheap correction
point.

## FINAL-ASK items (accumulating for the consolidated ask at the end)

1. (r3) Should a plugin blockquote be a bare 40 px symmetric indent with no rule/tint, and
   a plugin `<hr>` the browser's inset grey line? The vault now matches the harness, but
   the harness look for quotes/hr was never designed.
2. (r4) Should plugin external links (scc-links resolving to steelcompendium.io) show an
   external-link icon? The harness never drew one; the vault now matches (icon gone).
3. (r4) A `###### heading` inside a plugin body (perk's "Familiar Statblock") now renders
   at **10.72 px** in a vault — the browser's UA h6 ratio, smaller than the surrounding body
   text — where Obsidian had it at 16 px. That is what the harness always showed; is it the
   size Scott wants? (Same for h5 at 0.83em.) Reviewer's call-out, r4 review MED-4(b).
4. (all rounds) One-place summary of every round's user-visible change in a real vault —
   the r4 review's delta table (`sc202-r4-review.md` MED-4(b)) is the r4 half.
5. (r2, r1) Vault table columns and input widths now match the harness (already approved
   individually; restate).

## Effort state (condensed; pre-wipe detail lost)

- **Phase 1 (2026-08-28):** investigation only. Real app.css injected wholesale moves
  463/474 shots, fails 202/210 frozen lines, breaks twin==realprint on 116/118; 70 host
  leaks in ~6 families; stepper inputs a confirmed live defect; SC-189 chrome fix holds.
- **Round 1 — inputs (landed `9227dd9`, 2026-09-04):** input re-grounding block (all
  states + 3 modal inputs) + `inputHostCoverage` source-scan guard + `input host-leak`
  gate (can-fail 552+262 → 0); host-copy pin bumped to Obsidian 1.14.0 (SC-205 pin check).
- **Round 2 — tables (landed `98d5bd3`, 2026-09-05):** table block incl. companion rules at
  ≥ specificity for Obsidian's first/last-column, striped, hovered cells (review MED-1:
  never rely on coincidental neutralisation); `table host-leak` gate 1,274 → 0; KEY
  FINDING: Obsidian scopes rendered-markdown rules under `.markdown-rendered` — the sweep
  wraps `#mount` (`wrapMountInMarkdownRendered`). Two declared exceptions (box-sizing,
  overflow-wrap) deferred to the "turn the sheet on" round.
- **Round 3 — lists/blockquotes/hr (REVIEWED, APPROVE, land-ready; NOT landed):** commits
  `a7820c1 → 61cf21d → a9c7dff → 7e929f7` on `98d5bd3`, rebased 2026-09-06 onto `d8bda06`
  (SC-277) as **`88be36a → 1ceaabc → ef1efda → 27851f0`**. `list host-leak` 688 → 0 (340
  comparisons). Review findings all closed: nested-list margin regression (HIGH-1),
  blockquote children, inert `li p`, nested lists LIVE in `title/fleet-admiral.md`, bare
  `hr` LIVE in `treasure/…/scorpion-tails.md`, quote caption (+40 px indent measured), hr
  colour via `color: gray`. Three new fixtures (`feature-list`, `title-nested`,
  `treasure-hr`) → **6-line widening `sc202-r3-widening.txt`** (rewritten from owner
  context 2026-09-06, verified against the r4 post-edit sweep). `treasure-hr--steel-
  {dark,light}` screen-only bytes moved once (Blink inset-bevel painting), disclosed.
  Backlog ticket filed for the `sidebarEncounterHandoff.test.ts:416` flake (SC-153 area).
- **2026-09-06 — session `87c69ef8` (Scott: "work on sc-202", no dispatcher):** decided
  not to land r3 (landing is the dispatcher's; main checkout was dirty with Scott's
  AGENTS.md migration) and to STACK round 4 on round 3 after the rebase. Freeze
  expectation `224/224` + the 6 r3 widening hashes until a landing applies the widening.
  Round 4 dispatched. **~12:00 ET: that session and its r4 implementer were killed
  (accidental).**
- **2026-09-06 — owner session `d852ad9f` resumed from files.** Found r4 uncommitted
  (CSS block, `assertInlineHostLeak` + `assertLinkTokenOverride`, `perk/links` fixture,
  jest guard; 0 pre-existing bytes moved), no report/crops/commit. Baseline jest on
  `27851f0` red: `inputHostCoverage` guard caught SC-277's new unclassed `type=search`
  input in `ConditionsModal.ts:288` (reported under the sibling `.dse-cond-icons__grid`).
  **Owner ruling:** fold into this round as its own commit ahead of r4 (not a ticket —
  same family/file, blocks a green battery; fix the guard's attribution too). Fresh
  implementer dispatched (`sc202-brief-r4-resume.md`).
- **2026-09-06 ~12:46 ET — THE WIPE.** `.superpowers/` in the main checkout deleted by an
  unidentified process (not this effort's worker — its worktree and commits were
  untouched; the main checkout showed another session's untracked search-ranking plan
  files at the time). Lost: this ledger, all SC-202 briefs/reports/reviews/crops (phase 1
  through r3), `check-freeze.sh`, `freeze-baseline.sha256` + every dated backup, ~100
  other effort ledgers. Nothing tracked was touched.
- **2026-09-06 — r4 resume implementer DONE** (`sc202-r4-report.md`): Step A `aa21854`
  (search input classed `dse-cond-icons__search` + r1 block; guard scan-window
  mis-attribution fixed; `type=color` input at `:390` addressed in report), round 4
  `a8a89f5`. Can-fail `inline host-leak` **658 → 0** (1090 comparisons: rest 452, icon 2,
  hover 314, focus-visible 314, synthetic 8); `link token-override probe OK` 775/0. Battery
  (both commits): tsc/lint clean; jest **3769/0F/1sk/197**; shots **524/0**, prior gate
  lines byte-identical; parity 0/0/16; **0 of 524 shot bytes moved** (own sha sweep, both
  directions); widening `sc202-r4-widening.txt` (2 lines, `perk-links` twin==realprint
  `92cff488…`). **Freeze gate NOT run — tooling gone** (sha sweep substituted). Real vault:
  `perk` is NOT camera-reachable (SC-149 folded typed displays into `ds-scc`) → `hero` h3
  + `scc`/kit-panther links used. Real `h*` tags enumerated (h2 hero name; h3 ×4 classed
  + 2 bare initiative; h4 ×2); card title is a `div`. Six `fontSizeContract` ALLOWLIST
  entries added for the h1–h6 `em` UA restatements (a token mint needs the workspace
  D3-token-map — reverted).
  **Owner eyeballing (2026-09-06):** link crops CORRECT (teal-cyan links keep colour +
  underline; the small external-link arrow after "speed"/"Stamina" disappears; "Panther"
  unchanged). **Heading crops CONTRADICT the report**: the report says the h3 gets ~13%
  BIGGER (18.72 → 21.09 px) but the BEFORE crop shows the larger "CHARACTERISTICS" and the
  AFTER the smaller — labels swapped, or the measurement is backwards → **review must
  resolve and the crops must be re-shot/re-captioned before any note goes on the ticket.**
  **Owner rulings on follow-ups:** (1) `--dse-fs-h*` token mint → **drop unless the
  reviewer finds the allowlist illegitimate** (these are UA-default restatements in `em`,
  not design sizes; a token would be a fiction). (2)/(3) freeze tooling + ledger restore →
  **owner's own action this session** (restore brief `sc202-brief-freeze-restore.md`;
  ledger = this file). (4) checkbox family → next round, as planned.
  **r4 review dispatched** (`sc202-brief-r4-review.md`, placeholders filled, + probes for
  the heading-crop contradiction, the allowlist, Step A, and the bare initiative h3/h4).
- **2026-09-06 ~22:10 ET — FREEZE TOOLING RESTORED** (`sc202-brief-freeze-restore.md` →
  `.superpowers/sdd/RESTORE-2026-09-06.md`): regenerated from clean `origin/develop`
  `d8bda06`, **252 lines** (full frozen class, superset of the lost 224; 14 post-SC-191 ids
  had never been widened in), deterministic ×2, all 252 pairs hash-identical to this
  branch's r4 sweep. `check-freeze.sh` re-implemented + proven 4 ways. Worktree at
  `a8a89f5` → `freeze OK (252/252 …)`. Dated record appended to `dse-verify` SKILL.md.
  **Freeze expectation for SC-202 from now: `252/252` + r3 widening (6) + r4 widening (2)
  → 260 after landing applies both.** Wipe culprit identified from session transcripts:
  session `c85abc40` (SC-306 search ranking), 16:45:21Z, `rm -rf
  /home/scott/code/steelCompendium/workspace/.superpowers` while moving its scratch into
  its worktree. Footgun recorded in `docs/working-preferences.md` + PROJECT.md §8.7
  (uncommitted in the main checkout; owner commits with the handoff at session end).
- **2026-09-06 ~23:00 ET — r4 review of `aa21854`+`a8a89f5`: FIX-ROUND-NEEDED (1 HIGH /
  5 MED / 3 LOW; `sc202-r4-review.md`).** Battery independently green incl. **`freeze OK
  (252/252 …)`** with the restored tooling; can-fail 658 → 0 reproduced; leak-OUT clean; 8
  widening hashes match. **Item 13:** the report's direction was BACKWARDS, the crops
  CORRECT — vault h3 21.088 → 18.72 px (−11.2 %) = harness on both bundles; classed
  headings moved because `.dse-hero__region-title`/`.dse-hero__name`/`.dse-enc__roster-
  heading` declare no font-size. **Item 14:** allowlist legitimate in substance, wrong
  mechanism. **Owner rulings:** HIGH-1 vacuous guard → FIX; MED-1 `outline: none` kills
  `:focus-visible` ring → FIX (companion); MED-2 `b`/`i` → FIX; MED-3 token probe samples 0
  classed links → FIX; MED-4 report reversed/incomplete → FIX report (crops stand); MED-5
  false comment → FIX; LOW-1 → fold (`UA_RESTATEMENTS` const; token mint stays dropped);
  LOW-2 `color` in `LINK_REST_PROPS` → fold; LOW-3 fixture `ds-scc-web`/`target`/`rel` →
  fold. Prose-h6 10.72 px → FINAL-ASK item 3. **Fix round → r4 implementer (resumed),
  brief `sc202-brief-r4-fix.md`; scoped re-review → r4 reviewer.**
- **2026-09-06 ~22:45 ET — r4 fix round DONE: commit `5f7b8b2`** on `a8a89f5` (develop
  `d8bda06` unmoved). All 9 closed with proof: HIGH-1 guard can-fail (mutation → red naming
  `ConditionsModal.ts:288`); MED-1 `:where(a):focus-visible { outline: auto 1px
  -webkit-focus-ring-color }` companion at (0,3,0) + `outlineWidth` sampled; MED-2
  `:where(strong, b)`/`:where(em, i)`, gate line `13b+5i`, 1126 comparisons; MED-3 probe
  iterates the fixture visits, `157 links [1 .internal-link + 1 .external-link + 155
  generic]`, hard-fails on 0; MED-4/5 report §5 corrected in place + 70-node delta table
  (§5b), CSS comment rewritten; LOW-1 `UA_RESTATEMENTS` const; LOW-2 `color` sampled;
  LOW-3 fixture anchors carry `ds-scc-web`/`target`/`rel`/`data-scc`. Collateral: bounded
  an unbounded scope-fence slice in `inputHostRegrounding.test.ts`. Battery: tsc/lint
  clean; jest **3773/0F/1sk/197**; shots 524/0 ×2; **`freeze OK (252/252 …)` ×2**; parity
  0/0/16. Only `perk-links--steel-{print,realprint}` moved (LOW-3 DOM change) →
  `sc202-r4-widening.txt` regenerated (twin==realprint, ×2); r3's 6 hashes unchanged.
  **Scoped re-review dispatched** to the r4 reviewer (`sc202-brief-r4-rereview.md`).
- **2026-09-06 ~23:10 ET — scoped re-review of `5f7b8b2`: APPROVE.** All 9 closed by
  execution (HIGH-1 mutation → red naming `ConditionsModal.ts:288`; MED-1 focus outline
  `auto`/1px/`rgb(16,16,16)` = `27851f0`; MED-2 synthetic b/i 0 diff; MED-3 forced-0 →
  exit 1; LOW-1 perturbation fails 2 tests; LOW-3 anchors match `rewriteSccAnchors.ts:24-38`;
  collateral fence fix load-bearing). Battery: jest 3773/0F/1sk/197; shots 524/0 ×2;
  `freeze OK (252/252 …)`; parity 0/0/16; only `perk-links` print/realprint moved
  (`9d7782de…` = widening file). **New LOW-4 (non-blocking):** the bare-vs-host sweep
  cannot see the `:focus-visible` companion (plugin sets it identically both sides) — only
  the jest guard does; reword the `LINK_REST_PROPS` comment to credit the guard →
  **owner ruling: FOLD into round 5's commit** (comment-only; no separate round).
  **ROUND 4 APPROVED → ROUNDS 3 + 4 LAND-READY at `5f7b8b2`** (`88be36a 1ceaabc ef1efda
  27851f0 aa21854 a8a89f5 5f7b8b2` on `d8bda06`, fast-forward), with two additions-only
  widenings (`sc202-r3-widening.txt` 6 lines, `sc202-r4-widening.txt` 2 lines → 260) for
  the dispatcher at landing. No dispatcher this session — reported to Scott. Progress note
  posted (`sc202-comment-r34-progress.md`). **Round 5 dispatched** (fresh implementer,
  `sc202-brief-r5-checkboxes.md`).
