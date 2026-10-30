# SC-527 r1: survey + prototype for state-only host-leak kinds

## Executive summary
1. **Gap confirmed at ed368f6** (sweep URLs + SC-513 mounts, dark and light). 9 of the ticket's 10 kinds are absent from the button sweep. The 10th, `hero|dse-btn.dse-btn--icon.dse-stepper__btn|disabled`, **has been compared since SC-513**: its first node is the probe hero's ability-body roll strip "Decrease Edges". The ticket's list predates SC-513. Input and checkbox sweeps: no state-only kind exists, because their keys carry no state.
2. **Bounded click discovery** over initiative, negotiation, montage, hero, party, project, counter, conditions, skills and roll: 204 depth-1 clicks plus 427 depth-2 clicks, each on a fresh load. It found **3 more state-only kinds** beyond the ticket: `negotiation|…is-spent|pressed|aria-pressed:true`, `montage|dse-btn.dse-btn--danger` (Clear all) and `montage|…mt__board-rowact|disabled` (the last two once the montage is complete). Modal kinds were left to the modal pass.
3. **Decision: (a), a real click, for every kind.** Each state is one to three clicks on the user's own controls, with no modal or confirm, so no probe fixture is needed. (c) is justified for none: SC-450, SC-423 and SC-377 compare toggled with rendered, **both with the host sheet in** (`sheet: '1'`), so a leaking host rule would pass them. The hero stepper kind is "already covered" by SC-513's node (see 1), not by SC-527.
4. **Prototype**: dse `sc527-r1-proto` @ **`b33616d`** (local, not pushed), on `ed368f6`. `shoot.mjs` only, +155/−2, no `entry.ts` change. It uses existing default fixtures as 6 `galleryExtra` sections (`SC527_EXTRA`). Its parts are `SC527_STATES`, `SC527_EXPECT`, `withSc527States`, `reachStateKindsForSweep` and `assertSc527Tagged`, called only by the button sweep, and placed **before** `mountClickRevealedForSweep` so that SC-526's popover click can stay last.
5. **Measured**: shots rc 0, 592 PNGs, **all sha256 identical** to base (and to the SC-513 list); freeze 280/280. Button: **157 kinds / 942 comparisons**. Boundary: **34 records**, which is 28 + 6 new, all `focus-visible: disabled` on `hero|dse-btn|disabled`, `montage|…accent|disabled` and `montage|…rowact|disabled`, ×2 schemes, so legitimate. Modal 228, input 15/176, checkbox 7/116, prose 106 [212]: all unchanged. First nodes: **0 kinds lost, 0 moved**.
6. **No product leak found.** The sweep stayed green on all 12 new kinds, so no NEEDS_CONTEXT.
7. **Can-fail**: I clicked the wrong target in place of the tier row. Result: rc 1, with 2 named lines per scheme. A host-only leak probe on the new states gave rc 1, with 192 problems naming exactly the 12 new kinds. Both were reverted, and the tree is clean.
8. **Owner calls**: keep or drop the 3 beyond-ticket kinds (they need sections 3 and 5; dropping them is −2 sections and −3 keys). Also whether to accept that the Surges "−" stays uncompared behind SC-513's node (one node per kind).

## 0. Method and state
- Worktree dse fetched; origin/develop is still `ed368f6`. `npm ci` was run first. Superproject worktree and dse are clean before and after. I returned the dse checkout to branch `sc527-hostleak-state-kinds` @ ed368f6; `sc527-r1-proto` @ b33616d keeps the prototype.
- **Key and first-node dumps** (`firstnode.mjs`) use the SC-513 r3 method. `extract.mjs` copies the sweep's own declarations verbatim out of `shoot.mjs` (`tagButtons`/`tagInputs`/`tagCheckboxes`, `openRollModifiersForSweep`, `changeExtraRollModifierForSweep`, the SC-513 helpers, and the SC-527 helpers in proto mode). Each sweep URL is then loaded with the sweep's pre-tag steps, the sweep's own tag function runs, and every kind's first node is recorded (section, extra, label, w, h).
- **Discovery** (`discover.mjs` and `depth2.mjs`, copied from SC-513 r1 with paths adapted): it loads `gallery=<id>,horizontal-rule`, `authoringControls:true` and `CHROME_REVEAL_CSS`, then opens roll Modifiers. For each candidate, it does a fresh load and one real `elementHandle.click()`, then diffs the button, input and checkbox kind keys. The analysis (`analyze.py` / `analyze2.py`) keeps only keys that the current sweep (base dump) never tags. Depth 2 used 15 representative state-changing first clicks, each followed by every candidate in turn.

