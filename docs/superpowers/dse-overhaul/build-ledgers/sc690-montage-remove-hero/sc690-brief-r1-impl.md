# SC-690 r1 — implementer brief: "Remove a hero" on the montage test tracker

You are an implementer worker for ticket SC-690. Your final text goes to the ticket-owner (an
agent), not a human. **You never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (do this first)

1. Read the decisions ledger — it is the whole spec (Scott's ticket text verbatim, plus owner calls
   O1–O5 which are binding for this round):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-decisions.md`
   There are no prior-round reports.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero`
   Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements`,
   branch `sc690-montage-remove-hero`, cut from `develop` @ `aee83dc1`.
   **All implementation happens there. Verify the absolute path before every write.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report and evidence
   in the ledger dir (section 5) — that main checkout is shared global state. Its dirt in
   `draw-steel-elements` (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault:
   expected, not yours, do not report it.
3. Fetch and confirm the base first:
   `git -C /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements fetch origin`
   then check `origin/develop` is still `aee83dc1`. If it moved, rebase onto the new sha and say
   so in the report. **Every git command uses `git -C <absolute path>`, never `cd X; git …`.**
4. Read the plugin's `AGENTS.md` (in the plugin repo) and the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   **That file is very large — do NOT read it whole.** Read lines 1–266 (battery table, devbox
   wrapping, exit-code footgun) and lines 1551–1554 ("Current expected numbers", CURRENT), and
   grep it for anything else you need (lifecycle `--only` parts, e2e notes near line 207, the
   in-run modal gates near lines 267 and 572, "Freeze semantics" at 627).
5. Fresh worktree has no `node_modules`: run `npm ci` in the plugin dir once before any gate
   (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

## 2. The task

Scott's ticket, verbatim (2026-11-23):

Title: "to add a way to remove a Hero in montage test"

> request from an rc user.

The owner calls O1–O5 in the ledger turn that into the design. Read them there; do not work from
this summary alone. In one line: a new ⋯ menu item "Remove a hero" (after "Add a hero") opens a
small window listing the heroes; pick one, press Remove; the hero's row, `skills_used` and logged
actions go, and the tally follows.

**Where the code is** (all under `src/elements/montage/`)

- `view.ts` `chromeItems()` (about line 561) — the four existing ⋯ items; `openAddHero()` is the
  twin to mirror for opening the window, committing, and handing focus on afterwards.
- `ConfigModals.ts` — `MontageAddHeroModal` is the twin for the new `MontageRemoveHeroModal`.
- `model.ts` — `addMontageHero`, `montageRoster`, `removeMontageEntry` (applies the tally delta and
  the skill occurrence), `resetMontageProgress`, `setNumber` / the SC-628 "do not re-type an
  unmoved scalar" rule. Add one exported `removeMontageHero(m, …)` that does the whole write;
  the view and the modal hold no model logic.
- `BoardView.ts` — how a row finds its entries (`entryFor`), which the removal must mirror (O3).
- `focusRules.ts` — the montage's focus fallbacks. After Remove the window closes and the removed
  hero's row controls are gone; focus must land somewhere defined, the same way "Add a hero"
  hands focus on. Extend the rules/comments if a new control needs an entry.
- Control ids: `montage.chrome.remove-hero` for the menu item; `montage.remove-hero.*` for the
  window's controls (one id for the hero options with the hero name as the focus/`at` key the way
  the board names per-hero controls, plus `.cancel` and `.submit`). Follow the id-naming note at
  the top of `e2e/manifest/montage.ts`.
- For the hero options, reuse an existing kit control (look at what `LogActionModal` uses for its
  Result choices and what the kit index exports) — no new kit file unless nothing fits; if you add
  one, note that every new file in `src/framework/kit/` adds 2 jest tests.
- Styles: reuse existing `dse-mt__sheet-*` classes where they fit. Any new CSS goes in the styles
  source the plugin's AGENTS.md names, with tokens only (no colour literals), and must not touch
  print output.

**Tests** (TDD — write the failing test first, then the code)

- Unit (`test/unit/model/`): `removeMontageHero` — hero with no entries; hero with success, failure
  and assist entries (tally drops by exactly their contribution); unknown name is a no-op; the last
  hero; duplicate roster names (O3); bare/malformed `participants` items and a non-list
  `participants:` survive; a typed `successes: "1"` is not re-typed when the removed hero
  contributed nothing to it; a complete-by-limit montage goes live again; serialize round-trip
  leaves every other key and its order as typed.
- DOM (`test/dom/elements/`): the menu item exists after "Add a hero" on a persisting host and not
  on a read-only one; not offered (or disabled) with an empty roster; the window lists the roster
  in board order, Remove disabled until a pick, the consequence line for a hero with and without
  logged actions; Cancel and Escape write nothing; Remove writes once; an outside edit that removes
  the picked hero while the window is open (follow `montage-outside-edit.test.ts`).
- e2e (real Obsidian): a new manifest surface `e2e/manifest/montage-remove-hero-modal.ts` mirroring
  `montage-add-hero-modal.ts`, the new chrome item added to `e2e/manifest/montage.ts`, and specs
  under `e2e/specs/montage/` (mirror `add-hero-modal.e2e.ts`): open by click and by keyboard,
  remove a hero with logged actions and read the note ON DISK afterwards, cancel paths, focus
  after close, and the file-integrity cases below. **The e2e gate requires `coverage: Y/Y pairs` —
  every new control x gesture pair needs a scenario.** Report the new totals.
- **File-integrity probes (this feature deletes from the user's note — these are required, as e2e
  or DOM tests against serialized text):** text above and below the block survives byte-for-byte;
  in a note with two montage blocks (`e2e/vaults/shipped/Montage/two-blocks.md`, `twins.md`) only
  the block acted on changes; unknown keys (`unknown-keys.md`) and hand-written oddities
  (`hand-written.md`, `quoted-*.md`) survive; removing then re-adding the same name gives a clean
  hero with no old actions.
- Do not weaken or delete an existing test. If an existing test pins the ⋯ menu's item count or
  order, move its number and say so.

**Docs** (docs are part of done)

- Plugin `docs/gm-trackers.md`: say how to remove a hero, in the plain voice of the neighbouring
  paragraphs, including that the hero's logged actions go with them and the totals follow. Grep the
  plugin's other `docs/*.md` (`migrating-to-7.md`, `common-element-fields.md`) for lists of the
  montage menu's items and update them. `docs/superpowers/**` is historical — leave it.
- Changelogs: plugin `draw-steel-elements/CHANGELOG.md` and the workspace `CHANGELOG.md`, a
  user-facing bullet under `## Unreleased` following each file's own convention.
  **The workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.** Commit the superproject doc change in the
  worktree's superproject (branch `sc690-montage-remove-hero`); do NOT commit a submodule pointer
  bump — landing does that.
- If the plugin's `.repo-docs/` or `AGENTS.md` lists the montage's controls or menu items, update it.

**Out of scope (ledger O5):** success/failure limits by number of heroes (SC-691 — do not touch
the limits when the roster changes), renaming a hero, the v2 site, a per-row remove button, an Undo
toast.

**Commits**: commit inside the plugin repo after each coherent step (`feat(SC-690): …` /
`test(SC-690): …` / `docs(SC-690): …`). **No co-author trailers, no AI attribution of any kind
in commit messages.** Never push. Never tag. Never create a release.

## 3. Evidence (Scott reviews from images; the owner eyeballs them first)

PNGs from a scratch script (NOT committed). Prefer real Obsidian (the e2e / obsidian-shots
machinery) for the menu and the window; say which renderer made each image. Default (Steel)
theme, the repo's normal capture width, the `fixture-mid.yaml` board (5 heroes, logged actions).

- A. The open ⋯ menu showing "Remove a hero" under "Add a hero".
- B. The "Remove a hero" window: (1) just opened, nothing picked, Remove disabled; (2) a hero with
  logged actions picked, consequence line showing, Remove enabled.
- C. The board before and after removing that hero (same framing), with the head tally visible in
  both, so the row gone and the totals changed can be read off the pair.

Scott is colorblind: nothing in the window may signal state by hue alone (the picked hero needs a
non-colour mark: a check, a filled radio, weight, or border — whatever the reused kit control does).
While capturing, **look at the images**: clipped text, a long hero name (40+ characters) in the
window, 12 heroes in the list (does the window scroll, are the footer buttons still reachable).
Report measurements, do not "fix" beyond the brief — the owner rules.

## 4. Gates — the full `dse-verify` battery, in order

Expected (CURRENT at dispatch, dse `develop` @ `aee83dc1`):

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: baseline **14439 passed / 1 skipped** (with the shots cache; a fresh worktree reads one
  fewer passed and 2 skipped until `npm run shots` has run). Report baseline + your delta.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed` (run as the seven `--only` parts in
  the skill, report the union)
- e2e: baseline `OBSIDIAN-E2E done: 794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs`;
  yours will be higher on both — report `N/M ok, 0 failed, 11 known-bug, coverage: Y/Y pairs`.
- shots **592** (higher only if you add a capture — say which) · freeze **280/280**, 0 FAILED ·
  parity **0 GAPs / 0 undeclared WARNs / 24 declared deferrals**, run last.

A freeze FAIL means frozen print bytes moved: stop, do not touch the baseline
(`.superpowers/sdd/freeze-baseline.sha256` is never edited by agents), report which shots and why.
Nothing in this change should move a frozen shot (the menu is closed in every print capture).

Known flakes under load are named in the skill's CURRENT/PREVIOUS notes (e.g. INIT-W09,
NEGO-R05): a red there is re-run alone before it is believed, and reported either way.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r1-impl-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers, evidence paths).
If the report-file write is blocked by your harness, return the report inline.

Copy the evidence PNGs to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/evidence/`
with names starting `sc690-`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:

- STATUS: DONE | NEEDS_CONTEXT | BLOCKED
- plugin branch + head sha; superproject branch + head sha; base sha
- every gate's measured summary line
- files changed (list); new control ids; new e2e ids and pairs
- the shape `participants:` takes after the last hero is removed, and why
- where focus lands after Remove and after Cancel
- **the absolute filesystem path of every evidence artifact** (PNGs, logs, report)
- `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move
  a gate baseline) and `Follow-ups:` (left alone). Workers never file tickets.

## 7. Footguns (each has cost real time here)

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-690:`.
- **Devbox**: node/npm are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 —
  record exit codes inside a script FILE, and read each gate's own summary line. Never pipe a
  gate (`| tail` eats the failure).
- **Scratch**: the session scratchpad is shared by every agent. Use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-impl-r1/`
  with uniquely named scripts and logs. Create scratch files with the Write tool, not heredocs.
- **Run each gate as one blocking foreground call** with output redirected to a log file (the
  600 s stream watchdog kills silent agents; lifecycle parts and e2e are split per the skill to
  fit the tool timeout). No `run_in_background`, no Monitor. If a gate must run in the
  background, poll its own log / exit-code file — never wait for a completion notice.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- **No `rm` with a shell-variable or glob target** (it prompts and hangs a background worker).
  Overwrite with `>`, or use fresh unique filenames. Never `rm -rf` a shared `/tmp` glob
  (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort) and never touch
  `.superpowers/` outside `sc690-montage-remove-hero/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose
  `readlink /proc/<pid>/cwd` is inside your worktree. Another ticket's gates may be running in
  another worktree at the same time.
- **Stale superproject pin**: if `token-coverage.test.ts` goes red on a token-map row you did
  not touch, compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the
  main checkout's copy before believing it; clear with the test's `DSE_TOKEN_MAP_PATH` override.
- `npm ci` again after any rebase that changed `package.json`.
- Commit after every coherent step so nothing sits uncommitted through a gate or build.
