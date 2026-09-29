# SC-232 r6: scoped re-review of the fix rounds (dse `91c7100` on `36635e9`)

## Executive summary

- **Verdict: LAND-READY-AS-PROPOSAL.** Counts: CRITICAL 0, HIGH 0, MEDIUM 0, LOW 2 (both are doc text, and both can be fixed during the planned rebase), INFO 7.
- **HIGH-1 is resolved.** I ran the wrap probe over 15 cards at 8 widths (300–660px, 304 names), base `36635e9` against head. Head adds 0 mid-word breaks. At a head width of 480px or less, every name matches base exactly. Above 560px, 21 names gain one line, always breaking between whole words.
- **Chromium-106 containment.** I emulated `contain: layout style inline-size` on the Steel screen `.dse-head` and measured 0 geometry diffs across all 522 screen captures. No shipped consumer sizes the head to fit its content. With a third-party shrink-to-fit ancestor the head only narrows; it never collapses (see LOW-2).
- **MEDIUM-1 is resolved.** Measured sizes: trait 27px, inline kit signature 33.3px, by-SCC kit signature 33.3px, project 28.8px. Inside `.dse-modal`, name, body and title all scale by exactly ×1.4 at text size 1.4, with the title identical between base and head. SC-232 does not override SC-230.
- **`name-kit-signature` can fail.** With the kit arm removed, parity reports 4 GAPs and exits 1. The implementer's site selector change was needed: the one I prescribed matches 0 nodes on the live site.
- **LOW-1 is resolved.** Every `ink` row cites SC-368. The 26 DECLARED rows are exactly the 16 original rows, the 8 name `ink` rows and the 2 kit-signature `ink` rows. The only SC-367 left is the mini-size comment at `:8189`, which is correct.
- **Freeze and parity at head.** Parity is 0/0/26, exit 0. Against the current baseline, freeze shows 8 mismatches, all from SC-236 moving the baseline. The head's 260 print PNGs are byte-identical to base `36635e9`'s. A trial rebase onto current develop `b029baa` gives freeze **260/260**, parity 0/0/26 and shots 524 with 0 FAIL, with no conflicts.
- **SC-284 trial merge.** No conflicts in SC-232's files. The only conflict is SC-284 against develop in `CHANGELOG.md`, which is not SC-232's. The merged narrow wrap has 0 new mid-word breaks, and every top-level name wraps on whole words.
- **The two LOWs:** the superproject CHANGELOG bullet still says narrow names wrap more and that a step-down is "in progress" (both false now). The comment at `styles-source.css:7355` says `.dse-head` "never" loses intrinsic width, but it does under a shrink-to-fit ancestor.

## Method

I made scratch clones under `scratchpad/r6/`: `base` (`36635e9`), `head` (`91c7100`), `revert` (head with the kit arm removed), `merge` (head plus `sc284-cardhead-narrow` `33b58c3`), and `rebase` (head trial-rebased onto `ade5064`, then onto `b029baa`). `base` and `head` also carry a scratch-only `feature/trait` fixture. The worktree was verified clean before and after: dse `git status --porcelain` is empty and HEAD is still `91c7100`; the superproject shows only its pre-existing ` M draw-steel-elements`. I made no commits on the branch, left no processes running, and did not touch the freeze baseline. Scripts and logs are in `r6-evidence/`.

## (1) HIGH-1: narrow wrap and containment

**Wrap probe** (`wrap.mjs`, `wrapcmp.py`, `caps.json`). I measured 15 cards: statblock default and with-captain, featureblock stats and default, feature, kit, encounter, montage, project, negotiation, party, roll, perk, class and ancestry. Each was measured at widths 300, 400, 480, 500, 520, 560, 600 and 660, giving 304 names.

- **Head width of 480px or less:** every name is identical to base in size, lines and mid-word breaks.
- **21 names are worse than base, all at 560px or wider,** and all by one extra line with whole-word breaks. Example: `Human Bandit / Chief` at 41.4px when the card is 560 wide.
- **New mid-word breaks: 0.**
- The implementer's own 17-capture table also matches.

**Containment probes:**

- **Emulated Chromium 106.** I injected `contain: layout style inline-size !important` on `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-head` and re-ran the full measurement over all screen captures: 0 text-geometry diffs and 0 head diffs (height, width, crest and right-rail centering). No rule using `align-items: baseline` has a `.dse-head` as its item; the 10 such rules are compendium-suggest, statblock/featureblock ledger cells, montage, party member-head and feature meta.
- **Head widths, base against head, across 522 captures:** 0 changed. No shipped consumer sizes `.dse-head` to fit its content.
- **Third-party shrink-to-fit ancestors** (fit-content, inline-block and float roots; `shrink2.mjs`), base → head:
  - negotiation: root 760 → 561px, head 662 → 464px (still readable, one line fewer of width)
  - feature: root 487 → 440px, name 187 → 140px
  - montage: head 76 → 0px, but it is already degenerate at base (root 68px, name 0px wide)
  - statblock, featureblock, kit, encounter, project, party and roll: unchanged
