# SC-235 round 1 — measure, implement, gate, evidence (implementer)

You are the round-1 implementer for SC-235 (Steel section-title type scale). Your final text
goes to the ticket-owner, not a human.

## 0. Context loading — read first

1. The ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/decisions.md`
   (distilled current state; the "Owner rulings" section is your spec). **Workers never call
   the tracker (Linear)** — not to read history, not to post.
2. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the gate
   battery (order, command shapes, freeze/parity rules). Read "Current expected numbers",
   the freeze section, and the parity section.
3. `draw-steel-elements/AGENTS.md` in your worktree, and `visual-harness/parity/README.md`.
4. Reusable measurement scripts from the sibling ticket SC-232 (same measurement convention —
   raw computed px vs the live site): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r6-evidence/scripts/`
   (`wrap.mjs` per-character line/mid-word-break reconstruction, `measure.mjs`, `families.mjs`,
   `sitesel.mjs`). Copy what you use into your own evidence dir; never edit SC-232's files.

## 1. Worktree

- Superproject: `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale`
- DSE: `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale/draw-steel-elements`,
  branch `sc235-section-title-scale`, currently at `origin/develop` = `272c444`.
- First: `cd` there, verify `pwd` and `git status -sb`, then `git fetch origin && git rebase origin/develop`
  inside the DSE clone (expected: already up to date at `272c444`; if develop moved, rebase and
  note the new sha).
- **Verify `pwd` before every write.** Never edit anything under
  `/home/scott/code/steelCompendium/workspace/` except your own files in the ledger dir above.
  Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale/CHANGELOG.md` — never
  under `/home/scott/code/steelCompendium/workspace/`.
- Never touch DSE `main`. No tags. No `just deploy*`. Never edit the shared freeze baseline
  `.superpowers/sdd/freeze-baseline.sha256`. Never `rm -rf` anything under `.superpowers/`
  except your own `sc235-*` files.
- **Commit after every coherent step** (measurement scripts are scratch, not commits; CSS,
  parity map + test + README, comments, CHANGELOG are commits).

## 2. Task

### Step A — measure (before any code moves)

Using the live site (or the parity harness's committed site inventories if they are the
parity gate's own source of truth — say which you used), record the site's section-title
computed `font-size` / `line-height` / `letter-spacing` for every card family where the
plugin renders `.dse-section__title`: ability/feature cards, statblock (its nested features),
featureblock, kit (incl. the kit signature ability), and any other family you find emitting
`.dse-section__title`. Record the plugin's today values for the same captures.

Ticket claim: site 18px / 30.6px / 1.8px (`.sc-ability__section-head .tag`, `font-size: .9rem`
at a 20px rem base, `letter-spacing: .1em`); plugin 16px / 27.2px / 1.12px.
**If any site family's section title is NOT 18px/.1em, stop and return STATUS: NEEDS_CONTEXT
with the table** — the owner decides targets then.

### Step B — implement (owner rulings, quoted from the ledger)

> - **Implement the site-parity option on the branch as the proposal Scott will see:**
>   section title 18px, letter-spacing 0.1em (line-height follows from the 1.7 ratio).
> - **Unit rule:** the new size must scale exactly as today's does (Obsidian text-size setting,
>   SC-230 modal scaling): i.e. a pure x1.125 of whatever today's rule resolves to, landing on
>   18px at the default 16px. Do not swap an em-relative size for a fixed rem one (or vice versa)
>   if that changes behavior at a non-default text size.
> - **Screen-only.** Print/export must not move: freeze must read 260/260. If it does not, stop
>   (NEEDS_CONTEXT) — no rebaseline is planned for this ticket.
> - **No knock-on geometry.** Anything em-relative to the title's own font-size (gap, ::before
>   diamond if em, padding if em) must be checked; the strip's padding (10x18px, parity
>   `section-head`) and section rhythm must stay as they are unless parity says the site differs.
> - **Parity:** delete the three `section-tag` declarations (FOLLOWUPS #51) -> 5 entries /
>   10 DECLARED rows; move `compare.test.ts`'s documented-N guard and `parity/README.md` in the
>   same commit. dse-verify SKILL.md's expected numbers are workspace-level: the dispatcher
>   updates them at landing (do not edit).
> - **Narrow:** 0 new mid-word breaks and no new line wraps in section titles at 300px-wide
>   captures vs base; report a table.
> - **Comments** that state the section title is 16px/1em/.07em (e.g. styles-source.css ~8289
>   SC-143 comment) are updated to the new truth in the same branch.
> - **CHANGELOG:** one bullet under `## Unreleased` in the WORKTREE superproject's CHANGELOG.md;
>   plus the DSE repo's own changelog if its AGENTS.md convention requires one.

