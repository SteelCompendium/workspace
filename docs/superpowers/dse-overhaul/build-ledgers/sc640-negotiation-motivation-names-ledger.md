# SC-640 decisions ledger — Negotiation: same-named and nameless motivations / pitfalls

Ticket: SC-640 (Bug, project DSE 7.0.0). Owner: ticket-owner (Opus 5.5).
Worktree: `/home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names`
(superproject `f97c41bc` = workspace origin/main at creation; dse branch
`sc640-negotiation-motivation-names` from dse develop `5f962390`).

## Ticket text (verbatim, the spec)

> **What happens:**
>
> * Two motivations both named "Higher Authority": on the Argument tab the FIRST chip is drawn empty (a bare button, no label), and the card's first Spent chip is blank. Only the second chip works, and clicking the first one toggles the shared name.
> * A motivation with no `name:` draws a chip "◆" whose screen-reader label is just "Appeal to ".
> * Pitfalls have the same problem: with two pitfalls named "Power", the first pitfall chip on the Argument tab is blank (`pitfallChips` map, `ArgumentView.ts:63,148`).
>
> **Expected:** every motivation (and pitfall) gets its own working, labelled chip, or the card says plainly that two share a name.
>
> Cause: the chip and row registries are keyed by name (`Map<name, …>`) — `ArgumentView.ts:62,133,148`, `MotivationsPitfallsView.ts:27,93` — so the second entry overwrites the first and only that one is repainted.
>
> Markers (SC-439): jsdom `test.failing` asserting each of two same-named motivations has a non-empty, working chip; one for the empty `aria-label`.

Markers in code at `5f962390`: jsdom `[K06]`, `[K07]`, `[K10]` in
`test/dom/elements/negotiation-bugs.test.ts`; e2e `knownBug('SC-640', '[NEGO-W04] …')`,
`'[NEGO-W05] …'` in `e2e/specs/negotiation/wrong-values.e2e.ts` (fixtures
`Negotiation/dup-names.md`, `Negotiation/nameless.md`).

No Scott comments on the ticket as of 2026-11-14.

## Scott's rulings

(none — the ticket allows either outcome; owner rules below, reported to Scott in the closing
comment so he can overrule. Precedent: SC-627 / SC-631 owners ruled their matching rules the
same way.)

## Owner rulings (2026-11-14)

1. **Identity is position.** Every entry of `motivations:` / `pitfalls:` is its own item on the
   card. Every chip / row registry is keyed by the entry's POSITION (or the entry object),
   never by name (`ArgumentView.ts` `motivationChips` / `pitfallChips`,
   `MotivationsPitfallsView.ts` `rows`, and every `find(m => m.name === …)` that picks ONE entry).
   Each Motivations-dossier row keeps its own Spent chip, which toggles THAT entry's own
   `hasBeenAppealedTo` only (today `setMotivationUsed(name)` flips the first same-named entry).

2. **One rule for "same name": trimmed, case-insensitive** (the montage `matchKey` rule,
   SC-627 / SC-631). It is used everywhere a chosen-list entry (`motivationsUsed` /
   `pitfallsUsed`) is matched to an entry and everywhere two entries are compared:
   chip pressed state, toggle on/off, `argumentUsesMotivation` / `argumentUsesPitfall` /
   `argumentReusesMotivation` / `argumentReuseChecked`, `setMotivationUsed`'s reuse logic,
   Complete Argument's spend loop, and duplicate detection. Why it fits motivations:
   Draw Steel motivations and pitfalls are a fixed vocabulary (Benevolence, Discovery, Freedom,
   Greed, Higher Authority, Justice, Legacy, Peace, Power, Protection, Revelry, Vengeance)
   where casing carries no meaning, so "power" next to "Power" is a typo, not a second
   motivation; entry names are already trimmed at read (`NegotiationData.ts` `Motivation` /
   `Pitfall` constructors) but chosen-list entries are not. Writes use the ENTRY's spelling:
   pressing a chip pushes the entry's name; un-pressing removes the matching chosen entry
   whatever its spelling. Implement as ONE negotiation-local helper in `NegotiationData.ts`
   with a comment naming montage's `matchKey` as the same rule — do NOT edit
   `src/elements/montage/` (SC-650 is in flight there). Typed values (SC-638 snapshot,
   matched per text) must keep round-tripping: an untouched `motivationsUsed: [5]` still
   writes back as the number 5.

