# SC-132 round 4 — shield direction, placement, markers r2, grouping, interaction model (2026-08-09)

Response to Scott's review comment `34b0085d`. He locked five items (H2 · base-max mark
M1-or-M2 · X2 conditions · F1/F2 dropped · E1) and asked for six things to be **built**.

**Commit:** dse `88601df` on `sc132-stamina`, parent `54f3835` (the round-3 commit, rebased
onto `origin/main` `f50b3bc` — SC-133/134/130 landed). NOT pushed; no superproject pointer
bump.
**Linear:** one self-contained comment `734bafaa` on SC-132 with 6 inlined strips
(dark stacked over light). Status In Progress, labels `["Needs Review"]`.

## Locked items, and the one that needed a pick

| Item | Ruling |
|---|---|
| Gauge height | **H2 (0.62rem)** — every round-4 strip is built on it |
| Base-max mark | **M1 (drop it)** — see below |
| Conditions | **X2**, stay in their existing UIs |
| Fresh directions | **F1/F2 dropped** |
| Temp edge | **E1 forged seam**, applied to every temp option |

**Why M1 over M2:** in the CSS they are *the same rule* (`.dse-stamina__gidx--max
{ display: none }`); M2 was M1 plus a promise that the temp material would carry the
boundary. Round 4 delivers that material anyway (vivid blue vs a green pour is a much
bigger break than round 3's translucent violet), so M1 states the same outcome in one rule
with no dependency on which temp option wins. Also: **the P2/P3 sub-bar placement dissolves
the question entirely** — a pure-max scale means the channel's right edge *is* base max.

## What was built

| Strip | Base | Options |
|---|---|---|
| `temp-shield` | A, gauge focus | S0 T1 control (purple) · S1 overshield plate · S2 energy glass · S3 armour plating |
| `temp-place` | A + S1, gauge focus | P1 appended · P2 sub-bar below · P3 sub-bar above |
| `rec-shape2` | A, rec focus | R2 refined · R3 refined · R5 plus marker · R6 outlined fill-in cell (▱) |
| `rec-group` | A + R2 | G0 · G3 · G4 · G5, on 8 and 12 recoveries |
| `rec-final` | A + R2 + G4 | LF1 hero sheet eyebrow · LF2 condensed + tooltip |
| `interact` | A + R2 G4 LF1 | 9 posed states of Model M, + the ALT stepper popover |

**Recommendations posted:** S1 · P1 (P3 if he wants the sub-bar) · **R6** · G4 · Model M.

### The blue, and the token collision it walks into

`--dse-stamina-temp` is **#7c5cd6 purple by two ratified decisions** — SC-10 Task 6
(2026-07-19) and SC-106 (2026-08-03) — both reasoning that the site reserves blue for
`--sc-act-maneuver` (#5dade2 dark / #2874a6 light). Scott's round-3 note asks for blue.

**The token was NOT changed.** The shield hue is a local candidate-stage `--sh`
(#33b1f2 dark / #0d86cd light) declared on `.dse-stamina__cand` under the S1/S2/S3 tokens
only, so the strips show blue while the token decision stays Scott's. **This is question 1
in the ask** and it must be answered before anything ships — a blue temp bar reverses a
cross-repo colour contract, not just a plugin style.

### The sub-bar's honest scale (item 1's "define it" requirement)

The lane's box **is** the channel's box (same width, same 1px border); the sub-fill starts
at the same `--dse-zone` bulkhead as the pour and its width is a percentage of the same
denominator `--dse-pour-w` uses. So px-per-point equality is arithmetic, not tuning.
Measured: **pour 7.6289 px/pt vs sub 7.6277 px/pt** (Δ 0.0012 px/pt = 0.036px over 30
points), identical in both schemes.

The cost, shown rather than hidden: with one shared ruler a temp > max cannot fit. The lane
**clamps and flags** it (`data-suboverflow="on"` → a chevron end saying "continues past the
lane") instead of silently rescaling. P1 shows the true 40 at 8/30 +40; P2/P3 cannot.

The harness re-derives the pure-max geometry from what the panel already publishes
(`--dse-zone`, `--dse-max-x`), multiplying the widened-scale layout by
`k = live / (maxX - zone)` — no second copy of the geometry.

### Model M (the interaction model)

Markers are a **value control**: clicking marker *n* sets the count. Both directions, any
distance, one click; and both edges behave predictably (last available → spend exactly 1,
first spent → restore exactly 1), the star-rating convention. Catch Breath stays an
**icon-only button** because it is a different verb (spend **and** heal `floor(max/3)`).
Every mutation posts an **Obsidian Notice with an Undo** — the escape hatch behind the
action rather than a confirm in front of it.

The **RAW research is what drove "set, not toggle"** — see below. The ALT (stepper popover)
is shown as the alternative: zero misclick risk, one extra click on every edit forever.

## The recoveries RAW findings (item 5's citation requirement)

Searched all four book sources under `steel-etl/input/`.

**Losing a recovery to something other than spending it is COMMON, and happens in
multiples:**
- Ajax the Invincible, `monsters/Draw Steel Monsters.md:1646` — "the target loses 1d3
  Recoveries"
- Undead Malice `:21039` — "the target loses 2 Recoveries"; `:21043` covers non-payment
  ("A target who has fewer Recoveries than they would lose is also weakened (save ends)")
- War Dog Tetrarch `:23792`, Strategos Alkestis `:24808`, Incubator of A'An `:27145`
- `heroes/Draw Steel Heroes.md:28641` — "A character loses a Recovery" as a standard hazard
  effect; `:29189` total-failure montage; `:29207`, `:29247` per-challenge costs
- Complications `:19412`, `:19900`, `:20009`, `:20310`

**Gaining a spent recovery back is almost nonexistent — exactly two effects in the corpus:**
- **Restorative of the Bright Court**, 4th-echelon consumable,
  `heroes/Draw Steel Heroes.md:24597` — "You and each ally within 5 squares of you regain
  1d6 Recoveries", opened as a maneuver. **The only mid-encounter one in the game.**
- **Warbanner of Wrath**, 4th-echelon trinket, `summoner/Draw Steel Summoner.md:3364` —
  "regain 1 Recovery at the end of every combat encounter"

**Zero** class, subclass, kit, perk, title or ancestry feature restores a spent recovery.
The Kits chapter (`heroes:17841-18814`), the Negotiation chapter (`:22226-22792`) and the
Tests chapter (`:20402-21386`) contain **no** occurrences of "recover" at all.

Everything else that looks like a grant is either raising the **maximum** until a respite
(Human *Staying Power* `:2508`, Elementalist *Master of Green* `:9503`) or granting
**permission to spend** an existing one — Conduit *Healing Grace* `:6464` is "The target
**can** spend a Recovery", never "you spend theirs". Recoveries otherwise reset only on a
respite (`:901`, `:908`); ordinary sleep does not count (`:912`).

Recovery value is `floor(max/3)` — `heroes:22066` is the only place the book states the
rounding ("rounded down"), confirming `StaminaBar.recoveryValue`.

**Design consequence:** the **minus** direction must be first-class and reach 3 in one
gesture (→ markers set rather than toggle). The **plus** direction is overwhelmingly
*undoing your own click*, not recording a rules event — so it must exist and stay quiet.
"Add a recovery" needs no prominent button.

## Verification

**Round-4 probe** — `round4-probe.mjs` in this directory, both schemes, every strip. It
does not resolve `playwright` from here; copy it into the (gitignored)
`draw-steel-elements/visual-harness/shots-candidates/` and run it from the repo root:

```bash
cp round4-probe.mjs <dse>/visual-harness/shots-candidates/
devbox run -- bash -c 'cd <dse> && node visual-harness/shots-candidates/round4-probe.mjs'
```

```
[*] shield opacity  S0=1 S1=1 S2=0.78 S3=1
[*] px-per-point    pour 7.6289  sub 7.6277        (P2 and P3, both schemes)
[*] markers         R2 15.11px · R3 14.8px r=50% · R5 glyph=true · R6 20.94x13.83 skew
[*] grouping        g3@8:[3,6] g3@12:[3,6,9] g4@8:[4] g4@12:[4,8] g5@8:[5] g5@12:[5,10]
[*] LF2 tips        derived per state, not hard-coded
[*] interact        undo lum 235 on ground 49 · post-change strip shows 4 markers
all round-4 variant checks PASSED in both schemes
```

Asserted, not eyeballed: the shield **material never moves temp's geometry** (lefts/widths
byte-identical across all four options per state); the sub-bar's **lane box == channel
box** and its **origin == the pour's origin**; `--dse-max-x` is exactly `100%` and the
base-max index is `display:none` under P2/P3; **no numeric fraction is visible in any
labelling option** (the ruling, as a test); R6's box is identical between states.

### Two light-scheme defects the probe caught

Both would have shipped from eyeballing the dark boards, and both are the round-1
`<html>`-attr specificity trap:

1. **R6's spent cell rendered FILLED on light.** The base pip's `body.theme-light` twin
   sets a background on every pip and out-specifies the dark-only variant rule. Adding a
   light twin for R6 then out-specified **R6's own `--filled` rule**, so the fill vanished
   on light instead — both twins now exist and are **source-ordered** (equal specificity,
   so order decides).
2. **The Undo link was invisible on light** — luminance **50 on a ground of 49**. An
   Obsidian Notice keeps a dark ground in *both* schemes, so a scheme-following token
   (`--dse-metal-bright` → near-black on light) is wrong by construction there. Fixed ink.

## Battery (verbatim, real exit codes, nothing piped)

```
npm run tsc      exit 0  (no output)
npx jest         exit 0  Test Suites: 155 passed, 155 total
                         Tests:       2337 passed, 2337 total
                         Snapshots:   3 passed, 3 total
npm run shots    exit 0  204 ok, 0 FAIL
check-freeze.sh  exit 0  freeze OK (119/119 legacy+print PNGs byte-identical)
npm run parity   exit 0  0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).
```

**Jest count explained:** main baseline is 2335. The branch adds **+2**, and they are not
new test files — `test/dom/kit/kit-index.test.ts` has two `test.each(kitFiles)` blocks that
enumerate `src/framework/kit/*.ts`, and the branch adds one module there
(`staminaCandidate.ts`). 2 blocks × 1 file = 2.

**Shots is 204**, matching main. The round-3 report's 199 predated SC-128; the branch adds
no swept shots (candidate fixtures are off the manifest by construction).

`check-freeze.sh` needs its SHOTS_DIR argument here — the script's default still points at
the `steel-type` worktree.

`obsidian-shots` was NOT run: `pgrep -af obsidian` shows Scott's live vault owning the
display.

## Files changed (all inside the harness-gated candidate region)

| File | Change |
|---|---|
| `visual-harness/entry.ts` | 6 round-4 `STRIPS`, 2 fixtures (`rec-12`, `rec-12-full`), `mockTip()`, and `decorateStripCell` extensions: grouping stamps, the sub-bar lane + pure-max re-derivation, the interaction poses, the Undo notice, the stepper popover |
| `visual-harness/index.html` | strip chrome for the one-column `interact` layout |
| `visual-harness/strips.mjs` | 6 new strip ids in `ALL` |
| `styles-source.css` | the round-4 variant block (S/P/R5/R6/rr/G/LF/I), inside the existing candidate region |

`src/` is **untouched** in round 4 (as in round 3), so jest, the swept shots and the freeze
surface cannot move by construction.

## Boards on disk

`round4-{temp-shield,temp-place,rec-shape2,rec-group,rec-final,interact}.png` — each the
dark board stacked over the light board (`magick … -append`). Per-scheme originals:
`draw-steel-elements/visual-harness/shots-candidates/strip--*.png`.

## Open for round 5

The five questions in the Linear ask (temp treatment + the token question, placement,
marker shape, group size, interaction model). Once those land, the remaining unanswered
thing from round 2 is still **the layout pick** (A/B/C/D, or the per-context set Scott
floated) — he has deliberately deferred it through three rounds until the components
settled, and after round 4 they nearly have.
