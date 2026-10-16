# SC-377 — Initiative Element tweaks — decisions ledger

Effort: `sc377-initiative-tweaks` · worktree `/home/scott/code/steelCompendium/worktrees/sc377-initiative-tweaks`
· dse branch `sc377-initiative-tweaks` cut from `origin/develop` @ `9ded832`.

## Scott's rulings (verbatim, dated)

### 2026-10-02 — ticket description (the whole brief; no comments on the ticket yet)

> * Move the "reset turns" and "reset encounter state" to top-left menu items
> * "Advance round" button can go at top left (same line as "Heroes" header"
> * The "Amount" text box and the other input components on that row seem broken
> * The hidden "malice" increment/decrement design feels a bit off - redesign in High Fantasy Steel style
> * The "turn market" between the heroes and enemies is completely inconsistent and feels off.  They should generally "feel" the same
> * Add support for naming the encounter (editable title)

### 2026-10-09 01:26 UTC — Scott, SC-377 comment `5bb62f58`, replying to ask 1

> * I want the shift evened out when saving a title.  No need for my review after this change.  feel free to land it
> * everything else is approved

Owner's reading: "everything else is approved" covers the three things ask 1 enumerated —
the look of the six changes, the "top-left menu" = chrome-panel reading (O1), and the
**sanction of the 38 `initiative*` frozen print lines** (the ask said reply "sanctioned";
"approved" is read as that sanction, the same reading as SC-236/SC-255/SC-231). The one
change he wants: the ~6.66px upward shift of the card on title commit (INFO-R1) must be
evened out — after that, land without another review pass.

Owner's reading notes (mine, not Scott's): "turn market" = turn marker. "top-left menu
items" = most likely the framework element chrome panel/menu (SC-169) — to be confirmed
by the survey, not assumed.

## Owner rulings on findings / follow-ups

These are the ticket-owner's design readings after the R0 survey (`sc377-r0-survey.md`).
They are NOT Scott's words; each is flagged in the review ask so he can overturn it.

- **O1 "top-left menu items" = the SC-169 element chrome panel** (which sits top-RIGHT,
  hover-revealed). DESIGN.md calls it the only per-element affordance surface and montage's
  "Reset progress" is the precedent. No new top-left `⋯` menu. Reset Encounter keeps its
  `ResetEncounterModal` confirm; Reset turns stays no-confirm and shows a `Notice`
  (montage precedent). The top-left action bar is removed.
- **O2 The "Round N" label moves with the Advance round button** onto the Heroes header
  line, left-aligned after the heading (right side stays clear for the chrome panel). The
  bar between the rosters becomes a Malice-only bar.
- **O3 The "Amount" row root cause is the pipeline click shield** (`preventDefault` on
  capture-phase mousedown/pointerdown blocks focus-on-click for every in-card input,
  plugin-wide). Fix it in the framework, in this ticket — it also blocks item 6. ds-counter
  and ds-party inputs are fixed by the same change; no separate ticket.
  Row polish in scope: Enter submits; empty label keeps blocking the add but must give
  visible feedback (focus + invalid state on the label field); fields use the kit sunken
  surface; the three controls share one height.
- **O4 Malice = the standard always-visible Steel kit stepper** (as ds-surges/ds-counter),
  "Malice" caption + numeral in the malice colour. No hover reveal.
- **O5 Turn markers = the seal on both sides, same three states**: empty engraved ring
  (not acted), struck seal ◆ (acted), ghost seal (hover). Green filled check leaves the
  screen. Portraits-off fallback uses the same socket.
- **O6 Title = model field `name`**, rendered as an inline-editable title at the top of the
  element (click → input; Enter/blur commits, Escape reverts; SC-340 adoption-blur guard).
  Unnamed + writable shows a screen-only "Untitled encounter" placeholder; read-only
  renders static text (nothing when unnamed). Chrome summary gains the name.
- **O7 Print follows the new DOM where the layout really changed** (round label on the
  Heroes line, action bar gone). Frozen-byte movement on initiative ids is expected and
  goes to Scott as a sanctioned rebaseline; turn-marker and malice restyling stay
  screen-scoped (print keeps its checkboxes and plain value).

### R1 implementer follow-ups — rulings (2026-10-02)

1. Four unfrozen capture ids missed at SC-232 → **ticket SC-381** (Backlog). Out of scope here.
2. Stale docs screenshots (`docs/Media/initiative-tracker*`, `npm run docs-shots`) → **fold
   into the R1 fix round** (docs are part of done).
3. Title input not in the input host-leak sweep → **fold into the R1 fix round**.
4. `ds-encounter` hand-off does not carry `name` → **ticket SC-382** (Backlog). Out of scope here.
5. Obsidian "Update Available" notice in camera runs → **drop** (harness nuisance; the
   lifecycle gate already filters it).
6. "Untitled encounter" placeholder is loud (h2 italic) → **pending the reviewer's verdict**;
   goes in Scott's ask either way.
