# Follow-ups

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below instead of chasing them now, and
**clear these before starting a new feature.** New features and larger efforts go in
`ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line rather
than deleting it; completed items are pruned and the rest renumbered on a periodic
cleanup pass.

<!-- Template — copy for each item, numbering sequentially:
## N. Short title
**Status:** open
- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description
- **Why:** motivation / value
- **Context:** file paths, gotchas, anything that saves grep time
- **Effort:** XS (<1 h) / S (1–4 h) / M (1 day) / L (multi-day) -->

## 1. Beastheart source says "Animal Handling"; the skill is "Handle Animals"

**Status:** open

- **Identified:** 2026-06-02, beastheart linking pass.
- **What:** The beastheart class skill grant (`Draw Steel Beastheart.md`, Basics, ~L294) reads "You gain the **Animal Handling** skill" and lists "Animal Handling" in the Quick Build. The actual Draw Steel skill is **Handle Animals** (`mcdm.heroes.v1/skill/handle-animals`). Left UNLINKED to avoid a display-text/term mismatch; "Navigate" and "Track" on the same line were linked.
- **Why:** Either the source has a naming inconsistency to correct (rename to "Handle Animals"), or it's an intentional alt-name that should be linked to `skill/handle-animals` with alt display text. Resolve, then link.
- **Context:** Single occurrence pair on one line. Confirm against the Beastheart PDF (book Basics page) before renaming source content. If renamed, also link it to `skill/handle-animals`.
- **Effort:** XS

## 2. Beastheart companion stat blocks not published to Browse (broken `feature-group/companion/*` links)

**Status:** open

- **Identified:** 2026-06-02, Read-tab-by-book work
- **What:** Companion stat blocks are emitted as `feature-group/companion/<name>.md` in `md-linked`, but `feature-group/` is **not** in `v2/site.yaml`'s Browse `include:` list, so companion pages are never published. Every `scc:.../feature-group.companion/<name>` cross-reference (≈7 distinct companions, ~26 link instances across the Beastheart class page and the new `Read/beastheart/the-beastheart-class.md` chapter) therefore dangles. Pre-existing on `main` (the Beastheart class page on the live site had the same broken links); the Read-tab work duplicated the links into the Read chapter but did not cause the root gap.
- **Why it matters:** Companion stat blocks are core Beastheart content; the links are clickable-but-404. Adding `feature-group/` to the Browse `include:` would publish them and resolve the links — but first confirm companions are *meant* to be standalone Browse pages vs. embedded-only in the class page (they already render inline in the class subtree). If standalone, also decide their index/title treatment.
- **Context:** `v2/site.yaml` Browse `include:`; companion sources in `data/data-beastheart/en/md-linked/feature-group/companion/`. `matchesSection` uses prefix matching, so `feature/` does **not** match `feature-group/`.
- **Effort:** S (one-line include + verify) once the design intent is confirmed.

## 3. Stale top-level nav entry `Full Book`

**Status:** done

- **Identified:** 2026-06-02, Read-tab-by-book work
- **What:** `v2/docs/.nav.yml` (committed, protected from the site builder's clean) lists a `Full Book` nav item that matches no file/dir, producing an `awesome-nav` warning on every build. Pre-existing (present on `main`, commit "Adjusting nav").
- **Why it matters:** Minor — a persistent build warning and a dead tab slot. Remove the line or point it at real content.
- **Effort:** XS
- **Resolution:** 2026-06-03 — Removed the `Full Book` line from `v2/docs/.nav.yml` (it was unsupported and the full-book page loaded too slowly). Also dropped the now-stale `Full Book` mention from the `reading-progress.js` header comment. Verified via `mkdocs build`: the `awesome-nav` warning for `Full Book` no longer appears.

## 4. `transform_indexes.py` is dead code for the current card index pages

**Status:** open

- **Identified:** 2026-06-04, card markdown-rendering / `.md`-link fix
- **What:** `v2/scripts/transform_indexes.py` (run as step 4 of the `just deploy-v2` / `update` recipe) only matches files named `_Index.md` or `Index.md` (capitalized) via `rglob`, and only rewrites markdown **tables** into `browse-index` lists. The current `steel-etl site` builder emits lowercase `index.md` pages rendered as raw-HTML `sc-card` grids (see `internal/site/cards.go`), which the script never matches and which contain no tables. So the step is effectively a **no-op** — it transforms nothing on a normal build.
- **Why it matters:** Dead pipeline step is misleading (it looks like index pages are post-processed when they aren't — this cost real debugging time tracing how card links resolve). Either remove the step from the justfile + delete the script, or confirm whether any remaining table-style `Index.md` pages still depend on it before deleting.
- **Context:** `v2/justfile` step 4 (`scripts/transform_indexes.py docs/Browse`); the script's `main()` globs `_Index.md` / `Index.md` only. Card pages are generated lowercase `index.md` by `buildCardsContent` in `steel-etl/internal/site/cards.go`. Confirm with `find v2/docs/Browse -name 'Index.md' -o -name '_Index.md'` (expected: none) before removing.
- **Effort:** XS (verify no matches, then drop the step + script)

## 5. Kit-flatten breaks cross-reference links to kit ability pages (mkdocs build warnings)

**Status:** open

- **Identified:** 2026-06-05, surfaced while verifying the `navigation.indexes` (section-index-pages) change with `mkdocs build`.
- **What:** The Browse `kit` group in `v2/site.yaml` uses `flatten: true`, relocating each kit ability page from `feature/ability/{kit}/{ability}.md` → `feature/ability/Kits/{kit}-{ability}.md`. But SCC cross-reference links in the source docs still point at the **un-flattened** path, so they 404. 6 such `not found among documentation files` warnings on a clean build: `Read/heroes/classes.md` (×3), `Read/heroes/rewards.md` (×1), `Read/heroes/treasures.md` (×1), and `Browse/treasure/leveled/weapon/blade-of-the-luxurious-fop.md` (×1) — e.g. link `Browse/feature/ability/sniper/patient-shot.md` vs actual page `Browse/feature/ability/Kits/sniper-patient-shot.md`. Affected kits seen: sniper, shining-armor, martial-artist, swashbuckler.
- **Why it matters:** Clickable-but-404 links to kit ability pages, plus persistent build warnings. The flatten is a site-builder transform, so source link text can't easily anticipate the rewritten path — the fix likely belongs in the flatten step (rewrite inbound links and/or emit a redirect stub at the old path), not in the source markdown.
- **Context:** Flatten logic: `groups[].flatten` in `steel-etl/internal/site/config.go` + `build.go`; the `Kits` group is defined in `v2/site.yaml` Browse section. Note the other 9 build warnings (`Read/beastheart/the-beastheart-class.md` → `feature-group/companion/*`) are a **separate** root cause already tracked in item #2 above, not this one.
- **Effort:** S

## 6. Combat-mechanic + ability cross-reference links: large under-linked categories remain

**Status:** done (2026-06-07). The genuinely-linkable remainder was cleared; what's left is deliberately unlinked with documented rationale (see "Resolution" below).

- **Identified:** 2026-06-06, comprehensive link-audit pass (kits/maneuvers/gods/truncation fixes).
- **What:** A link audit (`steel-etl/scripts/link_audit.py`) found that entire **combat-mechanic** categories — the `feature.trait.common.*` / `feature.ability.common.*` move actions, maneuvers, and free strikes — were **never in `docs/linking-reference.md` and never linked**. The 2026-06-06 pass linked the *unambiguous* ones only: the three **move actions** (Advance, Disengage, Ride — guarded on a following "move action"), the **distinctive maneuvers** (Catch Breath, Escape Grab, Aid Attack, Search for Hidden Creatures, Use Consumable, Stand Up-before-"maneuver"), plus kits (Rapid-Fire hyphen miss + Sniper cross-refs), distinctive gods (Cavall, Salorna, Adûn, Nebular, Thellasko — own-section excluded), `I'm No Threat`, and the Templar `Domain Piety and Effects` truncation.
- **Round 2 (2026-06-06, same day):** Linked **Free Strike** (~138: generic `free strike` → `feature.trait.common.main-actions/free-strike`, excluding the `Weapon Free Strike` ability names; + the `Ranged Weapon Free Strike` prose ref) and the **common-verb maneuvers/actions** via high-precision guards (Hide/Charge/Grab/Knockback/Heal/Defend followed by "maneuver"/"main action", the Grab↔Knockback pairings, the Advance↔Disengage pairing, and the glossary `**X Maneuver:**`/`**X Main Action:**` entries). Also linked the `Strike Now` cross-references.
- **What remains:**
  - **Common-verb maneuvers in non-guarded phrasings** (~lowercase/descriptive): e.g. "tests made to hide", "a creature can grab only…", "search for hidden creatures as a free maneuver". Roughly half of the leftover Hide/Grab/Charge/etc. occurrences are genuinely **mundane** ("grab two dice", "in charge of"); the mechanic-but-unusually-phrased remainder needs the per-instance mundane-vs-mechanic pass that conditions/skills got (the linking-guide forbids scripted replacement here).
  - **Full distinctive-ability cross-reference sweep**: many ability/feature names are referenced outside their own sections, but the audit showed this is **high-effort, low-yield, ambiguity-heavy** — generic per-class terms (`Triggered Action` ×159, `Signature Ability` ×69 map to one class's code but every class has its own), **cross-class domain features with identical names** (e.g. `Invocation of the Heart` exists for both censor *and* conduit), lowercase keyword/stat uses (`corruption immunity N`), and many 1-occ self-section mentions. Needs **section-aware own-section exclusion + per-class disambiguation** tooling, not the flat regex linker.
  - **Reference-table sync**: add the now-linked combat-mechanic terms to `docs/linking-reference.md` (they're absent), and note gods were only partially present.
- **Why it matters:** The project policy is "link all instances of game mechanics" (`docs/linking-guide.md`); the remaining items are a real but lower-yield, judgment-heavy tail — not a one-shot script.
- **Tooling:** `steel-etl/scripts/link_audit.py` (full unlinked + truncation report from `classification.json` + generated md frontmatter), `link_audit_category.py <code-substr…>` (per-category report), `link_apply.py '<regex w/ group 1>' '<code>' [start-end excl…] [--apply]` (safe single-rule linker: skips headings incl. `>` blockquote headings, existing links, comments; dry-run by default), and `link_audit_sectioned.py '<term>'…` (added 2026-06-07: buckets each unlinked occurrence by enclosing **class section** — built for the part-C own-section/cross-section split below).
- **Effort:** L (mirrors the original multi-chapter conditions/skills linking effort)

- **Resolution (2026-06-07, full A+B+C pass):** +27 links; heroes-doc SCC refs ~4,595 → ~4,622. `gen` 0 WARN (1807 classified), no malformed links.
  - **A — reference-table sync:** the Combat Actions & Maneuvers + Gods sections were *already* in `docs/linking-reference.md` (added 2026-06-06; the "they're absent" note above was stale). Verified all 25 universal `common.*` codes are present. Added a new **Heroic Resources (9 terms)** section and a **"Generic per-class mechanics — deliberately NOT linkable"** note; total 460 → 469.
  - **B — common-verb maneuver per-instance pass:** read every remaining unlinked occurrence of Hide (59), Charge (42), Grab (30), Stand Up (29), Disengage (21), Advance (19), Defend (17), Heal (15), Ride (14), Knockback (3). Only **7** were genuine mechanic refs (the rest are mundane "in charge of"/"grab two dice", the Hide/Ride **skills**, the "Disengage Bonus" kit stat label, ability **names**, keyword stat-block rows, or each maneuver's own-section definition). Linked: Knockback ×2 (beside already-linked Grab/in "the Knockback or Grab maneuver"), Grab ×2 (the Escape Grab/Grab/Knockback perk list; "(see Grab below)"), Charge ×2 + Defend ×1 (the "charge into battle, defend yourself, or make a free strike" basic-main-actions sentence; the "Furious Charge" title's "the Charge action").
  - **C — heroic-resource / distinctive-ability sweep:** section-aware audit (`link_audit_sectioned.py`) confirmed each resource (Wrath/Piety/Essence/Ferocity/Discipline/Insight/Focus/Clarity/Drama) sits **overwhelmingly inside its own class section** (≈80–95%), and that the prior passes had linked each resource exactly once (in its class progression table). Linked the **20** genuine cross-references only: the 9 Introduction-glossary definition lines, the 9 "Heroic Resources" overview-list items, plus 2 explicit other-chapter mechanic refs ("spend 1 piety"; "gain 1 additional drama"). **Deliberately left unlinked** (documented in `linking-reference.md`): generic per-class terms (`Triggered Action` ×159, `Signature Ability` ×69, `Skill`, `Perk`) — each maps only to one arbitrary class's code though every class has its own, so there is no canonical target; `Steel` (≈always the game name "*Draw Steel*"); and all within-class / mundane-flavor resource uses.

## 7. `gen` doesn't prune the SCC API `resolve/` dir — stale entries linger for renamed/removed codes

**Status:** open

- **Identified:** 2026-06-06, during the full deploy after the fury "Stormwight Kits" regrouping renamed several codes.
- **What:** The SCC resolution API writer (`steelCompendium.github.io/docs/api/v1/resolve/<source>/<type>/<id>.json`) only **adds/overwrites** per-code JSON files; it never deletes files for codes that no longer exist. After the fury regroup, both the new `…/feature.trait.fury.stormwight-kits/*.json` **and** the stale old `…/feature.trait.fury/{stormwight-kits,primordial-storm,kit-features,…}.json` (and `feature.ability.fury/aspect-of-the-wild.json`) are present in the committed org repo. The per-type `index.json`/`scc.json`/`types.json` are regenerated fresh, but the individual `resolve/.../*.json` files are not pruned.
- **Why it matters:** Stale entries resolve removed/renamed codes to dead Browse paths (404). Currently harmless — nothing links to the old fury codes (all inbound links were redirected) — but it accumulates cruft and could mask a genuinely-removed code. Same risk applies to any future code rename/removal (treasure reorg, etc.).
- **Fix options:** (a) clean the `resolve/` tree before writing each run (like the `data/data-rules` format dirs are cleaned), or (b) diff against the registry and delete orphaned `*.json`. Option (a) is simplest but makes the org-repo diff noisier on every deploy; (b) is surgical. Either belongs in the API generator in `steel-etl/internal/output/` (the SCC API writer), invoked by `gen`.
- **One-time cleanup:** the existing stale fury entries can be removed by hand (`git rm docs/api/v1/resolve/mcdm.heroes.v1/feature.trait.fury/{stormwight-kits,primordial-storm,kit-features,kit-bonuses,equipment,growing-ferocity,aspect-benefits-and-animal-form}.json` and `…/feature.ability.fury/aspect-of-the-wild.json`) in the org repo, but they'll keep reappearing for *future* renames until the generator prunes.
- **Effort:** S (generator change) + XS (one-time cleanup)
