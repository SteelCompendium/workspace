# SC-142 phase 2a — automated docs-screenshot pipeline (report)

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc142-shots` (branch `sc142-shots`)
**Base:** dse `cbf17fa` (phase 1's landed docs)
**Commits**

- `b0e908c` feat(harness): npm run docs-shots — regenerate every docs screenshot headlessly
- `ac78c6a` docs: regenerate every screenshot from the current plugin

**Answer to Scott's question:** yes — the harness already had the machinery, and it now
covers the docs images too. Xvfb makes it **fully headless**: nothing appears on his screen,
his Obsidian can stay open, `:1` is never touched. **Nothing needs his display.**

---

## 1. Xvfb verdict: WORKS — no manual step remains

| Question | Answer |
|---|---|
| Xvfb on the system? | No — no `Xvfb`/`xvfb-run` on PATH, nothing in `/nix/store`, nothing from apt |
| Addable via devbox? | **Yes** — `xvfb` is in nixpkgs; added to **`draw-steel-elements/devbox.json`** (the repo's own devbox project, which already existed for `github-cli`/`jq`) |
| Does Obsidian run on it? | **Yes.** Electron launched on `:99`, served CDP, self-updated its asar, rendered, quit cleanly |
| Does the full docs run work? | **Yes.** 34/34 images, exit 0, no display of Scott's involved |
| Does `npm run obsidian-shots` work on it too? | **Yes** — proven on `:98` (58 captures). That was previously documented as "needs a display, skip in headless environments" |

**Why the repo's devbox and not the workspace's:** the brief scoped work to
`draw-steel-elements/`, and the plugin repo already owns a `devbox.json`. The binary
materialises at `<repo>/.devbox/nix/profile/default/bin/Xvfb`, which is exactly where the
runner looks. Resolution order is `XVFB_BIN` → `PATH` → that profile path → **run
`devbox install` itself and look again**, so a fresh clone still needs only one command.

**Setup, for the record:** `cd draw-steel-elements && devbox add xvfb` (done — `devbox.json`
+ `devbox.lock` are in commit `b0e908c`). Nothing else. Node still comes from the workspace
devbox as usual; the camera needs Node ≥ 22 for its native WebSocket, and system Node here
is 20, so keep running these through `devbox run --`.

**Option A (freeing `:1`) is NOT needed** and is now only a documented fallback, printed by
the runner if Xvfb ever goes missing:

```
1. Quit Obsidian completely (File → Quit; check the tray icon).
2. DSE_DOCS_DISPLAY=:1 DSE_DOCS_NO_XVFB=1 npm run docs-shots
```

---

## 2. The pipeline

```
npm run docs-shots                     # all 34 images (~4 min)
npm run docs-shots -- --only=hero.png  # one
npm run docs-shots -- --browser-only   # skip the Obsidian half entirely
```

Three new/changed pieces:

- **`visual-harness/docs-manifest.mjs`** — the single source of truth. One entry per file in
  `docs/Media`, plus `DOCS_MANUAL` (what is deliberately not regenerable). Adding a docs
  image = adding an entry; nothing else in the repo knows about docs images.
- **`visual-harness/docs-shots.mjs`** — the runner: browser captures, Xvfb lifecycle, the
  Obsidian child process, the orphan/manual report, the byte budget.
- **`visual-harness/obsidian-camera.mjs --docs`** — the same camera, same CDP plumbing,
  writing to `docs/Media`. Docs mode forces every existing run-flag off, so the sweep and
  the ground-truth specials are untouched (no re-indentation of any working capture).

**Sources.** `browser` = the F4 harness page (fast, deterministic, no display) for pure
element cards. `obsidian` = real Obsidian over CDP for everything that is not an element
card: `settings` (with page navigation into the 7.0.0 settings index), `modal` (real
affordance clicks, plus `pre:` clicks for controls that only exist once another has been
used), `sidebar` (through the real "Send block to sidebar" command), `canvas`, and `note`
(any body at all).

**Two deliberate properties**

1. **It writes nowhere near `visual-harness/shots/`.** The `shots` / freeze / parity gates
   cannot move when a docs image moves, and vice versa. Confirmed by the battery below:
   shots stayed 200, freeze 66/66.
2. **A docs image can show content no fixture has.** A manifest entry may carry its own note
   `body` or `canvas` JSON, written into the git-ignored `demo-vault/Harness/` under a
   `docs-` prefix. This is what makes the minion-pool modal (needs a squad), the bare power
   roll, and the character-sheet canvas capturable — *without* adding harness fixtures,
   which would have moved the shots count and required a freeze widening for a picture.

**Framing rules** (docs are a publishing surface, not review evidence): Obsidian's dark
chrome (the docs site is mkdocs-material `slate`), 12px pad, 2x capture, automatic drop to
1x above a ~900 kB byte budget. A full statblock is 3 600 CSS px tall — at 2x it is a 2.5 MB
download for a docs page.

---

## 3. Counts

| | Count |
|---|---|
| Images regenerated in place (filename unchanged) | **21** |
| New images added and wired into docs | **13** |
| **Total under automation** | **34** |
| Orphans deleted | **3** (`ability.png`, `ability-simple.png` — referenced by nothing since the phase-1 README rewrite; `compendium-download.png` — a second view of the dead pre-7.0.0 settings tab) |
| Still manual | **2** (`initiative-tracker.gif`, `negotiation.gif`) + `favicon.ico` (a brand asset, not a screenshot) |
| Images referenced by a doc but missing | **0** (checked) |
| Media files not declared by the manifest | **0** (the runner reports any, every run) |

**New images:** `hero`, `conditions`, `heroic-resource`, `surges`, `hero-tokens`
(hero-suite.md); `encounter`, `montage`, `project`, `party` (gm-trackers.md);
`settings-index`, `settings-statblock` (settings.md); `sidebar` (writing-blocks.md);
`scc-reference` (compendium-sync.md). The four pages phase 1 wrote had no images at all.

**The two GIFs** are the only thing left needing a human, and they need a *screen recorder*,
not a display — the camera writes single frames by design. Both pages already carry a static
PNG of the same subject, so the GIFs are decorative; if they ever look wrong, the honest fix
is to drop them rather than re-record. The runner names them at the end of every run.

**Honest subject changes** worth a glance in review: the canvas sheet now shows the
**read-only badges** canvas text nodes really carry (the old image predated the quarantine);
`stamina-bar.png` now uses the `recoveries` fixture, because Recoveries/Catch Breath/Winded
are what that page describes; `sample.png` is a curated three-element montage (feature +
initiative + hero) rather than the old hand-made collage — the full harness gallery is
24 000 px tall, which is review evidence, not a README hero.

---

## 4. The release story

Documented in three places, per repo convention:

- **`README.md` → Development → Screenshots**, and a new first step in the **Release**
  checklist: *"Refresh the screenshots: `npm run docs-shots`, then commit whatever changed."*
- **`visual-harness/README.md`** — a full section: how it is wired, the Xvfb story, the
  framing rules, how to add an image.
- **`CLAUDE.md`** — the agent-facing pointer (it exists, it is headless, it does not need
  `:1`, it never writes to `shots/`).
- **`CHANGELOG.md`** — one `[INTERNAL]` entry under 7.0.0.

---

## 5. Gates — full battery green

Run in the skill's order, each as the last command in its own `devbox run -- bash -c`
(no pipes):

| Gate | Result | Expected |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean |
| `npx jest` | **2686 passed / 1 skipped / 164 suites / 3 snapshots** | 2686/1/164 |
| `npm run shots` | **200, 0 FAIL** | 200 |
| `check-freeze.sh` | **`freeze OK (66/66 steel-print PNGs byte-identical)`**, exit 0 | 66/66 |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 | 0/0/16 |
| `npm run obsidian-shots` (on `:98`, virtual) | 58 ok, **1 pre-existing failure** — see below | previously "not run, no display" |

The `entry.ts` gallery change is additive (`gallery=1` behaves exactly as before), which the
unchanged shots count and byte-identical freeze confirm.

---

## 6. Findings (neither fixed here — both pre-existing, one is a product bug)

### (a) PRODUCT BUG — "Send block to sidebar" breaks any `ds-scc` block

**Impact: a user who pins a compendium-reference block to the sidebar permanently breaks
that block in their note.** `sendToSidebar` stamps a `_dse_anchor: <id>` line into the block
body so the sidebar can find it again. `ds-scc`'s body must be **exactly one SCC code** —
so the stamped block renders the plugin's own refusal card instead of the entry:

> *"This block has more than one line. `ds-scc` renders a synced-compendium entry; its body
> must be a single SCC code, e.g. `mcdm.heroes.v1/kit/panther`."*

The anchor stays in the note, so the block stays broken after the sidebar is closed.
Reproduced by the camera on a clean vault; evidence PNG:
`visual-harness/shots/scc--obsidian-sidebar-steel-dark--ERROR.png` (the sidebar panel shows
the error card, and the note body shows the stamped anchor).

This is a 7.0.0 release bug on the flagship new element, and it needs its own ticket. Likely
fixes: let `parseSccBody` tolerate/strip a `_dse_anchor:` line, or teach `sendToSidebar` to
carry the anchor outside the body for strict-body elements. Out of scope here (docs/tooling
branch, no product code touched).

**How it surfaced:** the camera's `sidebar-scc` capture was added in SC-149's fix round and
has never been run — `npm run obsidian-shots` needs a display and was skipped at the SC-149
and SC-144 landings. It failed the first time it actually ran. The capture is a true
positive; I left it failing rather than papering over it, so `npm run obsidian-shots` exits
1 until the product bug is fixed.

### (b) HARNESS BUG — fixed here

The Obsidian sweep selected `[data-dse-element="scc"]` for the scc note, but `ds-scc`
re-stamps the resolved family onto the root (`kit`), so it could never match — both scc
combos had been failing since SC-149. Fixed with the same id→element mapping the sidebar
list already carried. Proven pre-existing by re-running the failure with my camera changes
stashed.

---

## 7. Concerns

1. **The `ds-scc` sidebar bug above** is the real finding of this phase, and it is
   user-facing. It should be triaged before 7.0.0 ships.
2. **`npm run obsidian-shots` now exits 1** for that one capture. That is a correct gate
   result, but anyone running the battery will see red — it needs to be a known-expected
   failure until the bug is fixed.
3. **Determinism is partial by nature.** Browser captures are deterministic; Obsidian
   captures come from a real, self-updating app and vary by a few pixels. That is why docs
   images are not frozen and must not be — review the diff by eye, not by hash.
4. **The canvas doc's claim vs. reality.** `docs/canvas-character-sheet.md` sells canvas as a
   "flexible and robust character sheet", but canvas text nodes are read-only, which the
   regenerated image now shows plainly. The prose deserves a sentence saying so — a small
   phase-1-style docs edit I did not make here.
5. **~4 minutes per full run**, most of it Obsidian's start-up and the per-capture settles.
   `--browser-only` is seconds, and `--only=` is the fast path when iterating on one image.
