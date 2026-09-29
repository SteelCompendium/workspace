# SC-232 round 8a — rebase + print-neutral card-head slot fixes (W1, W8, W5, fixtures)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, numbers) and
the path of every artifact. Workers never call the tracker (Linear) — not to read, not to post.
You may later be resumed for round 8b (the print-moving items); keep your notes in files.

## Context loading

1. Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`
   — read ALL of it. Binding sections: "Scott ruling 1" (verbatim), "Owner rulings, round 7",
   "Dispatcher session update". Scott's words, verbatim: "I think there is more going on here.
   Some cards are missing some of the header chips (or whatever they are called). For example,
   in the screenshots you posted, the "Determination" trait is missing the lower-left "human"
   part. There needs to be more work done to fix these up".
2. Slot survey `.../sc232-cardname-scale/sc232-r7-slot-survey-report.md`: exec summary, §1
   (Trait, Ability card, Class feature, Kit signature, Featureblock head), §2 (b)/(a), §3 rows
   W1, W5, W8. Its scripts/data in `.../r7-survey/` (`site-slots.json`, `plugin-slots.json`,
   `slotDump.test.ts`, the 22 real md-dse entity files in `r7-survey/md-dse/`) — reuse them.
3. Prior implementation: `sc232-r4-fix-report.md` exec summary (Option A name sizes, the
   `.dse-head` container, parity pairs, `scrollToPrint`).
4. Worktree `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, dse branch
   `sc232-cardname-scale` at `bd2087e`. **`pwd`-check before every write.** Workspace-level
   files (CHANGELOG.md, DESIGN.md, docs/) live in YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/…` — never under
   `/home/scott/code/steelCompendium/workspace/`.
5. Gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## Step 0 — rebase (commit)

`git -C <wt>/draw-steel-elements fetch origin` then rebase onto `origin/develop` (expected
`5a20d5f` or later: SC-231 keyword chips, SC-284 `.dse-head` narrow stacking, SC-338 optchip,
SC-317 external-link icon landed). SC-284 landed its own `.dse-head { container-type:
inline-size; container-name: dse-head; }`. **Drop SC-232's duplicate container declaration**
and keep SC-232's Steel screen-only `@container dse-head (max-width: 480px)` name fallback,
now reading SC-284's container. Resolve conflicts carefully in `styles-source.css` (SC-284's
cardHead block), `entry.ts`, `selector-map.json`/README (parity declared counts: develop has 16
declared; SC-232 adds its 10 `ink` rows → expect 26). If `package.json`'s obsidian version
changed, `npm ci`. After the rebase run tsc + the reviewer's wrap check
(`.../r3-evidence/scripts/` or `r4-evidence` wrap logs' script) to confirm the narrow fallback
still holds against SC-284's layout. Report conflicts and how each was resolved.

## Step 1 — W1 left-deck provenance (commit; tests)

Per survey §3 W1: the feature cardHead call in `renderFeature.ts` (survey cites `:289-297`,
develop `:393`) builds `leftDeck` from `metadata`, porting the site's rules
(`traitSource` / `abilityOrigin` / `titleCase` — find them in steel-etl, e.g.
`trait_cards.go:563-578`, and match their output exactly): trait → ancestry / class / kit
(+ subclass); ability → class (+ subclass); class feature likewise. **Metadata-driven only this
round** — do NOT add the parent kit name to the inline kit signature (that moves print; it is
round 8b). Add a Steel, screen-scoped line style for `.dse-head__deck--left` on feature heads
matching the site's computed style (measure it, survey data has it). Confirm how the left-deck
renders in print: the survey says 0 frozen fixtures carry metadata so 0 frozen lines move —
verify with freeze.
Fixtures (survey a1–a3): add a metadata-bearing trait fixture ("Determination", human, from
`r7-survey/md-dse/`) and a metadata-bearing ability fixture ("Mark", tactician L1) to
`visual-harness/entry.ts` — additions only (new capture ids = freeze widening candidates, no
sanction needed; list the new ids). Jest: unit tests for the provenance builder, one per branch
of the site rule, plus a DOM test that the Determination head renders "Human" in the
left-deck.

## Step 2 — W8 "Feature" noun (commit; test)

`kindNounOf` (`renderFeature.ts`, survey `:204-206`): "Feature" when `feature_type` is neither
ability nor trait (site's `featureNoun`). Test it.

## Step 3 — W5 featureblock kind-noun (commit; test)

`featureblock/view.ts` (survey `:85-95`): left-eyebrow = `fbKindNoun(kind)` ported from the
site, falling back to today's `featureblock_type` when `kind` is absent (so frozen fixtures
don't move). Summoner origin in the left-deck is optional — only if trivially data-driven.

## Step 4 — gates (full battery, dse-verify order, at your final head)

State the BASE numbers at the new `origin/develop` head (run jest/shots there via a detached
scratch checkout or read them honestly) and yours. Expected shapes: tsc clean; lint clean;
jest all green (`rm -f main.js styles.css` first; load-sensitive suites: check `/proc/loadavg`
and re-run a timeout-shaped red); `obsidian-lifecycle` **19/19** on your own
`DSE_LIFECYCLE_PORT`; `npm run shots` 0 FAIL (count = base + your new fixture captures);
`check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots` → **260/260** — this round is
print-neutral by design, so ANY FAILED line is a leak to fix, not to rebaseline; `npm run
parity` 0 GAPs / 0 undeclared / **26 DECLARED** / exit 0.

## Step 5 — evidence (no commit)

Into `.../sc232-cardname-scale/r8-evidence/`: `sc232-slots-neutral.png` — rows: Determination
trait, Mark ability, a class feature ("Growing Ferocity"), a featureblock head; columns:
**Before (develop)** | **This branch** | **Site**, every tile at 1 image px = 1 CSS px (crop
the head only; pad, never rescale). Text labels on rows and columns; no color-coding (Scott is
colorblind). Verify each tile's text by DOM query, not by eye, and list it in the report.

## Rules

- **Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/`** (`pgrep -af "worktrees/sc232-cardname-scale/"`, check
  every line). Never `pkill`/`killall` by pattern — other sessions run the same gates.
- Commit after each coherent step. Never push, never tag, never touch dse `main`, never edit
  `.superpowers/sdd/freeze-baseline.sha256`, never `rm -rf` the shared `.superpowers/` dir,
  never touch the shared main checkout's working tree. Never run `steel-etl site` with
  `pipeline.yaml`.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`, gate command LAST, output redirected to
  a per-run unique log; read the tool's own summary line, never an echoed `$?`. Foreground only
  — never background a job and wait for a notification (it never arrives). Redirect long output
  (600s silent-agent watchdog). Never key a wait loop on a scratch filename or its contents.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: 'main'` reaches the dispatcher). If you need
  input, end with `STATUS: NEEDS_CONTEXT` + the question. If you message anyway, the first word
  is `SC-232:`.

## Report

`.../sc232-cardname-scale/sc232-r8a-report.md`, opening with a **≤10-line executive summary**
(head sha, base sha, per-step status, new capture ids, gate numbers vs base). Then detail, then
`Drive-by fixes:` and `Follow-ups:`. Final text: verdict, shas, gate numbers, artifact paths.
