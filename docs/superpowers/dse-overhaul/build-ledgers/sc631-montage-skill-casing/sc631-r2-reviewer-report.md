# SC-631 r2 reviewer report

## Executive summary
- Verdict: APPROVE. 0 HIGH, 0 MEDIUM, 2 LOW, 3 INFO. Rulings 1-7 all met; none violated.
- Heads reviewed: dse `ea9749ab` on `3e88b3f5` (origin/develop still `3e88b3f5` after fetch); superproject `9c022c93` on `7cea83eb`.
- tsc (incl. `-p e2e`) clean, lint clean, jest full 13331 passed / 1 skipped / 0 failed (291 suites + 1 skipped).
- e2e full `OBSIDIAN-E2E done: 593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`, pointer parked, no flakes. Lifecycle not run (diff touches only `src/elements/montage/`, tests, CHANGELOG).
- Non-vacuity: base src (M0) fails 4 new unit tests + K04 + e2e MONT-L12; 5 mutants run, 4 killed, 1 survivor (m3, exact-match edit exclusion; hand-edited YAML only; LOW-2).
- Probe of 28 odd-YAML / edit cases against the real model: no crash, no false warning, the edit read never changes the model, an edit of hero A never subtracts from hero B.
- Write path unchanged (the modal trims in `commit()` at base and at head; the model records as given).
- Tree left clean in both repos (`git status --porcelain` empty before and after).

## Findings

### LOW-1: the edit sheet can name the wrong stored spelling (the entry's own one)
`src/elements/montage/model.ts:625-629`. The live read removes the FIRST key-matching item for the edited
entry, while the real write (`removeSkillOccurrence`, model.ts:573-582) removes the EXACT item. Reachable
through the UI: Kira logs "nature" in round 1, then "Nature" in round 2 (warned, allowed), so
`skills_used: [nature, Nature]`. Edit the round-2 entry and type "NATURE": the warning reads "Kira already used
**Nature**…", which is the round-2 entry's own spelling; the other use on the board is "nature". Probe:
`reusedSkillSpelling` returns `"Nature"`; the real `correctMontageEntry` leaves `["nature","NATURE"]`.
Only the spelling in the warning is wrong; showing the warning is correct. Ruling 2 is met loosely
(it names *a* stored spelling).
Fix: try the exact item first, then the key match:
`let idx = used.indexOf(excluding.skill); if (idx === -1) idx = used.findIndex((u) => matchKey(u) === own);`
plus a unit assertion (`[nature, Nature]`, editing the `Nature` entry, typed `NATURE` gives `"nature"`).

### LOW-2: the edit exclusion's own casing rule has no test (surviving mutant m3)
`test/unit/model/montage-tally.test.ts:302-310`. Ruling 1 says the `excluding` subtraction "uses the same
comparison". Mutant m3 (exclusion by exact `u === excluding.skill`) passes all 332 tests in the two suites,
because every test's edited entry has the same casing as its stored item. Only reachable with hand-edited YAML
(`skills_used: [nature]`, entry `skill: Nature`). Fix: add
`m.participants = [{ name: 'Kira', skills_used: ['nature'] }]; expect(wouldReuseSkill(m, 'Kira', 'NATURE', {hero:'Kira',round:1,result:'success',skill:'Nature'})).toBe(false);`
(m3 makes it fail). Can be folded into LOW-1's test.

### INFO-1: a stored skill with spaces is printed with its spaces
`src/elements/montage/LogActionModal.ts:250`. Stored `"  Animal Handling "` gives the textContent
`Kira already used   Animal Handling  in this montage — …` (unit test :297 pins the padded return). The
spaces collapse on screen (normal white-space), so nothing visible. Only reachable by hand-typed YAML (the
modal trims before saving). Ruling 2 is about spelling; trimming would keep the casing. Optional:
`${reused.trim()}` in the message. Owner's call; not required.

### INFO-2: other exact comparisons in the same flow (ruling 7, report only)
- `model.ts:567-568` `findParticipant` matches the hero exactly: an entry hand-typed `hero: kira` with roster
  `Kira` gets no reuse warning and no skill add/remove. Pre-existing; hand-edited YAML only.
- `model.ts:573-582` `removeSkillOccurrence` and `model.ts:674` `sameSkill` are exact (the implementer's
  follow-up). With UI-only data the entries and `skills_used` stay consistent; a casing mismatch needs hand
  edits. Editing "Nature" to "nature" rewrites the stored item to "nature" (recorded as typed, ruling 3).
- No other surface warns about reuse (`grep` of `src/elements/montage/`); `OutcomeBandView.ts:206`
  lowercases a skill for display only.

### INFO-3: dse-verify SKILL.md is now stale
The e2e line still says `592/608` and lists "jsdom test.failing markers for montage bugs: SC-631". Measured
now: 593/609, and K04 is a plain test. The owner updates this after landing (the implementer also noted it).

## Ruling check
1. Trimmed + case-insensitive both ways, exclusion the same way: met (`matchKey`, model.ts:597-601, used at :621,
   :625, :627, :630). 2. Board's spelling: met (K04 + MONT-L12 assert "Nature" for typed "nature"/" nature ";
   see LOW-1 / INFO-1). 3. Warn never block, no write change: met (Log stays enabled in MONT-L12; `commit()`
   unchanged, LogActionModal.ts:311-314 identical to base :310-313; no dedupe or recase). 4. Odd YAML:
   met (probe). 5. Tests: K04 plain, title without a ticket id; 5 unit tests; MONT-L12 used only in
   log-modal.e2e.ts:83 (plus run outputs); no bracketed ticket id in any title. 6. One CHANGELOG bullet
   under `## Unreleased`, plain words. 7. Nothing out of scope touched. Commits: 3 dse, 1 changelog,
   ONE pointer bump (`9c022c93`); no attribution trailers.

