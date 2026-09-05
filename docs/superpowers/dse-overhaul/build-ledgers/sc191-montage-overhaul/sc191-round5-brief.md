# SC-191 round 5 brief — equal-width tracks, tier cheat-sheet, rename Record, remove ghost lane

You are a fresh worker replacing the round-4 agent (its transcript expired). Round 4 built
mock4 on the `merged` composition and Scott has now ruled on it. Everything you need is in
files.

**You never call the tracker (Linear)** — not to read history, not to post. Your final text
goes to the ticket-owner.

## Context to load, in order

1. **The decisions ledger** — every Scott ruling, verbatim; read the WHOLE file, the
   2026-08-29 entry is your round:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. **The round-4 report** — what the current mocks are and why:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round4-report.md`
3. The round-4 brief (design constraints, worktree rules, footguns — all still binding):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round4-brief.md`
4. The mocks themselves: `draw-steel-elements/visual-harness/sc191/{mock4.html,mock4.js,round4.css,shoot-sc191-r4.mjs}`
   in YOUR worktree (below).

## Worktree — verify `pwd` before ANY write

`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/` — the plugin repo is
`draw-steel-elements/` inside it, branch `sc191-montage-overhaul`, tip `617a254`
(round-4 commit). NEVER write into `/home/scott/code/steelCompendium/workspace/` except the
report/screenshots into `.superpowers/sdd/sc191-montage-overhaul/` as specified below.

### First step: rebase, and refresh gate numbers

origin/develop moved since round 4 (SC-190, then SC-120 — tip was `1619396` at dispatch).
In YOUR worktree's draw-steel-elements:

```
git fetch origin develop && git rebase origin/develop
```

Then `npm ci` if the rebase touched `package.json`. SC-120 included a sanctioned 24-line
freeze-baseline change, so round-4's gate numbers are STALE: read the CURRENT expected
numbers from `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
(updated at each landing) and gate against those. Record the post-rebase sha.

## Scott's round-4 ruling, verbatim

> "* the `merged` design looks great.  I want to tweak the two tracks so they are the same horizontal width: even if there are 5 cells in "success" and 3 in "failure", either one reaching max results in the end of the montage so they should be the same width.  That means the cells for failure are going to be wider
> * The collapsed rules guidance looks good.  I have the feeling the "Each test" section will want to be seen all the time by a lot of Directors while the other rule information is a "check it once at the beginning and then close it" situation.  Im debating how I want to handle this.  My leading though is to additionally have a button that will open (expand) a stylized version of the test-outcome-per-difficulty information above the table that isnt super obtuse (like a cheat sheet).  Seems a little clunky, but I really think we need to do something. What do you think?
> * "record" button functionality is fine, although it feels a bit out of place at the bottom… not sure there is a better home for it.  The "record" label on the button is really confusing though.  Lets change that to something else.
> * Some of the screenshots from this round had a "+" column to the left of the "tally" column - what is that, why do we need it, can we remove it?"

## The five tasks — the ticket-owner has already promised these to Scott; they are commitments, not options

1. **Equal-width tracks.** `merged` is the decided outcome band. Both tracks span the SAME
   total horizontal width; when the failure limit is lower, its tiles get wider. The tail
   sentences then start at a common x — align them.
2. **Tier cheat-sheet strip, above the board.** Compact: one row per difficulty
   (Easy / Medium / Hard) × the three roll bands (≤11 · 12–16 · 17+), cells in the board's
   existing seal glyph language (circled green check for success, circled red X for
   failure, a "c" or similar mark for with-consequence tiers — shape must carry the
   meaning; Scott is colorblind; name colors in every caption you write). NOT the full book
   table — the full four-row version (nat 19–20 included) stays in the foot panel. The
   strip is persistent-once-opened (a pin, not a peek). Toggle lives in the board's header
   row (the owner's stated lean — if you find a genuinely better home, show both and
   argue). If the strip is open, consider whether the foot panel's "Each test" block should
   note/collapse to avoid stating the tiers twice at full size — dedup is the standing
   principle of round 4.
3. **Sheet tier hint.** The record/edit sheet's Result field gains a one-line quiet tier
   hint (the sheet is the adjudication moment). It must NOT read as a warning — round 4
   fixed exactly that class of bug (benign hint painted in the warn slot); do not
   reintroduce it.
4. **Rename `Record…`.** Scott: "the 'record' label … is really confusing." The owner
   floated "Log a test…" / "Add a test…" as leading candidates. Pick ONE with stated
   reasoning (the confusion: verb-noun double duty + audio-recording connotation), rename
   the action-bar button, AND reconcile every surface that uses the word — the sheet's
   title ("Record an action"), its primary button ("Record"), and any caption. All surfaces
   must agree on the new verb. Placement stays in the bottom action bar (Scott accepted it).
5. **Remove the "+" ghost lane** — the add-a-round column left of Tally — from the DOM, not
   hidden (a display:none grid item desyncs from the track list). "Add a round" lives in
   the ⋯ overflow menu alone. The owner already told Scott this is happening; if removal
   breaks something structural, report it rather than improvising.

Settled — do NOT rework: ink seals, centre spacing, the note mark in the cell's top-right,
the narrow tier-table side-scroll in the foot panel, the collapsed-by-default foot panel
itself, crest-less hero cells, the "+" add-hero affordance in the Heroes header cell.

## Gates

Full battery per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
(read it for command shapes AND the current expected numbers — do not reuse round-4's).
Mocks live outside the manifest so shipped code should be untouched; run the battery anyway.
Foreground only, output redirected to files. If freeze moves beyond what the skill
documents, STOP and report the delta — never edit the shared baseline.

## Deliverables

- Round-5 commit on the branch (`SC-191 round 5 — …`). Do NOT push.
- Screenshots as `sc191-r5-*.png` in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`:
  equal-width merged band (mid + done, dark + light) · cheat-sheet strip closed, open
  (dark + light), and open at 300px narrow · the renamed button in the action bar · the
  sheet with the tier hint · a greyscale proof of the strip · a labelled "before" (the
  round-4 merged state).
- Report at
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round5-report.md`:
  what changed per task, the rename argument, the cheat-sheet placement argument,
  post-rebase sha, final commit sha, measured gate numbers vs the skill's expected, and
  the path of every artifact.

## Footguns (all bit prior agents; the round-4 brief has the full list — it binds you too)

- Devbox: nothing is on the system PATH; `devbox run --` ignores your `cd` — wrap:
  `devbox run -- bash -c 'cd <repo> && <cmd>'`. Its `sh` eats `$?`/`$PIPESTATUS`; piping a
  gate eats failures — use wrapper script files or redirect to files.
- Never background a gate or park on a Monitor — a job you start does not wake you. Read
  the job's own log after foreground completion.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other
  branches will match.
- If the report-file write is blocked, return the report inline.
- You cannot SendMessage the ticket-owner; `to: 'main'` reaches the dispatcher, not the
  owner. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in
  your report. If you ever send a message anyway, its FIRST WORD must be `SC-191:`.

## Return contract

Final text = raw facts for the ticket-owner: verdict, post-rebase sha, final sha, measured
gate numbers, the rename you chose and its one-line argument, and the filesystem path of
every artifact. No prose narrative.
