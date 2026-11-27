# SC-391 R0 survey: `ds-scc` "has no renderer" for 9 prose types

## Executive summary
- **Recommendation: Option A.** Add one internal "prose card" family to DSE. It renders the entry's frontmatter-stripped markdown body inside the existing `.dse-card` frame, with a per-type eyebrow and crest. It reuses the rule card's machinery (`genericNoteAdapter` + `genericCard` + `DisplayCardView`), which already does exactly this for 163 `rule` files that have no `ds-*` fence. No emitter change, no SDK change, no schema change. No frozen bytes move if the rule composition is left byte-identical. Parity is unchanged at 0/0/24.
- **B (emitter block) buys nothing.** None of the 219 files has a `ds-*` fence. Neither do the 163 rules or any frontmatter-family type, and all of those already render. B would add a steel-etl change, a data regen and deploy, a forced user re-sync, and an old-compendium compat path.
- **D (filter the palette) is the wrong tool.** The same picker also inserts inline links (Shift) and copies codes (Ctrl/Cmd). Inline links to skills, negotiation motivations and gods are the most useful thing to do with these entries. D also makes the docs promise less true, not more.
- **C (dedicated cards)** is worth it later for one type only: `project`. The site already has a dedicated `pj` card for it, and its frontmatter carries the fields. Everything else is plain prose on the site too.
- **Which option keeps the promise:** only A with a **catch-all fallback** keeps "`ds-scc` renders whatever the entry is" (docs/compendium-sync.md:110) true for future types too. A with an **explicit 9-type list** keeps it true for today's corpus only.
- **Scott questions:** (Q1) catch-all fallback or explicit 9-type list? (Q2) chapters: render the residual prose (up to 156 KB) inline, or show a compact title/link card? (Q3) dedicated `project` card now (C-lite), or a follow-up ticket? (Q4) a typed eyebrow per type ("Crafting skill", "God · Vasloria", "Monster group"), or just the bare type name?

---

## 1. How `ds-scc` resolves and renders today

**How the compendium gets into the vault.** The plugin downloads the GitHub release asset `md-dse-unified-{locale}.zip` from `SteelCompendium/data-unified` (`src/data/CompendiumSyncService.ts:11-12`, `:375-397`) and unzips it into the vault folder `DS Compendium` (the `compendiumDestinationDirectory` default, `src/model/Settings.ts:37`). Sync is non-destructive and manifest-driven. The manifest is `<configDir>/plugins/<id>/compendium-manifest.json` (`src/data/manifest.ts:54`). Each synced file is a markdown note whose frontmatter carries `scc`, `type`, `name`, `item_name`, and so on. `CompendiumIndex` (`src/services/CompendiumIndex.ts`) indexes those files by `scc` through metadataCache.

**The render path** (`ds-scc` body = one SCC code):
1. `src/elements/scc/definition.ts:264` `parse` calls `parseSccBody` and returns `{kind:'ref', raw: code}`. `withReference` mounts `RefUnwrapView`.
2. `src/elements/shared/RefUnwrapView.ts:192-216`: if the compendium is missing, show the "not installed" card. Then `toCode`, then `cx.sccAnchors.resolve`. An unknown code gets the "Unknown SCC code" card; a web code gets the web card. Otherwise `index.getEntity(code)`.
3. `RefUnwrapView.ts:233-239` calls `this.baseForType(entity.type)`, which is `baseForSccType` (`scc/definition.ts:190-193`). That function is `adapterForType(type)?.alias` looked up in `BASE_BY_ALIAS` (`:161-176`, 14 entries). An `undefined` result produces **the card in question**, at `RefUnwrapView.ts:236`: `` `"${entity.name}" (type: ${entity.type || 'unknown'}) has no renderer in this plugin.` ``
4. Otherwise `entity.model()` (`CompendiumIndex.ts:120-138`, through the same `adapterForType`). An `undefined` model gives the "found but not renderable … re-sync" card (`RefUnwrapView.ts:242-254`). Then `mountBase` (`:369`) re-stamps `data-dse-element` to the resolved family and mounts its view, passing `setSource` if the view is SourceAware.

**The single source of truth** is `TYPE_ADAPTERS`, `src/services/typeAdapters.ts:240-257`:
- 3 ds-block adapters (statblock, featureblock, feature/ability/trait) read the first `ds-*` fence.
- 10 frontmatter adapters (kit … condition) run SDK `modelDTOAdapter` over the frontmatter. **No fence needed.**
- 1 model-less `genericNoteAdapter(/^rule($|\.)/, 'ds-rule')` (`:215-233`) builds `GenericNote {name, type, body}` from `item_name` and the frontmatter-stripped body. **No fence needed.**

