# SC-652 r2 — independent adversarial review brief

You review another worker's implementation of SC-652. You did not write it. **Execute and probe, do not just
read.** You never call the tracker (Linear) — not to read, not to post. You never push. You do not fix code in
this round (report only) unless this brief is later amended.

## 1. Context loading

- Ledger (current rulings, verbatim — the spec you review against):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc652-wrapper-keys-kept/decisions.md`
- The implementer's brief and report (read the report's executive summary first, body as needed):
  `.../sc652-wrapper-keys-kept/sc652-r1-brief-implementer.md`, `.../sc652-wrapper-keys-kept/sc652-r1-impl-report.md`
- Footguns: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 and section 4 of the
  implementer brief — all apply to you (no rm in /tmp or scratchpad, no pkill by pattern, `git -C <abs path>`,
  devbox `-c <abs dir> -- bash <script file>`, lifecycle `--only=` with an equals sign, poll long runs by pid).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (lines 1-250 and the
  CURRENT paragraph of "Current expected numbers").

Worktree: `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept/draw-steel-elements`, branch
`sc652-wrapper-keys-kept`, base dse `develop` `fcc7278e`, head `be843ebd`. Review the diff `fcc7278e..be843ebd`.
If you need to change files to probe, do it in a throwaway copy (`git worktree add` into your private scratch
folder) or revert before you finish — leave the branch exactly at `be843ebd` with a clean tree.
Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r2-review/`.

## 2. What to attack

1. **Ruling coverage.** For every bullet of the 2026-11-15 scope ruling, show by a runtime probe (jest or real
   Obsidian) that the value survives a write: `prefs:` unknown-only, typo, attr-less, `perBlock: false`, gated
   (switch on AND off), mixed applied+unknown in original order, non-map `prefs:` (scalar, list, empty), non-boolean
   `collapsed:` / `collapsible:` / `collapse_default:`, the `peelLeadingCollapseKeys` rescue path.
2. **Every write path:** in-block interaction, outside-edit refresh, block edit form Save (FormModal), any other
   caller of `extractPrefOverrides` / `extractCollapseKeys` / `withReservedKeys` the implementer may have missed
   (grep yourself).
3. **Behaviour unchanged:** kept values still warn and are still not applied; `collapsed: yes` collapses exactly as
   an absent `collapsed:`; blocks with no reserved keys are byte-identical after a write (no wrapper installed).
4. **Duplication / SC-514:** a second `prefs:` or `collapsed:` line on any element, especially ds-hero
   (`serializeStateSplice`) and `collapseKeysOwnedByModel` elements (`ds-stamina`, `ds-skills`) where
   `collapsible:` / `collapse_default:` stay in the model. Repeated writes must be idempotent.
5. **Integrity:** content above/below survives; two same-kind blocks do not cross-talk; a hand edit to a kept line
   then another write keeps the new value; deleting the kept line by hand then writing does not resurrect it.
6. **Hostile values:** `prefs: {constructor: x, __proto__: y, toString: z}`, very long values, nested maps in
   `prefs:`, a `prefs:` key that collides with a real descriptor but with a wrong-type value.
7. **Test quality:** are the new tests non-vacuous (would they fail on `fcc7278e`)? Check at least three by
   running them against the base. Are e2e titles free of bracketed ticket ids and are the new scenario ids unique?
8. **Scope creep / SC-644:** nothing changes how collapse state is resolved or how settings reach open blocks.

Re-run the battery yourself at `be843ebd`: tsc (incl. `tsc -p e2e`), lint, jest, lifecycle (seven parts), e2e.
Shots / freeze / parity only if `styles.css` differs from a clean `fcc7278e` build. Compare with the implementer's
reported numbers and the baseline (jest 13406 passed / 2 skipped fresh + new tests; lifecycle 64/64;
e2e `613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` + new cases; shots 592, freeze 280/280,
parity 0/0/24). Known flakes: G-S91 (real unless "host too slow" after two re-runs), G-S115 (g) (SC-633, re-run part
7 once), INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657); restore `demo-vault/.obsidian/appearance.json` before
blaming G-S97 (SC-622).

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc652-wrapper-keys-kept/sc652-r2-review-report.md`.
Open with a ≤10-line executive summary: verdict (LAND / FIX), counts by severity, your measured gate numbers.
Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, a failure scenario (input
block + action + observed output), and a prescribed fix. List every probe you ran with its result.
If the report-file write is blocked, return the report inline.

You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you send a
message anyway, its first word must be `SC-652:`. Never key a wait-loop on a scratch filename or its contents;
redirect long output to files.

## 4. Return contract

Final text goes to the ticket-owner, not a human: verdict, finding ids with severity and one line each, measured
gate numbers, and the absolute path of every artifact (report, logs, probe files). No prose.

## 5. Owner's specific suspicions (probe each; in addition to section 2)

- r1 changed `PrefPassthrough` to hold the author's whole `prefs:` value **by reference**. Can anything mutate
  that object between read and write (applyPrefOverrides, a model, a second render of the same parsed data, the
  yaml parse cache)? Probe for a written value that differs from what the note had.
- r1's `withPrefOverrides` (and the existing `withCollapseKeys`) **skip re-emit when the body already declares a
  top-level `prefs:` / `collapsed:`**. How is "top-level" detected? Try to fool it: a block scalar (`description: |`)
  whose content has a line starting `prefs:` or `collapsed:`, a nested map key `prefs:` indented under another key,
  a list item `- prefs: x`, a comment `# prefs:`. Any of these that suppresses the re-emit is data loss.
- r1 claims the guard also fixes SC-514 (ds-hero writes `prefs:` twice). Verify on ds-hero with an applied
  override AND with an unknown-only map, with repeated writes; also check the ds-hero spliced text keeps a
  hand-edited `prefs:` value rather than a stale one.
- r1 changed `SidebarPanel` to rebuild the reserved-key wrapper on an outside-edit refresh. Probe: open in sidebar,
  edit `prefs:` / `collapsed:` in the note, then write from the sidebar — the note must carry the NEW values, once.
- Out of scope, do not report as findings: SC-665 (the open sidebar card does not re-apply prefs/collapse on an
  outside edit), SC-599 formatting (`prefs:` empty becoming `prefs: null`, flow map becoming block map).
