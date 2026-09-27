# SC-317 independent review brief — plugin-drawn external-link icon

## 0. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/sc317-decisions.md`
- Implementer brief (what was asked): `.../sc317-extlink-icon/sc317-brief-impl.md`
- Implementer report (what they claim): `.../sc317-extlink-icon/sc317-r1-impl-report.md`
  (read its executive summary and survey table; verify, don't trust).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`, plugin at
  `draw-steel-elements/`, branch `sc317-extlink-icon`. Diff to review:
  `git -C .../draw-steel-elements diff origin/develop...HEAD` (base `619c4bd`), plus the
  superproject's DESIGN.md / CHANGELOG.md edits (`git -C /home/scott/code/steelCompendium/worktrees/sc317-extlink-icon diff`).
- Battery reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **You never call the tracker (Linear).** You do not edit source; you review. You may write
  throwaway probes in the ledger dir or the scratchpad, never commit to the branch.

## 1. What to check — execute and probe, not just read

1. **Correctness of the icon**: probe computed style in the harness (steel-dark, steel-light,
   and with vs. without Obsidian's host copy injected — `shoot.mjs` already has the
   injection machinery): the `::after` exists on every `.external-link` in plugin roots and
   modals, takes the anchor's `color` (and its hover colour), is not underlined, is not part
   of selected/copied text, and Obsidian's own `background-image`/`padding-inline-end`
   remain neutralised (no double icon in a real vault). Check a link that wraps across two
   lines and a link at the end of a narrow container (orphaned icon?).
2. **Print**: no icon in `data-dse-print="on"` and in real `@media print` (realprint). Re-run
   `npm run shots` then `check-freeze.sh` yourself; expected `freeze OK (260/260 …)`.
3. **Scope**: is the survey complete? Grep `src/` for every anchor creation (`createEl('a'`,
   `createEl("a"`, `document.createElement('a')`, `innerHTML` with `<a`, `href` assignments)
   and check the implementer's per-item call. Button/chip/chrome anchors must NOT get the
   icon; prose links leaving the vault must. Internal links (`.internal-link`, SCC links
   resolved inside the vault — `rewriteSccAnchors` removes `external-link` in that case)
   must NOT get the icon.
4. **Host-leak sweep**: does the extended sweep genuinely sample the pseudo-element and can
   it fail? Prove it with a live-hole probe: temporarily inject a host-shaped rule that
   reaches `.external-link::after` (in a throwaway copy of the host CSS or by editing the
   sweep's host copy locally, then revert byte-clean — `git diff` empty afterwards) and show
   the sweep goes red.
5. **Tests**: are the new jest tests non-vacuous? Break the rule locally (e.g. drop
   `currentColor` or move it out of the print-excluded scope), run the tests, confirm red,
   revert byte-clean.
6. **Overlap**: does the diff touch areas owned by unlanded branches — `.dse-feature__kw*`
   (SC-231), ds-feature example (SC-236), ds-skills header (SC-255), `.dse-optchip`
   (SC-338), by-SCC rule eyebrow (SC-272), modal text scale (SC-230), card header narrow
   form (SC-284)? Report any.
7. **Full battery** at the branch head, in order: tsc, lint, jest (after `rm -f main.js
   styles.css`), lifecycle (own `DSE_LIFECYCLE_PORT`), shots, freeze, parity LAST. Expected:
   tsc/lint clean; jest 4038 + the new tests passed / 1 skipped; lifecycle 19/19; shots 0
   FAIL; freeze 260/260; parity 0 GAPs / 0 undeclared / 16 DECLARED. Command shape:
   `devbox run -- bash -c 'cd /abs/draw-steel-elements && <gate>' > <per-run log> 2>&1`,
   gate LAST, no pipes; read the tool's own summary line.

## 2. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/sc317-r1-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_NITS /
CHANGES_REQUIRED, counts by severity, battery numbers). Then findings by severity
(CRITICAL/HIGH/MED/LOW/INFO), each with file:line, failure scenario, prescribed fix. Also
list the absolute path of every probe log / screenshot you produced. Look at the
implementer's crops in `.../sc317-extlink-icon/crops/` and state in one line each whether
they show what their filename claims.

## 3. Rules and footguns

- **Kill processes only by PID, and only a PID whose command line contains
  `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/`.** Never `pkill`/`killall`
  by pattern — other sessions run the same gates.
- Never edit the shared `freeze-baseline.sha256` or `check-freeze.sh`; never `rm -rf` under
  `.superpowers/` except your own `sc317-extlink-icon/` subpaths.
- Every probe edit to the branch is reverted byte-clean before you finish; `git status` must
  show the tree exactly as you found it. Do not commit.
- Run every gate in the FOREGROUND with output redirected to a per-run unique file; never
  background a gate and wait for a notification. Never key a wait on a scratch filename.
- Redirect long output to files — the 600s stream watchdog kills silent agents.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end
  with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts with `SC-317:`.

## 4. Return contract

Final text to the ticket-owner, not a human: verdict, severity counts, battery numbers, the
report path and every artifact path. No prose.

## 5. Added by the owner after round 1 (read the ledger's "Round 1" section)

- Round-1 heads: dse `64e88eb`, superproject docs `01ca911`.
- **Orphan-wrap probe (ledger F2)**: in the harness, put an `.external-link` whose last word
  ends exactly at the container's wrap edge (vary container width in 1px steps across a
  range) and screenshot whether the icon ever sits alone at the start of the next line.
  Compare with Obsidian's own mechanism (background-image + padding-inline-end on the
  anchor, which cannot orphan). Then test whether an airtight form exists that keeps D2
  (currentColor via mask) — e.g. an `display: inline` `::after` whose content is U+2060 WORD
  JOINER, sized by padding, glyph painted by mask-image over its box — and report a concrete,
  measured recommendation (the exact CSS, and whether it renders identically at rest).
  Probe-only: revert byte-clean.
- SC-366 (the ref web-card link colour) is out of scope — do not report it as a finding.
