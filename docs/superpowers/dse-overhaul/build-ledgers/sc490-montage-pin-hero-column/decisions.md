# SC-490 decisions ledger — montage board: pin the hero-name column while the board scrolls sideways

Worktree: `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column` (branch `sc490-montage-pin-hero-column` in every submodule).
Base: dse `develop` @ `0698550f`. Superproject: workspace `main` @ `77541a77`.
Baselines at base (dse-verify CURRENT): tsc + lint clean · jest 6378 / 1 skipped / 253 of 254 suites (fresh worktree 6377 / 2 until a shots run) · lifecycle 49/49 in five `--only` parts (21 + 16 + 7 + 4 + 1) · e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL, button host-leak 161/966 · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.
Prior art: `docs/superpowers/dse-overhaul/build-ledgers/sc326-montage-scroll-ledger.md` + `sc326-montage-scroll/`.

## Scott rulings (verbatim, dated)

- 2026-10-21, on SC-326: "Pinning the hero column on the left is a great idea"
- 2026-11-05 00:24Z, on SC-490 (answering the land-ready look check, incl. the long-card 7/9-level strip and the optional narrow-pane width question): "The \"after\" screenshots look great" → look APPROVED as shipped at `e4f394fa` (option A stands; no option C). He did not ask for a narrower column → no ticket filed.

## Dispatcher instructions (2026-11-02)

- "Any look change on overflowing boards is Scott's to see: show him before/after crops (dark and light) in your land-ready comment; Scott is colorblind, so never rely on hue alone — name colors in prose."
- "If you add a lifecycle scenario it is G-S66, in part 3 or part 4 before G-S56."
- "Do not edit .claude/skills/dse-verify/SKILL.md in your branch; put proposed text in a proposal file in the ledger dir."
- Overlap: none expected (SC-545, SC-547, SC-552 are Live Preview/twin write paths, not montage).

## Owner decisions (2026-11-02, ticket-owner; Scott sees the result at land-ready)

1. **What pins:** the header corner cell (`.dse-mt__board-corner`, "Hero" + the "+" Add-a-hero button) and every hero-name cell (`.dse-mt__board-name`, incl. the row-action button) — `position: sticky; left: 0` with a z-index above the round cells. Round headers, cells, and the Tally do not pin. No vertical pinning (the board has no vertical scroll).
2. **A board that fits is byte-identical** — freeze 280/280 with NO rebaseline. Mechanism, in order of preference: (a) pure CSS that is provably byte-identical on every frozen montage shot; else (b) the opaque background (and any edge rule, decision 3) applies only while the board overflows, via an attribute BoardView sets from a measurement (ResizeObserver registered through the owner `Component` so it is cleaned up; also correct after the SC-326 scroll-restore rebuild). Do NOT use CSS `scroll-state()` container queries (Electron floor across user installs is not guaranteed).
3. **Opaque pinned cells while overflowing:** a solid background that reads as close as practical to today's look over the card (the existing translucent banding composited over the card's surface colour), per theme (dark and light). Plus a 1px right-edge rule on the pinned column in an EXISTING line token (e.g. `--dse-metal-line` / `--dse-metal-faint`), only while overflowing, so rounds sliding under it have a visible edge. No drop shadow, no new tokens unless unavoidable (report if so).
4. **≤420px stacked layout:** no pinning (reset inside the `@container dse-mt (max-width: 420px)` blocks, or scope the sticky rules so they never reach it). **Print:** no sticky, print bytes unchanged.
5. **Row-action button:** its hover/focus reveal (`.dse-mt__board-name:hover .dse-mt__board-rowact`) keeps working on the pinned cell, fine and coarse pointer; nothing it shows is clipped or covered by a round cell.
6. **Focus:** `keepFocusedCellInView` (BoardView.ts) treats the frame's visible left edge as frame-left + pinned column width for any non-pinned cell; Tab stops inside pinned cells never scroll the board. Consider `scroll-padding-inline-start` on the board too, so native focus scrolling agrees. A Tab stop must never land on a cell covered (wholly or partly) by the pinned column.
7. **Gates:** extend the shots-run `montage board scroll OK` check: fine AND coarse pointer; at rest, mid-scroll and full scroll the name cells and corner stay at the frame's inner left edge; a hit-test at each pinned cell's centre returns the pinned cell; the pinned cells' painted background is opaque while overflowing; every non-pinned cell is reachable fully to the right of the pinned column (and its centre hit-tests to itself there); every Tab stop in a non-pinned cell lands fully right of the pinned column and inside the frame. Can-fail proofs: the pinned-position check fails without the sticky rule; the Tab check fails with the old `keepFocusedCellInView`. Jest coverage for the helper's new arithmetic (mocked rects, existing montage test pattern).
8. **Lifecycle:** no new scenario unless a real-Obsidian-only behaviour needs one (e.g. the overflow attribute after a rebuild in a real pane). If added: **G-S66**, in part 3 or part 4 before G-S56, and the lifecycle header must not carry a fixed total.
9. **Docs:** a `## Unreleased` bullet in the WORKTREE superproject's `CHANGELOG.md` (user-facing). DESIGN.md only if it already describes montage board scrolling/columns. Proposed dse-verify CURRENT text goes in the ledger dir (`sc490-dse-verify-proposal.md`), never in SKILL.md.

