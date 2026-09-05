# SC-191 review 1 — independent review of slices 1–2 (model, serialization, board, outcome band, freeze package)

You are an `orchestration:reviewer` worker. You did NOT write this code and you did NOT
write the spec — review both against each other and against the ledger. Your final text goes
to the SC-191 ticket-owner (an agent), not a human: raw facts, no prose. **You never call the
tracker (Linear).** You cannot message the ticket-owner; if you need input, end your turn with
`STATUS: NEEDS_CONTEXT` and the question at the top of your report. If you ever do send a
message anyway, its FIRST WORD must be `SC-191:`.

## 1. Context loading (in order)

1. Ledger (Scott's rulings, verbatim; struck-through = superseded):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. The spec the code claims to implement: `sc191-impl-spec.md` (same dir) — §A, §B, §C, §D,
   §E, §F, §G, §I slices 1–2.
3. The implementers' reports: `sc191-slice1-report.md`, `sc191-slice2-report.md`. Read the
   executive summaries; treat every claim in them as a claim to verify, not a fact.
4. Worktree (verify `pwd`; write nothing under `/home/scott/code/steelCompendium/workspace/`):
   `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
   Branch `sc191-montage-overhaul` @ `b2f696e`, based on `origin/develop` `69eb5f7`.
   The review diff is `git diff 69eb5f7..b2f696e -- src test visual-harness docs`
   (exclude `visual-harness/sc191/` — design mocks, not shipped code).
5. Approved look: the round-6/round-5 PNGs in the ledger dir (`sc191-r6-pip-open-dark.png`,
   `sc191-r5-tracks-mid-dark.png`, `sc191-r5-tracks-done-light.png`, `sc191-r6-card-light.png`,
   `sc191-r6-card-grey-dark.png`). The shipped element's new harness captures live in
   `visual-harness/shots/` after `npm run shots`.
6. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   Repo conventions: the clone's `CLAUDE.md`, `docs/writing-blocks.md`.

## 2. Task — execute and probe, do not just read

Findings by severity (HIGH / MEDIUM / LOW / INFO) with `file:line`, a failure scenario for
each, and the prescribed fix. A finding with no reproduction or no concrete line is INFO.

Must-cover checklist:

**Model + serialization (slice 1).**
- Round-trip: parse → serialize → parse is identity for (a) an old-shape block exactly as in
  the pre-slice `example.yaml` shape, (b) a new-shape block with every optional field set,
  (c) a block with `entries` for a hero who is not in `participants`, (d) unicode/multiline
  note text, (e) `_dse_anchor` present. Actually run these through the real model code, not
  by reading the tests.
- Spec §B.5 key order and omit-when-default: write a probe that serializes a minimal block
  and diff the output against §B.5 literally.
- Tallies (§B.3 "stored, never recomputed"): find every place a tally could be derived vs
  read; confirm no double-counting path when `entries` and `successes/failures` disagree;
  say what the code does in that case and whether §B says so.
- Are the new tests capable of failing? Pick three assertions and break the code under them
  (temporarily, revert after) to prove each goes red.

**Persistence (§C).** The element writes back into the user's note via the framework
(`src/framework/pipeline.ts`, `src/framework/sidebar/anchor.ts`). Confirm the slice-2 views
only write through that path. Run the integrity probes that are already possible at this
stage in the jest/DOM harness (content above/below survives a write; two montage blocks in
one note don't cross-talk; a hand-edited YAML value survives a re-trigger; an old-shape
block upgraded on write loses nothing). Report each as PASS / FAIL / NOT-YET-POSSIBLE with
the reason.

**Board + outcome band (slice 2).**
- `montageOutcome` 0/0 "pending" band: the slice-1 report says it was a known bug left for
  slice 2. Confirm slice 2 fixed it and that a fresh block (0 successes, 0 failures) renders
  the `pending` band, not a false "Total Failure"/"Total Success".
- Equal-width tracks (ledger 2026-08-29): with `success_limit: 5, failure_limit: 3`, measure
  both tracks in the harness — same pixel width, failure cells wider. Cite the measurement.
- Limits: at `successes == success_limit` and at `failures == failure_limit`, the band
  states the outcome; one short of each, the at-a-glance copy says so ("1 success from…").
  Probe both boundaries and `rounds` exhaustion.
- No add-a-hero ROW; the `+` is in the Heroes header cell; no "+" ghost lane left of Tally;
  no crests; no bright-white element (ledger 2026-08-26/28/29). Check the rendered DOM and
  the CSS, dark and light.
- Read-only: with `data-dse-readonly` stamped, every new control is disabled/badged per the
  framework's shared pattern — nothing looks live and silently drops.
- CSS: every color is a token from the worktree superproject's
  `docs/superpowers/dse-overhaul/D3-token-map.md` (compare with the main checkout copy if the
  worktree pin is stale); dark, light AND print rules exist; the steel scoping rule in
  `dse-verify` is respected; no rule reaches into another element's class list except where
  spec §D says reuse.
- Compare the five new captures against the approved PNGs above; list every visible
  difference and whether the spec §A/§D/§E sanctions it. Name colors in prose — Scott is
  colorblind; hue must never be the only channel for a state (check the success/failure
  seals carry shape, not just green/red).

**Freeze package (§F).** Re-run `npm run shots` twice and `check-freeze.sh` yourself.
Expected: exactly the 2 montage print lines mismatch, 0 others; `rebaseline.txt` in the
ledger dir contains exactly those 2 lines with hashes matching your run; the before/after
crops exist and show the intended change. Any other moved frozen line is HIGH.

**Battery.** Run the whole `dse-verify` battery in order (output to files, read the files):
expected tsc/lint clean; jest 3559 passed / 1 skipped (the slice-2 report's number — verify it); shots
498 PNGs 0 FAIL byte-identical ×2; freeze 210/210 minus exactly the 2 montage lines;
parity 0 GAPs / 0 undeclared / 16 declared.

## 3. Bounds

- Do not fix anything. Temporary breakage to prove a test can fail is allowed only if
  reverted; `git status --short` must show no tracked changes when you finish.
- Do not review the mocks under `visual-harness/sc191/`.
- Do not re-open design decisions the ledger has settled; a finding that contradicts a
  ledger ruling is INFO at most, and must cite the ruling.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-review1-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY-FOR-SLICE / FIX-ROUND with the
HIGH+MEDIUM count), then findings by severity, then the checklist results, then measured
battery numbers, then the paths of every artifact (probe scripts, captures, logs). Put probe
scripts and logs under a per-run unique dir in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`.
If the report-file write is blocked by your harness, return the report inline.

## 5. Footguns

- Go/Node/Python NOT on PATH — `devbox run -- bash -c 'cd <clone> && <cmd>'`; devbox's `sh`
  eats `$?`/`$PIPESTATUS`; never pipe a gate; read the tools' own summary lines.
- Redirect long output to a file; never background a gate and wait for a notification.
- Never key a wait-loop on a scratch filename/contents (shared across sessions/branches).
- Never edit `.superpowers/sdd/freeze-baseline.sha256`. ⛔ Never tag/release dse.
- Stale superproject pin: if `token-coverage.test.ts` reds on a token nobody touched, diff
  the worktree's `D3-token-map.md` against the main checkout's before believing it.

## 6. Return contract

Final text: `STATUS: DONE | NEEDS_CONTEXT`, verdict, HIGH/MEDIUM/LOW/INFO counts, report
path, the executive summary verbatim, the freeze result (which lines moved), measured
battery numbers, integrity-probe results, artifact paths, `git status --short` (must be
empty of tracked changes). No prose beyond that.
