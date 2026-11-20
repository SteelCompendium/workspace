# SC-675 r5 — fix round brief (implementer)

Self-contained; a fresh worker can run it from the files. Your final text goes to the ticket-owner (an agent).

## 1. Context

- **Workers never call the tracker.** Never push, never tag, never spawn agents.
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/decisions.md` — read "Owner rulings on the r4 findings" (O8).
- Earlier briefs (spec and footguns, all still in force): `sc675-brief-r1-implementer.md` (§3, §5), `sc675-brief-r3-fix.md`, in the same dir.
- Re-review report: `.../sc675-insert-nonempty-line/sc675-r4-rereview-report.md` — read sections "MEDIUM-2" and "LOW-3" in full; they carry the measured Obsidian widths.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements`, branch `sc675-insert-nonempty-line`, HEAD must be `f94be393`, `git status --short` empty (verify with `git -C`). If `origin/develop` is no longer `129beb18` after a fetch, do not rebase: report the new sha.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r5-fix/` (new dir, unique names).
- **The r4 gates run on `f94be393` is superseded.** If a lifecycle or e2e process of yours is still running, let its current call end (or kill only PIDs whose `readlink /proc/<pid>/cwd` is inside this worktree), then report in one line what had completed. Do not start further gate parts on `f94be393`.

## 2. Fixes (exactly these)

1. **MEDIUM-2 (owner ruling O8, option (a)).** Finding, verbatim: "before `- a⏎⇥- b⏎⇥⇥- c|` after `- a⏎⇥- b⏎⇥⇥- c⏎` + 10 spaces + ```` ```ds-ct ```` ⏎ 10 spaces + `name: Health` … Live Preview: the counter draws. Reading view: no element and no error card; the block shows as inline code text".
   Fix, verbatim: "(a) Measure the way Obsidian reads it. In a BULLET item, count each leading tab as 2 columns. Measured to work in both modes at 1, 2 and 3 tabs: 1 tab → 4–7 (r3's 6 is in range), 2 → 6–9, 3 → 8–11. Keep 4 per tab for ordered items." and "add a jsdom row for `- a⏎⇥- b⏎⇥⇥- c|` with the chosen width. It cannot be oracle-checked with `marked`, so it is exact text only."
   Resulting widths for bullet items (`-`, `*`, `+`, task items included): 1 tab → 4 spaces, 2 tabs → 6, 3 tabs → 8 (2 per leading tab + the marker width). Ordered items: unchanged from r3. Leading SPACES count as themselves, as today. A whitespace-only cursor line: unchanged from r3 (ledger: accepted residual). Inside a callout the same rule applies after the `>` markers.
   Tests: exact-text rows for `- a⏎⇥- b|` (now 4 spaces), `- a⏎⇥- |`, `- a⏎⇥- b⏎⇥⇥- c|` (6), a 3-tab bullet (8), `* a⏎⇥* b|`, `- [ ] a⏎⇥- [ ] b|`, `> - a⏎> ⇥- b|`, and `1. a⏎⇥1. b|` unchanged from r3. Where an existing `marked`-oracle row now disagrees with the Obsidian width, keep the exact-text row and drop that case from the oracle with a one-line comment saying Obsidian's Reading view counts a bullet tab as 2 columns (cite `sc675-r4-rereview-report.md` MEDIUM-2 in the comment as "measured in Obsidian 1.14.4, SC-675 r4").
   Put a short comment at the tab rule in `blockInsert.ts` saying why bullets use 2 and ordered items 4 (measured, Obsidian Reading view), so nobody "corrects" it to CommonMark later. Update `.repo-docs/architecture.md` wording if it states the tab width.
2. **LOW-3, CHANGELOG** (`/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/CHANGELOG.md`, never the main checkout): replace the third line of the SC-675 bullet (the one starting "Inside a callout every inserted line keeps") with exactly:

   ```
     Inside a callout every inserted line keeps the `>`. Inside a list item every line is indented under the item. A block inside a list item still can't save its changes yet.
   ```
   Commit in the worktree superproject.

Out of scope (ruled): INFO-A, INFO-B, LOW-2, INFO-2..4, SC-461, SC-443's files, `schemaSuggest.ts`.

Commits: `fix(SC-675): r5: …`, `test(SC-675): r5: …`, `docs(SC-675): r5: …`. No co-author trailers, no AI attribution.

## 3. Gates this round (expected)

One blocking foreground call each via `devbox run -c <abs plugin dir> -- bash <script file>`, exit codes recorded inside the script file:
- `npm run tsc` clean; `npm run lint` clean, exit 0.
- `npx jest`: 0 failed. r3 was **13836 passed / 2 skipped, 300 suites + 1 skipped**; report yours and the delta (= tests added minus removed).
- `styles.css` sha256 after a build: still `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- No lifecycle / e2e in this round. I will resume you for the final battery after the re-review.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/sc675-r5-fix-report.md` (executive summary of at most 10 lines first): the change with file:line, before → after text for each tab case above, what the superseded r4 gates run had completed (part summary lines, if any), commits, gate numbers, log paths. If the write is blocked, return it inline.

Final text: raw facts — STATUS, plugin sha, superproject sha, jest numbers and delta, tsc / lint, `styles.css` hash, r4 gates partial results, absolute paths of the report and logs. You cannot message me; NEEDS_CONTEXT in your final text if blocked.
