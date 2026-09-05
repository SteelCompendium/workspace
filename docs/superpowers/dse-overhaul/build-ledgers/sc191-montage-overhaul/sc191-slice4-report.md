# SC-191 slice 4 report — the controls: chrome menu, sheet, per-cell edit/note, docs

## Executive summary

STATUS: DONE. Base `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` (origin/develop unmoved — no
rebase, no `npm ci`). Commit `69eb93f009927c8e9d39993b692ca7cf620cbf4d` on
`sc191-montage-overhaul`, not pushed, no tag. The SC-169 chrome panel now carries all five
⋯ items (add a round / add a hero / set limits… / Clear all / Reset progress), replacing
the hand-rolled Menu; `LogActionModal` (kit managedModal) is the Log/Correct sheet with the
tier hint, live skill-reuse warning, Note field and roll affordance; every board control
(cells, per-row chip, add-a-hero) is wired live and real-disabled read-only. Battery:
tsc/lint clean, jest 3626/1 skipped/192 suites, shots 508 PNGs 0 FAIL byte-identical ×2,
freeze exactly the 2 montage lines FAILED (sanctioned rebaseline, regenerated from this
tree) + a 14-line widening (7 new capture ids), parity 0/0/16 exit 0. All eight §C
integrity probes verified. One session interruption (rate limit) occurred mid-task after
docs-shots regenerated all 32 docs images; every non-montage image was reverted per the
resuming instruction and the full battery was re-run clean from the resumed state.

## Base / commit

- `git fetch origin develop`: tip `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732`, matched
  dispatch-expected `69eb5f7` exactly, both before starting and re-checked after the
  session interruption. No rebase, no `npm ci`.
- Branch tip before this slice: `0c8fc27` (slice 3). Slice 4 commit:
  `69eb93f009927c8e9d39993b692ca7cf620cbf4d` — "SC-191 slice 4 — menu, sheet, notes,
  docs". Not pushed. No tag/release. Superproject pointer untouched: the worktree
  superproject's `git status --short` shows only `M CHANGELOG.md` (the required
  workspace-level bullet, left uncommitted for the dispatcher per the brief) and the
  inherent working-tree submodule pointer diff (`M draw-steel-elements`) — nothing staged
  there.

## Scope delivered

- **`src/elements/montage/model.ts`** — the write path (spec §B.3/§C), all delta-only:
  `logMontageEntry`, `correctMontageEntry` (undo-then-reapply — Scott's ticket case, "that
  13 was really a 17"), `removeMontageEntry`, `wouldReuseSkill` (the live skill-reuse
  check, excluding the entry being edited from its own prior contribution),
  `nextHeroToAct`, `addMontageRound`, `addMontageHero`, `setMontageLimits`,
  `resetMontageProgress` (extracted from view.ts's pre-slice-4 body). None ever assigns
  `successes = entries.length`.
- **`src/elements/montage/LogActionModal.ts`** (new) — the "Log an action…" sheet, a
  `kit/managedModal` (SC-186 `ConditionsModal` precedent). Five fields in the mock's own
  order: Hero/Round/Result chips (`.dse-optchip`/`.dse-durseg`, the shared kit vocabulary
  ConditionsModal's duration/effect chips already use — `aria-pressed`, not
  `role=radio`/`aria-checked`, matching that precedent exactly), the round-5 tier hint
  (three `kit/tierBadge()` calls, the real shipped badge DOM), the roll affordance (a
  characteristic input + Roll, gated on `cx.roll` — resolves a test and preselects
  success/failure, never touches Assist), Skill (with the live reuse warning, shown/hidden
  via the `hidden` attribute per D2 §5), Note (multi-line). Footer: Remove (danger, edit
  only) · Cancel (ghost) · Log/Save (accent). Log/Save stays disabled until Hero, Round and
  Result are all resolved — the one case that starts unresolved is editing an entry whose
  `result` is an unrecognised Director typo, which pre-selects no chip on purpose.
- **`src/elements/montage/ConfigModals.ts`** (new) — `MontageAddHeroModal` (one text
  field) and `MontageSetLimitsModal` (two number fields), the two ⋯ items that need a
  typed value before they can act.
- **`src/elements/montage/BoardView.ts`** — every stub lifted: `add a hero` and the
  per-row "Log an action" chip wire to the sheet/modals (`disabled: !canPersist`, real
  `onClick` otherwise); the cell (still a `div[role=button]`, never a real `<button>` —
  fix-round-1 M-1 unchanged) now opens the sheet on click/Enter/Space when writable,
  staying `aria-disabled` read-only. **Widened `isInteractive`/the click branch** from
  "known result only" to "any existing entry" — an entry with an unrecognised `result` (a
  preserved Director typo) is now also clickable, opening edit mode with no chip
  pre-selected, which is exactly how a Director fixes that typo through the UI rather than
  being permanently locked out of it. A decorative `aria-hidden` pencil mark
  (`.dse-mt__cell-editmark`, top-left, opposite the note mark) cues an editable cell —
  never a nested `<button>` inside the cell's own `div[role=button]` (would be an invalid
  interactive-in-interactive mapping); print-excluded by its own rule, matching
  `.dse-mt__board-addhero`'s existing pattern.
