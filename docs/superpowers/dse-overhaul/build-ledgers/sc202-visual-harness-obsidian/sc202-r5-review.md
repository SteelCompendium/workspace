# SC-202 phase 2, round 5 — INDEPENDENT REVIEW of `fe69d37` (checkbox / task-list host leak)

**Verdict: FIX-ROUND-NEEDED — 1 HIGH / 2 MED / 4 LOW.** Battery reproduced green and
deterministic on `fe69d37` (tsc/lint clean; jest **3805p/0f/1sk, 198 of 199 suites**; shots
**524 PNGs 0 FAIL ×2**, every prior gate line byte-identical to `sc202-r4rerev-shots.log`;
**`freeze OK (252/252 …)` ×2**; 8 widening hashes OK ×2; **0 of 524 shot bytes moved**,
proven in BOTH directions; parity **0/0/16** last). Can-fail reproduced exactly: **166
problems (60 shown + "… and 106 more"), exit 1**, other six host-leak gates still OK.
**HIGH-1: GROUP 2's mid-round subject fix (0,3,1) silently outranks its own GROUP 3/4/5
companions (0,3,0) — `outline: none` from GROUP 2 wins at `:focus-visible`, so a markdown
task-list checkbox inside a plugin body now has NO focus ring at all in a real vault
(measured: `outline-style: none`, `outline-width: 0px`, `box-shadow: none`, on a node that
`matches(':focus-visible')`). That is an a11y regression and a verbatim repeat of round 4's
MED-1; the bare-vs-host sweep is structurally blind to it (LOW-4's own lesson).**
**Item-6 crop verdict: the shipped checkbox crops were BYTE-IDENTICAL (both sha256
`67bba453…`) and carried zero information; I re-shot all four with a checked + focused box
in frame on both bundles — they now differ and every claimed change is visible and
measured.** Leak-OUT clean by measurement; census, `marked` claim and the 5 call sites all
confirmed (with one 6th surface the grep triple misses, LOW-2).

---

## 0. What I ran (all foreground, all logs under `…/sc202-visual-harness-obsidian/`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc202-r5rev-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc202-r5rev-lint.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **3805 passed / 0 failed / 1 skipped / 3806 total; 1 skipped suite, 198 passed, 198 of 199 total**; 3 snapshots; exit 0 | `sc202-r5rev-jest.log` |
| `npm run shots` ×2 | **524 PNGs, 0 FAIL** both runs; all gate lines identical between runs | `sc202-r5rev-shots.log`, `sc202-r5rev-shots2.log` |
| `check-freeze.sh …/visual-harness/shots` ×2 | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 both times | `sc202-r5rev-freeze.log`, `sc202-r5rev-freeze2.log` |
| widening hashes (`sc202-r3-widening.txt` 6 + `sc202-r4-widening.txt` 2) | 8/8 `OK` against a fresh sweep, twice | — |
| own sha256 sweep of all 524 `*--steel-*.png` | `diff` **empty (0 lines)** against `sc202-r5-preedit-allshots.sha256`, `sc202-r5-allshots.sha256`, `sc202-r5-allshots-run2.sha256` **and** against my own base-CSS (`1dcf516`) run → **0 moved, both directions** | `sc202-r5rev-allshots.sha256`, `sc202-r5rev-allshots-run2.sha256`, `sc202-r5rev-canfail-allshots.sha256` |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `sc202-r5rev-parity.log` |

**"198 of 199" explained (brief item 7):** `test/unit/data/migrationCensus.test.ts:45` is
`const maybe = TREE === undefined ? describe.skip : describe;` — its corpus tree env var is
unset, so its one test (and therefore its whole suite) is skipped. That is the `1 skipped`
suite and the `1 skipped` test. Nothing in this round touches it.

New gate line, verbatim:

```
checkbox host-leak OK (2 plugin-authored checkbox kinds × 6 states [24] + 1 synthetic task-list checkbox × 6 states [12] + 2 synthetic task-list <li> decoration [4] × dark/light = 40 comparisons against the real Obsidian app.css under a real .markdown-preview-view.markdown-rendered ancestor: every sampled property is identical with and without it; Obsidian 1.14.0, sha256 013ed841… does not match the round's pin f612f1e8… — sweeping against it anyway, a version drift, not a defect)
```

`diff` of the r4 re-review reference gate lines vs mine: **one added line (the checkbox
one), nothing changed** — brief item 5 satisfied.

**Can-fail (brief item 4), reproduced myself.** Saved `styles-source.css` aside (never
`git checkout`), swapped in `git show 1dcf516:styles-source.css`, `npm run shots`:
`CHECKBOX HOST-LEAK VIOLATED`, **exit 1, 60 shown + "… and 106 more" = 166**
(`sc202-r5rev-canfail.log`), while the other six host-leak gates stayed `OK` — the failure
is isolated to this family. Restored, sha256 back to `d2c92c59…`, tree clean.

**What the 40 comparisons are made of, and whether every re-grounded state is really
sampled.** `pluginKindCount = 2` (`negotiation|(no class)` and `project|(no class)`) × 6
states × 2 schemes = 24; 1 synthetic task-list checkbox × 6 states × 2 = 12; 2 synthetic
`<li>` rows × 2 = 4. All six states are genuinely driven: `checked`/`indeterminate`/
`disabled` through real DOM properties (`.checked`, `.indeterminate` +
`data-indeterminate="true"`, `.disabled`), `hover`/`focus-visible` through CDP
`CSS.forcePseudoState` with a `matches(':<state>')` assertion per record and a 250 ms
settle wait. `disabled` is a genuinely vacuous 8 of the 40 (Obsidian's rule keys the literal
string `[disabled=true]`, which `.disabled = true` never produces — I re-measured
`pointer-events` unchanged, so the report's claim holds). **What is NOT sampled is any
COMBINED state** — see MED-1. Gate-line arithmetic nit: "`[24] + [12] + [4] × dark/light =
40`" reads as if `× dark/light` applies to the sum; each bracket already includes it.

---

## 1. Property-set completeness (brief item 1) — enumerated from the real sheet

Extracted `app.css` from the installed asar myself
(`~/.config/obsidian/obsidian-1.14.0.asar`, 664,458 bytes, sha256
`013ed841d76674cf1e30f555586774eb2450b5cd02662c8f0cd46b267f973dd1` — identical to
`visual-harness/dist/obsidian-app.css`), walked it with `obsidian-host-pin.mjs`'s
`iterRules` (3,924 rules; never the `css` npm package) and kept every rule whose selector
list mentions `checkbox|task-list|checklist|is-checked|data-task|:checked|indeterminate`
→ **82 rules** (`/tmp/…/r5rev/census.txt`). Discarding the PDF-viewer (`.annotationLayer`,
`.xfa*`), toggle-widget (`.checkbox-container*`), source-mode (`.markdown-source-view*`),
reveal, bases and file-tree families that cannot reach a plugin root, the reaching set is:

| # | Obsidian rule (spec.) | Properties | Re-grounded? |
|---|---|---|---|
| 1 | `input[type=checkbox]` (0,1,1) | appearance, border-radius, border, **flex-shrink**, padding, margin, margin-inline-end, width, height, position, transition | all but `flex-shrink` — **MED-2** |
| 2 | `input[type=checkbox][disabled=true]` (0,2,1) | pointer-events | n/a, never matches (measured) |
| 3 | `input[type=checkbox]:active, :focus` (0,2,1) | outline, border-color | GROUP 2/4 |
| 4 | `@media(hover:hover) …:hover` (0,2,1) | outline, border-color | GROUP 2/3 |
| 5 | `input[type=checkbox]:focus-visible` (0,2,1) | box-shadow | GROUP 2/4 — **but see HIGH-1** |
| 6 | `input[type=checkbox]:checked:after` (0,2,2) | content + 9 mask/box props | GROUP 5b (`content: none`) |
| 7 | `input[type=checkbox]:checked` (0,2,1) | background-color, border-color | GROUP 2/5 |
| 8 | **`@media(hover:hover) input[type=checkbox]:checked:hover` (0,3,1)** | background-color, border-color | **NOT outranked — MED-1** |
| 9 | `[data-indeterminate="true"]:not(:checked):after` (0,3,2) | content + 10 props | GROUP 5b |
| 10 | `.task-list-item-checkbox` (0,1,0) | width, height | GROUP 2 |
| 11 | `.markdown-preview-view .task-list-item-checkbox` (0,2,0) | position, **top**, margin-inline-end | position/margin yes; **`top` no — MED-2** |
| 12 | `ul > li.task-list-item` (0,1,2) | list-style | GROUP 1 (deliberate adoption) |
| 13 | `ul > li.task-list-item > [p >] .task-list-item-checkbox` (0,2,2)/(0,2,3) | margin-inline-start | GROUP 2 (the mid-round fix) |
| 14 | `ul > li.task-list-item[data-task="x"/"X"]` (0,2,2) | text-decoration, color | GROUP 1 |
| 15 | `.markdown-rendered .task-list-item > .list-bullet` (0,2,1) | display | inert — no `.list-bullet` exists in reading view (measured, §4) |

**Token probe on `body` (r4 MED-3 method), executed.** With the real host sheet injected I
set `--checkbox-{radius,size,border-color,border-color-hover,color,color-hover,
marker-color,margin-inline-start}`, `--checklist-{done-decoration,done-color}`,
`--background-modifier-border-focus` and `--text-normal` to absurd values on `body` with
`!important` and re-read: **75 samples, 2 diffs, both `::after` `background-color`
tracking `--checkbox-marker-color` on a pseudo-element whose `content` is `none`** — i.e. a
box that does not exist, cosmetically inert, and my own probe's over-sampling rather than a
leak. Every real property (13 px size, 0 radius, transparent fill, `margin`, the
`margin-inline-start` pull-back, the `<li>` decoration/colour) held. The re-grounding is
**structural, not a coincidence of matching token defaults**
(`sc202-r5rev-tokenprobe.log`).

---

## 2. Findings

### HIGH-1 — GROUP 2 outranks its own GROUP 3/4/5 companions; the task-list checkbox loses its focus ring entirely (a11y regression, repeat of r4 MED-1)

**Where:** `styles-source.css:16759` (GROUP 2 subject) vs `:16787` (GROUP 3), `:16803`
(GROUP 4), `:16817` (GROUP 5); the specificity guards that miss it,
`test/dom/theme/checkboxTaskListHostRegrounding.test.ts:295,301,307`.

**The arithmetic.** The mid-round fix moved GROUP 2's subject to
`:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(li.task-list-item)
input.task-list-item-checkbox` = **(0,3,1)**. GROUP 3/4/5 were left on the OLD flat anchor
`… :where(input.task-list-item-checkbox):<state>` = **(0,3,0)**. (0,3,1) > (0,3,0), so
GROUP 2's unconditional declarations beat all three state companions. GROUP 2 declares
`outline: none` — GROUP 4's `outline: auto 1px -webkit-focus-ring-color` never applies.

**Measured, isolated repro** (`bash`-driven Playwright, one `<li class="task-list-item">`
+ `<input class="task-list-item-checkbox">`, CDP-forced `:focus-visible`, no host sheet at
all — so this is purely a plugin-internal cascade defect):

```
bare native checkbox, NO plugin CSS (the value GROUP 4 exists to restore)
        => {"fv":true,"outline":"rgb(16, 16, 16) auto 1px","outlineStyle":"auto","outlineWidth":"1px"}
GROUP 4 only
        => {"fv":true,"outline":"rgb(16, 16, 16) auto 1px","outlineStyle":"auto","outlineWidth":"1px"}
GROUP 2 + GROUP 4 (as shipped in fe69d37)
        => {"fv":true,"outline":"rgb(0, 0, 0) none 3px","outlineStyle":"none","outlineWidth":"3px"}
GROUP 2 + GROUP 4 with the prescribed subject fix
        => {"fv":true,"outline":"rgb(16, 16, 16) auto 1px","outlineStyle":"auto","outlineWidth":"1px"}
```

**Measured again in a REAL vault** (spawned Obsidian 1.14.0, `DISPLAY=:1`,
`kit/panther.md` seeded with a real task list, reading view, CDP `forcePseudoState` on the
`[x]` row's checkbox — `matches(':focus-visible') === true` in both runs):

| | `1dcf516` (before) | `fe69d37` (after) |
|---|---|---|
| `outline` | `rgb(229, 151, 0) auto 1px` | **`rgb(255, 255, 255) none 0px`** |
| `outline-style` / `-width` | `auto` / `1px` | **`none` / `0px`** |
| `box-shadow` | `rgb(85, 85, 85) 0px 0px 0px 2px` | `none` |

So before the round a keyboard user got two indicators (the UA ring + Obsidian's grey
box-shadow ring); after it they get **none**. `sc202-r5rev-realvault-{before,after}.json`.

**Failure scenario.** A GM tabs through a checklist rendered inside a plugin card (career /
class prose, montage guide, any `MarkdownRenderer` field — exactly the surface this round
exists to fix) and has no idea which item has focus. This is the same defect the ledger
records as round 4 MED-1 (`outline: none` killing `:focus-visible`), reintroduced.

**Why nothing caught it.** The sweep compares bare-vs-host with the plugin sheet present on
BOTH sides, so `outline: none` is identical either way → 0 diff. That is precisely the
round-4 LOW-4 blind spot the fold in this very commit documents for links; it applies here
to a property that is *wrong* on both sides. The jest specificity guards only compare each
companion against **Obsidian's** rules, never against GROUP 2's own (0,3,1).

**Prescribed fix (one change closes HIGH-1 and MED-1 together).** Give GROUP 3/4/5 the same
subject as GROUP 2/5b:

```css
:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(li.task-list-item) input.task-list-item-checkbox:hover          { … }   /* (0,4,1) */
:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(li.task-list-item) input.task-list-item-checkbox:focus-visible  { … }   /* (0,4,1) */
:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(li.task-list-item) input.task-list-item-checkbox:checked        { … }   /* (0,4,1) */
```

(0,4,1) beats GROUP 2's (0,3,1) **and** Obsidian's `:checked:hover` (0,3,1) — proven for
the `:focus-visible` case in the table above. Then:

1. add a jest specificity assertion that **each state companion strictly outranks GROUP 2's
   own subject**, not only Obsidian's rules;
2. add an ABSOLUTE runtime assertion to `assertCheckboxHostLeak` (not a bare-vs-host diff):
   with `:focus-visible` forced, the task-list checkbox's `outlineStyle` must be `auto` and
   `outlineWidth` `1px`. A bare-vs-host contract can never see this class of defect.

### MED-1 — `input[type=checkbox]:checked:hover` (0,3,1) is enumerated in the block comment and then never outranked; the combined state is not sampled

**Where:** `styles-source.css:16745` (the comment lists
`@media(hover:hover) :checked:hover{background-color; border-color}` among the rules the
control is "reached by"), rule at `:16817` (GROUP 5, (0,3,0)); sweep states at
`visual-harness/shoot.mjs:3665` (`STATES` has no combined entry).

GROUP 5 (0,3,0) loses to (0,3,1) outright. GROUP 2 (0,3,1) merely **ties** it, so the only
thing holding the line is document order (Obsidian loads `app.css` first, plugin CSS after
— `injectRealHostCss` faithfully models this by `prepend`ing the host sheet). Executed both
orders on the shipped tree:

```
PREPENDED-HOST (faithful)  diffs: 4      (top, flexShrink only — MED-2)
APPENDED-HOST              diffs: 5      + ORDER-DIFF tasklist|checked+hover backgroundColor:
                                           bare="rgba(0, 0, 0, 0)" host-appended="rgb(166, 138, 249)"
```

`sc202-r5rev-combostate.log`. So the checked-and-hovered task-list checkbox is one
source-order accident away from wearing Obsidian's violet hover accent — exactly the
round-2 MED-1 rule ("never rely on coincidental neutralisation") this block cites twice.

**Failure scenario.** A user CSS snippet or a future Obsidian sheet ordering change flips
the tie and a checked task-list checkbox inside a plugin card turns violet on hover.

**Prescribed fix.** The HIGH-1 subject fix raises GROUP 5 to (0,4,1) and closes it
outright. Additionally add a combined `checked+hover` (and, cheaply,
`checked+focus-visible`) pass to `STATES` in `assertCheckboxHostLeak` so the gate can see
it.

### MED-2 — `top` and `flex-shrink` are re-grounded nowhere and sampled nowhere

**Where:** `styles-source.css:16759` (GROUP 2's declaration list);
`visual-harness/shoot.mjs:3424` (`CHECKBOX_CONTROL_PROPS`).

Measured leaking on the shipped tree, harness and real vault alike:

```
DIFF tasklist|checked      top:        bare="auto" host="2.66667px"     (.markdown-preview-view .task-list-item-checkbox { top: 0.2em })
DIFF tasklist|checked      flexShrink: bare="1"    host="0"             (input[type=checkbox] { flex-shrink: 0 })
DIFF tasklist|checked+hover  (same two)
```

Real vault, `fe69d37`: `cbTop: 2.66667px` on all three task-list rows.

Both are cosmetically inert **today** — `top` only because GROUP 2 forces
`position: static`, `flex-shrink` only because the `<li>` is not a flex container — but the
block explicitly restates half a dozen other properties (`cursor`, `outline`, `box-shadow`,
`border-color`) that are *equally* inert today, citing round-2 MED-1. Leaving these two out
is inconsistent, and neither is in the sampled property list, so the gate could never tell
you if they stopped being inert.

**Failure scenario.** A later round sets `position: relative` on this control (or a plugin
container becomes `display: flex`) and Obsidian's value silently takes over, with the gate
green.

**Prescribed fix.** Add `top: auto;` and `flex-shrink: 1;` (or `flex: 0 1 auto`) to GROUP
2, and add `'top'`, `'flexShrink'` to `CHECKBOX_CONTROL_PROPS`. Verify the 40-comparison
line stays 0-diff and 0 shot bytes move.

### LOW-1 — GROUP 6's comment contradicts GROUP 5b's; a stale claim from the reverted design survived

**Where:** `styles-source.css:16878-16881`.

> "`::after` uses the SAME shared `:is(:checked, [data-indeterminate="true"])` shape GROUP
> 5b's own comment explains is **UNSAFE for the task-list subject** (a specificity tie the
> task-list subject cannot win with one rule) — safe HERE because …"

GROUP 5b's comment (`:16821-16839`) explains the *opposite*: after GROUP 2's subject fix a
single shared companion at (0,4,2) beats both Obsidian rules, which is why the two-rule
split was reverted (report §6). This is a leftover from the abandoned design and is the
same class of finding as round 4's MED-5 (false comment → FIX).

**Prescribed fix.** Rewrite `:16878-16881` to say the shared `:is()` companion is safe in
BOTH places, with the two specificities ((0,4,2) task-list, (0,5,2) SC-121) and the note
that it was only unsafe against the FIRST DRAFT's flat (0,2,0) anchor.

### LOW-2 — a 6th plugin checkbox surface the round's grep triple cannot see: `Setting.addToggle()`; GROUP 6's `position: static` now reaches Obsidian's own toggle widget

**Where:** `src/authoring/FormModal.ts:145` (`setting.addToggle(...)`); rule at
`styles-source.css:16884` (`… input[type='checkbox']:not(.task-list-item-checkbox)
{ position: static; }`).

The report's enumeration greps `type: 'checkbox'` / `type="checkbox"` / `createEl('input'`
— all five hits confirmed by me, and there is no `createElement('input')` or
`.type = 'checkbox'` anywhere. But `new Setting(...).addToggle(...)` makes Obsidian build
`div.checkbox-container > input[type='checkbox']`, and `FormModal` extends `DseModal`
(`managedModal.ts:98` stamps `data-dse-theme` on the dialog root), so **both SC-121 and now
GROUP 6 reach it**. Isolated measurement (host sheet + SC-121, with and without GROUP 6):

```
SC-121 only (pre-r5): position "absolute", opacity 0, rect x=866
SC-121 + r5 GROUP 6 : position "static",   opacity 0, rect x=880   ← GROUP 6 (0,4,1) beats
                                                                     `.checkbox-container input[type=checkbox]` (0,2,1)
```

Cosmetically inert today (the input stays `opacity: 0`; the container has a fixed
`--toggle-s-width`/height, so nothing reflows), so this is LOW, not a blocker — but it is an
un-enumerated, un-tested reach into a host widget, and no gate covers it (no modal fixture
exists in the browser gallery at all).

**Prescribed fix.** Either exclude it — `:not(.checkbox-container > *)` is awkward; simpler
is `:not(.task-list-item-checkbox):not(.checkbox-container input)` — or, if the reach is
deliberate, say so in the block comment and add `addToggle`/`.checkbox-container` to the
enumerated call-site table so the next round does not re-derive it. Add
`Setting.addToggle` to the grep set the report/CSS comment documents.

### LOW-3 — `.dse-minion__check` is described as "not styling"; it declares `margin-right`, and 3 of the 5 call sites are never runtime-sampled

**Where:** `styles-source.css:16638` ("classed (for JS query selection, not styling)");
the actual rule at `styles-source.css:1858` — `.dse-minion__check { margin-right: 10px; }`.

The claim is false. In practice the declaration is dead (SC-121's `margin: 0 0.5em 0 0` at
(0,4,1) outranks (0,1,0) and sits later in the file), so the substance — "the minion
checkbox computes like the unclassed ones" — still holds; only the sentence is wrong.
Related coverage gap: `pluginKindCount` is **2** (`negotiation`, `project`) and the browser
gallery renders no modal fixture at all, so `MinionStaminaPoolModal.ts:163` is covered by
selector analysis only, never at runtime.

**Prescribed fix.** Correct the sentence to "classed for JS query selection and one dead
`margin-right` declaration SC-121 outranks (verified)", and state plainly in the report that
2 of the 5 sites are runtime-sampled and the modal one is covered analytically.

### LOW-4 — `buildSyntheticTaskList` is called twice per scheme; the second `<ul>` is dead and is left in the DOM

**Where:** `visual-harness/shoot.mjs:3690` (`built`) and `:3721` (`built2`);
`removeSyntheticTaskList` at `:3573`.

The host pass builds a SECOND `<ul data-dse-tlul>`, but every reader
(`readSyntheticTaskListLi`, `[data-dse-tlcb="rest"]`, `[data-dse-tlcb="checked"]`) uses
`document.querySelector`, which returns the FIRST match — the bare pass's nodes. So the
host-pass records come from the same nodes the bare pass used (correct, but not what the
code reads as), the second `<ul>` contributes nothing, and `removeSyntheticTaskList` removes
only one of the two — leaving a stray synthetic list in the DOM after the final (light)
pass. Harmless today (this is the last gate; 0 shot bytes move, verified), but it is dead
code that will mislead the next reader.

**Prescribed fix.** Delete the `built2` call and its guard; the nodes from the bare pass are
already the right ones (and are correctly carried into the `.markdown-preview-view` wrapper
by `wrapMountInMarkdownRendered`). Make `removeSyntheticTaskList` remove **all**
`[data-dse-tlul]` nodes.

---

## 3. Item 3 — the two halves

**(a) Plugin-authored checkboxes — the 5 call sites are exactly right.**
`grep -rn "type: *['\"]checkbox['\"]" src/ main.ts` returns exactly the five the report
lists (`ArgumentView.ts:57`, `MotivationsPitfallsView.ts:37`, `project/view.ts:213`,
`project/view.ts:249`, `MinionStaminaPoolModal.ts:163`); `type="checkbox"`,
`createElement('input')` and `.type = 'checkbox'` return nothing. The 6th surface
(`addToggle`) is LOW-2. `tagCheckboxes` keys on `(element, classes)`, so the five collapse
to **2 distinct kinds in the gallery** (`negotiation|(no class)`, `project|(no class)`);
the modal one never renders in the browser harness.

**The block does NOT outrank SC-121.** SC-121's base block (`styles-source.css:10618`)
declares appearance / -webkit-appearance / box-sizing / width / height / flex / margin /
vertical-align / border / border-radius / background-color / cursor (+ `:checked`
background/border at `:10632`, `:disabled` at `:10636`). GROUP 6 declares **only**
`position`, `:hover`'s `outline`, `:focus-visible`'s `box-shadow` and the `::after`
`content` — a disjoint set. Measured consequence: **0 of 524 shot bytes moved** (both
directions), and in a real vault the plugin's own fill (`rgb(77,184,199)`), size
(13.33 px), radius (2.67 px) and 2 px teal focus outline are byte-for-byte unchanged
before/after.

**(b) Markdown task lists — the `marked` claim is TRUE, and the synthetic node is
CSS-equivalent but not shape-exact.**
`marked@18.0.6` (the harness shim, `visual-harness/shim/obsidian.ts:10,40`), measured
directly:

```
marked.parse("- [ ] alpha\n- [x] beta\n")
  → "<ul>\n<li><input disabled=\"\" type=\"checkbox\"> alpha</li>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> beta</li>\n</ul>\n"
```

No `task-list-item`, no `data-task`, no `task-list-item-checkbox` — the report's claim is
confirmed, and a gallery fixture genuinely cannot produce Obsidian's shape.

**Real Obsidian reading-view DOM, recorded over CDP in a live vault** (`kit/panther.md`
seeded with `- [ ]` / `- [x]` / `- [-]`, rendered through `MarkdownRenderer` inside the
`ds-scc` card):

```html
<ul class="contains-task-list">
  <li data-task=""  class="task-list-item"            dir="auto"><input           type="checkbox" class="task-list-item-checkbox">Sharpen the heavy weapon</li>
  <li data-task="x" class="task-list-item is-checked" dir="auto"><input checked="" type="checkbox" class="task-list-item-checkbox">Oil the harness</li>
  <li data-task="-" class="task-list-item is-checked" dir="auto"><input checked="" type="checkbox" class="task-list-item-checkbox">Cancelled errand</li>
</ul>
```

Ancestor chain, verbatim:
`LI.task-list-item → UL.contains-task-list → DIV.dse-kit__equip → DIV.dse-card__band →
DIV.dse-card.dse-chrome-anchor → DIV → DIV.block-language-ds-scc → DIV.el-pre →
DIV.markdown-preview-sizer.markdown-preview-section →
DIV.markdown-preview-view.markdown-rendered.node-insert-event.allow-fold-headings.allow-fold-lists.show-indentation-guide.show-properties`
— i.e. **`wrapMountInMarkdownRendered` reproduces the real wrapper class list exactly.**

Differences vs `buildSyntheticTaskList` (`shoot.mjs:3547`), each verified CSS-inert against
this sheet:

| Real | Synthetic | Inert because |
|---|---|---|
| `data-task=""` for `- [ ]` | `data-task=" "` | no rule keys `[data-task=" "]`; but `readSyntheticTaskListLi` selects `[data-task=" "]`, which would never match a real node |
| `<li class="task-list-item is-checked">` on `[x]` AND `[-]` | no `is-checked` | **0 occurrences of `is-checked` in app.css 1.14.0** |
| `<ul class="contains-task-list">` | bare `<ul>` | **0 occurrences of `contains-task-list` in app.css 1.14.0** |
| `dir="auto"` | absent | no rule |
| no `.list-bullet` child | none | `.markdown-rendered .task-list-item > .list-bullet` is inert in reading view |

Recommend (non-blocking) that the synthetic builder mirror `contains-task-list`,
`is-checked` and the empty `data-task` so a future Obsidian version that starts keying on
them is caught rather than missed.

---

## 4. Item 6 — the crops: VERDICT and what I re-shot

**Verdict: the shipped checkbox crops were worthless — `sc202-r5-realvault-checkbox-before.png`
and `-after.png` were the SAME FILE (both sha256 `67bba453…`, both 368,437 bytes).** The
owner's read was right: they showed an unchecked, unfocused card, and every claimed change
lives only in the checked and focused states. I re-shot all four crops (same paths,
overwritten) from two real Obsidian runs on the two bundles, with the box **checked and
`:focus-visible`-forced**, and they are now four distinct files:

```
4f6856ca…  sc202-r5-realvault-checkbox-after.png
19209906…  sc202-r5-realvault-checkbox-before.png
92d94858…  sc202-r5-realvault-tasklist-after.png
49a4747d…  sc202-r5-realvault-tasklist-before.png
```

### Caption — `sc202-r5-realvault-checkbox-{before,after}.png` (colours named, Scott is colorblind)

Same node, same coordinates, dark chrome: the negotiation card's first "Appeals to
Motivation" checkbox ("Higher Authority"), **checked and keyboard-focused**; "Peace" below
it is left unchecked and unfocused as an in-frame control.

- **BEFORE (`1dcf516`)** — the checked box carries a **dark-charcoal check-mark glyph**
  (`rgb(28,28,28)`, Obsidian's `--checkbox-marker-color`, painted by a 16 px `::after`
  overlaid on a 13.33 px control) and wears **two rings**: a **medium-grey** one
  (`rgb(85,85,85)`, Obsidian's `box-shadow: 0 0 0 2px`) hugging the box, and the plugin's own
  **teal-cyan** ring (`rgb(77,184,199)`, `outline: solid 2px`) outside it.
- **AFTER (`fe69d37`)** — a **plain solid teal-cyan box** (`rgb(77,184,199)`, unchanged
  fill and unchanged 13.33 px size), **no glyph**, and **one ring only** — the plugin's own
  teal-cyan focus outline. The grey ring and the charcoal tick are gone.
- Unchanged either way: fill colour, border colour, 13.33 px size, 2.67 px radius, the
  plugin's own 2 px teal focus outline, and the unchecked "Peace" box.
- Also fixed but invisible: `position` `relative → static`, `top` `0px → auto`.

Direction check (the round-4 trap): the crop labelled **before** is the one with the extra
tick and extra grey ring; that matches the measurement table above line for line.

### Caption — `sc202-r5-realvault-tasklist-{before,after}.png`

Three seeded task items inside the Panther kit card, dark chrome; the middle one
(`- [x] Oil the harness`) is keyboard-focused in both shots.

- **BEFORE (`1dcf516`)** — Obsidian's own control: **16 px, rounded (4 px radius)**;
  unchecked = transparent with a **grey** hairline (`rgb(102,102,102)`); checked = a solid
  **violet-purple** square (`rgb(138,92,245)`) with a **dark-charcoal** tick; the completed
  line "Oil the harness" is **struck through** and dimmed to **light grey**
  (`rgb(179,179,179)`). The focused one wears a near-white/grey ring.
- **AFTER (`fe69d37`)** — the browser's own native widget: **13 px, square (0 radius), no
  border**; unchecked = a **dark charcoal** square with a grey outline; checked = a **pale
  periwinkle-blue** square (Chromium's dark-scheme accent) with a **dark charcoal** tick;
  **no strikethrough**, the completed line's text returns to the card's ordinary ink
  (`rgba(220,226,230,0.88)`). **No focus ring at all** — that is HIGH-1, visible in the
  crop.
- `- [-]` ("Cancelled errand") renders identically to `- [x]` in both bundles (Obsidian's
  decoration rule only keys `x`/`X`), so the "cancelled" state is indistinguishable from
  "done" before and after.

**"Does a bare native checkbox on a dark card look broken?" — No.** Chromium honours the
dark `color-scheme`, so it paints its dark-mode widget: a charcoal square when unchecked
and a pale periwinkle-blue square with a dark tick when checked. It is **not** a white box
on dark and it does not read as a rendering fault. What it *is*, plainly: **off-palette and
visibly un-designed** — a small, square, browser-default control with a blue accent that
belongs to no part of the Steel language, sitting inside a card whose own checkboxes are
rounded teal-cyan. Combined with the vanished strikethrough (a completed item now looks
exactly like an open one) and the vanished focus ring (HIGH-1), the task-list half is the
round's one genuinely user-visible downgrade. The implementer's FINAL-ASK items 1 and 2 are
the right questions to put to Scott; I would add that HIGH-1 must be fixed regardless of
how he answers them.

---

## 5. Items 8 and 9

**Scope / leak-OUT — clean, measured.** Every r5 rule is anchored on
`:is([data-dse-element], .dse-modal)` or `[data-dse-theme='steel']`, both of which the
plugin stamps only on element roots and modal dialogs. Measured in the live vault: a task
list in plain note prose, outside every plugin root, on the `fe69d37` bundle, keeps
Obsidian's own look exactly —

```
{ dataTask:"",  cbWidth:"16px", cbAppearance:"none", cbBorderRadius:"4px", cbBackgroundColor:"rgba(0,0,0,0)",
  cbPosition:"relative", cbMargin:"0px 8px 0px -24px", liTextDecoration:"none" }
{ dataTask:"x", cbWidth:"16px", cbAppearance:"none", cbBorderRadius:"4px", cbBackgroundColor:"rgb(138, 92, 245)",
  cbPosition:"relative", cbMargin:"0px 8px 0px -24px", liTextDecoration:"line-through", liColor:"rgb(179,179,179)",
  cbAfterContent:"\"\"" }
```

— identical to the pre-round values (`sc202-r5rev-realvault-leakout.json`). Nothing leaks
out.

**`list-style: none` adoption — the right call, and documented.** Proven by the can-fail
run rather than argued: with the r5 block absent the sweep reports
`list-style reads "outside none disc" bare` — i.e. NOT restating it really does leave a
disc bullet beside the checkbox (the double marker the comment claims). The block comment
(`styles-source.css:16690-16706`) calls the adoption out explicitly, the sweep asserts the
literal value on both passes rather than a bare-vs-host diff, and the jest test pins it.
Correct, and correctly singled out.

**LOW-4 fold is comment-only.** The `shoot.mjs` diff at `LINK_REST_PROPS` touches only the
JSDoc block; the `const LINK_REST_PROPS = [...]` line is unchanged context. Confirmed by
`git diff 1dcf516..fe69d37 -- visual-harness/shoot.mjs`.

**Tests (item 9) — can-fail proven by mutation** (`sc202-r5rev-testmutations.log`, each
mutation applied to a fresh copy of the shipped sheet, `styles-source.css` restored to
sha256 `d2c92c59…` at the end):

| Mutation | Result |
|---|---|
| baseline | 2 suites, **58 passed** |
| drop GROUP 1's `list-style: none;` | **1 failed** / 57 passed |
| drop GROUP 2's `cursor: default;` | **1 failed** / 57 passed |
| drop GROUP 6's `position: static` rule | **3 failed** / 55 passed (both suites red) |
| comment OUT GROUP 4's `outline: auto 1px …` | **1 failed** / 57 passed — **comment-safe** |
| append a NEW 84-`=` banner + `:where(table){border-collapse:collapse}` AFTER the block | **58 passed** — the scope fence is correctly BOUNDED and does not read the next round's block |

`controlDensity.test.ts` `boxRules.length` 4 → 8 is a **legitimate count change, not a
loosened assertion**: the four added rules are exactly GROUP 6's four, every one still
asserted to carry `STEEL_PRINT_SCOPE` and `:not(.task-list-item-checkbox)`, and the
`focusArm` rewrite is compensated by a new test asserting `focusArms` has **exactly 2** and
that the non-ring arm is `box-shadow`-only with no `outline`. Coverage went up, not down.

---

## 6. Tree left as found

`git status --porcelain` inside `draw-steel-elements` — **empty** (checked before and
after; my five probe scripts under `visual-harness/` were deleted, `styles-source.css`
restored by hash, `main.js`/`styles.css` removed per the dse-verify protocol).
`demo-vault/.obsidian/app.json` sha256 `85e40d17…` — byte-unchanged; the camera never
dirtied it. The temporarily seeded `kit/panther.md` task list and the prose task list in
`Harness/scc-demo.md` were both reverted by the probe (`grep` for task-list syntax across
`demo-vault/` returns 0), and I confirmed the implementer left nothing behind either.
Superproject shows the same single ` M draw-steel-elements` pointer entry it had at session
start. HEAD is `fe69d37fc7e3d57597eb9b4a3a1f317649c232d0`; nothing committed, nothing
pushed.

## 7. Artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/`:

- This report: `sc202-r5-review.md`
- Battery: `sc202-r5rev-{tsc,lint,jest,shots,shots2,freeze,freeze2,parity}.log`
- Can-fail: `sc202-r5rev-canfail.log`, `sc202-r5rev-canfail-allshots.sha256`
- Shot hashes: `sc202-r5rev-allshots.sha256`, `sc202-r5rev-allshots-run2.sha256`
- Probes: `sc202-r5rev-combostate.log` (combined states + unsampled properties, both sheet
  orders), `sc202-r5rev-tokenprobe.log` (body-scoped `--checkbox-*`/`--checklist-*`
  override probe), `sc202-r5rev-testmutations.log` (six jest mutations)
- Real vault: `sc202-r5rev-vault-{before,after}.log`,
  `sc202-r5rev-realvault-{before,after}.json`, `sc202-r5rev-realvault-leakout.json`
- Re-shot crops (same paths as the report's):
  `sc202-r5-realvault-checkbox-{before,after}.png`,
  `sc202-r5-realvault-tasklist-{before,after}.png`

---

# Scoped re-review of `189aaf1`

**Verdict: APPROVE.** All 7 findings closed and verified by execution, not by reading.
HIGH-1 CLOSED — GROUP 3/4/5 now carry GROUP 2's own subject at (0,4,1); a real vault's
checked+focused task-list checkbox reads `outline: rgb(229,151,0) auto 1px` /
`outlineStyle: auto` / `outlineWidth: 1px` / `boxShadow: none` (was `none` / `0px` on
`fe69d37`), and the new ABSOLUTE gate fires when I revert the subject.
MED-1 CLOSED (`checked+hover` is now a real sampled state; host-APPENDED order holds at
`rgba(0,0,0,0)`, and reverting GROUP 5's subject makes the gate print the violet
`rgb(166,138,249)` leak). MED-2 CLOSED (`top`/`flexShrink` restated **and** sampled —
deleting `top: auto` reddens 14 lines). LOW-1/2/3/4 CLOSED, LOW-2 and LOW-3 by direct
before/after cascade measurement.
**Battery on `189aaf1`:** tsc/lint clean; jest **3813p/0f/1sk/3814, 198 of 199 suites**;
shots **524 PNGs 0 FAIL ×2**, gate lines identical between runs and to `sc202-r5rev-shots.log`
except the checkbox line (40 → **46 comparisons**); **`freeze OK (252/252 …)` ×2**; 8
widening hashes OK; **0 of 524 shot bytes moved** vs my own pre-fix `fe69d37` sweep
(the LOW-3 declaration removal moved nothing); parity **0/0/16** LAST.
One residual, non-blocking: the brief's "assert the DOM is clean after the sweep" was not
added as an assertion (the behaviour is correct and verified).

## Per-finding closure, each verified by execution

Method for the three cascade findings: apply the exact regression to `styles-source.css`
(saved aside, restored by hash to `fac36541…` afterwards) and run the full `npm run shots`
— the assertions only run when no `--element` filter is given, so a full sweep is the only
way to exercise them. One combined run carrying all three mutations
(`sc202-r5rerev-canfail-high1med1med2.log`, **exit 1, 19 problems**) produced three
distinct signatures:

```
  dark|tasklist|rest: Obsidian's real app.css changes top — "auto" without the host, "2.66667px" with it      ← MED-2 (×7 states × 2 schemes = 14)
  dark|tasklist|focus-visible ABSOLUTE: outlineStyle is "none", expected "auto" — GROUP 2 must never outrank
        GROUP 4's focus ring (HIGH-1, a repeat of round 4's MED-1)                                            ← HIGH-1 (×2 schemes)
  dark|tasklist|focus-visible ABSOLUTE: outlineWidth is "3px", expected "1px" (HIGH-1)                        ← HIGH-1 (×2 schemes)
  host-appended-order|tasklist|checked+hover ABSOLUTE: backgroundColor is "rgb(166, 138, 249)" with the host
        sheet APPENDED, expected transparent — GROUP 5 must outrank Obsidian's :checked:hover regardless of
        stylesheet order (MED-1)                                                                              ← MED-1
```

Every guard is genuinely can-fail, and each names the finding it protects.

### HIGH-1 — CLOSED

- **Specificity table, recomputed.** GROUP 2 subject
  `…:not([data-dse-print="on"]) :where(li.task-list-item) input.task-list-item-checkbox`
  = (0,3,1). GROUP 3/4/5 now append their pseudo-class to that same subject → **(0,4,1)**
  each, so every state companion strictly outranks GROUP 2 (0,4,1 > 0,3,1) as well as
  Obsidian's (0,2,1) rules. The jest guard now makes exactly the comparison the original
  round never made (`test/dom/theme/checkboxTaskListHostRegrounding.test.ts`, "EVERY GROUP
  3/4/5 state companion strictly outranks GROUP 2's OWN subject (0,3,1)"), plus a
  regression guard that the old flat `:where(input.task-list-item-checkbox):<state>`
  subjects are gone.
- **ABSOLUTE runtime assertion exists and is load-bearing** (`visual-harness/shoot.mjs`,
  in `assertCheckboxHostLeak`'s host pass): `outlineStyle !== 'auto'` and
  `outlineWidth !== '1px'` each push a problem. Reverting GROUP 4's subject to the flat
  anchor makes both fire on both schemes (quoted above) — so this is not a vacuous guard.
  It is correctly ABSOLUTE rather than bare-vs-host, which is the only shape that can see
  this defect class.
- **Real vault, `189aaf1` bundle** (isolated Obsidian 1.14.0, own scratch `--user-data-dir`
  + port 9232, `DISPLAY=:1`, `npm run build-no-check` first; a REAL task list seeded into
  `kit/panther.md`'s `equipment_text` and rendered by Obsidian's own `MarkdownRenderer`
  inside the `ds-scc` kit card — not a synthetic node), on the `- [x]` row's checkbox with
  `:focus-visible` CDP-forced and `matches(':focus-visible') === true`:

  | | `fe69d37` (my r5 review) | `189aaf1` (now) |
  |---|---|---|
  | `outline` | `rgb(255, 255, 255) none 0px` | **`rgb(229, 151, 0) auto 1px`** |
  | `outlineStyle` / `outlineWidth` | `none` / `0px` | **`auto` / `1px`** |
  | `boxShadow` | `none` | `none` |

  `auto 1px` is exactly the harness's own native `:focus-visible` value (measured in the
  bare browser as `rgb(16,16,16) auto 1px`; the keyword `-webkit-focus-ring-color` resolves
  to the host's accent, hence the orange in a vault and near-black in the bare harness —
  same declaration, environment-resolved colour). The ring is back, and the plugin's own
  ring is what paints it, not Obsidian's box-shadow.

### MED-1 — CLOSED

- `STATES` in `assertCheckboxHostLeak` is now
  `['rest','hover','focus-visible','checked','checked+hover','indeterminate','disabled']`
  — 7 states. The combined state composes a real DOM property (`.checked = true`, with the
  previous value restored) with a CDP-forced `:hover`, asserted per record via
  `matches(':hover')`; the task-list half forces `:hover` on the node that already carries
  `data-task="x"`. Comparison count rose 40 → **46** exactly as the arithmetic predicts
  (2 kinds × 7 × 2 = 28, plus 1 × 7 × 2 = 14, plus 4 `<li>` rows).
- The order question is answered structurally, not by luck: (0,4,1) beats Obsidian's
  `@media(hover:hover) input[type=checkbox]:checked:hover` (0,3,1) outright. The sweep
  proves it by re-running the measurement with the host sheet **appended** (the opposite of
  `injectRealHostCss`'s prepend) and asserting `backgroundColor === 'rgba(0, 0, 0, 0)'`.
  Reverting GROUP 5's subject makes that assertion print the violet
  `rgb(166, 138, 249)` — the exact leak I demonstrated by hand in the first pass, now gated.
- Real vault, same run: checked + hovered task-list checkbox reads
  `backgroundColor: rgba(0, 0, 0, 0)`, `afterContent: none`, `matchesHover: true`.

### MED-2 — CLOSED

`top: auto` and `flex-shrink: 1` are declared in GROUP 2, and `'top'` / `'flexShrink'` are
in `CHECKBOX_CONTROL_PROPS`. Deleting `top: auto` reddens the sweep at **every one of the 7
states × 2 schemes** (`changes top — "auto" without the host, "2.66667px" with it`), so the
restatement is load-bearing and the sampling is real. Real vault, `189aaf1`: `top: auto`,
`flexShrink: 1` (were `2.66667px` / `0` on `fe69d37`).

### LOW-1 — CLOSED

The stale claim is gone: `grep -c "UNSAFE for the task-list subject" styles-source.css` →
**0**, and a jest test now pins its absence. The rewritten GROUP 6 comment states the two
real specificities ((0,4,2) task-list, (0,5,2) GROUP 6) and no longer contradicts GROUP 5b.

### LOW-2 — CLOSED, measured before/after

All four GROUP 6 subjects now carry `:not(.checkbox-container input)` (jest-guarded across
every rule in the group), and the enumeration in the block comment documents
`Setting.addToggle()` / `FormModal.ts:145` as the sixth surface with that reasoning.
Isolated cascade probe (real `app.css` + SC-121 + the GROUP 6 rule under test, on
`div.checkbox-container > input[type=checkbox]` inside `[data-dse-theme='steel']`):

```
host only (no plugin sheet)                        => position "absolute", rectX 866
SC-121 + GROUP 6 as in fe69d37 (no exclusion)      => position "static",   rectX 880.016   ← the LOW-2 defect
SC-121 + GROUP 6 as in 189aaf1 (with exclusion)    => position "absolute", rectX 866       ← Obsidian's own value, restored
```

Real vault, `189aaf1`: the same widget shape mounted under the live themed plugin root
reads `position: absolute`, `opacity: 0`, `offsetFromContainer: 0`, container width 34px —
Obsidian's own layout, untouched. (`window.require('obsidian')` is not resolvable from the
page context, so the toggle's DOM shape is constructed rather than built by `addToggle`;
the cascade question — "does GROUP 6 reach a `.checkbox-container input` under a themed
root" — is reproduced exactly, and the isolated before/after above is decisive.)
**Note, out of scope and pre-existing:** the exclusion was added to GROUP 6 only, so
SC-121's own base block still restyles that hidden toggle input's size/border/background
(13.33 px vs Obsidian's 16 px). It is `opacity: 0`, so nothing is visible; it predates this
ticket and was not part of the ruling.

### LOW-3 — CLOSED, measured

The dead declaration is gone (a jest test greps the comment-stripped sheet for
`.dse-minion__check { margin-right: 10px }` and another asserts the class survives in
`MinionStaminaPoolModal.ts`). The "0 shot bytes moved" evidence the fix report leans on
cannot actually see this rule — no modal fixture renders in the browser gallery — so I
measured the cascade directly instead:

```
SC-121 + the DEAD .dse-minion__check rule (fe69d37)  => marginRight "6.66667px"
SC-121 only, dead rule REMOVED (189aaf1)             => marginRight "6.66667px"
```

Identical: SC-121's `margin: 0 0.5em 0 0` at (0,4,1) was already winning over the (0,1,0)
selector, so the removal is a true no-op. The comment now says so honestly.

### LOW-4 — CLOSED (with one residual)

`buildSyntheticTaskList` and `removeSyntheticTaskList` now appear **2 and 2** times, paired
1:1 (one build+remove per scheme in the bg loop, one in the appended-order block), and
`removeSyntheticTaskList` uses `querySelectorAll`, so it can never leave a stray list even
if a second build is ever reintroduced. The dead `built2` call is gone and the host pass
documents that it reuses the bare pass's nodes.
**Residual (non-blocking):** the brief asked for an assertion that the DOM is clean after
the sweep; none was added (`grep` for `data-dse-tlul` finds only the build/remove sites).
The behaviour is correct and byte-confirmed (0 of 524 shots moved, and the sweep is the
last gate before the browser closes), so this is a missing belt, not a missing brace.
Suggested for whoever touches this next: one `problems.push` if
`document.querySelectorAll('[data-dse-tlul]').length !== 0` at the end of
`assertCheckboxHostLeak`.

## Battery on `189aaf1` (foreground, logs prefixed `sc202-r5rerev-`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc202-r5rerev-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc202-r5rerev-lint.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **3813 passed / 0 failed / 1 skipped / 3814 total; 198 of 199 suites** (+8 tests vs `fe69d37`'s 3805), 3 snapshots, exit 0 | `sc202-r5rerev-jest.log` |
| `npm run shots` ×2 | **524 PNGs, 0 FAIL** both runs; gate lines byte-identical between the two runs, and identical to `sc202-r5rev-shots.log` **except** the checkbox line | `sc202-r5rerev-shots.log`, `sc202-r5rerev-shots2.log` |
| new gate line | `checkbox host-leak OK (2 plugin-authored checkbox kinds × 7 states [28] + 1 synthetic task-list checkbox × 7 states [14] + 2 synthetic task-list <li> decoration [4] × dark/light = 46 comparisons …)` | — |
| `check-freeze.sh` ×2 | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 both times | `sc202-r5rerev-freeze.log`, `sc202-r5rerev-freeze2.log` |
| 8 widening hashes (r3 6 + r4 2) | `sha256sum -c` 8/8 `OK` | — |
| sha256 of all 524 `*--steel-*.png` | `diff` **empty** vs `sc202-r5rev-allshots.sha256` (my pre-fix `fe69d37` sweep) → **0 moved**, and run1 == run2 | `sc202-r5rerev-allshots.sha256`, `sc202-r5rerev-allshots-run2.sha256` |
| combined can-fail sweep | **exit 1, 19 problems**, three distinct signatures | `sc202-r5rerev-canfail-high1med1med2.log` |
| real vault | HIGH-1 / MED-1 / MED-2 / LOW-2 all measured on the `189aaf1` bundle | `sc202-r5rerev-vault-after.log`, `sc202-r5rerev-realvault-after.json` |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `sc202-r5rerev-parity.log` |

The LOW-3 removal moved **nothing**: the 524-file sha256 sweep is byte-identical to the
pre-fix one in both directions.

## Tree left as found

`git status --porcelain` in `draw-steel-elements` — **empty**; `styles-source.css` restored
by hash to `fac36541c283427d8a066111f9ad82e3c0d7a0d6a92cf38c47f472f984fe37e9` (= `189aaf1`);
my three probe scripts under `visual-harness/` deleted; `main.js`/`styles.css` removed;
`demo-vault/.obsidian/app.json` sha256 `85e40d17…` unchanged; the temporarily seeded
`kit/panther.md` task list reverted (0 hits); no stray Obsidian process on the scratch
port. HEAD `189aaf11b732e0bb2d8b25a04d6a6dd3afdac3e5`; nothing committed, nothing pushed.
Superproject unchanged (` M draw-steel-elements`, as at session start).

**Note on this pass:** the session process restarted mid-review and left
`styles-source.css` carrying my HIGH-1 can-fail mutation; the owner restored it. Every
result above was produced after that restore, against a tree verified equal to `189aaf1`
by hash, so nothing in this verdict rests on pre-restart state. The truncated
`sc202-r5rerev-canfail-high1.log` from the interrupted run is superseded by
`sc202-r5rerev-canfail-high1med1med2.log` and should be ignored.

## Artifacts (scoped re-review)

`sc202-r5rerev-{tsc,lint,jest,shots,shots2,freeze,freeze2,parity}.log`,
`sc202-r5rerev-canfail-high1med1med2.log`,
`sc202-r5rerev-{allshots,allshots-run2}.sha256`,
`sc202-r5rerev-build-after.log`, `sc202-r5rerev-vault-after.log`,
`sc202-r5rerev-realvault-after.json` — all under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/`.