## Base moves (dispatcher)

- 2026-11-03: dse develop `0698550f` → **`ea78ebf8`** (SC-547: LP callout twin check perf in `src/framework/host/ReadingModeBlockHost.ts` + `remountReused.ts`; no CSS change, styles.css byte-identical). Base: jest 6383 / 1 / 253 of 254 (fresh 6382 / 2); lifecycle 49/49 five parts, e2e 128/128 89/89, shots 592 0 FAIL 161/966, freeze 280/280, parity 0/0/24. **Land-ready must be on `ea78ebf8` or newer.** Ours expected after rebase: jest **6392** / 1 / 253 of 254; rest unchanged. Plan: let review1 finish on `b3378747`; the fix round (or a rebase-only round) rebases onto the then-latest develop + full battery; the scoped re-review confirms `git range-diff` shows no content change in our commits.

## Worker roster (author-independence)

- r1 implementer (Sonnet) a59d073234f5bd1a7 — authors the change; brief `sc490-r1-brief.md`. Must NOT review.
- review1 (Opus) a7e5ad5d9f152a0e1 — independent of r1; brief `sc490-review1-brief.md`, reviewing `b3378747`.

## Rulings on follow-ups / findings

- r1 DONE (2026-11-03): dse `b3378747`, superproject `6567425a`. Mechanism 2(b): `data-overflow='on'` set by `BoardView.trackOverflow` (build + owner-registered ResizeObserver); 34 montage PNGs byte-identical to base; freeze 280/280; jest 6387/1/253 of 254; lifecycle 49/49 (G-S13 extended, no new scenario); e2e 128/128 89/89; shots 592 0 FAIL 161/966; parity 0/0/24. Opaque fills are literals within 1–2 levels/channel of the old composite; edge rule `inset -1px 0 0 var(--dse-metal-line)`; no new tokens. Resize re-pin workaround for a 1px sticky divider offset — reviewer to scrutinize. `scroll-padding-inline-start` deliberately not set (would scroll the board when a pinned control takes focus) — ACCEPTED, reviewer may probe.
- r1 also added a bullet to `draw-steel-elements/CHANGELOG.md` beside SC-326's — ACCEPTED (matches SC-326 precedent).
- r1 Follow-up 1 (harness `#mount` 760px cap makes the gate's "900px pane" really 760px): **DROP** — wording only; changing it moves recorded numbers for no user benefit.
- r1 Follow-up 2 (fresh worktrees lack `node_modules`; copied with `cp -a`): **DROP** here — the dispatcher may route it; not this ticket.
- r1 Follow-up 3 (pin lives in the steel decoration tier; no legacy theme exists): **DROP** — nothing to do.
- r1 Follow-up 4 (pinned column ~99px ≈ a quarter of a 420px frame; lever is the 6.2em name-column floor): **ASK Scott** as an optional note in the land-ready comment; no ticket unless he wants it.
- r1 Follow-up 5 (sticky pixel-alignment check is scratch only): **DROP** — jest pins the re-pin sequence; reviewer re-probes pixels once.
- Owner eyeballed dark + light fine mid-scroll composites: pinned name column solid, rounds slide under a visible 1px line, matches decision 3.

## Review 1 rulings (owner, 2026-11-03) — review1 verdict LAND-READY at `b3378747` (0 HIGH / 0 MED / 1 LOW / 6 INFO)

- LOW-1 (pinned fills are literal hexes sampled off `--dse-card-bg`; the card gradient is not runtime-variable, but the board's position on it is: drift 5–6 levels dark / 7–8 light on a 5-hero card with a ~2,500-char brief; silent coupling if `--dse-card-bg` is retuned): **FOLD, option A** — cross-reference comments at both `--dse-card-bg` definitions (`styles-source.css` ~:6994, ~:14306) and at the literals (~:4716–4729), plus a jest guard that each literal stays inside its theme's `--dse-card-bg` gradient stops (fails if the token is retuned without the literals). No new token (DESIGN.md rule 3; "not one new colour" ~:11338). Scott judges the drift from a long-brief crop in light and dark at land-ready; option C (exact gradient via JS geometry) only if he asks.
- INFO-1 (antialiased corner-pixel bleed, invisible with real colours): **DROP** — not visible.
- INFO-2 (harness never unloads views, observers pile up in the harness only; plugin cleans up): **DROP** — harness-only, plugin verified.
- INFO-3 (re-pin also runs on width-only resizes): **DROP** — measured 1.1–1.9 ms median per frame, no visible cost; simpler as is.
- INFO-4 (shots gate measures dark theme only): **FOLD** — run the gate's pinned/opaque/hit-test checks in light theme too (the fills are per-theme literals).
- INFO-5 (no stored shot of an overflowing board): **DROP** — a static shot at scrollLeft 0 would not show the pin; the gate's assertions cover behaviour.
- INFO-6 (base moved): **FOLD** — rebase dse onto `ea78ebf8` (or newer develop) and the superproject onto `origin/main` (`64fcd141`+; one-hunk CHANGELOG conflict with SC-547's bullet), full battery.
- Fix round r2 → r1 implementer a59d073234f5bd1a7 (resume). Scoped re-review → review1 a7e5ad5d9f152a0e1 (not an author).

- 2026-11-03 (base move, dispatcher): dse develop `ea78ebf8` → **`09ece2eb`** (SC-545: plugin off/on redraws LP callout/embed cards; new `host/replugRemount.ts`; new lifecycle G-S63 at the end of part 3; no CSS change). Base: jest 6415 / 1 / 254 of 255 (fresh ≈6414 / 2) · lifecycle **50/50** in five parts: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63` (8), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59` (1) · e2e 128/128 89/89 · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. **Land-ready on `09ece2eb` or newer.** Ours expected: jest 6415 + 9 + r2 guard tests / 1 / 254 of 255; lifecycle 50/50.
- 2026-11-03 (dispatcher): from ~06:42Z the machine ran at loadavg ~15 (SC-557 implementer's stray busy loops). Any lifecycle/e2e/shots red in that window that failed on timing is environmental — check `/proc/loadavg` and re-run once load drops before believing it.
- r2 DONE (2026-11-03, dispatcher-relayed after a 429 resume): dse `e4f394fa` on develop `09ece2eb` (6 r1 commits `=` in range-diff + `214f17e4` LOW-1 + `e4f394fa` INFO-4); superproject `a01d8001` on main `ca0cbd1b` (both CHANGELOG bullets kept). jest 6425/1/254 of 255; lifecycle 50/50 (21+16+8+4+1); e2e 128/128 89/89; shots 592 0 FAIL 161/966, scroll gate both themes; freeze 280/280; parity 0/0/24. Long-brief step: pinned column lighter than round-1 cells by max 7 levels dark / 9 light (base 0–1). Owner cropped the long-brief composites to the board (`evidence/sc490-r2-<theme>-longbrief-board-before-after.png`) for Scott.
- rereview1 → review1 a7e5ad5d9f152a0e1 (resumed), brief `sc490-rereview1-brief.md`.
- rereview1 verdict LAND-READY (2026-11-03) at dse `e4f394fa` / develop `09ece2eb`, superproject `a01d8001` / main `ca0cbd1b`: 0 HIGH/MED/LOW, 2 INFO. INFO-1 (guard is range-based, a literal moved to a stop passes): **DROP** — as ruled. INFO-2 (comment line pointers approximate, real :7002/:14316): **DROP** — "~" pointers, harmless.
- 2026-11-03: land-ready comment posted (7 before/after images incl. long-card crops); ticket In Progress + `Needs Review` for Scott's look check and the optional narrow-column question. Reported land-ready to dispatcher.
- 2026-11-03 (dispatcher): **parked on Scott's look check; dispatcher lands after his OK.** Keep the worktree and branches as they are (dse `e4f394fa` / superproject `a01d8001`). The ticket stays In Progress + `Needs Review` with the land-ready comment. On resume: if develop has moved, the first step is a rebase + full battery re-run (a fresh implementer brief, replacement-ready from this ledger + `sc490-r2-brief.md`), then a scoped re-review by a non-author.

## Resume after Scott's OK (2026-11-04/05)

- Scott labelled `Ready for Agent`; ruling above. Dispatcher: rebase onto current dse develop **`d689b719`**, full battery, re-review, land-ready.
- Base at `d689b719` (dse-verify CURRENT): tsc (incl. `-p e2e`) + lint clean · jest 6460 / 1 / 256 of 257 (fresh 6459 / 2) · lifecycle **51/51** five parts 21 + 16 + 9 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`) + 4 (`G-S57 G-S62 G-S61 G-S56`, G-S56 last) + 1 (`G-S59`) · e2e 128/128 89/89 · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. Ours expected: jest **6470** / 1 / 256 of 257; rest the same.
- r3 rebase round → r1 implementer a59d073234f5bd1a7 (resume; fresh implementer if no transcript), brief `sc490-r3-brief.md`. Scoped re-review → review1 a7e5ad5d9f152a0e1 (non-author).
- r3 DONE: dse `248e202b` on develop `d689b719` (range-diff 8× `=`); superproject `cbbc217c` on main `0d0f210e` (one `!`: CHANGELOG context + gitlink only). jest 6470/1/256 of 257; lifecycle 51/51 (21+16+9+4+1); e2e 128/128 89/89; shots 592 0 FAIL 161/966, scroll gate 4 contexts; freeze 280/280; parity 0/0/24. Proposal updated. rereview2 → review1 a7e5ad5d9f152a0e1 (scoped: range-diff + spot gates).
- rereview2 LAND-READY (2026-11-05): dse `248e202b` / develop `d689b719`, superproject `cbbc217c` / main `0d0f210e`; 0 HIGH/MED/LOW. INFO-1 (superproject main moved `0d0f210e` → `f0f5ffef`, docs-only, no CHANGELOG/gitlink touch): **DROP** — trivial rebase at landing (land-stack). Reported land-ready to dispatcher.