None of the 14 claims `skill|skill-group|monster|saint|god|chapter|project|movement|negotiation`. A unit test pins the miss for unknown types: `test/dom/elements/sccElement.test.ts:153-156` (`baseForSccType('nonsense.unknown-type')` → undefined).

**What the reference insert offers.** `registerCompendiumInsertCommands` (`src/authoring/compendiumInsert.ts:390-410`) opens `CompendiumSearchModal` with **no `filter`**. `getSuggestions` (`CompendiumSearchModal.ts:123-135`) returns `index.query(text, filters)`, which covers every indexed entry. Choosing an entry:
- default: `insertReferenceBlock` (`compendiumInsert.ts:30-33`), with fence = `referenceAliasForType(type)`. That is `ds-sb`, `ds-featureblock` or `ds-feature` for the three public families and **`ds-scc` for everything else, renderable or not** (`typeAdapters.ts:306-308`).
- Shift: inline link `[name](scc.v1:code)`.
- Ctrl/Cmd: copy the code.

The snapshot command already uses the modal's `filter` hook (`compendiumInsert.ts:437`, `snapshotAliasForType(...) !== null`), so the filter mechanism D would need already exists.

## 2. Per type (census of `data/data-unified/en/unified/md-dse`, probe `census.sh`)

Counts match the ticket exactly: 57+51+28+26+16+13+12+11+5 = 219. **0 of the 219 carry any `ds-*` fence.** For comparison, rule (163) and every frontmatter family also have 0 fences and render fine. Only ability, trait, feature, statblock, featureblock, dynamic-terrain and kit carry fences.

Every file has the frontmatter keys `type, source, scc, name, item_name, item_id, file_dpath, file_basename`. Extras are noted per type. Every body is plain markdown with `scc.v1:` inline links: no callout syntax beyond `>` quotes, and no images.

| type | n | sample | extra fm | body shape (bytes min/median/max) |
|---|---|---|---|---|
| skill | 57 | `md-dse/skill/crafting/alchemy.md` | — | one sentence ("Make bombs and potions."); 192/237/1042 B whole file; 0 headings/tables |
| skill-group | 5 | `md-dse/skill/group/crafting.md` | — | 3 prose paras + `######` heading + a markdown table of the group's skills; ~2.7 KB |
| monster (group lore) | 51 | `md-dse/monster/group/goblin.md` | `category` | long lore prose with `###`/`####` subsections, some tables; 1.5/3.8/27.9 KB (dragon) |
| saint | 28 | `md-dse/religion/saint/atossa-the-shepherd.md` | `patron`, `domains[]` | `**Domains:** …` line + story prose; 1.0/2.6/5.7 KB |
| god | 11 | `md-dse/religion/god/adun.md` | `pantheon`, `god_class`, `alignment`, `domains[]` (10/11) | `**Domains:** …` line + prose, rare headings; 1.1/1.7/3.3 KB |
| chapter | 26 | `md-dse/chapter/combat.md`, `md-dse/chapter/for-the-director.md` | `order` | the chapter's **residual prose** (text not carved into other entries); body 0 B (2 files: the-beastheart-class, the-summoner-class) … 156 KB (for-the-director); 3071 inline links total |
| project | 16 | `md-dse/project/build-airship.md` | `project_source`, `project_roll_characteristic`, `project_goal`, `item_prerequisite` (14/16) | bolded field lines repeating the frontmatter + effect prose, some tables; 0.6/3.6/22.3 KB |
| movement | 13 | `md-dse/movement/climb-or-swim.md` | — | 1–3 prose paras; 0.4/0.9/9.2 KB |
| negotiation | 12 | `md-dse/negotiation/discovery.md` | — | motivation para + pitfall para + argument-example bullets; 1.6/2.0/3.3 KB |

**Does an existing DSE element fit?** No. All three same-named elements are trackers, not reference cards.
- `ds-negotiation` / `ds-nt` (`src/elements/negotiation/definition.ts:28-30`) is a persisted negotiation tracker and is **shipping**.
- `ds-project` (`src/elements/project/definition.ts:28-31`) is a persisted downtime tracker, **deferred** behind `experimental` (`:31`). Its view already resolves a `goal_code` project entry for name and points (`project/view.ts:93-105`), but it does not draw the entry.
- `ds-skills` (`src/elements/skills/definition.ts:29-31`) is an interactive hero skill list and is **shipping**.
- No element exists for god, saint, chapter, movement or monster group.

