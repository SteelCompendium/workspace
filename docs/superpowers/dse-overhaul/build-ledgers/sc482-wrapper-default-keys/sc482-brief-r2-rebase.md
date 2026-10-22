# SC-482 r2 brief — (fix findings, if any, then) rebase onto 772c3cd + full battery

## 1. Context

- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md` (r1 review rulings and the 772c3cd ruling are at the bottom).
- Worktree / branches / rules: as in your r1 brief (`sc482-brief-r1-impl.md`) — same private scratch dir rules, same devbox script-file shape for exit codes, one gate per Bash call, `git -C` everywhere, no glob `rm`, no pkill by pattern, never `--headed`/`DISPLAY=:1`, foreground gates with output to files, no tags/releases/pushes, never call the tracker. OFF LIMITS unchanged: `src/authoring/FormModal.ts`, `src/elements/initiative/`, `src/elements/hero/`, `src/framework/host/`.
- Reviewer findings to fix this round (verbatim from `sc482-r1-review-report.md`, ruled in the ledger): SEE SECTION 2 — if it says "none", skip straight to the rebase.

## 2. Fix findings

Do these BEFORE the rebase, red test first, one commit per finding. Rulings verbatim from the ledger:

> - LOW-1 (empty source whose values return to defaults is written as `{}`): FOLD. When the filtered DTO has no keys, serialize writes an empty body (`''`) — the block returns to the user's original shape. Test it (montage End round -> Back on an empty source; encounter empty source render).
> - LOW-2 (no test for encounter `party:`-only source omitting `monsters: []`): FOLD. Add the case: source `party: {hero_count: 4, hero_level: 3}`, render only, expect no `monsters`. Confirm the `['party']` mutant at `encounter/model.ts:121` goes red.

Reviewer's text for LOW-1 (from `sc482-r1-review-report.md`): `src/elements/shared/undeclaredDefaults.ts:66-71` plus the serializers at `montage/model.ts:206`, `project/model.ts:73`, `encounter/model.ts:134`. "A block with an empty source whose values return to their parse-time defaults is written as `{}`. Example: empty `ds-montage`, End round, then Back. On bc4a0c5 the same steps wrote the full default block." Prescribed fix: "return `''` when the filtered DTO has no keys, and add a test." Apply it wherever a serializer can hit that case (check counter, party, negotiation, stamina-bar too), and verify the host writes an empty body cleanly (fence open + close lines, nothing between, content around the fence untouched) — through the real write path in jest. A plugin-constructed model (no record) must still serialize whole.

INFO-1 (adopted view drops a plugin-written key returned to default) is ruled DROP — do not change it.

## 3. Rebase

1. Commit everything. `git -C /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements fetch origin`; confirm origin/develop is `8d075db` (was 772c3cd at drafting) (SC-457: shared `fenceLanguage` rule in `src/framework/host/blockPrefix.ts`; lifecycle G-S14 in `visual-harness/obsidian-lifecycle.mjs`). Rebase your branch onto it. Likely conflict: your comment edit in `visual-harness/obsidian-lifecycle.mjs` — keep both sides' intent. List every hand-resolved conflict (file:line, what you kept) in the report.
2. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys fetch origin` and rebase the worktree branch onto origin/main; a CHANGELOG `## Unreleased` conflict is resolved by keeping both bullets (no markers left).
3. `npm ci` only if `package.json`/`package-lock.json` changed in the rebase.

## 4. Gates — full `dse-verify` battery on the rebased head (evidence of record)

Expected at 8d075db + your branch (SUPERSEDED numbers below — see ledger bottom for 8d075db baselines: jest 5552 base, 31/31, 89/93, 580 + text-scale lines, 280/280, 0/0/24): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5536 + 56 (your r1 tests) + any r2 tests passed / 1 skipped / 235 of 236 suites** (compare after shots) · lifecycle **31/31** (own `DSE_LIFECYCLE_PORT`, pick a free one, e.g. 9343) · e2e **`OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **580**, 0 FAIL · freeze **`freeze OK (280/280 …)`** — any delta is STOP-and-report · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 5. Report + return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/sc482-r2-rebase-report.md`, opening with a ≤10-line executive summary (final plugin sha + base, superproject sha + base, conflicts y/n, gate numbers, e2e run id). If the write is blocked, return it inline.

Final text to the ticket-owner: raw facts — STATUS, shas, gate numbers, hand-resolved conflicts, paths of the report and every gate log. You cannot `SendMessage` me; for input end with STATUS: NEEDS_CONTEXT. Any message you do send starts with `SC-482:`.