## 1. Gap confirmation (base dump `firstnode-base2.json`, button 145 / input 15 / checkbox 7, dark = light)
| ticket kind | in the ed368f6 sweep? |
|---|---|
| `initiative|dse-btn.dse-btn--icon.dse-init__turn|pressed|aria-pressed:true` | absent (only `…|aria-pressed:false`) |
| `initiative|dse-btn.dse-init__portrait-toggle|pressed|aria-pressed:true` | absent |
| `initiative|dse-btn.dse-init__action-toggle|pressed|aria-pressed:true` | absent |
| `initiative|dse-btn.dse-init__cell|pressed|aria-pressed:true` | absent |
| `negotiation|dse-nt__chip.dse-optchip|pressed|aria-pressed:true` | absent |
| `negotiation|dse-nt__chip.dse-optchip.is-spent|aria-pressed:false` | absent |
| `negotiation|dse-btn.dse-btn--accent` (Complete Argument armed) | absent (only `negotiation|dse-btn|disabled`) |
| `montage|dse-btn.dse-btn--accent|disabled` | absent (only enabled `…--accent`) |
| `hero|dse-btn|disabled` (Catch Breath) | absent (only enabled `hero|dse-btn`) |
| `hero|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` | **present since SC-513**: first node is section 36, `hero:probe-inline-abilities`, "Decrease Edges" (ability-body roll strip). The Surges "−" shares the key, so it can never be the compared node. |

Discovery found **no** non-modal state change that creates a new input or checkbox kind (`analysis-depth1.txt`). Beyond the ticket (`analysis-depth2.txt`):
- `negotiation|dse-nt__chip.dse-optchip.is-spent|pressed|aria-pressed:true`: appeal to a Motivation and mark the same one spent (2 clicks, either order).
- `montage|dse-btn.dse-btn--danger` ("Clear all") and `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled`: End round 1, then End round 2. The montage completes, and the complete bar replaces the live bar.
- Everything else new was inside a modal (the modal pass covers those) or was an in-place repaint back to existing kinds. Party, project, counter, skills and conditions have no state-only kind.
- Not a kind under today's key: the selected negotiation tier row (`dse-pr__row`, `aria-checked=true`). `tagButtons` keys on `aria-pressed`/`aria-selected`/`disabled`, not on `aria-checked`, so a selected row shares the idle row's key. This is INFO for the owner. It would need a key change, which is out of scope.