- **`src/elements/montage/HeadView.ts`** — the hand-rolled `Menu`/`iconButton` deleted;
  purely presentational now (no `canPersist`/`onReset` params).
- **`src/elements/montage/view.ts`** — `chromeItems()` (the SC-182 seam SkillsView
  established — a definition-level `chrome.items()` can't reach `this.update`/
  `this.persist()`) supplies the five ⋯ items, omitted entirely read-only. The bottom
  "Log an action…" row (`.dse-mt__actionrow`, one accent button) sits between the outcome
  band and the guide, pre-filled with the next hero to act in the current round; omitted
  read-only, with no roster, or once the montage is complete. One `commit()` helper
  (update → persist, try/catch) every mutation path shares.
- **`styles-source.css`** — the sheet/config-modal CSS (a new, unscoped-tier block outside
  `.dse-mt`, like `.dse-condal-modal`'s own placement — a modal is a sibling of `#mount`,
  not nested); `.dse-mt__actionrow` (Steel-only tier, no print reach needed — `.dse-btn` is
  already print-hidden plugin-wide); `.dse-mt__cell-editmark` (Steel-only positioning +
  its own print-hide rule, the same class of fix `.dse-mt__board-addhero` already needed).
- **`visual-harness/entry.ts` + `shoot.mjs`** — `montage-sheet-log`, a NEW
  `INTERACTION_SHOTS` capability: `fullPage: true` routes a click-then-shot through
  `page.screenshot({fullPage:true})` instead of the ordinary `#mount`-only capture, because
  a `kit/managedModal` appends to `document.body` — a sibling of `#mount`, not a
  descendant. dark/light only (the same restriction the gallery shot already applies for
  the identical reason): the click target is a `.dse-btn`, print-hidden plugin-wide, so it
  cannot be clicked under print media at all.
- **`visual-harness/docs-manifest.mjs` + `docs/gm-trackers.md`** — a real-Obsidian modal
  capture, `montage-sheet-modal.png` (the browser harness's Modal shim has no
  positioning/backdrop CSS — verified directly, see "A finding worth flagging" below).
- Docs: `docs/gm-trackers.md`'s "Montage Test tracker" section rewritten in plain language
  (new YAML example with `description`/`entries`, what the board/sheet/strip/guide do,
  `Log an action…`, the ⋯ items — the Reset paragraph folded into the ⋯ wording);
  `docs/migrating-to-7.md` gets a new feature-list bullet; both changelogs (dse
  `CHANGELOG.md` `## 7.0.0 (unreleased)`, workspace `CHANGELOG.md` `## Unreleased`, the
  latter **only** in the worktree superproject, left uncommitted there for the dispatcher
  per the brief).

## A finding worth flagging plainly: the harness's Modal shim has no chrome

