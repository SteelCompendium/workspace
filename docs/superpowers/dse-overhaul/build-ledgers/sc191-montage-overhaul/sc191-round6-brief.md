# SC-191 round 6 brief — flip the tier strip to Power Roll orientation; consequence/reward marks

You are a fresh worker; prior rounds' agents are gone. Round 5 built the tier cheat-sheet
strip and Scott has now ruled on it. Everything you need is in files.

**You never call the tracker (Linear)** — not to read history, not to post. Your final text
goes to the ticket-owner.

## Context to load, in order

1. **The decisions ledger** — every Scott ruling, verbatim; read the WHOLE file. The
   2026-08-29 (19:46) entry is your round:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. **The round-5 report** (executive summary first) — what the current mocks are and why:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round5-report.md`
3. The round-5 brief (constraints and footguns — all still binding):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round5-brief.md`
4. The mocks themselves: `draw-steel-elements/visual-harness/sc191/` (mock5 files,
   `round5.css`, `shoot-sc191-r5.mjs`) in YOUR worktree (below).

## Worktree — verify `pwd` before ANY write

`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/` — the plugin repo is
`draw-steel-elements/` inside it, branch `sc191-montage-overhaul`, tip `6991108`
(round-5 commit, based on origin/develop @ `1619396`). NEVER write into
`/home/scott/code/steelCompendium/workspace/` except the report/screenshots into
`.superpowers/sdd/sc191-montage-overhaul/` as specified below.

### First step: rebase, and refresh gate numbers

origin/develop moved since round 5: SC-195 landed, tip is now `778a341` (no
freeze-baseline change). In YOUR worktree's draw-steel-elements:

```
git fetch origin develop && git rebase origin/develop
```