**ID collision footgun.** `mountBase` re-stamps `data-dse-element` to the rendered family's id (`RefUnwrapView.ts:369`). `styles-source.css` has 45+4 `data-dse-element='negotiation'` rules, 6 `='project'` rules and 4 `="skills"` rules. A new reference family must therefore **not** reuse the ids `negotiation`, `project` or `skills`, or the tracker CSS lands on it. Display-family cards (kit, rule, …) have **zero** element-scoped CSS, so a new `.dse-card` family needs no CSS.

**Why `type: monster` has no renderer.** The group-lore file's SCC type segment is `monster.group` (`scc: mcdm.monsters.v1/monster.group/goblin`). steel-etl writes the segment's **root** (`monster`) into frontmatter `type:`, the same root-vs-leaf inconsistency `typeAdapters.ts:95-99` documents for `dynamic-terrain`. The group's statblocks are separate `type: statblock` files under `monster/<group>/`, and `STATBLOCK_TYPE_RE = /(^|\.)statblock$/` (`typeAdapters.ts:58`) correctly does not match a bare `monster`. The lore file has no fence and no adapter claims `monster`, so `baseForSccType` returns undefined. It is prose, not a statblock entry. In the current corpus, bare `type: monster` is used only by these 51 lore files.

## 3. What the v2 site does
Leaf pages are `# Name`, then `---`, then the body as plain markdown, unless noted.
- skill: plain prose page (`v2/docs/Browse/skill/crafting/alchemy.md`). Index tiles use the generic `card()` with a 220-char blurb (`steel-etl/internal/site/cards.go:287-295`).
- skill-group: this is the group landing (`Browse/skill/crafting/index.md`): prose and table, then a folder of the skills. The SCC permalink `skill.group/crafting` redirects there.
- monster group: the group landing `Browse/monster/goblin/index.md`: lore prose plus a statblock-preview grid. The SCC permalink redirects there.
- saint / god: plain prose leaf pages (`Browse/religion/{saint,god}/…`). They get a dedicated **index tile** only (`godCard`/`saintCard`, `cards.go:280-283`).
- chapter: no Browse page. The SCC permalink redirects to the Read page (`v2/docs/scc/mcdm.heroes.v1/chapter/combat/` → `Read/heroes/combat/`).
- project: a **dedicated leaf card** `<article class="pj">` with dt/dd rows for prerequisite, source, roll and goal (`steel-etl/internal/site/project_cards.go`, `Browse/project/build-airship.md`).
- movement / negotiation: plain prose leaf pages. Index tiles use the generic `card()` blurb (`cards.go:287`).

## 4. Options

| | What the user sees in the note | Files touched | Freeze / parity | Size | Risks |
|---|---|---|---|---|---|
| **A — prose card in DSE** | A real `.dse-card`: crest + eyebrow ("Skill", "God", …) + title (`item_name`) + the body markdown rendered through the existing `renderMarkdown` band, with inline `scc.v1:` links live (as in rule cards). Collapsed chrome line reads "SKILL: Alchemy". | dse only: `typeAdapters.ts` (one more `genericNoteAdapter`-style entry, alias e.g. `ds-note`; the rule-only `sccTypeSegment`/`RULE_SCC_SEGMENT_RE` at `:177-195` stays rule-only), `display/displayFamily.ts` (a `proseLayout` beside `genericLayout`, with a per-type eyebrow/crest table), `display/index.ts` (export `noteElement`, id e.g. `note`, **not** `project`/`negotiation`/`skills`), `scc/definition.ts` `BASE_BY_ALIAS` (+1), `visual-harness/entry.ts` registration plus by-SCC fixtures (real md-dse samples per type), `test/dom/elements/sccElement.test.ts` (+9 `type → note` cases), `docs/compendium-sync.md:86-128` ("what doesn't yet" list), CHANGELOG `Unreleased`. | **0 frozen bytes** if `genericLayout` (rule) is not edited: `rule--steel-{print,realprint}.png` and `rule-by-scc--steel-{print,realprint}.png` are in the 280-line baseline. New fixtures add new shot names, which cannot collide. Parity: no pair covers these types, so it stays 0/0/24. | ~300–500 LOC including tests and fixtures; 1–2 rounds | Very large bodies: chapter for-the-director is 156 KB, dragon lore 28 KB (see Q2). Headings `###`–`######` inside a card need one visual check. Empty-body chapters (2) give a title-only card; `bands` already returns `[]` for an empty body (`displayFamily.ts:178-186`). |
| A-variant: **catch-all** | Same, and any future unclaimed type renders as prose too. | As A, plus `adapterForType` gets a last fallback, and `sccElement.test.ts:153-156` flips from "undefined" to "prose". | Same | +small | Hides SC-141-class bugs: a type that *should* be structured (a family regex too narrow) silently renders as prose instead of a loud card. Mitigation: a debug marker, or a test that the census types are each claimed by their intended adapter. |
| **B — A + emitter block** | Same as A. | A + `steel-etl/internal/output/dse.go:45-110` `buildDSEFile` (new case for 9 types) + steel-etl tests + `data-unified` regen/deploy (219 files change) + DSE must still handle blockless files from older releases. | md-dse output bytes change; deploy + every user re-syncs | +steel-etl round + deploy | No rendering benefit: body-only rendering is already proven (163 rules). A fenced body would also make the synced file render as a card when opened directly, where today it reads fine as a plain note. Two sources of truth (fence and body). |
| **C — dedicated cards** | Typed compositions: project (rows for prerequisite, source, roll, goal, matching the site's `pj`), god/saint (domains as badges, pantheon/patron eyebrow), negotiation (motivation/pitfall split), monster group (lore + list of the group's statblocks), skill (compact one-liner). | dse: a DSE-local model + CardLayout per type (no SDK model exists for any of the 9; data-sdk-npm `src/model/` has none), fixtures, shots; optional parity pairs (project vs the site `pj`). | New shots only; a parity pair is optional work | ~100–250 LOC per type; 9 types ≈ several rounds | Parsing semantics from prose bodies (negotiation split, monster-group membership) is brittle. Little gain over A for 7 of 9 types, since the site itself shows plain prose for them. |
| **D — filter the palette** | These 219 disappear from "Insert … compendium reference". The card stays for existing blocks. | `compendiumInsert.ts:398-408` `filter:` (the hook exists). | none | tiny | Also removes Shift (inline link) and Ctrl/Cmd (copy code) for them, and inline links are the main use for skills, motivations and gods. Contradicts docs/compendium-sync.md:126-128 ("still lists them"). Does not fix any existing block. Makes the promise less true. |

