# SC-610 r3 — fix round + rebase onto c6077860 + full battery

You are the r1 author, resumed (or a replacement loading context from files). Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context loading

- Ledger (binding, current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/decisions.md` — read the r2 rulings at the bottom.
- Your r1 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r1-impl-report.md`. The r1 brief `sc610-brief-r1-impl.md` in the same dir still holds every footgun (§4) — they all apply.
- Review findings: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r2-review-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero`, plugin branch `sc610-montage-nameless-hero` at `3a0f3079` (on `7866426e`), superproject worktree at `2bd2a2f6`.

## 2. The task

1. **Fix** the findings the ledger marks FOLD, exactly as ruled there:
   - **LOW-1** (r2 report): a non-list `participants` value (`participants: Kira`, a mapping, a number) is kept raw and written back as typed on any write; "Add a hero" wraps it as the list's first item (a mapping with a `name` thereby becomes a real hero). Tests: string, mapping and number forms survive an unrelated write; add-hero wraps.
   - **LOW-2**: a `participants` item that is a mapping whose every value is null (`- name:`, `- name: ~`, `- {name: }`, `- skills_used:`), or a list whose every element is null (`- [~]`), counts as empty and is dropped on write like `{}`. Never drop anything holding a non-null value (`0`, `false`, `" "` stay). One test per shape; and assert no `null` appears in the serialized `participants`.
   - **INFO-1**: type the raw list so a `.name` read on it does not compile (e.g. `participants?: unknown[]`); every read goes through `montageRoster`. Confined to `src/elements/montage/` and its tests — if the type change ripples outside that, stop and end with STATUS: NEEDS_CONTEXT instead.
   - **INFO-3**: replace the SC-610 CHANGELOG bullet (superproject worktree `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/CHANGELOG.md`, never the main checkout's) with exactly:

     ```
     - **DSE plugin: Montage: a hand-typed block whose hero list has an empty item, a bare word or number, or a hero with no name no longer breaks the board (SC-610).**
       An empty item (`- `) used to stop the board drawing at all. The other shapes drew a row labelled "undefined" and could leave
       the Log an action button with nothing to open. Such an item is now skipped on the board and reported in the developer console.
       When you change the board, the note keeps the item as you typed it, in its place. An item with nothing in it (`- `, `- {}`, or
       `- name:` with no value) is removed when the board next saves the note.
     ```
   - INFO-2 is DROP (correct under O3) — leave it.
   Anything the ledger marks DROP or files as a ticket is out of scope; do not touch it.
2. **Rebase** the plugin branch onto dse develop `c6077860` (SC-596 landed): `git -C /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements fetch origin && git -C /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements rebase c6077860`. Expect no conflicts in `src/elements/montage/` (SC-596 touched block-form pin code). Report any conflict and how you resolved it. If `package.json`'s obsidian version changed, re-check `node_modules` (it is a symlink to the main checkout's; do not write into it — if it is stale, report back with STATUS: NEEDS_CONTEXT).
3. Commit after each coherent step. Do not push, do not land.

## 3. Gates at c6077860 (full battery, each as one blocking foreground call)

- tsc clean, lint clean.
- jest: base `10624 passed / 2 skipped` fresh (a 2880-cell sweep suite takes ~58 s alone). Yours = 10624 + your SC-610 tests (40 at r1, plus any new). `rm -f main.js styles.css` (literal paths) before jest.
- lifecycle `59/59 ok, 0 failed` in SIX parts: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7), and part 6 now `G-S92 G-S96` (2; ~175 s; pass as `--only=G-S92,G-S96`, comma-separated). Report the union.
- e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
- shots 592; host-leak 163/978; modal host-leak 39/234; capture clip 147.
- freeze 280/280, 0 FAILED (STOP and report if a frozen shot moves).
- parity LAST: 0 / 0 / 24.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r3-fix-report.md`, opening with a ≤10-line executive summary. Per finding: what changed, the test that proves it (red before the fix, green after). Then rebase notes and every gate number.

## 5. Return contract

Raw facts: STATUS, new plugin head sha and the commit list on c6077860, superproject worktree head, every gate number, absolute paths of the report and every log.
