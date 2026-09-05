# SC-191 round 7 — implementation SPEC round (read-mostly; you implement nothing)

You are an `orchestration:reviewer` worker. Your final text goes to the SC-191 ticket-owner
(an agent), not a human: raw facts, no prose padding. **You never call the tracker (Linear)
— not to read history, not to post.** You cannot message the ticket-owner; if you need input
mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question at the top of your
report. If you ever do send a message anyway, its FIRST WORD must be `SC-191:`.

## 0. Why this round exists

Six design rounds are done. Scott's final ruling (2026-08-30, verbatim in the ledger):

> "* Power roll tiers look great.  The actual chips (or whatever you call them) for the
>   `12-16`, `17+`, etc are a bit stretched horizontally.  Please make their padding similar
>   to actual power rolls.  I dont need to approve this change - just make it so.
> * I think the triangles are the strongest, but I dont love how basic they are.  Maybe some
>   color?  Maybe a gradient? maybe a border?  Idk, pick a solid option.  i dont really want
>   to go back-and-forth again.  Im ready  to get this ticket finished"

**The design is settled. No more mock rounds.** What remains is turning a ~7,000-line mock
corpus (built up over six rounds with attribute toggles, where later rounds override earlier
ones) into the shipped `ds-montage` element. The shipped element today is ~370 source lines.
A Sonnet implementer cannot be handed the mock corpus and told "ship it" — it would guess.
**Your job is to write the implementation spec that removes the guessing**, and to make the
one visual pick Scott delegated to us (the pip treatment).

## 1. Context loading (do this first, in this order)

1. **Ledger — read it fully, it is the source of truth for every ruling:**
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
   Rulings are quoted verbatim there; struck-through lines are superseded and must NOT be
   implemented. Workers read the ledger INSTEAD of the ticket thread.
2. Prior-round reports (same dir): `sc191-round4-report.md`, `sc191-round5-report.md`,
   `sc191-round6-report.md`. Read each **executive summary** first; dive into sections only
   where the spec needs a fact (mock file layout, toggle names, what each round's CSS owns).
   The 30 round-6 PNGs (`sc191-r6-*.png`) and round-5 PNGs in that dir ARE the approved
   look — view the deciding ones rather than re-shooting.
3. Worktree (verify `pwd` before ANY write; never write under
   `/home/scott/code/steelCompendium/workspace/`):
   `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
   Branch `sc191-montage-overhaul` @ `951d679`, rebased on `origin/develop` `778a341`.
   Run `git fetch origin develop` **inside that clone** and note in your report whether
   `origin/develop` is still `778a341`. Do NOT rebase or commit anything this round.
4. Repo conventions: that clone's `CLAUDE.md`, `docs/writing-blocks.md`,
   `docs/common-element-fields.md`, `docs/gm-trackers.md` (montage user docs live here — confirm),
   `docs/superpowers/sc169-element-menu-panel-spec.md` (the element ⋯ menu pattern).
   Precedent element Scott named: `src/elements/stamina-bar/` (the "specialized like
   ds-stamina" reference).
5. Design tokens: the worktree superproject's
   `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/docs/superpowers/dse-overhaul/D3-token-map.md`
   and `DESIGN.md` at the same superproject root. If the worktree copy looks stale vs the main
   checkout (`grep -c` a recent token in both), read the main-checkout copy but cite it.

## 2. What is "the design" (pin it down — section A of the spec)

The settled design is `visual-harness/sc191/mock6.html` + `mock6.js` + the CSS chain it
loads, at its **default** toggle state as of round 6, with these ledger-fixed winners:

- composition `roster` (round 2), crests `none`, seals `ink`, spacing `centre` (round 3)
- outcome band `merged` (round 4), equal-width success/failure tracks, per-test notes,
  collapsible rules guidance collapsed by default, `+` in the Heroes header cell,
  NO add-a-hero row, NO "+" ghost lane left of Tally
- cheat-sheet toggle `handle` (round 5), button renamed `Log an action…`
- strip flipped to bands-as-rows × difficulty-as-columns, adopting the Power Roll component;
  wash `edge` (not `pr`); crit row kept; rider mark `pip` (round 6)
- round-6 ruling: tier badges must NOT be stretched — match the shipped `.dse-pr__badge`
  padding/width; the pip triangle gets a richer treatment chosen by us (see §4)

Enumerate every toggle/attribute the mock chain reads and its winning value, with the ledger
date that fixed it, so an implementer never has to re-derive it. List explicitly what dies:
every non-winning variant, every `?param` toggle, all of `candidates.css`/round-1 mocks.
Note the round-6 report's `data-treat` collision bug as a warning about the mock's attribute
plumbing.

## 3. The spec — required sections, in order

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-impl-spec.md`
(this is the ONLY deliverable file; ≤ ~500 lines; **opens with a ≤10-line executive
summary**). Sections:

**A. Design freeze** — per §2 above.

**B. Data model / YAML schema.** Today's shape (`src/elements/montage/example.yaml`):
`title, rounds, success_limit, failure_limit, successes, failures, participants[name,
skills_used[]], current_round, _dse_anchor`. Specify the new schema: every field, type,
default, and which UI region reads/writes it — heroes, per-hero-per-round test records
(outcome success/failure/none; reward/consequence rider if the tracker records it — check
the mocks: does the BOARD record riders, or only the cheat-sheet DISPLAY them?; note text),
description, difficulty (if the design has it), the log/sheet entries ("Log an action…"),
current round. **Backward compatibility is mandatory**: an existing user block in the old
shape must still parse, render, and keep its tallies; specify the migration (in-memory
upgrade on read, and what the first write-back produces). Specify serialization: key order,
omit-when-default rules, round-trip stability (parse→serialize→parse is identity).

**C. Persistence and integrity.** Name the framework path the element uses to write into the
user's note today (`src/framework/pipeline.ts`, `src/framework/sidebar/anchor.ts`,
`src/elements/montage/model.ts` — confirm) and what changes. Write the integrity-probe list
the reviewer will run later: content above/below the block survives a write; two montage
blocks in one note don't cross-talk; a hand-edited YAML value survives a re-trigger; a
user-deleted block regenerates cleanly; an old-shape block upgraded on write loses nothing.

