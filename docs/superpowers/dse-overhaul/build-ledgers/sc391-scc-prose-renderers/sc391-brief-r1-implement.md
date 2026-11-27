# SC-391 R1 — implementation brief (orchestration:implementer)

## 1. Context loading
- Read, in order: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/decisions.md` (the "Owner decisions" section is your spec), then the survey `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/sc391-r0-survey.md` (§1, §4 row A, §5 build notes carry the file:line map).
- Read `draw-steel-elements/AGENTS.md` in your worktree and the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command shapes, CURRENT numbers; read the parts you need, it is long).
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers`, branch `sc391-scc-prose-renderers` in every submodule. All edits go in `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers/draw-steel-elements/`. Verify `git -C <that abs path> rev-parse --abbrev-ref HEAD` says `sc391-scc-prose-renderers` before any write.
- **Fetch-and-rebase first:** `git -C <dse abs path> fetch origin` then rebase onto `origin/develop`. Expected tip `4b233886`; if it moved, rebase onto the new tip and say so.
- A fresh worktree has no `node_modules`: run `npm ci` once (through `devbox run -c <abs dse dir> -- bash <script file>`, output to a log).
- Workspace-level files (CHANGELOG.md etc.) — the ones you may touch live in YOUR worktree's superproject or in the dse repo: `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers/...`, never under `/home/scott/code/steelCompendium/workspace/` (that is the shared main checkout; only your report file goes there, in the ledger dir). The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. The task
Make the nine prose compendium types render a real card in `ds-scc` instead of the `"<name>" (type: <t>) has no renderer in this plugin.` card. Spec = the ledger's "Owner decisions" (quoted here; the ledger wins if they ever differ):

> - **Approach: Option A** (R0 survey §4/§5): one internal prose family in DSE, reusing `genericNoteAdapter` -> `GenericNote` -> `DisplayCardView`, keyed by entry type. No steel-etl / emitter change (B rejected), no per-type dedicated cards (C deferred), no palette filter (D rejected).
> - **Explicit list of the nine types, not a catch-all.** An unknown future type keeps the loud "has no renderer" card (a structured type with a too-narrow family regex must not quietly degrade to prose). Types: `skill`, `skill-group`, `monster` (exact `^monster$`; group lore), `saint`, `god`, `chapter`, `project`, `movement`, `negotiation`.
> - **Chapters render compact**: title + first paragraph + an "Open chapter" link to the synced compendium note in the vault (omit the link if the file can't be found). Empty-body chapters (2) give a title-only card. Every other type renders its full body.
> - **Projects: prose card now; dedicated card filed as SC-704** (Backlog, related to SC-391). Out of scope here.
> - **Eyebrow = plain type label**: Skill, Skill group, Monster group, Saint, God, Chapter, Project, Movement, Negotiation. Richer data-driven wording is NOT in scope (ask Scott at review).
> - Family id must NOT be `negotiation`, `project` or `skills` (element-scoped tracker CSS). `genericLayout` (rule) stays byte-identical — 0 frozen bytes expected.

Also:
- Inline `scc.v1:` links in the body must work as they do in rule cards.
- Docs: replace the "these kinds of entry have no card in the plugin yet" text in `docs/compendium-sync.md` (survey: ~:122-128) with what now renders, and check `docs/index.md` / README for the same promise. Add a bullet under `## Unreleased` in the dse `CHANGELOG.md` (if dse keeps one; else the worktree superproject's `CHANGELOG.md`).
- Tests per the plugin's conventions: jest cases for each of the nine types → the new family (`test/dom/elements/sccElement.test.ts`), an unknown type still → "has no renderer", chapter compact (first paragraph only, link present / absent, empty body), a `skill-group` with a markdown table, a `monster` lore with `###` headings; and a check that `type: statblock` and `rule` are unaffected. Add e2e coverage if `AGENTS.md` / dse-verify require it for new rendered behaviour (a `ds-scc` block of one prose type renders a card, not the no-renderer card; a chapter link click opens the note) — follow the existing e2e conventions and coverage-pair rules.
- **Visual-harness fixtures** (`visual-harness/entry.ts` + by-SCC fixtures, real md-dse samples, one per type at least: skill `skill/crafting/alchemy.md`, skill-group `skill/group/crafting.md`, monster `monster/group/goblin.md`, saint, god `religion/god/adun.md`, chapter `chapter/combat.md` (compact), project `project/build-airship.md`, movement `movement/climb-or-swim.md`, negotiation `negotiation/discovery.md`; samples are under `/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/md-dse/` — read-only, copy into fixtures). These produce the screenshots the owner will put in front of Scott: make sure shots exist for the steel theme (screen) for each, and say which PNG paths they are.

Out of scope: SC-704 (dedicated project card), any steel-etl change, palette filtering, richer eyebrow wording. Report anything else you notice as `Follow-ups:`; obviously-correct local fixes as `Drive-by fixes:`.

Commit after every coherent step (nothing uncommitted through a gate or build). Commits in the dse submodule on branch `sc391-scc-prose-renderers`; do not push, do not touch the superproject pointer. No co-author or AI attribution trailers in commit messages.

## 3. Gates (dse-verify battery, all required)
Expected at base `4b233886` (CURRENT): tsc (incl. `tsc -p e2e`) and lint clean · jest **14730 passed / 2 skipped** fresh (one more passed / 1 skipped after a shots run) · lifecycle **64/64** as the union of the seven `--only` parts (one part per foreground call) · e2e **`OBSIDIAN-E2E done: 843/852 ok, 0 failed, 9 known-bug, coverage: 486/486 pairs`** (your new tests raise N/M and maybe Y/Y — must end `0 failed` and `Y/Y`) · shots **592** + your new fixture shots · freeze **280/280** (must hold: no frozen byte moves; if one does, STOP and report — do not rebaseline) · parity **0 / 0 / 24**. Report the measured numbers for each. Also report whether built `styles.css` changed vs a clean `4b233886` build (expected unchanged unless you add CSS; if you add CSS, say why).

Run each gate as one blocking foreground call through a script file: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers/draw-steel-elements -- bash <script>`, output redirected to a uniquely named log; read the gate's own summary line. Never pipe a gate into `tail` (eats exit codes). No `run_in_background`, no Monitor.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/sc391-r1-implement.md` — open with a ≤10-line executive summary (verdict, head sha, gate numbers). Scratch: a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r1-impl-<random suffix>/`, uniquely named scripts and logs inside it.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch head sha and commit list, measured gate numbers, styles.css changed y/n, `Drive-by fixes:`, `Follow-ups:`, and the absolute path of every evidence artifact (the per-type screenshot PNGs, gate logs, report). No prose.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-391:`.
- `git -C <absolute path>` for every git command; never `cd X; git …` and never `cd` inside a compound command.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc391-scc-prose-renderers/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` anything under `.superpowers/` or a shared `/tmp` glob (e.g. lifecycle vaults). Use the Write tool for scratch files; overwrite logs with `>` or use fresh names.
- Devbox eats `$?` in `bash -c '…; echo rc=$?'` — record exit codes from a script file run through devbox.
- `npm ci` after a rebase that changed `package.json`.
- If `token-coverage.test.ts` reads red on D3-token-map rows, compare the worktree superproject's `docs/superpowers/dse-overhaul/D3-token-map.md` against the main checkout's before believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout's copy (stale pin, not a defect).