- **Changes since SC-284's analysis:** that analysis was written on `619c4bd`. SC-243, SC-230, SC-272 and SC-236 have landed since, and none adds a `.dse-head` consumer; SC-272 only changes the rule-card eyebrow text through the existing `cardHead`.

## (2) MEDIUM-1 and SC-230

Script: `families.mjs`, run in the Steel dark harness.

| Case | base | head |
|---|---|---|
| Standalone trait `ds-feature` ("Determination") | 20px | **27px / 28.08** |
| Kit inline signature ("Devastating Rush") | 20px | **33.3px / 33.3** |
| By-SCC kit (a real `feature` root moved into `.dse-card__band > .dse-card__body`) | 20px | **33.3px** (its nested trait stays 27px) |
| Project ("Craft Teleportation Platform") | 20px | **28.8px / 29.376** |

The modal probe puts a feature root inside `.dse-modal > .modal-content(15px) > .dse-modal__body`, next to a `.dse-modal__title-text` inside an 18px `.modal-title`:

| Modal width, text scale | title | body | ability name | nested name |
|---|---|---|---|---|
| 720, 1 | 18 → 18 | 15 → 15 | 18.75 → 31.22 | 18.75 → 25.31 |
| 720, 1.4 | 25.2 → 25.2 | 21 → 21 | 26.25 → 43.71 | 26.25 → 35.44 |
| 420, 1 (head ≤ 480) | 18 → 18 | 15 → 15 | 18.75 → 18.75 | 18.75 → 18.75 |
| 420, 1.4 | 25.2 → 25.2 | 21 → 21 | 26.25 → 26.25 | 26.25 → 26.25 |

Each cell shows base → head. The title is unchanged, and every name scales by exactly ×1.4, so SC-232 composes with SC-230 and does not override it. The shots run's own check also passes: `modal text-scale anchoring OK`.

## (3) `name-kit-signature`

**It can fail.** In `r6/revert` I dropped the `.dse-card__band > .dse-feature__nested > …` arm from the outside-query rule. Parity then reported **4 GAPs**: font-size and line-height, dark and light, site 33.3px against plugin 27px. It exited 1 (`logs/parity-revert-kit.log`).

**The site selector was changed, and needed to be.** Live DOM check (`sitesel.mjs`): the selector I prescribed, `.sc-kit .sc-embed .sc-ability > .sc-head .sc-head__left-primary`, matches **0** nodes on the kit, class and kit-index pages, because `.sc-embed` is a sibling of `.sc-kit` under `.md-content__inner`, not inside it. The implementer's `.sc-embed .sc-ability > .sc-head .sc-head__left-primary` matches kit (1), class (50) and kit-index (21). `firstIn` resolves it to `kit--dark` because of the page order in `urls.json`, and all three pages give 33.3px. See INFO-3.

## (4) SC-368 and the 26 DECLARED rows

- `selector-map.json` has 18 declaredDeferrals entries: the 8 original entries (16 rows, both schemes each), plus 8 scheme-scoped `name-{generic,ability,statblock,featureblock}:ink`, plus 2 scheme-scoped `name-kit-signature:ink`. That makes **26 rows**, all with rule `ink`; no size row is hidden among them.
- All 10 new `why` strings start with "SC-368". The `compare.test.ts:826-835` comment cites SC-368. `parity/README.md:518` reads "18 entries / 26 rows" and `:526` reads "filed SC-368". The one remaining SC-367 (`styles-source.css:8189`) is the mini-ratio size deferral, which is correct.

## (5) Freeze and parity at head, re-run by me

- `npm run shots` (worktree): 524 PNGs, 0 FAIL, `modal text-scale anchoring OK`.
- `check-freeze.sh`: **8 mismatches**: feature, feature-collapsed, feature-spend and chrome-collapsed-rollout, each × steel-print/realprint. These are exactly the 8 lines the baseline changed for SC-236 (`ade5064`), which landed after this head's base. `36635e9` shot in my `base` clone gives the same 8, and all 260 print/realprint PNGs at head are **byte-identical** to base's (`logs/print-{base,head}.sha`). SC-232 moves 0 print bytes.
- `npm run parity`: **0 gaps, 0 undeclared, 26 declared, exit 0.**
- **Trial rebase in a throwaway clone.** Rebasing onto `ade5064` was clean, with `entry.ts` merging automatically, and freeze passed 260/260 against the pre-SC-255 baseline that matches that base. develop has since moved to **`b029baa`** (SC-255), and the baseline was rebaselined for SC-255 at 09:56. Rebased onto `b029baa`: clean, shots 524 with 0 FAIL, **`freeze OK (260/260 …)`**, parity 0/0/26, exit 0.

