# SC-202 phase 2, round 5 — checkbox/task-list host-leak fix (leak family 5, the LAST one) — report

**Verdict: DONE.** Commit `fe69d37f` on `1dcf516` on `origin/develop`=`8b65a14` (rebased
clean from dispatch's `d8bda06`). **Census: task lists LATENT (0 hits, whole corpus,
re-verified) — fixed anyway, synthetic-node can-fail-proven; plugin checkboxes LIVE (5
sites, all covered).** Can-fail: **166 → 0** (40 comparisons). Real vault (before/after,
real Obsidian): a leaked Obsidian checkmark + grey focus ring on the plugin's own
checkboxes are gone; a real task list's checkbox drops from Obsidian's 16px control to the
harness's bare 13px one, losing its strikethrough. Battery: tsc/lint clean; jest
**3805p/0f/1sk**; shots **524 PNGs 0 FAIL ×2** byte-identical; **0/524 bytes moved**;
`freeze OK (252/252)` ×2; parity **0/0/16**. No new fixture. Two mid-round can-fail bugs
found+fixed, re-verified clean. Crops + FINAL-ASK below.

## 1. Provenance

| | |
|---|---|
| Worktree | `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements` |
| Branch | `sc202-visual-harness-obsidian` |
| Dispatch base | `5f7b8b2` (r4 re-review tip) on `d8bda06` (`origin/develop` at dispatch) |
| Rebase | `origin/develop` had moved to `8b65a14` ("docs: make AGENTS.md the canonical agent instructions") — `git fetch` + `git rebase origin/develop`, clean replay, 0 conflicts. Post-rebase tip renamed `5f7b8b2` → `1dcf516` (same content). |
| This round's commit | `fe69d37fc7e3d57597eb9b4a3a1f317649c232d0` — `fix(theme): SC-202 r5 — re-ground the checkbox and task-list host leak` |
| Full chain on `origin/develop` | `51bfe7b 263f29f e48e761 36a01d3 b86a3d4 fc359ed 1dcf516 fe69d37` (r3's 4 + Step A + r4's 2 + this round's 1) |
| Pushed / tagged | No / No |
| Linear calls | None, per brief |
| Tree state at hand-off | `git status --porcelain` clean |

## 2. The task, re-derived (round 3's own CSS block never repeated the census after the
wipe — re-enumerated from the real sheet, not assumed)

Two surfaces:

1. **Markdown task lists** (`- [ ]`/`- [x]`) rendered inside plugin bodies via
   `MarkdownRenderer` emit `li.task-list-item`(+`data-task`) wrapping
   `input.task-list-item-checkbox[type=checkbox]`. Round 3's SCOPE FENCE named three bare
   Obsidian declarations left for this round (`ul > li.task-list-item {list-style:none}`;
   the checkbox's own `margin-inline-start: calc(...)` pull-back; the
   `[data-task="x"/"X"]` strikethrough+colour decoration) — confirmed against the real
   sheet, plus one more the enumeration found (`.markdown-preview-view .task-list-item-
   checkbox {position;top;margin-inline-end}`, outside r3's own `ul`/`ol`/`li`/`blockquote`/
   `hr`-subject filter) — plus the CONTROL itself, reached by Obsidian's bare
   `input[type=radio], input[type=checkbox]` family (rest, `:active,:focus`, `:hover`,
   `:focus-visible`, `:checked`, `:checked:after`, `[data-indeterminate="true"]
   :not(:checked):after`).
2. **Plugin-authored checkboxes** — `grep -n "type: 'checkbox'" src/` finds exactly five
   real call sites, ALL already reached by the plugin's own pre-existing SC-121 "Themed
   checkbox" block (`~:10618`, Batch 1), which excludes `.task-list-item-checkbox` by name
   and sits at (0,4,1) — comfortably above every Obsidian rule this family enumerates:

   | Site | Class |
   |---|---|
   | `ArgumentView.ts:57` (negotiation motivation row) | unclassed — reached by the type selector |
   | `MotivationsPitfallsView.ts:37` (negotiation pitfall row) | unclassed |
   | `project/view.ts:213` (breakthrough toggle) | unclassed |
   | `project/view.ts:249` (skill toggle) | unclassed |
   | `MinionStaminaPoolModal.ts:163` | `.dse-minion__check` (JS query only, not styling) |

   `ConditionsModal.ts:390`'s `type='color'` stays exempt — its own still-undesigned
   family, round 1's own OUT-OF-SCOPE note, not this round's.

