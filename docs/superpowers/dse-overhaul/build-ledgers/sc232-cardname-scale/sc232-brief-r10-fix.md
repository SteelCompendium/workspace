# SC-232 round 10 — fix round for the slot work (review round 9)

Same worktree, branch, rules and return contract as rounds 8a/8b
(`sc232-brief-r8a-slots-neutral.md` "Rules" — re-read them). Workers never call Linear.

Read first: `decisions.md` section **"Owner rulings, round 9"** (your spec; quoted below) and
`sc232-r9-review-report.md` (findings with file:line and prescribed fixes; its probes are in
`r9-evidence/scripts/`, incl. `r9SnapshotFidelity.test.ts` and the site-vs-plugin compare that
produced `r9-evidence/logs/cmp.txt` — re-run them as acceptance). `git fetch origin`; rebase if
`origin/develop` moved from `5a20d5f` and say so. Head at start: `fa9addc`.

Out of scope (filed elsewhere — do NOT implement): summoner provenance lines (SC-373),
dynamic-terrain/fixture featureblock type+role/EV (SC-374), sub-feature crest/eyebrow (SC-367).

## Fixes (verbatim rulings; one commit per bullet or small group)

- "HIGH-1 (usage chip on every statblock ability head; meta 'Type' cell dropped): FIX as
  prescribed — opt-in usage-in-head flag set only by the standalone Feature view and the inline
  kit signature; restore the Type cell for statblock abilities; pin with a test."
- "MEDIUM-1 (pasted snapshot loses statblock `metadata.scc` / featureblock `kind`): FIX as
  prescribed + retainer and malice-featureblock snapshot test cases; fix the `:95` comment."
- "MEDIUM-2 (synced kit's nested signature has no kit name): FIX plugin-side if the kit layout
  can hand its own name to the nested feature render cleanly; if not, correct the comments and
  CHANGELOG, and report back so the owner files a steel-etl ticket. Either way the claims in
  comments/CHANGELOG must be true."
- "LOW-2 usage wording -> FOLD: chip text uses the site's labels ('Triggered Action',
  'Move Action', …) and plain text, never a link." (Port the site's label function; test it.)
- "LOW-3 hidden ability_type when cost present -> FOLD: match the site's behaviour."
- "LOW-4 `kwUsage` help text -> FOLD. LOW-5 CHANGELOG overclaim/process wording -> FOLD."
  (CHANGELOG is the worktree superproject's; user-facing wording only, no "pending sanction".)
- "Empty left-deck span on a keyword-less statblock -> FOLD (don't mount it)."

## Freeze — regenerate

The round-8b `rebaseline.txt` contains HIGH-1's bytes; it is void. After all fixes: two full
shots runs, confirm determinism, then REPLACE `rebaseline.txt` and `rebaseline-map.md` (final
state, same method as 8b, same cross-checks: FAILED set == rebaseline set; every before-hash is
the current shared baseline line; scratch-substituted baseline reads 260/260). State old vs new
line counts and which ids dropped out. Never edit the shared baseline.

## Evidence — refresh in `r8-evidence/` (same rules: 1 image px = 1 CSS px, head crops, text
labels, Site in DARK, DOM-verified text)

- `sc232-slots-print-screen.png`: add a row "Statblock ability (no usage chip)" showing a
  statblock ability head Before | This branch | Site. Use the SAME entity in plugin and site
  columns wherever the harness can render it (the row-1 "Coverage Strike / Apex Predator"
  mismatch should become one entity if a synced Apex Predator can be rendered).
- `sc232-print-before-after.png`: rebuild from the regenerated set.

## Gates at the final head

tsc, lint clean; jest green (state count vs 4170 and why); lifecycle 19/19 (own port); shots 0
FAIL; freeze FAILED set == new rebaseline set; parity 0/0/26 (explain any change).

## Kill rule (restated)

Kill only by PID and only processes whose command line contains
`worktrees/sc232-cardname-scale/`. If a run of yours hangs, you may also kill the direct
children of YOUR OWN wrapper PID after verifying (a) their parent PID is that wrapper and (b)
their `/proc/<pid>/cwd` is inside your worktree. Nothing else, ever; never by pattern.

## Report

`.../sc232-cardname-scale/sc232-r10-fix-report.md`, ≤10-line executive summary first (head
sha, per-finding status, MEDIUM-2 outcome, rebaseline old→new count, gate numbers).
Final text: verdict, shas, numbers, artifact paths. NEEDS_CONTEXT if blocked.