`wouldReuseSkill` is kept as a wrapper. Its only callers are tests; the modal now calls
`reusedSkillSpelling`. `montageHeroNamed` was moved onto `matchKey`: the behaviour is the same, and a
non-string name now reads as no match instead of throwing (montageRoster already filters those out).

## Non-vacuity (targeted jest = montage-tally unit + montage-matrix dom, 332 tests)
| Mutant | jest | e2e |
|---|---|---|
| M0 base src (`git checkout 3e88b3f5 -- model.ts LogActionModal.ts`) | 5 failed (4 new unit + K04) | MONT-L12 FAIL (warning not displayed); MONT-L04, MONT-L05 ok |
| m1a no lowercase in `matchKey` | 5 failed | - |
| m1b no trim in `matchKey` | 2 failed | - |
| m2 warning prints the typed spelling | 1 failed (K04) | MONT-L12 FAIL (textContent "…used nature…") |
| m3 exclusion by exact match | 0 failed (survivor, LOW-2) | - |
| m4 no edit exclusion | 3 failed (incl. L07) | - |
Each mutant was restored with `git checkout HEAD -- <both files>`; the final status is empty.

## What I ran
tsc + lint, full jest, full e2e, model probe (esbuild bundle of `probe.ts` with an obsidian stub), M0 + 5
mutants. Not run: lifecycle, shots, freeze, parity (no CSS or out-of-montage change).

## Evidence (all in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc631-r2-rev/)
static.rc, tsc.log, lint.log, jest-full.log/.rc, e2e-full.log/.rc, probe.ts, probe-out-head2.log,
mut-m0-jest.log, mut-m0-e2e.log, mut-m0.rc, mutants.rc, mut-{m1a,m1b,m2,m3,m4}-jest.log, mut-{…}.diff,
mut-m2-e2e.log, mutants-final-status.txt (empty).

---

# r4 scoped re-review (delta `6b9cdf34..2777484c`)

## Summary
- Verdict: APPROVE. 0 HIGH, 0 MEDIUM, 0 LOW, 0 INFO in the delta. r2 LOW-1, LOW-2 and INFO-1 are fixed.
- dse head `2777484c` = origin/develop `e1be1775` + 5 SC-631 commits. `e1be1775..2777484c` touches only the 5 SC-631 files. The rebase is faithful: the +/- lines of `e1be1775..6b9cdf34` are identical to those of `3e88b3f5..ea9749ab`.
- Superproject: `origin/main..HEAD` is exactly 2 commits (`5531ae71` CHANGELOG, `47b35b4b` pointer bump to `2777484c`) on origin/main `f770cc3b`. The SC-631 and SC-648 bullets are both under `## Unreleased`. No attribution trailers.
- tsc (incl. e2e) clean, lint clean. jest on the 2 montage suites: 334 passed / 0 failed (332 + the 2 new tests).
- Mutants: r4m3 (exclusion exact only, no fallback) killed by 1 test; r4m5 (fallback only, no exact-first) killed by 1; r4m6 (no `.trim()`) killed by 1. 3/3 killed.
- Probe: LOW-1 scenario returns "nature" (and the real write leaves `["nature","NATURE"]`, consistent). Stored " Nature " and a scalar "  Nature  " both return "Nature". A single entry in other casing does not warn against itself (stored "nature", entry "Nature", typed "NATURE": undefined). `[Nature, Nature]` still warns.
- Full e2e not re-run (per the owner). The trim lives in the model, and `LogActionModal.ts` is unchanged in the delta.
- Tree clean in both repos after the run.

## Delta checked
- `src/elements/montage/model.ts:625-634`: `ownSkill` is the entry's raw skill (hero must match exactly). The exact `indexOf` runs first, then the `matchKey` fallback; it is skipped when `matchKey(ownSkill)` is undefined (number, blank, absent). Probes P5/P5b: a non-string or blank entry skill subtracts nothing, so it cannot hide a real reuse. `?.trim()` only runs on a string: `find` only returns items whose `matchKey` is defined, so non-strings never reach it.
- Doc comment line at model.ts:607 is over the file's usual width. Cosmetic; lint is clean.
- Tests: `montage-tally.test.ts:297` now pins "Animal Handling". New tests at :312 (case-insensitive exclusion) and :319 ("names the OTHER use"). The titles carry no ticket id.

## Probe output (P2-P5)
P2 "nature" · P2b (editing the "nature" entry) "Nature" · P2c write `["nature","NATURE"]` · P3 "Nature" · P3b "Nature" ·
P4 undefined · P4b (stored " Nature ", entry "Nature", typed "nature") undefined · P4c undefined · P4d "Nature" ·
P5 "Nature" · P5b "Nature" · P5c (Bram's entry, Kira queried) "Nature" · P5d (map) undefined.

## Evidence (scratch dir as above)
r4.rc, r4-tsc.log, r4-lint.log, probe-r4.ts, r4-probe-out.log, r4-{base,r4m3,r4m5,r4m6}-jest.log, r4-{…}.diff, r4-final-status.txt (empty).
