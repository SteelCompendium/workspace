# SC-594 r2 — implement the click-time card-write rule for hover previews and embeds (implementer)

You are the r2 implementer for ticket SC-594 (draw-steel-elements, "DSE"). Your final text goes to the ticket-owner, not a
human: raw facts (verdict, shas, measured numbers), no prose. **Workers never call the tracker** (Linear) — not to read history,
not to post. This brief is self-contained and replacement-ready.

## 1. Context to load (files, not conversation)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/
- decisions.md — read ALL of it. The "Owner rulings on r1" block is your spec's authority, incl. the OWNER CHANGE (popover memo).
- sc594-r1-design-report.md — the design: §A measurements, §B the rule (items 1-7), "What still refuses", "Test plan".
- sc594-r1-probe-rule.diff.txt — the designer's working probe patch on ce4937ef. Start from it, but it is a PROBE: production code
  needs comments, onload registration, the memo, clean naming.
- sc594-r1-probe-jest.test.ts.txt — probe tests T1-T16 + the 284-cell sweep; port into real tests (names J1-J17 in the plan).
- sc594-r1-probe-lifecycle.mjs.txt — probe lifecycle driving (real hover via gs83Kit, the 17-44 ms scripted-click window).
- sc594-r1-mutate.py.txt + sc594-r1-mutants.log — mutants mA-mM.
- sc594-brief-common-gates-footguns.md — gates with expected numbers and every binding footgun. Read it; it is part of this brief.
Prior art (tracked): /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/
sc584-embed-form-save-refusals/decisions.md (Log) and sc480-twin-save-after-note-change/decisions.md — do not regress either
(G-S73, G-S77, the r7 structural guard for forms).
Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (~330 KB; read in parts): lines 1-218,
"Block edit form Save and embeds (SC-556)" (~335), "Hover preview modals (SC-595)" (~396), "Current expected numbers".
Repo rules: /home/scott/code/steelCompendium/workspace/AGENTS.md and draw-steel-elements/AGENTS.md.

Worktree: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write (branch sc594-hover-heading-card-write in
every submodule). DSE: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write/draw-steel-elements, HEAD
ce4937ef, clean. FIRST: `git -C <dse path> fetch origin` and rebase the branch onto origin/develop (expected e0e49d4d — SC-588
landed: initiative tracker keyboard focus; if develop is past e0e49d4d, rebase onto the newest and report it). Then
`devbox run -c <abs dse path> -- npm ci`. Verify `pwd`-independence: every write by absolute path inside the worktree.

## 2. The task
Ticket (verbatim): "Hover over a link to a heading of a long note (`[[long note#Tracker]]`) whose section holds a counter, and
press + or - in the preview. If an identical counter sits elsewhere in that note, the click is not saved: nothing changes and the
\"changed on disk first\" Notice shows. Nothing changed on disk and the preview only shows one counter, so the click could have been
saved." Agent notes (verbatim): "it must keep SC-480's guarantees (never a write into a twin; G-S73)." … "A fix here must refuse
that shape too." (P14: a block-link hover card write into the twin after an outside edit.)
Governing ruling (Scott, verbatim): "Save nothing with a notice is fine." — refusal is always acceptable; a write into the wrong
block never is. No new user-facing strings; refusals use today's dropped-write Notice.

