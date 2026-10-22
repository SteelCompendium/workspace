# SC-356 round 2 — independent review report

**Executive summary**
- VERDICT: **LAND-READY.** No CRITICAL, HIGH or MED findings. 3 LOW (comment/doc accuracy, `display: flex` vs Obsidian's `inline-flex`, registry regex reach) and 4 INFO (rebase/merge notes, allowlist granularity).
- Reviewed dse `b01268c` on `772c3cd` (4 commits: 3569f23, 5cc0ebb, 1ae02f1, b01268c) and superproject doc commit `db07e0a` on `27ed1bf`. Tree clean before and after; dse clone still on branch `sc356-hostleak-modal-buttons`.
- Full battery re-run by me after the 429 kill, using fresh log names: tsc/lint clean · jest 5541 / 1 skipped / 233 of 234 · lifecycle 31/31 · e2e 89/93, 0 failed, 4 known-bug, 64/64 (COND-E02..E06 ok) · shots 580, 0 FAIL, gallery 112/672 and modal 36 kinds/216 OK · freeze 280/280 · parity 0/0/24.
- The modal pass is live. A host-only `button { letter-spacing }` gave 354 FAIL lines across every modal, state, scheme and pressed/idle kind. Dropping the pinned chip fill gave 32 backgroundColor FAILs. An unopenable modal, a wrong modal title and an unregistered Modal subclass each FAIL loudly.
- A30 holds: under Obsidian 1.14.4's real app.css, every chip kind, idle and pressed, dark and light, is 30px tall on desktop. Fill is rgb(26,30,33)/rgb(246,248,248) and idle ink is rgba(220,226,230,.62)/rgb(85,89,96). Pressed ink and the teal outline are byte-identical to base, and labels are centred exactly as at base. Under `.is-mobile` the chips are **44px** (= `--touch-size-m`, = a plain host button), so they follow Obsidian's control height. The "40px" in the ask only applies to `.is-mobile .menu`.
- Scope fence holds: shoot.mjs edits are confined to tagButtons, the host-leak sweep helpers, the modal pass and one call line. A trial merge of b01268c with dse origin/develop (now `95981f1`, which includes SC-422 `8d075db`) has 0 conflicts.

## Gates (b01268c, run 2026-10-21 ~22:23–23:10Z, all from fresh per-run logs after the kill)
| gate | verbatim |
|---|---|
| tsc (incl. e2e) | `tsc --noEmit && tsc --noEmit -p e2e` — rc=0, no output |
| lint (incl. e2e) | `eslint src main.ts e2e` — rc=0 (only the pre-existing `.eslintignore` ESLintIgnoreWarning) |
| jest | `Test Suites: 1 skipped, 233 passed, 233 of 234 total` / `Tests:       1 skipped, 5541 passed, 5542 total` (rc=0) |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` (rc=0, port 9387) |
| e2e | `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` (rc=0); COND-E02, E03, E04, E05 and E06 each `ok` |
| shots | rc=0, 580 PNGs, 0 FAIL; `host-copy pin OK (… the host model is verbatim Obsidian 1.14.4 …)`; `button host-leak OK (112 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 672 comparisons …)` with a 10-record boundary (8× focus-visible: disabled, 2× hover: no hit point); `modal button host-leak OK (9 modal scenarios over 8 modal classes, 36 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 216 comparisons …)` / `100 property difference(s) ALLOWLISTED as known leaks owned by another ticket (SC-361: .dse-swatch, 10 properties)` / `not openable in the harness (3 …): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal` / `6× focus-visible: disabled` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` (rc=0) |
| parity | `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**` (rc=0; run last, after the probes were restored) |

## Probes (all uncommitted; the scratch shoot copy `visual-harness/_rv356_scratch.mjs` was deleted after each run, and `styles-source.css` was restored with `git checkout`)
1. **Control:** the unmodified modal pass alone printed `modal button host-leak OK (… 216 comparisons …)`, rc=0.
2. **Host-only leak** (`button { letter-spacing: 0.3px }` prepended to `OBSIDIAN_HOST_BUTTON_CSS` in the scratch copy only): rc=1, 354 lines. All 9 scenarios failed, in rest/hover/focus-visible (72 lines each) × dark/light. Each chip kind produced 12 lines (pressed + idle × 3 states × 2 schemes), so the `aria-pressed` key separates them. The swatch's `letterSpacing` was NOT swallowed by the SC-361 allowlist, as expected because the property is not on the entry.
3. **Plugin-side regression** (removed the SC-356 `:where(.dse-optchip:not(:hover))` fill rule, then rebuilt the harness): rc=1, 32 lines, all `backgroundColor`, e.g. `dark|ConditionsModal|rest|modal:(none)|dse-optchip|aria-pressed:false: Obsidian's \`button\` rules change backgroundColor — "rgb(26, 30, 33)" without the host, "rgb(51, 51, 51)" with it`. 32 = 8 chip kinds × rest + focus-visible × 2 schemes. Hover correctly does not fire, because the chip's own `:hover` rule owns the fill. Restored.
4. **Modal fails to open** (Conditions trigger selector broken): rc=1, `dark|ConditionsModal: the modal could not be opened (TimeoutError: page.click: Timeout 3000ms exceeded.) — the check would be blind`, and the same line for light.
5. **Wrong modal:** rc=1, `opened a modal titled "Conditions", expected /^Not The Conditions Modal$/ — the check would be sweeping the wrong modal`.
6. **Registry:** with the ResetEncounterModal scenario removed, rc=1, `ResetEncounterModal (src/views/ResetEncounterModal.ts) is a Modal subclass that is neither swept … nor declared …`.
7. **Coverage:** my own grep of `src/` + `main.ts` finds 12 Modal classes: DseModal (base), 8 swept (Conditions, LogAction, MontageAddHero, MontageSetLimits, StaminaEdit, MinionStaminaPool, ResetEncounter, FormModal) and 3 declared unreachable (CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal). This matches the implementer's list. There are no inline `new Modal(` uses and no second-level subclasses. Hover and focus-visible are really driven: `readOneTagged` sets `rec.active = n.matches(':hover' | ':focus-visible')`, and `probeButtonsInState` fails any record that is neither active nor provably blocked.
8. **A30 fidelity, measured independently** (Playwright on the built harness, opening the Conditions editor and the Log-action form under the REAL app.css). I swapped in the installed **1.14.4 asar's app.css**, extracted to scratch. I measured final CSS, the same page with `is-mobile is-phone` on body, and base, where the base look is the three SC-356 rules deleted via CSSOM (3 removed per page):

| kind | desktop h (final / base) | phone h | fill final dark / light | idle ink final dark / light | base fill / idle ink | pressed ink (final = base) | pressed border (final = base) | label offset dx/dy px (final = base) |
|---|---|---|---|---|---|---|---|---|
| `.dse-optchip` (duration/effect) | 30 / 30 | 44 | rgb(26,30,33) / rgb(246,248,248) | rgba(220,226,230,.62) / rgb(85,89,96) | rgb(51,51,51)\|rgb(255,255,255) / rgb(218,218,218)\|rgb(34,34,34) | rgba(220,226,230,.88) / rgb(44,46,48) | rgb(77,184,199) / rgb(42,123,136) + bevel + sheen | 0 / −0.41 |
| `.dse-cond-icons__choice` | 30 / 30 | 44 | same | same | same | same | same | 0 / −0.01 |
| `.dse-mt__sheet-resultchip` | 30 / 30 | 44 | same | same | same | same | same | 0 / −0.01 |

   With the phone classes on, `--input-height` = 44px and a plain host `<button>` = 44px. In the 1.14.4 app.css: `body { --input-height: 30px; --touch-size-m: 44px }`, `.is-mobile { --input-height: var(--touch-size-m) }`, `.is-mobile .menu { --input-height: 40px }` (menus only), and `button { display: inline-flex; height: var(--input-height) }`. The final metrics under the harness-pinned 1.13.7 app.css are identical (24/24 records). The implementer's real-Obsidian camera numbers (evidence-r2/cam-final.log) agree with every cell.
9. **Negotiation chips** (`.dse-optchip.dse-nt__chip` render in a NOTE, and the new `[data-dse-element]` anchor reaches them): I compared computed height, min-height, display, justify, align, fill, ink and box size with and without the SC-356 rules for fixtures default/checked/ended × dark/light. 30 chips, **0 differ**. The `.dse-nt__chip` rules (0,3,0) win.

## Findings

**LOW-1 — the comments and the skill doc say the option chip is modal-only, but it is also an in-note chip.**
- `styles-source.css:17176` ("They are bare `<button>`s that only exist inside a MODAL") and the pre-existing dse-verify SKILL.md bullet (worktree `.claude/skills/dse-verify/SKILL.md:194`, "`.dse-optchip` is modal-only and never mounts there") are both wrong. `.dse-optchip` is also on the negotiation element's `.dse-nt__chip` (`src/drawSteelAdmonition/negotiation/ArgumentView.ts:155`, `MotivationsPitfallsView.ts:79`), and the gallery sweep does mount those.
- Failure scenario: the new block's `:is([data-dse-element], .dse-modal)` anchor reaches the negotiation chips. Only `.dse-nt__chip`'s (0,3,0) restatement keeps them unchanged (probe 9: 0 diffs today). A future edit that lowers that rule's specificity, or drops its `height: auto` / `justify-content: flex-start` / `color`, would silently give the in-note chips a 30px fixed height, centred labels and muted ink. Nothing pins this: the gallery sweep is host-invariant either way, and freeze is print-only.
- Fix: correct both texts. Either scope the block to `.dse-modal` only (the chips it is for are all modal-only), or add a jsdom assertion that `.dse-nt__chip` restates height, display, justify-content, color and background at higher specificity than the SC-356 block.

**LOW-2 — `display: flex` is not Obsidian's value.**
- `styles-source.css:17197`. The comment says "`display: flex` + centred alignment are Obsidian's own values for a button". In Obsidian 1.14.4 the `button` rule is `display: inline-flex`. The block also overrides the icon choice's own `.dse-modal .dse-cond-icons__choice { display: inline-flex }` (`styles-source.css:~2149`; same (0,2,0), later in source).
- No pixel change today: every chip's parent (`.dse-durseg`, `.dse-cond-icons__grid`) is a flex container, so inline-flex blockifies to flex. The probe reads `display: flex` at both base and final.
- Failure scenario: a chip placed in a non-flex parent becomes a full-width block where Obsidian would have kept it inline.
- Fix: use `display: inline-flex` (the sweep stays invariant in flex parents, where both compute to `flex`) and correct the comment.

**LOW-3 — `assertModalRegistry` only sees direct subclasses and buttons created in the same file.**
- `visual-harness/shoot.mjs` (`assertModalRegistry`, regex `class\s+(\w+)\s+extends\s+(DseModal|Modal|SuggestModal|FuzzySuggestModal)\b`, plus the per-file `createEl('button'` check).
- Failure scenario: a future `class X extends LogActionModal`, an inline `new Modal(app)` with buttons, or an unreachable modal that gets a `<button>` through a helper in another file would not be flagged. None exist today; I verified this by grep.
- Fix (optional, could be a follow-up): resolve `extends` transitively against the found set, and flag `new (Modal|SuggestModal)(` in `src/`.

**INFO-1 — the allowlist is narrow, but coarse across states.**
- `HOSTLEAK_KNOWN_LEAKS` is keyed to scenario + the exact class list `dse-swatch` + 10 props, in all states, both schemes, pressed and idle. Its "stops leaking" check aggregates per property across all records. So e.g. `outlineStyle` is tolerated in rest and hover too, even though it only leaks at focus-visible.
- Acceptable for a temporary SC-361-owned entry. Probe 2 shows properties outside the entry still fail on the swatch.
- SC-361 should delete the entry outright rather than narrow it.

**INFO-2 — superproject rebase.**
- The worktree superproject (`27ed1bf` + `db07e0a`) is now 9 commits behind origin/main `383ec3f` (SC-422 and SC-432 landed).
- A trial merge shows 1 conflict, in `CHANGELOG.md` `## Unreleased`: both sides add a top bullet; keep both.
- `.claude/skills/dse-verify/SKILL.md` merges cleanly. Re-check its expected lines after the rebase, since SC-422 / SC-432 changed CURRENT (e2e is now 95/98 per the 383ec3f subject).

**INFO-3 — dse rebase.**
- dse origin/develop is now `95981f1` (SC-422 `8d075db` + SC-432).
- `git merge-tree` of b01268c with it shows **0 conflicts** in `styles-source.css` and `visual-harness/shoot.mjs`. SC-422's shoot.mjs hunks sit at :145 and :6812+; SC-356's sit at :2245–2950 and the one call at :6621.
- Re-run the full battery after the rebase. The e2e baseline moves with SC-432.

**INFO-4 — SC-422 makes one "unreachable" reason partly stale.**
- SC-422 adds a harness `?surface=` mount that renders CompendiumSearchModal's rows through production code (`visual-harness/chromeSurfaces.ts`). The reason string in `HOSTLEAK_MODALS_UNREACHABLE.CompendiumSearchModal` ("the harness never runs" its plumbing) is now partly stale.
- The modal still creates no `<button>` (checked at origin/develop), so the registry claim holds.
- Optional: reword the reason in the rebase.

## Docs (worktree superproject db07e0a)
- The SKILL.md host-leak bullet is accurate against my run: 10-record gallery boundary, modal expected line, 100 allowlisted, 3 unreachable, 6× focus-visible disabled. The CURRENT block is untouched. The only inaccuracy is the pre-existing "modal-only" phrase (LOW-1).
- The CHANGELOG bullet is accurate, including "still follow Obsidian's button height on a phone". It also applies on tablets (`.is-mobile`), which is harmless.
- DESIGN.md is untouched (it has no option-chip entry).
- The dse clone is on branch `sc356-hostleak-modal-buttons` @ b01268c. The superproject pointer is unbumped (` M draw-steel-elements`, gitlink still 772c3cd), which is expected.

## Evidence
Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r2-review-x7m3/`
- Gate logs (post-kill, authoritative): `b-tsc.log`, `b-lint.log`, `b-jest.log`, `b-lifecycle.log`, `b-e2e.log`, `b-shots.log`, `b-freeze.log`, `b-parity.log` (+ `.exit`). The pre-kill `tsc/lint/jest/lifecycle.log` are superseded and not used as results.
- Probe logs: `m-plain.log`, `m-host-ls.log`, `m-dropbg.log`, `m-noopen.log`, `m-wrongtitle.log`, `m-dropscenario.log`, `p2-a30-asar1144.log` (A30 table), `p-a30-harnesscss.log` (same final metrics under the pinned 1.13.7 css; its base half is invalid because the CSSOM was blocked), `p2-nt.log` (negotiation).
- Probe sources: `rv-a30probe.mjs`, `rv-ntprobe.mjs`, `rv_mkscratch.py`, `rv-modalpass.sh`, `rv_dropbg.py`, `asar_extract.py`, `asar/app-1.14.4.css`.
