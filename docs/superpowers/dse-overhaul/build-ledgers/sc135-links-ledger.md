# SC-135 phase 1 report — delegated click resolution for scc.v1: links

**Status:** DONE (code, tests, docs, battery, Reading-view selector verdict) — **with one
significant concern surfaced during real-Obsidian verification that needs Scott's read
before this is trusted to fully close the reported bug.** See "Concerns" below — this is
not a minor caveat.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc135-links/draw-steel-elements`
**Branch:** `sc135-links` (dse submodule; cut from `develop` tip `efdced2`)
**Commit:** `51c3f18` — "Adds delegated click resolution for scc.v1 links outside Reading
view (SC-135 phase 1)"
**Superproject pointer:** left unstaged in `/home/scott/code/steelCompendium/worktrees/sc135-links` (`git status`: ` M draw-steel-elements`) — not committed, per instructions.

---

## What was implemented (option C, as specified)

`src/refs/sccLinkClickHandler.ts` (new):

- `handleSccLinkEvent(evt, resolver, actions)` — the branch logic: `evt.target.closest('a')`
  → href matches `/^scc(\.v\d+)?:/` → `preventDefault()` + `stopImmediatePropagation()` →
  `resolver.resolve(href)` → `vault` calls `actions.openVault(linkpath, Keymap.isModEvent(evt))`,
  `web` calls `actions.openWeb(url, win)`, `unresolved` calls `actions.notifyUnresolved(code)`.
- `attachSccLinkClickHandling(owner, doc, resolver, actions)` — attaches capture-phase
  `click` + `auxclick` (middle-click) listeners to a given `Document` via
  `Component.registerDomEvent` (auto-detached on unload).
- `registerSccLinkClickHandling(plugin, workspace, resolver, actions)` — the top-level
  wiring: attaches to the main window's document, sweeps any popout already open at
  registration time (leaf `.getContainer().doc`, deduped), and registers
  `workspace.on('window-open', ...)` for every popout opened afterward.
- `createSccClickActions(app)` — production glue: `openVault` calls
  `app.workspace.openLinkText(linkpath, sourcePath, newLeaf)` (`sourcePath` = the active
  file at click time — the standard choice for a document-level click delegator, and inert
  in practice since `linkpath` is always vault-absolute); `openWeb` calls `win.open(url, '_blank', 'noopener')`
  on the clicked anchor's own window (popout-safe); `notifyUnresolved` shows a `Notice`.

`main.ts`: two lines added right after the existing `sccPostProcessor` registration —
`registerSccLinkClickHandling(this, this.app.workspace, this.sccResolver, createSccClickActions(this.app))`.

`test/mocks/obsidian-core.ts`: added a `Keymap`/`PaneType` mock (real `isModEvent` semantics)
and `FakeWorkspace.containerEl`/`getActiveFile`/`openLinkText`/`iterateAllLeaves`/`on`, plus
`WorkspaceLeaf.getContainer()` — additive only, needed because the real `onload()` path now
reaches these through `registerSccLinkClickHandling`; every pre-existing "through the REAL
onload()" test exercises this and stayed green (see battery).

## Docs (Scott's explicit requirement)

New "## Compendium links" section in `docs/compendium-sync.md` (between "Referencing a
compendium entry" and "Copying an entry to homebrew from"): states clicking works
everywhere (Reading view, Live Preview, Source mode, popouts) and modifier/middle-click
semantics; lists what's deliberately NOT working yet (backlinks/graph/unlinked-mentions;
no wikilink/vault-path sync format option) in plain language, no ticket numbers; notes
Reading view is still the only place elements themselves render. **Given the concern below,
Scott may want to revisit the "works everywhere" phrasing before this ships** — I did not
weaken it unilaterally since my evidence, while strong, comes from a nonstandard Xvfb/CDP
test environment (see "Concerns").

CHANGELOG entry added under the `## 7.0.0 (unreleased)` header.

## Real-Obsidian verification — the required check (item 3)

**VERDICT: SELECTOR MATCHES.** Confirmed via a real Obsidian instance spawned on its own
Xvfb display (never `:1`; scratch `--user-data-dir`, port 9224), opening the seeded
`DS Compendium/kit/panther.md` (real compendium prose containing `scc.v1:` markdown links)
in Reading view and inspecting the rendered DOM:

```
"rawSccHrefCount": 0,
"internalLinkCount": 1,
"internalLinkSamples": [{
  "outerHTML": "<a ... class=\"internal-link\" href=\"DS Compendium/kit/panther.md\"
                 data-scc=\"mcdm.heroes.v1/kit/panther\"
                 data-href=\"DS Compendium/kit/panther.md\">Panther</a>"
}],
"webLinkCount": 8,
"unresolvedCount": 0
```

Zero raw `a[href^="scc"]` anchors remained; the vault-resolvable self-link was correctly
rewritten to `.internal-link` with `data-scc`/`data-href`, and 8 other links in the same
prose correctly fell back to `.ds-scc-web` (codes not seeded in this minimal demo
compendium). **No fix needed to `src/refs/rewriteSccAnchors.ts` — the selector was never
the problem.** (First run of this check showed 3 unrewritten raw anchors — a cold-start
artifact of a brand-new `--user-data-dir` running Obsidian's old bundled app shell before
its background self-update completed, the exact caveat `obsidian-camera.mjs`'s own
`warmUpUpdate()` comment documents; re-run against the now-updated profile came back clean
twice in a row.)

## Concerns

### 1. (Primary concern) Evidence suggests the click handler's `closest('a')` approach may not intercept the PRIMARY reported-bug surface — needs Scott's real-desktop confirmation

Chasing the "ideal evidence" screenshot (an LP click landing on the note) surfaced something
I did not expect and could not resolve conclusively:

- Opening a note in Live Preview (forced `app.vault.setConfig('livePreview', true)` — this
  fresh scratch profile defaulted to Source mode) and inspecting the CM6-rendered DOM for a
  prose-level `[text](scc.v1:...)` link, in **both** the folded/widget state (cursor not on
  that line) and the raw-syntax state (cursor placed on that line via the Editor API): **no
  `<a>` element exists anywhere.** The folded widget is
  `<span class="cm-link"><span class="cm-underline">text</span></span>`; the raw-syntax URL
  portion is a `<span class="cm-formatting ... cm-url external-link" contenteditable="false">`.
  Neither is an anchor.
- This is not scc-specific: a plain `[external](https://example.com)` link in the same note
  showed the identical structure (`cursor: auto` on the folded span, no `<a>`). A `[[Welcome]]`
  **wikilink** also has no `<a>` — but clicking it (verified via real xdotool OS-level click
  on the Xvfb display) DID call `workspace.openLinkText("Welcome", ..., "tab")` and navigate,
  proving Obsidian's own CM6 link click routing works by mapping click position to its syntax
  tree and calling the API directly — not by delegating to a DOM anchor's `href`.
- I instrumented a real `document`-level capture listener running the *exact* `closest('a')`
  check our production code uses, then dispatched a genuine OS-level click (xdotool, not just
  CDP's `Input.dispatchMouseEvent` — tried both) on the folded scc-link widget. Result:
  `{ targetTag: "SPAN", targetClass: "cm-underline", foundAnchor: false, anchorHref: null }`.
  The click reaches `document` correctly; `closest('a')` finds nothing, exactly as the DOM
  inspection predicted.
- **If this generalizes, phase 1's click handler may have no surface where it actually
  changes behavior**: every surface that DOES produce a real `<a href="scc...">` (Reading
  view, and any rendered `ds-*` element card in any mode, via the pre-existing
  `ElementView.renderMarkdown` → `rewriteSccAnchors` call) is *already* rewritten before
  click time by the existing mechanism, with or without phase 1. The one surface phase 1
  exists to fix — plain `[text](scc.v1:...)` prose typed directly into a note, viewed in
  Live Preview or Source mode — is exactly the surface with no DOM anchor to intercept.

**Why I'm not certain this is right, and didn't just report it as a confirmed bug:** my
Xvfb/CDP/xdotool test environment could not reproduce Obsidian's own external-link
**confirm dialog at all**, for *any* link, even as a control — I disabled the plugin
entirely, opened an unrewritten `<a href="scc.v1:...">` in plain Reading view (guaranteed
real anchor, guaranteed `external-link` class), and a genuine xdotool OS click still
produced no modal. That could mean the confirm-dialog step itself depends on something
Xvfb/this scratch profile doesn't have (a desktop shell, a registered `xdg-open`, some
first-run consent state) — i.e. my whole evidence chain might be built on an environment
that can't reproduce the ORIGINAL bug's confirm step either, which would mean I also can't
rule out that a real desktop click behaves differently in a way I haven't found (a
different gesture, a real trackpad click's timing, something CM6-internal I don't have
visibility into without Obsidian's source).

**What I'd recommend:** a 30-second manual check in Scott's own vault — type
`[test](scc.v1:mcdm.heroes.v1/rule.world/vasloria)` into a note, switch to Live Preview,
click it once, and see whether it navigates cleanly (fix confirmed) or still
prompts/does-nothing (the `closest('a')` approach needs a different mechanism — reading CM6's
`EditorView` at the click position instead of the DOM, which is a materially bigger change,
closer to option D's territory than option C's). I did not attempt that redesign — it's
outside the "phase 1 only, ship option C" scope this ticket authorized, and needs your call.

I did **not** weaken the shipped docs claim ("works everywhere") based on this, since I'm
not fully certain it's wrong — but flagging it prominently here is the point of this
verification step, and I'd rather you know before this reads as fully closed.

### 2. Popout-window wiring is code-reviewed + jsdom-tested, not end-to-end real-Obsidian-tested

`registerSccLinkClickHandling`'s `workspace.on('window-open', ...)` line matches the
documented Obsidian API exactly and is fully covered in jsdom (a lightweight fake workspace
whose `on()` actually stores and can invoke the callback, plus a second real `Document` via
`document.implementation.createHTMLDocument()` standing in for a popout). I did not spin up
an actual Obsidian popout window under Xvfb to confirm the real wiring end-to-end — that
felt like a second large side-quest beyond what was asked, especially against the backdrop
of concern #1.

## Battery (verbatim)

Baselines given at `efdced2`: tsc/lint clean · jest 2702+1skip/165 suites · shots 203 ·
freeze 67/67 · parity 0/0/16.

