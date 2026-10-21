# SC-470 r2 — implement (implementer)

You implement ticket SC-470 in an isolated worktree. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read history, not to post.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/decisions.md` — spec, constraints, and the owner's design ruling. It is the source of truth; if this brief and the ledger disagree, the ledger wins.
- Design round report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r1-design-report.md` (exec summary + the "design" section) and its prototype `sc470-r1-prototype.patch`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the whole battery, its order and command shapes.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes`; dse repo `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements`, branch `sc470-scroll-pin-panes`. First: `git -C <dse abs> fetch origin`; rebase onto `origin/develop` — expected sha `aaa88b7` (dispatcher, 2026-10-21; was e31e1a0). If `origin/develop` has moved past that, rebase onto it anyway and report the new sha. `npm ci` if `node_modules` is missing or `package.json` changed. Verify the path before every write. Also rebase the worktree's SUPERPROJECT branch onto `origin/main`: `git -C /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes fetch origin` then `git -C /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes rebase origin/main` (the CHANGELOG moved; report the resulting superproject sha).
- Workspace-level files (if you touch any — you should not need to) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/…` — never under `/home/scott/code/steelCompendium/workspace/` (that is the shared main checkout; only the ledger dir there is yours to write).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, never touch or report it.

## 2. Task

The owner's design ruling, verbatim from the ledger ("Owner rulings on r1 (2026-10-21)") — implement exactly this:

> - **Design: D2 + keep the writer-side pin call** (r1 recommendation). Do not edit `ReadingModeBlockHost.ts` (SC-457 in flight there).
> - **Risk 1 (pin cost ~200 ms set + ~200 ms clear of style recalc per pinned view, from the inherited `--dse-scroll-pin` custom property on the scroller) → FOLD into r2.** Reason: D2 widens how often the cost is paid (every external write / autosave to a DSE note, every other Reading view), and the cost also delays the rebuild (external-write collapse 13-31 ms -> 310-400 ms; popout redraw ~1.5 s -> ~2.5 s, at the TTL edge), which worsens the SC-472 TTL race. Switch to a per-pin stylesheet rule (measured 2-4 ms set, 2-32 ms clear, holds): an injected `<style>` in the scroller's own `ownerDocument` keyed on the attribute's value, no custom property, removed on release and on `releaseAll`; the static rule in `styles-source.css` goes. The G-S8 / G-S15 "CSS rule deleted" control becomes "the injected rule never inserted". Measure the before/after cost with r1's `P470-COST` probe.
> - **Risk 4 (re-pin keeps the FIRST px while autosave keeps refreshing the TTL) → FOLD:** a re-pin of an already-pinned scroller takes max(current pinned px, current scrollHeight) — never lower than the pinned value — so a long typing session cannot hold a stale height. Prove it never captures a collapsed height (jest).
> - **Docs:** `previewScrollPin.ts` header updated by r2 (D2 + stylesheet-rule pin; the "Not covered (SC-470)" line goes). [...] CHANGELOG bullet → r2 in the worktree superproject.

D2 as defined by the design round (verbatim from its exec summary): "A vault `modify` listener (`plugin.registerEvent`) pins every open Reading view of the modified file that contains `[data-dse-element]`."