Implement the r1 rule (design report §B items 1-7) as ruled in decisions.md, with the OWNER CHANGE quoted verbatim:
> Required: bind the link to the popover ONCE, at the first lookup for that popover element (memo `WeakMap<hoverEl, record>`; the
> first card render in a popover happens right after that popover's own event), and reuse the memo for every later lookup in that
> popover (redraws, second +). Measure in real Obsidian when a hover card's host first looks up vs when the popover is created; if a
> lookup can come later than another event on the same hoverParent, say so and propose. Jest J17 (Y event after X's first lookup ->
> X still writes A; Y identical-body heading) red without the memo + a mutant (no memo) that dies.
(If the first lookup happens only at click time in the probe design, move it to the host's mount/pin-taking in the popover, or
whatever earliest point you measure; report which.)
- Register the `hover-link` listener in the plugin's `onload` (registerEvent), plugin-scoped, bounded buffer.
- Forms (`takePin(true)` / `rebasePin`, the r7 guard), non-embedded cards, `pinnedTarget`, `twinned`/`landsOnOtherBlock` for
  non-partial pins: unchanged.
- Code comments cite SC-594 with each rule in one sentence. Mind the conditional await in `replaceSource` (report §B item 5: an
  unconditional await broke SC-340 / SC-544 ordering tests).

Deliverables:
1. Source (`src/framework/host/ReadingModeBlockHost.ts`, the plugin `onload`, helpers as needed).
2. Jest: J1-J17 per the test plan (red on e0e49d4d where marked; keep the red-on-base log), the sweep as `test.each` asserting
   never TWIN / ADDED plus the expected A / refused per cell, the onload registration test; fix the 5 existing hover tests' helper
   (`hoverEl(link)` notes a `hover-link` record; heading hover = heading BODY, lineStart 1) and flip+rename the 1 intended test. No
   bracketed ticket ids in test titles.
3. Mutants mA-mL + the memo mutant: each must turn a test red (mM equivalent, say so). Log as sc594-r2-mutants.log.
4. Lifecycle: new scenario G-S92 (trials (a)-(i) of the plan), in SCENARIOS order after G-S87 and before G-S56 (G-S56 stays LAST),
   run in part 5. One note per trial (5 s card-Notice limit). Must FAIL on an e0e49d4d bundle (keep the log) and pass on yours.
   Part 5's wall time must stay well under 600 s (target <= ~430 s); if it would not, STOP and return NEEDS_CONTEXT with a split.
   Add NO phases to G-S64.
5. CHANGELOG bullets (user-facing, plain words, no over-claim — use the report's "What still refuses" list): dse CHANGELOG.md
   Unreleased in its format, and the superproject worktree CHANGELOG.md under `## Unreleased`
   (/home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write/CHANGELOG.md — NEVER the main checkout's).
   Do not claim "an identical counter elsewhere is never written" for forms or null-pin paths (SC-596).
6. dse-verify proposal: sc594-dse-verify-proposal.md in the ledger dir — replacement text for the SC-556 section's authoring
   footgun (3) (it says SC-594 refuses; after this it lands), a short "Hover card writes (SC-594)" bullet (the hover-link memo, the
   heading-body section shape, the 17-44 ms window and how G-S92 drives it), the CURRENT block with your numbers, part 5's new list
   and wall time. Do NOT edit SKILL.md.

Commits on branch sc594-hover-heading-card-write in the dse worktree (red tests may be their own commit; fix; tests; lifecycle;
docs). Superproject: commit only CHANGELOG.md on the worktree branch (no dse pointer bump). No pushes, no tags, no attribution lines.

Out of scope (cite, do not touch): SC-596 (forms in hovers / null-pin forms), SC-524 (card shows unsaved value after a refusal),
SC-461 (list items / footnotes), SC-598 (modal click guard in hover previews).

## 3. Gates
Full battery per sc594-brief-common-gates-footguns.md (baseline e0e49d4d: jest 7304 passed / 2 skipped fresh + your tests;
lifecycle 57/57 with G-S92; e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`; styles.css vs a clean e0e49d4d build
— if equal, shots/freeze/parity carry). Gate logs: ledger dir, sc594-r2-gate-<name>.log.

## 4. Footguns
All of sc594-brief-common-gates-footguns.md, binding. Private scratch folder (create it):
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc594-r2-impl/
NEVER `rm -rf` a /tmp glob (a worker did this today and wiped other efforts' kept lifecycle FAIL dirs).

## 5. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/sc594-r2-impl-report.md, opening with an
executive summary of at most 10 lines. Sections: rebase (new base sha), the memo measurement (first lookup vs popover creation),
design as built (deviations from §B with reasons), commits (sha + one line), gate numbers (each gate's own summary line + part wall
times), red-on-base evidence, mutants, `Drive-by fixes:` and `Follow-ups:`.

## 6. Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, dse HEAD sha, superproject branch HEAD sha,
`git status --porcelain` for both, each gate's summary line, and the absolute path of every evidence artifact.
