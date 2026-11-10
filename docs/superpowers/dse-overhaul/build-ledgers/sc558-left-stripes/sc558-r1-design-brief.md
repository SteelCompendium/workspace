# SC-558 r1 — design round: survey every coloured left stripe in DSE and design replacements

You are an independent Opus design/survey worker for ticket SC-558. Your final text goes to the
ticket-owner (an agent), not a human. You write NO production code this round.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/decisions.md`
  (current rulings, verbatim). It is the only source of rulings — **you never call Linear/the
  tracker**, not to read history and not to post.
- Read: `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/DESIGN.md` (rule 7 and the
  "Look & feel foundations" section; rule 9 is a worked example of shape-not-hue state),
  `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/draw-steel-elements/AGENTS.md` (if
  present), and the dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  sections "The battery", "Steel scoping rule", "Capture-width convention", "Freeze semantics",
  "Parity semantics" (skim; 1900 lines — read only those sections).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes`, plugin at
  `.../draw-steel-elements`, branch `sc558-left-stripes`, head must be dse `develop` @ `248e202b`.
  Confirm with `git -C <abs path> rev-parse --short=8 HEAD` before anything. **Verify the path of
  every write** — workspace-level files live in YOUR worktree's superproject
  (`/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/...`), never under
  `/home/scott/code/steelCompendium/workspace/` (except the ledger dir below).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

Ticket text (owner-condensed): several DSE components still draw a coloured stripe down their left
edge, which DESIGN.md rule 7 bans. SC-366 removed it from the two compendium-reference cards. This
ticket covers the rest. Several of them carry meaning (error state, creature role, power-roll
tier, nested feature card). The rule, verbatim from the ledger: "Carry state/category through the
Steel grammars instead (materials, crests/glyph silhouettes, notches, banner grounds,
borders-all-around)." Scott is colourblind: **a replacement must never rely on hue alone.**

The ticket's starting list (`styles-source.css` on `d689b719`, line numbers approximate):
- `.dse-error-card`: 3px `--text-error` stripe (~416).
- `.dse-sb[data-dse-role]`: 3px role-coloured stripe on statblocks (~3038).
- `.dse-fb__band--adv`: 2px role-coloured stripe on featureblock advancement bands (~3553).
- Power-roll tier rows: 3px tier-coloured stripes (~5240, and `.dse-pr__row` under steel ~9926).
- SC-101 nested-card frame: 3px `--act` stripe on `card`-style features (~7053, ported from the
  v2 site's `steel-statblock.css` / `steel-featureblock.css`).
- Probably out of scope: `.dse-sb__sticky-chars` 1px neutral `--dse-metal-line` left rule
  (~11033) — reads as a divider. Confirm or refute.

### 2a. Survey (bounded)

Find EVERY left-edge stripe in the plugin's CSS and any TS that sets one inline: `border-left`,
`border-inline-start`, inset `box-shadow` on the left, `::before`/`::after` spines, left-edge
`linear-gradient` backgrounds. Exclude neutral 1px dividers and the montage hero column's right
rule, but list them in one line each. For each in-scope stripe, one table row:
selector + file:line · width/colour token · what it means (category/state/none) · **what other
channel already carries that meaning** (a text label, a glyph, a heading, a tier symbol — check
the rendered DOM, not just CSS) · which fixtures/shots show it · does it render in **print**
(frozen class) and roughly how many frozen `*--steel-print.png` would move if it changes · does
the v2 site ship the same stripe (find the origin rule in
`/home/scott/code/steelCompendium/worktrees/sc558-left-stripes/v2/docs/stylesheets/`) and does
`npm run parity` compare the property (would a DSE-only change open a parity GAP?).

### 2b. Candidates

For each in-scope stripe (group the role pair statblock + featureblock-adv if they share a
system, and the two power-roll rules), design **2–3 replacements**, drawn from the rule-7
grammars. Include "remove outright" as a candidate whenever 2a shows the meaning already lives
in another channel; say so plainly. Constraints:
- Rule 3/4: compose existing tokens (`--sc-*`, `--fx-*`, `--dse-*`), no new brand colours, both
  steel-dark and steel-light; saturated colour = semantics only; no gradients/textures as chrome.
- Rule 5: glyph font / typed emoji / Material thin-line — never new hand-drawn icons.
- Steel scoping rule for any screen rule.
- **Not hue alone**: every category/state set (roles, tiers) must stay distinguishable in
  greyscale. Prove it with a greyscale render of each set.
- Don't copy the stripe into a different edge (a top-only coloured bar is the same cliché
  rotated — say if you think a candidate is borderline).

