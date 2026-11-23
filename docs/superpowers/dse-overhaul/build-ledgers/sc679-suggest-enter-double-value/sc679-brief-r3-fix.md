# SC-679 r3 fix-round brief

For the r1 implementer, resumed (or a fresh implementer: this brief plus the files it names are enough).
Your final text goes to the ticket-owner (an agent), not a human.

## 1. Context loading

1. Ledger (re-read: it has new entries, including a superseded R2 mechanism and the rulings on each review
   finding): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/decisions.md`
2. The review, findings section (lines 16-100), read in full; these are the findings VERBATIM:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r2-reviewer-report.md`
3. The r1 brief still governs paths, gates' command shapes and every footgun (section 4 there applies
   unchanged): `…/sc679-brief-r1-implementer.md`. Your r1 report: `…/sc679-r1-implementer-report.md`.

Land branch `sc679-suggest-enter-double-value`, plugin clone
`/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`, head
`c1181989b7eb8711d8a15e6065ee56cfcae8c35b`, base dse `origin/develop` @ `129beb18af27c641cca026ec519090af20372715`.
First: `git -C <clone> fetch origin`; if `origin/develop` moved off `129beb18`, rebase onto the new sha, run
`npm ci` if `package.json` changed, and report the new base. **Workers never call the tracker.**
New scratch files go in `…/scratchpad/sc679-r3-fix/` (uniquely named); the r1 scratch tree
`…/scratchpad/sc679-r1-impl/on-sc443` (branch `sc679-on-sc443`) is yours to keep using.
The reviewer's folder `…/scratchpad/sc679-r2-review/` is READ-ONLY (its `probe-src/` holds the RTWO-32 /
RTWO-G11 burst probes you may read as a template).

## 2. The task: exactly these fixes, nothing else

**F1 (MEDIUM-1, option (a), owner's ruling).** In `src/authoring/schemaSuggest.ts` delete the `accepted`
field and its comment, the check at the top of `onTrigger`, and the line in `selectSuggestion` that records
it. The fix is then `replaceRange` + `setCursor` + `this.close()`. Rewrite the remaining comment so it
states what is true and measured: Obsidian 1.14.4 runs `onTrigger` again after an accept but opens a closed
list only on typed input, so `close()` is what keeps a list from sitting over the accepted word; without
`close()` the old rows stay up for about 100 ms and an Enter in that window writes a second word. This
resolves LOW-1 and makes LOW-3 moot.

**F2 (LOW-3 as it applies under F1).** In `test/dom/authoring/schemaSuggest.test.ts` rewrite the SC-679
tests that assert `onTrigger === null` after an accept (the reviewer names tests 4, 5, 6 and 9 of the SC-679
describe block) to assert what the code now does: the cursor position, `close()` called once per accept,
and that `onTrigger` after an accept behaves exactly as it does for the same cursor and text without an
accept. Remove any test whose only subject was the memory. No test title may promise a case its body does
not contain (the reviewer's note on `:381`).

**F3 (LOW-2), in the scratch tree / patch.** Add real-Obsidian e2e tests that send the accept and the next
Enter with NO wait between them, and assert the note text and the cursor:
- value list (gate on, `ds-roll`): click a row, then `browser.keys('Enter')` at once -> `mode: opposed` whole
  plus a new line;
- value list and shipped key list (`ds-stam`): list open, `browser.keys(['Enter', 'Enter'])` in one burst ->
  the word once, plus a new line;
- typed prefix (`rec`) + Enter + Enter in one burst -> `recoveries` once plus a new line (the reviewer's
  `recoveriesoveries` case).
Prove they are not vacuous: build the scratch tree once with `this.close()` removed (do not commit that)
and show these tests FAIL there, then restore and show them pass. Record both summary lines.

**F4 (LOW-4), patch.** Replace the fixed `browser.pause(300)` in AUTH-G17 (`gate-on.e2e.ts:147`) and
AUTH-K13 (`schema-suggest.e2e.ts:183`) with bounded polls, as the finding prescribes.

**F5 (INFO 2), patch.** One-line comment on AUTH-G17: it is a canary for Obsidian's own behaviour (Tab does
not accept a row on 1.14.4) and guards the docs wording "Enter or a click".

**Docs.** Check `docs/writing-blocks.md` and both CHANGELOG bullets still read true after F1 (they should);
change nothing that is still true.

**Out of scope (ticketed, do not touch):** SC-682 (the `/ds` list in `src/authoring/suggest.ts` keeps its
row after an Enter accept), SC-681 (a word typed in full still lists itself), SC-678 (mid-word accept).
Do not edit `src/authoring/suggest.ts`.

**Mechanics.** New commits on the land branch (no amend, no force): `fix(SC-679): …`, `test(SC-679): …`.
In the scratch tree, rebuild `sc679-on-sc443` so it is SC-443 tip `ae9025ea` + the land branch's current
plugin commits (cherry-picked) + ONE commit holding the marker flips and all new / changed e2e tests; then
regenerate `…/sc679-on-sc443.patch` (overwrite) from that one commit, and state in the report exactly what
the patch applies on top of. No Co-Authored-By / AI attribution. Do not push.

## 3. Gates (land branch, final head), expected

One blocking foreground call each, script files through
`devbox run -c <abs plugin dir> -- bash <script>`, logs uniquely named in your r3 scratch folder.

| Gate | Expect |
|---|---|
| `npm run tsc`, `npm run lint` | clean |
| `npx jest` | 0 failed; report the exact `Tests:` line and the arithmetic against r1's 13711 / 2 |
| lifecycle, all seven `--only=` parts | union 63/64 with ONLY G-S61 red on its torn-read line (SC-668, red on base), or 64/64 |
| full `npm run e2e` | `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`; a listed flake (INIT-W10, SET-X03, SET-X04, INIT-W09, NEGO-R05) may be re-run alone once |
| `styles.css` sha256 | still `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (shots / freeze / parity then carry) |
| scratch tree: `npm run e2e -- --element=authoring` | 0 failed, 2 known-bug (SC-675's); the count is r1's 79 plus your new tests |
| scratch tree: jest `test/dom/authoring`, tsc, lint | green / clean |

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r3-fix-report.md`,
opening with an executive summary of at most 10 lines (STATUS, land head sha, superproject sha if it
changed, each gate's measured summary line, the with / without `close()` result for the burst tests). Then:
per fix F1-F5 what changed (file:line), the new e2e ids, `Drive-by fixes:` and `Follow-ups:` lists.
If the report write is blocked, return it inline. If you need input: STATUS: NEEDS_CONTEXT and the
question; you cannot message me.

Final text: raw facts only (STATUS, shas, measured numbers), no prose, plus the absolute path of every
artifact (report, patch, logs, scratch tree).
