# SC-279 round 1 — survey + design spec (reviewer, Opus)

## Context loading
- Read FIRST: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/decisions.md` (Scott's ruling is quoted verbatim there — it is your requirement). Scott's screenshot of the current bar: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-ticket-screenshot.png`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux` — DSE submodule at `.../draw-steel-elements` on branch `sc279-roll-ux`, at `f8693b5` (= origin/develop). Read `draw-steel-elements/AGENTS.md` (or CLAUDE.md) and the workspace `DESIGN.md` **in the worktree** (`/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/DESIGN.md`) — never under `/home/scott/code/steelCompendium/workspace/` except for the ledger dir.
- You NEVER call the tracker (Linear) — not to read, not to post.
- This round is READ + PROBE ONLY. Do not commit, do not edit tracked source. Throwaway probes/screens go under the ledger dir with the `sc279-` prefix.
- Use `git -C <absolute path>` for every git command, never `cd X; git …`.

## Task
Produce a concrete, implementable design spec for cleaning up the roll UI. Answer with evidence (file:line):

1. **Inventory.** Every control in `src/framework/kit/rollBar.ts` (and whatever renders around it: `src/elements/roll/view.ts`, `src/elements/feature/rollController.ts`, result card/history). For each: what it does in game terms (Draw Steel power roll: characteristic, skill bonus, edges, banes, the "Main action" toggle — what exactly does it toggle?, reset, Roll), its current label/tooltip/aria, its defaults.
2. **Where the bar appears and when.** (a) On ability cards with the `rollingEnabled` pref ON (ships in 7.0.0) — is the bar always shown, per card, on click? (b) In the standalone `ds-roll`/`ds-r`/`ds-power-roll` block (hidden behind `experimental`, deferred to SC-402). Is the same rollBar used in both? Any persisted state (block YAML / prefs)?
3. **Existing patterns to reuse.** Disclosure/collapse/icon-expand patterns already in the plugin (kit components, tokens, DESIGN.md component map), labeled-stepper patterns (e.g. Malice stepper from SC-377, any field-label conventions), icon set in use. We want the fix built from existing kit parts, not new idioms.
4. **Design spec.** Satisfy Scott's ask: (i) every control self-explanatory WITHOUT relying on tooltips — visible labels (e.g. "Characteristic", "Edges", "Banes"; what the toggle means in words); (ii) minimal by default — "Maybe its just an icon by default that expands into the full UI". Decide, with reasoning, how collapse-by-default applies on ability cards vs the ds-roll block (they may differ: on a card, rolling is a deliberate click; the ticket's complaint is primarily about ds-roll occupying a full row). Cover: collapsed state appearance, expand/collapse affordance and whether expansion state persists, labeled expanded layout incl. narrow widths (sidebar ~300px), reset semantics made clear, keyboard/aria, print (does the bar print? should it?), Scott is colorblind (no hue-only state). Give ONE recommended design plus at most one alternative where a genuine taste call exists — list those taste calls explicitly as questions for Scott.
5. **Test/gate impact.** Which jest suites, harness shots (ids), parity entries, lifecycle scenarios and frozen print lines touch the roll bar. Predict whether the change moves frozen baseline lines (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` — read-only, NEVER edit it) and which shot ids would need adding (collapsed + expanded, card + block, narrow).
6. **Current-state screenshots.** If the harness already has roll shots, give me the paths of 1–2 existing PNGs that show today's bar (card and block). Do NOT run the full shots battery; if you must render, render only the roll-related fixtures to a per-run unique path under the ledger dir.

## Gates
None this round (no code changes). For the later implementation the battery is the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`); current expected numbers at develop 9ad919d/f8693b5: tsc/lint clean · jest 4367 passed / 1 skipped / 215 of 216 suites · lifecycle 25/25 · shots 568, 0 FAIL · freeze `freeze OK (274/274 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r1-survey.md`. It MUST open with a ≤10-line executive summary (recommended design in 3–4 lines, taste questions for Scott, predicted freeze impact). Keep the body tight — spec, not essay.

## Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — verdict, the exec summary, and the absolute path of every artifact you produced. No prose recap.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Devbox: Node/npm are not on PATH. `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements && <cmd>'`; devbox eats `$?`/`$PIPESTATUS`, so redirect output to a file and read it.
- Never `pkill`/`killall` by pattern — kill only by PID whose command line contains `worktrees/sc279-roll-ux/`.
- Never `rm -rf` anything under `.superpowers/` except your own `sc279-` files.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-279:`.
