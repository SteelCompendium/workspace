# SC-558 r2: implement Scott's stripe picks

You are a Sonnet implementer for ticket SC-558. Your final text goes to the ticket-owner (an
agent), not a human. **You never call Linear or the tracker**, whether to read history or to post.

## 1. Context loading

Read these in order:
1. The ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/decisions.md`.
   It holds Scott's rulings verbatim. Where it strikes a line through, the struck line is superseded.
2. The r1 design report, `.../sc558-left-stripes/sc558-r1-design-report.md`:
   - §2a, the survey table, with file:line for every stripe;
   - §3, the candidates;
   - §4a, the measured cost;
   - §7, the implementation sketch, including the tests that pin the spine.
   The line numbers are from `248e202b` and will have drifted. Re-find each rule by its selector.
3. The candidate CSS Scott picked, in `.../sc558-left-stripes/sc558-r1-crops/`:
   - `sc558-r1-cand-errorcard-C.css`
   - `sc558-r1-cand-role-fbadv-C.css`
   - `sc558-r1-cand-tier-A.css`
   - `sc558-r1-cand-act-A.css` (read its header note about editing in place)
   - `sc558-r1-cand-role-sb-A.css`
4. The dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Read:
   - "The battery", especially row 4 for the exact lifecycle `--only` lists;
   - "Steel scoping rule";
   - "Freeze semantics";
   - "Parity semantics";
   - the CURRENT block.

**Worktree.** The worktree is `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes` and the plugin is at
`.../draw-steel-elements`. Every submodule is on branch `sc558-left-stripes`. The worktree is
currently at dse `248e202b` with no commits.

**Verify the path of every write.** The workspace-level files (`DESIGN.md`, `CHANGELOG.md`) live in YOUR worktree's superproject:
- `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/DESIGN.md`
- `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/CHANGELOG.md`

Never write them under `/home/scott/code/steelCompendium/workspace/`. The only thing you write
there is the ledger dir.

**Rebase first.** Use `git -C <abs path>` for every git command. Never `cd X; git …`.
- dse: `git -C /home/scott/code/steelCompendium/worktrees/sc558-left-stripes/draw-steel-elements fetch origin`,
  then `rebase origin/develop`. It must land on **`6270e84a`**; SC-520, SC-349 and SC-526 have landed since.
  Then `npm ci` only if `package.json` changed.
- superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc558-left-stripes fetch origin`,
  then `rebase origin/main`. It must land on **`e1d3d1e0`**. Do NOT run `git submodule update` afterwards.
- Confirm both shas before any edit.

The main checkout's dse dirt is Scott's live vault and is expected. Ignore it: a modified
`demo-vault/Welcome.md`, plus untracked `compendium-manifest.json` and `demo-vault/*.md`.

## 2. The task

Scott's rulings, verbatim (2026-11-10):

> 1. C
> 2. C
> 3. A
> 4. A
> 5. new baselines are good
> 6. v2 site in a separate ticket in the backlog. high priority
> 7. 1px divider is correct.  Obsidian's left border on quotes should be removed

What each one means is spelled out in the ledger under "Mapping to the r1 ask". In short:

**a. Error card → C.** Draw a 1px border all around in the stage colour, mixed 60% toward the
neutral hairline. The title ink follows the stage. Remove the 3px left stripe and the stage
`border-left-color` rules.
- Keep `data-dse-error-stage`: tests and the `:not([data-dse-error-stage])` guards use it.
- `color-mix()` must sit behind the `@supports` gate with a static fallback (`cssSupportFloor.test.ts`).
- The stage stays in words in the title.
- Fold the candidate into the real rules in place. Do not append it.

**b. Featureblock "Level N Advancement" → C.** Make the group a sunken well with a 1px
`--dse-metal-faint` border all around and `--dse-surface-sunken`. The "Level N Advancement"
strip becomes its head band.
- **Screen only.** In print the rail is simply removed.
- Remove the 2px role rail and its Steel colour rule.

