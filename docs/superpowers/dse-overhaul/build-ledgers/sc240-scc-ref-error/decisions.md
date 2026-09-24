# SC-240 decisions ledger

Ticket: SC-240 "DSE initiative: SCC-ref failure UX — bogus filename hint + portrait warn noise"
Worktree: /home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error (dse branch `sc240-scc-ref-error`)
DSE tracked branch: `develop` (origin/develop = 46c0c4c at 2026-09-24 kickoff)

## Scott rulings (verbatim, dated)

None on SC-240 as of 2026-09-24 (thread empty). No Scott ruling on SC-134's "row-scoped
degradation" question was found in SC-134's thread either — that remains OPEN and OUT OF SCOPE
here (one bad ref still kills the whole tracker; do not change that).

## Owner rulings (ticket-owner, 2026-09-24 — Scott asleep; reported to him for override)

1. **(a) Error text.** For a `scc:` / `scc.vN:`-shaped statblock ref that fails to resolve
   (hero or creature loop in `src/elements/initiative/resolveRefs.ts`), the thrown message must
   NOT carry the legacy "Are there multiple instances of the '<ref>' file in your vault? If so,
   please specify the full path." hint. It keeps the "Failed to resolve … statblock reference at
   index N (<ref>):" lead-in and SccRefProvider's own message (the "…is not available in this
   vault. Sync the compendium…" text). **Bare-path refs stay byte-identical to the legacy
   oracle** — the existing pinned assertions in `test/unit/model/initiative-resolve-refs.test.ts`
   for bare paths are NOT changed; new SCC-shape assertions are added alongside (deliberate
   contract update, documented in the test header comment).
   Legacy `src/drawSteelAdmonition/EncounterData.ts` is untouched (legacy oracle).
2. **(b) Portrait warn.** Shipping portrait images in md-dse is not an option (the compendium
   carries no creature art). Since SC-162 a missing portrait already renders a themed fallback
   glyph (shield for heroes, skull for enemies), so "no image" is a handled, expected state.
   Ruling: the `console.warn("…no portrait image found…")` in `initiative/view.ts`
   `renderPortrait` fires ONLY when an image WAS specified (non-empty `imgSrcRaw`) and could not
   be resolved. No `image:` key → silent (fallback glyph still renders exactly as today). This
   applies to all rows, not just compendium-sourced ones (absence of an optional field is not a
   warning anywhere). No visual change.
3. No pixels should move. If any shot/freeze byte moves, STOP and report — no rebaseline.

## Review round 1 rulings (ticket-owner, 2026-09-24)

Reviewer verdict on 225b02e: APPROVE, 0 blocker/high/medium, 3 LOW, 5 INFO.
- LOW-1 (isSccShapedRef splits SC-134 doc comment from resolveStatblockRef) — FOLD into fix round.
- LOW-2 (no test pins the `.trim()` in the predicate) — FOLD: add a padded-ref case.
- LOW-3 (warn-still-fires test covers hero only) — FOLD: add enemy image case.
- INFO-1 (whitespace-only `image: "   "` still warns) — FOLD: treat whitespace-only as not specified (`imgSrcRaw?.trim()`), consistent with ruling 2's intent; add a test.
- INFO-2 (broken custom defaultImagePath with no image is silent) — DROP: the shipped default is `Media/token_1.png` (src/model/Settings.ts:28), absent in most vaults, so warning on a failed default would reintroduce exactly the per-creature noise this ticket removes; the fallback glyph is visible either way.
- INFO-3 (untrimmed ref in lead-in, same as legacy) — DROP: legacy-identical, harmless.
- INFO-4 (garbage SCC code says "not available" not "malformed") — DROP: SccRefProvider's text, outside this ticket; not worth a ticket.
- INFO-5 (CHANGELOG under `## 7.0.0 (unreleased…)`) — correct as is.
No Backlog tickets filed from this round.

## Re-review rulings (ticket-owner, 2026-09-24)

Re-review of 3284b5d: APPROVE-WITH-FIXES.
- MEDIUM-1 (`view.ts:1188` `imgSrcRaw?.trim()` throws TypeError for non-string `image` — e.g. unquoted `image: [[Frodo.png]]` parses as nested array — so the fallback glyph never mounts; visible regression vs 225b02e, violates ruling 2 "No visual change") — FIX in fix round 2 with the reviewer's prescribed guard `typeof imgSrcRaw === 'string' ? imgSrcRaw.trim() !== '' : imgSrcRaw != null` + a test (unquoted wikilink image → no TypeError, shield glyph mounted, one warn).
~~- INFO-R1 (`test/dom/framework/sidebarEncounterHandoff.test.ts:416` failed once in a full jest run under load, passed 3/3 isolated and on rerun; untouched by this ticket) — file a Backlog ticket if none exists (flaky test costs future gate time).~~ superseded: already tracked as SC-302 and SC-327 (Backlog) — no new ticket; mention in comment.

## Re-review 2 (ticket-owner, 2026-09-24)

f6fb208: APPROVE. INFO-R2 (test comment at initiative-portrait-missing.test.ts:237 overstates "pins no TypeError" — the glyph/warn assertions are what go red) — DROP: comment-only nit in a test; the test itself is proven can-fail two ways. LAND-READY at f6fb208.