**The promise.** "`ds-scc` renders whatever the entry is" (docs/compendium-sync.md:110), plus "reference any entry by its code" (README.md:61):
- A-catch-all: true for every present and future type.
- A-explicit: true for today's corpus. The no-renderer card stays reachable for a future type.
- B and C: same as whichever A-flavour they include.
- D: never. It hides entries instead of rendering them.

## 5. Recommendation
Ship **A**: an internal `note` prose family keyed by type, reusing `genericNoteAdapter` → `GenericNote` → `DisplayCardView`. Reasons:
- It is the exact pattern that already renders 163 fence-less rules, so the risk is low.
- It is dse-only, moves no frozen bytes and leaves parity untouched.
- It fixes all 219 entries in one round.
- It keeps the insert palette whole, including inline links.

Put the per-type eyebrow and crest in a small table so `project` can graduate to a dedicated composition later without changing the family. Do not do B. Do not do D. Defer C except possibly `project` (Q3).

Build notes for the implementer:
- Keep `genericLayout` (rule) untouched, or prove byte-identity with the freeze gate.
- The new family id must not be `negotiation`, `project` or `skills`.
- Key `monster` as `^monster$`. Today that matches only group lore; statblocks are `type: statblock`.
- Docs: replace the "These kinds of entry have no card in the plugin yet" paragraph (docs/compendium-sync.md:122-128).

**Questions for Scott:**
1. **Catch-all or explicit list?** Should any entry type the plugin doesn't know render as a prose card (the promise holds forever, but a mis-scoped structured type would quietly degrade to prose), or only these nine (a future unknown type still shows "has no renderer")?
2. **Chapters:** a chapter entry is the chapter's leftover prose, from empty (2 chapters) up to 156 KB ("For the Director"). Render it in full inside the card like the others, or show a compact card (title + first paragraph + "open the chapter" link)? On the site a chapter code goes to the Read page.
3. **Projects:** the site gives projects a dedicated card (prerequisite / source / roll characteristic / goal rows). Match it now as part of this ticket, or ship prose now and file a follow-up?
4. **Eyebrow wording:** plain type ("Skill", "God", "Monster") or a richer one from the data ("Crafting skill", "God · Vasloria", "Saint of Kul", "Monster group")?

---
Probes (throwaway, read-only): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r0-k7q2/census.sh` → `census.tsv` (per-file type, fence count, path); `shape.sh` → `shape.log` (per-type sizes, frontmatter keys, heading/table/link counts). Data read from the main checkout's `data/data-unified/en/unified/md-dse` (read-only). Code read from the worktree: dse `4b233886`, steel-etl `1b57338`. Worktree `git status --porcelain` was empty before and after (superproject, dse, steel-etl).
