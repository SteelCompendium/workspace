# SC-391 R0 — survey brief (orchestration:reviewer)

## 1. Context loading
- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/decisions.md`.
- Your worktree: `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers` (branch `sc391-scc-prose-renderers` in every submodule; dse at `4b233886` = `origin/develop`, steel-etl at `1b57338`). Verify with `git -C <abs path> rev-parse HEAD` before reading. This is a READ/PROBE round: write nothing in the worktree except under a scratch dir; no commits.
- Read `draw-steel-elements/AGENTS.md` (and `steel-etl/AGENTS.md` if you go there) in the worktree.
- Workers never call the tracker (Linear) — not to read, not to post.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state: never write there except your report file in the ledger dir. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task
The ticket (verbatim in the ledger): `ds-scc` shows `"<name>" (type: <t>) has no renderer in this plugin.` for 219 md-dse entries across 9 types (skill, monster group lore, saint, chapter, project, movement, negotiation, god, skill-group), while the reference insert offers them all. The ticket lists the candidate answers: "a generic note/prose card family in DSE (and the md-dse emitter giving them a block), dedicated cards, and/or filtering the insert palette to renderable types."

Answer, with evidence (file:line, real sample files, probes you ran):
1. **How `ds-scc` resolves and renders today**: the path from code -> compendium entry -> `baseForType` -> block; where the "has no renderer" card is made; what the reference insert (`src/authoring/compendiumInsert.ts` ~:360) inserts and from what list. Also how the plugin gets the compendium (md-dse files synced into the vault? manifest?) — name the format and the directory.
2. **Per type (all 9)**: one real md-dse sample file path and a short description of its shape (frontmatter keys, body: plain markdown? tables? headings? embedded ds-* fences?). Does any existing DSE element already fit it (e.g. is there a `ds-negotiation`, a project element, a skill element — and is it shipping or behind the experimental switch)? Note the `monster` group-lore case specifically: why is a `type: monster` entry renderer-less?
3. **What the v2 site does** with these types (plain prose page?) — one line each is enough.
4. **Options**, each with: what the user sees in the note, files touched (dse / steel-etl md-dse emitter / schemas / SDK), whether it moves frozen print bytes or parity, rough size, risks. At minimum: (A) a generic prose card in DSE that renders the entry's markdown body (via Obsidian's MarkdownRenderer or equivalent) inside a DSE card frame, keyed off the entry's type with no emitter change; (B) (A) plus the emitter giving these types a block; (C) dedicated cards per type; (D) filter the insert palette to renderable types (alone or combined). Say which option keeps the docs promise "`ds-scc` renders any entry" true.
5. **Recommendation** with reasons, plus anything that needs Scott's taste/decision (list them as crisp questions).

Bound yourself: this is a survey, not a build. Do not prototype beyond a small throwaway probe if a fact can only be learned by running something. Keep your context lean — sample a couple of files per type, don't dump directories.

## 3. Gates
None (survey). If you run anything through devbox: `devbox run -c <abs dir> -- bash <script file>`, output redirected to a log, no pipes into `tail` for exit codes.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/sc391-r0-survey.md`. Open it with a ≤10-line executive summary (the recommendation and the Scott questions).
Scratch: a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r0-<your agent id or a random suffix>/` with uniquely named files.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict/recommendation, the option table in a few lines, Scott questions, and the absolute path of every artifact you produced. No prose padding.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-391:`.
- Use `git -C <absolute path>` for every git command; never `cd X; git …`. No `rm` with variable targets, no glob `rm`, never `rm -rf` anything under `.superpowers/`. Use the Write tool for scratch files. No background jobs or monitors.
- Never `pkill`/`killall` by pattern.
