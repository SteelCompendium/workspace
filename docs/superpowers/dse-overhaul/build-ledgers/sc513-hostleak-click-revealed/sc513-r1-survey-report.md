# SC-513 r1 survey: controls that only exist after a click

## Executive summary

1. **4 in-scope click-to-mount controls.** I found them by clicking every candidate trigger in all 32 gallery sections (544 clicks, each on a fresh page load) and diffing the sweep kind keys. (A) The ds-roll **result card** (Reroll / Clear). The ticket does not name this one, and its trigger is in the gallery today. (B) The **ability roll strip + result card** in feature, featureblock and statblock. (C) **Hero ability bodies.** (D) The **Recoveries ALT popover**, which is the only non-modal popover. No non-modal menu exists.
2. **Neither trigger named in the ticket is in the swept gallery.** `.dse-roll-btn` exists only with `rollingEnabled` (default off; the sweeps never set it). The gallery hero's abilities are SCC refs that the harness cannot resolve, so its rows have no expand toggle. (D) needs `staminaRecoveryPopover` (default off). With rolling off, a hero ability body mounts **0** tagged controls.
3. **Recommended mechanism**, harness-only: (a) add `rollingEnabled:true,staminaRecoveryPopover:true` to the button, input and checkbox sweep URLs; (b) append `galleryExtra` sections `feature,featureblock,statblock,hero:probe-inline-abilities`, where the last is a new gate-only `probeSource` hero with inline abilities, not in FIXTURES; (c) one helper does real Playwright clicks on the extra sections, then a named assert for each mount, then an assert on the expected kind keys after tagging. Click only the appended sections: launching a strip inside the gallery's own statblock moved the first node of the existing kind `statblock|dse-collapse__header` off "Villain Actions" (measured).
4. **Prototype numbers** (dse `sc513-r1-proto` @ `faee4f4`, with the popover mount off): button **145 kinds / 870 comparisons** (base 114 / 684). The boundary is **28 records** (base 12). All 16 new records are legitimate `focus-visible: disabled` on Reset and stepper, ×4 elements ×2 schemes. Modal **228**, unchanged. Input **15 kinds / 176** (base 14 / 164). Checkbox **7 kinds / 116** (base 3 / 60). rc 0, 592 PNGs.
5. **The real leak is control (D), the popover.** With the popover mount on (`1fce912`): `BUTTON HOST-LEAK VIOLATED` with 164 problems, rc 1, all of them on `hero|dse-stamina-rec__pop-btn` and `hero|dse-stamina-rec__pop-cb`. These are plain `<button>`s outside the SC-203 re-grounding family. With the host CSS on, they take Obsidian's `height: 30px` (17.98 → 30), plate box-shadow, colour, font and `display:flex`. This is a product CSS bug and needs an owner ruling (section 6).
6. **Frozen-byte risk: none measured.** All 592 PNG sha256 are identical to base in all three prototype runs (popover on, popover off, probe). Freeze is 280/280 every run. No capture sends the new params.
7. **Can-fail probe:** I dropped `rollingEnabled` from the sweep prefs. Result: rc 1, with 4 "no ability Roll button" lines and 28 "tagged no `<key>`" lines per scheme, all named, nothing skipped.

## 0. Method and state

- Worktree dse at `f89f69f` = `origin/develop` (fetched; it has not moved). `npm ci` was needed first, because the worktree had no node_modules (gitignored). Superproject worktree clean.
- **Discovery** (`scratch/discover.mjs`): for each gallery section, load `gallery=<id>,horizontal-rule` the same way the button sweep loads its page. The extra `horizontal-rule` keeps compendium mode `none`, as `gallery=1` does. Concretely: `authoringControls:true`, then `CHROME_REVEAL_CSS`, then a real click to open roll Modifiers. Candidates are every boxed `button`, `.dse-btn`, `[role]`, `[tabindex]`, `label`, `input`, and the topmost `cursor:pointer` element inside `[data-dse-element]`. For each candidate: a fresh load, a real Playwright `elementHandle.click()`, then a diff of the button / input / checkbox kind keys. I also counted created nodes, new element roots (re-renders), modals and URL changes. 544 candidates in total. I re-ran it with `rollingEnabled:true` on 11 sections.
- **Key dumps and prototype replays** (`keydump.mjs`, `measure.mjs`) on full `gallery=1`. I compared kind sets, and the section and label of each kind's first node, between configurations.
- **Shots:** base `f89f69f`, proto `1fce912` (popover on), proto `faee4f4` with `SC513_POPOVER=0`, and the probe (temporary edit, reverted). Each run was followed by freeze and a sha256 of all PNGs.
- Note: each shots run took 456–897 s with load around 8, and another worktree (sc502 / sc510) was running shots at the same time. So three of the four runs went past the 600 s Bash limit and were moved to background by the harness. I waited on the shoot.mjs PID with `tail --pid` and never polled a scratch file. The resume message's "no process running / log incomplete" was stale: every run finished, and each has an rc file plus its log.