## 3. Census (round 3's own finding: "0 in shipped content" was wrong twice — re-verified,
not trusted)

Grepped for `- [ ]`/`- [x]`/`* [ ]`/`* [x]` task-list syntax:

| Corpus | Files | Hits |
|---|---|---|
| `data-unified/en/unified/md-dse` | 3,083 | **0** |
| entire `data-unified` tree | — | **0** |
| `compendium` repo | — | **0** |
| `steel-etl/input` book sources | — | **0** |
| plugin `test/fixtures/md-dse` | 27 | **0** |
| `demo-vault` | 33 | **0** |

**Unlike round 3's list/hr finding, this one is genuinely still zero.** The markdown-
task-list half is LATENT: fixed anyway (cheap, and the can-fail sweep proves it on a
synthetic node — no gallery fixture can even produce Obsidian's real DOM shape; `marked`,
the harness's own markdown shim, does not emit `.task-list-item`/`data-task`/
`.task-list-item-checkbox` for `- [ ]` syntax — measured directly against a real
`marked@18` install: `marked.parse('- [ ] x')` →
`<li><input disabled type="checkbox"> x</li>`, no class, no attribute, `disabled` present).
The plugin-authored checkbox half is LIVE — three real UI surfaces render one today
(negotiation's two lists, project's two toggles, the minion pool's per-minion check), which
is why the real-vault crop uses negotiation directly, no hack needed.

## 4. The fix — `styles-source.css`, "SC-202 r5 — CHECKBOX + TASK-LIST HOST RE-GROUNDING"

Six GROUPs, foot of the file:

- **GROUP 1** — the task-list `<li>` itself. `list-style: none` is restated as the block's
  OWN default — **the one declaration in the whole SC-202 effort that adopts Obsidian's
  value instead of fighting it** (measured: NOT restating it produces a broken
  bullet-AND-checkbox double marker, since nothing in a bare `<li>`'s box model knows it
  has a checkbox). The `data-task="x"/"X"` decoration is neutralised (no strikethrough,
  inherited colour) via `:is()` kept outside `:where()` for the specificity it needs.
- **GROUP 2** — the task-list checkbox control, rest state. `appearance: auto` hands
  rendering back to the native browser widget (the harness's own bare truth — nothing
  styles `.task-list-item-checkbox` at all by design). **Subject corrected mid-round**
  (see §6) to `:where(li.task-list-item) input.task-list-item-checkbox` — the `input`
  moved outside `:where()` — after the can-fail sweep proved a flat `:where(input.task-
  list-item-checkbox)` subject loses `margin` to Obsidian's own task-list-scoped rule.
- **GROUP 3/4** — `:hover`/`:focus-visible`, restated to REST's own value (hover) or the
  harness's real native focus ring, `outline: auto 1px -webkit-focus-ring-color`
  (focus-visible) — the one state where the control is visibly different in a real vault.
- **GROUP 5/5b** — `:checked` (background/border restated to REST) and the shared `::after`
  tick/indeterminate-dash companion (`content: none`) — now sufficient as ONE rule after
  GROUP 2's subject fix (see §6; an earlier split into two companions was reverted once
  proven unnecessary).
- **GROUP 6** — the plugin-authored checkbox's own missing properties/states. Two were
  planned (`:focus-visible` box-shadow, the `::after` tick); **the can-fail sweep found
  two more, live, that were never in the original design**: `position` (SC-121 never
  declares it at all) and `:hover`'s `outline` (SC-121 covers `:hover`'s border-color but
  never its outline). All four are separate, additive rules beside SC-121's own block —
  SC-121 itself is untouched.

