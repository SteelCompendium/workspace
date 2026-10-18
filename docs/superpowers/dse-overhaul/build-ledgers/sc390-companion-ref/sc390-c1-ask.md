**Ask: approve fixing this in the data. Beastheart companions become `type: statblock` with a real statblock block, and the plugin's existing statblock card renders them. Reply "approved" or tell me what to change.**

**Why it fails.** The compendium ships all 14 beastheart companions (Panther, Drake, and the rest) as `type: feature-group` with only a markdown stat table in the body and no `ds-*` block. The plugin's `ds-scc` picks a renderer by type, and `feature-group` has none, so you get the "has no renderer" card. The website only looks right because steel-etl has a site-only parser that reads that table; the plugin has no equivalent.

**The fix.** steel-etl emits each companion the way it already emits retainers, summoner minions, champions and rivals: `type: statblock`, structured stats (size, speed, stamina, stability, free strike, movement, skills, the five characteristics), and `features` holding the Level 1 base abilities (Pounce and Mighty Spring for the panther). The Level 3/6/10 advancement features stay their own entity, which already renders. The plugin needs no dispatch change. It gains a Skills line in the statblock header and stops printing a dangling "EV" when a statblock has none (companions have no EV; the four summoner champions show this today too).

**What you are approving, in one list:**

1. Companions flip to `type: statblock` in every output format (json, yaml, md, md-linked, md-dse). Codes and permalinks do not change. The site must render byte-identically (companion page, index preview, companions stay out of the bestiary search); the implementer proves that with a before/after site diff.
2. The shared statblock schema changes in two places: `free_strike` may be text (`1 + M`) as well as a number, and an optional `skills` list is added. Both the steel-etl and the data-sdk-npm schema copies move together, with a data-sdk-npm release and the plugin's pinned SDK bumped inside this ticket. My recommendation is to do the release here rather than have the plugin work around the pin.
3. The plugin hides the empty "EV" label. This moves two frozen print shots (`statblock-roleless-corpus`, print and realprint). I will put the before/after crops and the two hash lines in front of you for sanction with the review evidence; nothing in the shared baseline moves until then.
4. The compendium docs page gets a plain "what renders / what doesn't yet" line, because `ds-scc` promises to render "any entry" and that is not true today (see SC-391 below).

**Alternatives I am not recommending:** a new `companion` type (another discriminator in two schemas, the SDK and the plugin, when `statblock` plus `organization: Companion` is the house pattern); emitting a statblock block only for the plugin while the type stays `feature-group` (the formats would disagree about what the entity is); or teaching the plugin to parse the markdown table (duplicates the site's Go parser in TypeScript and cannot reach the abilities, which are separate files).

**One question for you:** should companions become searchable in the site's bestiary as a "companion" facet? They are excluded today and I plan to keep it that way so the site stays identical. Say the word and I will file it.

**Filed as separate Backlog tickets from the survey:**
- SC-391: nine other compendium types also hit "has no renderer" (skills, saints, gods, chapters, projects, movement, negotiation, skill groups, monster-group lore; 219 entries). The insert palette offers them all. Companions are the only statblock-shaped hole, which is what this ticket fixes.
- SC-392: show the companion's Level 3/6/10 advancement features under its card in the plugin.
- SC-393: encounter trackers compute NaN max stamina for text stamina ("SPECIAL", "5 | 5", and now "= yours").
- SC-394: once the data carries the stats, the site can retire its markdown-table parser.

**After it lands:** you will only see the Panther render after a data-unified deploy and a compendium re-sync in Obsidian. The Skills line and the EV fix ship with the next plugin release.

Survey report (machine-local): `.superpowers/sdd/sc390-companion-ref/sc390-r0-survey.md`.
