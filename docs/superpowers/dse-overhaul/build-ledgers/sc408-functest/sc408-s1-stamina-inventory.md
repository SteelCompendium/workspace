# SC-408 S1: stamina modal interaction inventory, coverage map, bug probes

**Executive summary** (dse `sc408-functest` @ `be4f002`; tree clean before and after)
1. **150 interactions** across StaminaEditModal, MinionStaminaPoolModal, 4 hosts (ds-stamina, ds-hero, initiative hero/creature/captain/minion) and RecoveriesStrip.
2. Coverage: **101 jsdom**, **9 real-Obsidian** (G-S1/G-S2 + camera; 2 with no jsdom test), **47 UNCOVERED**, **17 needs-real-obsidian**. No real-Obsidian scenario applies a stamina edit and checks the note.
3. Existing suites: **11 suites, 405/405 pass**. Probes: 34 jsdom (26 red, 8 green) + 1 Chromium.
4. **HIGH B1**: ds-hero with an unresolved class (max → 0): any modal Apply writes `current: 0` (31, "Lose 5", then 0 written). Experimental-gated.
5. **MED B2**: initiative grid double-click on the *selected* instance leaves the detail row stale (shows 40/40, persists 10). **MED B3**: a typed stamina outside [floor, max] makes the Apply label lie ("Gain 20" but +10 applied).
6. **MED B4**: Catch Breath at full stamina spends a Recovery for +0 (ds-stamina + ds-hero). **MED B5**: Spend Recovery on untracked bars (initiative heroes, all creatures) heals free with no limit (0 → 78/80 in 3 presses).
7. **MED B6**: temp minus is enabled but a silent no-op (pinned by SEM RC-5; breaks CB-8). **MED B7** (Chromium-confirmed, needs Obsidian confirmation): type in Stamina, then click the disabled Apply; the blur enables it but that click is swallowed.
8. **LOW B8–B16**: out-of-range Damage heals / Healing damages / Kill says "Gain"; "1e3" parsed as 1; Reset keeps the Apply box; pool count max counts dead; pool stuck all-checked; pool focus on "Decrease"; "0 damage will kill 0"; popover Catch breath never disabled; wrong tooltip when recoveryValue is 0.

---

## 1. Method and evidence

- Read: `src/views/StaminaEditModal.ts`, `src/views/MinionStaminaPoolModal.ts`, `src/framework/kit/{stepper,managedModal,StaminaBarPanel,RecoveriesStrip}.ts`, `src/elements/{stamina-bar,hero,initiative}/view.ts`, `src/model/StaminaBar.ts`, `visual-harness/obsidian-lifecycle.mjs` (G-S1/G-S2/G-S3), `visual-harness/obsidian-camera.mjs` (MODAL_SHOTS, canvas read-only).
- Existing-suite run: `npx jest` on the 11 suites listed above. rc=0. Logs:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/sc408-s1-existing.log`, per-suite JSON `…/scratchpad/sc408-s1-existing.json`.
  I did **not** `rm -f main.js styles.css`: another sc408 worker was running `obsidian-lifecycle` (port 9308) from this worktree, and its fresh `main.js` (15:12) was in use. None of the 11 suites imports `../main` relatively; they use the `'main'` mapper → `main.ts`. So the stale-bundle footgun does not apply.
- Probes: 3 throwaway files `test/dom/views/sc408-probe-{modals,hosts,hero}.test.ts`, run, then deleted. Source:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-s1-probes.ts.txt`. Final run JSON/log:
  `…/scratchpad/sc408-s1-probes-final.json`, `…/scratchpad/sc408-s1-probes-final.log`.
- Chromium semantics probe (Playwright, isolated page, not Obsidian): `…/scratchpad/chromeprobe/probe.cjs`, output `…/scratchpad/chromeprobe/out4.json`.
- `git -C …/draw-steel-elements status --short` was empty after deletion. The superproject worktree was also clean.

**Coverage keys.** SEM = `test/dom/views/stamina-edit-modal.test.ts` · MSP = `test/dom/views/minion-stamina-pool-modal.test.ts` · SB = `test/dom/elements/stamina-bar.test.ts` · SR = `test/dom/elements/staminaRecoveries.test.ts` · INI = `test/dom/elements/initiative.test.ts` · S417 = `test/dom/elements/initiative-sc417-minion-squad.test.ts` · HERO = `test/dom/elements/heroSheet.test.ts` · KST = `test/dom/kit/stepper.test.ts` · KSB = `test/dom/kit/staminaBarPanel.test.ts` · KMM = `test/dom/kit/managedModal.test.ts`. Real: `G-Sx` = `obsidian-lifecycle.mjs` scenario; `cam:<id>` = `obsidian-camera.mjs` capture. **NRO** = jsdom cannot test this faithfully (real focus/blur order, hit-testing, Obsidian modal scope/Escape/backdrop, the real write → adoption lifecycle). File paths below are relative to `draw-steel-elements/`. SEM = StaminaEditModal.ts and MSP = MinionStaminaPoolModal.ts when used in the Source column.

## 2. Interaction inventory and coverage map

### E. Entry points (opening a modal)