## 5. Mid-round can-fail bugs — found, fixed, re-verified (not swept under the rug)

The FIRST can-fail run against the freshly-written CSS failed with 3 categories of real
bug, all from under-computing a competing Obsidian rule's specificity:

1. **`margin` leak, every state** — Obsidian's task-list-scoped `ul > li.task-list-item >
   .task-list-item-checkbox {margin-inline-start}` is (0,2,2), which beats a flat
   `:where(input.task-list-item-checkbox)` subject's (0,2,0) on the type column even
   though class-count ties. Fixed by moving `input.task-list-item-checkbox` OUTSIDE
   `:where()` (keeping `li.task-list-item` inside it), reaching (0,3,1).
2. **`[data-indeterminate]::after` leak** — a real specificity miss the SAME fix above
   happened to raise enough to close for free (see §6 for the corrected number — a
   deliberate split into two companions was tried first, found unnecessary once the
   subject fix landed, and reverted for a simpler, single shared rule).
3. **Plugin checkbox `position` (every state) + `:hover`'s `outline`** — SC-121's own
   block simply never declares either property; nothing competed for them before, so
   Obsidian's bare rule won outright. Two new dedicated rules added.

Every fix was re-run through the full `npm run shots` can-fail sweep before being accepted
— the 40-comparison, 0-diff `checkbox host-leak OK` line in §7 is the tree that shipped,
not the tree that was first written.

## 6. A design correction mid-round (documented honestly, not silently absorbed)

The GROUP 5b `::after` companion was initially SPLIT into two rules (one for `:checked`,
one for `[data-indeterminate]`) on the theory that a shared `:is()` companion could not
clear both Obsidian specificities at once. That was true for the ORIGINAL flat-anchor
subject, but GROUP 2's own subject fix (item 1 above) raises GROUP 5b's base specificity
right along with it — re-computed, a single shared `:is(:checked, [data-indeterminate=
"true"])::after` companion at (0,4,2) already beats both Obsidian rules ((0,2,2) tick,
(0,3,2) indeterminate) outright. Reverted to one rule, matching GROUP 6's own shape;
verified via jest + a full can-fail re-run before shipping either shape.

## 7. Can-fail proof (measured, both directions)

**Before** (base `styles-source.css` — i.e. NO SC-202 r5 CSS at all — swapped in over the
CURRENT sweep code, via saved-file swap, never `git checkout`; restored after):
`CHECKBOX HOST-LEAK VIOLATED`, exit 1, **60 shown + "… and 106 more" = 166 total
problems** — plugin `position` (every state, both kinds), plugin `:hover` `outlineWidth`,
plugin `:focus-visible` `boxShadow`, plugin `:checked`/`:indeterminate` `afterContent`;
task-list `<li>` `list-style`/`textDecorationLine`/`color`; task-list checkbox
`appearance`/`borderWidth`/`borderStyle`/`borderColor`/`borderRadius`/`margin`/`width`/
`height`/`position` at every state, plus `:hover`'s `outlineWidth` and `:focus-visible`'s
`boxShadow`. Log: `sc202-r5-canfail-before.log`.

**After** (full round-5 tree): `checkbox host-leak OK` — **40 comparisons** (2
plugin-authored checkbox kinds × 6 states [24] + 1 synthetic task-list checkbox × 6 states
[12] + 2 synthetic task-list `<li>` decorations [4], × dark/light), **0 diffs**. Log:
`sc202-r5-shots.log`.

States covered per the brief: rest, hover, focus-visible, checked, indeterminate,
disabled — checked/indeterminate driven via the real DOM property (`.checked`/
`.indeterminate` + `setAttribute('data-indeterminate','true')`), hover/focus-visible via
CDP `CSS.forcePseudoState`. **A transition-timing footgun found and recorded** (in the CSS
block's own comment and the sweep's header comment): Obsidian's base rule declares
`transition: box-shadow 0.15s ease-in-out`, so reading computed style immediately after
forcing `:focus-visible` lands mid-transition — measured directly, an immediate read
reported `rgba(0,0,0,0) 0px 0px 0px 0px` (a false "no leak"), a 250ms-later read reported
the real settled value. The sweep always waits; GROUP 2 also kills the transition outright
(`transition: none`) to remove the hazard for any future consumer of this control.

`disabled` is sampled and shows genuinely 0 diff by construction, not by luck: Obsidian's
own disabled rule keys off the literal STRING `[disabled="true"]`, which the standard
`.disabled = true` idiom never produces (reflects as `disabled=""`) — measured directly,
not restated in the CSS (nothing to fight).

## 8. Real vault (`DISPLAY=:1`, real spawned Obsidian, `npm run build-no-check` + a fresh
`node visual-harness/notes-gen.mjs` before every probe)

**Plugin-authored checkbox** — `Harness/negotiation.md` (camera-native, no hack needed:
`negotiation` is a normally-registered top-level element that already renders two real
checkboxes). Measured directly via a scratch CDP probe script (same spawn/attach shape as
`obsidian-camera.mjs`, forced into reading mode via `leaf.setViewState({mode:'preview'})`) —
before/after, same commit-pair swap as the can-fail sweep:

| Property | Before | After |
|---|---|---|
| rest (size/border/bg) | 13.33px, radius 2.667px, border 1px ambient ink, bg `rgba(0,0,0,.18)` | **unchanged** — 0 diff at rest, as designed |
| `:checked` `::after` content | `""` (Obsidian paints a real checkmark icon) | `none` (gone) |
| `:checked` fill | `rgb(77,184,199)` (the plugin's own teal-cyan accent) | **unchanged** — the fix does not touch the plugin's own design |
| `:focus-visible` box-shadow | `rgb(85,85,85) 0px 0px 0px 2px` (Obsidian's grey ring) | `none` (gone) |
| `:focus-visible` outline | `solid` (the shared kit ring) | **unchanged** — the plugin's own a11y ring survives |

**Plain words, colour-safe:** tabbing to a motivation/pitfall checkbox in a real vault used
to show a thin grey ring layered on top of the plugin's own accent ring — now only the
plugin's own ring shows. Checking a box used to paint a small white checkmark icon inside
the teal-cyan fill — now the box is just a plain solid teal-cyan fill, matching the
harness's own look (and every crop the harness has always shown for this control). Nothing
about REST-state colour, size, or the fill colour itself changed.

**Task list** — no camera-native surface renders one today (SC-149 makes `perk`/typed
displays unreachable directly; `kit`'s own YAML has no free markdown body field). Seeded
one temporarily: `kit/panther.md`'s `equipment_text` frontmatter field (rendered via
`MarkdownRenderer`, `markdown: true` in `layouts.ts`) converted to a YAML literal block
carrying a real `- [ ]`/`- [x]` pair, regenerated into `demo-vault/DS Compendium/` via
`notes-gen.mjs`, viewed through `Harness/scc-demo.md`'s `ds-scc` reference to
`kit/panther` — **never committed**, `git checkout --` reverted it before the final gate
battery ran.

| Property | Before | After |
|---|---|---|
| checkbox appearance | `none` (Obsidian's own styled control) | `auto` (native browser widget) |
| checkbox size | 16px | **13px** (harness's own native size) |
| checkbox border | 1px solid, radius 4px | none, radius 0 |
| checkbox position | `relative` | `static` |
| checkbox fill when checked | `rgb(138,92,245)` (Obsidian's own violet accent) | `rgba(0,0,0,0)` (transparent — no plugin design exists for this control) |
| `<li>` checked decoration | `line-through`, `rgb(179,179,179)` | `none`, unchanged ambient ink |

**Plain words:** a real task list rendered inside a plugin card used to look like a
polished Obsidian checklist — a rounded, bordered violet checkbox with a white tick, and
struck-through grey text on the completed line. It now renders as a small plain square
(the browser's own bare, unstyled control) with no tick and no strikethrough — because
nothing in the plugin has ever designed a look for this control (it was always meant to be
"the host's own chrome," per SC-121's own comment), and the harness has always shown it
bare. This is the most visible change of the round, flagged for FINAL-ASK below.

Crops (dark, tight, colourblind-safe — no information carried by hue alone):
`sc202-r5-realvault-checkbox-{before,after}.png`, `sc202-r5-realvault-tasklist-{before,after}.png`.
Raw measured data: `sc202-r5-realvault-data-{before,after}.json`.
`demo-vault/.obsidian/app.json` — byte-unchanged throughout (diffed against a pre-session
backup); nothing to restore.

## 9. No new fixture, no widening

Per the brief's own condition ("new fixture only if no existing fixture renders a task
list AND a plugin-authored checkbox"): negotiation already renders a plugin-authored
checkbox in the browser gallery (no gap there), and the task-list half can ONLY be proven
synthetically regardless of any new fixture (`marked` cannot produce Obsidian's real DOM
shape — see §3) — so a new gallery fixture would add nothing a synthetic node doesn't
already prove. **0 new capture ids, `sc202-r5-widening.txt` not produced (nothing to
widen).**

## 10. Battery (foreground, per-run logs, all `sc202-r5-` prefixed)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (`rm -f main.js styles.css` first) | **3805 passed / 0 failed / 1 skipped, 3806 total, 198 of 199 suites**, 3 snapshots, exit 0 |
| `npm run shots` (×2, determinism) | **524 PNGs, 0 FAIL** both runs; every prior-round gate line byte-identical text; **`checkbox host-leak OK (40 comparisons)`**, 0 diffs, both runs; the two runs' own sha256 sweeps are byte-identical to each other (`diff` empty) |
| `bash check-freeze.sh …/visual-harness/shots` (×2, once per shots run) | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0, both times |
| `npm run parity` (last) | **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 |

**Shot-byte diff** (own sha256 of all 524 `*--steel-*.png`, pre-edit tree — base
`styles-source.css`, current sweep code — vs. the fixed tree): `sc202-r5-preedit-
allshots.sha256` vs. `sc202-r5-allshots.sha256` — **`diff` is empty, 0 of 524 files
differ**. The fix is a verified no-op for the browser harness by construction (the
harness never has host CSS injected outside the sweep's own ephemeral pass); only a real
vault (§8) shows the change. The 8 widening hashes from r3/r4 (`sc202-r3-widening.txt`,
`sc202-r4-widening.txt`) are untouched by this round (not re-verified here — unrelated
family, no CSS this round touches their subjects).

## Drive-by fixes

None beyond the round 4 re-review's own directed fold (not a drive-by find — an owner
ruling to fold into this round's commit, per `decisions.md`): reworded the
`LINK_REST_PROPS` comment in `visual-harness/shoot.mjs` to credit the jest source-text
guard (`headingEmphasisLinkHostRegrounding.test.ts`), not this bare-vs-host sweep, for
guarding the plugin's `:focus-visible` link-outline companion — the sweep structurally
cannot distinguish "companion present" from "companion absent" since the plugin sets the
identical value on both sides and Obsidian sets no competing `outline` rule for `a` to
fight. Comment only, no behaviour change.

## Follow-ups (for the ticket-owner to file / carry into the FINAL-ASK, not filed by me)

1. **FINAL-ASK — task-list checkbox look.** After this fix, a real vault's task-list
   checkbox renders as a bare, unstyled native browser widget (13px, no border, no fill,
   no tick) inside a plugin card — because SC-121's own comment always treated task-list
   checkboxes as "the host's chrome," and the harness has never had anything else to show.
   Is that the intended long-term look, or should the plugin eventually give task-list
   checkboxes their own themed appearance (matching the `.dse-nt`/negotiation idiom)? A
   design question for the "turn the sheet on" round or later, not decided here.
2. **FINAL-ASK — completed task-item styling.** A completed task item (`data-task="x"`)
   shows NO visual distinction (no strikethrough, no muted colour) in a real vault after
   this fix — matching the harness's own always-blank rendering. Standard checklist UX
   usually marks completed items somehow; this round mechanically neutralises Obsidian's
   own choice rather than inventing a new one. Same class of question as (1).
3. **Deliberate one-off, not a question:** `list-style: none` on `li.task-list-item` is
   the one declaration in the entire SC-202 effort that ADOPTS Obsidian's value instead of
   fighting it (see §4/GROUP 1) — hiding the redundant bullet next to a checkbox is
   objectively correct rendering, not a design opinion, so no FINAL-ASK item for it.
4. Round 1's `ConditionsModal.ts:390` (`type='color'`) stays its own, still-undesigned
   family — unchanged, out of this round's scope per round 1's own note.
5. The deeper nested-list-indent override and other round-3-deferred items remain
   genuinely deferred, untouched by this round (confirmed by the scope-fence test).

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/sc202-r5-report.md`
- Battery logs: `sc202-r5-{tsc,lint,jest,shots,shots2,freeze,freeze2,parity}.log`
- Can-fail before: `sc202-r5-canfail-before.log`
- Shot hashes: `sc202-r5-preedit-allshots.sha256`, `sc202-r5-allshots.sha256`, `sc202-r5-allshots-run2.sha256` (byte-identical to `sc202-r5-allshots.sha256`)
- Real-vault crops: `sc202-r5-realvault-checkbox-{before,after}.png`,
  `sc202-r5-realvault-tasklist-{before,after}.png`