Steps:
1. Rebase (section 1), then `git -C <dse> apply /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r1-prototype.patch` (made on `c03db7a`; resolve trivially if needed — SC-474 touched the Conditions modal only). Commit as `fix(SC-470): pin every Reading view of a file on vault modify (D2)` after reviewing it: you own this code now — read it, keep every fail-safe in `previewScrollPin.ts`, popout-safe (the view's own `ownerDocument`/`win`, never global `document`/`window`), `PIN_TTL_MS` unchanged.
2. Stylesheet-rule pin (Risk 1). Each pin gets a unique id in the scroller's `data-dse-scroll-pin` attribute; one `<style>` element per pinned scroller (or one shared per document, your call — say which and why) in that scroller's `ownerDocument.head`, rule `.markdown-preview-view[data-dse-scroll-pin="<id>"] > .markdown-preview-sizer { min-height: <px>px !important; }` (match the existing rule's selector shape — check whether it uses child or descendant, keep it). No custom property on the scroller. Release removes attribute AND style; `releaseAll` (plugin unload) removes every style in every document it pinned, including popouts. Delete the static `data-dse-scroll-pin` rule from `styles-source.css` (and anything generated from it per the repo's CSS build). Before/after cost with r1's `P470-COST` probe (`sc470-r1-probe-cost.mjs.txt`, injected temporarily as r1 did via `sc470-r1-run.sh`; revert after): report set/clear ms for the old and new mechanism.
3. Re-pin (Risk 4): re-pinning an already-pinned scroller sets px = max(current pinned px, current scroller scrollHeight) and restarts the TTL. jest: a re-pin while the sizer is collapsed (scrollHeight == pinned px or lower) never lowers px; a re-pin after growth raises it.
4. Update the `previewScrollPin.ts` header per the ruling (D2, why the writer-side call stays as a backstop, the stylesheet-rule mechanism and its measured cost, "Not covered" now points at SC-478 Live Preview and SC-479 embeds). Update the G-S8 and G-S15 negative-control wording in `obsidian-lifecycle.mjs` comments to "the injected rule never inserted" if they mention the CSS rule.
5. Discrimination controls (revert every mutation after): base build (`aaa88b7`) → G-S15 FAIL; yours → G-S8 ok and G-S15 ok; yours with the rule insertion disabled (e.g. guard the `<style>` append with `&& Date.now() < 0`) → G-S8 FAIL and G-S15 FAIL. 2/2 each, `--only=G-S8,G-S15`.
6. CHANGELOG bullet (below), commit in the superproject.

Tests: jest unit tests for the new logic (follow the repo's conventions for `previewScrollPin` / host tests), plus the lifecycle scenario from the design round. Commit after every coherent step (code; tests; lifecycle scenario) with conventional messages prefixed `SC-470`. No co-author or AI attribution trailers in commit messages.

CHANGELOG: add this bullet (verbatim) under `## Unreleased` in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/CHANGELOG.md` (never the main checkout's), following the neighbouring DSE bullets' format, and commit it in the superproject:

  ```
  - **DSE plugin: a Reading view no longer jumps to the top when a tracker in it changes from another pane, a popout, or an outside edit such as Sync (SC-470).**
    Clicking a tracker in one pane used to throw a second pane on the same note back to the top, and so did an edit
    arriving from Sync, git or another plugin. Every open Reading view of the note now keeps its scroll position.
    Setting and releasing that hold is also much cheaper, so large tracker notes stutter less after a click.
  ```


Out of scope (do not touch): `PIN_TTL_MS` and the TTL mechanism (SC-472); fence-line / language parsing in `fenceLine.ts` and the block-key code (SC-457, in flight); `sidebar/registration.ts` (SC-471, in flight); G-S8's existing lines in `obsidian-lifecycle.mjs`.

## 3. Gates — full dse-verify battery, in order, expected numbers at `aaa88b7`

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5399 passed / 1 skipped / 231 of 232 suites** before your additions (a fresh worktree without the shots cache reads 5398 / 2 — say which you measured) plus your new tests · lifecycle **28/28** plus your new scenario(s), all ok · e2e **`OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Lifecycle and e2e are REQUIRED. Shots/freeze/parity: this change touches runtime TS (and maybe CSS), so run them unless built `styles.css` is byte-identical to a build of `aaa88b7` AND the change has no effect on the harness screenshots — if you skip, state the sha256 evidence.
Discrimination proof for the new scenario: FAIL on the base build, ok on yours, FAIL with the rule insertion disabled — 2/2 each (step 5) (revert every mutation; `git status --porcelain` clean afterwards).

## 4. Rules / footguns

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r2-<yourAgentId>/`. Write scripts there with the **Write tool**, not heredocs; unique names.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements -- <cmd>` (or a wrapper script file). **Never `cd` inside a compound command**; `git -C <absolute path>` for every git command.
- **No glob `rm`** anywhere (not scratch, not `/tmp/dse-obsidian-lifecycle-*`). Delete only exact paths you created. Never `rm -rf` anything under `.superpowers/`.
- Kill only by PID whose command line contains `worktrees/sc470-scroll-pin-panes/`. Never `pkill`/`killall` by pattern.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9371); stay off Xvfb `:1`.
- Devbox eats `$?`/`$PIPESTATUS` and `| tail` eats failures: gates via wrapper script files recording the exit code to a per-run file, output redirected to a log — never streamed (600 s watchdog).
- **Run every gate in the FOREGROUND** with a long timeout. Never background a gate and wait for a notification — it will not come.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or use a per-run unique path.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me). Need input → end with `STATUS: NEEDS_CONTEXT` + the question. If you message anyway, first word `SC-470:`.
- If the report-file write is blocked, return the report inline.

## 5. Outputs

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r2-implement-report.md` — opens with a ≤10-line executive summary (head sha, base sha, every gate number, discrimination counts). Then: files changed, design deviations from the ledger ruling (with why), `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Final text: raw facts — STATUS, dse head sha + base sha, each gate's measured line, discrimination counts, `git status --porcelain` state, and the absolute path of every artifact (report, logs, screenshots).
