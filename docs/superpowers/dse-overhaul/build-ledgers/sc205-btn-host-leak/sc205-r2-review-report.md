# SC-205 — round 2 independent review

**Verdict: FIX ROUNDS NEEDED.** 1 HIGH, 4 MEDIUM, 6 LOW, 3 INFO. No finding invalidates the
committed result — every gate I re-ran is green, the tree moves zero pixels and zero frozen
bytes, and the two can-fail proofs I re-ran both fired. The findings are about the *gate
machinery*: three places where the new gate's printed guarantee is broader than what it
measures, one stale host transcription the ticket's own ruling #4 should have swept up, and a
drift-pin failure mode that tells a developer to corrupt the shared model.

Reviewed: commit `b2a92f5` (base `16e25ff`) in
`/home/scott/code/steelCompendium/worktrees/sc205-btn-host-leak/draw-steel-elements/`.

---

## Gate numbers I re-ran myself

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation warning) |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 3258 total · 184 passed + 1 skipped = 185 suites · 3 snapshots**, load 3.84 at start |
| `npm run shots` ×2 (full) | **474 PNGs, 0 FAIL** both runs |
| `check-freeze.sh` ×2 | **`freeze OK (210/210 …)`, exit 0**, 0 mismatches, both times |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 |
| new gate, run 1 | `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light …)` · `button host-leak OK (80 kinds × 3 states × dark/light = 480 comparisons)` · 104 exemptions |
| new gate, run 2 | **byte-identical block** — `diff` of the two runs' gate output is empty |
| new gate, 3rd run (`--bg=dark`) | same 480/104 and the same six-line taxonomy |

Determinism confirmed independently of the implementer: the exemption taxonomy reproduced
exactly (34 / 34 / 24 / 8 / 2 / 2) across three of my own runs.

`styles-source.css` diff verified **comment-only**: the entire hunk sits inside the
`/* … */` block that ends at `styles-source.css:13030`; no declaration, selector or at-rule
changed. Freeze 210/210 is the independent confirmation.

**Runtime cost — measured, not estimated.** Back-to-back `node visual-harness/shoot.mjs`
runs on this host (load 5–7 for both), build excluded:

| | wall |
|---|---|
| base `16e25ff` shoot.mjs | **309 s** |
| HEAD `b2a92f5` shoot.mjs | **344 s** |

**+35 s, +11%.** The implementer's note ("the sweep gained ~4 minutes of wall time") overstates
the real cost by ~7×; do not open a performance ticket on that basis.

---

## Verdict on the implementer-flagged coverage boundary (the "hovered-then-focused" 4th state)

**Do not defer it. It is not a fourth state, and closing it is a three-line change I have
already proven green.**

The report frames the 17 no-box kinds/scheme as needing a new "hovered-then-focused" state.
They do not. They need the harness to put the gallery into a configuration the product
routinely reaches, and then run the *existing* two interactive states. I patched
`assertBtnHostLeak` to inject, right after the per-scheme `goto`:

```css
[data-dse-chrome] .dse-chrome { opacity: 1 !important; pointer-events: auto !important; }
.dse-chrome-summary { display: flex !important; }
.dse-init__turnbox  { display: block !important; }
```

Result (`sc205rev-probe2-reveal.log`): exemptions drop **104 → 12**, and the sweep still
reports **0 diffs across all 480 comparisons**. The residual 12 are the genuinely static
ones — 8× `focus-visible: disabled`, 2× `hover: no point hit-tests`, 2× `focus-visible:
visibility: hidden`.

So: 92 of the 104 exemptions are an artifact of the mount state, not of the product; they are
removable at no cost; and removing them changes no result. Deferring would leave the gate
printing a coverage claim about 92 records that is factually wrong (see MEDIUM-1), in
machinery whose entire value is that a future reader trusts that line. Close it here — it
folds into MEDIUM-1 and MEDIUM-2 and needs no ticket.

---

## Findings

### HIGH-1 — the sheet still carries the stale SC-203 two-rule host transcription, and nothing pins it

`styles-source.css:12934–12947` (and the `app-region` mention at `:12988`).

The block headed **"THE HOST RULES, read out of the LIVE app (not a hand-copied snapshot …)"**
is the *output of the same `@media`-blind `document.styleSheets` walk* that ruling #4 ordered
corrected. It still:

