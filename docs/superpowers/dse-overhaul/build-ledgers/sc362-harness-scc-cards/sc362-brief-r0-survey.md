# SC-362 round 0 — design survey (reviewer, read-only)

You are a survey/design worker for ticket SC-362. Your final text goes to the ticket-owner,
not a human. **You never call the tracker (Linear)** — not to read history, not to post.

## Context loading

1. Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/decisions.md`
   (the ledger — current state of all rulings).
2. Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`: the
   battery table (top) and the CURRENT block (search `**CURRENT —`), plus the "Widening the
   baseline is additions-only" bullet.
3. Read `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements/AGENTS.md`
   (or CLAUDE.md) and `visual-harness/README.md` in the same repo.
4. Worktree (dse clone): `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements`,
   branch `sc362-harness-scc-cards`, at `0ce76dd` (= `origin/develop`). This round is
   READ-ONLY: write nothing in the worktree.

## The task

The ticket: the browser shots harness (`visual-harness/entry.ts`) has no compendium, so it
cannot render any display card resolved by SCC code (by-SCC or hybrid mode). Scott's fix
direction (verbatim):

> Fix direction: give the harness a small fixture compendium (a handful of real `md-dse`
> files) and add by-SCC captures for at least the rule card, so these paths get shots and
> become eligible for the freeze set.

Answer these questions, citing file:line. Probe by running code where it is cheap (e.g. a
small node/tsx snippet, or reading the built bundle) — don't guess.

1. **Resolution path.** How does a display block (e.g. `ds-rule`, `ds-ability`) in by-SCC and
   hybrid mode resolve its `scc:` code to content in the real plugin? Name the service/class,
   the interface the element calls, and where the compendium's `md-dse` files come from on
   disk in a real vault. What does the element render today in the harness when that lookup
   has nothing (and does `mountFromParams` count it as a failed shot)?
2. **Injection seam.** What is the smallest, cleanest seam to give `visual-harness/entry.ts`
   a fixture compendium — a stub implementing the same interface, fed from a few real
   `md-dse` files bundled at build time (esbuild loader? `md.d.ts` suggests `.md` imports
   already exist)? Where should the fixture files live (e.g. `visual-harness/fixtures/...`
   or the existing fixture dir), and where do the real `md-dse` files come from (the
   generated `data/` repo in the worktree, `en/books/<book>/md-dse/` or similar — check what
   exists; the worktree's `data/` may be a scratch dir, so also check the main checkout's
   `/home/scott/code/steelCompendium/workspace/data/` read-only)? The ledger says the seam
   should be reusable later by SC-469 (a resolver that can be told to return
   web/not-installed) — say how.
3. **Which families.** List every display family that supports by-SCC / hybrid mode. Which
   of them have existing inline-mode fixtures in the harness (so a by-SCC twin is a direct
   comparison)? Recommend the set for this ticket: at least the rule card (SC-272's eyebrow
   reads the group from the `scc:` code — confirm where), plus any others that are cheap.
4. **Captures and freeze.** How are captures registered (fixture md under which dir, entries
   in `shoot.mjs`, docs-manifest, parity pairs, e2e coverage pairs)? Which registries must a
   new fixture id be added to so jest/parity/coverage gates stay green (e.g. tests that
   enumerate fixtures and require a parity pair or a declared deferral)? What does a
   widening look like now (one `--steel-print.png` line per new capture id)? SC-349 is
   concurrently changing `shoot.mjs` capture sizing — identify which `shoot.mjs` lines a new
   capture would touch and whether that collides with SC-349's area (read `git -C <dse> log
   origin/sc349* --oneline` if such a branch exists on origin; otherwise skip).
5. **Risks.** Anything that would make the new shots nondeterministic (async lookup timing,
   fonts, images) or would move an existing frozen PNG.

## Output

Write the report to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-r0-survey-report.md`.
It must open with a ≤10-line executive summary, then a concrete implementation plan (files
to add/change, in order, with the exact registries to update and the expected gate-number
deltas: jest suites/tests, shots PNG count, parity pairs, freeze lines). Keep the whole
report under ~250 lines.

## Rules

- If the report-file write is blocked by your harness, return the report inline.
- Read-only round: no edits, no commits, no `npm run shots`/parity (those write into the
  worktree). Cheap `node`/`npx tsx` probes that write only to your private scratch folder are
  fine.
- Scratch: use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r0-<your agentId or a random suffix>/`
  with uniquely named files. Never a generic name like `gate.sh`. Create files with the
  Write tool, not heredocs.
- Never `cd` inside a compound command. Use `git -C <abs path>` for every git command. Run
  node via devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements -- <cmd>`
  (devbox's sh wrapper eats `$?`; redirect output to a file in your scratch folder and read it).
- No glob `rm`, no `pkill`/`killall` by pattern.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared state: read only,
  never write there except your report file in the ledger dir.
- Redirect long-running output to a file rather than streaming it.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever send a message anyway, its first word must be `SC-362:`.

## Return contract

Final text: raw facts, no prose — STATUS, the report path, the 10-line summary, and paths of
any probe artifacts.
