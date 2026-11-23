# SC-672 r1 — implementer brief (counter: a block that is empty or is not a map of keys)

You are the implementer for one round. This brief is self-contained. Your final text goes to the ticket-owner (an
agent), not a human.

## 1. Context loading (do this first)

- Read the decisions ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`.
  It is the only source of rulings. **You never call the tracker (Linear)** — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`. Plugin repo:
  `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements`, branch
  `sc672-counter-malformed-block`, cut from dse `origin/develop` `129beb18`. Verify with
  `git -C <plugin repo> rev-parse --short HEAD` and `git -C <plugin repo> branch --show-current` before any write.
  `git -C <plugin repo> fetch origin` first; if `origin/develop` is no longer `129beb18`, do NOT rebase — note the new
  sha in your report and carry on at `129beb18`.
- Read `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements/AGENTS.md` (repo
  conventions) and the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  — it is very long with very long lines; read "The battery, in order" (top, about lines 20-60) and the lifecycle /
  e2e command-shape sections you need, not the dated history under "Current expected numbers".
- Precedent to mirror (already on develop): SC-628 montage `src/elements/montage/model.ts` (`parseModel`, about line
  333) and SC-638 negotiation `src/model/NegotiationData.ts` (about line 270), their jsdom tests and e2e specs
  (`e2e/specs/negotiation/wrong-values.e2e.ts`, the `openNote(rel, { errorCard: true })` driver option in
  `e2e/driver/dse.ts`).

**Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir (§4).
The main checkout is shared; its dirt (a modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
`docs/handoffs/HANDOFF.md`) is someone else's and expected — do not report it, do not touch it.

## 2. The task

Fix `ds-counter` (aliases `ds-ct`) for blocks that do not hold a YAML map. Today, on `129beb18`:

1. Text, a list or a number in the block (`hello`, `- a`, `5`): the card shows a working counter at 0 with no error.
   The first − or + replaces the block's text with `current_value: 1`, so the user's text is lost.
2. An empty block (nothing inside the fence, or only a comment): the card shows a raw error, "Counter: failed to
   render (render)" and "Cannot read properties of null (reading 'max_value')".

Code: `src/model/Counter.ts:41-52` (`parse` never checks the shape of `data`; `:44` reads `raw.max_value` on `null`),
`src/elements/counter/model.ts` (the `recordingDefaults` wrapper), `src/elements/counter/definition.ts` (no schema,
on purpose — keep it that way), `src/elements/shared/undeclaredDefaults.ts`.

The rulings, verbatim from the ledger (they are the spec):