- Real-vault raw data: `sc202-r5-realvault-data-{before,after}.json`
- Commit: `fe69d37fc7e3d57597eb9b4a3a1f317649c232d0`, on
  `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements`,
  branch `sc202-visual-harness-obsidian`, tip now `fe69d37` on `1dcf516` on `origin/develop`
  `8b65a14`

## Fix round (2026-09-07)

Independent review of `fe69d37` (`sc202-r5-review.md`) returned FIX-ROUND-NEEDED: 1 HIGH /
2 MED / 4 LOW. Owner rulings in `sc202-brief-r5-fix.md`. All seven findings closed in ONE
commit, `189aaf11b732e0bb2d8b25a04d6a6dd3afdac3e5`.

**Two notes from the coordinator, both honored:** (1) the checkbox before/after crops this
round originally shipped were byte-identical (same sha256, both REST state only) — the
reviewer re-shot all four with the box checked+focused; those four files
(`sc202-r5-realvault-checkbox-{before,after}.png`, `sc202-r5-realvault-tasklist-{before,after}.png`)
were **not touched** by this fix round. (2) HIGH-1 was flagged as a repeat of round 4's
MED-1 (a companion rule's `outline` outranking the focus-visible companion) — recognized
and fixed as prescribed.

### Per-finding closure

- **HIGH-1** (task-list checkbox had NO focus ring — GROUP 2's own subject fix mid-round
  silently raised it to (0,3,1), above GROUP 3/4/5's old flat-anchor (0,3,0), so GROUP 2's
  `outline: none` outranked GROUP 4's focus-visible ring unconditionally) — **FIXED.**
  GROUP 3/4/5 now share GROUP 2/5b's own subject, reaching (0,4,1) — proven both by an
  isolated specificity guard (`each companion strictly outranks GROUP 2's own (0,3,1)`,
  the comparison the original round never made) and an ABSOLUTE runtime assertion in
  `assertCheckboxHostLeak` (`outlineStyle === 'auto'`, `outlineWidth === '1px'` on a
  focus-visible synthetic task-list checkbox — a bare-vs-host diff is structurally blind
  to this class of defect, since it was identically wrong on both sides). Real-vault
  re-measure (isolated Obsidian instance, worktree `demo-vault`, `kit/panther.md`): a
  checked + focus-visible task-list checkbox now reads `outline: rgb(229, 151, 0) auto
  1px`, `outlineStyle: auto`, `outlineWidth: 1px`, `boxShadow: none` — was `rgb(255, 255,
  255) none 0px` / `none` / `0px` on `fe69d37`. `229,151,0` matches Obsidian's own
  accent-focus-ring color, i.e. the harness's/plugin's own native ring, restored.
- **MED-1** (`input[type=checkbox]:checked:hover` (0,3,1) only ever TIED, held by
  document order alone) — **FIXED**, closed by the same subject fix (GROUP 5 now (0,4,1),
  beating (0,3,1) outright). Added a combined `checked+hover` state to `STATES` (7 states
  now, up from 6) so the sweep actually samples it, plus a host-appended-stylesheet-order
  proof (`document.head.append` instead of `injectRealHostCss`'s own `prepend`) showing
  the win is structural, not source-order luck: `checked+hover ABSOLUTE` assertion expects
  `backgroundColor === 'rgba(0, 0, 0, 0)'` under the APPENDED order too. Real-vault
  re-measure: `checked+hover` backgroundColor now `rgba(0, 0, 0, 0)` (was Obsidian's violet
  accent, `rgb(166, 138, 249)`, when the synthetic node was mis-attached outside the
  plugin's own DOM scope during this probe's first draft — corrected, then reproduced
  clean).
- **MED-2** (`top`/`flex-shrink` never re-grounded or sampled, measured leaking) —
  **FIXED.** Both restated unconditionally in GROUP 2 (`top: auto; flex-shrink: 1;`), both
  added to `CHECKBOX_CONTROL_PROPS`. Real-vault re-measure: checked+focus-visible
  task-list checkbox now reads `top: auto`, `flexShrink: 1` (was `2.66667px` / `0` on
  `fe69d37`, Obsidian's own `.task-list-item-checkbox { top: 0.2em }` /
  `input[type=checkbox] { flex-shrink: 0 }` leaking through).
- **LOW-1** (GROUP 6 comment contradicted GROUP 5b, a stale leftover from an abandoned
  two-rule split) — **FOLDED.** Comment corrected; a jest guard asserts the stale phrase
  ("UNSAFE for the task-list subject") is gone from the sheet.
- **LOW-2** (`Setting.addToggle()`, `FormModal.ts:145`, builds Obsidian's own
  `.checkbox-container > input[type=checkbox]` inside a `DseModal` — GROUP 6's
  `position: static` / hover-outline / focus-shadow / `::after` rules unintentionally
  reached it, since the modal's own dialog root carries `data-dse-theme='steel'`) —
  **FOLDED.** `:not(.checkbox-container input)` added to all four GROUP 6 subjects
  (new combined specificity (0,5,2), still comfortably beating every Obsidian rule the
  family re-grounds — jest-guarded). Real-vault re-measure (a real
  `div.checkbox-container > input[type=checkbox]` mounted under the SAME
  `[data-dse-element]` root that carries `data-dse-theme`, matching `FormModal`'s own
  ancestor condition exactly): `position` now reads `absolute` (Obsidian's own value) —
  was `static` pre-fix, per the review's isolated repro (`rect.x` 866px → 880px).
- **LOW-3** (comment claimed `.dse-minion__check` was "not styling"; it declared a dead
  `margin-right: 10px`, outranked by SC-121's own `margin: 0 0.5em 0 0` at (0,4,1)) —
  **FOLDED.** Comment corrected to name the dead declaration honestly; the declaration
  itself removed — a full `npm run shots` sweep (524 PNGs) shows **0 bytes moved**,
  confirmed dead exactly as claimed. `.dse-minion__check` stays on the element for JS
  query selection (`MinionStaminaPoolModal.ts:163`, jest-guarded).
- **LOW-4** (`buildSyntheticTaskList` called twice per scheme; every reader uses
  `querySelector`, so the second call's nodes were built but never read; `removeSynthetic
  TaskList` used `querySelector`, cleaning up only one of the two, leaving a stray node) —
  **FOLDED.** Built once now (the host pass reuses the bare pass's same nodes, same
  pattern every other GROUP's synthetic probe already used); `removeSyntheticTaskList`
  switched to `querySelectorAll` defensively (cleans up every tagged list, not just the
  first, even if this is ever called after a second build again).

### Gates (foreground, `sc202-r5fix-` prefix)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc202-r5fix-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc202-r5fix-lint.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **3813 passed / 1 skipped / 3814 total; 198 of 199 suites passed, 1 skipped; 3 snapshots**, exit 0 | `sc202-r5fix-jest.log` |
| `npm run shots` (after `npm run build-no-check`) | **524 PNGs, 0 FAIL**; `checkbox host-leak OK (2 plugin-authored checkbox kinds × 7 states [28] + 1 synthetic task-list checkbox × 7 states [14] + 2 synthetic task-list <li> decoration [4] × dark/light = 46 comparisons …)` | `sc202-r5fix-shots.log` |
| `diff` vs `sc202-r5rev-shots.log` | every gate line byte-identical except the checkbox host-leak line (expected — new state/comparison counts) and two harmless build-timing/bundle-size lines (`harness.css 364.8kb→364.9kb`, esbuild `172ms→335ms`) | `sc202-r5fix-shots-diff-vs-rev.log` |
| `check-freeze.sh …/visual-harness/shots` | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 | `sc202-r5fix-freeze.log` |
| 8 widening hashes (r3 + r4) | unchanged, `sha256sum -c` exit 0 | (verified inline, no separate log) |
| full-tree sha256 vs `sc202-r5rev-allshots.sha256` | **0 moved** — diff is pure additions: 13 stray `*--obsidian-*.png` files (by-scc-kit/encounter/hero/initiative/party/perk/scc), all pre-dating this session (timestamps Sep 1–6), unrelated leftovers from earlier `obsidian-shots`/`docs-shots` work, not produced by `npm run shots` and not part of any gate's baseline | `sc202-r5fix-allshots.sha256`, `sc202-r5fix-allshots-diff-vs-rev.log` |
| Real-vault re-measure | see per-finding closures above (HIGH-1, MED-1 bonus, LOW-2) | `sc202-r5fix-realvault-after.log` |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `sc202-r5fix-parity.log` |

**Real-vault methodology note:** the reviewer's own probe drove Scott's default Obsidian
profile; to avoid any risk of touching his live session, this round instead spawned a
fully **isolated** Obsidian instance (own `--user-data-dir`, seeded with a single vault
entry pointing at the worktree's own `demo-vault`, community plugins force-enabled via
`app.plugins.setEnable(true)` since a fresh profile defaults to restricted mode) and
closed it (`app.close()`) at the end of the probe — verified no orphaned process remained
afterward. Synthetic nodes were mounted directly inside the real `[data-dse-element]` root
found in `DS Compendium/kit/panther.md` (the same attach point `shoot.mjs`'s own
`buildSyntheticTaskList` uses), not the outer `.markdown-preview-sizer` — the first draft
of this probe attached to the wrong node (outside the plugin's own `ANCHOR` scope), which
silently measured Obsidian's un-touched native checkbox and was caught by comparing
against the review's own `1dcf516` (before) baseline before trusting the result.

### Drive-by fixes

None beyond the seven ruled findings above — LOW-1/LOW-3 are comment corrections and a
dead-declaration removal explicitly ruled in-scope by the brief, not opportunistic
drive-bys.

### Follow-ups

None new. The five follow-ups already recorded in this report (§ "Follow-ups") are
unaffected by this fix round and remain open for the ticket-owner to file.

### Artifacts (fix round)

- Battery logs: `sc202-r5fix-{tsc,lint,jest,shots,freeze,parity}.log`
- Diff-vs-review logs: `sc202-r5fix-shots-diff-vs-rev.log`, `sc202-r5fix-allshots-diff-vs-rev.log`
- Shot hashes: `sc202-r5fix-allshots.sha256`
- Real-vault log: `sc202-r5fix-realvault-after.log`
- Commit: `189aaf11b732e0bb2d8b25a04d6a6dd3afdac3e5`, on
  `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements`,
  branch `sc202-visual-harness-obsidian`, tip now `189aaf1` on `fe69d37` on `1dcf516` on
  `origin/develop` `8b65a14`
