# SC-232 round 4/5/final — fix round report

## Executive summary (current, final round — independent re-review verdict LAND-READY-AS-PROPOSAL)

- Head: dse `bd2087e130596d2e55a17886fae20a73489c587a` on branch `sc232-cardname-scale`, rebased onto `origin/develop` `b029baa32e4ed96a168dfab177c3e92552b399bf` (moved a fourth time this session: `e9bc15e` → `1adfe29` [SC-230] → `36635e9` [SC-272] → `b029baa` [SC-236 + SC-255]; every rebase clean, 0 conflicts).
- **Rebase note (this round's specific ask):** SC-236 touched `visual-harness/entry.ts` (the same file our `scrollToPrint` change lives in), so this rebase was checked carefully rather than trusted on "no CONFLICT markers" alone. SC-236's edits are in a different region entirely — the `featureSpend`/`featureVillain` fixture literals and their rationale comments, lines ~234-300 — while ours are in the `SCROLL_SHOTS` section, ~1434-1500+; `git log`/`git show` on both SC-236 commits (`2614023`, `ade5064`) confirms zero line overlap. Git's 3-way merge resolved it with no manual intervention; `npm run tsc` after the rebase confirms the merged file is syntactically and type-correct, and `git diff b029baa HEAD -- visual-harness/entry.ts` shows exactly and only SC-232's own `scrollToPrint` diff, nothing dropped or duplicated.
- **LOW-1 (CHANGELOG) fixed:** the worktree superproject's `CHANGELOG.md` bullet still said narrow names "can wrap onto more lines than before" and a step-down was "still in progress" — both false since round 5's HIGH-1 landed. Corrected to state the real, now-shipped behavior: a card head 480px wide or narrower steps back down to today's shared 20px name. Commit `60ae70b` (worktree superproject; submodule pointer untouched).
- **LOW-2 (styles-source.css comment) fixed:** the HIGH-1 comment overstated `.dse-head`'s immunity to narrowing ("never has an auto inline-size of its own to collapse"). The final review's own measurement (`negotiation` card under a shrink-to-fit ancestor: card 760→561px, head 662→464px) shows `.dse-head` DOES narrow when a third-party ancestor sizes the card to fit its content — it just doesn't COLLAPSE to near-zero the way `.dse-sb` did, because it's a plain block child tracking its parent's width, not a size-contained box asked for its own shrink-to-fit preferred width. Comment reworded to say exactly that (comment only — `git diff` confirms every changed line sits inside `/* */`; `harness:build` clean). Commit `bd2087e`.
- **Evidence: unchanged, not rebuilt.** Neither this round's fix touched a CSS value (the CHANGELOG fix is prose; the styles-source.css fix is comment-only) and the rebase brought in no CSS or entry.ts changes relevant to any composited capture (SC-236 is fixture-literal/comment only, on fixtures neither composite uses; SC-255 is skills-docs only). Confirmed, not assumed: `wrap.mjs`'s full acceptance-table output at this exact final head is still byte-for-byte identical to base (third independent confirmation, after round 5's two); the six name-family font-size measurements behind `sc232-compare-wide.png` (ability 33.3px, trait 27px, kit-head 27px, kit-sig 33.3px, project 28.8px/29.376 line-height) are unchanged from round 5. `sc232-compare-wide.png` and `sc232-compare-narrow.png` at `r4-evidence/` are round 5's images, still current.
- Gates at final head: tsc/lint clean; jest **4101 passed / 1 skipped / 211 of 212 suites / 3 snapshots**, **identical to base** `b029baa`'s own 4101 (SC-232's net test-count delta remains 0, consistent with round 5's correction below); `obsidian-lifecycle` **19/19**; `npm run shots` **524, 0 FAIL**; `check-freeze.sh` **260/260** (a FAILED line would mean a screen-only rule leaked into print — none did); `npm run parity` **0 GAPs / 0 undeclared WARNs / 26 DECLARED / exit 0** (unchanged composition).

**Correction to round 4's jest-delta claim (carried forward from round 5, still true):** round 4's HIGH-1 commit message said "+7 from the rebase point," attributing a jest count difference to the new container-type CSS. That was **not isolated correctly** — it measured only "base-then-rebase, then add HIGH-1" as one combined step, so the +7 could equally have come from the rebase target's (SC-230's) own new tests. Round 5 measured base and head **separately** at the same commit and found them **identical**; this round repeats that isolated measurement at yet another base (`b029baa`: base 4101, head 4101) and gets the same answer — SC-232's true net test-count delta, across every round, is 0.

## Resuming round 4 (historical)

This session was reported to have hit a usage-limit interruption mid-edit; on resume, `git diff --stat` showed the LOW-1/MEDIUM-1/LOW-3 edits in progress on `styles-source.css`, `compare.test.ts` and `README.md` exactly where the work had left off. Verified against the brief, finished the coherent step (added the `name-kit-signature` parity pair's declared-deferral rows and the count updates), ran the full battery, and committed. No half-done state needed discarding.

## Round 5 — HIGH-1 resolution, evidence redo, base moves

### HIGH-1: implemented per the round-4 owner ruling

`.dse-head` is now the query container — same property names and values as the unlanded SC-284 branch (`container-type: inline-size; container-name: dse-head;`, `sc284-cardhead-narrow` `33b58c3`, read-only, not edited), but SC-232's copy is Steel screen-only (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-head`) and lives in the SC-232 rule group, not SC-284's cardHead hunks. The comment cites SC-284's containment analysis rather than re-deriving it, per the ruling. `.dse-sb`/`.dse-fb`/any card root remains forbidden from carrying `container-type` (round-3 LOW-2's finding on `.dse-sb` specifically still holds — `.dse-head` doesn't have the same `auto`-inline-size-collapse failure mode, since it's the grid the card's real content sizes against, not a shrink-to-fittable block).

`@container dse-head (max-width: 480px)` — SC-284's own literal, reused rather than re-derived — falls back to TODAY's shared values (`var(--dse-fs-heading)`, `line-height: 1.15`, `letter-spacing: 0.01em`, the exact pre-SC-232 unscoped rule's computed style) for **every** family (generic, ability, statblock, featureblock, project), not only the two band families HIGH-1 named: CSS cannot conditionally target "only the names that would gain a mid-word break," so a uniform revert is the only selector-expressible rule that guarantees the acceptance bar for every family in every capture — it reproduces base's own narrow-width computed style exactly.

**480px threshold, verified by measurement** (not assumed from SC-284's own reasoning): every `*-narrow` capture's real 300px page width puts every `.dse-head` — top-level and nested/indented alike — under 480px (298px down to 197px measured across statblock/featureblock/encounter/montage). Every full-width 900px capture's *narrowest* `.dse-head` (a nested sub-feature head, already indented) sits at 657px, comfortably clear above it. No capture in the harness falls between 298 and 657, so 480px separates the two cases with a wide, unambiguous margin.

### Acceptance table — PASSES

Re-ran the reviewer's `wrap.mjs` exactly as round 4 did (17 capture ids: every `NARROW_SHOTS` entry plus width-scoped `PREF_SHOTS`/`SCROLL_SHOTS`), base vs head, twice — once right after implementing the fix (base `1adfe29`) and again at the final rebased head (base `36635e9`, `styles-source.css` unchanged between the two bases, confirmed by `git diff`). **Both runs: `diff` between the base and head logs is empty, exit 0 — every single line matches, not just the aggregate line/mid-word counts.** Additionally verified at the pixel level: `md5sum` on the three narrow-capture crop PNGs used in the redone `sc232-compare-narrow.png` (statblock-narrow, featureblock-narrow, the "Bloodstones" sub-feature) shows **identical hashes** between the Today (base) and This branch (head) captures.

| Capture | Name | Base | Head | Verdict |
|---|---|---|---|---|
| `perk-narrow` | Familiar | 20px, 1 line, 0 mid-word | 20px, 1 line, 0 mid-word | match |
| `encounter-narrow` | Ambush at the ford | 20px, 4 lines, 1 mid-word | 20px, 4 lines, 1 mid-word | match |
| `montage-narrow` | Cross the Ashfall Wastes | 20px, 3 lines, 0 mid-word | 20px, 3 lines, 0 mid-word | match |
| `statblock-sticky-narrow` | Human Bandit Chief (main head) | 20px, 5 lines, 2 mid-word | 20px, 5 lines, 2 mid-word | match |
| `statblock-sticky-narrow` (sub-feature) | Kneel, Peasant! | 20px, 2 lines, 0 mid-word | 20px, 2 lines, 0 mid-word | match |
| `statblock-sticky-narrow` (sub-feature) | Bloodstones | 20px, 1 line, 0 mid-word | 20px, 1 line, 0 mid-word | match |
| `statblock-sticky-narrow` (sub-feature) | End Effect | 20px, 1 line, 0 mid-word | 20px, 1 line, 0 mid-word | match |
| `statblock-sticky-narrow` (sub-feature) | Supernatural Insight | 20px, 2 lines, 1 mid-word | 20px, 2 lines, 1 mid-word | match |
| `statblock-sticky-narrow` (sub-feature) | Whip and Magic Longsword / Shoot! / Form Up! / Lead From the Front | pre-existing 0-width degenerate column (21/6/7/16 lines) | unchanged | match (still SC-284's fix to make, not this ticket's) |
| `stamina-rail`, `hero-narrow`, `initiative-*`, `skills-*` | — | no `.dse-head__primary--left` node | unchanged | n/a |

**Bottom line: acceptance bar MET.** 0 new mid-word breaks, 0 names with more lines than base, every narrow capture, byte-for-byte.

### SC-230 (modal text-scale) overlap — checked, no conflict

No shipped modal mounts a `[data-dse-element]` card head today (confirmed in `styles-source.css`'s own nested-reset comment, current tree: "no shipped modal ever mounts a `[data-dse-element]` as a direct child of `.dse-modal`"). To answer the dispatcher's ask directly anyway, a card head was synthetically hosted inside `.dse-modal__body` (SC-230 r3's real scaling target — `.dse-modal` itself is deliberately NOT scaled as of r3; only `__body`/`__footer`/`__title-text` are) via DOM surgery in a scratch script, and `--dse-text-scale` set to `1` and `1.4`:

| | scale 1 → scale 1.4 (base `1adfe29`) | scale 1 → scale 1.4 (head) | ratio (both) |
|---|---|---|---|
| Ability card name | 20px → 28px | 33.3px → 46.62px | 1.400× |
| Statblock name | 20px → 28px | 41.4px → 57.96px | 1.400× |

Both families scale by exactly 1.4× at base AND at head — only the baseline (pre-scale) size differs, as intended. SC-232's font-size rules are themselves `em`-relative to the inherited chain (`calc(var(--dse-fs-heading) * k)`, and `--dse-fs-heading` is itself `1.25em`-based), so they compose with SC-230's scaling rather than fighting it — confirmed both by this direct measurement and by `npm run shots`'s own new in-run assertion, `modal text-scale anchoring OK (.dse-modal__body scales exactly x1.4 at textScale 1.4 …)`. No scoping fix was needed.

### Evidence redo — width-measurement bug found and fixed

The dispatcher's second wide-composite critique was right on both new points:

1. **Width measurement bug (a):** `getBoundingClientRect().width` on `.dse-head__primary--left` measures the **grid cell's box width** (`grid-template-columns: auto minmax(0, 1fr) auto` — the name's column track stretches to fill available space via `justify-self: stretch`, independent of font-size), not the rendered glyph run. That's why Today and Option B looked the same width in the first redo — the boxes genuinely were the same width; only the text inside differed. Fixed by measuring via `document.createRange().selectNodeContents(nameEl); range.getBoundingClientRect().width` (the same idea `wrap.mjs`'s per-character probe uses, at the whole-run granularity), which measures the glyphs themselves.

| Row | Today | This branch | Option B | Site | Option B / Today | This branch / Today |
|---|---|---|---|---|---|---|
| Ability card (Coverage Strike) | 187px | 302px | 247px | 109px | 1.32× | 1.61× |
| Statblock (Human Bandit Chief) | 230.6px | 445px | 300px | 513px | 1.30× | 1.93× |
| Featureblock (Angulotl Malice / Devil Malice) | 196px | 344px | 254px | 292px | 1.30× | 1.76× |
| Kit head (Panther) | 97.4px | 127px | 127px | 142px | 1.30× | 1.30× |
| Kit signature ability (Devastating Rush) | 203.2px | 322px | 262px | 362px | 1.29× | 1.58× |
| Trait (Determination) | 172.6px | 224px | 224px | 251px | 1.30× | 1.30× |

Option B's ratio is consistently ~1.30× Today (27/20 = 1.35, the gap from kerning/hinting at different sizes, not a measurement error) — verified genuinely bigger, not a rendering no-op. This branch's ratio varies by family as designed (1.30× for families whose SC-232 multiplier equals Option B's shared 1.35, up to 1.93× for the statblock band's 2.07 multiplier). Site widths aren't directly ratio-comparable (different face metrics, Cinzel vs. Source Serif 4) but are included for reference.

2. **Kit row (b):** now two separate crops, `.dse-head` (the kit's own head) and `.dse-card__band .dse-feature > .dse-head` (the signature ability's head), each cropped tight — no body prose, no equipment line, no kit-bonus grid in frame.
3. **Trait row (c):** the harness has no real trait fixture (`feature/example.yaml` is `feature_type: ability`), so — matching the round-3 reviewer's own verification method — `data-dse-act="trait"` is forced via DOM surgery on the same mounted example, but now ALSO: the left eyebrow is changed to "Trait", the name to "Determination", the right-eyebrow chip ("5 Malice") is removed, and the right-primary chip is changed to "2 Points" — matching the live site's real trait head fields (`Browse/feature/trait/human/determination/`: eyebrow "Trait", name "Determination", right-primary "2 Points", no right-eyebrow) exactly. The row is honestly trait-shaped now, not an ability's leftover chips under a forced attribute.

Both composites regenerated at 1 image px = 1 CSS px (unchanged methodology from round 4's fix), written to the same `r4-evidence/` paths (per the dispatcher's own instruction, not renamed to `r5-evidence/`).

## Fixes (round 4)

### 1. HIGH-1 (narrow) — [SUPERSEDED, see "Round 5 — HIGH-1 resolution" above] — round 4's UNRESOLVED state, stopped per the owner's own round-3 contingency

The owner's ruling: at the narrow threshold, the band names (statblock, featureblock) and any generic/sub-feature name that gains a mid-word break must fall back to TODAY's shared size, so narrow captures are never worse than base — via LOW-2's mechanism constraint: reuse an ancestor that ALREADY carries `container-type` in `develop`; if none reaches these heads, stop with NEEDS_CONTEXT.

Checked exhaustively — every `container-type`/`container-name` declaration in `styles-source.css` (7 total: `dse-init-bar` :953, `dse-mt` :3663, an unnamed one on `.dse-hero__grid` :5926, `dse-sb-sticky` :10190, `dse-stamina-rec` :11561, `dse-stamina-host` :11803, `dse-init-host` :12832) and its DOM scope. None wraps `.dse-sb`, `.dse-fb`, `[data-dse-element='feature']`, `.dse-card` or `.dse-head` generically — each is a purpose-built container on its own component's root. `dse-sb-sticky` is the closest by name but is a **sibling** of `.dse-head` (the sticky mini-header wrapper), not an ancestor, so a `@container` on it cannot style the head name at all.

A `@media` breakpoint would sidestep the containment risk (LOW-2) entirely, and the harness's own width-override mechanism would even validate it (every `*-narrow` capture literally shrinks the page). But it answers the wrong question for a real Obsidian sidebar leaf — the app window doesn't shrink, only the pane does — which is the exact, repeated reasoning every one of those 7 existing containers documents for existing at all instead of using `@media`. Shipping one here would be a silent real-app regression no gate in this repo could ever catch.

**Action taken:** removed the round-2 `container-type`/`@container` block entirely (`styles-source.css`, now a long comment explaining why, citing this exact investigation). The four per-family name rules apply **unguarded** at every width on this head. This is worse than round 2's (already-rejected) 33.3px guard for the statblock band specifically, and now also affects the featureblock band and generic/sub-feature names that never had a guard at all.

**The question:** which of these should the owner pick, so the guard can be finished?
1. **Add a new `container-type: inline-size` deliberately**, on a purpose-built ancestor (not `.dse-sb` itself — e.g. `.dse-head`'s own parent, or a new wrapper), documented the way `dse-stamina-host` documents its own containment cost, accepting that as a one-time, reviewed exception to "reuse only."
2. **Accept the `@media` gap as a known, documented limitation** (screen-only narrow guard correct in the browser harness and in an Obsidian window narrower than the breakpoint, silently absent in a narrow *pane* inside a wide window) — filed as its own follow-up rather than solved now.
3. **Something else** — e.g. wait for SC-284 despite the "must land in either order" ruling, if that ruling can flex now that HIGH-1 has no other clean path; or scope this ticket down to "generic/ability/featureblock only, statblock band deferred" if that changes the width math enough to matter.

### Narrow acceptance table (round 4, FAILING — [SUPERSEDED, see the round-5 PASSING table above]; owner's bar: 0 new mid-word breaks, 0 names with more lines than base)

Measured with the reviewer's own `r3-evidence/scripts/wrap.mjs` (per-character `Range` reconstruction — the same method, re-run, not re-derived) over every `NARROW_SHOTS` entry, every width-scoped `PREF_SHOTS`/`SCROLL_SHOTS` entry (17 capture ids total), base (`styles-source.css` byte-identical between `619c4bd` and `e9bc15e`) vs this head. Full logs: `r4-evidence/wrap-base.log`, `r4-evidence/wrap-head.log`.

| Capture | Name | Base lines/mid-word | Head lines/mid-word | Verdict |
|---|---|---|---|---|
| `perk-narrow` | Familiar | 1/0 | 1/0 | unchanged |
| `encounter-narrow` | Ambush at the ford | 4/1 (`Ambus/h`) | 5/1 (`Amb/ush`) | **FAILS** — +1 line (same mid-word count, different split) |
| `montage-narrow` | Cross the Ashfall Wastes | 3/0 | 4/0 | **FAILS** — +1 line |
| `statblock-sticky-narrow` | Human Bandit Chief (main head) | 5/2 | 8/5 | **FAILS** — +3 lines, +3 mid-word |
| `statblock-sticky-narrow` (sub-feature) | Kneel, Peasant! | 2/0 | 2/0 | unchanged |
| `statblock-sticky-narrow` (sub-feature) | Bloodstones | 1/0 | 2/1 | **FAILS** — +1 line, +1 mid-word (NEW) |
| `statblock-sticky-narrow` (sub-feature) | End Effect | 1/0 | 2/0 | **FAILS** — +1 line |
| `statblock-sticky-narrow` (sub-feature) | Supernatural Insight | 2/1 (`Supernatura/l`) | 3/1 (`Supernat/ural`) | **FAILS** — +1 line (same mid-word count, different split) |
| `statblock-sticky-narrow` (sub-feature) | Whip and Magic Longsword | 21/17 | 21/17 | unchanged — pre-existing 0-width degenerate column (SC-284 fixes it, per round-3 review INFO-8; not this ticket's doing either way |
| `statblock-sticky-narrow` (sub-feature) | Shoot! | 6/5 | 6/5 | unchanged — same degenerate case |
| `statblock-sticky-narrow` (sub-feature) | Form Up! | 7/5 | 7/5 | unchanged — same degenerate case |
| `statblock-sticky-narrow` (sub-feature) | Lead From the Front | 16/12 | 16/12 | unchanged — same degenerate case |
| `stamina-rail`, `hero-narrow`, `initiative-*`, `skills-*` | — | no `.dse-head__primary--left` node | no `.dse-head__primary--left` node | n/a — these elements don't use the card-head name at all |

**Bottom line: FAILS the acceptance bar.** 6 of 12 measured names regress (5 gain lines, 1 of those also gains a genuinely new mid-word break). This is the direct, expected cost of removing round 2's guard without a replacement — see HIGH-1 above.

### 2. LOW-2 (upgraded) — the flawed `container-type` removed [superseded by round 5's `.dse-head` container — see above]

Covered under HIGH-1 above (the two are the same code change). `styles-source.css:~7317` no longer declares `container-type` on `.dse-sb` (round 4). Round 5 adds a NEW, ruling-sanctioned `container-type` on `.dse-head` instead — see above.

### 3. MEDIUM-1 — family misassignment, fixed as prescribed (with one correction)

- **Trait exclusion**: `[data-dse-element='feature'] > .dse-feature:not([data-dse-act='trait']) > .dse-head > .dse-head__primary--left` — a standalone trait (`data-dse-act="trait"`, `renderFeature.ts:241`) now falls through to the generic 27px rule instead of the ability card's 33.3px, matching the site's real `sc-trait` pages. Verified: forcing `data-dse-act="trait"` on the harness's `feature` fixture measures **27px** on this head (was 33.3px before the fix).
- **Kit signature ability**: a new selector arm, `.dse-card__band > .dse-feature__nested > .dse-feature:not([data-dse-act='trait']) > .dse-head > .dse-head__primary--left`, gives the kit's own inline signature ability (`kit/view.ts`'s nested band) the ability-card's 33.3px. Verified: "Devastating Rush" on the `kit` fixture measures **33.3px** on this head (was 27px).
- **`name-kit-signature` parity pair**: the reviewer's prescribed site selector, `.sc-kit .sc-embed .sc-ability > .sc-head .sc-head__left-primary`, **does not match the live site** — verified directly (`document.querySelector` returns `null`). `.sc-kit` and `.sc-embed` are **siblings** on the kit detail page, not nested (confirmed via a full ancestor-chain trace). Corrected to `.sc-embed .sc-ability > .sc-head .sc-head__left-primary`, verified to match ("Devastating Rush", 33.3px) and to be unique (no earlier `urls.json` page has an `.sc-ability` under `.sc-embed`). Added with the same SC-368 ink declaration the other four `name-*` pairs already carry (font-size/line-height pass with 0 new GAPs).

### 4. MEDIUM-2 — evidence redone

**Root cause of round 2's rejection, diagnosed:**
- **(a) Option B rendered at the branch's own size, not 27px**, because I probed `probe-B.css` *on top of the final branch tree* — `probe-B`'s selector (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-head__primary--left`) has the SAME specificity as the branch's own generic rule, but LOWER specificity than the branch's own family-specific rules (which add `.dse-sb`/`.dse-fb`/`[data-dse-element='feature']` to the selector), so it could never override statblock/featureblock/ability — only nodes already generic. Fixed by probing on the **base** tree instead (where the only competing rule is the low-specificity unscoped base rule) — the same methodology the round-1 survey used. Verified by measurement before shooting, per the brief: `feature 33.3px, statblock 41.4px, featureblock 37.8px, kit 27px, trait 27px` on the branch tree (confirming the bug) vs **`feature 27px, statblock 27px, featureblock 27px, kit 27px, trait 27px`** on the base tree (confirming the fix).
- **(b) The site column was scaled differently.** The compositor computed a per-cell `scale = min(cell_w/img_w, cell_h/img_h, 1.0)` independently for every image, so whichever crop happened to be larger than its shared cell (routinely the 1440-wide site crops) got shrunk *more* than the 900-wide plugin crops. Fixed: every capture (site and plugin alike) now uses `deviceScaleFactor: 1` and the compositor does **zero resizing** — every image is pasted at its native pixel size; cells are sized to the largest image in their row/column and pad the rest, never scale.

**New composites (round 4)** — **[both further revised in round 5 — see "Evidence redo — width-measurement bug found and fixed" above; the dimensions/content below are round 4's, now overwritten at the same paths]**:
- `sc232-compare-wide.png` (3920×1521, round 4): rows ability card, statblock, featureblock, kit (head + signature ability, both visible), trait (standalone, `data-dse-act` forced — no harness fixture carries a real trait, matching the reviewer's own verification method). Columns Today | This branch | Option B | Site, all at 1 image px = 1 CSS px.
- `sc232-compare-narrow.png` (948×906, round 4): statblock and featureblock **unscrolled**, default fixture, 300px (not the sticky-scroll capture MEDIUM-2 flagged), plus the sub-feature case ("Bloodstones"). Columns Today | This branch, same scale. Round 4's version visibly showed the then-still-open HIGH-1 regression; round 5's version (current, at the same path) shows Today and This branch as identical instead, now that HIGH-1 is fixed.

**Report wording correction** (this round's own, replacing round 2's now-withdrawn claim): round 2 said mid-word breaks were "not introduced" by the branch. That was **false** for at least "Bloodstones" (whole word at base, `Bloodsto/nes` at round 2's head) and the featureblock band (0 mid-word breaks at base, new ones at round 2's head) — the round-3 review caught this correctly. The corrected statement: mid-word breaking as a *phenomenon* pre-dates this ticket (the base state already breaks several names, e.g. "Human Bandit Chief" at 5 lines/2 breaks), but this branch's per-family size increase, whether guarded (round 2) or unguarded (this head), demonstrably makes it worse on several specific names — see the acceptance table above.

### 5. LOW-1 — SC-367 → SC-368

Retargeted all three places the round-2 `ink` declarations and their comments cited SC-367 (sizes only): `selector-map.json` (8 `why` strings, now 10 with `name-kit-signature`'s), `test/unit/parity/compare.test.ts` (comment), `visual-harness/parity/README.md` (declared-deferrals table row). Dropped the "pending the owner's call" wording — the call (SC-368) has been made.

### 6. LOW-3 — project family mirrored

`.dse-prj__head > .dse-head > .dse-head__primary--left` now reads the project tracker's own multiplier (`* 1.44`, matching the site's live `.pj__head .sc-head__left-primary` rule, `steel-project.css:32-34`, 1.6rem × 0.9 = 28.8px / line-height 1.02). Verified: the `project` element's head measures **28.8px / 29.376px line-height** on this head (was 27px before the fix, 94% of the site).

### 7. LOW-4 — CHANGELOG bullet

Added under `## Unreleased` in the **worktree superproject's** `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/CHANGELOG.md` (commit `de8b5cf5`, separate from every dse commit; the `draw-steel-elements` submodule pointer is untouched — confirmed via `git show --stat`). Describes the per-family size change and notes the narrow-width step-down is still in progress.

## Gates — round 4 head `9f61345` (rebased onto `e9bc15e`) — [SUPERSEDED by the final round-5 table below]

| Gate | Result |
|---|---|
| `git fetch origin` / `origin/develop` | moved `619c4bd` → `e9bc15e` (SC-243) mid-round; rebased cleanly, 0 conflicts; `styles-source.css` byte-identical between the two base commits |
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base, `e9bc15e` alone, measured via detached checkout) | 4063 passed / 1 skipped / 210 of 211 suites / 3 snapshots |
| `npx jest` (this head) | 4063 passed / 1 skipped / 210 of 211 suites / 3 snapshots — identical to base |
| `DSE_LIFECYCLE_PORT=9293 npm run obsidian-lifecycle` | 19/19 ok, 0 failed |
| `npm run shots` | 524, 0 FAIL |
| `check-freeze.sh .../shots` | `freeze OK (260/260 …)`, exit 0 |
| `npm run parity` | 0 GAPs / 0 undeclared WARNs / 26 DECLARED / exit 0 (18 `declaredDeferrals` entries) |

## Gates — round 5 head `91c7100` (rebased onto `36635e9`) — [SUPERSEDED by the truly-final table below]

| Gate | Result |
|---|---|
| `git fetch origin` / `origin/develop` | moved twice more this round: `e9bc15e` → `1adfe29` (SC-230) → `36635e9` (SC-272); both rebases clean, 0 conflicts; `styles-source.css` byte-identical `1adfe29`↔`36635e9` |
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base, `36635e9` alone, detached checkout) | **4099 passed / 1 skipped / 211 of 212 suites / 3 snapshots** |
| `npx jest` (this head) | **4099 passed / 1 skipped / 211 of 212 suites / 3 snapshots** — identical to base; SC-232's true net test-count delta across every round is 0 (see the correction note in the executive summary — round 4's "+7" claim was measured wrong) |
| `DSE_LIFECYCLE_PORT=9297/9301 npm run obsidian-lifecycle` | **19/19 ok, 0 failed** (run twice: once right after implementing HIGH-1 at `1adfe29`, again at the final rebased head) |
| `npm run shots` | **524, 0 FAIL** (both runs; the second run's in-run "modal text-scale anchoring OK" assertion also confirms the SC-230 composition) |
| `check-freeze.sh .../shots` | **`freeze OK (260/260 …)`**, exit 0 (both runs) — the `.dse-head` container is screen-only, print unaffected |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 26 DECLARED / exit 0** (unchanged composition from round 4 — 18 `declaredDeferrals` entries) |
| `wrap.mjs` acceptance table | **PASSES** — base vs head byte-identical, twice (at `1adfe29` and again at `36635e9`); narrow-capture PNGs `md5sum`-identical Today vs This branch |

`obsidian-shots` skipped (shared display), per the brief.

## Gates — TRULY FINAL, head `bd2087e` (rebased onto `origin/develop` `b029baa`)

| Gate | Result |
|---|---|
| `git fetch origin` / `origin/develop` | moved a fourth time: `36635e9` → `b029baa` (SC-236 + SC-255); rebase clean, 0 conflicts — see the executive summary's rebase note for the careful entry.ts overlap check |
| `npm run tsc` | clean (checked right after the rebase, before any of this round's own edits, and again at the final head) |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base, `b029baa` alone, detached checkout) | **4101 passed / 1 skipped / 211 of 212 suites / 3 snapshots** |
| `npx jest` (this head) | **4101 passed / 1 skipped / 211 of 212 suites / 3 snapshots** — identical to base; SC-232's net test-count delta is 0, third confirmation |
| `DSE_LIFECYCLE_PORT=9305 npm run obsidian-lifecycle` | **19/19 ok, 0 failed** |
| `npm run shots` | **524, 0 FAIL** |
| `check-freeze.sh .../shots` | **`freeze OK (260/260 …)`**, exit 0 — no FAILED line, no leak |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 26 DECLARED / exit 0** |
| `wrap.mjs` acceptance table | **PASSES** — byte-identical to base, third independent confirmation at this exact final head |

## Drive-by fixes

None beyond what the review/owner rulings themselves prescribed (the trait/kit-signature CSS, the SC-367→SC-368 retarget, the project rule, removing then replacing the narrow container, and the two evidence-methodology bugs the dispatcher's own eyeball caught — all directly assigned findings or direct responses to a specific critique, not independent discoveries).

## Follow-ups (owner decides)

1. **Reviewer's "ideally" item for MEDIUM-1** (a permanent harness trait fixture + a trait page in `urls.json`, so the trait/generic distinction has real gate coverage instead of only scratch verification) — explicitly marked optional by the reviewer; still not done, flagged for whoever next touches this area.
2. **SC-284 landing note, restated**: SC-284's own `.dse-head` container (unscoped, in its cardHead hunks) and SC-232's new copy (Steel screen-only, in the SC-232 rule group) declare the same `container-name` on the same element. Harmless either landing order (identical values; the later-landing branch's copy becomes a no-op duplicate), but whichever lands second should drop its own copy as a tidy-up — noted in this ticket's own CSS comment so it isn't missed.
3. Everything round 2/4 already filed stands unchanged: SC-368 (name ink), SC-367 (crest/eyebrow/right-rail sizes), and landing SC-232/SC-235 in sequence (parity `declaredDeferrals` will conflict textually; noted by the round-3 reviewer, unaffected by this round's changes).

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r4-fix-report.md`
- Wide composite (current, from round 5, confirmed unchanged this round): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r4-evidence/sc232-compare-wide.png`
- Narrow composite (current, from round 5, confirmed unchanged this round): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r4-evidence/sc232-compare-narrow.png`
- Narrow acceptance-table logs (content unchanged since round 5; re-verified byte-identical a third time at this round's final head `bd2087e`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r4-evidence/wrap-base.log`, `.../wrap-head.log`
- Modified in the worktree (`/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements/`), commits in order (all SHAs rewritten by this round's rebase; current values):
  - `044547d` feat(steel): card-head NAME type scale, per family (Option A) [round 2]
  - `74cfc0a` docs(steel): fold stale mini-derivation comments [round 2]
  - `e7c9bdb` test(parity): add per-family card-head NAME pairs [round 2]
  - `127ed6e` fix(harness): statblock-sticky-narrow scroll distance grows on screen only [round 2]
  - `9e44f9b` fix(steel): round-3 review fixes — MEDIUM-1, LOW-1, LOW-3 [round 4]
  - `59de86f` fix(steel): remove the flawed narrow container-type (LOW-2); HIGH-1 unresolved [round 4]
  - `0299ac1` fix(steel): HIGH-1 — narrow guard via `.dse-head` container, matching SC-284 [round 5]
  - `bd2087e` docs(steel): fix SC-232 comment (LOW-2) — `.dse-head` narrows, does not collapse [final round]
- Modified in the worktree superproject (`/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/`):
  - `de8b5cf5` docs: CHANGELOG entry for SC-232 [round 4] — does not bump the submodule pointer
  - `60ae70b` docs: fix SC-232 CHANGELOG entry (LOW-1) — narrow behavior is now accurate [final round] — does not bump the submodule pointer

## Verdict

**DONE.** Independent re-review verdict LAND-READY-AS-PROPOSAL; this round's two final polish findings (LOW-1 CHANGELOG wording, LOW-2 comment overstatement) are fixed, and the SC-236 `entry.ts` overlap from this round's rebase is resolved and verified clean. Every finding across rounds 3 through this final round (HIGH-1, MEDIUM-1, MEDIUM-2, LOW-1, LOW-2, LOW-3, LOW-4, both evidence-methodology bugs) is fixed, verified and committed. The full gate battery is green at head `bd2087e` rebased onto current `origin/develop` (`b029baa`); the evidence composites are confirmed unchanged and current.