- lists only **two** of the six reaching rules — `button` and `button:not(.clickable-icon)` —
  with no `button:hover`, no `button:focus-visible`, no `button[disabled]` group, no
  `@media (forced-colors: active) button`;
- writes `--text-color: var(--text-normal); app-region: no-drag;` (`:12939`) — the wrong
  property name this very commit corrected to `-webkit-app-region` everywhere else;
- omits `corner-shape: var(--button-corner-shape)`, which the same re-extraction added to the
  shoot.mjs copy;
- and asserts it was read from the live app, i.e. it presents itself as authoritative.

The new drift pin does **not** cover it — `assertHostCopyPinnedToObsidian` compares only
`OBSIDIAN_HOST_BUTTON_CSS` in `shoot.mjs`. So the ticket has fixed one stale copy of the host
model and left an unpinned second copy 90 lines above the comment it did edit.

**Failure scenario.** A future round adds a new kit control family (the exact thing the block
below it, "add its twin here too", tells the developer to prepare for). The developer reads
this block as the statement of what Obsidian declares, re-grounds `height / color /
background-color / box-shadow / white-space / justify-content / display`, and ships. The
`[disabled]` (`cursor`, `opacity`) and `:focus-visible` (`box-shadow`) leaks are never
re-grounded. If that family's node lands in the currently-exempt or currently-untagged set
(MEDIUM-1 / MEDIUM-2), the sweep prints OK and the leak ships — the SC-189 failure, repeated,
from the same stale document.

**Fix.** Replace the two-rule listing with the six-rule set as extracted (or delete the
listing entirely and point at `OBSIDIAN_HOST_BUTTON_CSS`, which the pin now makes the single
honest source of truth), and correct `app-region` → `-webkit-app-region` at `:12939` and
`:12988`.

---

### MEDIUM-1 — the exemption predicate proves unreachability *in the gallery's DOM state* and prints it as unreachability *in the product*

`visual-harness/shoot.mjs:1094–1122` (`hitPointForTagged`), `:1124–1140` (`focusTagged`),
`:1327–1340` (the printed boundary).

Every exemption is genuinely asserted per record — ruling #2 is satisfied at the mechanical
level, and the inverse check (`rec.active && blocked` → problem) is real. The defect is the
scope of the claim. I enumerated all 104 records (`sc205rev-analyze.log`, from a dump probe of
the real gate):

| class | kinds/scheme | what they actually are |
|---|---|---|
| `hover: renders a zero-sized box` (34) | 17 | the ghost edit button inside `div.dse-chrome-summary` (16 families) + `initiative`'s `.dse-init__turn` inside `div.dse-init__turnbox` |
| `focus-visible: renders no box at all (a display:none ancestor — unfocusable in a real vault too)` (34) | 17 | **the same 17 nodes** |
| `hover: pointer-events: none` (24) | 12 | the `.dse-chrome` panel's ghost button on 12 families — non-zero box (25.5 × 24.16), `pointer-events: none` only because `[data-dse-chrome]:hover` has not fired |
| `focus-visible: disabled` (8) | 4 | genuinely static |
| `hover: no point … hit-tests` (2) | 1 | `initiative|dse-btn.dse-init__stamina`, the diagnosed `.dse-init__right` clip |
| `focus-visible: visibility: hidden` (2) | 1 | genuinely static |

All 80 kinds are real `<button>` elements and all 80 sit inside `[data-dse-element]` (verified,
`sc205rev-analyze.log` tag census) — so every one is a live leak candidate. **29 of 80 kinds
get no hover coverage and 17 of 80 get no focus-visible coverage, and every one of them is an
authoring chrome control** — precisely the family SC-189 and SC-203 found leaking.

The stated justifications are false as written. `.dse-chrome` is `opacity: 0;
pointer-events: none` **until `[data-dse-chrome]:hover` / `:focus-within`**
(`styles-source.css:12639–12641`, `:12666–12671`); `.dse-chrome-summary` is `display: none`
**until `[data-dse-collapsed='on']`** (`:12500`, `:12825–12827`). Both are states a user
reaches on purpose. "unfocusable in a real vault too" is not true of either.

**Can it swallow a real diff?** I probed it directly rather than reasoning about it: the
three-line reveal above makes 92 of the 104 exemption-ineligible, and the sweep is still
0-diff. So **no live leak is being hidden today** — the exemption is currently harmless. What
it is not is *sound*: it is state-scoped, it is 21.7% of the advertised 480 comparisons, and
the OK line sells those 104 records as proven-unreachable rather than as not-mounted.