| ID | Surface / control | Action | Precondition | Expected outcome | Source | jsdom | Real | Flag / probe |
|---|---|---|---|---|---|---|---|---|
| E01 | ds-stamina bar | click | canPersist | StaminaEditModal opens (isHero=true, title "Stamina") | stamina-bar/view.ts:122,150-161 | SB › "clicking the bar opens the kit DseModal-based StaminaEditModal" | cam:modal-stamina | |
| E02 | ds-stamina bar | click / hover | canPersist=false (print, canvas) | inert, tooltip "Read-only in this context", no modal | stamina-bar/view.ts:108-124; StaminaBarPanel.ts:128-134 | SB › canPersist:false; KSB › canPersist false | cam:canvas--obsidian-readonly (render only) | |
| E03 | ds-stamina | render | `style: sheet` | notice, no bar, no modal | StaminaBarPanel.ts:95-98 | SB › "style: sheet…"; KSB | — | |
| E04 | ds-hero stamina bar | click | not readOnly | modal over a bridge StaminaBar (derived recoveryValue; spendRecovery = tracked) | hero/view.ts:324-336,364-397 | HERO › "dropping stamina to <= 24…", SC-132 H1 suite | — | |
| E05 | ds-hero stamina bar | click | readOnly | inert, no modal | hero/view.ts:328 | HERO › "read-only mount…" | — | |
| E06 | ds-hero stamina bar | click, then any Apply | class unresolved (`maxStamina.value === null`) | modal must not zero Stamina | hero/view.ts:371,401 | UNCOVERED | — | **P50 BUG B1 HIGH** |
| E07 | initiative hero numeric control | click | canWrite | StaminaEditModal(isHero true, "<name> Stamina") | initiative/view.ts:1429-1447 | INI › "hero stamina modal: edit -> in-place display refresh…" | — | |
| E08 | initiative hero row bar (Steel) | click | canWrite | same modal as E07 | initiative/view.ts:1454,1096-1120 | INI › "clicking the hero bar opens the SAME stamina modal…" | — | |
| E09 | initiative detail numeric (creature) | click | canWrite, non-minion | StaminaEditModal(isHero false) | initiative/view.ts:1765-1797 | INI › "creature stamina modal (detail row)…" | G-S2 (opens 150/380 ms after a selection write; no edit) | |
| E10 | initiative detail row bar (creature) | click | canWrite | same modal as E09 | initiative/view.ts:1803 | INI › "creature modal apply syncs the detail bar AND the right cell mini…" | — | |
| E11 | initiative grid cell | dblclick | non-minion | modal for THAT instance | initiative/view.ts:1651-1676 | INI › "cell dblclick (non-minion)…" | — | NRO (a real dblclick = 2 selection clicks/writes first) |
| E12 | initiative grid cell | dblclick, then Apply | cell is the SELECTED (detail-row) instance | detail-row numeric and bar follow the edit | initiative/view.ts:1665-1674 (passes `barEl=null,rowEl=null`) | UNCOVERED | — | **P30 BUG B2 MED** |
| E13 | captain (squad non-minion) | modal Apply crossing 0 | captain bonus folded | badge flips; bonus transition → coarse rebuild | initiative/view.ts:1838-1872 | INI › SC-195 "the captain dying removes N…", "a down captain healed back…", "dropping the captain to 0 flips the badge in place" | — | |
| E14 | squad minion grid cell | dblclick | is_squad, minion | MinionStaminaPoolModal; Apply → rebuildAndPersist | initiative/view.ts:1652-1660 | INI › "grid dblclick (kill flow)…"; S417 A/B | G-S1 (grid site) | |
| E15 | squad minion detail numeric / bar | click | is_squad, minion | pool modal; Apply → rebuildAndPersist | initiative/view.ts:1766-1779 | INI › "detail-row click (damage only)…"; S417 HIGH-1 | G-S1 (detail site) | |
| E16 | DEAD squad-minion detail control ("DEAD") | click | instance isDead | opens the squad pool modal | initiative/view.ts:1792-1798 | UNCOVERED | — | |
| E17 | initiative (any stamina control) | click | canPersist=false | static spans, inert bars, no modal | initiative/view.ts:958-973,1096-1120 | INI › "canPersist=false — inert tracker…", "read-only: bars render inert…" | — | |
| E18 | any opened modal | view unload | modal open | modal closes (openManagedModal / initiative activeModal) | managedModal.ts:143-148; initiative/view.ts:138-152 | SB › "a modal opened by the view is closed on view unload"; INI › "T-9: modal lifecycle"; KMM openManagedModal | — (G-S6b/G-S6e don't open a stamina modal) | NRO |
| E19 | any opened modal | own-block write lands while open | adoption ON | modal stays open, tracker adopted | framework/host/adoptView | (jsdom cannot) | G-S1 (pool, 2 removals × 2 sites), G-S2 (stamina) | NRO |
| E20 | initiative grid cell | real dblclick | selection write between the 2 clicks | modal opens for the right instance; no stray rebuild | initiative/view.ts:1617-1676 | UNCOVERED | — | NRO |
| E21 | Steel row bar vs stood-down numeric control | real click | Steel theme | click hits the bar; modal opens | initiative/view.ts:1096-1120 | UNCOVERED | — (camera shows the look only) | NRO (hit-testing) |

### M. StaminaEditModal: render and open

| ID | Surface | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| M01 | title | open | name / '' | "<name> Stamina" / "Stamina", aria-labelledby | SEM:248; managedModal.ts:74-80 | SEM › "modal is a kit DseModal…" | — | |
| M02 | initial focus | open | — | first focusable = Apply box | managedModal.ts:127 | KMM › "open() focuses the first control"; probe P13 green | cam:modal-stamina (ring check) | |
| M03 | preview bar | open | hero vs creature | dying zone only for hero | SEM:89-92,271 | SEM › "hero preview bar renders the Dying zone…"; "a CREATURE modal… channel edge" | — | |
| M04 | preview gauge | any pending change | temp > 0 | temp drawn; delta band direction | SEM:109-119,295-306 | SEM › RC-1/RC-2 suite (6 tests) | — | |
| M05 | Spend Recovery | open | recoveries 0 | starts disabled + reason tooltip | SEM:579-603 | SEM › "mounts already at 0 recoveries…" | — | |
| M06 | Spend Recovery | open | untracked, at max | starts disabled "Already at maximum Stamina" | SEM:597-603 | SEM › "untracked bar already at max…" | — | |
| M07 | Apply (footer) | open | — | disabled "No Stamina Change" | SEM:536-541 | SEM › "CB-8: the apply button uses the REAL disabled property…" | — | |
| M08 | layout | open / Spend Recovery | real theme | body never scrolls sideways; focus ring inside body | styles + camera gate | (jsdom cannot) | cam:modal-stamina, cam:modal-stamina-recovery | NRO |

### A. Apply box, Damage, Healing

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| A01 | Damage | type N, click | no temp | pending −N, "Lose N Stamina" | SEM:328-357 | SEM › "a positive Apply input still works normally…" | — | |
| A02 | Damage | click | temp present | temp absorbs first | SEM:344-347 | SEM › "8 damage against 5 temp…", "3 damage against 5 temp…" | — | |
| A03 | Damage | click | hero, huge N | capped at ceil(−max/2) | SEM:348-351,664-666 | SEM › "damage cannot push a hero past the death floor" | — | |
| A04 | Damage | click | creature, huge N | capped at 0 | SEM:255,348-351 | SEM › "amountToDeath / amountToMaxStamina…" (helper) | — | |
| A05 | Damage | click repeatedly | — | accumulates | SEM:348 | UNCOVERED (P16 green) | — | |
| A06 | Damage | click | negative N | no-op (never mints temp) | SEM:341 | SEM › RC-3 suite | — | |
| A07 | Damage / Healing | click | box empty / non-numeric | silent no-op | SEM:335-336,365-366 | UNCOVERED | — | |
| A08 | Damage / Healing | click | "2.9" | applies 2 (parseInt) | SEM:335,365 | UNCOVERED | — | |
| A09 | Damage / Healing | click | "1e3" (a valid number-input value) | should apply 1000 (capped) | SEM:335,365 | UNCOVERED | — | **P04 BUG B9 LOW** (applies 1) |
| A10 | Damage | click | creature current −3 (out of range) | must not heal | SEM:348-351,664-666 | UNCOVERED | — | **P09 BUG B8 LOW** (pending +3) |
| A11 | Healing | click | — | +min(N, distance to max) | SEM:370-373 | SEM › "healing clamps at max stamina" | — | |
| A12 | Healing | click | temp present | temp untouched | SEM:370 | SEM › I5 "healing never touches temp stamina" | — | |
| A13 | Healing | click | negative N | no-op | SEM:369 | SEM › RC-3 suite | — | |
| A14 | Healing | click | current 25 > max 20 | must not damage | SEM:370-373,660-662 | UNCOVERED | — | **P10 BUG B8 LOW** (pending −5) |
| A15 | Healing | click | hero dying (current < 0) | heals from negative, capped at max | SEM:370-373 | UNCOVERED | — | |
| A16 | Apply box | Enter | value typed | nothing is wired (no Damage/Heal) | SEM:316-326 | UNCOVERED | — | P05 observation (UX gap) |
| A17 | Apply box | — | — | `min="0"` attribute | SEM:326 | SEM › "the Apply input carries min=\"0\"…" | — | |
| A18 | Apply box | ArrowUp/Down, spinner | real browser | value steps, never below 0 | native | UNCOVERED | — | NRO |

### S. Stamina stepper (`staminaStepperRow`, unbounded)

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| S01 | ± buttons | click | — | pending ±1, label updates | SEM:404-416; stepper.ts:112-138 | SEM › "the stamina stepper edits pending stamina: ± steps and a typed commit (Enter)…" | — | |
| S02 | input | type + Enter | — | commits | stepper.ts:187-191 | same SEM test | — | |
| S03 | input | type + blur | — | commits once | stepper.ts:211-214 | KST › "blur alone commits once" | — | NRO |
| S04 | input | type "7.5" | — | commits 7 | SEM:150; stepper.ts:185 | SEM › "typed decimals integer-coerce…" | — | |
| S05 | input | type "" / junk | — | reverts, no commit | stepper.ts:176-179 | KST › "an empty/invalid draft reverts…" | — | |
| S06 | input | Escape | dirty draft | reverts; key swallowed so the modal stays open | stepper.ts:191-199 | KST › "Escape reverts the draft…"; P12 green (jsdom) | — | NRO (whether Obsidian's modal Scope still closes on it) |
| S07 | input | Escape | clean draft | bubbles; modal closes; nothing persisted | stepper.ts:191-199 | UNCOVERED (P44 stand-in green) | — | NRO |
| S08 | input | type 30 | max 20, cur 10 | label = persisted delta | SEM:410-412,669-697 | UNCOVERED | — | **P02 BUG B3 MED** ("Gain 20", persists +10) |
| S09 | input | type −5 | creature, cur 10 | label = persisted delta | same | UNCOVERED | — | **P03 BUG B3 MED** ("Lose 15", persists −10) |
| S10 | input then + | type 22, press + | max 20 | (KNOWN DEVIATION, comment SEM:383-392) shows 23, persists 20 | SEM:383-416 | UNCOVERED (comment only) | — | P17 confirms; documented |
| S11 | ± | click | unbounded | never disabled | stepper.ts:149-150 | KST › "unbounded steppers never disable their buttons" | — | |
| S12 | input | Enter then blur | — | one onChange (CB-10) | stepper.ts:161-170 | KST › "Enter commits ONCE…" | — | |
| S13 | input then Apply | type value, click the DISABLED Apply directly | no other pending change | value commits AND applies | stepper.ts:211-214; SEM:536-558 | UNCOVERED | — | NRO · **B7 MED** (Chromium: blur enables Apply, click swallowed) |
| S14 | input then Damage | type value, click Damage | — | blur commits first, then Damage applies on top of the typed value | stepper.ts:211-214 | UNCOVERED | — | NRO (Chromium order: mousedown → blur/commit → click, correct) |

### T. Temporary Stamina stepper (min 0, take-higher)

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| T01 | + | click | temp 0 | +1 | SEM:423-450 | SEM › "granting from a temp of 0…" | — | |
| T02 | input | type higher | temp 5 | raises to typed | SEM:444-445 | SEM › "typing a grant higher…" | — | |
| T03 | input | type lower | temp 5 | unchanged (RAW take-higher) | SEM:444 | SEM › "typing a grant lower…", "equal…", "9 then 3 stays 9" | — | |
| T04 | − | click | temp > 0 | (expected: does something or is disabled) | SEM:444-445 | SEM › "the minus button cannot walk temp below the session-start value" (pins the no-op) | — | **P01 FLAG B6 MED** (enabled, silent no-op) |
| T05 | − | click | temp 0 | real-disabled | stepper.ts:149 | SEM › "the temp stepper is floored at 0…" | — | |
| T06 | +/−/type | after Damage absorbed temp | running < start | floors at running position | SEM:444 | SEM › C1 A1/A2/A4 | — | |
| T07 | + | after Kill / Full Heal | running 0 | grants from 0 | SEM:462-477 | SEM › C1 "Kill zeroes temp…", "Full Heal zeroes temp…" | — | |
| T08 | + ×3 | click | temp 5 | walks to 8 (stacks; RAW says don't) | SEM:444 | SEM › I4 characterization ("SC-132 must resolve") | — | FLAG LOW (known open) |
| T09 | input | type "2.5" | — | commits 2 | SEM:429; stepper.ts:185 | KST › integer suite (kit level) | — | |
| T10 | input | type −3 | — | clamps 0, no change | stepper.ts:185 | KST › "truncation runs BEFORE clamping…" | — | |

### Q. Quick actions

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| Q01 | Kill | click | hero | current → ceil(−max/2), temp → 0 | SEM:454-468 | SEM › "hero with max 15: Kill floors at -7…" | — | |
| Q02 | Kill | click | creature | current → 0 | SEM:462 | SEM › "non-hero: Kill floors at 0" | — | |
| Q03 | Kill | click | hero current −10, floor −7 | label must not say "Gain" | SEM:462,669-697 | UNCOVERED | — | **P11 BUG B8 LOW** ("Gain 3 Stamina") |
| Q04 | Full Heal | click | temp present | current → max; **temp → 0** | SEM:469-482 | SEM › "Full Heal restores max and zeroes temp" | — | P15 design note (Full Heal discards temp) |
| Q05 | Full Heal / any Apply | click | max = 0 (ds-hero unresolved) | must not zero current | SEM:476,543-548,608-612 | UNCOVERED | — | **P07 + P50 BUG B1 HIGH** |
| Q06 | Spend Recovery | click | — | heals recoveryValue (override wins) | SEM:494-517,647-658 | SEM › "Spend Recovery heals floor(max/3)"; HERO › "heals at the SHEET's derived rate" | cam:modal-stamina-recovery (click, layout only) | |
| Q07 | Spend Recovery | click + Apply | tracked | recoveries −1 written | SEM:515,552-554 | SEM › "decrements the recoveries counter on Apply…"; HERO › "actually DECREMENTS the pool…" | — | |
| Q08 | Spend Recovery | 2 presses | tracked | heals twice, −2 | SEM:515 | SEM › "two presses before Apply…" | — | |
| Q09 | Spend Recovery | click | 0 left | disabled + "No Recoveries remaining", swallows clicks | SEM:582-596 | SEM › "real-disables at zero…", "a disabled button swallows further clicks…" | — | |
| Q10 | Spend Recovery | click | next press heals 0 | disabled + "Already at maximum Stamina" | SEM:579,595,601 | SEM › I3 two tests | — | |
| Q11 | Spend Recovery | state changes | — | aria-label lifecycle restored | SEM:594-596 | SEM › "aria-label lifecycle…" | — | |
| Q12 | Spend Recovery | click | pending past a clamp (typed overshoot) | heals from the clamped position | SEM:647-658 | SEM › I2 two tests | — | |
| Q13 | Spend Recovery | click ×N | untracked (initiative hero, any creature, legacy ds-stamina) | (expected: no free heal) heals, spends nothing, no limit | SEM:488-517 | SEM › "Spend Recovery heals floor(max/3)" (pins it on an untracked bar) | — | **P14 + P31 FLAG B5 MED** |
| Q14 | Spend Recovery | — | `spendRecovery:false` (ds-hero, no pool) | control not rendered | SEM:488; hero/view.ts:394 | UNCOVERED | — | |
| Q15 | Spend Recovery | click | hero dying | allowed (heals from floor) | SEM:512-516 | UNCOVERED | — | |
| Q16 | Spend Recovery | — | recoveryValue 0 (max ≤ 2) | permanently disabled, tooltip says "Already at maximum Stamina" | SEM:640-643 | UNCOVERED | — | B16 LOW (wrong reason text) |

### F. Footer

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| F01 | Apply | label | any pending mix | "Lose/Gain N Stamina [and Gain/Lose M Temp Stamina]" | SEM:669-697 | SEM (many); P16 green | — | |
| F02 | Apply | — | pending ≠ 0 | enabled; disabled again at 0 | SEM:696 | SEM › CB-8 apply test | — | |
| F03 | Apply | click | disabled | swallowed, no callback | kit iconButton | SEM › "a disabled apply button swallows synthetic clicks…" | — | |
| F04 | Apply | click | pending | clamp, write model (current/temp/recoveries ≥ 0), callback once, close | SEM:541-557 | SEM T-5 suite; SB › "applying Full Heal… byte-exact YAML" | — | |
| F05 | Reset | click | pendings | all pendings 0, Spend Recovery re-enabled | SEM:524-535 | SEM › "Reset restores the pending recoveries change…" | — | |
| F06 | Reset | click | Apply box typed | box cleared (as the pool modal does) | SEM:529-534 | UNCOVERED | — | **P06 BUG B10 LOW** (box keeps "7") |
| F07 | close (Esc / X / backdrop) | — | pending | nothing persisted | Obsidian Modal | UNCOVERED (P44 stand-in green) | — | NRO |
| F08 | Apply | click | max undefined | must not write NaN | SEM:608-612 | UNCOVERED | — | P08: NaN at modal level, **unreachable** (P32: initiative rejects a missing max with an error card; ds-stamina schema requires it; ds-hero bridges `?? 0`). Latent only. |

### W. Persistence per host

| ID | Host | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| W01 | ds-stamina | Apply | — | in-place bar refresh, ONE debounced byte-exact write | stamina-bar/view.ts:155-160 | SB › "applying Full Heal…", "a stepper edit updates the bar IN PLACE…", FakeVault "exactly one Vault write" | — | |
| W02 | ds-stamina | 2 Applies inside one debounce | — | one write carrying the second edit | framework/view persist | UNCOVERED (P43 green) | — | |
| W03 | ds-stamina | Apply | recoveries_max set | winded badge + Catch Breath state refresh | stamina-bar/view.ts:145-148,187-198 | SR › "editing stamina via the modal refreshes the winded/dying badge…" | — | |
| W04 | ds-hero | Apply | — | state.stamina current/temp (+ recoveries if tracked), bar + conditions-region refresh, persist | hero/view.ts:385-391,500-504 | HERO › "dropping stamina…", "the modal also writes back the temp Stamina…" | — | |
| W05 | initiative hero | Apply | — | numeric + bar + state chip in place, one write | initiative/view.ts:1431-1441 | INI › "hero stamina modal…", "clicking the hero bar…", "a stamina edit repaints the chip in place…" | — | |
| W06 | initiative creature (detail) | Apply | — | detail + bar + grid cell + mini (CB-6 keyed), one write | initiative/view.ts:1852-1895 | INI › "creature stamina modal (detail row)…", "CB-6…troll…", "creature modal apply syncs…" | — | |
| W07 | initiative squad pool | Apply | — | whole-view rebuild + one write | initiative/view.ts:161-168 | INI › T-9 pool tests; S417 A/B/HIGH-1 | — | |
| W08 | any | external edit while a stamina modal is open | — | view rebuilt fresh; the stale modal closes and cannot overwrite | adoptView; managedModal.ts:143-148 | UNCOVERED | — (G-S5 covers the rebuild, not an open modal) | NRO |
| W09 | any | full edit → note bytes, in real Obsidian | — | the note carries the edit; integrity ok | — | (jsdom fakes the host) | **none**: no lifecycle scenario applies a stamina/pool edit | NRO · UNCOVERED |

### PM. MinionStaminaPoolModal

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| PM01 | open | — | squad | title, a row per ALIVE minion, ticks per ORIGINAL amount | MSP:64-82,164-195 | MSP › "same .dse-modal scaffold…"; SC-195 ticks | (G-S1 opens it) | |
| PM02 | initial focus | open | — | not a destructive control | managedModal.ts:127 | UNCOVERED | — | **P23 BUG B13 LOW** (focus = "Decrease Stamina pool") |
| PM03 | pool stepper ± | click | bounded [0, max] | pending ±1 | MSP:93-107 | S417 › "stepper Decrease button…"; MSP › stepper bound | — | |
| PM04 | pool stepper input | type | out of range / decimal | clamp at commit, truncate | MSP:93-107 | MSP › "typed decimals…"; S417 › "typing 75…" | — | |
| PM05 | Apply Damage | dmg × count | — | pending −dmg×count | MSP:135-158 | MSP kill/CB-1; INI applyPoolDamage | — | |
| PM06 | Apply Damage | negative dmg/count | — | no-op | MSP:149-151 | MSP › SC-241 (5 tests) | — | |
| PM07 | Apply Damage | non-numeric | — | silent no-op | MSP:142-144 | UNCOVERED | — | |
| PM08 | count box | — | 2 of 5 dead | max = 3 living | MSP:130 | UNCOVERED | — | **P20 BUG B11 LOW** (max 5; overcounts damage, clamped at 0) |
| PM09 | Apply Damage | repeated | — | accumulates | MSP:152 | UNCOVERED | — | |
| PM10 | info text | pending damage | — | "N damage will kill K minion(s)…" | MSP:346-358 | MSP › T-4 test.each | — | |
| PM11 | checkboxes | pending kills K | — | enable up to K, rest disabled | MSP:410-439 | MSP › "checkbox availability…" | — | |
| PM12 | minion name | click | box enabled | toggles box, re-evaluates Apply | MSP:185-191 | UNCOVERED (P24 green) | — | |
| PM13 | minion name | click | box disabled | no-op | MSP:186 | UNCOVERED | — | |
| PM14 | Apply | — | selection ≠ K | disabled + title "Select K minion(s)" | MSP:369-389 | MSP › "CB-8: the apply button is REAL-disabled until…" | — | |
| PM15 | boxes | pool → ≤ 0 | — | all auto-checked + disabled | MSP:414-419 | S417 › "pool to exactly 0 auto-selects…" | — | |
| PM16 | boxes | pool → 0, then stepper + | — | Apply reachable without manual fix-up | MSP:410-439 | UNCOVERED | — | **P22 BUG B12 LOW** (5 stay checked, 4 needed, Apply disabled) |
| PM17 | Apply title | K drops after selection | 2 checked, 1 needed | title explains the over-selection | MSP:388-389 | UNCOVERED | — | P26 observation: says "Select 1 minion(s) to kill" while 2 are selected |
| PM18 | Apply Damage | overkill whole squad | — | all living die, pool 0 | MSP:298-299 | S417 › MEDIUM-1 (3 tests) | — | |
| PM19 | stepper + | heal inside bracket | — | allowed, warning icon, "dead stay dead" | MSP:352-353,401-407 | S417 › B heal tests; MSP › healing warning | — | |
| PM20 | stepper + | heal across a dead bracket | — | refused, reason text + aria | MSP:348-351,390-396 | S417 › LOW-1, LOW-R5 | — | |
| PM21 | Reset | click | pending + checks + inputs | everything reset | MSP:198-214 | UNCOVERED | — | |
| PM22 | Apply | click | valid | setMinionPool (clamped), isDead on checked, persist once, close | MSP:220-240 | MSP › kill flow, CB-1 | — | |
| PM23 | condition icon | click | conditions present | removed + persisted immediately | MSP:474-482 | MSP › CB-2 | G-S1 (2 removals × grid/detail; modal stays open) | |
| PM24 | condition icon, then cancel | click, then Esc | — | removal already persisted (no undo) | MSP:481 | UNCOVERED | — | P25 design note |
| PM25 | condition icon + Apply | same session | — | both persist (DC-6) | MSP:481,238 | MSP › DC-6 | — | |
| PM26 | close | no change | — | no write | — | MSP › "closing with no condition edit at all persists nothing" | — | |
| PM27 | info text | at rest (pending 0) | — | neutral text | MSP:354-357 | UNCOVERED | — | **P21 BUG B14 LOW** ("0 damage will kill 0 minion(s). Select 0…") |
| PM28 | ladder divisor | — | captain bonus flag | uses the PERSISTED flag | MSP:278-310 | MSP › SC-195 + HIGH-1 probes | — | |
| PM29 | ladder | — | underfunded pool | ladder + 2 clamps | MSP:293-308 | S417 › round 4 (5 tests) | — | |
| PM30 | close (Esc / X / backdrop) | — | pending | nothing persisted | Obsidian Modal | UNCOVERED | — | NRO |
| PM31 | condition icon look | render | custom color/effect | validated helpers | MSP:469-472 | MSP › color/effect tests (3) | — | |

### R. RecoveriesStrip (adjacent to the modal: Catch Breath and markers)

| ID | Control | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| R01 | Catch Breath | click | recoveries > 0, not dying | heal recoveryValue (capped), −1, persist, undo toast | stamina-bar/view.ts:222-240; hero/view.ts:460-480 | SR › "Catch Breath: heals floor(48/3)=16…"; "Catch Breath posts a toast too…" | — | |
| R02 | Catch Breath | — | 0 left / dying / read-only | real-disabled | stamina-bar/view.ts:196; hero/view.ts:426 | SR (3 tests); HERO read-only | — | |
| R03 | Catch Breath | click | current = max | (expected: disabled like the modal's Spend Recovery) | stamina-bar/view.ts:196; hero/view.ts:426 | UNCOVERED | — | **P40 + P51 BUG B4 MED** (spends 1 for +0) |
| R04 | markers | click | — | sets the count (Model M) | RecoveriesStrip.ts:210-220 | SR › Model M (5 tests) | — | |
| R05 | markers | Arrow/Home/End | focused | ±1 / 0 / max | RecoveriesStrip.ts:222-258 | SR › "the row is ONE keyboard value control…" | — | |
| R06 | undo toast | Undo | — | restores; one-shot; one live | stamina-bar/view.ts:209-213 | SR › undo suite (6) | — | |
| R07 | popover (pref on) | click / keys / outside click | — | opens; ± commit; dismiss | RecoveriesStrip.ts:175-266 | SR › popover suite (5) | — | |
| R08 | popover "Catch breath" | click | 0 left or dying | disabled like the strip's button | RecoveriesStrip.ts:196-201 | UNCOVERED | — | **P41 BUG B15 LOW** (enabled, silent no-op) |
| R09 | popover | Escape | open | closes | RecoveriesStrip.ts:223-225 | UNCOVERED | — | |
| R10 | strip | any | read-only | inert | RecoveriesStrip.ts:267-270 | SR › read-only tests | — | |
| R11 | ds-hero markers | click | — | sets count, persists | hero/view.ts:433-445 | HERO › "a recovery-marker click on the sheet…" | — | |
| R12 | ds-hero Catch Breath vs modal | click | — | same heal as the modal's Spend Recovery | hero/view.ts:460-480 | HERO › "…same amount its own Catch Breath does" | — | |

### K. Modal infrastructure

| ID | Surface | Action | Precondition | Expected | Source | jsdom | Real | Flag |
|---|---|---|---|---|---|---|---|---|
| K01 | DseModal | close twice / unload | — | idempotent; listeners die | managedModal.ts:130-135 | KMM (4 tests) | — | |
| K02 | DseModal | open | theme / prefs | stamps theme + css prefs, live re-stamp | managedModal.ts:113-123 | KMM (10 tests) | — | |
| K03 | stacking | open a second modal while one is open | — | sane stacking, Escape closes the top one only | Obsidian | UNCOVERED | — | NRO |

**Tally:** 150 rows. Covered in jsdom: 101. Covered in real Obsidian: 9 (E01, E02, E09, E14, E15, E19, M02, M08, PM23); E19 and M08 have no jsdom test. Uncovered: 47. NRO-flagged: 17 (E11, E18, E19, E20, E21, M08, A18, S03, S06, S07, S13, S14, F07, W08, W09, PM30, K03).

## 3. Bug details

Severity uses the brief's rubric. "Confidence" separates a real product defect from a probe artefact or a design call.

**B1 HIGH: ds-hero with an unavailable max zeroes Stamina on any modal Apply.** (P50, plus P07 at modal level)
- Steps: a `ds-hero` whose `class` does not resolve (`scc.v1:mcdm.heroes.v1/class/no-such-class`; also a compendium that is not synced, or a typo), with `state.stamina.current: 31`. Click the bar (it is clickable: pill "(31/0)", modal shows "/ 0"). Apply 5, press Damage, then Apply.
- Expected `current: 26`. Actual: the label says "Lose 5 Stamina", but `state: stamina: current: 0` is written.
- Cause: `hero/view.ts:371` bridges `maxStamina.value ?? 0`. `StaminaEditModal.clampStamina` (SEM:608-612) then clamps everything to `min(x, 0)`. Full Heal (SEM:476) also sets `current = 0`.
- Confidence: real. Probed through the real pipeline and persisted bytes. Mitigation: ds-hero is `hidden` and experimental-gated in 7.0.0.
- Fix: when max is unavailable, mount the bar read-only (or do not open the modal) with a visible reason. At minimum, skip the max-side clamp when max ≤ 0.

**B2 MED: an initiative grid double-click on the selected instance leaves the detail row stale.** (P30)
- Steps: quick-start fixture, so Orc #1 is selected and shown in the detail row. Double-click cell `0-1`, set 10, Apply.
- Expected: detail readout `10/40`, detail bar `10`. Actual: cell `10/40` ✓, write `current_stamina: 10` ✓, detail readout `40/40` ✗, detail bar `40` ✗.
- Cause: `initiative/view.ts:1665-1674` calls `openCreatureStaminaModal(..., staminaEl=<cell span>, ..., barEl=null, rowEl=null, group)`. The callback (1852-1895) refreshes only the cell.
- Confidence: real in jsdom. In real Obsidian, view adoption keeps the DOM after the write, so the staleness should persist until the next rebuild; confirm in real Obsidian.
- Fix: in the callback, also look up and refresh the detail row when `group.selectedInstanceKey === instanceKey` (numeric, bar, state chip).

**B3 MED: a typed stamina outside [floor, max] makes the preview and Apply label lie.** (P02, P03)
- Max 20, current 10, type 30: label "Gain 20 Stamina", persists 20 (a gain of 10). Creature, type −5: "Lose 15 Stamina", persists 0 (a loss of 10).
- SEM:383-392 documents the ± overshoot corridor as a KNOWN DEVIATION "pending maintainer sign-off". This label mismatch on a *plain typed value* is not documented.
- Confidence: real (wrong display, not wrong persistence).
- Fix: clamp the typed commit to [floor, max] (give the stepper `min: negativeStaminaLimit, max: maxStamina`), or compute the label from the clamped value.

**B4 MED: Catch Breath at full Stamina spends a Recovery for +0.** (P40 ds-stamina, P51 ds-hero)
- 48/48 with 6 Recoveries: the button is enabled; a click writes `recoveries: 5` and Stamina stays 48.
- The modal's Spend Recovery real-disables in exactly this state, with "Already at maximum Stamina" (SC-133 I3).
- Cause: `stamina-bar/view.ts:196` and `hero/view.ts:426` gate on `dying || remaining <= 0` only.
- An undo toast exists, so this is graded MEDIUM rather than HIGH. The owner may grade it HIGH, since a wrong number is persisted.
- Fix: add `|| current >= max` (better: `recoveryHealAmount(...) <= 0`) to `catchBreathDisabled`, with a reason tooltip.

**B5 MED (design call): Spend Recovery on untracked bars heals for free with no limit.** (P14, P31)
- Initiative hero at 0/80: Spend Recovery ×3, then Apply → `78/80`, with no pool decremented anywhere.
- The same holds for every initiative creature (monsters have no Recoveries in Draw Steel) and for a legacy ds-stamina without `recoveries_max`.
- It is pinned as intended by SEM "Spend Recovery heals floor(max/3)" (an untracked bar). It is also exactly the defect SC-132 H1 fixed for the hero sheet (`spendRecovery:false`).
- Fix: initiative passes `{ spendRecovery: false }` for creatures, and for heroes without a pool. Owner decision on legacy ds-stamina.

**B6 MED (design call): the temp-stamina minus is enabled yet a silent no-op.** (P01)
- At temp 5, "Decrease Temporary Stamina" is enabled; a click changes nothing.
- No control can lower temp except Damage, Kill or Full Heal, so a mistyped temp 50 cannot be corrected after Apply.
- Pinned by SEM RC-5 "the minus button cannot walk temp below the session-start value". It violates the CB-8 house rule ("never a silent no-op"), which the file itself cites.
- Fix (owner/Scott call): disable minus at the take-higher floor with a reason tooltip, or allow a correction path.

**B7 MED (needs real-Obsidian confirmation): the first Apply click is swallowed after typing.**
- A Chromium page reproducing the modal's pattern: number input; Apply `disabled` until a blur commit enables it. Playwright typed "15", then a real mouse click on Apply.
- Log: `blur`, `commit->enable`, and **no `click`**. The button is enabled only after mousedown, so Chromium drops that click.
- Applies whenever the only pending change is an uncommitted draft in the Stamina or Temp field. The user must click Apply twice, or think it is broken and press Escape (losing the edit).
- Control case: typing then clicking Damage commits first and then applies Damage on top of the typed value (correct).
- Fix: keep Apply enabled while a draft is dirty (listen to `input`), or commit on `input`/`change`.
- Evidence: `…/scratchpad/chromeprobe/out4.json`.

**LOW**
- **B8 Out-of-range values invert the controls** (only reachable via hand-edited YAML, or a max that drops after the fact). Damage at creature −3 gives pending +3 (P09). Healing at 25/20 gives pending −5 (P10). Kill at hero −10, floor −7, gives "Gain 3 Stamina" (P11). Cause: `amountToDeath`/`amountToMaxStamina` go negative (SEM:660-666). Fix: `Math.max(0, …)` on both distances; label Kill from the clamped value.
- **B9 "1e3" is parsed as 1** (P04): `parseInt` on a valid number-input value (SEM:335,365). Fix: `Math.trunc(Number(v))` / `valueAsNumber`.
- **B10 Reset keeps the Apply box value** (P06; SEM:524-535). The pool modal resets its inputs (MSP:205-206).
- **B11 Pool count box max counts dead minions** (P20; MSP:130 uses `instances.length`). Overcounted damage is clamped at 0, so nothing is corrupted.
- **B12 Pool stuck all-checked** (P22): reach pool 0 (all auto-checked and disabled), then stepper + to 1. All 5 stay checked, 4 are needed, Apply is disabled with "Select 4 minion(s)". MSP:430-437 never un-checks the excess.
- **B13 Pool modal initial focus is "Decrease Stamina pool"** (P23): Space/Enter on open immediately decrements. Compare StaminaEditModal, which focuses the Apply box.
- **B14 Pool info text at rest** reads "0 damage will kill 0 minion(s). Select 0 minion(s) to kill." (P21; MSP:354-357).
- **B15 Popover "Catch breath" is never disabled** (P41; RecoveriesStrip.ts:196-201). It is a silent no-op at 0 Recoveries or while dying (the view's defensive return saves the data).
- **B16 recoveryValue 0** (max ≤ 2): Spend Recovery shows "Already at maximum Stamina" whatever the position. Acknowledged in a doc note at SEM:640-643; the reason text is wrong.

**Observations, not bugs** (for the owner to rule on):
- Full Heal discards temp (P15, legacy rule).
- A pool-modal condition removal persists immediately and survives Cancel (P25).
- Enter in the Apply box does nothing (P05).
- Standalone ds-stamina always opens with `isHero=true` (hero floor and dying zone, even for a monster block) (stamina-bar/view.ts:156).
- The temp "+" stacking (I4) is an open characterization.
- The over-selection title (P26).

**Probe artefacts / not reachable:**
- P08: NaN is persisted at modal level when `max_stamina` is undefined, but no shipped caller can pass that. P32 showed the initiative tracker rejects it with an error card ("Creature 'Blob' in group 'G' is missing or has an invalid 'max_stamina' field"), the ds-stamina schema requires it, and ds-hero bridges `?? 0` (which is B1 instead).
- P17 is the already-documented KNOWN DEVIATION.

**Green probes** (behaviour confirmed, coverage gap only): P12 Escape on a dirty draft is swallowed (jsdom only), P13 initial focus is the Apply box, P16 a Damage → Heal → Spend Recovery chain matches its label, P24 name-click kill flow, P26, P42 a block without `current_stamina` opens at 0 and Full Heal writes 20, P43 debounce coalescing, P44 close without Apply writes nothing.

## 4. What jsdom cannot tell us (pilot targets for real-Obsidian functional tests)

1. B7 for real: type → click Apply, in Electron.
2. Escape semantics: does a dirty-draft Escape close the modal despite `stopPropagation` (Obsidian's Scope)? Does a clean Escape, X or backdrop discard?
3. An end-to-end stamina edit (each host) → note bytes → integrity. W09 is entirely absent today.
4. B2 under adoption (does the detail row stay stale after the write?).
5. A real double-click on a cell with selection writes in between (E20).
6. Steel bar hit-testing over the stood-down numeric control (E21).
7. An external edit while a modal is open (W08).
8. Modal stacking (K03).

Follow-ups: B1–B16 above, for the owner to triage and file (workers never touch the tracker).
