# SC-627 r1 implementer report

**Executive summary**
- Status: DONE. Plugin branch `sc627-montage-duplicate-hero`, head `da3c8009`, 3 commits on dse develop `7b9e82cf` (origin/develop still `7b9e82cf`, no rebase). Not pushed.
- Commits: `27f97176` fix, `82e43b33` jsdom tests, `da3c8009` e2e.
- Gates: tsc/lint clean · jest 12689 passed / 2 skipped (12681 + 8) · lifecycle 64/64 (7 parts) · e2e 487/506 ok, 0 failed, 19 known-bug, coverage 287/287 · shots 592 (host-leak 163/978, modal 40/240, capture clip 147) · freeze 280/280, 0 FAILED · parity 0 gaps / 0 undeclared / 24 declared (run last).
- styles.css sha256 identical before/after: `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (built from 7b9e82cf src and from the fix).
- Red proof on unfixed src: jsdom 7 failed / 1 passed (the 1 is the "fresh name adds exactly one hero" control); e2e MONT-H07..H09 3/3 failed.

## Change
- `model.ts`: new `montageHeroNamed(m, name)` returns the board's spelling of the hero a typed name would duplicate (trimmed, case-insensitive, over `montageRoster` = hero entries only), else `undefined`. `addMontageHero` stays a plain append (comment says callers check first). No new property on model/entries.
- `ConfigModals.ts` `MontageAddHeroModal`: new 3rd ctor arg `heroNamed(name)` (default `() => undefined`), evaluated on every `input` event and again in the Add `onClick`; `.dse-mt__sheet-warn` div (role=alert, `hidden` attribute) under the name field with text `<Board spelling> is already on the board`; Add disabled when blank or taken. Add click on a taken/blank name re-runs the refresh and does not call `onAdd`/close.
- `view.ts` `openAddHero`: passes `(name) => montageHeroNamed(this.model, name)` (live model) and the `onAdd` callback re-checks `montageHeroNamed(this.model, name)` and returns without writing on a duplicate.
- No CSS change.

## Tests
- jsdom: 8 tests appended to `test/dom/elements/montage.test.ts` (describe "SC-627: ..."): exact dup, casing variant (board spelling), padded, fresh name/backing off/clearing, outside-added hero while open (live model; Add click re-check writes nothing, message shown), view callback writes nothing with window check bypassed, fresh name adds exactly one hero, non-hero items (`Ash`, `7`, `nmae: Ash`, `name: 7`) are no names and throw nothing.
- e2e (`e2e/specs/montage/add-hero-modal.e2e.ts`): MONT-H07 flipped from `knownBug('SC-627', ...)` to plain `it` and strengthened (warn not displayed first; Add disabled; warn displayed with text; `expectNoWrite` on the click; window stays; one Kira). New MONT-H08 (`  bRAM ` refused, message "Bram is already on the board", no write), MONT-H09 (Kira then `n`: message hidden, Add enabled, one write, `Kira, Bram, Kiran`). N=2, no new control pair (Y stays 287). Manifest file only got comment text updates (scenario group H note, disabled-until wording). Removed unused `knownBug` import.

## Gate numbers (raw summary lines)
- `npm run tsc` rc=0; `npm run lint` rc=0 (only the .eslintignore deprecation warning).
- jest: `Test Suites: 1 skipped, 285 passed, 285 of 286 total` / `Tests: 2 skipped, 12689 passed, 12691 total` (fresh, `rm -f main.js styles.css` first). The `findDriftedTokens` TypeError traces in the log are expected negative-test subprocess output.
- lifecycle: p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7, p6 4/4, p7 3/3 = 64/64, 0 failed; no reruns, G-S91 / G-S115 passed first time.
- e2e: `OBSIDIAN-E2E done: 487/506 ok, 0 failed, 19 known-bug, coverage: 287/287 pairs`.
- shots: 592 PNGs; button host-leak 163 kinds / 978 comparisons; modal button host-leak 40 / 240; `capture clip OK (147 ...)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`, 0 FAILED.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc=0.

## Drive-by fixes
- None (the e2e spec/manifest header comment wording was updated because it described Add's disabled rule; that is part of the change).

## Follow-ups
- dse-verify skill "Current expected numbers" and the e2e line (`484/504 ... 20 known-bug`) need bumping to jest 12689, e2e 487/506, 19 known-bug (owner/doc step; not touched).
- `MontageAddHeroModal` still has no Enter-in-name-field submit (SC-632, out of scope).
- Hidden warn element is a plain div without a `data-dse-control`; e2e finds it by `.dse-mt__sheet-warn` (same as MONT-L04). No manifest row needed.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc627-r1-impl/)
- jest: `sc627-r1-jest-full.log`, `sc627-r1-jest-mont-b.log` (8 green), `sc627-r1-jest-mont-red.log` (7 red on unfixed src)
- e2e: `sc627-r1-e2e-full.log`, `sc627-r1-e2e-part.log`, `sc627-r1-e2e-red.log` (3 red on unfixed src)
- lifecycle: `sc627-r1-lc-p1.log` .. `sc627-r1-lc-p7.log`
- `sc627-r1-tsc.log`, `sc627-r1-lint.log`, `sc627-r1-shots.log`, `sc627-r1-freeze.log`, `sc627-r1-parity.log`
- styles.css: `sc627-r1-styles-fix.sha`, `sc627-r1-styles-base.sha`, `sc627-r1-styles-after.sha`
- Worktree: /home/scott/code/steelCompendium/worktrees/sc627-montage-duplicate-hero/draw-steel-elements (clean; `styles.css`/`main.js` are untracked build outputs; `shots/` regenerated, ignored)

---

# r3 section (LOW fixes + rebase onto 620d5774)

**Executive summary**
- Status: DONE. Rebased onto origin/develop `620d5774` (confirmed tip; package.json unchanged, no npm ci). New head `afd1436c`; commits `de3e6339` fix, `b620d697` jsdom, `d4b0c580` e2e, `afd1436c` r3 LOW fixes. Not pushed.
- LOW-1: new jsdom test "a hero stored with padding on the board still matches the typed name" (board `name: "  Kira "`, type `kira`). Mutant M2b (`h.name.toLowerCase()`): that test red, 1 failed / 8 passed.
- LOW-2: outside-edit test now replaces `view.model` with a parsed board holding `osric` (no in-place mutation); removed the now-unused `addMontageHero` import. Mutant M4b (`const snapM = this.model` used in both checks): that test red, 1 failed / 8 passed. Both mutants reverted with `git checkout -- src/...`.
- LOW-3: manifest rows now cite H07-H09 (name: +H07,H08,H09; submit: +H07,H08,H09); no pair added, coverage unchanged.
- Gates: tsc/lint clean; jest 12923 passed / 1 skipped WITH the shots cache present (= 12922 / 2 fresh; 12913 + 9); lifecycle 64/64; e2e 570/593 ok, 0 failed, 23 known-bug, 416/416; shots 592, 163/978, 40/240, clip 147; freeze 280/280, 0 FAILED; parity 0/0/24 last; styles.css sha256 equal to a 620d5774 build.

## Gate lines
- jest (shots cache present, `visual-harness/dist/obsidian-app.css` from r1's shots run): `Test Suites: 1 skipped, 287 passed` / `Tests: 1 skipped, 12923 passed, 12924 total`.
- lifecycle: p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7, p6 4/4, p7 3/3 = 64/64, no reruns.
- e2e: `OBSIDIAN-E2E done: 570/593 ok, 0 failed, 23 known-bug, coverage: 416/416 pairs`.
- shots 592 PNGs; `button host-leak OK (163 ...` (978 comparisons), `modal button host-leak OK (... 40 button kinds ...` (240), `capture clip OK (147`.
- freeze `280/280`, 0 FAILED; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` rc=0.
- styles.css sha256 fix = base(620d5774) = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (same value as the 7b9e82cf-era hash).

## Evidence (scratchpad sc627-r1-impl/, r3 names)
sc627-r3-jest-mont-{green,m2b,m4b}.log, sc627-r3-jest-full.log, sc627-r3-tsc.log, sc627-r3-lint.log, sc627-r3-lc-p1..p7.log, sc627-r3-e2e.log, sc627-r3-shots.log, sc627-r3-freeze.log, sc627-r3-parity.log, sc627-r3-styles-{fix,base}.sha.
Dir: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc627-r1-impl/

Drive-by fixes: none. Follow-ups: the warn message uses the board's spelling verbatim, so a hero stored as `"  Kira "` shows "  Kira  is already on the board" (untrimmed spelling; cosmetic, hand-written YAML only; not changed).
