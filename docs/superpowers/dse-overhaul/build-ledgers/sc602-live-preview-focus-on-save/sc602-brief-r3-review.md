# SC-602 r3 — independent adversarial review (reviewer identity R2)

## 0. Context loading (read first)
1. Ledger (binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/decisions.md
2. Common gates/footguns brief (binding): .../sc602-live-preview-focus-on-save/sc602-brief-common-gates-footguns.md
3. The spec the code must meet: the ledger's "Spec" and "Owner rulings". The design it was built from:
   .../sc602-r1-design-report.md (§3, §6, §7). Do NOT anchor on the design's own claims — re-measure.
4. The implementer's report (executive summary first): .../sc602-r2-impl-report.md
5. Worktree /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save, dse branch `sc602-live-preview-focus-on-save`
   at HEAD `2848e7eb` (base `93e8e48c`); superproject branch at `6b0f9a7e` (on workspace origin/main `eccfe90e`). Review `git -C <dse> diff 93e8e48c..HEAD` and the
   superproject CHANGELOG commit. Leave the branch exactly as you found it (porcelain clean except the unstaged dse pointer in the
   superproject); verify at the end.
6. Workers never call the tracker (Linear).

## 1. Task — execute and probe, not just read
- Re-run the full battery yourself (common brief): tsc, lint, jest (fresh), lifecycle six parts, e2e; check styles.css sha256 vs a
  clean base build. Report every number.
- Vacuity: revert only the product files to base in a scratch copy and confirm the new jest + LP e2e focus tests go red and the
  guards stay green; restore and `cmp`-verify.
- Real-Obsidian adversarial probes in Live Preview (scratch specs outside the tree, no bracketed ticket ids in titles):
  - keyboard + / Advance round / one more element → focus on the successor control after settle + 1 s;
  - mouse press → focus NOT pulled in; focus moved away (Tab out, click into note text) before the write → not stolen back;
  - rapid repeated Enter on counter + (several writes inside and across the 400 ms debounce) → focus stays, no wrong-block claim;
  - twins / two counters / two panes on one note → no cross-talk; one pane in LP, the other in Reading view;
  - external edit (another pane typing / vault.modify) shortly after an own save → no focus claim;
  - counter at max (disabled successor) → root fallback, no lingering request;
  - switching notes or closing the leaf between the press and the write → no stray focus in another note;
  - typing in the editor text right after pressing a button (focus leaves via keyboard into CM) → not stolen back;
  - Reading view: unchanged (SC-588 INIT-F and SC-609 INIT-F13/F14 green).
- Code review: one-shot semantics, TTL/leak of armed requests, listener/extension lifetime across plugin disable/enable (G-S6e area),
  error paths in `beforeRelease`, memory (WeakSet / registry entries), popout window document-relativity, and whether any file of
  SC-607 (`ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `obsidian-lifecycle.mjs`) or SC-580 (`ConditionsModal.ts`) was
  touched (must not be).
- CHANGELOG wording (dse + workspace): user-facing, true, names what is not covered (SC-605, SC-384), no overclaim.

## 2. Report
.../sc602-live-preview-focus-on-save/sc602-r3-review-report.md — opens with a <=10-line executive summary: verdict
(LAND-READY | FIX), counts by severity, every gate number, vacuity counts. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line,
failure scenario, and prescribed fix. Logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r3-reviewer/ .

## 3. Return contract
Final text goes to the ticket-owner, not a human: raw facts, no prose, plus the absolute path of every evidence artifact.
`Follow-ups:` listed separately.