## 2. What SC-450 (and SC-423 / SC-377) really measure
`assertPressedToggleParity` (shoot.mjs ~:4149), `assertPortraitMarkParity` (~:3957) and `assertTurnMarkParity` (~:3861) all load with `sheet: '1'` and never take the host sheet out. They compare one control **toggled in place** with one **rendered** in that state, on the same cascade with the host in. A host rule that leaks into the pressed state (e.g. Obsidian's `button` height) hits both sides equally and passes. They prove repaint parity, not host invariance. So for every ticket kind, option (c) "covered by SC-450" is **not** justified.

## 3. Per-kind decision
| kind | decision | click sequence (all in the appended SC-527 section, real Playwright `locator.click`) | reached assertion |
|---|---|---|---|
| initiative `…init__turn|pressed…` | (a) | `.dse-init__portrait-toggle` #0. `repaintTurn` also presses the row's turn box. | `button.dse-init__turn[aria-pressed="true"][data-pressed]` |
| initiative `…portrait-toggle|pressed…` | (a) | same click | `button.dse-init__portrait-toggle[aria-pressed="true"][data-pressed]` |
| initiative `…action-toggle|pressed…` | (a) | `button.dse-init__action-toggle` #0 (Main, Frodo) | `button.dse-init__action-toggle[aria-pressed="true"][data-pressed]` |
| initiative `…init__cell|pressed…` | (a) | `button.dse-init__cell` #0 (Select Orc #1) | `button.dse-init__cell[aria-pressed="true"][data-pressed]` |
| negotiation `…optchip|pressed|aria-pressed:true` | (a) | `button.dse-nt__chip[data-kind="motivation"]` #0 (Higher Authority) | `…[data-kind="motivation"][aria-pressed="true"][data-pressed]:not(.is-spent)` |
| negotiation `…is-spent|aria-pressed:false` | (a) | `button.dse-nt__chip[data-kind="spent"]` #1 (Mark Peace spent) | `…[data-kind="motivation"].is-spent[aria-pressed="false"]` |
| negotiation `dse-btn.dse-btn--accent` | (a) | `.dse-pr__row` #0 (pick a tier), as the last click in the section | `.dse-nt__complete button.dse-btn.dse-btn--accent:not(:disabled)` |
| montage `…accent|disabled` | (a) | `button.dse-mt__quick` #0 (log a success for Kira, the only hero) | `button.dse-btn.dse-btn--accent[aria-label="Log an action…"]:disabled` |
| hero `dse-btn|disabled` | (a) | `button[aria-label^="Respite"]` | `button[aria-label^="Catch Breath"]:disabled` ("Catch Breath: Already at maximum") |
| hero `…stepper__btn|disabled` | (c), already compared since SC-513 | none needed. Respite does reach it (the Surges "−"), but under one node per kind that node is not the one compared. | not asserted (comment at the hero entry) |
| beyond: negotiation `…is-spent|pressed…` | (a) in a 2nd negotiation section (2 motivations only, so it cannot share a section with the ticket's two chip states) | motivation #0, then spent #0 | `…[data-kind="motivation"].is-spent[aria-pressed="true"][data-pressed]` |
| beyond: montage `dse-btn--danger`, `…rowact|disabled` | (a) in a 2nd montage section (the complete bar has no Log button) | `button[aria-label^="End round"]` #0, twice | `button.dse-btn.dse-btn--danger[aria-label="Clear all"]`, `button.dse-mt__board-rowact:disabled` |

Why not (b): every state is reachable by the user's own one- to three-click path, with no modal, confirm or dice. Existing default fixtures suffice (`replaceSource` is a no-op in the harness, and views repaint in place; discovery found `newRoots` 0). So `entry.ts` needs no probe source.

## 4. Recipe (as prototyped, `b33616d`)
- **URL**: `withSc527States(withSc513Mounts({...}))`, button sweep only. It appends `initiative,negotiation,negotiation,montage,montage,hero` (`SC527_EXTRA`) after every other extra, so every existing first node keeps its place.
- **Addressing**: `reachStateKindsForSweep` reads the last `SC527_EXTRA.length` `[data-dse-harness-extra]` sections, FAILs by name if their ids are not `SC527_EXTRA` in order, then addresses each by its unique `data-dse-harness-index`. This is needed because of the duplicate ids: two `negotiation` sections, two `montage` sections, and SC-513's probe hero also tagged `hero`.
- **Order in `assertBtnHostLeak`**: `CHROME_REVEAL_CSS`, then `openRollModifiersForSweep`, then `changeExtraRollModifierForSweep`, then **`reachStateKindsForSweep`**, then `mountClickRevealedForSweep`, then `tagButtons`, then `assertSc513Tagged`, then **`assertSc527Tagged`**. SC-527 runs before the SC-513 mounts, so SC-526 can add the popover (which closes on any outside click) at the end of `mountClickRevealedForSweep`. That is a clean rebase: SC-526 touches `SC513_*` and that helper, SC-527 touches only its own block and three call-site lines.
- **Failures** (named, never a skip):
  - a click that times out (5 s): `SC-527 <what> — could not click \`sel\` #n in the extra <id> section (…)`;
  - a state not reached: `SC-527 <what> — the state was not reached: nothing in the extra <id> section matches \`<sel>\``;
  - after tagging, every missing `SC527_EXPECT` key: `the sweep tagged no \`<key>\` button — a state reached only by a click (SC-527) would go unchecked`.
- **Captures** send no `galleryExtra`, so no shot or frozen byte moves (measured).
- **For r2** (not in the prototype):
  - the `entry.ts` `galleryExtra` comment (~:1110) should name the SC-527 sections;
  - add a jest seam test like SC-513's (e.g. that `withSc527States` appends last, and that the reach-assertion selectors match the default fixtures);
  - the comment block should also note the `aria-checked` INFO from section 1.

## 5. Measurements
| run | dse | rc | PNGs (sha256 vs base) | freeze | button kinds / comparisons | boundary | modal | input | checkbox | prose |
|---|---|---|---|---|---|---|---|---|---|---|
| base | ed368f6 | 0 | 592 (= SC-513 `shots-final.sha256`, identical) | 280/280 | 145 / 870 | 28 (26 fv-disabled + 2 hover no-hit stamina) | 228 | 15 / 176 | 7 / 116 | 106 [212] |
| proto | b33616d | 0 | 592, **all identical** | 280/280 | **157 / 942** | **34** = 28 + 6 fv-disabled (`hero\|dse-btn\|disabled`, `montage\|dse-btn.dse-btn--accent\|disabled`, `montage\|dse-btn.dse-btn--icon.dse-mt__board-rowact\|disabled`, ×2) | 228 | 15 / 176 | 7 / 116 | 106 [212] |
| can-fail | b33616d + wrong target | **1** | 592 | 280/280 | VIOLATED, 4 lines | n/a | not run (exit) | n/a | n/a | n/a |
| leak probe | b33616d + host-only rule | **1** | 592 | 280/280 | VIOLATED, 192 problems | n/a | n/a | n/a | n/a | n/a |

- 157 = 145 + 12 (9 ticket kinds + 3 beyond); the hero stepper kind was already in the 145.
- The other in-run gates are unchanged on proto: turn mark parity 20, portrait 6, pressed toggle parity 96, chrome 18 combos.
- tsc rc 0 (incl. `-p e2e`) and lint rc 0. Lint does not cover `visual-harness/`; `node --check shoot.mjs` is OK.
- No new hover no-hit record, so the harness Notice shim that Respite raises does not cover a sampled node.

## 6. First nodes (`firstnode-cmp-base2-proto2.txt`)
- base vs proto, button / input / checkbox × dark / light: **0 kinds lost, 0 first nodes moved** (section, extra, label, w, h). All 12 new kinds sit in SC-527 sections 37–42.
- Noise note: my first base dump (`firstnode-base.json`) read the gallery's `negotiation|dse-nt__chip.dse-optchip|aria-pressed:false` at w 150.81. Every later dump read 150.28: base2 on the same ed368f6 code, proto1 and proto2. So base vs base2 shows the same 0.53 px "move" with no code change. It is a cold-start measurement artefact, not SC-527. The comparison of record uses base2.

## 7. Can-fail probe
- **Wrong target** (`canfail.diff`): in the negotiation section, `.dse-pr__row` is replaced by the pitfall chip. Result: rc 1, `BUTTON HOST-LEAK VIOLATED`, with exactly these lines:
  - `dark: SC-527 negotiation: appeal to the first Motivation, mark the second spent, pick a Power Roll tier — the state was not reached: nothing in the extra negotiation section matches \`.dse-nt__complete button.dse-btn.dse-btn--accent:not(:disabled)\``
  - `dark: the sweep tagged no \`negotiation|dse-btn.dse-btn--accent\` button — a state reached only by a click (SC-527) would go unchecked`
  - the same two lines for `light`.
  - Reverted with `git checkout`.
- **Leak probe** (`leakprobe.diff`): `injectHostCss` gets one host-only rule, `min-height: 41px !important` on the SC-527 states inside the extra sections. Result: rc 1, 192 problems, on exactly the 12 new kinds (rest, hover, focus where applicable, ×2 schemes). Example: `dark|rest|negotiation|dse-btn.dse-btn--accent: … minHeight — "23.8px" without the host, "41px" with it`. The base sweep tags none of these keys (section 1), so on base the same rule could not be seen. Reverted.

## 8. Owner decisions
1. The 3 beyond-ticket kinds: fold them (as prototyped) or file a follow-up. Dropping them means removing the `beyondTicket` entries and the 2nd negotiation and 2nd montage sections, which gives 154 kinds and a 32-record boundary.
2. `hero|…stepper__btn|disabled`: accept "compared since SC-513 via another node". The Surges "−" disabled stays uncompared by the one-node-per-kind design.
3. The `aria-checked` key gap (selected tier row): INFO, possible Backlog item.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r1-abb0c6465158755e8/`)
- Prototype patch: `sc527-r1-proto-b33616d.patch`
- Shots:
  - base: `shots-base.{log,rc,sha256,count,head,status}`, `freeze-base.{log,rc}`
  - proto: `shots-proto.*`, `freeze-proto.*`
  - can-fail: `shots-canfail.*`, `freeze-canfail.*`, `canfail.diff`
  - leak probe: `shots-leakprobe.*`, `freeze-leakprobe.*`, `leakprobe.diff`
- tsc and lint: `tsc-proto.{log,rc}`, `lint-proto.{log,rc}`
- First nodes:
  - scripts: `extract.mjs`, `firstnode.mjs`, `firstnode.sh`, `fncmp.py`
  - dumps: `firstnode-base.json`, `firstnode-base2.json`, `firstnode-proto1.json`, `firstnode-proto2.json`
  - comparisons: `firstnode-cmp-proto1.txt`, `firstnode-cmp-base2-proto1.txt`, `firstnode-cmp-base2-proto2.txt`
- Discovery:
  - scripts: `discover.mjs`, `depth2.mjs`, `disc.sh`, `d2.sh`, `analyze.py`, `analyze2.py`
  - raw results: `disc-a.jsonl`, `disc-b.jsonl`, `d2-a.jsonl`, `d2-b.jsonl`
  - analyses: `analysis-depth1.txt`, `analysis-depth2.txt`
