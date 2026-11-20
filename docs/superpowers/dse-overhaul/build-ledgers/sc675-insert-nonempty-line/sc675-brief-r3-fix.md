# SC-675 r3 — fix round brief (implementer)

Self-contained; a fresh worker can run it from the files. Your final text goes to the ticket-owner (an agent).

## 1. Context

- **Workers never call the tracker.** Never push, never tag, never spawn agents.
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/decisions.md` — read the "Owner rulings on the r2 findings" block (O7 and the folds / drops).
- r1 brief (spec + footguns §5, all still in force): `.../sc675-insert-nonempty-line/sc675-brief-r1-implementer.md`.
- r1 report: `.../sc675-r1-implementer-report.md`. Review report: `.../sc675-r2-reviewer-report.md` — read its sections "MEDIUM-1" and "LOW-1" in full (lines 14-42); they are the findings, verbatim, with measured Obsidian results and the prescribed fixes.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements`, branch `sc675-insert-nonempty-line`, HEAD must be `bb608f5b` (verify with `git -C`). `origin/develop` is `129beb18`; `git -C <plugin path> fetch origin` and, only if it moved, stop and report NEEDS_CONTEXT with the new sha (do not rebase on your own).
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r3-fix/` (new dir, unique file names).

## 2. Fixes (exactly these; nothing else)

1. **MEDIUM-1 (owner ruling O7, supersedes the r1 brief's "tab indentation (keep the exact whitespace characters)").** Finding, verbatim: "in a list nested with TABS (Obsidian's default list indentation), the inserted block is written with tab indentation on every line, and Obsidian **Live Preview draws a parse-error card** ("Tabs are not allowed as indentation"). Reading view draws it. Spaces fix it (measured in Obsidian)."
   Prescribed fix, verbatim: "in `blockContextOf`, build the list continuation indentation as spaces only: `quote + ' '.repeat(contentColumn)`, with columns from `columnAfter` (tab = next multiple of 4). Do the same for the whitespace-only line, `' '.repeat(columnAfter(indent))` (`:72-73`). The first line still goes behind the user's own whitespace when the cursor line holds only its prefix, so no user character changes; S9/S10 prove that mixed shape draws. Update `insertOwnLines.test.ts:181-182` (expect spaces; replace `'\t- item'` with `'- a\n\t- b'`) and the docs/report wording."
   Add tests for `- a⏎⇥- b|`, `- a⏎⇥- |` and `- item⏎⇥|` (exact resulting text). The user's own characters on the cursor line are still never rewritten (insert-only rule stands). A tab inside a callout-prefixed list (`> - a⏎> ⇥- b|`) follows the same rule: spaces.
2. **LOW-1.** Finding, verbatim: "`blockInsert.ts:62-70`: quote markers are read only at the start of the line, not after a list marker. before `- > [!note] T|`. After: `- > [!note] T⏎␣␣```ds-ct⏎␣␣name: Health⏎…⏎␣␣``` ` … The block draws inside the item, below and outside the callout." Fix, verbatim: "after a list marker, also take `quoteMarkersOf(rest after the marker)` into the prefix, giving `␣␣> `." Add tests (`- > [!note] T|`, `- > quote|`, and a round-trip check that the framework reads the block back with prefix `␣␣> `).
3. **Test nit:** `'\t- item'` (a tab at column 0 with no parent item) is not a list; replace as prescribed above.
4. **CHANGELOG** (`/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/CHANGELOG.md`, never the main checkout): replace the whole SC-675 bullet with exactly:

   ```
   - **DSE plugin: inserting a block no longer breaks it when the cursor is not on an empty line (SC-675, also fixes SC-462).**
     The Insert Draw Steel commands, the `/ds` pick and the compendium reference and full-block inserts now always give the block lines of its own: text before the cursor stays on the line above it, and text after the cursor moves to a line below it.
     Inside a callout every inserted line keeps the `>`. Inside a list item every line is indented under the item (a block inside a list item draws but can't save yet, as before).
   ```
   Commit in the worktree superproject.
5. `docs/writing-blocks.md` / `.repo-docs/architecture.md`: adjust only wording that the two code fixes make inaccurate (tabs → spaces).

Out of scope, ruled in the ledger — do not touch: LOW-2, INFO-2, INFO-3, INFO-4 (dropped); SC-461 (list-indented blocks can't save); anything in SC-443's files; `schemaSuggest.ts`.

Commits: `fix(SC-675): r3: …`, `test(SC-675): r3: …`, `docs(SC-675): r3: …`. No co-author trailers, no AI attribution.

## 3. Gates this round (expected)

Each as one blocking foreground call via `devbox run -c <abs plugin dir> -- bash <script file>`, exit codes recorded inside the script file, logs in your scratch dir:
- `npm run tsc` clean; `npm run lint` clean, exit 0.
- `npx jest`: 0 failed. r2 measured **13816 passed / 2 skipped, 300 suites + 1 skipped** on `bb608f5b`; report yours and the delta (must equal the tests you added minus any you removed).
- `styles.css` sha256 after a build must still be `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- Do NOT run lifecycle, e2e, shots, freeze or parity in this round. I will resume you for them after the re-review starts.

## 4. Report and return

Append a section `## r3` to a NEW file `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/sc675-r3-fix-report.md` (executive summary of at most 10 lines first): what changed per finding with file:line, the before → after text for the three tab cases and the two LOW-1 cases, commits, gate numbers, log paths. If the write is blocked, return it inline.

Final text: raw facts, no prose — STATUS, plugin sha, superproject sha, jest numbers and delta, tsc / lint, `styles.css` hash, absolute paths of the report and logs. You cannot message me; if you need input end with STATUS: NEEDS_CONTEXT and the question.
