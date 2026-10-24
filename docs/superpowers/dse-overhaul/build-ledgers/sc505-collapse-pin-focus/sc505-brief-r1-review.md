# SC-505 r1 independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/decisions.md` — read it first (spec + every ruling, including the FOCUS RULE).
- The implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r1-impl-report.md`. Treat its claims as claims to verify, not facts.
- Implementer brief (what was asked): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-brief-r1-impl.md` — sections 2-4 apply to you as well (scope fence, gates, command footguns).
- Precedents: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc495-stepper-focus-ledger.md` and `.../sc498-stamina-bar-keyboard-ledger.md` (their review findings show the kinds of defect this family has).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus` (plugin at `.../draw-steel-elements`, branch `sc505-collapse-pin-focus`), head **37da2f2** on base `a993a60` (or newer, as the implementer reports); superproject head **248b3be**. Do NOT commit to this branch. For mutation probes use a throwaway `git worktree add` at an absolute path under your private scratch folder (or `git stash`-free temporary edits you revert by `git -C <path> checkout -- <file>` on the exact files), and confirm the branch is unchanged at the end.
- **You never call the tracker (Linear).** The main checkout's dse dirt (Scott's live vault) is expected; ignore it.

## 2. Task — execute and probe, do not just read

1. Re-run the full dse-verify battery on the head and compare with the implementer's numbers. Base numbers at `a993a60` (supersede the implementer brief's b624eef numbers): jest 5958 / 1 skipped; lifecycle 36/36 (37/37 with G-S39); e2e 114/114, 0 failed, 0 known-bug, coverage 79/79 (higher by the branch's tests/pairs); shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.
2. Prove the tests are not vacuous: revert the fix (keep the tests) and show the new jest and e2e tests go red; run at least 4 targeted mutations (e.g. drop `focusVisible`, drop the keyboard-only guard, focus a detached pre-redraw node, skip the Pin path) and record which layer catches each.
3. Real-Obsidian probes (e2e driver or lifecycle harness), recording `document.activeElement` and `:focus-visible`:
   - keyboard Collapse / Expand / Pin on the stamina bar in Reading view and Live Preview, and on the sidebar pin copy;
   - pointer Collapse / Expand / Pin (base behaviour must be unchanged; no ring painted; no focus moved into anything that a wheel or soft keyboard could act on);
   - Collapse then an external note edit / a second pane's write while collapsed: focus not stolen later by a stale deferred focus call;
   - two stamina bars in one note: focus lands in the block that was activated, never the twin;
   - every other element the survey says is covered by the shared fix: one keyboard Collapse/Expand each;
   - Tab order of the block before vs after is unchanged.
4. Check scope fence (SC-501 harness files, stepper, FormModal, SC-502 untouched) and the CHANGELOG bullet's accuracy.
5. Check the survey table against the code yourself — did it miss an element with a chrome Collapse/Pin?

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r1-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND-READY / APPROVE_WITH_FIXES / REJECT, counts by severity, your measured gate numbers). Then findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) each with file:line, a failure scenario, and a prescribed fix; the mutation table; the probe results; every gate's summary line.

If the report-file write is blocked by your harness, return the report inline.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS, verdict, severity counts, measured gate numbers, shas — no prose, plus the absolute path of every evidence artifact (report, logs, screenshots). Your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-review-<your agent id or 4 random chars>/`.

You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its first word must be `SC-505:`.

## 5. Known items (already ruled — see the ledger)

- Keyboard Unpin from sidebar losing focus is filed as SC-511 — out of scope; do not report it as a finding.
- Notice-only Pin (unregistered type) leaving the request armed up to 3 s, and an e2e README note about the hidden Live Preview copy, will be folded into the fix round. DO probe the armed-request case in real Obsidian and say whether it can actually steal focus (and from where), so the fix round targets the real failure.
- Pin writes the note and the block rebuilds/adopts/re-inserts up to 3 times in ~200 ms: probe that focus lands in the FINAL live copy and that no later deferred claim moves focus after the user has Tabbed elsewhere.