## 1. Inventory: controls not in the gallery DOM at load but created by a click

Kind keys are written the way the sweep writes them (`element|classes[|in:…][|pressed][|aria-pressed:…][|selected][|disabled]`).

| # | Trigger | In the swept gallery today? | What mounts | Kinds it adds (new unless noted) | 2nd click |
|---|---|---|---|---|---|
| A | ds-roll strip `button[aria-label="Roll"]` (`rollBar.ts:103`) → `rollResultCard` (`rollResultCard.ts:54-57`) | **yes**: the `roll` section and the SC-512 extra strip | `.dse-rollcard`: a headline plus Reroll and Clear | button `roll\|dse-btn` (Reroll), `roll\|dse-btn.dse-btn--ghost` (Clear). Never swept until now. | Roll re-rolls and replaces the card; Clear removes it. Not a toggle. |
| B | ability Roll `.dse-roll-btn` (`rollController.ts:86-96`; first click `ensureBar()` at :108-126 **and** rolls) | **no**: the button exists only with `rollingEnabled` (catalog default `false`, `catalog.ts:629`) | `.dse-roll-area` holding a `rollBar` (Modifiers collapsed), then a `.dse-rollcard` | per element `feature`/`featureblock`/`statblock`: at load the launch `X\|dse-btn.dse-btn--ghost.dse-btn--icon.dse-roll-btn`; after the click `X\|dse-btn.dse-btn--accent` (Roll), `X\|…stepper__btn`, `X\|…stepper__btn\|disabled`, `X\|dse-btn.dse-btn--ghost.dse-rollbar__reset\|disabled`, `X\|dse-btn` (Reroll), `X\|dse-btn.dse-btn--ghost` (Clear); `feature\|`/`featureblock\|dse-collapse__header` (statblock's already exists); input `feature\|dse-stepper__input` (statblock and featureblock have a fixed characteristic, so no input); checkbox `X\|(no class)` ×3 | a 2nd launch re-rolls; the strip stays. Not a toggle. |
| C | hero `.dse-hero__ability-toggle` (`hero/view.ts:657-672`) | **no**: the gallery hero (`hero/example.yaml:10-12`) lists SCC refs, the harness compendium is `none`, and every row renders as an issue row with no toggle (`view.ts:642-646`) | a `FeatureElementView` in `.dse-hero__ability-body` (`mountAbilityCard`, `:775`). It has **no** `data-dse-element` of its own, so everything inside it keys as `hero\|…` | at load (probe hero) `hero\|…dse-hero__ability-toggle`. Body with rolling **off**: **0 tagged controls**. Body with rolling on: `hero\|…dse-roll-btn`, then after its click `hero\|dse-btn.dse-btn--accent`, `hero\|dse-collapse__header`, `hero\|…stepper__btn\|disabled`, `hero\|…rollbar__reset\|disabled`, checkbox `hero\|(no class)`. Existing kinds (no new kind): `hero\|dse-btn`, `hero\|dse-btn.dse-btn--ghost`, `hero\|…stepper__btn` — their first node stays the hero's own controls. | **toggle**: the 2nd click hides the body (`hidden`); the card stays mounted (`mounted` flag) |
| D | hero `.dse-stamina-rec__pips` (`RecoveriesStrip.ts:258`), only with `staminaRecoveryPopover` (default `false`, `catalog.ts:602`) | trigger yes (hero is the gallery's only marker row); the popover needs the pref | `.dse-stamina-rec__pop` (`:194-235`): plain `<button>` −, +, Catch breath | `hero\|dse-stamina-rec__pop-btn`, `hero\|dse-stamina-rec__pop-cb` | **toggle** (`:237-240`). It also closes on **any** document click outside it (`:308-313`) |

The pref load-diff was measured on full `gallery=1`. `staminaRecoveryPopover:true` changes **no** kind at load. `rollingEnabled:true` adds only the 3 launch kinds. Neither pref removes a kind, and neither moves any existing kind's first node.

Already covered, so no change is needed: the initiative title editor (`initiative|dse-init__title-input`, created by clicking `.dse-init__title-text`). The input sweep already mounts it (SC-377 R1F). It is the only click-mounted node the base gallery adds that is not a re-render.

Adjacent finding, not a mount. These kinds appear only after a **state** change: the same class of gap as SC-512, but the nodes already exist. The ticket did not ask for them, so I did not include them. The owner may want a follow-up ticket.
- `initiative|…dse-init__turn|pressed|aria-pressed:true`, `…portrait-toggle|pressed|aria-pressed:true`, `…action-toggle|pressed|aria-pressed:true`, `…dse-init__cell|pressed|aria-pressed:true`
- `negotiation|dse-nt__chip.dse-optchip|pressed|aria-pressed:true`, `…is-spent|aria-pressed:false`, `negotiation|dse-btn.dse-btn--accent` (Complete Argument enabled)
- `montage|dse-btn.dse-btn--accent|disabled`, `hero|dse-btn|disabled`, `hero|…stepper__btn|disabled` (after Respite or Surges 0)

The SC-450 pressed-parity gate covers part of this pressed family by other means. The rest of the base gallery's "MOUNT" hits were in-place re-renders that bring back the same kinds: conditions chips, initiative round advance, montage, party, project, skills.

## 2. Out of scope (one line each)

- **Every modal opener** (49 of the 544 clicks; `modal-container dse-modal[ dse-condal-modal| dse-mt__sheet]`): the modal pass covers these (10 scenarios, `assertModalRegistry`).
- **Pin to sidebar / encounter "Create" / "Open in sidebar" / Reset turns / Catch Breath:** these mount only the harness `Notice` shim (`.dse-harness-notice`) or Obsidian-native UI.
- **`undoNotice` "Undo"** (`undoNotice.ts:51-58`): an `<a role=button>` inside an Obsidian `Notice` (host chrome, outside any `[data-dse-element]`), and not a tagged element class.
- **The `rollClickToRoll` row click** (`rollController.ts:98-104`): a second trigger for the same strip as B. Nothing new.
- **`rollerEngine: dice-roller`:** adds only a text line ("rolled with Dice Roller"), no control.
- **StaminaEditModal's RecoveriesStrip:** a modal, so the modal pass covers it. Note the popover pref would reach it too. Not measured.
- **Clicks on disabled controls or the clipped initiative stamina** (Playwright timeouts: Undo, Complete Argument, steppers at min, Reset at defaults): no mount is possible.
- **Table / list / inline / prose / chrome sweeps:** A, B and D mount no markdown tables, lists or `<p>`. C's body holds the feature card's prose; the prose sweep tags every `<p>` (`tagProse`). If the owner wants that, add the probe hero and the toggle click to the prose sweep's gallery visit. Not measured.

## 3. Mount recipe (as prototyped)

Everything runs in the sweep's own page load: after `bareBtnHostLeakPage` / `setHostSheetEnabled(false)`, after `CHROME_REVEAL_CSS` and `openRollModifiersForSweep` (plus SC-512's Edges "+"), and before `tagButtons` / `tagInputs` / `tagCheckboxes`. Every dark and light load. Never from a capture.

- **URL:** `withSc513Mounts(params)`. It appends `rollingEnabled:true,staminaRecoveryPopover:true` to `prefs` and `feature,featureblock,statblock,hero:probe-inline-abilities` to `galleryExtra`. The input and checkbox sweeps also gain `galleryExtra=roll`, so A has its target. Its extra roll inputs and checkboxes share existing keys and come after the originals, so first nodes are unchanged.
- **entry.ts:** `probeSource('hero','probe-inline-abilities')` returns `heroDefault` with its two SCC refs replaced by inline abilities: the feature example (a power roll) and a simple strike. It is gate-only, like `probe-rounds-<N>`: not in FIXTURES, so no shot, no manifest entry, no freeze line. Compendium mode stays `none`. It throws if the abilities block is not found.
- **Clicks, all real Playwright `locator.click()`:**
  1. A: `[data-dse-harness-extra="roll"] .dse-rollbar button[aria-label="Roll"]`. Uses the extra strip, so the gallery strip stays un-rolled and SC-512's "first Reset still disabled" holds.
  2. B: the first `.dse-roll-btn` in each `[data-dse-harness-extra=feature|featureblock|statblock]`. **Not** the gallery sections: launching inside the gallery statblock moved `statblock|dse-collapse__header`'s first node from "Villain Actions" to the strip's "Modifiers" (measured).
  3. C: every `.dse-hero__ability-toggle` in the probe hero, a wait for the bodies to hold content, then the first `.dse-roll-btn` inside a body.
  4. Open the new strips' Modifiers: `.dse-rollbar__mods > .dse-collapse__header[aria-expanded=false]` inside those extra sections. `openRollModifiersForSweep` only looks under `[data-dse-element="roll"]`.
  5. D, **last**, button sweep only: the gallery hero's `.dse-stamina-rec__pips`. It must come last because any later click outside the popover closes it. The sweep's state passes never click: hover is `mouse.move`, focus is a `Tab` plus `focus()`. Measured: it stayed open through all 3 states.
- **Photographed state:** none changes. All 592 PNGs are byte-identical in three runs, and freeze is 280/280. Captures never send `galleryExtra` or these prefs.
- Rolls use unpinned `Math.random`. The tier and total text vary from run to run, but no kind key, box presence or boundary record depends on them. Optionally pin it, the same way `fixedDice` does, for byte-stable sweep logs.

## 4. Prototype and measurements

Branch `sc513-r1-proto` (local, not pushed):
- `1fce912`: entry.ts +31 (probe hero) and shoot.mjs +176/−4 (`SC513_EXTRA`, `SC513_PREFS`, `SC513_EXPECT`, `withSc513Mounts`, `assertSc513Tagged`, `mountClickRevealedForSweep`, wired into the button, input and checkbox sweeps).
- `faee4f4`: a survey-only `SC513_POPOVER=0` switch. It lets the rest be measured while the popover leaks. It must not land.

| run | sha | rc | PNGs (sha vs base) | freeze | button | boundary | modal | input | checkbox |
|---|---|---|---|---|---|---|---|---|---|
| base | f89f69f | 0 | 592 | 280/280 | 114 / 684 | 12 | 228 | 14 / 164 | 3 / 60 |
| proto, popover on | 1fce912 | **1** | 592, identical | 280/280 | VIOLATED, 164 problems, all `hero\|dse-stamina-rec__pop-btn` / `-cb` | n/a | not run (exit) | not run | not run |
| proto, popover off | faee4f4 + `SC513_POPOVER=0` | 0 | 592, identical | 280/280 | **145 / 870** | **28** | 228 | **15 / 176** | **7 / 116** |
| probe (no rollingEnabled) | faee4f4 + temp edit | 1 | 592, identical | 280/280 | VIOLATED (section 5) | n/a | n/a | n/a | n/a |

Button line: `button host-leak OK (145 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 870 comparisons …)`. The +31 kinds break down as follows, with D excluded:
- 3 launch kinds at load;
- A: 2;
- B: 20 (feature 7, featureblock 7, statblock 6, because statblock's header kind already exists);
- C: 6 (toggle, inner launch, Roll, header, stepper disabled, Reset disabled). The boundary is 26× `focus-visible: disabled` plus 2× hover no-hit (`initiative|dse-btn.dse-init__stamina`, unchanged). The **new** records are `feature|`/`featureblock|`/`statblock|`/`hero|` × `dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` and `dse-btn.dse-btn--icon.dse-stepper__btn|disabled`, each ×2 schemes: 16 records, all **legitimate**. Reset is disabled at authored values (`rollBar.ts:263`), and the Edges/Banes "−" are disabled at 0. They are the same shape as the existing `roll|…` pair. The enabled versions of those kinds are compared in all three states. No other new boundary record.

Popover leak (dark, rest; hover and focus-visible look the same): `pop-btn` w 19.11→18.19, h 17.98→30.00, `height` 30px, `box-shadow` none → Obsidian plate, colour #fff → rgb(218,218,218), font-size 13.33→13px, font-family, line-height, `display` block→flex, align and justify → center, `white-space` nowrap, padding, min-width. `pop-cb` shows the same, plus letter-spacing. Cause: `.dse-stamina-rec__pop-btn` / `__pop-cb` (`styles-source.css:1778`, `:12807`, `:12820`) are plain `<button>`s, not members of the SC-203 re-grounding family (`:17105ff`). The bare pass also shows UA defaults (Arial 13.33px), so these buttons do not set their own font either.

## 5. Failure design ("a mount produces nothing")

Each mount pushes a **named** problem, the sweep FAILs, and nothing is skipped:
- A: not exactly one Roll on the extra strip, or not exactly one `.dse-rollcard` with 2 buttons within 5 s.
- B, per element: no `.dse-roll-btn` in the extra section ("rollingEnabled did not reach it"), or not exactly one `.dse-rollbar` and one `.dse-rollcard` in that section after the click.
- C: no toggle in the probe hero, or any `.dse-hero__ability-body` still hidden, empty or box-less after the toggles, or no `.dse-roll-btn` in the bodies, or no strip mounted after it.
- Modifiers: any `.dse-rollbar__panel` on the page still `[hidden]` or box-less after the mounts.
- D: not exactly one marker row on the gallery hero, or no single `.dse-stamina-rec__pop` with 3 boxed buttons.
- After tagging, `assertSc513Tagged` names every missing key in `SC513_EXPECT`: button 28 keys, input 1, checkbox 4. Each mount's own kinds are listed, so a mount that "succeeds" but renders different classes still FAILs. New kinds are added; the existing SC-512 Reset assertions remain.
- The existing `assertTaggedHaveBox` (input / checkbox) and the button boundary still catch box-less tagged nodes.

**Probe run** (`SC513_PREFS` without `rollingEnabled`, popover off): rc 1. Per scheme: `no ability Roll button (.dse-roll-btn) in the extra feature section — rollingEnabled did not reach it …` (and the same for featureblock and statblock), plus `no ability Roll button inside the probe hero's ability bodies …`, plus 28 lines of the form `the sweep tagged no \`<key>\` button — a click-mounted control (SC-513) would go unchecked`. The edit was reverted (`git checkout -- visual-harness/shoot.mjs`).

The popover-on run doubles as the leak-detection probe: a real leak in a mounted control turns the sweep red.

Further probes for the implementer round:
- Break the hero probe source. Expect "no ability expand toggle".
- Click a gallery statblock launch instead of the extra one. Expect no FAIL, so add a first-node assertion if the owner wants this pinned.

## 6. Owner decisions needed

1. **The popover leak (D).** The sweep cannot land with D mounted until the CSS is fixed. Options:
   - (a) Fold a product CSS fix into SC-513: re-ground `.dse-stamina-rec__pop-btn` / `__pop-cb` in the SC-203 block, or move them into the kit family. That is no longer harness-only, and it needs a CHANGELOG bullet.
   - (b) File a separate ticket, and land A–C now, with D's mount staged behind it. Not an exemption: the mount stays out until the fix lands.

   The SC-205 rule ("never widen silently") rules out an exemption.
2. **Turning prefs on in the sweep URL** (`rollingEnabled`, `staminaRecoveryPopover`) is a sweep-only change, and no kinds shift (measured). The alternative is a separate pipeline with its own pref store for the extra sections: a bigger entry.ts change, with no difference to coverage.
3. **The probe hero is a gate-only `probeSource`** (`hero:probe-inline-abilities`). Alternatives: put fury abilities in `HARNESS_COMPENDIUM` (but `gallery=1` resolves compendium mode to `none`), or add a FIXTURES entry (that adds photographed shots and needs a widening file).
4. **Follow-up:** the state-only kinds in section 1, plus prose-sweep coverage of hero ability bodies.

## Evidence (scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r1-k7q2/`)

- Discovery: `discover.mjs`, `disc-base-{a,b,c}.jsonl`, `disc-feature-hero.jsonl`, `disc-roll-a.jsonl`, `analysis-base.txt`, `analyze.py`
- Load and mount diffs: `keydump.mjs`, `keys-load1.json`, `measure.mjs`, `measure1.json` (gallery-statblock first-node shift), `measure2.json` (extras, no shift), `measure3.json` (popover), `cmp.py`
- Shots:
  - base: `shots-base-f89f69f.log`, `shots-base-f89f69f.sha256`, `freeze-base.log`, `shots-base.rc`
  - proto, popover on: `shots-proto-1fce912.log` (also `.keep.log`), `shots-proto-1fce912.sha256`, `freeze-proto.log`, `shots-proto.rc`
  - proto, popover off: `shots-proto2-nopop.log`, `shots-proto2-nopop.sha256`, `freeze-proto2.log`, `shots-proto2.rc`
  - probe: `shots-probe-probe-norolling.log`, `shots-probe-probe-norolling.sha256`, `freeze-probe.log`, `shots-probe.rc`
