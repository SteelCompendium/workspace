**The captain's "+N bonus to Stamina" now lands on the squad pool exactly per your ruling, and the branch is land-ready. One thing worth your eye, non-blocking: the captain badge now carries the bonus in words — "CAPTAIN +4 STA" — see the two screenshots below (dark and light). If the look is fine, nothing else is needed from you; flag anything and I'll run a fix round.**

{{IMG:sc195-fixture-dark.png}}

{{IMG:sc195-fixture-light.png}}

What the screenshots show: a Hobgoblin squad (With Captain: +4 bonus to Stamina, 9-Stamina minions, 6 in the squad). Each minion cell reads **65/78 (13)** — max 78 = (9+4)×6, per-minion ladder step 13, one death consumed. The captain's header badge reads "CAPTAIN +4 STA" — the word carries the meaning, the crown icon is secondary, no color-only signaling anywhere.

Behavior, as ruled and verified end-to-end (your worked numbers: 5×5 goblins +2 → 35/35 → two die → 21/35 → captain down at 3 alive → 15/29 → new captain promoted → 21/35):

- Captain down or relieved: current and max both drop by N × living minions; damage taken stays real. Promote (or a down captain healed back) adds it back symmetrically — promote-then-relieve is a no-op.
- Minion deaths never shrink the max; the pool modal now also uses original squad size (this fixes the pre-existing row-vs-modal disagreement).
- N comes from the referenced statblock's With Captain line (exact "+N bonus to Stamina" shape; anything else — "Edge on strikes" etc. — is silently ignored), or an explicit `with_captain_stamina:` YAML key, which wins.
- **Existing saved encounters are not retroactively changed on upgrade** — deliberate, so we never double-count a pool you already hand-adjusted. The bonus starts applying at the next captain event (promote/relieve/down). Say the word if you'd rather have auto-backfill.
- Deleting a captain straight out of the YAML un-winds the bonus once, cleanly; "Reset Encounter State" fully clears the new state.

---

Mechanics, below the ask:

- Review pipeline: implementation (commits d3ad4ea, b0beb40) → independent review (caught 2 HIGH: stale readouts on pre-upgrade encounters; reset leaving new state behind — plus 1 MEDIUM: bonus stranded if the captain is deleted via YAML) → fix round (778a341) → scoped re-review: **LAND-READY**, all findings re-probed fixed.
- Gates, final (re-run by the reviewer): tsc/lint clean · jest 3491 passed / 1 skipped · shots 478, 0 FAIL · **freeze 210/210 — zero frozen bytes moved, no rebaseline needed** · parity 0 GAPs / 0 undeclared / 16 declared.
- One-line behavior note from review: a captain with zero instances or undefined Stamina now counts as alive (not down) for the badge — edge case, rationale in the review report.
- Deferred to Backlog, both linked here: SC-291 (persisted pool max goes stale if you hand-edit squad `amount:` mid-encounter; reset recovers) and SC-292 (pre-existing: a squad mixing a statblock-ref minion with a `captain_of` captain fails to parse).
- Ledger + full reports: `.superpowers/sdd/sc195-captain-minion-pool/` (research, implementation, review + re-review, fix round).
- Branch `sc195-captain-minion-pool` @ dse `778a341` (base 1619396, current origin/develop). Landing proceeds via the dispatcher; no release/tag is part of this (BRAT/beta and releases remain your call).