7. `obsidian-camera.mjs` first-run "trust this vault" dialog on a fresh private profile →
   **drop** (environment-specific; R0's surveyor captured real Obsidian fine).

### R1 review findings — rulings (2026-10-02; review = `sc377-r1-review.md`, PASS-WITH-FIXES)

All **fold into fix round R1F** unless stated:

- MEDIUM-1 (shield's editable test climbs to CM6 `.cm-content` in Live Preview) → fix,
  bounded to the element root, + jest case + Live Preview lifecycle assertion.
- MEDIUM-2 (steel-light: group/portraits-off not-acted mark is a raised light disc) → fix.
- LOW-1 (Reading view: click elsewhere in the same card does not commit the title) → fix in
  the shield: a shielded mousedown outside a focused in-root editable blurs it. Applies to
  every in-card input, so "click away saves" is true everywhere.
- LOW-2 (placeholder too loud) → caption-size small-caps. Closes follow-up 6 above.
- LOW-3 (`name: 1984` / `name: true` → error card) → coerce scalars to String.
- LOW-4 (Malice ± lost the 44px hit overlay) → restore.
- LOW-5 (CHANGELOG print claim; DESIGN rule 9 attribution) → correct both. DESIGN must not
  attribute O1/O4/O5 to Scott's words; cite SC-377 only.
- LOW-6 ("Not zero" on empty Amount) → "Amount required".
- INFO-1 (sidebar jest suites race a 400ms real wait against `PERSIST_DEBOUNCE_MS=400`) →
  fold, strictly bounded: remove the race in those two test files only; no product code.
- INFO-2 (quick-add accepts `1.5` / `1e2`) → fold: whole numbers only, visible feedback.
- INFO-3 (G-S9d Reading-only) → fold: add the Live Preview variant.
- INFO-4 (hero hover vs acted differ by opacity only) → **drop**: hover is transient.
- INFO-5 (worktree superproject pointer uncommitted) → **drop**: landing's job.
- OWNER-1 (mine, from the reviewer's crops): the ACTED seal is dimmed on the hero side
  (it inherits the spent-row portrait dim) and full-brightness on the group side, in both
  schemes → the seal must be the same material and brightness on both sides.
- OWNER-2 (mine): the NOT-ACTED ring is nearly invisible in steel-dark (dark ring on dark
  ground, worst on the group header) → ring edge ≥ 3:1 contrast against its ground in both
  schemes, same on both sides.
- Earlier folds still owed: regenerate docs screenshots (`npm run docs-shots`); add the
  title input to the input host-leak sweep.

Out of scope for R1F (cite, do not fix): SC-381, SC-382.

### R1F re-review findings — rulings (2026-10-02; `sc377-r1f-rereview.md`, PASS-WITH-FIXES at `f38e978`)

- NEW-MEDIUM-A (not-acted group/portraits-off mark still a raised light ball in
  steel-light: reset rule (0,6,0) loses to the kit sheen rule (0,8,0)) → **fix in R1F2**;
  replace the text-match CSS test with a computed-style check. Closes MEDIUM-2.
- NEW-LOW-B (click on ANOTHER element's card or the same tracker in another pane does not
  commit the title) → **fix in R1F2**: a shielded mousedown in any DSE root blurs a focused
  editable that lives in a different DSE root. CHANGELOG wording must match the result.
- NEW-INFO-C (naming an unnamed tracker types at caption size, then jumps to title size on
  commit) → **fix in R1F2**: the title input is always title-size.
- NEW-INFO-D (Live Preview: modal closes when a pending write lands; pre-existing) →
  **ticket SC-384** (Backlog). Out of scope.
- P-1 (`_dse_anchor` stamped unquoted; numeric-looking ids rewritten; sidebar panel loses
  its block; cause of the `sidebarInitiative` "SC-288 r2" flake) → **ticket SC-383**
  (Backlog, Bug). Out of scope; a red in that one test is SC-383, not this branch.
- Stale animated `docs/Media/initiative-tracker.gif` (manual re-record only) → goes in
  Scott's ask as a hand-off item; no ticket.

### R2 re-review — rulings (2026-10-09; `sc377-r2-rereview.md`, PASS-WITH-FIXES, land-ready NO)

- NEW-MEDIUM-R2 (a wrapped title — any 19+ character name at sidebar width — still jumps
  28px per wrapped line on open and on save) → **fix in R2F, option (b)**: the editor is an
  auto-height textarea that wraps exactly like the heading (same font/line box), Enter
  commits (no newline), Escape reverts; zero shift at every width. Option (a) (pin the
  rest min-height around a one-line input) only if (b) fails a measurable gate, and then
  the reason goes in the report. Add 300px wrapped named cases to `assertTitleLineStable`.
- INFO-R2a (report said ~12px, measured 15.7) → **drop**: report wording only.
- INFO-R2b (prompt font-size uses a hard-coded h2 em factor) → **fold** as a computed
  check that the prompt measures the label size, so a future scale change is loud.

### R2F + rebase (2026-10-09)

- R2F at `7fd8f92` (option (b), auto-height textarea) + `e3a7760` (`spellcheck=false`):
  title line 0.000 shift in 13 cases × 2 schemes incl. wrapped names; 44/44 hashes
  unchanged against the pre-SC-127 baseline.
- **`origin/develop` moved to `1ac4e5a` (SC-127, 131-line twin rebaseline applied to the
  shared baseline 2026-10-08).** Ruling: rebase onto exactly `1ac4e5a`, regenerate
  `rebaseline.txt` / `widening.txt` from the rebased tip. Scott's sanction covers the
  SC-377 visual change; the hashes are recomputed on the landing tree, the same reading
  as SC-120/SC-231 (recorded in dse-verify). Then scoped re-review of R2F + rebase.

### LAND-READY (2026-10-09) — final state for the dispatcher

- Final re-review `sc377-r3-rereview.md`: **PASS, LAND-READY YES**, nothing open.
- dse branch `sc377-initiative-tweaks` @ **`9ad919d`** (27 commits on `origin/develop`
  `e0ee273`); worktree superproject @ **`d90d7a0`** (docs commits on `origin/main`
  `5153a9b`; `origin/main` has since moved to `8551579` — expect a trivial adjacent-hunk
  `CHANGELOG.md` conflict at landing; keep the SC-377 bullet). Submodule pointer bump
  unstaged (landing's job).
- Freeze at landing: apply `rebaseline.txt` (38 lines, `initiative*`, sanctioned by
  Scott's "everything else is approved" on ask 1, comment `5bb62f58`, 2026-10-09) +
  `widening.txt` (6 lines, additions-only, 0 collisions vs the live 268-line baseline) →
  expected `freeze OK (274/274)`. Back up the baseline first
  (`freeze-baseline.sha256.pre-sc377-bak`) and append the dated record to dse-verify.
- Gates at `9ad919d`: tsc/lint clean · jest 4367/1sk · lifecycle 25/25 · shots 568/0 FAIL
  · parity 0/0/24 · freeze 38 `initiative*` mismatches only.
- Hand-off items for Scott: re-record `docs/Media/initiative-tracker.gif` by hand.
- Main checkout's `draw-steel-elements` still carries Scott's uncommitted vault dirt
  (`demo-vault/Welcome.md`, `justfile`, 2 untracked) — landing needs it clean/stashed.
- Ledger copies to `docs/superpowers/dse-overhaul/build-ledgers/` at landing.

## Round log

- R1 2026-10-02 — implementer DONE at dse `d0adf45` (superproject docs `cd513f5`). Gates:
  jest 4252/1sk, lifecycle 23/23, shots 556/0 FAIL, parity 0/0/24, freeze 38 mismatches
  (all `initiative*`), `rebaseline.txt` 38 + `widening.txt` 6. Independent review dispatched.
- R1 review 2026-10-02 — PASS-WITH-FIXES (0 CRIT / 0 HIGH / 2 MED / 6 LOW / 5 INFO); battery
  reproduced, 38/38 hashes confirmed. Fix round R1F sent to the implementer (resumed).
  Scoped re-review of the R1F delta goes to the reviewer (author-independent).
- R1F 2026-10-02 — implementer DONE at `f38e978`; re-review PASS-WITH-FIXES (MEDIUM-2
  still open + NEW-LOW-B + NEW-INFO-C). Tickets SC-383, SC-384 filed.
- R1F2 2026-10-02 — implementer DONE at `e9174e1`: jest 4273/1sk ×3, lifecycle 25/25,
  shots 556/0 FAIL + new turn-mark parity gate, parity 0/0/24, freeze same 38, 0 of 44
  hashes changed. Scoped re-review of `f38e978..e9174e1` dispatched (reviewer).
  Incident: the implementer ran `rm -rf /tmp/dse-obsidian-lifecycle-*`, deleting two stale
  lifecycle temp dirs from OTHER sessions (FAIL screenshots only; nothing under
  `.superpowers/` or any worktree). Report to Scott.
- R1F2 re-review 2026-10-02 — **PASS, LAND-READY YES** at dse `e9174e1` (battery
  reproduced; `sc377-r1f2-rereview.md`). INFO-R1 (card moves ~6.66px up on title commit)
  → **drop for now**, disclosed to Scott in the ask as a known small thing.
- ASK 1 posted 2026-10-02 (`sc377-ask-1.md`): look of the six changes; my "top-left menu"
  reading (O1); sanction for the 38 `initiative*` print lines. Ticket → In Progress +
  `Needs Review`. **Not land-ready until Scott sanctions.** State to land: dse branch
  `sc377-initiative-tweaks` @ `e9174e1` (base `develop` `9ded832`); superproject worktree
  commits `cd513f5`, `8813502` (pointer bump unstaged — landing's job); deliverables
  `rebaseline.txt` (38) + `widening.txt` (6).

- R0 2026-10-02 — survey dispatched (orchestration:reviewer): locate the six surfaces,
  reproduce the "Amount" row breakage, capture current-state shots.