Render candidates as real crops: put each candidate's CSS in a file under your crops dir
(`sc558-r1-cand-<stripe>-<letter>.css`) and inject it into the harness render however is
simplest (a temporary uncommitted edit you revert, or a scratch copy). **At the end the
worktree must be clean (`git -C ... status --porcelain` empty in draw-steel-elements) and HEAD
still `248e202b`.** No commits this round.

### 2c. Composites for Scott

Scott reviews from images on the ticket. Produce **one composite PNG per stripe group** (aim for
5–6 total) using ImageMagick (`/home/linuxbrew/.linuxbrew/bin/montage` / `magick`): the current
look in steel-dark and steel-light, then each candidate, every tile labelled IN THE IMAGE with a
letter and a short text name ("Current", "A — remove", "B — framed notch", …). Labels are text,
never colour. Standard main-pane width (900px harness viewport; crop to the component, don't
shrink it to illegibility). Plus one greyscale sheet showing the role set and the tier set under
your recommended candidates next to the current ones. Also one crop of `.dse-sb__sticky-chars`
for the "out of scope?" confirm.

### 2d. Recommendation

Per stripe: your recommended letter and a 1–2 sentence why. Then list every question Scott must
answer (e.g. "does the v2 site follow, or is parity declared?", print rebaseline expectation),
so the owner can batch them in one ask. Flag any overlap with: SC-349 (reworking shots print
clipping, will move 40 freeze lines), SC-526 (Recoveries popover buttons), SC-520 (Live Preview
callout chrome).

## 3. Gates

No battery this round — you change no committed code. You will need `npm run shots` (or a
narrower harness render) to produce crops. Expected baseline on `248e202b` if you run the full
battery for any reason: jest 6470/1/256 of 257, shots 592 0 FAIL 161/966, freeze 280/280,
parity 0 GAPs/0 undeclared/24 DECLARED.

Command shapes and footguns (each has cost real time):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc558-left-stripes/draw-steel-elements -- <cmd>`
  — never `cd X && devbox …`, never `cd` inside a compound command. `git -C <abs path>` for every
  git command.
- Use a private `DSE_CAMERA_TMP` under your own scratch subfolder for shots.
- Run one gate per tool call, in the foreground, output redirected to a uniquely named log file
  (the 600 s stream watchdog kills silent agents). Shots is the only gate you may background,
  and if you do, poll its own log / rc file — never wait for a completion notice.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Your scratch: a private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r1-<your agent id>/`
  with uniquely named scripts/logs. Use the Write tool for scratch files (no heredocs).
- Never `rm` with a shell-variable target, never a glob `rm` (especially under `/tmp`), never
  `rm -rf` anything under `.superpowers/` except a literal path you created inside
  `.superpowers/sdd/sc558-left-stripes/`.
- Never `pkill`/`killall` by pattern. Kill a scratch process only by its literal PID, after
  checking `readlink /proc/<pid>/cwd` is inside your worktree.
- Never edit the freeze baseline or any SKILL.md.

## 4. Report

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r1-design-report.md`
  — opens with a **≤10-line executive summary** (stripes found, recommended letter per stripe,
  the question list).
- Crops/composites/candidate CSS: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r1-crops/`
  with `sc558-r1-` prefixed filenames.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts, no prose — verdict, the survey table (short), recommended letter per
stripe, the question list, worktree status + HEAD sha, and the **absolute path of every
composite PNG and the report**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
routes to the dispatcher, not me. If you need input mid-task, end your turn with
`STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever send a
message anyway, its FIRST WORD must be `SC-558:`.