There is one further mitigation worth recording so the ticket-owner prices this correctly: the
exempt ghost buttons share a class signature (`.dse-btn.dse-btn--ghost.dse-btn--icon`) with
kinds that *are* hovered successfully (e.g. `statblock|dse-btn.dse-btn--ghost.dse-btn--icon`),
so the *selector*'s hover behaviour is pinned even where the per-family node is not. That is
why this is MEDIUM and not HIGH.

**Fix.** Add the reveal (proven), keep the 12 real exemptions, and reword the boundary line
from "the state is provably unreachable on it" to something true of the mounted DOM
("not mounted in a state that can reach it").

---

### MEDIUM-2 — the kind key collapses structurally different button instances; whichever mounts first wins, and it varies by family

`visual-harness/shoot.mjs:1029–1048` (`tagButtons`).

The key is `(element id, sorted class list, pressed, selected, disabled)`. It carries no
structural context, and `tagButtons` tags only the **first** node per key. Measured against the
real gallery (`sc205rev-dedupe.log`):

- 225 button-ish nodes collapse to **80** sampled kinds;
- **59** keys have more than one instance;
- **30** keys have instances in *different structural contexts* — `.dse-chrome` panel vs
  `.dse-chrome-summary` vs plain body.

Those contexts are different surfaces with different re-grounding rules
(`styles-source.css:12673+` for the panel button vs `:12910–12922` for the summary button).
Which instance wins is an accident of mount order and is not consistent:

- **17 families sample the hidden summary button** → the panel's ghost button is never sampled
  by this gate in any state (`characteristics, conditions, counter, encounter, feature,
  featureblock, hero-tokens, heroic-resource, initiative, montage, negotiation, party,
  project, skills, surges, values-row`);
- **12 families sample the panel button** → the summary button is never sampled (`ancestry,
  career, class, complication, condition, culture, kit, perk, rule, stamina-bar, title,
  treasure`);
- `hero` samples a body instance and therefore **neither** chrome instance.

`assertChromeHostLeak` backstops the panel at rest for only 6 distinct families
(`CHROME_HOSTLEAK_CASES`, `shoot.mjs:660–669`), and never on hover.

**Failure scenario.** `styles-source.css:12918` re-grounds the summary button's hover with
`background` and `color` only — **not `box-shadow`**. If a future edit removed the
`box-shadow: none` that reaches it, Obsidian's
`@media (hover: hover) { button:hover { box-shadow: var(--input-shadow-hover) } }` would paint
the five-layer plate on the collapsed bar's edit glyph. The gate prints OK regardless: for the
17 summary-sampled families that node is hover-exempt (MEDIUM-1), and for the other 13 it
carries no tag at all.

**Fix.** Put a structural discriminator in the key (nearest of `.dse-chrome` /
`.dse-chrome-summary` / none), or tag every instance and suffix the key with an index. The
first is cheap and keeps the kind count stable-ish.

---

### MEDIUM-3 — the drift pin extracts rules by selector *prefix*, not by what actually reaches a plugin button

`visual-harness/obsidian-host-pin.mjs:136–145` (`reachesPlainButton`), `:173–177`.

The module's docstring and the implementer report both claim the pin computes "the whole
reaching set … not a hand-picked list — a hand-picked list is the failure mode that produced
this ticket". It does not. `reachesPlainButton` requires `/^button\b/`, i.e. the selector must
*begin* with `button`. Measured against 1.13.7's app.css (`sc205rev-pin-probe.log`,
`sc205rev-descendant.txt`): 60 rules mention `button`, 6 are extracted, **54 are not**, and
**21 of those 54 have a subject compound that is a plain button** — e.g.

```
@container (max-width: 400px) … .setting-item-control button:not(.clickable-icon)
.is-phone .modal .setting-item-control button
body.emulate-mobile button
.canvas-empty-embed-action-list button
.graph-color-button-container button
```

None of the 21 reaches an in-note plugin button on desktop today (they are PDF-viewer chrome,
mobile/tablet scopes, and core-UI containers), so **there is no live hole**. But the pin is
structurally the same shape as the bug it was written to prevent: a future Obsidian release
adding `.markdown-rendered button { … }` or `.view-content button { … }` would reach every
plugin button in every note, and the pin would print `host-copy pin OK`.

