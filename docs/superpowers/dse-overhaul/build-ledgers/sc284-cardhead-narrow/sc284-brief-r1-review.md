# SC-284 round 1 — independent review brief

You are an independent Opus reviewer. You did not write this code. Your final text goes to the SC-284
ticket-owner, not a human.

## 0. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/decisions.md`
   (ticket spec verbatim; no Scott rulings yet).
2. The implementer's brief: `.../sc284-cardhead-narrow/sc284-brief-r1-impl.md` — it states the intended
   mechanism, footguns to probe, scope fences, evidence and gate expectations.
3. The implementer's report: `.../sc284-cardhead-narrow/sc284-r1-impl-report.md` (read the exec summary, then
   what you need).
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
5. Worktree: `/home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow` (DSE branch
   `sc284-cardhead-narrow`, base `origin/develop` `6c4f6aa`). Review `git -C <dse> diff 6c4f6aa...HEAD`.
   **Do not commit to the branch.** Probe edits are allowed only if reverted (`git stash`/`git checkout`)
   before you finish; state that you verified `git status` is clean at the end.
6. **Never call the tracker.** Never write under `/home/scott/code/steelCompendium/workspace/` except your
   report in the ledger dir.

## 1. What to verify — execute and probe, don't just read

- **Every cardHead consumer** (party, statblock, featureblock, montage, roll, shared/CardLayout, feature,
  negotiation, encounter, project): at ~300px the head stacks (right slots under the left stack, left-aligned,
  crest still spanning column 1, nothing hidden, no one-word-per-line deck, no horizontal overflow); at normal
  note width it is pixel-identical to 6c4f6aa. Measure with a real browser probe (the harness / Playwright
  `getBoundingClientRect`), not by reading CSS.
- **Containment side effects** of whatever `container-type` the branch added: any consumer where the head is
  shrink-to-fit collapses to ~0 width; baseline alignment lost; containing-block changes for abspos
  descendants; nested heads (a head inside a card inside another container) resolving the query against the
  wrong container.
- **Threshold**: what px width actually flips it in the harness and in Obsidian's font setup; is the unit
  choice sound and commented.
- **Print**: the narrow form must never fire at print width; freeze must be `freeze OK (260/260 …)`. Re-run
  `npm run shots` + the freeze check yourself.
- **Parity**: re-run `npm run parity` (last): 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0.
- **Tests**: the new jest test / narrow harness shot actually fail on 6c4f6aa behavior (i.e. they are not
  vacuous) — prove it by reverting the CSS rule locally and re-running just that test/shot, then restore.
- **Scope fences**: diff must not touch `renderFeature.ts`, `.dse-feature__kw*`,
  `.dse-feature__meta-cell--keywords`, `.dse-feature__meta-value`, `.dse-optchip`, ds-skills, the ds-feature
  example, the by-SCC eyebrow, or modal text scale.
- **Evidence**: look at the before/after PNGs in `.../sc284-cardhead-narrow/evidence/` — do they show what the
  report claims, and are they the right branch's output (check mtimes vs the run)?

Run the full battery in order (tsc, lint, jest with `rm -f main.js styles.css` first, obsidian-lifecycle,
shots, freeze, parity last) and report exact numbers.

## 2. Footguns

- **Kill processes only by PID whose command line contains `/worktrees/sc284-cardhead-narrow/`**
  (`pgrep -af "worktrees/sc284-cardhead-narrow/"`, check each line). NEVER `pkill`/`killall` by pattern —
  concurrent sessions run the same gate commands.
- Run gates in the FOREGROUND, output redirected to per-run unique files; never background and wait. Redirect
  long output to a file (600s stream watchdog).
- Wrap: `devbox run -- bash -c 'cd <abs dse path> && <cmd> > <log> 2>&1; echo rc=$? >> <log>'`; never pipe a
  gate into `tail` (devbox eats exit codes).
- Never key a wait-loop on a scratch filename or its contents.
- Never `rm -rf` anything in `.superpowers/` except files you created under `.superpowers/sdd/sc284-cardhead-narrow/`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you
  ever message anyway, the first word must be `SC-284:`.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/sc284-r1-review-report.md`,
opening with a ≤10-line executive summary: verdict (APPROVE / APPROVE_WITH_FIXES / REJECT), counts by severity,
battery numbers, freeze line. Then findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a
failure scenario, and a prescribed fix for each. Final text to the ticket-owner: raw facts plus the paths of
every artifact you produced.

## 4. Round-1 specifics (added by owner after the implementer finished)

- Implementer sha `97aa19a` (commits `7923377` CSS, `3999296` jest, `498e0b5` harness narrow shots, `97aa19a` changelog).
- The implementer reports **freeze moved 6 lines** (3 pairs: `encounter-narrow`, `montage-narrow`,
  `statblock-sticky-narrow`, print twin + realprint), because those frozen captures are pinned at 300px so the
  container query fires in print too. Deliverable: `.../sc284-cardhead-narrow/rebaseline.txt`. Verify: (a) exactly
  those 6 lines move and nothing else, (b) the rebaseline hashes reproduce from YOUR shots run, (c) the "before"
  hashes equal the live baseline, (d) the crops in `evidence/sc284-rebaseline-*` show the intended stacking and
  nothing else changed in those cards. With the rebaseline applied to a TEMP COPY of the baseline (never the
  shared file), the freeze check should read `freeze OK (260/260 …)`.
- The implementer's report claims `container-type: inline-size` applies "inline-size containment only, not
  layout". Check that claim against the current CSS spec and Chromium/Electron behavior (Obsidian's Electron
  version) — if layout/style containment IS applied, probe the consequences it dismissed.
- Montage and negotiation put `.dse-head` in a flex item (`flex: 1 1 auto`); the implementer argues grow still
  fills the row. Probe it at narrow and wide widths, and with a long montage title.
- Owner rulings already made (don't re-raise): implementer follow-up "check-freeze.sh exits 0 on violation" is
  DROPPED (the script `exit 1`s on mismatch; the measurement went through devbox's wrapper, which eats exit codes);
  missing narrow fixtures for roll/party/negotiation/project/feature are DROPPED (no right rail on the first
  four; feature is exercised via nested cards in `statblock-sticky-narrow`).