**c. Tier rows → A.** On `.dse-pr__row` (including `button.dse-pr__row`) and `.dse-mt__tier-row`
(including the `--head` colour), remove the 3px stripe. Keep the row wash and the badge.

**d. Action spine → A.** Remove `.dse-feature[data-dse-act]::before` in screen and print.
- Also remove every lane, radius and suppression rule that exists only for the spine, and the
  print `print-color-adjust` arms for `::before`.
- Framed cards keep their padding (`.85rem`). Re-derive it per §7.
- Keep `data-dse-act` and `--dse-act`: the crest glyph tints from them.

**e. The dead statblock role rule.** Delete `.dse-sb[data-dse-role]` `border-left`. It never paints.

**f. New, item 7: Obsidian's left border on plugin quotes in print.** In the print twin,
plugin blockquotes (class, perk, perk-headings) get Obsidian's own 2px violet
`border-inline-start` (`--blockquote-border-color`). This happens because the plugin's
blockquote re-grounding rule (≈:18693 on 248e202b) is `:not([data-dse-print="on"])`.
- Remove that edge in print for **plugin blockquotes only**. Never change Obsidian's quotes
  outside DSE output.
- Check whether the screen-side reset already covers Live Preview / reading view. SC-520 just
  changed Live Preview callout chrome: read its commit (`git -C … log 248e202b..6270e84a`) and
  don't fight it.
- Crop the r1 finding came from: `.../sc558-r1-crops/sc558-r1-adjacent-print-blockquote.png`.

**g. Tests.** Update the tests that pin the removed rules per §7:
- `steelMaterial.test.ts`.
- `lightContrast.test.ts`: the crit tier spine contrast entry must be **retargeted** to the
  crit badge frame, not silently deleted.
- `theme-steel.test.ts`: reword only the comments that call the tokens "spines".

Add a jest guard that fails if any of the removed stripes come back, or if the error card or
advancement well loses its border-all-around.

**h. Docs.**
- In your worktree's `DESIGN.md`:
  - rewrite the "Borders & cards" sentence "Ability cards add a 3px colored left border keyed to type";
  - in rule 7, replace "Existing components that ship one today may stay for now but **will be
    replaced**" with current state: DSE has none, and the v2 site's are tracked in **SC-564**.
- Add one `## Unreleased` bullet to the worktree's `CHANGELOG.md`. Write it in plain words, from the user's view.
- Grep `draw-steel-elements/.repo-docs` and `docs` for "spine" / "left border" / "stripe" and
  fix any current-state prose that is now false.

**Out of scope.** File nothing yourself. Report any follow-ups and I rule on them.
- The v2 site's stripes belong to SC-564.
- The `.dse-sb__sticky-chars` 1px divider stays. Scott said "1px divider is correct".
- No new lifecycle scenario is expected. If you find you need one, take id **G-S65** and say why.

Commit after every coherent step (rebase, each stripe, tests, docs). Do not push. Never edit the freeze baseline or any SKILL.md. If a skill text needs changing, write a proposal as
`.../sc558-left-stripes/sc558-r2-skill-proposal.md`.

## 3. Gates (full battery, dse-verify order) and expected numbers

Baseline at `6270e84a`:

| Gate | Expected |
|---|---|
| tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) | clean |
| jest | 6492 passed / 1 skipped / 257 of 258 suites, plus your new tests. A fresh worktree reads one fewer pass and 2 skipped until shots has run. |
| lifecycle | **52/52**, run as the FIVE `--only` parts from dse-verify row 4: 21 + 16 + 9 + 4 + 2, the fifth being `G-S59 G-S49`. G-S56 stays last in SCENARIOS. No private `DSE_LIFECYCLE_PORT` is needed since SC-551. |
| e2e | `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` |
| shots | 592, 0 FAIL, button host-leak 163/978, and the in-run line `capture clip OK (147 …)` |
| freeze | Against 280 lines, which already include SC-349's rebaseline. **Expected to move:** the printed action-spine ids (r1 measured 35 ids / 70 lines on 248e202b: `statblock` + 22 statblock variants, `featureblock`, `featureblock-advancement`, `featureblock-stats`, `featureblock-stats-ledger`, `kit`, `kit-collapsed`, `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-card`, `chrome-hover-statblock`, `chrome-placement-trio`), plus whatever ids print a plugin blockquote. Nothing else. |
| parity (LAST) | 0 GAPs / 0 undeclared / 24 DECLARED |