```
$ devbox run -- npm run tsc
(clean, no output, exit 0)

$ devbox run -- npm run lint
(clean — only a pre-existing .eslintignore deprecation notice, exit 0)

$ devbox run -- npx jest
Test Suites: 1 skipped, 166 passed, 166 of 167 total
Tests:       1 skipped, 2721 passed, 2722 total
Snapshots:   3 passed, 3 total
(exit 0)

$ devbox run -- npm run shots
203 shots written, 0 FAIL (matches baseline count exactly)

$ bash check-freeze.sh visual-harness/shots
freeze OK (67/67 steel-print PNGs byte-identical)

$ devbox run -- npm run parity
0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).
(exit 0)
```

Net delta from baseline: +19 tests, all in the new `test/dom/sccLinkClickHandler.test.ts`
(vault/web/unresolved branches, non-scc/no-anchor pass-through, `preventDefault`+
`stopImmediatePropagation`, all four `Keymap.isModEvent` outcomes incl. middle-click,
capture-phase-beats-bubble and capture-phase-beats-a-closer-capture-listener, attach/detach
against a real `Plugin`/`Component`, attach against a SECOND `Document` proving it isn't
hardcoded to the global `document`, and the full `registerSccLinkClickHandling` wiring
including the already-open-popout sweep and the `window-open` future-attach path). Suite
count moved 165→167 (+2, not +1) in the numbers as measured here — I only added one test
file, so this is either a difference in how "suites" was counted for the stated baseline vs.
my `npx jest` run, or pre-existing drift on `develop` between when the baseline was recorded
and `efdced2`; either way every suite present passed and nothing regressed (I hit and fixed
two real regressions mid-session — `FakeWorkspace` missing `.containerEl`/`.on()` broke ~18
unrelated suites until the mock additions above — and reran the full `dom` project clean
before moving on). No fixture was added, so `shots`/`freeze`/`parity` numbers are unchanged
from baseline exactly, confirming freeze did not move (TS+docs-only change, as required).

`npx jest --selectProjects unit` also run standalone: clean.

## Files touched

- `src/refs/sccLinkClickHandler.ts` (new)
- `test/dom/sccLinkClickHandler.test.ts` (new)
- `main.ts` (+8 lines: import + two-line registration call)
- `test/mocks/obsidian-core.ts` (+63 lines: `Keymap`/`PaneType`, `FakeWorkspace`
  additions, `WorkspaceLeaf.getContainer()`)
- `docs/compendium-sync.md` (+36 lines: "Compendium links" section)
- `CHANGELOG.md` (+12 lines: entry under `## 7.0.0 (unreleased)`)

## Return contract

- **Status:** DONE, with concern #1 above needing Scott's read before treating the reported
  bug as fully closed on its primary surface.
- **SHA:** `51c3f18`
- **Selector verdict:** MATCHES real Obsidian anchor markup — no fix needed
  (`src/refs/rewriteSccAnchors.ts` unchanged).
- **Battery:** all green, matches baseline exactly except the intentional +19 tests (see
  above).
- **Concerns:** two, see above — #1 is substantive (possible non-fix on the primary
  surface, needs a 30-second manual click test in a real vault to resolve either way), #2 is
  minor (popout wiring untested end-to-end, code+jsdom-verified only).

---

# Phase 1b — CodeMirror extension for Live Preview / Source mode

**Status:** DONE. Concern #1 above is **resolved**: confirmed against Scott's own vault
(the exact DOM he pasted matched the anchor-less structure predicted), and the fix is now
end-to-end verified in real Obsidian.

**Commit:** `5e56f6a` — "Adds a CM6 extension to follow scc.v1 links in Live Preview/Source
mode (SC-135 phase 1b)", on top of `51c3f18`.

## What was implemented

- `src/refs/sccLinkAtPos.ts` (new) — pure, `EditorView`-free logic:
  - `findSccLinkAtPos(lineText, lineStart, pos)`: scans one line's raw text for an
    `scc(.vN)?:` markdown link whose span contains the absolute document offset `pos`.
    Same scope as the existing DOM rewrite (plain `[text](url)`, no nested-bracket
    handling) — steel-etl's compendium markdown is entirely this shape.
  - `shouldFollowOnClick({ livePreview, lineRevealed, isModOrAux })`: Obsidian's own Live
    Preview convention — a folded (not-currently-being-edited) link follows on a plain
    click; once its raw syntax is showing (cursor on that line, or Source mode, which
    never folds), a plain click places the cursor instead and only a modifier/middle click
    follows it.
- `src/refs/sccLinkCm6.ts` (new) — the CM6-facing glue: `createSccLinkCm6Extension(resolver, actions)`
  returns `Prec.highest(EditorView.domEventHandlers({ mousedown, auxclick }))`. Each handler:
  `view.posAtCoords` → `state.doc.lineAt` → `findSccLinkAtPos` → `shouldFollowOnClick`
  (gated on `editorLivePreviewField` + whether the current selection intersects the line) →
  on a follow, `preventDefault()` + `stopPropagation()` → routes through the exact same
  `SccClickActions` object phase 1 built (`openVault`/`openWeb`/`notifyUnresolved`).
- `main.ts`: `this.registerEditorExtension(createSccLinkCm6Extension(this.sccResolver, sccClickActions))`,
  right after phase 1's DOM listener registration — both now share one `sccClickActions`
  instance.
- `package.json`/`package-lock.json`: `@codemirror/state` and `@codemirror/view` added as
  explicit devDependencies (both already resolved transitively at compatible versions —
  6.5.0 / 6.38.6 — only the direct-import declaration eslint's `import/no-extraneous-dependencies`
  wanted was missing).
- `test/mocks/obsidian-core.ts`: added an inert `editorLivePreviewField` export (a CM6
  state-field key this module only ever passes to `view.state.field(...)`, never
  constructed/read by the mock itself — same treatment as the `Keymap` stub from phase 1).

## The `Prec.highest` finding (worth flagging on its own)

The first end-to-end attempt, with the extension registered at normal precedence, did
**nothing** — no navigation, in any of the three surfaces, despite independent
page-context diagnostics confirming `posAtCoords`/`doc.lineAt`/the link regex all computed
correctly. Root cause, from `EditorView.domEventHandlers`'s own doc comment: *"such
functions are ordered by extension precedence, and the first handler to return true will
be assumed to have handled that event, and no other handlers or built-in behavior will be
activated."* Obsidian's own core editor view plugin registers its mousedown handling
(cursor placement, its own internal link routing) at normal precedence and runs first,
returning `true` for an ordinary click before this extension ever saw the event. Wrapping
the returned extension in `Prec.highest(...)` fixed it completely. Any future CM6
`domEventHandlers` extension in this plugin should expect the same footgun.

## End-to-end verification (Xvfb + xdotool/CDP, real Obsidian, never `:1`)