**Fix.** Extract on the **subject** compound (last compound reaches a plain button), then
subtract an explicit, documented ancestor-scope exclusion list (pdf viewer, `.is-phone` /
`.is-tablet` / `emulate-mobile`, graph/publish/slides/canvas/vault-chooser/quick-start
containers). Then a *new* ancestor scope is loud instead of invisible, which is the whole point
of the pin.

---

### MEDIUM-4 — on a machine without a config-dir asar, the pin reports DRIFT and tells the developer to corrupt the shared model

`visual-harness/obsidian-host-pin.mjs:51–52` (the `/opt` fallback) + `shoot.mjs:639–649` (the
drift message).

`findObsidianAsar` falls back to `/opt/Obsidian/resources/obsidian.asar` with
`version: '(installer asar — version not encoded in the filename)'`. On this machine that file
is **Mar 2023**, app.css 316,975 bytes, and its reaching-rule set is genuinely different
(measured, `sc205rev-fallback.log`): the `[disabled]` group is split into
`button[aria-disabled="true"] { background-color: … }` and
`button[disabled="true"] { cursor: not-allowed }`, in a different order, and the base rule has
no `corner-shape` and no `--text-color`. So on any box whose `~/.config/obsidian` holds no
versioned asar — a Flatpak/AppImage/snap install, a fresh machine, a CI image with only the
`.deb` — `npm run shots` **exits 1** with `HOST COPY DRIFTED`, blaming the branch under test,
and instructs:

> "fix the copy FIRST — re-extract from the asar, update the provenance comment's version"

Following that instruction replaces the pinned 1.13.7 model with a 2023 one for everyone —
i.e. the message actively directs the developer to reintroduce exactly the rot SC-205 exists to
remove. (Verified with `HOME` pointed at an empty dir: `findObsidianAsar()` →
`/opt/Obsidian/resources/obsidian.asar`.)

**Fix.** Record the pinned version in the module (`export const PINNED_OBSIDIAN = '1.13.7'`).
Compare only against an asar whose parsed version is **≥** the pinned one. An older asar, or
the version-less `/opt` fallback, is a loud SKIP naming both versions — ruling #1's SKIP
semantics, applied to the case that actually occurs. A *newer* asar staying a hard drift
failure is correct and should not change.

---

### LOW-1 — `BTN_PROPS_EXCLUDED` bookkeeping is stale against the copy this commit completed

`visual-harness/shoot.mjs:1014–1019`, printed at `:1335`.

The comment says `user-select` and `app-region` are "the only two declarations Obsidian's
`button` rules make that this sheet does not re-ground". After the re-extraction the copy also
declares `corner-shape: var(--button-corner-shape)` (`:506`), which the plugin never
re-grounds (`grep -c corner-shape styles-source.css` → **0**) and which `BTN_PROPS` does not
compare — so it is neither compared nor declared-excluded, and the OK line's "every sampled
property is identical … `user-select` and `app-region` are excluded by design" is not a
complete account. Separately, `app-region` is the wrong property name this same commit
corrected everywhere else, and it is what the gate prints on every run.

**Fix.** Add `corner-shape` to `BTN_PROPS` (it is free, and then it is pinned) or to
`BTN_PROPS_EXCLUDED` with a reason; rename the excluded entry to `-webkit-app-region`.

---

### LOW-2 — cross-pass state agreement is measured but never asserted

`visual-harness/shoot.mjs:1296–1313`.

The comparison pairs `bare[state]` and the host pass's records by key and never requires
`b.active === h.active` or `b.blocked === h.blocked`. I measured the agreement directly
(`sc205rev-analyze.log`): **0 disagreements** across all four `bg × interactive state` combos,
80/80 records each. So it holds today. But if a future host declaration changed a node's box or
its hit-testing, one pass would sample the state and the other would sample rest, the pair
would still be counted in the advertised "480 comparisons", and the result (red or green) would
be an accident of which direction the mismatch went.

**Fix.** One line in the loop: push a problem when `b.blocked !== h.blocked`.

---

### LOW-3 — the 6th rule is described as unmeasurable; it is measurable

`visual-harness/shoot.mjs:537–541`: "Playwright renders with `forced-colors: none`, so the
query never matches and the sweep below can say nothing about it."