**D. Component mapping.** For each mock region (header/title/description; Heroes column with
`+`; round columns; Tally column; the merged outcome band with equal-width tracks; the
outcome footer with notes; the ⋯ menu; the cheat-sheet strip + `handle`; the collapsible
guide/foot panel; the "Log an action…" sheet; per-cell edit + note mark), name the shipped
component or pattern it maps onto — Power Roll `.dse-pr__badge`/`.dse-pr__row` reuse vs a
montage-local alias (decide, and respect the Steel scoping rule from `dse-verify`
SKILL.md), the sc169 menu panel, whatever sheet/modal pattern `stamina-bar`/`negotiation`
already use for editing, any existing disclosure pattern. Where the mock reached directly
into another element's classes, decide reuse vs copy and say why.

**E. CSS migration.** Which mock rules migrate into `src/styles-source.css` (tokens only —
cite `D3-token-map.md` rows; no bright white; dark AND light; print), a line-count estimate,
the block's placement/scoping, and the explicit list of rules that do NOT migrate.
Colorblind rule binds: shape + words carry every state; color only reinforces.

**F. Harness + freeze.** Fixture states to capture (at minimum: empty, mid-montage, total
success, total failure, guide open, strip pinned, sheet open, 300px narrow), capture ids,
the `docs-manifest.mjs` `montage.png` entry. State the freeze consequence plainly: the
baseline (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`,
210 lines) has **2 montage print lines that WILL move by design** → the implementer ships
`.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt` + before/after crops per
`dse-verify` SKILL.md; new capture ids are a widening. **Nobody edits the baseline.**

**G. Tests.** The jest list: model round-trip, old-shape migration, tally/limit logic
including the at-a-glance phrasing ("1 success from Total Success"), equal-width track
sizing, note persistence, menu actions, cheat-sheet/guide toggle state, sheet flows,
keyboard/a11y (every control labelled and reachable). Name the files.

**H. Docs.** Which user docs change (`docs/gm-trackers.md` or wherever montage is
documented; `docs/migrating-to-7.md` if the schema changes; the dse repo's own changelog
convention per its `CLAUDE.md`). Workspace-level files live ONLY at
`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/<file>` — never under
`workspace/`.

**I. Work breakdown.** Ordered implementer slices, each independently landable-green (the
full `dse-verify` battery passes after each), each with acceptance criteria and the gates it
must run. Aim for 2–4 slices. The first slice should be the data model + migration + tests
(no UI), because that is what the integrity probes hang on.

**J. The two round-6 deliverables, specified concretely** — see §4.

**K. Open questions.** ONLY genuine product/data decisions the mocks + ledger cannot answer.
Each with your recommended default so Scott can answer "ok". Target: zero. Everything else
you decide, and you write the decision down.

## 4. The two round-6 items — decide them here, in CSS terms

1. **Badge padding.** Diagnose WHY the `≤11 / 12–16 / 17+ / crit` badges stretch in the
   flipped strip (grid track sizing? `justify-self: stretch`? a mock override on
   `.dse-pr__badge`?). Specify the exact fix so the badge's box matches the shipped Power Roll
   row's badge (cite the shipped rule and its padding/min-width values).
2. **Pip treatment — ONE option, final.** Scott: "Maybe some color? Maybe a gradient? maybe
   a border? Idk, pick a solid option." Specify the triangle's fill, border, and any
   gradient/shadow in token terms for dark and light, for both ▲ reward and ▼ consequence,
   such that: the ▲/▼ shape and the written words still carry the meaning alone (Scott is
   colorblind — name colors in prose, never let hue solo); it reads at the 300px stack; it
   survives greyscale; it does not reintroduce bright white. Give a one-paragraph rationale.
   Recommended direction to evaluate first: fill the triangle with the row's Power Roll edge
   hue (so reward on the 17+ row is green-filled, consequence on the ≤11 row is red-filled),
   1px darker border of the same hue family, no glow. If you find a better option, take it —
   but pick exactly one.

You MAY prototype either item in the mock (`round6.css`) to check it visually, and shoot
with `shoot-sc191-r6.mjs` — but do not commit, and revert the mock afterwards (`git status`
must be clean of tracked changes when you finish; leave nothing staged). If you shoot,
write PNGs to a per-run unique dir under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`
and copy the 1–2 deciding images to the ledger dir as `sc191-r7-pip-<variant>-<scheme>.png`.
Harness command shape: `devbox run -- bash -c 'cd <clone> && npm run harness:build && node visual-harness/sc191/shoot-sc191-r6.mjs <outDir>' > <log> 2>&1`.

## 5. Bounds

- **Read-mostly.** You implement nothing in `src/`. The only tracked-file edits allowed are
  the optional, reverted mock prototype in §4.
- Read fully: `mock6.html`, `mock6.js`, `round6.css`, `round5.css`, the shipped
  `src/elements/montage/*`. Read `round2.css`/`round3.css`/`round4.css` by selector: grep
  for the attribute values mock6 sets and read only the rule blocks that still apply.
  Do not read `candidates.css`, `mock.*`, `mock2.*`–`mock5.*` beyond a quick `head`.
- Keep the spec ≤ ~500 lines. It is a spec, not a survey.

## 6. Gates

None to run this round (nothing changes). Current expected battery numbers on
`origin/develop` `778a341`, for the spec's slice acceptance criteria: jest 3491 passed / 1
skipped / 189 suites; shots 478 PNGs, 0 FAIL, byte-identical across two runs; freeze 210/210
0 mismatches; parity 0 GAPs / 0 undeclared / 16 declared. The gate skill is
`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read its
command shapes and freeze/parity rules so the spec's slices cite them correctly.

## 7. Footguns

- Go/Node/Python are NOT on PATH — `devbox run -- bash -c 'cd <clone> && <cmd>'`; devbox's
  `sh` wrapper eats `$?`/`$PIPESTATUS`; redirect output to a file and read the file.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents; the scratch dir is shared
  across sessions and branches. Use per-run unique paths.
- If the report-file write is blocked by your harness, return the spec inline.
- ⛔ Never create a tag or release on draw-steel-elements. Never edit the freeze baseline.
- The worktree's superproject pin may be stale (footgun: `token-coverage.test.ts` reads
  `D3-token-map.md` by path search) — not relevant this round, but say so in the spec's
  slice briefs.

## 8. Return contract

Final text to the ticket-owner: `STATUS: DONE | NEEDS_CONTEXT`, the spec path, the ≤10-line
executive summary verbatim, whether `origin/develop` is still `778a341`, the pip pick in one
line (colors named), the badge fix in one line, the slice count, the open-question count,
the paths of any PNGs you produced, and `git status --short` of the clone (must show no
tracked changes). No prose beyond that.
