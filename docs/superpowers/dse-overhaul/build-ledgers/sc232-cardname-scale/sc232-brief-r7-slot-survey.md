# SC-232 round 7 — survey: which card-head slots does the plugin leave empty that the site fills?

Your final text goes to the ticket-owner, not a human. **No source edits this round**
(measurement scripts in scratch are fine). Workers never call the tracker (Linear).

## Context

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`
   — read "Scott ruling 1" (verbatim quote) and the owner reading under it. That is the task.
2. The composite Scott looked at: `.../sc232-cardname-scale/r4-evidence/sc232-compare-wide.png`
   (columns Today | This branch | Option B | Site). Your round-1 survey report
   `sc232-r1-survey-report.md` and scripts in `r1-survey/scripts/` (site-measure, dom-chain) —
   reuse them.
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale` (dse branch
   `sc232-cardname-scale`, head `bd2087e`). Do NOT rebase or commit this round — survey the
   head as it is, but read `origin/develop` (`git -C <wt>/draw-steel-elements fetch origin`;
   expected `afd6ae3` or later, SC-231 keyword chips / SC-284 head stacking / SC-338 optchip
   landed there) for any head-slot code that changed since — `git diff HEAD...origin/develop --
   src/` restricted to head/slot code.
4. Site CSS/templates: `v2/docs/stylesheets/steel-cardhead.css` and the steel-etl templates
   that emit `.sc-head` (find them under `steel-etl/`). Plugin: the `.dse-head` renderer and
   every family's head composition under `draw-steel-elements/src/`.

## Questions

1. **Slot map.** The head has six slots (eyebrow/primary/deck × left/right, plus the crest).
   For each family the plugin renders — ability card (feature), trait, kit head, kit signature
   ability, statblock, featureblock, project, and any other card-head family (ancestry, class,
   career, perk, title, treasure, condition, …: list which exist) — tabulate, slot by slot:
   what the SITE puts there (text + which data field feeds it, template file:line) and what
   the PLUGIN puts there (text + source file:line), for the SAME entity where possible (render
   the same SCC item on both sides; the plugin's by-SCC path or a fixture built from the
   entity's data).
2. **Gap classes.** For every slot where they differ, classify:
   (a) plugin renders the slot but the harness fixture simply lacks the data (fixture gap only);
   (b) the data is in the plugin's input (fence YAML / SDK model / SCC data the plugin loads)
       but the head composition does not map it;
   (c) the data is not in the plugin's input model at all (needs schema / data-gen / steel-etl
       work — name the repo and field);
   (d) the plugin puts something in a DIFFERENT slot than the site (e.g. statblock: site
       eyebrow "MONSTER" + lower-left "Human, Humanoid" vs plugin eyebrow "HUMAN, HUMANOID").
   Scott's example: the "Determination" trait's lower-left "Human" (site) — classify it first.
3. **Which of these are deliberate.** Search DESIGN.md (worktree superproject), the SC-120 /
   SC-121 / SC-191 / SC-284 docs and code comments for any documented decision to leave a slot
   empty or move it; quote it with path:line. A documented Scott decision is not a gap.
4. **Plan.** Group the (b)/(d) gaps into implementable work items with file targets; estimate
   each; flag any that move frozen print bytes (print renders the same DOM, so NEW head content
   almost certainly does — name the frozen capture ids that would change). List (c) items
   separately with the repo/field needed. Flag overlap with SC-367 (crest/eyebrow/right-rail
   sizes, Backlog) and SC-368 (name ink, Backlog).

## Rules

- Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/` (`pgrep -af`, check each line). Never `pkill`/`killall`.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`; foreground only; long output to a
  per-run unique file; never key a wait loop on a scratch filename or its contents.
- Never touch the shared main checkout's working tree (read-only use of the ledger dir is fine).
  Never `rm -rf` the shared `.superpowers/` dir. Never run `steel-etl site` with
  `pipeline.yaml` — if you need a site build at all, the only config is `../v2/site.yaml`, but
  prefer reading the live-site DOM and the templates over building.
- If the report write is blocked, return it inline. You cannot `SendMessage` the owner; if you
  need input end with `STATUS: NEEDS_CONTEXT`; if you message anyway the first word is `SC-232:`.

## Report

`.../sc232-cardname-scale/sc232-r7-slot-survey-report.md`, opening with a **≤10-line
executive summary**: how many gaps per class, Scott's "Human" example's class, the recommended
first work item, and whether it moves print. Then the slot table, then the plan. Final text:
verdict + counts + artifact paths.