Pointers (verify, don't trust): the Steel screen-only section-title rules are at
`styles-source.css` ~8163 (small-caps + `letter-spacing: 0.07em`) and ~9029 (strip padding
`0.625rem 1.125rem`); the shared Steel emboss rule ~7200 and the font-family rule ~7570
(`:is([data-dse-element], .dse-modal)`) also reach `.dse-section__title`; the spend variant
~9311. Don't forget `styles.css` is built from `styles-source.css` per the repo's build — follow
AGENTS.md for which files are committed.

Also verify and report:
- SC-230 modal scaling: a section title inside `.dse-modal__body` still scales x1.4 at
  `--dse-text-scale` 1.4 (SC-232's r4 report did the same check for names by hosting a card in
  a modal body; the shots run also prints a `modal text-scale anchoring OK` line).
- Non-default Obsidian text size (e.g. 18px or 20px body font): today's vs new title size,
  proving the x1.125 ratio holds.
- No other text on any card changes size (diff every measured text node's computed font-size
  base vs head across the wide captures; only `.dse-section__title` may change).

### Step C — evidence for Scott (he is colorblind: never rely on hue; label everything in text)

Produce two composite PNGs in `.superpowers/sdd/sc235-section-title-scale/r1-evidence/`:

1. `sc235-compare-wide.png` — one row per card family (feature/ability, statblock,
   featureblock, kit; label each row on the left in text). Columns left to right: **Today**,
   **This branch**, **Site** (labelled in text at the top). Crop each cell to the region
   containing one or two section titles plus a line of body text for context — NOT a whole
   card. **Every cell at the same scale: 1 image px = 1 CSS px. Crop, never rescale any
   column** (SC-232's evidence was rejected twice for a site column captured at a different
   width and downscaled, and for a probe column that silently did not apply — verify each
   Today cell measures 16px and each This-branch cell 18px by computed style at capture time,
   and print those measured numbers in a table in your report). Use the Steel dark scheme,
   standard main-pane width per dse-verify's "Capture-width convention".
2. `sc235-compare-narrow.png` — Today vs This branch at 300px-wide cards, for the families
   whose section titles are longest; same 1:1 rule.

Then view both images yourself and confirm they show what the captions claim.

## 3. Gates (dse-verify, in order, all in the foreground with output redirected to files)

Expected at base `272c444` / expected at your head:
- tsc clean, lint clean.
- jest: record the base count first (run once at base or take it from a clean run) — head must
  equal base plus any tests you add, 0 failures.
- `npm run obsidian-lifecycle`: `19/19 ok, 0 failed`.
- `npm run shots`: 524 PNGs, 0 FAIL.
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`
  → `freeze OK (260/260 …)`. If not, STOP (NEEDS_CONTEXT) with the failing ids.
- `npm run parity` LAST: 0 GAPs / 0 undeclared / **10 DECLARED** / exit 0 (base is 16).
  Prove the three deleted declarations would fail: show the parity run at base CSS but with the
  declarations deleted goes red (or cite the can-fail unit test that covers it).

## 4. Process rules (non-negotiable)

- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>' > <log> 2>&1; echo rc=$?`. Devbox's
  `sh` eats `$PIPESTATUS`; never pipe a gate into `tail`. Redirect long-running output to a
  file rather than streaming it — the 600s stream watchdog kills silent agents.
- **Run every gate in the foreground.** Never background a gate or wait on a `Monitor` — a job
  you start does not wake you, and you will stall.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Write logs to per-run unique paths under your evidence dir.
- **Never `pkill`/`killall` by pattern.** Other efforts run the same `shots`/`parity`/
  `obsidian-*` commands right now. Kill only by PID, and only a PID whose command line contains
  `worktrees/sc235-section-title-scale/` (`pgrep -af "worktrees/sc235-section-title-scale/"`,
  check each line first).
- `npm ci` if a rebase changed `package.json`'s obsidian version.
- If `token-coverage.test.ts` fails on a missing token row, compare the worktree's
  `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's copy before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout's copy.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need
  input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message
  anyway, its first word must be `SC-235:`.
- If the report-file write is blocked, return the report inline.

## 5. Report

Write `.superpowers/sdd/sc235-section-title-scale/sc235-r1-implement-report.md`, opening with
a ≤10-line executive summary (verdict, dse head sha, superproject CHANGELOG sha, gate numbers,
site measurement verdict). Body: the measurement table (site / today / head per family), the
x1.125-at-other-text-sizes table, the modal check, the narrow wrap table, the every-other-text
unchanged check, the parity can-fail proof, and `Drive-by fixes:` / `Follow-ups:` lists.

**Return contract (your final text):** raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
dse head sha, superproject sha, each gate's number, and the absolute path of every evidence
artifact (report, both composites, logs, scripts).