3. **Same-named entries share ONE Argument chip, and the card says so.** The chosen list
   stores names, so two entries with the same name cannot be chosen separately; two chips that
   press together is the mirroring SC-627 called a bug. So on the Argument tab: one Motivation
   chip per distinct name (drawn at the first such entry, with its spelling), one Pitfall chip
   per distinct name; and a plain one-line notice under that chip row, e.g.
   `Higher Authority is listed twice; this chip stands for both.` (three times → "three
   times"; several duplicated names → one line each, or one combined line — implementer's
   choice, reviewer judges readability). The Motivations dossier keeps ALL rows (each with its
   reason and its own Spent chip) and shows the same kind of note. Same for the Pitfalls
   dossier rows. The merged chip is drawn spent (◇, "spent") when ANY same-named entry is
   spent, and an appeal to it counts as reuse on the same rule; Complete Argument marks EVERY
   entry with that name as appealed to. The notice is visible on read-only hosts too. No new
   CSS if an existing class serves (styles.css byte-identical is the target; if a new rule is
   unavoidable, say so in the report — it moves parity/freeze review).

4. **Nameless entries are labelled and work.** An entry whose name is empty after trim is
   drawn as "Unnamed Motivation" / "Unnamed Pitfall" (chip text, dossier name, and every
   tooltip / aria-label built from the name, e.g. `Appeal to Unnamed Motivation`,
   `Mark Unnamed Motivation as already appealed to.`). The label is DISPLAY ONLY — never
   written to the note; the entry stays nameless in the YAML. Its chip is a working chip
   (chosen-list entry is the empty string, which round-trips). Two nameless entries are
   same-named under rule 2 and merge under rule 3 (notice e.g.
   `2 Motivations have no name; this chip stands for all of them.` — wording implementer's
   choice).

5. **Out of scope:** Reset focus (SC-639, in flight — do not edit `focusRules.ts` or the Reset
   handler); missing Interest / Reset defaults (SC-641, parked — its markers K08 / K09 /
   NEGO-W06 / W07 stay); outside-edit focus (SC-656); montage files (SC-650). A block edit form
   or Add-motivation refusal is NOT added (there is no add UI; duplicates come from typed YAML).