**Before you edit any CSS** (right after the rebase), run `npm run shots` once on the clean
`6270e84a` base and copy `visual-harness/shots/` to your private scratch as the "before" set.
You need it for the before/after crops.

If any frozen id outside the expected set moves, STOP and return `STATUS: NEEDS_CONTEXT` with the
id list and crops. Do not rebaseline it.

Command shapes and footguns. Each of these has cost real time:
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc558-left-stripes/draw-steel-elements -- <cmd>`.
  Never `cd X && devbox …`, and never `cd` inside a compound command.
- Record exit codes from a **script file** run through devbox (`devbox run -c <path> -- bash <script>`).
  `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's own summary line too.
- **One gate per tool call**, in the foreground, with output redirected to a uniquely named log.
  The 600 s stream watchdog kills silent agents, so run lifecycle as five separate calls.
- **Shots is the only gate you may background.** If you do, poll its own log or rc file. Never
  wait for a completion notice, because it does not come.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Use a private `DSE_CAMERA_TMP` under your scratch subfolder for shots.
- Your scratch is a private subfolder,
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r2-impl-<your agent id>/`,
  with uniquely named scripts and logs. Write scratch files with the Write tool (no heredocs).
- Never `rm` with a shell-variable target. Never use a glob `rm`, especially under `/tmp`: never
  `rm -rf /tmp/dse-obsidian-lifecycle-*`. Delete only literal paths you created and recorded.
  Never `rm -rf` anything under `.superpowers/` except a literal path you created inside
  `.superpowers/sdd/sc558-left-stripes/`.
- Never `pkill` or `killall` by pattern. Kill a scratch process only by its literal PID, after
  checking that `readlink /proc/<pid>/cwd` is inside your worktree.
- If the worktree superproject's docs make `token-coverage.test.ts` read red, see adapter footgun 4:
  compare the two copies and use `DSE_TOKEN_MAP_PATH`. It is not a code defect.

## 4. Deliverables in the ledger dir

Ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/`

- **Report:** `sc558-r2-impl-report.md`. It must open with a **≤10-line executive summary** giving:
  - shas;
  - every gate number;
  - the freeze move list;
  - follow-ups.

  Under it, add `Drive-by fixes:` and `Follow-ups:` sections.
- **`rebaseline.txt`:** ready-to-apply hash lines for every moved freeze line. Use the same format as the
  baseline, computed from YOUR after-shots on top of `6270e84a`. List the ids in the report.
- **Crops, in `sc558-r2-crops/`** with `sc558-r2-` filenames. Name colours in captions; labels are text in the image.
  - Before/after PRINT crops: `statblock`, `featureblock-advancement`, `kit`, and one id with a plugin blockquote.
  - Final SCREEN crops in steel-dark and steel-light:
    - the error card in all three stages (render, parse/schema, reference). Render one ad hoc, as r1 did; no shot shows it;
    - the advancement well;
    - power-roll tiers;
    - the montage tier strip;
    - a statblock with ability cards.
  - Keep it to about 6 composites. Use ImageMagick at `/home/linuxbrew/.linuxbrew/bin/magick` / `montage`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text is raw facts, no prose:
- verdict;
- the dse branch head sha and the superproject branch head sha;
- each gate's summary line;
- the freeze move list;
- follow-ups;
- the **absolute path of every crop, `rebaseline.txt` and the report**.

You cannot `SendMessage` me. A depth-2 agent cannot address its parent, and `to: 'main'` routes
to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT`
and the question in your report, and I will resume you. If you ever send a message anyway, its
FIRST WORD must be `SC-558:`.
