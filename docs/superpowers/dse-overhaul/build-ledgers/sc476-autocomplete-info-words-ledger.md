# SC-476 decisions ledger — in-fence autocomplete with extra words on the opening line

Ticket: SC-476 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words` (branch
`sc476-autocomplete-info-words` in every submodule). dse base: `develop` @ `e31e1a0`.
Superproject base: `fa40cac`.

## Ticket text (verbatim, 2026-10-21)
"Found during SC-457. The authoring autocomplete reads a block's type as the whole text after the
backticks, while the rest of DSE reads only the first word. So in a block opened with
```` ```ds-counter extra ```` the suggester looks for a type called `ds-counter extra`, finds none,
and offers no completions.

Fix: use the shared first-word rule `fenceLanguage` (added to `src/framework/host/blockPrefix.ts` by
SC-457) in `scanFenceState`.

Where: `draw-steel-elements/src/authoring/fenceScan.ts` `scanFenceState`
(`rest.trim().toLowerCase()`)."

## Dispatcher instruction (verbatim, 2026-10-21)
"SC-457 (in flight, unlanded) adds `fenceLanguage()` in src/framework/host/blockPrefix.ts for the
trimmed-first-token rule; this ticket is the authoring/fenceScan.ts `scanFenceState` side — reuse
SC-457's helper only after it lands (ask the dispatcher), otherwise keep the change local and rebase
later."

## Owner rulings (2026-10-21)
- O1. SC-457 is unlanded at dispatch (land-ready, not on origin/develop `e31e1a0`). Round 1 keeps the
  change LOCAL to `fenceScan.ts`: the same rule as SC-457's helper — first whitespace-delimited token
  of the trimmed info string (`/^\S*/.exec(rest.trim())[0]`) — then lowercased as today. A comment
  names SC-457's `fenceLanguage` as the shared rule this mirrors. Once SC-457 lands, a rebase round
  swaps the local expression for an import of `fenceLanguage` (mechanical).
- O2. Keep the existing `.toLowerCase()` (behaviour preserved). Implementer REPORTS (does not fix)
  whether the hosts compare languages case-sensitively — a mismatch is a follow-up, not scope.
- O3. Tests: jest pins in the existing authoring tests — `scanFenceState` returns `ds-counter` for
  ```` ```ds-counter extra ````, ```` ``` ds-counter ````, ```` ```ds-counter\textra ````, tilde fences,
  and a schema-suggest-level test that a block with extra info words gets completions.
- O4. CHANGELOG: bullet in `draw-steel-elements/CHANGELOG.md` and the worktree superproject's
  `CHANGELOG.md` `## Unreleased` (SC-457 precedent: superproject branch = ONE CHANGELOG-only commit;
  never edit `.claude/skills/dse-verify/SKILL.md` — dispatcher bookkeeping).
- Reviewer-ask Scott? No — defect with one obvious intent, no taste content.

## Round 1 (implementer, plugin head 37d625c on e31e1a0; superproject c3eca47) — rulings (owner, 2026-10-21)
- Gates as reported: tsc/lint clean · jest 5394/1 skipped (231/232) · lifecycle 28/28 · e2e 88/92, 0 failed, 4 known-bug, 64/64 · shots 572 · freeze 276/276 · parity 0/0/24.
- Follow-up 1 (swap to SC-457 `fenceLanguage` once it lands) → already O1; done in a rebase round.
- Follow-up 2 (authoring lowercases, hosts compare case-sensitively) → HOLD for reviewer probe: reviewer measures whether Obsidian dispatches ```` ```DS-Counter ```` to the ds-counter processor; rule after.
- Follow-up 3 (`npm ci` run in worktree) → DROP: gitignored, no repo change.
- Drive-by (FenceState.lang doc comment) → accepted.

## Review r1 (reviewer, APPROVE-WITH-FIXES at 37d625c) — rulings (owner, 2026-10-21)
- Reviewer O2 measurement (real Obsidian 1.14.4): ```` ```DS-Counter ```` / ```` ```DS-Stamina-Bar ```` do NOT render as DSE blocks in Reading view or Live Preview, yet the suggester offers completions inside them.
- MEDIUM-1 CHANGELOG example ```` ```ds-counter extra ```` never gets suggestions (ds-counter has no schema) → FOLD: use ```` ```ds-stamina-bar extra ```` in both bullets.
- LOW-1 `.toLowerCase()` in `fenceScan.ts` offers completions for blocks that never render → FOLD. ~~O2 "Keep the existing `.toLowerCase()`"~~ superseded by this ruling: drop `.toLowerCase()`; the language is exactly SC-457's `fenceLanguage` rule (case kept), flip the mixed-case test at `schemaSuggest.test.ts:203` to expect NO completions, update the doc comment.
- LOW-2 ```` ```ds-stamina-bar `x` ```` now gets completions though it is not a fence (CommonMark: a backtick fence's info string may not contain a backtick) → FOLD: in `scanFenceState`, a backtick-marker line whose info string contains a backtick is not an opener (literal content). Tilde fences unaffected. Pin it in jest.
- INFO-1 (Reading view vs Live Preview disagree on NBSP / `{x}` separators) → DROP: no single rule matches both modes; not caused by this fix.
- INFO-2 tests use only synthetic `ds-x` → FOLD: add one test on the real `ds-stamina-bar` definition with ```` ```ds-stamina-bar extra ````.
- INFO-3 CR-terminated opener → DROP: Obsidian's editor never returns one.

## Re-review r2 (reviewer, APPROVE at aaa88b7; superproject 27092fe) — owner, 2026-10-21
- Gates: tsc/lint clean · jest 5399/1 skipped (231/232) · lifecycle 28/28 · e2e 88/92, 0 failed, 4 known-bug, 64/64 · shots/freeze/parity not re-run (no path from src/authoring/ to the harness; r1 measured 572 / 276/276 / 0-0-24).
- LAND-READY. SC-457 still unlanded at origin/develop e31e1a0. Swap ruling: whichever of SC-457 / SC-476 lands SECOND replaces the local `/^\S*/.exec(rest.trim())![0]` in `fenceScan.ts` with an import of `fenceLanguage` (identical body; reviewer-verified). Relayed to dispatcher.
- Superproject branch needs a rebase onto origin/main (gained 2d4ece3 handoff doc) at landing — dispatcher's land-stack.
