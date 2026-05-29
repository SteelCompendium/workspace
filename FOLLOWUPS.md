# Workspace Follow-Ups

Lightweight tracking for tasks identified during other work that weren't tackled in the original scope. These are intentionally deferred — captured here so they don't get lost.

Add new entries at the top. Remove entries when done (commit message can reference them).

## Entry format

Each entry should include:

- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description of the change
- **Why:** the motivation / what value it adds
- **Context:** background, file paths, gotchas, anything that would save the next person 10 minutes of grepping
- **Effort:** rough sizing — XS (<1 h), S (1–4 h), M (1 day), L (multi-day)

---

### Sync or retire `annotate_heroes.py` (diverged from canonical source)

- **Identified:** 2026-05-29, truncated-link fix
- **What:** `steel-etl/annotate_heroes.py` is documented as the generator of `input/heroes/Draw Steel Heroes.md`, but the `.md` is now hand-maintained — ~4,055 cross-reference links and 170+ annotations added this year live only in the `.md`. Re-running the script would clobber all of it.
- **Why:** Prevent accidental data loss. Either retire the script (declare the `.md` canonical) or update it to emit current annotations/links so it can regenerate safely.
- **Context:** Not wired into any build step (only referenced in `CLAUDE.md`/`README.md`). `.md` and `.py` last touched together in commit `b8ad669`. Decision this session (per plan `docs/superpowers/plans/2026-05-29-truncated-link-fix.md`): edit `.md` directly, leave `.py` stale.
- **Effort:** XS to retire with a doc note; M for a full re-sync

### Bring `gen_linking_reference.py` in sync or retire it

- **Identified:** 2026-05-29, truncated-link fix (doc sweep)
- **What:** `steel-etl/scripts/gen_linking_reference.py` emits only 9 of the 16 linkable types and cannot reproduce the committed `docs/linking-reference.md` (which has skill subgroups, disambiguation notes, and the new Projects/Gods sections). The reference file is currently hand-curated.
- **Why:** Restore regenerability so the reference table stays in sync with `classification.json`. Until then it must be hand-edited.
- **Context:** `INCLUDED_TYPES` is missing culture, skill, condition, movement, negotiation, project, god; also lacks skill-group splitting and per-type notes. `docs/linking-reference.md` header now warns against regenerating over it (would lose ~130 terms + notes).
- **Effort:** S

### Deeper modeling of gods and downtime projects

- **Identified:** 2026-05-29, truncated-link fix
- **What:** The new `project`/`god` parsers (`internal/content/project.go`, `god.go`) are minimal (name/type/body only). Several god groupings were left unannotated — "Heroes of the Elves/Dwarves/Orcs/Hakaan", "Saints of Hell", "Evil Gods", "Lords of Law and Chaos", "Heralds of the Space Gods" — some of which may contain individual saints/deities worth their own codes.
- **Why:** Completeness of deity/project content if surfaced on the site; richer structured output (e.g. project goal/prerequisites, god domain/associated ancestry). Also: ancestry purchased traits carry a "(N Point)" cost that is currently only in heading text, not structured metadata.
- **Context:** 9 individual gods + 16 projects annotated this session; groupings adjudicated as containers and skipped. Parsers produce flat `god/<id>` / `project/<id>` codes.
- **Effort:** S–M

### Regenerate legacy conformance baselines

- **Identified:** 2026-05-28, SCC link audit
- **What:** The legacy JSON files in `data/data-rules-json/` don't include the new SCC links added during the link audit. The conformance test in `internal/output/conformance_test.go` now strips SCC links before comparing, which is correct but means the test no longer validates that link text is preserved exactly.
- **Why:** When the legacy baselines are regenerated (or the legacy format is retired), the `stripSCCLinks` workaround in the conformance test can be removed and exact matching restored.
- **Context:** `steel-etl/internal/output/conformance_test.go` — `assertEffectFieldMatch` uses `stripSCCLinks()` to normalize before comparison. Legacy baselines are in `data/data-rules-json/`.
- **Effort:** XS — regenerate baselines with current pipeline output, then revert the strip function
