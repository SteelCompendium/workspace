# SC-272 round 1 — independent review brief

You are the independent reviewer for Linear ticket SC-272. Your final text goes to the
ticket-owner (an agent), not a human. You did not author this code.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/decisions.md` (ticket quoted verbatim).
- Implementer's brief: `.../sc272-rule-eyebrow/sc272-brief-r1-impl.md`; report: `.../sc272-rule-eyebrow/sc272-r1-impl-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc272-rule-eyebrow`, DSE clone
  `draw-steel-elements`, branch `sc272-rule-eyebrow`, head `c296c24`, base `6c4f6aa`.
  Review `git diff 6c4f6aa..HEAD`. Do not commit to the branch; probes go in scratch files you
  revert (`git diff` empty when you finish) or under the ledger dir.
- Workers never call the tracker (Linear).

## 2. Task — execute and probe, not just read

1. Does the eyebrow now show the rule group from `scc:` (e.g. `rule.combat` → `Combat`) and
   does it match the site's humanization in `steel-etl/internal/site/cards.go` ~580-610?
   Check against the REAL corpus: run the adapter over every rule file the plugin can read
   (the 153 corpus rules) and tabulate the eyebrow each yields. Any `Rule` fallback, empty
   string, odd casing, or mismatch with the site tile label is a finding.
2. Fallback correctness: no scc, malformed scc, bare `rule` segment, explicit frontmatter
   `type: rule.x`, scc from a different family on a `type: rule` note, other generic families
   (must be unchanged). SC-120's duplicate-title suppression must still work.
3. Blast radius: does the change alter `GenericNote.type` for anything else that consumes it
   (grep every reader: layouts, filters, search, parity, other adapters)? Could a non-rule note
   now get a different eyebrow or class?
4. Tests: are they non-vacuous? Revert the source change (keep tests) and confirm the named
   tests fail; restore.
5. Re-run the battery per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (tsc, lint, jest, shots, freeze vs the 260-line shared baseline, parity last) and confirm the
   implementer's numbers. If frozen bytes moved, verify `rebaseline.txt` is exactly the moved
   set and deterministic.
6. Look at the before/after evidence images in `.../sc272-rule-eyebrow/evidence/` and say whether
   they show what they claim.

## 3. Footguns

- **Kill processes only by PID, and only a PID whose command line contains
  `/worktrees/sc272-rule-eyebrow/`.** Never `pkill`/`killall` by pattern (SC-338 incident —
  concurrent sessions run identical commands).
- Devbox: `devbox run -- bash -c 'cd /abs && cmd'`; its wrapper eats `$?`; never pipe a gate into
  `tail`; redirect long output to per-run unique files and read the tool's own summary.
- Run gates in the FOREGROUND. Never wait on a background job. Never key a wait-loop on a
  scratch filename or its contents.
- Never `rm -rf` `.superpowers/` or anything outside `.superpowers/sdd/sc272-rule-eyebrow/`.
  Never edit `freeze-baseline.sha256`.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` and a question if blocked.
  Any message you send anyway starts with `SC-272:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/sc272-r1-review.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_FIXES / REJECT,
finding counts by severity, battery numbers).

## 5. Return contract

Raw facts: verdict, findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure
scenario, prescribed fix; the corpus eyebrow tabulation summary (distinct eyebrows and counts);
battery numbers; absolute paths of every artifact.

## 6. Specific owner questions (answer each explicitly)

- The implementer mirrored steel-etl `typeTitles` plural overrides so `rule.monster` → "Monsters"
  and `rule.treasure` → "Treasures". Verify against `steel-etl` what the SITE's rule tile actually
  prints for a rule in the `monster` / `treasure` group (does the rule tile path go through
  `typeTitles` at all, or is that map only for type landing pages?). If the site prints
  "Monster" (singular) on the rule tile, the plural is a finding.
- The implementer says the browser shots harness cannot render by-SCC cards. Confirm, and say how
  the evidence screenshots were produced and whether they reflect the real plugin render.