6. **Un-pressing removes EVERY matching chosen entry (owner, 2026-11-14, on r1's deviation).**
   r1 removed only the first match, so a hand-typed `motivationsUsed: [Power, power]` needed two
   presses and the chip stayed drawn pressed after the first — the card must show what is chosen
   (SC-649), so one press clears the chip. The SC-638 R2 DOM test that expected `[5, "5"]` to lose
   only its first entry is rewritten to the new rule (both go). SC-638's unit tests that splice the
   list directly (testing the typed snapshot by position) stay as they are.

7. **r1 follow-ups:** dossier counts still count entries ("1 of 2 open", "2 known") — DROP: rows
   are entries and every row is drawn, so the count matches what is shown. Notice reuses
   `.dse-nt__why` — DROP: it is the card's existing explanatory-text style, which is the right
   voice for this line; no CSS change keeps freeze / parity untouched. Stray `/tmp/claude-1000/-home-scott/code/placeholder`
   — DROP (harmless, left under the no-rm rule).

## Rounds

- r1 implementer (Sonnet) — dispatched 2026-11-14, brief `sc640-r1-implementer-brief.md`, report `sc640-r1-implementer-report.md`.
  DONE: plugin head `149268a8` (fix 134c3b23, jsdom 310e7aa5, e2e 149268a8), superproject CHANGELOG `21b63201`. jest fresh 13376/2 · lifecycle 64/64 (7 parts) · e2e 602/615 ok, 0 failed, 13 known-bug, 417/417 · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24 · styles.css unchanged.
- r1b implementer fix (resume) — ruling 6 + rebase onto a9f0af1d / superproject d2d4e5fd + full battery, dispatched 2026-11-14.
  DONE 2026-11-15: plugin head `fd702758` on a9f0af1d (05ce3131 fix, 8d7ab34d jsdom, 05d2b1ec e2e, fd702758 r1b); superproject `1eade0ec` (CHANGELOG, parent d2d4e5fd; main has since moved to 60a9df1d, docs-only). jest 13390/1 cache · lifecycle 64/64 · e2e 611/622 ok, 0 failed, 11 known-bug, 417/417 · shots 592/163/978/40/240/147 · freeze 280/280 · parity 0/0/24 · styles.css unchanged.
- r2 reviewer (Opus) — DONE 2026-11-15: LAND, 2 LOW / 5 INFO (ruling 8); jest 13390/1, e2e full 611/622 0 failed 11 known-bug 417/417; screenshots in scratchpad sc640-r2-rev/.
- r3 implementer (resume) — ruling 8 folds + superproject rebase + pointer bump. DONE 2026-11-15: plugin `cefa9ca8`; superproject `origin/main a0361d8b` + `63eaccfb` CHANGELOG + `68afc125` pointer bump; jest 13390/1; INFO-3 mutant red.
- r4 reviewer (resume of r2) — scoped re-review of the r3 delta. DONE 2026-11-15: LAND, no findings; tsc/lint rc 0; negotiation jest 680/680; M11 now red in 2 tests.
- LAND-READY 2026-11-15: plugin `cefa9ca8` on a9f0af1d; superproject `68afc125` = origin/main a0361d8b + CHANGELOG 63eaccfb + pointer bump. Reported to dispatcher.
- (r2 brief:) on the rebased head; brief `sc640-r2-reviewer-brief.md` (fill <R1_HEAD>/<R1_CL>; base becomes a9f0af1d, expected 11 known-bug).

8. **r2 review findings (owner, 2026-11-15; verdict LAND, 0 HIGH / 0 MEDIUM, 32/32 mutants killed):**
   - LOW-1 `NegotiationData.ts:98-100` stale `restoreUsed` comment ("removes the first equal entry", `indexOf`) — FOLD (comment only).
   - LOW-2 CHANGELOG blank lines lost between bullets in the conflict resolution — FOLD.
   - INFO-1 `NameGroup.first` set but never read — DROP: dead field, no behaviour; removing it is runtime src and would force another full lifecycle/e2e for nothing.
   - INFO-2 notice names the first spelling only — DROP: that is ruling 3.
   - INFO-3 `argumentUsesPitfall` exact-match mutant caught only by a unit test — FOLD: add a roll-tier assertion to the jsdom `[POWER]` pitfall test.
   - INFO-4 whitespace-only chosen entry presses the nameless chip — DROP: follows ruling 2.
   - INFO-5 superproject rebase onto current main — FOLD into r3 with the ONE pointer bump.
   Gates for r3: src change is a comment only, so tsc + lint + full jest suffice; lifecycle / e2e / shots / freeze / parity stand from fd702758 (r1b) and r2 (e2e 611/622, 0 failed, 11 known-bug, 417/417).

## Baseline move (dispatcher, 2026-11-14)

SC-639 landed: dse develop now `a9f0af1d`, workspace main `d2d4e5fd`. Verbatim: "Rebase onto a9f0af1d, and put your superproject branch on current workspace main with the CHANGELOG commit and ONE pointer bump, before you report land-ready. New numbers at a9f0af1d: jest 13353 passed / 2 skipped fresh (13354 / 1 with the shots cache) · lifecycle 64/64 · e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24."
Expected on the rebased branch: e2e (607+2 flipped+new)/(620+new) ok, 0 failed, **11 known-bug**, 417/417.