Then `npm ci` if the rebase touched `package.json`. Read command shapes and current
expected numbers from
`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
Expected right now: shots 474 PNGs 0 FAIL (twice, byte-identical); freeze 210/210;
parity 0 GAPs / 0 undeclared / 16 DECLARED; tsc/lint clean; jest ALL GREEN — round 5
measured 3394 passed / 1 skipped on develop @ `1619396`; SC-195 may have added tests, so
the gate is "all green", and report the counts you measure. Record the post-rebase sha.

## Scott's round-5 ruling, verbatim (from the ledger)

> "We are getting closer!
>
> * The `handle` design is great, lets go with that
> * I think its worth flipping the "test tiers" table so that tiers are on the rows and
>   difficulty is on the columns.  That way it matches the Power Roll UI elements.  Maybe we
>   can even bring in the colored gradient background of the Power Roll tier element into the
>   table?
> * Each cell in the "test tiers" table should additionally reflect "with consequence" and
>   "with reward".  Not sure the best way to handle this.  Immediate thought for "success
>   with reward" was to use the double-check icon.  Not sure if there is an equivalent for
>   "success with consequence" and "failure with consequence".  Maybe going with an approach
>   of having a picture-in-picture (pip) approach by adding a small icon in the bottom corner
>   could work.  What ideas do you have?
> *"

## The tasks

1. **`handle` is the decided toggle.** Retire the `chip` variant from the mocks (delete its
   mock states/CSS — the mock set should now show one design, not alternatives).
2. **Flip the tier strip's table**: tiers on ROWS (≤11 · 12–16 · 17+, top-to-bottom in the
   same order the Power Roll element lists tiers), difficulties on COLUMNS
   (Easy · Medium · Hard). Study the real Power Roll UI first —
   `src/framework/kit/powerRollPanel.ts` and the `.dse-pr__*` rules in `styles-source.css`
   (~line 11790: `.dse-pr__badge--t1/--t2/--t3/--crit` with `--dse-tier-low/mid/high/crit`
   backgrounds; also the parity note ~line 7124 about the site's tier-row background
   GRADIENT and ~7207 `--t:` tier-row rules). The strip's rows should visibly rhyme with
   that element: explore bringing the Power Roll tier-row colored gradient background into
   the strip's rows, exactly as Scott floated. Colorblind rule (binding, Scott's standing
   order): the tier gradient may REINFORCE row identity but never carry meaning alone —
   row labels (the roll bands) stay in text, outcome stays in glyphs. If a full-gradient
   row fights the seal glyphs' legibility, show a restrained variant (e.g. gradient edge
   band or tinted row) alongside the full one and argue.
3. **Every strip cell reflects "with consequence" / "with reward".** Use the real book
   outcomes (the round-4 research and foot-panel table have them — re-derive from the mock
   content, do NOT invent). Scott's thoughts, respond to them directly: double-check icon
   for "success with reward"; he knows no equivalent for "success with consequence" /
   "failure with consequence"; he floated a picture-in-picture (pip) small icon in the
   bottom corner of the cell. Deliver **2–3 distinct treatments as mocks** plus ONE
   recommendation with stated reasoning. Requirements: shape/mark carries the distinction
   (never color alone); it must survive the 300px narrow stack; it must stay legible at
   the strip's small cell size; and it must not reintroduce bright-white elements. Ideas
   worth exploring beyond the pip: the double-check for reward with a matching
   "check + small hook/asterisk-like consequence mark", a corner-notch/dog-ear (the note
   mark precedent from round 4 — but beware collision of meaning with "this cell has a
   note"), or a small suffix glyph after the seal. Whatever you pick, define the full
   4-glyph vocabulary consistently: success, success with reward, success with
   consequence, failure, failure with consequence (and nat 19–20 if it appears in the
   strip's flipped form).
4. **Consistency sweep**: the foot panel's full four-row book table and the sheet's tier
   hint still describe the same tiers. Decide whether the foot-panel table flips to the
   same orientation for one grammar (the ticket-owner's lean: yes, it should match —
   if you disagree, show why). The legend text anywhere that describes strip glyphs must
   be updated to the new vocabulary. Keep the round-5 dedup behavior intact (pinned strip
   stands down the foot panel's "Each test" block).

Settled — do NOT rework: `merged` outcome band with equal-width tracks; `Log an action…`
naming everywhere; the "+" lane stays gone; ink seals, centre spacing, crest-less hero
cells, "+" add-hero in the Heroes header cell, note mark top-right, foot panel collapsed
by default, strip pinned-once-opened.

## Gates

Full battery per `dse-verify` SKILL.md (command shapes AND current numbers — see First
step above). Mocks live outside the manifest so shipped code should be untouched; run the
battery anyway. Foreground only, output redirected to files. If freeze moves beyond what
the skill documents, STOP and report the delta — never edit the shared baseline.

## Deliverables

- Round-6 commit on the branch (`SC-191 round 6 — …`). Do NOT push.
- Screenshots as `sc191-r6-*.png` in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`:
  the flipped strip open (dark + light) for EACH consequence/reward treatment variant ·
  the recommended variant at 300px narrow · gradient vs restrained-gradient row styling
  if you mock both · a Power Roll element crop for side-by-side rhyme comparison · the
  foot panel table (flipped or not, per your call) · a greyscale proof of the recommended
  strip · a labelled "before" (the round-5 `handle` open state).
- Report at
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round6-report.md`,
  opening with a ≤10-line executive summary: what changed, your recommended treatment and
  its argument, the gradient call, the foot-panel-flip call, post-rebase sha, final commit
  sha, measured gate numbers vs expected, and the path of every artifact.

## Footguns (all bit prior agents)

- Devbox: nothing is on the system PATH; `devbox run --` ignores your `cd` — wrap:
  `devbox run -- bash -c 'cd <repo> && <cmd>'`. Its `sh` eats `$?`/`$PIPESTATUS`; piping a
  gate eats failures — use wrapper script files or redirect to files.
- Never background a gate or park on a Monitor — a job you start does not wake you. Read
  the job's own log after foreground completion.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other
  branches will match.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot SendMessage the ticket-owner; `to: 'main'` reaches the dispatcher, not the
  owner. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in
  your report. If you ever send a message anyway, its FIRST WORD must be `SC-191:`.
- Redirect long-running output to a file rather than streaming it — the 600s stream
  watchdog kills silent agents.

## Return contract

Final text = raw facts for the ticket-owner: verdict, post-rebase sha, final sha, measured
gate numbers, your recommended consequence/reward treatment in one line, the gradient and
foot-panel-flip calls in one line each, and the filesystem path of every artifact. No
prose narrative.