Seeded `demo-vault/DS Compendium/rule/world/vasloria.md` (the exact code from the
coordinator's ask) and a test note `Click this: [test](scc.v1:mcdm.heroes.v1/rule.world/vasloria) and see what happens.`
on line 3 (padding text on line 1 keeps the cursor off the link's line on open). Target
click coordinates were computed via CM6's own `view.coordsAtPos(pos)` from a
purely-text-derived offset (robust across folded/revealed/Source-mode rendering — far more
reliable than guessing which DOM class a given state happens to use, which is what caused
several false starts against this same script before it stabilized). Ran twice for
reproducibility; both runs identical:

```
CHECK 1 (LP folded, plain click -> navigate): activeFile=DS Compendium/rule/world/vasloria.md -> PASS
CHECK 2a (LP revealed, plain click -> stays on note): activeFile=sc135-e2e-test.md -> PASS
CHECK 2b (LP revealed, ctrl-click -> navigate): activeFile=DS Compendium/rule/world/vasloria.md -> PASS
CHECK 3a (Source mode, plain click -> stays on note): activeFile=sc135-e2e-test.md -> PASS
CHECK 3b (Source mode, ctrl-click -> navigate): activeFile=DS Compendium/rule/world/vasloria.md -> PASS
```

**Plain language verdict:** clicking a compendium link in Live Preview now takes you to the
note, exactly like Reading view always has. If your cursor happens to already be on that
link's line (editing nearby text), a plain click there just moves your cursor instead of
navigating — the same as it always has for any other link type in Obsidian — and
Ctrl/Cmd-click follows it anyway. Source mode (which never folds anything) always needs
Ctrl/Cmd-click. All five behaviors are now real, verified facts, not assumptions.

Test fixtures (`sc135-e2e-test.md` at vault root, `DS Compendium/rule/world/vasloria.md`)
were removed/gitignored after verification; no demo-vault changes are tracked.

**Not separately re-verified:** popout coverage for the CM6 extension. `registerEditorExtension`
is Obsidian's documented, standard mechanism for exactly this ("register a CM6 extension
active in every editor") and is understood to apply app-wide including popouts by
construction (no per-window wiring exists to even attach to) — I did not spin up a live
popout under Xvfb to independently confirm this specific claim, given the time already
spent getting the primary three surfaces conclusively proven. Flagging as the one remaining
unverified (not un-reasoned) assumption.

## Battery (verbatim, after phase 1b)

Baseline (phase 1, commit `51c3f18`): jest 2721+1skip/167 suites · shots 203 · freeze 67/67
· parity 0/0/16.

```
$ devbox run -- npm run tsc          → clean, exit 0
$ devbox run -- npm run lint         → clean, exit 0 (after adding the two devDependencies;
                                        failed first with import/no-extraneous-dependencies
                                        on @codemirror/view before that fix)
$ devbox run -- npx jest
Test Suites: 1 skipped, 168 passed, 168 of 169 total
Tests:       1 skipped, 2742 passed, 2743 total
Snapshots:   3 passed, 3 total
(exit 0)

$ devbox run -- npm run shots        → 203 shots, 0 FAIL (unchanged)
$ check-freeze.sh visual-harness/shots → freeze OK (67/67 steel-print PNGs byte-identical)
$ devbox run -- npm run parity       → 0 gap(s), 0 undeclared warning(s), 16 declared
                                        deferral(s). (exit 0)
```

Net delta from the phase-1 baseline: +21 tests / +2 suites (`sccLinkAtPos.test.ts`'s 19
pure-logic cases + `sccLinkCm6.test.ts`'s 2 smoke cases = 21). `shots`/`freeze`/`parity`
numbers unchanged exactly, confirming the freeze gate did not move (TS-only change, as
required).

## Reply to coordinator

- **SHA:** `5e56f6a` (on top of `51c3f18`, same branch `sc135-links`)
- **Battery:** all green, matches the phase-1 baseline exactly except +21 tests / +2 suites;
  shots/freeze/parity byte-for-byte unchanged.
- **End-to-end verdict, plainly:** confirmed working. A folded Live Preview link takes a
  plain click straight to the target note. A link whose raw syntax is currently showing
  (your cursor is on that line) takes a modifier click instead — a plain click there just
  moves your cursor, matching how Obsidian's own links behave while you're editing near
  them. Source mode always needs the modifier click, since it never folds anything. All
  three surfaces verified twice, real Obsidian, real OS-level clicks, reproducible.
- **Concerns:**
  1. Popout coverage for the CM6 extension is reasoned-not-re-verified (see above) —
     `registerEditorExtension` is the standard, documented, app-wide mechanism, but I did
     not independently spin up a popout under Xvfb to prove it for this specific extension.
  2. The `Prec.highest` requirement (see above) is a real footgun worth remembering for any
     future CM6 extension in this plugin — without it, Obsidian's own core handler silently
     wins and the new extension does nothing, with no error anywhere.
  3. Docs updated with the one behavior nuance the proof surfaced (modifier-click while
     editing near a link); otherwise the existing "works everywhere" framing stands,
     now on solid ground.
# SC-135 phases 1 + 1b — independent adversarial review

**Range reviewed:** `efdced2..5e56f6a` (`51c3f18` DOM click delegator, `5e56f6a` CM6 editor extension)
**Branch/worktree:** `sc135-links` @ `/home/scott/code/steelCompendium/worktrees/sc135-links/draw-steel-elements`
**Reviewer:** independent (did not write either phase)
**Date:** 2026-08-17

---

## VERDICT: FIX ROUND

One reproducible functional bug on a gesture the shipped docs explicitly promise
(**middle-click opens the target twice in Live Preview / Source mode**), plus a docs
sentence that is literally unparseable, plus effectively-zero behavioural test coverage on
the phase-1b extension. None of it is architectural — the design is sound, the battery is
honest, and the three primary surfaces really do work. The fix round is small (delete one
event handler, fix one sentence, port real CM6 coverage in).

---

## 1. Battery — RE-RUN AND CONFIRMED EXACT

Every number in the phase-1b report was independently reproduced at `5e56f6a` in this
worktree. No claim was inflated.

| Gate | Claimed | Measured | Verdict |
|---|---|---|---|
| `npm run tsc` | clean | clean, exit 0 | ✅ |
| `npm run lint` | clean | clean, exit 0 | ✅ |
| `npx jest` | 2742 passed + 1 skipped / 169 suites | `1 skipped, 168 passed, 168 of 169 total` · `1 skipped, 2742 passed, 2743 total` · 3 snapshots · exit 0 | ✅ |
| `npm run shots` | 203 / 0 FAIL | 203 PNGs on disk, 0 `FAIL` in log, exit 0 | ✅ |
| `check-freeze.sh` | 67/67 | `freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0 | ✅ |
| `npm run parity` | 0 / 0 / 16 | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0 | ✅ |

Freeze did **not** move, as required for a TS+docs-only change.

**Bonus gate I ran that the reports did not:** `npm run build-no-check`, then verified the
CM6 externalization. This is the classic Obsidian footgun for a first CM6 extension — if
`@codemirror/state`/`@codemirror/view` get *bundled*, the plugin registers facets from a
**second CM6 module instance** and the extension silently does nothing forever. **Clean:**
`esbuild.config.mjs:82-97` already lists both as `external`, the built `main.js` contains
`require("@codemirror/view")` / `require("@codemirror/state")` and **zero** bundled CM6
internals (`grep -c 'basicMouseSelection\|class EditorView' main.js` → 0). Adding them as
`devDependencies` (not `dependencies`) is the correct convention here.

Worktree left clean at `5e56f6a`; superproject still shows the deliberate unstaged
` M draw-steel-elements` pointer.

---

## FINDINGS (severity-ranked)

### 🔴 H-1 — Middle-click on an scc link in Live Preview / Source mode navigates TWICE

**This is the one blocker.** `createSccLinkCm6Extension` registers **both** `mousedown` and
`auxclick`, and `handlePointerEvent` accepts `event.button === 1` in both. In a real browser
a middle click fires `mousedown` (button 1) **and then** `auxclick` (button 1) — and
`preventDefault()` on `mousedown` does **not** suppress `auxclick`. Both handlers run the
full side-effecting body.

**Reproduction (executed, real `EditorView` + real `@codemirror/*` in jsdom):**

```
{"probe":"B2-middle","navs":2,"newLeafArgs":["tab","tab"],
 "mousedownPrevented":true,"auxclickPrevented":true}
```

vs. the left-click control, which is correctly single:

```
{"probe":"B1","navs":1,"prevented":true}
{"probe":"B2b-left","navs":1}        // mousedown + click both dispatched
```

So: **middle-clicking a compendium link in Live Preview opens two tabs on the same note.**

The code comment states the opposite and its reasoning is the actual defect
(`sccLinkCm6.ts:73-75`):

> *"`auxclick` (middle-click on platforms where it doesn't reach `mousedown` with
> `button === 1` first — defensive redundancy, `handlePointerEvent` is idempotent per its own
> button check either way)"*

`handlePointerEvent` is **not** idempotent — it calls `actions.openVault(...)` every time.
The button check gates *which* events it accepts, not *how many times* it acts.

**Why nobody caught it:** the Xvfb end-to-end run tested only plain-click and Ctrl-click
(CHECK 1 / 2a / 2b / 3a / 3b — no middle click anywhere), and `sccLinkCm6.test.ts` has no
behavioural coverage at all (see M-2).

**It is a documented promise.** `docs/compendium-sync.md` and the CHANGELOG both say
middle-click opens the link in a new tab.

**Fix:** delete the `auxclick` handler from `createSccLinkCm6Extension`. `mousedown` already
receives `button === 1`, and B1/B2 prove the mousedown-only path yields exactly one
navigation. (Phase 1's *DOM* handler is unaffected and correct — it listens to `click` +
`auxclick`, and a middle click fires only `auxclick`, so it is single by construction. Do not
"fix" that one by symmetry.)

---

### 🟠 M-1 — Docs: one sentence is unparseable, and one gesture claim is now false

`docs/compendium-sync.md`, "What doesn't work yet", second bullet:

> "That form is what makes a link survive the compendium's layout changing under it — **some
> sync in the future may keep breaking links from happening if the compendium's structure
> changes again** — so it isn't going away, but an alternative is planned."

The bolded clause is not a sentence. This is user-facing documentation written to satisfy
Scott's explicit ruling (*"Anything we are delaying until after 7.0.0 needs to get clearly
documented… Clarity with what works and what doesn't is important"*), so garbled prose is
squarely in scope. Suggested replacement: *"…survive the compendium's layout changing under
it, so a future restructuring won't break links you've already written."*

Also in the same section, now false given H-1:

> "Ctrl/Cmd-click, Ctrl/Cmd+Alt-click and middle-click open it in a new tab, split, or window"

Middle-click opens **two**. Either fix H-1 (preferred) or drop the claim.

**Two smaller docs accuracy notes** (fix while you're in there, not blockers):

- *"opens the entry's page on steelcompendium.io if you don't [have the note]"* — this is
  gated by the **Links → web fallback** setting (`sccWebFallback`, `src/model/Settings.ts:29`,
  default `true`). With it off, a perfectly valid, merely-unsynced code produces the notice
  instead. The notice reads *"no compendium entry found for …"*, which the docs paraphrase as
  *"tells you plainly that the code isn't recognized"* — the code **is** recognized, it's just
  not on disk and the fallback is off. One clause naming the setting closes both.
- *"Ctrl/Cmd+Alt+Shift"* (the `'window'` pane type) is never named, but "or window" is
  promised. Cosmetic.

**Verified-accurate docs claims** (checked against code, not taken on trust): the folded /
revealed / Source-mode gesture rules (see probes B1/B3/B4 below), and *"only Reading view
actually draws the cards"* — consistent with `docs/index.md:8-9`'s standing "Reading mode
only" position. No ticket references leak into the docs. ✅

---

### 🟠 M-2 — The phase-1b extension has effectively zero behavioural test coverage, and one of its two tests is vacuous

`test/dom/sccLinkCm6.test.ts` contains exactly two assertions: "returns something truthy"
and "returns a different object each call". Everything real is delegated to the pure
functions plus a one-shot manual Xvfb run that is not re-runnable in CI. H-1 lives precisely
in the untested seam between them (event plumbing), which is why it survived.

The second test is worse than thin — it is **misleading**:

```ts
test('is a fresh object each call (no shared mutable state leaking across plugin instances)', …)
```

`Prec.highest(...)` trivially returns a new wrapper each call, so this can never fail; and
the module **does** carry shared mutable state — `MD_LINK_RE` is a module-level `/g` regex
whose `lastIndex` is mutated on every call (`sccLinkAtPos.ts:32`). It happens to be safe
because `findSccLinkAtPos` resets `lastIndex` on entry (I verified non-interference across
interleaved calls), but the test's stated guarantee is not the one it checks.

**This is fixable cheaply — I proved it.** A real `EditorView` *can* be driven in this repo's
jsdom `dom` project: `@codemirror/state` and `@codemirror/view` are in `node_modules`, and
the only two accommodations needed are (a) stub `view.posAtCoords` (jsdom has no layout) and
(b) `jest.mock('obsidian')` to swap the inert `editorLivePreviewField = {}` for a real
`StateField.define<boolean>`. That harness caught H-1 on the first run. The fix round should
land a trimmed version of it as permanent coverage — at minimum the five gesture cases plus
a middle-click regression pin.

Note the inert mock has a silent consequence today: with `editorLivePreviewField = {}`,
`view.state.field(field, false)` returns `undefined → false`, i.e. **every** jsdom test sees
Source-mode semantics. Any future test written without the real StateField will silently
never exercise the Live Preview branch.

---

### 🟡 L-1 — `findSccLinkAtPos` has no syntax awareness: links inside code spans and code fences are followed

The resolver reads raw line text with a regex and knows nothing about markdown context. Both
of these **navigate** (executed):

```
{"label":"10a inline code span","line":"use `[t](scc.v1:…)` literally","result":{"href":"scc.v1:…"}}
{"label":"10b fenced yaml line","line":"  distance: '[Melee](scc.v1:a/b) 1'","result":{"href":"scc.v1:a/b"}}
```

This is a **behavioural divergence from Reading view**, which renders a code span literally
and produces no anchor, so nothing happens. It is directly reachable: `docs/index.md:8-9`
records that ds-* fences render as **plain code in Live Preview**, so every `ds-*` block's
YAML is live raw text in LP, and the plugin's own docs page shows
`[Vasloria](scc.v1:…)` inside a fenced block — a user documenting the syntax in their own
note gets surprise navigation plus a swallowed cursor placement.

Mitigation on the compendium side is total, and I measured it rather than assuming — across
all **37,771** `scc.v1:` markdown links in `data-unified/en/unified/md-dse`: **0** inside
inline code spans. So this only bites user-authored notes.

For the 10b (ds-fence YAML) case one could argue following the link is *desirable*. The
inline-code case is not.

**Fix if taken:** `syntaxTree(view.state).resolveInner(pos, 1)` and bail on
`inline-code` / `HyperMD-codeblock` node names. `@codemirror/language` is already both a
devDependency and an esbuild external, so it costs nothing new. Reasonable to defer with a
FOLLOWUPS entry.

---

### 🟡 L-2 — Resolver edge cases: three silent no-ops and two false positives

I attacked `findSccLinkAtPos` with 23 adversarial lines. **The great majority are correct** —
`]` inside the URL, two links per line, pos between two links, link at line start/end,
adjacent `[[wikilinks]]`, non-scc link covering pos, reference-style, autolinks, bare codes,
unbalanced brackets, headings, list items, and `lastIndex` non-interference all behave. The
misses:

| Case | Input | Result | Class |
|---|---|---|---|
| nested brackets in link text | `[a [b] c](scc.v1:…)` | `null` — click does nothing | silent no-op |
| nested image-in-link | `[![img](a.png)](scc.v1:…)` | `null` | silent no-op |
| wikilink glued to link | `[[A]](scc.v1:…)` | `null` | silent no-op |
| escaped brackets | `\[t\](scc.v1:…)` | **resolves** | false positive |
| image | `![alt](scc.v1:…)` | **resolves** | false positive |
| paren inside the URL | `[t](scc.v1:a(b)c)` | resolves with truncated href `scc.v1:a(b` | false positive |
| pos exactly at `to` (trailing comma) | `[Vasloria](scc.v1:…),` clicked on the comma's left half | **resolves** | 1-char overshoot |

The three no-ops matter more than they look, because **Reading view handles all three**
(Obsidian's real CommonMark parser produces an `<a>`, which `rewriteSccAnchors` rewrites) —
so LP/Source diverge from Reading view rather than merely being limited. That said, I
measured the blast radius against real content and it is **zero**: of 37,771 compendium scc
links, **0** have nested brackets in link text, **0** are images, **0** have a paren in the
URL. Purely a user-authored-note concern.

The `pos <= to` inclusivity (`sccLinkAtPos.ts:52`) is deliberately pinned by an existing
test, and note the ticket's own example text is `[Vasloria](scc.v1:…),` — the left half of
that comma is clickable-as-link. Harmless, but the span is one character wider than the link.

**Recommendation:** accept as documented scope (the module's own header comment already
scopes it honestly), but a FOLLOWUPS entry naming the divergence-from-Reading-view class is
worth having so nobody re-derives it later.

---

### 🟡 L-3 — `lineRevealed` reads only the MAIN selection range; a secondary cursor is invisible

`sccLinkCm6.ts:47` uses `view.state.selection.main`. With a multi-cursor selection whose
*secondary* cursor sits on the link's line, Obsidian's LP **is** showing raw syntax there,
but the extension computes `lineRevealed = false` and a plain click follows the link instead
of placing the cursor — contradicting the documented rule.

**Reproduction (executed, real `EditorView`, two cursors, main at offset 0, secondary on the
link's line):**

```
{"probe":"B11-multicursor","navs":1,"prevented":true}   // expected: 0 navs
```

**Fix:** iterate `view.state.selection.ranges` instead of `.main`. One line.
Multi-cursor is niche → low.

---

### 🟡 L-4 — The extension acts on `mousedown`, not `click` — drag/selection from a folded link is impossible

When the extension decides to follow, it `preventDefault()`s the **mousedown**, so:

- you cannot start a drag-selection whose anchor point is on a folded LP scc link;
- a press-then-drag-away-then-release still navigates (real links only navigate if you
  release on them);
- you cannot drag the link into another pane.

Confirmed by probe: `B1 → prevented:true` on the follow path. Correctly **not** prevented on
the non-follow paths (`B3 → plainPrevented:false`), so ordinary editing is untouched.

This is a genuine divergence from Obsidian's own link behaviour, but it is also not a
*regression* (these links previously did nothing at all), and moving the navigation to
`click` while keeping the `mousedown` interception is a real redesign. **Note only** — but
the eventual middle-click fix (H-1) is the natural moment to consider whether `mousedown`
should intercept-and-defer rather than intercept-and-act.

---

### 🟡 L-5 — Popout coverage for the CM6 extension: UNVERIFIED (marking it, as instructed)

I did **not** spin up a real Obsidian popout under Xvfb. The cost (seeded vault + CDP +
popout creation + xdotool into a second X window) is high and the information gain is low,
because the code-level argument is airtight in the two places where popouts could actually
break:

- `registerEditorExtension` is app-level; there is no per-window attach surface to get wrong,
  so a popout editor either gets *all* plugin extensions or none.
- The one place a popout *could* have been botched is the window reference for the web
  branch, and it is correct: `view.dom.ownerDocument.defaultView ?? window`
  (`sccLinkCm6.ts:63`) resolves the **clicked editor's own** window, not the main one.

**Status: reasoned, not verified. No identified residual risk.** Phase 1's DOM handler
popout wiring, by contrast, *is* covered (jsdom tests drive a second real `Document` and the
`window-open` callback).

---

### 🟡 L-6 — `attached: Set<Document>` retains every popout Document for the plugin's lifetime

`sccLinkClickHandler.ts:148`. The Set is captured by the `window-open` closure, which lives
until unload, and nothing ever removes a closed popout's `Document`. Each popout opened in a
session permanently retains a detached document and its DOM tree.

Everything else in lifecycle is clean and, unlike the CM6 side, actually **tested**:
`registerDomEvent` auto-detaches (there is an explicit "detaches cleanly on plugin unload — a
click afterwards is no longer intercepted" test), the `window-open` ref goes through
`registerEvent`, `registerEditorExtension` is Obsidian-managed, and repeated enable/disable
builds fresh closures with no accumulation. Bounded, session-scoped, low.

---

### ⚪ N-1 — Phase 1's DOM handler still has no demonstrated live surface

Worth recording honestly rather than fixing. Phase 1's own report raised this (concern #1)
and phase 1b resolved the *user-facing* half of it by adding the CM6 path — but nobody went
back and asked whether the DOM delegator itself now does anything. Its three stated targets
(Reading-view prose, ds-* element cards, hover popovers) are all rewritten by
`rewriteSccAnchors` **before** click time, so no `scc:`-prefixed anchor survives for it to
intercept. I confirmed the pass-through:

```
{"probe":"B8-rewritten","handled":false,"navs":0}   // .internal-link + vault href: untouched
```

It is cheap, correct, well-tested insurance for third-party renderers, and it is the right
safety net for SC-166's future "code present, file absent → leave as scc" case. **Keep it.**
Just don't let anyone believe it is what fixes the reported bug — the CM6 extension is.

---

## Claims checked and CONFIRMED (no finding)

**Fold/reveal gating — independently reproduced** against a real `EditorView` + real
`@codemirror/*`, not merely re-read:

```
{"probe":"B1","navs":1,"prevented":true}                                        // LP folded, plain -> follows
{"probe":"B3","plainNavs":0,"plainPrevented":false,"afterCtrlNavs":1,"ctrlPrevented":true}  // LP revealed
{"probe":"B4","plainNavs":0,"afterCtrlNavs":1}                                  // Source mode
{"probe":"B5","navs":0,"prevented":false}                                       // right-click ignored
{"probe":"B10","navs":0}                                                        // posAtCoords null -> clean no-op
```

All five match the reports, the docs, and Obsidian's own convention.

**Double-handling — no double navigation from having both mechanisms live** (except H-1's
middle click, which is a CM6-internal double, not a cross-mechanism one):

```
{"probe":"B2b-left","navs":1}        // CM6 mousedown + the click that follows it
{"probe":"B6-no-anchor","navs":1}    // document delegator AND CM6 extension both attached
{"probe":"B8-rewritten","handled":false,"navs":0}   // rewritten Reading-view anchor: ours stays out
```

The cross-mechanism collision is structurally impossible: the CM6 path fires on `mousedown`
against raw document text (no anchor exists there), while the DOM path fires on
`click`/`auxclick` and requires an `<a>` whose href still starts with `scc`. Every render
path that produces such an anchor has already rewritten the href away from `scc:`. (My
contrived worst-case probe — a raw scc anchor injected into the editor's contentDOM over
matching raw text — returned 1 nav, but CM6's DOMObserver reverts foreign nodes so I treat
that number as inconclusive rather than as evidence. Not reachable in production either way.)

**`Prec.highest` is genuinely required — mechanism verified by execution.** Two
`domEventHandlers` extensions, both returning `true`, registration order `[normal, highest]`:

```
{"probe":"B9-prec","order":["highest"]}              // Prec.highest wins
{"probe":"B9-noprec","order":["normal"]}             // without it, first-declared wins and blocks the rest
```

That is exactly the failure mode the comment describes: a normal-precedence handler declared
first (Obsidian's core editor plugin) consumes the mousedown and the later extension never
runs, silently, with no error. The empirical half — that Obsidian's core handler returns
`true` for an ordinary click — was proven end-to-end by the implementer; the mechanism half
is now proven here too. **The comment is accurate and the `Prec.highest` is load-bearing.**

**Does `Prec.highest` steal from anything else?** Audited: hover previews use
`mouseover`/`mousemove` (untouched); the handler returns `false` on every non-follow path so
CM6's own cursor placement, selection, and other plugins' handlers all proceed normally
(B3/B4/B5/B10 all show `navs:0` with normal handling continuing); `preventDefault` on
mousedown only ever fires on the follow path. The only cost is L-4. Note that if another
plugin also uses `Prec.highest` on `mousedown`, relative order is registration-dependent —
but that only matters on our follow path, i.e. on an scc link.

**Scott's rulings — followed.** Ruling 3 (*"file a ticket in the backlog"*) → **SC-166**
exists, in Backlog, and its description carries the phase-2 design plus the answer to ruling 5's
breaking-change question. Ruling 4 (default stays `scc`) → unchanged. Ruling 7 (*"leave user
notes alone"*) → nothing in this range writes to a note. Ruling *"anything delayed must be
clearly documented"* → the "What doesn't work yet" section exists and names backlinks / graph
/ unlinked-mentions and the missing wikilink format, in plain language with no ticket refs —
satisfied apart from M-1's garbled sentence.

---

## Fix-round checklist

1. **H-1** — delete the `auxclick` handler in `createSccLinkCm6Extension` (and correct the
   "idempotent" comment). Re-verify middle-click yields one navigation.
2. **M-1** — rewrite the garbled "some sync in the future may keep breaking links from
   happening" sentence; add the `sccWebFallback` clause; keep the middle-click promise only
   once H-1 is fixed.
3. **M-2** — land real CM6 coverage (a real `EditorView` + stubbed `posAtCoords` + a real
   `editorLivePreviewField` StateField works in this repo's jsdom project today); include a
   middle-click regression pin; delete or re-point the vacuous "fresh object each call" test.
4. **L-3** — `selection.ranges` instead of `selection.main` (one line).
5. **L-1 / L-2 / L-6** — FOLLOWUPS entries, not code, unless the fix round has room.
6. Re-run the full battery; expect the same 2742/203/67/0-0-16 with jest moving by however
   many CM6 tests get added, and **freeze must not move**.

---

# Fix round 1

**Applied by:** the reviewer (same session — the implementer's context was gone, and the
probes that found H-1 were the freshest thing available).
**Base:** `5e56f6a` · **Branch:** `sc135-links`, same worktree.
**Scope:** the coordinator's rulings — H-1, M-1, M-2, L-3, L-6 fixed; L-1, L-2, L-4, L-5
deferred by ruling; N-1 stands (the DOM delegator is kept as insurance).

## What changed, per finding

### H-1 — middle-click double navigation · FIXED

`createSccLinkCm6Extension` now registers **`mousedown` only**. A middle click already
arrives as `mousedown` with `button === 1`; the `auxclick` handler was a second, redundant
entry point for the same physical click, and `handlePointerEvent` performs a side effect
every time it runs.

The comment that made the bug possible ("defensive redundancy, `handlePointerEvent` is
idempotent per its own button check either way") is replaced by a **do-not-re-add** note
naming the failure mode and pointing at the test that pins it.

Phase 1's DOM delegator was deliberately left alone: it binds `click` + `auxclick`, and a
middle click reaches only `auxclick`, so it is single by construction. Its doc comment now
says so explicitly, so nobody "fixes" it by symmetry later.

### M-1 — docs and CHANGELOG · REWRITTEN

`docs/compendium-sync.md`'s "Compendium links" section is restructured into
**"Clicking one"** and **"What compendium links can't do yet"**, and rewritten for a
non-technical reader:

- The garbled sentence is gone.
- Where a click takes you is now a three-outcome list (synced note / website / unrecognized
  code), and the website outcome names the real gate: **Fall back to steelcompendium.io
  links** (Settings → Draw Steel Elements → **Links**, on by default) — the exact label in
  `SettingsTab.ts`, verified against the source, not paraphrased.
- All four gestures are spelled out, including `Ctrl/Cmd+Alt+Shift` (new window), which the
  old text promised implicitly ("or window") without ever saying how.
- The Live Preview / raw-syntax / Source-mode nuance is stated in plain language.
- "Only Reading view draws the cards" is kept — it matches `docs/index.md`'s standing
  "Reading mode only" position.
- The deferred work is framed as deliberate, not broken: backlinks/graph/unlinked mentions,
  and the absent wikilink/vault-path sync option, each with a one-line "why."
- No ticket references anywhere.

The CHANGELOG entry is rewritten to match (gestures, the setting name, the editing nuance,
and both deferrals).

### M-2 — real CM6 coverage · REPLACED

`test/dom/sccLinkCm6.test.ts` goes from 2 vacuous smoke tests to **17 behavioural tests**
driving a real `EditorView` with the real `@codemirror/{state,view}` packages. Two
accommodations, both documented in the file header: `posAtCoords` is stubbed (jsdom has no
layout — this is the one thing it genuinely cannot provide, and the Xvfb run covers it), and
`editorLivePreviewField` is swapped for a real `StateField` (the shipped mock's inert `{}`
makes `state.field()` return `undefined`, silently forcing Source-mode semantics on every
test).

Three harness details worth knowing, each found by a test failing for the right reason:

- **`Range.prototype.getClientRects` must be stubbed.** When the extension correctly
  *declines* a mousedown, CM6's own selection machinery takes over and measures text, which
  throws in jsdom — failing precisely the tests that assert we stayed out of the way.
- **`evt.defaultPrevented` cannot express "we declined."** CM6 calls `preventDefault()`
  itself on the same event, so the flag is `true` either way. The tests instead use a
  `Prec.lowest` downstream observer: it runs if and only if the extension returned false.
  That is CM6's own documented contract, used as the assertion.
- **`EditorState.allowMultipleSelections.of(true)` is required** or CM6 collapses a
  multi-cursor selection to its main range at state construction — which would have turned
  the L-3 regression test into a single-cursor test that passes for the wrong reason.

Coverage: LP folded plain-click follows (and consumes the event); LP raw plain-click
declines (and the event survives for cursor placement); LP raw Ctrl-click follows; Source
plain declines / Ctrl follows; middle-click once; left-click once; no double-handling with
the DOM delegator attached; right-click ignored; unmappable click no-op; click outside a
link no-op; web and unresolved branches (including that the web branch uses the clicked
editor's own window); and three `Prec.highest` tests — without it a core-like handler
declared first swallows the event, with it the extension runs ahead of that same handler,
and it wins regardless of declaration order.

The "fresh object each call" test is deleted (it could never fail) and its claimed property
is pinned where it actually lives: `MD_LINK_RE` is no longer a module-level `/g` RegExp —
`sccLinkAtPos` builds the pattern per call from a source string, with two new unit tests
pinning that no state carries between calls.

### L-3 — multi-cursor reveal · FIXED

`lineRevealed` now reads `view.state.selection.ranges.some(...)` instead of
`selection.main`.

### L-6 — closed-popout retention · FIXED, and it went deeper than the finding said

The ruling offered "delete from `attached` on `window-close`, or a WeakSet." Investigating
to implement it showed **neither would have fixed the leak**: `Component.registerDomEvent`
also pushes a `() => el.removeEventListener(...)` closure into the owner's registry, which
captures the `Document` and lives until *that owner* tears down. With the plugin as owner,
clearing the dedupe set would have removed one of three references per popout and left the
other two.

So each window now gets its own `DetachableDomEventOwner` (a tiny local `DomEventOwner`
that records its own removals), tracked in a `Map<Document, owner>`; `window-close` deletes
the entry and calls `detachAll()`, dropping the listener closures and the map key together.
A single `plugin.register(...)` teardown releases whatever is still attached at unload.

`attachSccLinkClickHandling` is unchanged and remains the only place that knows which events
to bind, so all its existing coverage still applies.

One design note for the record: the natural Obsidian idiom here is a child `Component` via
`plugin.addChild`/`removeChild`, and that was tried first. It does not fit this module's
seam — `Component.addChild` is generic and constrained to `Component`, so putting it on
`SccClickPlugin` forces every caller to be a real `Component` and breaks the lightweight
structural fakes the interface exists for (tsc rejected it against both the real `Plugin`
and the test mock). The seam gains only `register(callback)`, which real `Plugin` and the
mock implement identically. The rejected approach is documented in the interface's comment
so it isn't re-attempted.

Five new tests: window-close is registered; closing a popout detaches only that popout;
close-then-reopen re-attaches exactly once; window-close for a never-attached window is a
no-op; plugin unload still detaches every remaining window.

## Can-fail proof

Both behavioural pins were verified to actually catch their regression — each fix was
reverted in isolation and the suite re-run:

| Reverted | Result |
|---|---|
| `auxclick` handler restored (H-1) | **1 failed**, 16 passed — `H-1 regression: a MIDDLE click navigates exactly ONCE...` |
| `lineRevealed` back to `selection.main` (L-3) | **1 failed**, 16 passed — `L-3 regression: a SECONDARY multi-cursor on the link line counts as revealed` |

In both cases exactly the intended test failed and nothing else, then the fix was restored
and all 17 passed again.

One of my own new unit tests failed on first run for a real reason and was corrected, not
suppressed: it asserted `findSccLinkAtPos(line, 0, line.length)` was `null` on a line that
*ends* with the link — but `to` is inclusive, so that position is legitimately inside it.
The test now uses a line with trailing prose, which is an actual full-scan miss.

## Deferred by ruling — unchanged, restated so they aren't lost

- **L-1** — no syntax awareness: links inside inline-code spans and fenced code blocks are
  followed, diverging from Reading view. 0 of 37,771 compendium links affected; user-authored
  notes only. Fix if ever taken: `syntaxTree(view.state).resolveInner(pos, 1)`, bail on
  `inline-code` / `HyperMD-codeblock` (`@codemirror/language` is already a devDependency and
  an esbuild external). **For FOLLOWUPS.**
- **L-2** — resolver edge cases (nested brackets and `[[A]](scc:)` silently no-op where
  Reading view works; escaped brackets, images and paren-in-URL false-positive; the `pos <= to`
  boundary makes a trailing comma half-clickable). 0/37,771 real occurrences.
- **L-4** — acting on `mousedown` means you cannot drag-select or drag out from a folded
  link. Not a regression; these links previously did nothing at all.
- **L-5** — CM6 popout coverage remains **reasoned, not verified**. No residual risk found
  in code: `registerEditorExtension` is app-level with no per-window attach surface, and the
  web branch uses `view.dom.ownerDocument.defaultView`.
- **N-1** — the phase-1 DOM delegator still has no demonstrated live surface and is kept
  deliberately, as third-party-render insurance and as the safety net for the future
  "code present, file absent → leave as scc" case.

## Battery after fix round 1

**Commit `be697e5`** on `sc135-links`, on top of `5e56f6a`. Measured on a quiet machine
(see the contention note below):

| Gate | Before (`5e56f6a`) | After (`be697e5`) |
|---|---|---|
| `npm run tsc` | clean, exit 0 | **clean, exit 0** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** |
| `npx jest` | 2742 passed / 1 skipped / 2743 total · 168 of 169 suites | **2764 passed / 1 skipped / 2765 total · 168 of 169 suites** · 3 snapshots · exit 0 |
| `npm run shots` | 203, 0 FAIL | **203, 0 FAIL**, exit 0 |
| `check-freeze.sh` | `freeze OK (67/67 …)` | **`freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0 — did not move** |
| `npm run parity` | 0 / 0 / 16, exit 0 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0** |

**Jest delta: +22 tests, suite count unchanged at 169** (existing files were rewritten, none
added). Accounted for exactly: `sccLinkCm6.test.ts` 2 → 17 (+15), `sccLinkClickHandler.test.ts`
+5 (the per-window teardown group), `sccLinkAtPos.test.ts` +2 (regex statelessness).
TS + docs only, so shots/freeze/parity are byte-for-byte unchanged, as required.

### A note for whoever reads the intermediate logs: two runs failed to machine contention, not to this change

Mid-fix-round, two full-suite runs failed with 4–6 timeouts, always the same two unrelated
suites (`test/dom/views/settings-tab.test.ts`, `test/dom/views/settings-preview.test.ts`,
both "Exceeded timeout of 5000 ms"). Sibling agents were running their own jest and shots in
`worktrees/sc169-menu-panel` and `worktrees/sc165-snapshot-meta`; 1-minute load average was
**45–57** on a machine where the clean baseline had run at a fraction of that.

This was not assumed — it was isolated by direct A/B. The fix round was stashed and the
**base commit `5e56f6a` was run under the same load**: it failed **the same two suites, the
same five tests** (`5 failed / 2737 passed`), while the fix round under comparable load was
`4 failed / 2760 passed`. The two suites also pass in isolation (54 tests, ~20 s) and pass
alongside the rewritten CM6 suite (71 tests, ~18 s). Both arms of the A/B are contention
artifacts; the authoritative run above is the one taken once load fell below ~14, and it is
fully green.

Worth remembering for this workspace: **a shared build host running several worktrees at
once will make jest's default 5 s per-test timeout fire in the slowest suites.** Check
`/proc/loadavg` before believing a timeout-shaped failure, and A/B against the base commit
rather than debugging your own diff.
# SC-135 fix round 1 — scoped re-review (fresh eyes)

**Range reviewed:** `5e56f6a..be697e5` (`be697e5` "fix(refs): SC-135 fix round 1 — middle-click
fired twice, multi-cursor reveal, popout retention")
**Branch/worktree:** `sc135-links` @ `/home/scott/code/steelCompendium/worktrees/sc135-links/draw-steel-elements`
**Reviewer:** independent of the fix round (the fix round was written by the agent who found
the findings; this is the second pair of eyes)
**Date:** 2026-08-17
**Scope:** the delta only. Findings deferred by ruling (L-1/L-2/L-4/L-5, N-1) were not re-litigated.

---

## VERDICT: LAND

All four code fixes (H-1, L-3, L-6, plus the `MD_LINK_RE` de-globalization) are real, correctly
implemented, and can-fail proven by mutation — I reverted each one and watched exactly the
intended test go red. The docs rewrite is accurate to the code, the setting label matches
`SettingsTab.ts` verbatim, and the full battery reproduces the claimed numbers exactly, with
freeze unmoved.

The residual findings are all **test-quality**, not behaviour: three of the 17 new CM6
assertions cannot fail, and the two new regex-statelessness tests pass against the pre-fix
implementation too. None of them changes what ships. Recording them so the next reader doesn't
trust coverage that isn't there — they are worth a cheap cleanup pass whenever this file is next
open, not a fix round of their own.

---

## 1. Battery — RE-RUN AT `be697e5`, EXACT

Measured in this worktree, in dse-verify order, gate command last in each `bash -c` (no pipes,
no trailing `echo`). **1-min loadavg at the start of the jest run: 10.76; at the start of
shots/freeze/parity: 11.43; falling to 3.20 by the end.** Nowhere near the 45–57 contention band
that makes `views/settings-tab` / `views/settings-preview` time out — and neither suite failed.

| Gate | Claimed by fix round | Measured here | Verdict |
|---|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, `TSC_EXIT=0` | ✅ |
| `npm run lint` | clean, exit 0 | clean, `LINT_EXIT=0` | ✅ |
| `npx jest` | 2764 passed / 1 skipped / 168 of 169 suites | `1 skipped, 168 passed, 168 of 169 total` · `1 skipped, 2764 passed, 2765 total` · 3 snapshots · `JEST_EXIT=0` | ✅ |
| `npm run shots` | 203 / 0 FAIL | 203 PNGs on disk, 0 `FAIL` in log, `SHOTS_EXIT=0` | ✅ |
| `check-freeze.sh` | 67/67, did not move | `freeze OK (67/67 steel-print PNGs byte-identical)`, `FREEZE_EXIT=0` | ✅ |
| `npm run parity` | 0 / 0 / 16 | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, `PARITY_EXIT=0` | ✅ |

Jest delta from the base is +22 as claimed, suite count unchanged at 169. TS + docs only, so
shots/freeze/parity are byte-for-byte unchanged — freeze did **not** move, as required.

Worktree left clean at `be697e5`; superproject still shows the deliberate unstaged
` m draw-steel-elements` pointer.

---

## 2. What I verified by execution, per instruction

### H-1 — `auxclick` gone, middle-click navigates exactly once ✅

`src/refs/sccLinkCm6.ts:98-106` registers `mousedown` only; the whole `auxclick` entry is
deleted, and the old "defensive redundancy / idempotent" comment is replaced by a
do-not-re-add note that names the failure mode and points at the pinning test.

**Can-fail, flipped myself:** re-added the `auxclick` handler verbatim → `Tests: 1 failed, 16
passed`, and the one failure is
`… › H-1 regression: a MIDDLE click navigates exactly ONCE across the whole mousedown+auxclick pair`,
with the diff showing the second `{linkpath, newLeaf: "tab"}` push. Restored → 17 pass.

The test dispatches the real browser pair (`mousedown` button 1, then `auxclick` button 1)
against a real `EditorView`, which is the correct shape.

Phase 1's DOM delegator was correctly left alone (`click` + `auxclick`, one shared callback,
middle click reaches only `auxclick`) and now says so in its own comment.

### L-3 — `selection.ranges.some(...)`, and the multicursor test is genuinely multicursor ✅

`sccLinkCm6.ts:51`:
`view.state.selection.ranges.some((range) => range.from <= line.to && range.to >= line.from)`.

**Can-fail:** reverted to `const sel = view.state.selection.main` → `Tests: 1 failed, 16 passed`,
the failure being exactly
`… › L-3 regression: a SECONDARY multi-cursor on the link line counts as revealed`.

**The test really does exercise two selections** — I instrumented `handlePointerEvent` and read
the live state rather than trusting `allowMultipleSelections.of(true)`:

```
PROBE ranges=2 main.from=0 lineRevealed=true allRanges=[[0,0],[14,14]]
```

Main range at offset 0 (off the link's line), secondary at 14 (the link line's start). CM6 did
**not** collapse it. That was the exact trap the fix round flagged, and the facet defeats it.

### L-6 — per-window owner, released on `window-close` ✅

Design as described: `attached` is now `Map<Document, DetachableDomEventOwner>` doubling as the
dedupe set; `window-close` deletes the key and calls `detachAll()` (`removals.splice(0)`); one
`plugin.register(...)` teardown drains whatever is left at unload.

**Is `window-close` what Obsidian actually emits?** Yes. `node_modules/obsidian/obsidian.d.ts:8096`:

```ts
on(name: 'window-close', callback: (win: WorkspaceWindow, window: Window) => any, ctx?: any): EventRef;
```

`@since 0.15.3`; `manifest.json` `minAppVersion` is `1.13.0`, so it is always available. Name,
argument shape and the `EventRef` return (handed to `plugin.registerEvent`) all match the code
at `sccLinkClickHandler.ts:222` exactly — it is the direct sibling of the `window-open` overload
two entries above (`:8090`), which this module already used.

**Lifecycle probed directly** (temporary test, since deleted): I wrapped a popout `Document`'s
`addEventListener`/`removeEventListener` and compared the two logs.

```
PROBE open   adds=[["click",{"capture":true}],["auxclick",{"capture":true}]]  removes=0
PROBE close  adds=2  removes=[["click",{"capture":true}],["auxclick",{"capture":true}]]
PROBE cycles adds=6  removes=6      // 3 x (open, duplicate open, close)
PROBE unload adds=2  removes=2      // unload with the popout still open
```

- Every add is matched by a remove with the **same callback identity** and the **same options
  object** — so the `{capture: true}` flag matches and the removal genuinely takes (an options
  mismatch here would silently no-op).
- Close → reopen → close, three cycles with a duplicate `window-open` in each: **6 adds / 6
  removes**. Re-attaches exactly once per cycle; the duplicate open still dedupes.
- Unload with a popout open detaches it; a `window-close` arriving *after* unload is inert; a
  second `window-close` for an already-closed window is inert.

**Any path where a Document is still retained after its window closes?** I traced all three
references the finding named and found none left:
1. the map key — dropped by `attached.delete(doc)`;
2. the `() => el.removeEventListener(...)` closures, which are what capture `doc` —
   `removals.splice(0)` empties the array before running them, so they are unreachable
   the moment `detachAll` returns;
3. the owner object itself — referenced only by the map entry just deleted and by `detach`'s
   own local, which goes out of scope.
Nothing else in `src/` holds a `Document`: `attachSccLinkClickHandling`'s shared `onEvent`
closure captures only `resolver`/`actions`. The main window's document is intentionally held
until unload, which is correct.

**Can-fail on all three moving parts** (`test/dom/sccLinkClickHandler.test.ts`, 24 tests):

| Mutation | Result |
|---|---|
| drop the `window-close` registration | **4 failed** / 20 passed |
| `detach` no longer does `attached.delete(doc)` | **2 failed** / 22 passed (incl. "closed and re-opened attaches again") |
| drop the `plugin.register(...)` unload teardown | **3 failed** / 21 passed (incl. "plugin unload still detaches EVERY window") |

The `addChild`/`removeChild` rejection recorded in the interface comment is correct as written —
`Component.addChild<T extends Component>` would force every caller of this seam to be a real
`Component`.

### M-2 — the 17 CM6 tests are behavioural: spot-checked by mutating the source ✅ (with 2 dead assertions, below)

Real `EditorView`, real `@codemirror/{state,view}`, real `StateField` for
`editorLivePreviewField`. Four source mutations, not three:

| Mutation to `src/refs/sccLinkCm6.ts` | Result |
|---|---|
| button gate accepts button 2 | **1 failed** — `… non-events › a right-click is ignored entirely` ✅ |
| `livePreview` hardcoded `true` | **1 failed** — `… Source mode › a plain click does NOT follow` ✅ |
| delete `event.preventDefault()` | **17 passed** ❌ — see finding R-1(i) |
| `const win = window` (drop `view.dom.ownerDocument.defaultView`) | **17 passed** ❌ — see finding R-1(ii) |

**`Prec.highest` necessity is genuinely proven — by one of the three tests.** Stripping the
`Prec.highest(...)` wrapper gives `Tests: 1 failed, 16 passed`, the failure being
`… › WITH Prec.highest, the real extension runs ahead of that same handler and follows the link`
— the test that declares the core-like handler *first*. That is the real pin. See R-1(iii) for
the third test, which does not fail.

### `MD_LINK_RE` — no module-level `/g` state left ✅

`sccLinkAtPos.ts:52` is now a source **string** (`MD_LINK_SOURCE`) and `:66` builds
`new RegExp(MD_LINK_SOURCE, 'g')` per call. The escaped string is character-for-character
equivalent to the old literal. No `RegExp` object survives at module scope anywhere in the file,
and the whole existing 19-test suite still passes against it. See R-2 for what the two new tests
do and don't pin.

### M-1 — docs, read as a non-technical Obsidian user ✅

`docs/compendium-sync.md` "Compendium links" (lines 113-167), now split into **Clicking one** /
**What compendium links can't do yet**. Every sentence parses; the garbled "some sync in the
future may keep breaking links from happening" clause is gone. Checked against code rather than
taken on trust:

- **Setting label matches verbatim.** Docs: "the **Fall back to steelcompendium.io links**
  setting (Settings → Draw Steel Elements → **Links**)". Source: `src/views/SettingsTab.ts:557`
  `label: 'Fall back to steelcompendium.io links'`, inside `const links: NavSection` with
  `label: 'Links'` (`:554`). Exact match including the lowercase "back".
- **The gate is described accurately.** `SccResolver.ts:108-113`: with `sccWebFallback` true →
  `{kind:'web'}`; false → `{kind:'unresolved'}` → the Notice. Docs: "With it turned off, nothing
  opens and you get a short message saying the entry wasn't found instead." Correct, and it
  closes the original M-1 complaint that a valid-but-unsynced code was being described as
  unrecognized.
- **All four gestures match `Keymap.isModEvent`** (`test/mocks/obsidian-core.ts:680-690`,
  faithful to the real semantics): plain → current tab, Ctrl/Cmd → tab, +Alt → split,
  +Alt+Shift → window, middle → tab. `Ctrl/Cmd+Alt+Shift` is now named, closing the old
  "or window" gap. Middle-click is now truthfully single (H-1).
- **The Live Preview / raw-syntax / Source-mode paragraph** matches `shouldFollowOnClick`
  exactly.
- **"Only Reading view draws the cards"** kept, consistent with `docs/index.md`'s standing
  position.
- **No ticket references** anywhere in the docs (`grep -n "SC-[0-9]"` on the file: zero hits).
  `CHANGELOG.md` carries `(SC-135)` per its own convention.
- **CHANGELOG matches the docs**: same three outcomes, same setting name, same four gestures,
  same editing nuance, same two deferrals, and it links to
  `docs/compendium-sync.md#compendium-links` — an anchor the `## Compendium links` heading still
  provides.

### Nothing regressed outside the delta ✅

Battery above. `src/` diff touches only the three `refs/` files; `main.ts` is untouched and still
type-checks against the narrowed `SccClickPlugin` (which dropped `DomEventOwner` and gained
`register`) — tsc clean. FOLLOWUPS **#72** exists and carries L-1, L-2 and L-4 with the measured
blast radius and the `syntaxTree` fix shape, as ruled.

---

## FINDINGS (severity-ranked — none blocking)

### 🟡 R-1 — Three of the 17 new CM6 assertions cannot fail

Same class of defect the fix round deleted the "fresh object each call" test for. Each is a
one-line fix; the *tests around them* are fine, it is these specific assertions that are dead.

**(i) `expect(evt.defaultPrevented).toBe(true)` is vacuous** (`test/dom/sccLinkCm6.test.ts:191`,
in "folded link … follows it, exactly once, and consumes the event").

Reproduction: delete `event.preventDefault();` at `src/refs/sccLinkCm6.ts:60` → **`Tests: 17
passed`**. Nothing in the suite notices.

Why: CM6 calls `preventDefault()` itself whenever a `domEventHandlers` handler returns `true`,
so the flag is set either way. This is the *same* reason the file's own header (lines 104-113)
gives for not using `defaultPrevented` to detect a decline — the reasoning was applied to the
false branch and missed on the true branch. The line it fails to pin is the one whose stated
purpose is beating Obsidian's external-link confirm, i.e. the ticket's whole point. Low, not
higher, because the handler returning `true` gets the same practical outcome and the
`expect(downstream).toEqual([])` assertion in the same test is genuinely load-bearing.

Fix: drop the assertion, or replace it with an observer that distinguishes the two — e.g. assert
`preventDefault` was called before CM6 saw the event, via a `Prec.highest`-adjacent spy.

**(ii) The popout-safety assertion in the web-branch test cannot fail**
(`test/dom/sccLinkCm6.test.ts:353`,
`expect(actions.webCalls[0].win).toBe(view.dom.ownerDocument.defaultView)`).

Reproduction: replace `view.dom.ownerDocument.defaultView ?? window` with a bare `window` at
`src/refs/sccLinkCm6.ts:67` → **`Tests: 17 passed`**. In a single-document jsdom environment the
two expressions are the same object, so the test cannot detect the popout-unsafe implementation
its own title names.

This matters slightly more than (i) because L-5 identified this exact line as the one place a
popout could have been botched, and the fix-round report lists "that the web branch uses the
clicked editor's own window" among what the 17 cover. It does not. The popout claim remains
**reasoned, not verified** — unchanged from L-5, just not improved as advertised.

Fix: build the view inside a second `Document` (`document.implementation.createHTMLDocument`)
whose `defaultView` differs, as `sccLinkClickHandler.test.ts` already does for the DOM delegator;
or assert `!==` against the global `window` from a genuinely separate window object.

**(iii) "the extension really is wrapped at highest precedence, not merely declared first" does
not test that** (`test/dom/sccLinkCm6.test.ts:432`).

Reproduction: strip `Prec.highest(...)` from `createSccLinkCm6Extension` → **`Tests: 1 failed, 16
passed`**, and the survivor set includes this test. It declares the real extension **first** and
the core-like handler second, so first-declared-wins alone produces a pass; precedence is never
exercised.

Necessity *is* proven, by the sibling test that declares the core-like handler first — so the
`Prec.highest` is load-bearing and the source is correct. Only this third test's title
overpromises. Fix: swap the two entries in its `extensions` array (then it becomes a real
duplicate of the sibling, so retitling or deleting is equally fine).

Also noted, not a defect: the first of the three ("WITHOUT `Prec.highest` … swallows the event")
uses a hand-written handler rather than `createSccLinkCm6Extension`, so it is a mechanism
demonstration, not a pin on the source. That is clear from the code and appropriate.

### 🟡 R-2 — The two new regex-statelessness tests don't pin the change they were added for

`test/unit/refs/sccLinkAtPos.test.ts`, the two "no state carries between calls" cases.

Reproduction: revert `sccLinkAtPos.ts` to the *pre-fix* implementation (module-level
`/…/g` + `MD_LINK_RE.lastIndex = 0` on entry) → **`Tests: 21 passed`**. Both new tests are green
against the code they were written to replace, because that code was already correct — which the
fix round's own prose says ("it was never actually wrong").

They do pin the underlying property against the realistic future regression, which is the stated
intent: removing the `lastIndex = 0` reset from that same pre-fix implementation gives
**7 failed / 14 passed**, including
`no state carries between calls: repeating a call after scanning further returns the same answer`.

The second of the two ("the FIRST link on a line is still found after a miss") is redundant even
for that purpose: a `/g` regex resets `lastIndex` to 0 automatically when `exec` returns `null`,
so a full-scan miss can never leave state behind. It passed in every arm of the probe.

Net: the source change is behaviourally unobservable to the whole suite. That is fine — it is a
readability/trap-removal change and the comment says so — but nobody should read these two tests
as evidence the change did something.

### 🟡 R-3 — Test hygiene: a document-level listener leaks between tests

`test/dom/sccLinkCm6.test.ts:287-304` ("no double-handling with phase 1's document-level DOM
delegator also attached") attaches capture-phase `click` + `auxclick` handlers to the **shared
jsdom `document`** through a throwaway owner with no teardown, and the file's `afterEach` only
destroys views and clears `document.body`.

It is harmless *today* purely by ordering: it is the last test in its `describe`, and every test
after it fires `mousedown` only, which the delegator ignores. Reorder the file — or add one
`click`/`auxclick` case below it — and the leaked delegator starts pushing into a previous test's
`actions` array. One `afterEach` removal, or a `DetachableDomEventOwner`-shaped local, closes it.

### ⚪ R-4 — Docs: the "can't do yet" section is framed as complete but omits the deferred divergences

`docs/compendium-sync.md:153-156` opens the section with "**Two things** are deliberately not
built yet. Neither is a bug… this section exists so you don't have to wonder." The two listed are
backlinks/graph and the link-style option. Not listed are the two deferred behaviours a user can
actually trip over in their own notes, both of which diverge from Reading view:

- an `scc.v1:` link inside a backtick span or a code fence **is** followed on click in Live
  Preview / Source mode, where Reading view correctly ignores it (L-1 / FOLLOWUPS #72);
- a link whose text contains nested brackets or an image silently does nothing there, where
  Reading view handles it (L-2).

Both are user-authored-note-only (0 of 37,771 compendium links), and the coordinator's ruling
explicitly routed them to FOLLOWUPS rather than to a code fix — so this is not a broken ruling.
But Scott's standing ruling quoted in the original review is *"Anything we are delaying until
after 7.0.0 needs to get clearly documented… Clarity with what works and what doesn't is
important,"* and the section's own framing invites the reader to treat it as exhaustive. One
sentence would close it; the orchestrator's call whether it is worth opening the file.

### ⚪ R-5 — A comment now describes a capability only tests use

`attachSccLinkClickHandling`'s doc comment (`sccLinkClickHandler.ts:90-93`) says "`owner` can be
the plugin itself (everything detaches at plugin unload) or a per-window owner." True of the
exported function's contract, and the test suite does pass a plain object — but after this
change nothing in `src/` passes the plugin, and `SccClickPlugin` no longer extends
`DomEventOwner`. Accurate, just no longer describing a production path. Note only.

---

## Re-review checklist (cheap, whenever this file is next open — not a fix round)

1. **R-1(ii)** — give the web-branch test a genuinely separate `Document`, so the popout claim
   is verified rather than reasoned. Highest value of the three.
2. **R-1(iii)** — reverse the declaration order in the third `Prec` test, or retitle it.
3. **R-1(i)** — drop or re-point the `defaultPrevented` assertion.
4. **R-3** — detach the leaked document delegator in the double-handling test.
5. **R-4** — orchestrator's ruling on whether L-1/L-2 get a docs sentence.
6. **R-2** — optionally delete the redundant second statelessness test; keep the first.

## Probe hygiene

Every mutation was applied to a copy-backed file and reverted immediately after its run; the
temporary probe suite (`test/dom/zz-rereview-probe.test.ts`) was deleted. `git status --short` in
the worktree is empty and `HEAD` is `be697e5`. The full battery reported above was run against
the **unmutated** tree before any probe was applied (tsc/lint/jest) and after every probe was
reverted (shots/freeze/parity).

---

# Polish round

**Applied by:** the re-reviewer, on the coordinator's ruling that all six residual findings be
closed. **Base:** `be697e5` · **Commit:** `4c53f09` · **Branch:** `sc135-links`, same worktree.
**Scope:** tests, docs and one source comment. **No behaviour changed** — the only `src/` edit is
a doc-comment rewrite.

## Per item

### R-4 — the two deferred divergences are now documented ✅

`docs/compendium-sync.md` → "What compendium links can't do yet". The section opened "**Two
things** are deliberately not built yet", which read as exhaustive; it is now "A few things", and
two user-facing bullets are added:

- a compendium link written inside a `` `code span` `` or a fenced code block is still clickable
  in Live Preview / Source mode, where Reading view correctly treats it as text;
- link text containing square brackets (`[the [big] one](scc.v1:…)`) isn't recognized while
  editing — the click just places the cursor — though it opens normally in Reading view.

Both name the view where the difference shows, say what actually happens, and note that the
compendium itself never writes either form, so it only bites hand-typed links. Plain language, no
ticket references. **Code behaviour deliberately unchanged — FOLLOWUPS #72 stands.**

Two wording corrections made while checking the new bullets against the code rather than against
the finding text: the code-span case says clicking "can still take you to the entry" rather than
naming Ctrl/Cmd, because in Live Preview with the cursor off that line `lineRevealed` is false, so
a **plain** click follows it too; and the nested-bracket case says the click "won't take you
anywhere — it just puts your cursor there" rather than "does nothing at all", because the
extension declines and normal cursor placement proceeds.

### R-1(i) — the `defaultPrevented` assertion is real now ✅

Kept, not deleted: CM6 makes the flag unfalsifiable only when read *after* dispatch. CM6 calls
`preventDefault()` on a claimed event **after** the handler returns, so the flag sampled from
inside the extension's own side effect — the action it invokes a few lines after its own
`preventDefault()` — is set by the extension and nothing else. New helper
`preventedWhenActionRan(actions, evt)` wraps `openVault` to sample it at that instant.

**Can-fail, re-verified:** delete `event.preventDefault()` from `sccLinkCm6.ts` →
`Tests: 1 failed, 16 passed`, the failure being
`… › folded link (no cursor on its line): a plain click follows it, exactly once, and consumes the event`.
Before this change the same mutation gave `17 passed`.

### R-1(ii) — popout safety is verified, not reasoned ✅

Made falsifiable rather than deleted, so **L-5's residual doubt about the web branch is now
closed by test**. Note the coordinator's suggested `document.implementation.createHTMLDocument()`
does **not** work here: that factory produces a document with no browsing context, so its
`defaultView` is `null`, `?? window` falls back to the main window, and the assertion would pass
regardless of the implementation — the same vacuity in a new shape. An **iframe**'s
`contentWindow` is a genuine distinct `Window`; probed first, and CM6 mounts into it cleanly.

`mkView` gained an optional `doc`, plus a `popoutWindow()` helper (iframes tracked and removed in
`afterEach`), `stubRects(win)` applied per realm, and `mkEvent` now builds the `MouseEvent` in the
view's own realm. The test asserts `openWeb` receives the popout's window **and** `not.toBe(window)`.

**Can-fail, re-verified:** `const win = window` in `sccLinkCm6.ts` → `Tests: 1 failed, 16 passed`
on that test. Before this change the same mutation gave `17 passed`.

### R-1(iii) — retitled to what it proves ✅

Now "declared FIRST, it also wins — the reversed registration order is a no-regression case, not
the precedence proof", with a comment saying outright that this arrangement passes on declaration
order alone and pointing at the sibling test as the real proof. Kept rather than reversed, so the
ordering matrix stays covered on both sides.

**Re-verified:** stripping `Prec.highest` still gives `Tests: 1 failed, 16 passed`, the failure
being `… › WITH Prec.highest, the real extension runs ahead of that same handler and follows the link`.

### R-3 — leaked capture listeners torn down ✅

The double-handling test's throwaway owner now records a removal per `registerDomEvent` into a
file-level `docListenerRemovals`, drained in `afterEach` before `document.body.innerHTML = ''`
(which cannot reach listeners bound to `document` itself). The ordering hazard is gone.

### R-2 — redundant regex test dropped ✅

Deleted "no state carries between calls: the FIRST link on a line is still found after a miss" —
a `/g` regex resets `lastIndex` to 0 by itself when `exec` returns `null`, so a whole-line miss
can never leave state behind, and the case passed in every arm of the original probe. The
surviving case (an early `return` mid-scan, which is what actually parks `lastIndex`) is the one
that fails when the reset is removed; the comment now records why there is one test and not two.

### R-5 — comment corrected ✅

`attachSccLinkClickHandling`'s doc comment no longer offers "the plugin itself" as an owner. It
now states that production always passes a per-window `DetachableDomEventOwner`, and that the
parameter stays the wider `DomEventOwner` only so tests can attach against a plain object.

## Gates after the polish round

Measured at `4c53f09`. **1-min loadavg 18.08 at the run** — below the contention band; neither
`views/settings-tab` nor `views/settings-preview` failed.

| Gate | `be697e5` | `4c53f09` |
|---|---|---|
| `npm run tsc` | clean, exit 0 | **clean, exit 0** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** |
| `npx jest` | 2764 passed / 1 skipped / 2765 total · 168 of 169 suites | **2763 passed / 1 skipped / 2764 total · 168 of 169 suites** · 3 snapshots · exit 0 |
| `npm run shots` | 203 / 0 FAIL | **not re-run** — see below |
| `check-freeze.sh` | `freeze OK (67/67 …)` | **not re-run** |
| `npm run parity` | 0 / 0 / 16 | **not re-run** |

**Jest delta: −1, suite count unchanged at 169** — exactly the redundant regex test deleted by
R-2, and nothing else. Accounted for: `sccLinkAtPos.test.ts` 21 → 20; `sccLinkCm6.test.ts` stays
17; `sccLinkClickHandler.test.ts` stays 24 (61 across the three, re-run on their own after the
final docs edit).

**Shots / freeze / parity were not re-run, deliberately.** The round touches two test files, one
markdown doc, and one doc-comment inside a function body — no CSS, no `styles-source.css`, no
`visual-harness/` fixture, entry point or selector map, and no rendered DOM. Nothing in the diff
can move a captured pixel or a sampled property; `git diff --stat be697e5..4c53f09` is
`docs/compendium-sync.md`, `src/refs/sccLinkClickHandler.ts`, `test/dom/sccLinkCm6.test.ts`,
`test/unit/refs/sccLinkAtPos.test.ts`. The `be697e5` values above stand.

## Net effect on the re-review's findings

| Finding | Status |
|---|---|
| R-1(i) vacuous `defaultPrevented` | **closed** — falsifiable, can-fail proven |
| R-1(ii) vacuous popout assertion | **closed** — falsifiable, can-fail proven; also closes the web-branch half of L-5 |
| R-1(iii) mistitled precedence test | **closed** — retitled, comment names the real proof |
| R-2 non-pinning regex tests | **closed** — redundant case deleted, rationale recorded |
| R-3 leaked document listeners | **closed** — `afterEach` teardown |
| R-4 docs omission | **closed** — two bullets added, no code change (FOLLOWUPS #72 stands) |
| R-5 stale comment | **closed** |

L-1, L-2, L-4 remain deferred to FOLLOWUPS #72 as ruled, and are now also documented for users.
L-5 is reduced to the CM6 *extension registration* half only (`registerEditorExtension` is
app-level, no per-window attach surface); its web-branch half is verified by test.

Worktree clean at `4c53f09`; superproject still shows the deliberate unstaged
` m draw-steel-elements` pointer.