## (6) SC-284 trial merge (`33b58c3` into `91c7100`)

- **Conflicts.** `styles-source.css`, `visual-harness/entry.ts` and `test/dom/kit/cardHead.test.ts` merged automatically. The one conflict is the dse `CHANGELOG.md`, between SC-284's bullet and develop's SC-272/SC-230 bullets. SC-232 does not touch that file (`git diff 36635e9 91c7100 -- CHANGELOG.md` is empty), so SC-284's own rebase has to resolve it.
- **Duplicate container.** The merged sheet declares `container-name: dse-head` twice: the Steel-screen copy at `:7399` and SC-284's base copy at `~:13882`. The duplicate is harmless, as the ledger expects.
- **Merged narrow wrap** (`logs/wrap-merge.log`): 0 new mid-word breaks against base, and nothing is worse at 480px or less. At 300px:
  - `Human Bandit / Chief`: 2 lines
  - `Bloodstone of / Yendral`: 2 lines
  - `Ambush at the ford`: 1 line
  - `Cross the Ashfall / Wastes`: 2 lines
  - `Devastating / Rush`: 2 lines
  - `Supernatura/l Insight` keeps the 1 mid-word break it already has at base.

## Findings

### LOW-1: the superproject CHANGELOG bullet is stale

**Where:** `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/CHANGELOG.md:18-20`.

**Problem:** it says "At a narrow pane width the bigger names can wrap onto more lines than before; a size step-down for narrow panes is still in progress." Both halves are now false: at a head width of 480px or less the names are byte-identical to today. A reader would expect a regression that does not exist.

**Fix:** replace it with "In narrow panes (a card header 480px wide or less, such as a sidebar) names keep their previous size." Do this at the rebase.

### LOW-2: the containment comment overclaims

**Where:** `styles-source.css:7355-7357`.

**Problem:** "`.dse-head` never has an `auto` inline-size of its own to collapse" is not true under a shrink-to-fit ancestor. Under a fit-content, inline-block or float root, negotiation's head loses 198px (662 → 464) and the feature root loses 47px. No shipped consumer does this; it matches SC-284's own residual.

**Fix:** reword to state the residual, for example: "no shipped consumer sizes `.dse-head` to fit its content; under a third-party shrink-to-fit ancestor the card narrows (negotiation 760→561px) but does not collapse."

### INFO

1. **Mixed sizes at middle widths.** When a statblock card is about 540–590px wide, the band head is wider than 480px (41.4px) while the nested sub-feature heads are 480px or narrower and fall back to 20px. Example: at a card width of 560, `Human Bandit Chief` is 41.4px and `Whip and Magic Longsword` is 20px. The band-to-sub-feature ratio is then 2.07×; the site's is 1.53× and today's is 1.0×. There are no mid-word breaks. Also, for card widths of 482–544px the statblock band reads 41.4px where the site steps down to 33.3px, because the site-mirror step was replaced by the owner's revert-to-today rule. Both are worth one line in the Scott ask.
2. **The fallback is conservative once SC-284 lands.** With the rail stacked, the name column at 300px is 187px (round 3 measured 33.3px fitting readably there). The ledger already notes revisiting this after SC-284.
3. **`name-kit-signature` depends on page order.** The site selector could be pinned to the kit page with `.md-content__inner > .sc-embed > .sc-ability > .sc-head .sc-head__left-primary`. Today it is harmless, because every page that matches is 33.3px.
4. **Trait and project have no parity pair.** I measured them directly (27px and 28.8px).
5. **Numbers to update at landing.** The `dse-verify` SKILL.md "Current expected numbers" need 26 DECLARED (the skill says 16), along with the SC-236/SC-255 freeze baselines.
6. **SC-235 overlap.** SC-235 will still conflict on the declared-deferral list, `compare.test.ts` and the README counts, so land the two in sequence (the ledger already notes this).
7. **Not re-run this round:** jest, lint, tsc and lifecycle. The brief did not ask for them; the implementer reports jest 4099/1/211 of 212/3, equal to base, and lifecycle 19/19.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r6-rereview-report.md`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r6-evidence/scripts/`: `wrap.mjs`, `wrapcmp.py`, `caps.json`, `measure.mjs`, `analyze.py`, `shrink2.mjs`, `families.mjs`, `sitesel.mjs`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r6-evidence/logs/`:
  - wrap logs: `wrap-base`, `wrap-head`, `wrap-merge`
  - containment: `shrink2-{base,head}`
  - families and modal: `families-{base,head}.json`
  - gates at head: `shots`, `freeze`, `parity`, `print-{base,head}.sha`
  - kit-signature can-fail: `parity-revert-kit`
  - SC-284 trial merge: `merge`
  - trial rebase: `freeze-rebase` (onto `ade5064`), `freeze-rebase2` and `parity-rebase2` (onto `b029baa`)