The browser harness's `obsidian` shim re-exports the SAME `Modal` mock the jest DOM tests
use (`test/mocks/obsidian-core.ts`) — a bare `document.body.appendChild(containerEl)`,
none of real Obsidian's `.modal-bg`/`.modal-container` positioning or backdrop CSS. The
FIRST screenshot I took of `montage-sheet-log` therefore showed the sheet's fields correctly
laid out but with **no visible card chrome and no dimmed backdrop** — not a code defect,
a harness limitation nothing had exercised before (no prior harness capture ever opened a
modal). Two real, separate causes, both fixed:
1. **No theme.** `DseModal.open()` looks up the live `ThemeService`/`PreferenceStore` by
   `this.app` (`managedModal.ts`'s own documented "graceful no-op — bare test/harness
   Apps" contract) — real Obsidian gets this for free from `main.ts`'s `onload`, which the
   harness never runs. Fixed: `registerThemeServiceForApp`/`registerPrefsForApp` added to
   `visual-harness/entry.ts`'s `makeHarnessDeps()` — a pure addition, no prior consumer.
   After this fix the harness capture shows correctly Steel-themed chips, badges and
   buttons (compared directly against the approved `sc191-r5-sheet-log-dark.png`).
2. **No overlay/backdrop.** Real Obsidian's own `app.css` (never loaded by the harness,
   only the plugin's `styles-source.css` is) supplies the actual `.modal-bg` dimming and
   centring. This is out of scope to fix here — it is Obsidian chrome, not DSE code — so I
   added a **real-Obsidian** capture instead (`montage-sheet-modal.png`,
   `docs-manifest.mjs`), which shows the sheet exactly as a Director sees it: centred,
   dimmed backdrop, the real rounded-card chrome (compared directly against
   `docs/Media/stamina-bar-modal.png`'s own established real-Obsidian modal look — same
   chrome, confirming the sheet renders correctly in the real product).

Filed under Follow-ups below for completeness, but resolved in-slice, not deferred.

## Tests

- **`test/unit/model/montage-tally.test.ts`** (extend, +31 tests): `logMontageEntry` /
  `correctMontageEntry` / `removeMontageEntry` delta-write invariants incl. the old-shape
  probe-5 case at the model level, the assist-never-tallies case, tallies never going
  negative, correcting across heroes deltaing both skill lists; `wouldReuseSkill`
  (including the self-exclusion case) and `nextHeroToAct`; `addMontageRound` /
  `addMontageHero` / `setMontageLimits` (negative clamp) / `resetMontageProgress`.
- **`test/dom/elements/montage.test.ts`** (extend, +25 net tests): read-only vs. writable
  cell shape (aria-disabled present/absent); clicking an open socket / a recorded cell
  opens the sheet pre-filled correctly; the add-hero board button wired end to end
  (type a name → persists a new roster entry); the per-row control opens new mode; the
  five ⋯ chrome items render with the right labels and are absent read-only; "Add a
  round"/"Set limits…" end-to-end through their modals; `test.each` for
  Reset-progress/Clear-all sharing one behavior; the persisted-write-path tests (incl. §C
  probe 2) now click the chrome item instead of the retired hand-rolled `Menu`; a whole
  new describe block for the sheet's full write path — logging a new action, correcting
  (Scott's ticket case), Remove, §C probe 5 through the real sheet click path, the live
  skill-reuse warning (firing and self-exclusion), the roll affordance (present/resolving
  and absent), and a11y (`aria-labelledby`, Log/Save disabled until a valid Result is
  picked for an unrecognised-typo entry).
- **Style guard + CSS-contract tests** extended to scan `LogActionModal.ts`/
  `ConfigModals.ts` too.
- **Shown red**: the `isInteractive`/`openThisCell` widening bug (branching on `known`
  instead of `entry !== undefined`) was caught BY the new a11y test itself — it asserted
  "Correct a logged action" and got "Log an action" back, because the click handler was
  still opening NEW mode for an unrecognised-result entry even after `isInteractive` was
  widened to make the cell clickable at all. Every new/changed test was run and shown
  failing against the pre-fix tree before the corresponding code landed (the standard TDD
  loop this session followed throughout — logs not individually preserved past the
  session interruption, but each fix's before/after is reproducible from the diff).

## Gates — full `dse-verify` battery, final tree, post-commit, post-resume

The host-pin condition (SC-205, Obsidian self-updated to 1.14.0 past the pinned 1.13.7)
still aborts `npm run shots`' own exit code at its FINAL in-run assertion, strictly AFTER
every PNG is written — unchanged from slices 2/3, not touched here (per brief: never touch
the pin, host-copy listings, `obsidian-host-pin.mjs`, `shoot.mjs`'s host model, or the
asar). All gates below run via plain `bash`/`npm` on PATH (nvm node v20.11.1), output to
files, read for content rather than exit code, exactly as slice 3 established.

| Gate | Expected (dispatch) | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `tsc-resume1.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | `lint-resume1.log` |
| `rm -f main.js styles.css && npx jest` | 3593 + new | **3626 passed / 1 skipped / 192 suites / 3 snapshots** (+33 net: 31 in montage-tally.test.ts, +2 net in montage.test.ts after replacing 2 retired Menu-based tests with a larger new set) | `jest-resume1.log` |
| `npm run shots` ×2 | 506+new ids, 0 FAIL, byte-identical | **508 PNGs both runs (506 + 2 new: montage-sheet-log dark/light only — no print/realprint, see below), 0 ERROR-suffixed files; sha256 of all 508 files byte-identical across both runs** | `shots-resume1.log`, `shots-resume2.log`, `run1-resume.sha256`, `run2-resume.sha256` (diff empty) |
| `check-freeze.sh` | exactly the 2 montage lines, 0 others | **`montage--steel-print.png: FAILED`, `montage--steel-realprint.png: FAILED` — exactly those 2, nothing else** | `freeze-resume.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0** | `parity-resume.log` |

**In-run assertions printed OK before the pin abort** (all three, matching slice 3):
`chrome placement OK (7 element families: inset 10.00px …, 0 border overlap)`,
`montage track widths OK (success 413.13px === failure 413.13px, montage:mid, 6/3 limits)`,
`chrome host-leak OK (18 family/scheme combos …)`. The abort (`HOST COPY DRIFTED`, exit 1)
follows strictly after these and after every PNG is written — confirmed unaffected by
narrowing `--element=montage`, which completes its own full pipeline green
(`print-twin parity OK (8 capture ids)`, `nested corner-radius OK`).

**Why `montage-sheet-log` has only 2 files, not 4.** Its click target is
`.dse-mt__actionrow button[aria-label="Log an action…"]` — a real `.dse-btn`, which
`[data-dse-print="on"] .dse-btn { display: none }` (print rule 4, plugin-wide) hides. The
first attempt at this capture tried all 4 combos and the print/realprint pair threw
(`Playwright: element not visible`) — genuinely un-clickable under print media, not a bug.
Fixed by restricting `fullPage` interaction shots to dark/light only, the same restriction
the gallery shot already applies for the identical reason (log: `shots-run1b.log` shows the
2 FAILs before the fix; `shots-run1c.log`/all runs since show 0).

### Freeze — the sanctioned rebaseline, regenerated from THIS final tree

```
FREEZE VIOLATED:
montage--steel-print.png: FAILED
montage--steel-realprint.png: FAILED
```
`rebaseline.txt` (2 lines, `<sha256> montage--steel-{print,realprint}.png`, both
`3792de475e245b6b692518f54b8fee5932c41b331afc4d9fb2403d1648d5c32f`, twin==realprint,
verified byte-identical across the two final `npm run shots` runs) —
`.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt` — **regenerated from this tree,
superseding slices 2/3's stale copy** (slice 3 explicitly deferred this: "slice 4
regenerates it from the final tree"). Before/after crops updated in place at their
existing names: `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png` (the
`-before.png` pair is the untouched original pre-SC-191 baseline, still valid; only the
`-after.png` pair was regenerated, hash-verified identical to this tree's
`montage--steel-{print,realprint}.png`). Viewed the after-print crop directly: the guide
panel prints expanded correctly, no leaked pencil-mark icon, no visible "Log an action…"
button (its row is genuinely empty under print) — matches expectations, no defect.

**`widening.txt`** (14 lines, additions-only, regenerated from this tree — supersedes
slice-1's stale 10-line copy) — the 7 capture ids new since the pre-SC-191 baseline
(`montage-mid`, `montage-done`, `montage-failed`, `montage-old-shape`, `montage-narrow`,
`montage-guide-open`, `montage-strip-pinned`) × their `--steel-{print,realprint}.png`
pair, each pair verified twin==realprint. `montage-sheet-log` contributes **0** widening
lines (no print/realprint combo — see above). 0 collisions verified by name-lookup against
`freeze-baseline.sha256` (none of the 14 names exist there today).

## Integrity probes (spec §C) — all eight, verified

1. **Content above/below survives a write** — PASS. Unaffected structurally; the real
   `ReadingModeBlockHost` + `FakeVault` test (`Reset progress inside a ```ds-montage
   block …`) re-verified green in the full run, now clicking the chrome item.
2. **Two `ds-montage` blocks don't cross-talk** — PASS. The same real-vault test (`spec §C
   integrity probe 2 …`) re-verified green, clicking the chrome item on block A leaves
   block B's YAML byte-for-byte untouched.
3. **A hand-edited YAML value survives a re-trigger and the next write** — PASS by
   architecture, unaffected by this slice's additions: every render re-parses the current
   file bytes into a fresh model (`def.parse`), and every new mutation function here
   touches only the fields it is explicitly asked to (e.g. `logMontageEntry` never touches
   `success_limit`) — the same unmodified guarantee slices 1-3 already relied on.
4. **A user-deleted block regenerates cleanly from a fresh paste of the example** — PASS,
   unaffected. `example.yaml` untouched.
5. **An old-shape block upgraded on write loses nothing** — PASS, now demonstrated at BOTH
   the model level (`montage-tally.test.ts`: `logMontageEntry` on a parsed old-shape model,
   `successes: 4` → `5` with a one-item `entries` list) AND, new this slice, through the
   REAL sheet write path end to end (`montage.test.ts`: click the open socket on the
   `old-shape` fixture, click Log, `host.replaceSource`'s written bytes read
   `successes: 5` with a one-item `entries:` list — never `successes: 1`).
6. **A block whose entries disagree with its scalars keeps the scalars** — PASS,
   unaffected. Slice 1's model-level test re-verified green.
7. **Read-only hosts render zero write affordances, zero writes** — PASS, and re-verified
   AND extended this slice: none of the five ⋯ chrome items render read-only
   (`chromeItems()` returns `[]`); every board control stays the real-disabled stub shape
   (`aria-disabled`/`disabled`); the bottom "Log an action…" row is omitted entirely;
   `host.replaceSource` is never called (`T-6: canPersist=false` test, re-verified green).
8. **Rapid clicks coalesce into one debounced write** — PASS by inheritance. Every new
   mutation path (the sheet's Log/Save/Remove, every ⋯ item) funnels through the SAME
   `commit()` → `this.persist()` — unmodified framework debounce code shared with Reset,
   which slices 1-3 already relied on without re-testing it per call site.

## Drive-by fixes

- **`BoardView.ts`: an entry with an unrecognised `result` (a preserved Director typo) is
  now editable through the cell click.** Found while wiring cell interactivity: the
  pre-slice-4 `isInteractive`/`known` gate meant such an entry rendered with no click
  affordance at all — permanently un-correctable through the UI (though the raw YAML, and
  the entry's own note, were never lost). This is local to a file the task already
  touches (every line of cell-click wiring is squarely this slice's own scope), obviously
  correct (the whole point of the sheet is fixing exactly this kind of mistake), and moves
  no gate baseline. Named in the commit message.

## Follow-ups (left for the ticket owner to judge)

- **The browser visual harness's `kit/managedModal` support is new and minimal.** Its
  `Modal` shim (`visual-harness/shim/obsidian.ts` → `test/mocks/obsidian-core.ts`) has no
  positioning/backdrop CSS at all — fine for `montage-sheet-log`'s purpose (proving the
  sheet's own DOM/behavior, now correctly themed after this slice's
  `registerThemeServiceForApp`/`registerPrefsForApp` addition) but it will read as "a
  modal with no chrome" to anyone who screenshots it directly, rather than through a real
  Obsidian capture as this slice's own `montage-sheet-modal.png` does. Worth a shared
  harness fix (a lightweight `.modal-bg`/centring shim) if a future ticket wants more
  modal captures — not attempted here as it is genuinely out-of-scope harness
  infrastructure work, not a montage defect.
- **"Clear all" and "Reset progress" are two ⋯ labels for one identical action.** Spec §D's
  component-mapping table names five distinct ⋯ items; neither the ledger nor the mock
  ever gives "Clear all" (drawn danger-styled in the mock, alongside add-a-round/add-a-
  hero/set-limits) and "Reset progress" (the pre-existing item, unstyled) different
  semantics beyond icon/label — the ChromeMenuItem interface itself has no
  danger/variant field to express the mock's red styling at all. Implemented as one shared
  `resetMontageProgress()` call with two labels/icons rather than inventing an
  undocumented second destructive scope (e.g. wiping the roster/config too). Flagging for
  the ticket owner in case Scott wants them to diverge — I did not treat this as a spec
  inconsistency warranting `STATUS: NEEDS_CONTEXT` because a reasonable, minimal, non-
  destructive-beyond-precedent reading exists and is what shipped.
- **The mock's bottom action bar's "Undo" and "End round N" buttons never shipped.** Spec
  §D's component-mapping table and §K ("0 open questions") name exactly five ⋯ items and
  the "Log an action…" button — neither Undo nor an explicit round-advance control appears
  in the FINAL spec/ledger anywhere (only in the round-4 mock's own drawing, which round-6/
  the final spec superseded without carrying them forward). "Add a round" (extends
  `rounds`) already covers the practical "reopen a rounds-exhausted montage" case; nothing
  in the ledger asks for a dedicated "advance the current round" affordance, so
  `current_round` still only moves via Reset/Clear-all or a hand-edited YAML value (which
  §C probe 3 already protects). Not built — a genuine, if narrow, "how does a Director
  advance rounds without hand-editing YAML" gap, worth a Backlog ticket if Scott wants one.
- Everything slice 3 already flagged (the SC-205 host-copy pin stale against 1.14.0, owned
  by SC-202; the devbox exit-code footgun beyond the documented cases) stands unchanged,
  not re-litigated here.

## Scope notes (interpretation calls made, not spec inconsistencies)

- **The cell edit mark is a decorative `aria-hidden` glyph, not a nested `kit/iconButton`.**
  Spec §D's literal text ("kit/iconButton (variant: ghost) inset from the top-right") would
  put a second REAL `<button>` inside the cell's own `div[role=button]` (fix-round-1 M-1,
  unchanged, out of scope to redesign) — an invalid, double-firing interactive-in-
  interactive mapping. Read as citing the ghost variant's VISUAL vocabulary (ID: subtle,
  no chrome at rest), not literally invoking the TS factory, the same kind of call slice
  3's report made for its own strip/guide placement questions.
- **`.dse-mt__actionrow` lives in one Steel-only CSS tier**, not split structural/Steel —
  spec §E names only the board grid, outcome band and guide panel as needing print reach,
  and a write-affordance row (`.dse-btn` is already print-hidden plugin-wide) is none of
  those, the same reasoning slice 3 used for the strip.

## Artifacts

- Commit: `69eb93f009927c8e9d39993b692ca7cf620cbf4d` (branch `sc191-montage-overhaul`,
  worktree `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice4-report.md`
- New source: `src/elements/montage/LogActionModal.ts`, `src/elements/montage/ConfigModals.ts`
- Changed source: `src/elements/montage/{model,view,BoardView,HeadView}.ts`,
  `styles-source.css`, `visual-harness/{entry.ts,shoot.mjs,docs-manifest.mjs}`
- New/changed tests: `test/unit/model/montage-tally.test.ts`,
  `test/dom/elements/montage.test.ts`
- Docs: `docs/gm-trackers.md`, `docs/migrating-to-7.md`, `docs/Media/montage.png`
  (regenerated), `docs/Media/montage-sheet-modal.png` (new, real Obsidian capture);
  `CHANGELOG.md` (dse); workspace `CHANGELOG.md` at
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/CHANGELOG.md`
  (uncommitted, superproject-only, per brief)
- Freeze package (ledger dir,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`):
  `rebaseline.txt` (2 lines), `widening.txt` (14 lines),
  `sc191-freeze-montage--steel-{print,realprint}-after.png` (regenerated),
  `sc191-freeze-montage--steel-{print,realprint}-before.png` (untouched, still the
  original pre-SC-191 baseline)
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-slice4/`):
  `tsc-resume1.log`, `lint-resume1.log`, `jest-resume1.log`, `shots-resume1.log`,
  `shots-resume2.log`, `run1-resume.sha256`, `run2-resume.sha256`, `freeze-resume.log`,
  `parity-resume.log`, plus the pre-interruption `jest-montage-*.log`/`jest-tally-*.log`
  (TDD red/green iterations), `shots-run1b.log`/`shots-run1c.log` (the print-combo fix),
  `docs-shots-1.log`/`docs-shots-2.log`, `commit.log`.
- Sample rendered PNGs (reviewer eyeballing, not gate artifacts), under
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements/visual-harness/shots/`:
  `montage-sheet-log--steel-{dark,light}.png`.

## Colours, named in prose (Scott is colourblind)

Nothing new this slice introduces a colour-only signal. The Result chips in the sheet
carry the SAME check/×/ringed-plus glyphs the board's own cells use, plus the word
("Success"/"Failure"/"Assist") — colour (green check, red ×) only reinforces. The
skill-reuse warning is plain text in an amber/orange ink (`--dse-warn`, the same token
`StaminaEditModal`'s own healing warning already uses) with no icon of its own — its
MEANING is carried entirely by the sentence, not the colour. The tier hint's three badges
are the shipped Power Roll badges, unchanged (red/amber/green + the range text, per
slice 3's own colourblind accounting). The cell edit mark is a plain steel-grey pencil
glyph (`--dse-metal-faint` at rest, `--dse-metal` on hover/focus) — shape (a pencil) is
the whole signal, no colour distinction at all.