Playwright supports `page.emulateMedia({ forcedColors: 'active' })`. One extra rest-only pass
under it would measure `@media (forced-colors: active) { button { border: 1px ButtonBorder
solid } }` against every plugin button — a real leak for any Windows high-contrast user, and
the only reaching rule the gate currently models without measuring.

**Fix.** Either measure it, or restate the comment as a scoping decision ("out of scope for
this ticket") rather than a capability limit that does not exist.

---

### LOW-4 — `readAsarFile` is unguarded against a corrupt or partially-downloaded asar

`visual-harness/obsidian-host-pin.mjs:62–80`, called unguarded at `shoot.mjs:602`.

Measured: a 64-byte zero file throws `SyntaxError: Unexpected end of JSON input`. Inside
`npm run shots` that lands in the outer handler (`shoot.mjs:1525`) as `FAIL sweep
(exception)`, which also skips `assertBtnHostLeak` **and** `assertPrintTwinParity`. Obsidian
self-updates by dropping a new asar into that directory, so a run that starts mid-download
turns the whole shots battery red with a message that names none of this.

**Fix.** `try { … } catch { return null }` around the read, falling through to the existing
SKIP path.

---

### LOW-5 — `hitPointForTagged` mis-attributes an exemption when every candidate point is off-viewport

`visual-harness/shoot.mjs:1112`.

Candidate points outside the 900×1200 viewport are `continue`d, and if all seven are skipped the
function falls through to `blocked: 'no point in its box hit-tests to it (clipped by an ancestor
overflow, or covered)'` — the wrong diagnosis for a node simply larger than the viewport or one
`scrollIntoView` could not centre. Only 2 records take this branch today and both are the
correctly-diagnosed `.dse-init__right` clip, so nothing is mislabelled right now.

**Fix.** Distinguish "no candidate point was on screen" from "points were on screen and none hit
the node", so a future large control is not silently exempted under a false reason.

---

### LOW-6 — comment arithmetic and rule-count wording

`visual-harness/shoot.mjs:450–452` introduces "Two smaller drifts fell out of the same re-read"
and then lists **three** (`-webkit-app-region`, `corner-shape`, `--interactive-hover`).
`:445–446` says "Three of the five rules Obsidian aims at an ordinary desktop plugin button"
while the pin's own extraction (and the OK line) says **six**; the sixth is acknowledged 90
lines later, but the two numbers are never reconciled where a reader meets them.

---

### INFO-1 — the new harness code is neither linted nor type-checked

`npm run lint` runs `eslint src main.ts` only. Neither `visual-harness/shoot.mjs` nor the new
`visual-harness/obsidian-host-pin.mjs` is linted, and being `.mjs` they are outside `tsc`.
Pre-existing condition, not introduced by this branch — noted because 210 new lines of gate
logic just landed with no static checking at all.

---

### INFO-2 — `dse-verify` SKILL.md does not know about the two new in-run gates

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` documents the
battery but has no entry for `host-copy pin` / `button host-leak`, and nothing tells a future
agent that `host-copy pin SKIPPED` on a machine without Obsidian is expected rather than a
failure. Workspace-level doc, so it belongs to the ticket-owner/dispatcher at landing, not to
a worktree agent.

---

### INFO-3 — things I checked that are correct, and worth not re-litigating

- **Multi-asar selection is right.** This machine has both `obsidian-1.13.6.asar` and
  `obsidian-1.13.7.asar`; the sort at `obsidian-host-pin.mjs:43–46` is numeric per component,
  so `1.13.7` wins. A lexicographic sort (the obvious bug here) would have picked `1.13.6`
  — it does not. Verified live.
- **The pin's normalization cannot mask a real drift** (`sc205rev-pin-masking.log`, run against
  the real exported functions and the real app.css): a dropped declaration → drift; two
  declarations reordered → drift; a value changed → drift; a whole rule removed → 3 drift
  lines; a selector-list reorder → drift. Whitespace/indent churn, a dropped trailing
  semicolon and single→double quotes correctly produce **no** drift. Token normalization is
  value-exact: `#3f3f3f` vs `#363636` differs, a dropped box-shadow length differs, only case
  and whitespace are folded.
- **Drift can-fail re-run by me, not just re-read.** I reverted dark `--interactive-hover` to
  `#363636` *and* dropped `white-space: nowrap` from the base rule → `npm run shots` **exit 1**,
  both halves fired, the rule text printed side by side and
  `dark: --interactive-hover is "#3f3f3f" in Obsidian but "#363636" in the copy`. The sweep did
  not run (0 occurrences of `button host-leak OK`), which is the intended "fix the copy first"
  ordering. Reverted; sha256 back to `df7f3ad3…`.
- **The undoNotice guard can fail.** Flipping `src/framework/kit/undoNotice.ts:51` to
  `createElement('button')` produces exactly one red — the new test — with
  `Expected: "A" / Received: "BUTTON"`. Reverted via `git checkout`.
- **Hover and focus-visible are genuinely active in BOTH passes.** Per-record dump: hover
  `active: true` on 50/80 in bare *and* 50/80 in host, focus-visible 58/80 in both, in both
  schemes. No stale or lost state, no vacuous comparison.
- **`(hover: hover)` capability is asserted, not assumed** (`shoot.mjs:1260–1266`), and
  `matches(':focus-visible')` is asserted per record in both passes (`:1153`).
- **No probe-tag collision across states or passes.** `tagButtons` runs once per navigation and
  both passes address the same nodes by index within that navigation; `injectHostCss` adds a
  style tag rather than re-navigating. The `data-dse-hostleak` attributes cannot reach any
  captured PNG — the gate runs after every capture (`shoot.mjs:1520–1523`) on its own
  navigations, and freeze 210/210 confirms it.
- **`aria-disabled` correctly excluded from the focus exemptions** (`shoot.mjs:1124–1127`) —
  such nodes still take focus and are still required to reach `:focus-visible`.
- **Ruling #4 discharged in `shoot.mjs`.** The corrected provenance is accurate: `/opt` is
  genuinely a Mar-2023 installer copy, `1.13.7` is genuinely the newest config-dir asar, and the
  model is verbatim against it. (The *other* copy of the same stale conclusion is HIGH-1.)

---

## Tree state

`git status --porcelain` empty, `git diff` empty, `git diff --cached` empty, `HEAD =
b2a92f514279e9e51e4b570fa62933f59241c04c`. Every probe reverted:
`visual-harness/shoot.mjs` sha256 `df7f3ad37930a41a8f86fbfec8646ed403e7badbf754c3d24771d2303e7f80b4`
(identical to the implementer's recorded green sha), `src/framework/kit/undoNotice.ts` restored
by `git checkout`, the temporary `visual-harness/zz-shoot-base-SC205REVIEW.mjs` deleted, no
`SC205-REVIEW` / `SC205_REVEAL` marker anywhere in the tree. Freeze re-verified **after** all
probes: `freeze OK (210/210 …)`.

## Evidence artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`:

- `sc205rev-shots-run1.log`, `sc205rev-shots-run2.log` — two full `npm run shots` runs (474 PNGs, 0 FAIL); gate blocks byte-identical
- `sc205rev-jest.log` — 3257 passed / 1 skipped / 185 suites
- `sc205rev-parity.log` — 0 gaps / 0 undeclared / 16 declared
- `sc205rev-probe1.log`, `sc205rev-dump.json`, `sc205rev-analyze.mjs`, `sc205rev-analyze.log` — instrumented per-record dump of the real gate + its analysis (exemption enumeration, both-pass activity, tag census)
- `sc205rev-probe2-reveal.log` — the reveal probe: exemptions 104 → 12, still 0 diffs
- `sc205rev-dedupe-probe.mjs`, `sc205rev-dedupe.log` — 225 nodes → 80 keys, 30 multi-context collisions
- `sc205rev-pin-probe.mjs`, `sc205rev-pin-probe.log`, `sc205rev-missed.txt`, `sc205rev-descendant.txt`, `sc205rev-appcss.css` — the pin's extraction vs the real 1.13.7 app.css
- `sc205rev-pin-masking.mjs`, `sc205rev-pin-masking.log` — 9 normalization masking cases + 6 token cases
- `sc205rev-canfail-pin.log` — my own drift can-fail (exit 1, both halves)
- `sc205rev-fallback-probe.mjs`, `sc205rev-fallback.log` — `/opt` fallback and corrupt-asar behaviour
- `sc205rev-time-base.txt`, `sc205rev-time-head.txt`, `sc205rev-base-shots.log`, `sc205rev-head-shots.log` — the 309 s vs 344 s runtime measurement
- `sc205rev-shoot.mjs.GREEN` — the sha-verified restore point used for every perturbation