> **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
> (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
> and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.` (the same string montage
> `src/elements/montage/model.ts:337` and negotiation `src/model/NegotiationData.ts:276` use). The pipeline draws it
> as the error card. An error card has no − / + / number box, so nothing can replace the user's text. No raw
> JavaScript message (`Cannot read properties`, `is not a function`, `TypeError`, `undefined`) reaches the card.
> The YAML-parse error path (`Invalid YAML format: …`) is unchanged.

> **R2. An empty block → a fresh counter at 0 (no error).** "Empty" = whatever parses to null /
> undefined: nothing inside the fence, blank lines / whitespace only, only comments, a bare `null` or `~`. It draws
> exactly the counter a `{}` block draws today (no name, current 0, min 0, no max). […]
> Consequences accepted:
> - The first − / + / typed value on an empty block WRITES into it (e.g. `current_value: 1`). That is a write into a
>   user file, so it gets integrity tests (text above and below the block survives; two empty counter blocks in one
>   note do not cross-talk; Reading view and Live Preview).
> - A comment-only block loses its comment on that first write. That is the plugin-wide behaviour for every block
>   (SC-599, Backlog: any write drops YAML comments) — out of scope here, not a new loss class.
> - The block edit form's Save for a counter becomes available with an empty box (FormModal treats elements that
>   accept an empty body that way, like montage / project). Fine.
> - `src/elements/shared/undeclaredDefaults.ts`: a counter that came from a blank body and has nothing left to write
>   is written back as a blank body (the existing generic rule), a `{}` source stays `{}`. Its comment that says
>   counter "cannot re-parse" an empty body gets corrected.

> **Scope: counter only, block-level shape only.** Out of scope, do not touch: SC-671 (a write deletes
> unknown keys), SC-673 (number-box rewrites, out-of-range), SC-674 (quoted `current_value`), SC-680 (wheel scroll),
> SC-599 (comments / quotes / flow lists), SC-670 (focus after an outside change). Wrong-typed VALUES inside a map
> (`max_value: banana`, `name: [a]`) are not this ticket […]. No shared helper extracted out of montage or
> negotiation; a counter-local check (or an existing framework helper) is fine.

Notes for the implementation:

- Put the shape check where both entry points get it (`Counter.parse`, which `Counter.parseYaml` and the element's
  `parse` both call). Check that an arbitrary object that is not a plain map (an array) is refused.
- For R2, first measure what a `{}` block draws and writes on base (jsdom is enough), then make the empty block
  identical on screen. On the write side follow the existing generic rule in `undeclaredDefaults.ts` (do not add a
  counter special case); if that rule does something surprising for a counter that came from a blank body (for
  example + then − back to 0), do not improvise: describe it in the report under `Follow-ups:`.
- If any EXISTING test pins the old behaviour (the raw error for an empty counter block, counter listed among the
  elements that "cannot re-parse" an empty body, a FormModal test that expects Save off for an empty counter box),
  update it to the ruling and list every such test by file and name in the report. Do not weaken any other test.
- TDD: write the failing tests first (repo convention), then the fix.

Tests to ship:

- **Unit** (`Counter.parse` / `Counter.parseYaml`): each R1 input (`hello`, a list, `5`, `0`, `true`, `false`, a
  nested list) throws the exact message; each R2 input (`''`, whitespace, comment-only, `null`, `~`, `undefined`)
  returns the same model as `{}`; a normal map is unchanged.
- **jsdom** (`test/dom/elements/counter.test.ts` or a sibling file): R1 inputs draw the error card with the exact
  message, no counter controls exist, no raw JS text, and nothing is written (the host's write is never called);
  R2 inputs draw a counter identical to `{}` and a + writes `current_value: 1`.
- **e2e** (real Obsidian), a NEW spec file `e2e/specs/counter/counter-wrong-block.e2e.ts`, ids **CTR-W03 onward**
  (CTR-W01 / CTR-W02 are taken on another branch — do not use them). Never a bracketed ticket id in a test title.
  Fixtures in `e2e/vaults/shipped/Counter/`:
  - `wrong-block.md` and `empty-block.md`, created **byte-identical** to these (another branch adds the same two
    files; identical content rebases cleanly). `wrong-block.md` is exactly these 9 lines, final newline after
    `BELOW`:
    ```
    # Counter: the block is not a map

    ABOVE

    ```ds-counter
    hello
    ```

    BELOW
    ```
    `empty-block.md` is the same with the title line `# Counter: an empty block` and ONE EMPTY LINE between the
    fences in place of `hello`.
  - Your own new fixtures (new names) for: a list block, a number block, a comment-only block, a block with nothing
    at all between the fences (fence lines adjacent), and a note with TWO empty counter blocks.
  - Cover at least: (a) text / list / number blocks show the plain error card with the exact message, offer no
    counter control, and the note is byte-identical after the test; (b) the empty block draws a counter at 0 and
    shows no error; (c) + on the empty block writes `current_value: 1` inside the fence with ABOVE / BELOW and the
    rest of the note intact, in Reading view AND in Live Preview; (d) in the two-empty-blocks note, + on the SECOND
    block changes only the second block, then + on the first changes only the first; (e) the adjacent-fences block
    (no line between the fences) takes a write correctly and the closing fence stays on its own line; (f) reopening
    the note after the write shows the counter at 1.
  - If the repo has a census / manifest that every fixture or control must be registered in (`e2eCensus.test.ts`,
    the e2e manifest), register the new fixtures the way the existing Counter fixtures are; an error card must not
    be listed as a block that "renders" a counter. Coverage must stay `418/418 pairs` (no new control).
- **Docs**: (1) one bullet under `## Unreleased` in
  `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md` — the WORKTREE's
  superproject file, never the one under `/home/scott/code/steelCompendium/workspace/`. Plain user-facing words,
  same style as the bullets above it, e.g. what a block holding plain text now shows and that an empty counter block
  is a counter at 0. (2) `draw-steel-elements/docs/counter.md`: a short line if it has a natural place (an empty
  block is a counter at 0; a block that is not a list of keys shows an error and is left alone). Written for
  non-technical users, no ticket ids.

Commits: inside the plugin repo, small coherent commits (`fix(SC-672): …`, `test(SC-672): …`, `docs(SC-672): …`),
commit after every coherent step. The CHANGELOG is a separate commit in the superproject worktree
(`git -C /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block …`); do NOT stage or commit the
`draw-steel-elements` submodule pointer there. **No `Co-Authored-By` or any AI attribution line in any commit
message.** Do not push. Never create a tag or release.

## 3. Gates (dse-verify owns the command shapes)

Base numbers at `129beb18`: tsc and lint clean · jest **13702 passed / 2 skipped** in a fresh worktree (13703 / 1
once `npm run shots` has cached the app css) · lifecycle **64/64** (seven `--only` parts, see dse-verify) · e2e
`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592 · freeze 280/280 ·
parity 0 / 0 / 24.

Run and report, on your final head:

1. `npm ci` first (a fresh worktree has no `node_modules`).
2. tsc (incl. `tsc -p e2e` if the repo's script does not already cover it) and lint: clean.
3. jest: **13702 + your new tests passed, 2 skipped**, 0 failed. Report the exact count and the number you added.
4. e2e: your new spec alone first, then ONE full run: `ok = 658 + new`, total `667 + new`, `0 failed`,
   `9 known-bug`, `coverage: 418/418 pairs`. Known flakes under load (INIT-W09 / INIT-W10, NEGO-R05, SET-X03 /
   SET-X04): if only those fail, re-run them alone and report both results; anything else failing is yours.
5. lifecycle: all seven parts, union **64/64**. G-S61 has been red on a busy host on base (SC-668): if it is the
   only failure, re-run it alone once and report both.
6. `styles.css`: build and compare its sha256 with a clean `129beb18` build. If identical, say so and SKIP shots /
   freeze / parity (they carry). If it differs, stop and report — this change should not move CSS.

Command-shape rules (each has hung or misled a worker before):

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …` compounds. Devbox eats `$?`: record exit codes inside a script FILE, and read each gate's
  own summary line. Never pipe a gate into `tail` / `grep`.
- Your scratch folder is
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc672-r1-impl/`
  (create it; shared scratchpad, so never a generic name outside that folder). Create scripts there with the Write
  tool (no heredocs). Unique log and rc filenames per run; overwrite with `>`; **no `rm` with a variable or a glob**.
- Run each gate as ONE blocking foreground call with output redirected to a log file (not streamed: a silent agent
  is killed by the 600 s stream watchdog, and a gate that streams floods your context). Split lifecycle and e2e into
  parts that fit the 10-minute tool limit as dse-verify describes. **No `run_in_background`, no Monitor, no "I'll
  wait for the notification"** — a job you started will not wake you. If something must run longer than a call
  allows, start it with `nohup … > log 2>&1 &` writing an rc file, and poll the log / rc file with short blocking
  calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- Git: always `git -C <absolute path> …`, never `cd X; git …`.
- Never `pkill` / `killall` by pattern, and never `rm -rf` a `/tmp` glob (`/tmp/dse-obsidian-lifecycle-*`, e2e
  vaults): other efforts run the same gates right now. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside
  your worktree; delete only a path you created and recorded.
- If `tsc` shows phantom errors after `npm ci`, or `token-coverage.test.ts` fails on the token map, read adapter
  footguns 2 and 4 in `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` before believing it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r1-implementer-report.md`.
It must open with a **≤10-line executive summary** (status, final dse sha, superproject CHANGELOG sha, each gate's
measured summary line, count of new tests by level). Below it: what changed by file, every existing test you
changed and why, what a `{}` block and an empty block draw and write (measured), `Drive-by fixes:` (already made:
obviously correct, local to a file you touched, cannot move a gate number) and `Follow-ups:` (left alone).
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / DONE_WITH_CONCERNS /
BLOCKED / NEEDS_CONTEXT), shas, measured gate summary lines, new-test counts, follow-ups — no prose, **plus the
absolute path of every evidence artifact you produced** (the report, each gate log).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
