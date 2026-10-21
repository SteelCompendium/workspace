# SC-470 r3 — independent adversarial review (reviewer)

You review ticket SC-470's implementation. You did not write it. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read history, not to post.

## 1. Context loading

- Ledger (source of truth for what was ruled): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/decisions.md` — read it fully, especially "Owner rulings on r1".
- Design round: `sc470-r1-design-report.md` (exec summary, Risks) in the same dir. Implementation report: `sc470-r2-implement-report.md` (exec summary first).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes`, dse at `draw-steel-elements/` on branch `sc470-scroll-pin-panes`, head `03e589c` on develop `aaa88b7`. Diff under review: `git -C <dse abs> diff aaa88b7..03e589c` plus the superproject CHANGELOG commit. **Do not commit to the branch.** Revert any temporary mutation and confirm `git status --porcelain` is empty at the end.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; never touch or report it.

## 2. Task — execute and probe, do not just read

Correctness-critical: this code runs on every vault `modify` of every note with a DSE block open in Reading view, and injects stylesheets into Obsidian documents. Probe at least:

1. **Correctness of D2**: second pane, external `vault.process`, file-watcher disk write, popout — scrollTop held. Re-run `--only=G-S8,G-S15` yourself (2/2) and the full lifecycle once (expect 29/29 (G-S15 is reserved for SC-470)). Independently re-prove discrimination: rule insertion disabled → G-S8 and G-S15 FAIL.
2. **Stylesheet-rule pin**: style elements never leak (count `<style>` nodes the plugin added per document after many pins, after release, after plugin disable/enable, after closing a popout while pinned); the selector cannot match another scroller; ids are unique across documents; `!important` still beats Obsidian's inline `min-height`; nothing left behind in `styles.css` that still references the removed rule/custom property. Re-measure the set/clear cost with r1's `P470-COST` probe (`sc470-r1-probe-cost.mjs.txt`).
3. **Re-pin max-px rule**: a re-pin can never capture a collapsed height; rapid modifies (simulate autosave: 10 `vault.process` calls ~300 ms apart) — scrollTop held, pin released within TTL after the last one, no unbounded phantom space.
4. **Blast radius**: non-DSE notes never pinned; a Reading view not scrolled / at top no-ops; Live Preview / Source panes untouched; a `modify` of a different file does not pin this one; rename/delete events irrelevant; listener unregistered on unload (no pin after plugin disable).
5. **Gates**: tsc, lint, jest (state number vs r2's), e2e (expect `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`), shots 572 / 0 FAIL, freeze 276/276 (any mismatch: identify which shots and why — the CSS rule removal should not move pixels), parity 0 GAPs / 0 undeclared / 24 DECLARED. Re-run at least lifecycle, e2e, and freeze yourself.
6. **Owner-flagged items from r2** (ledger, "Owner rulings on r2 concerns"): (a) re-pin uses max(pinned px, scrollHeight minus vertical padding) — confirm live that 10 autosave-style re-pins keep the pinned px flat (no 64 px ratchet) AND never below what scrollTop+clientHeight needs; (b) r2 saw `P470-REPRO` `Runtime.evaluate` 30 s timeouts at load 8-16 with cases `b-process,popout-process` together — try to reproduce and say whether any cause lies in the diff; (c) the pin selector is DESCENDANT (`.markdown-preview-view[data-dse-scroll-pin="id"] .markdown-preview-sizer`) so it also matches a nested `.markdown-preview-sizer` inside the pinned scroller (e.g. an embedded note's) — build a tall note with an embedded note containing content, pin it, and report whether the embed gets phantom height during the pin; say whether the child combinator `>` holds equally in G-S8/G-S15.
7. Scope: the diff must not touch `ReadingModeBlockHost.ts`, `fenceLine.ts`, `sidebar/registration.ts`, `PIN_TTL_MS`, or G-S8's assertions (comment wording only).

Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES.

## 3. Rules / footguns

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r3-<yourAgentId>/`; scripts via the **Write tool**, unique names.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements -- <cmd>` or a wrapper script file. **Never `cd` inside a compound command**; `git -C <absolute path>` always.
- **No glob `rm`** anywhere (incl. `/tmp/dse-obsidian-lifecycle-*`); delete only exact paths you created. Never `rm -rf` under `.superpowers/`.
- Kill only by PID whose command line contains `worktrees/sc470-scroll-pin-panes/`; never `pkill`/`killall` by pattern.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9372); stay off Xvfb `:1`.
- Gates via wrapper scripts recording exit codes to per-run files, output redirected to logs (devbox eats `$?`; `| tail` eats failures; 600 s stream watchdog).
- **Run every gate in the FOREGROUND** with a long timeout; never background and wait.
- Never key a wait-loop on a scratch filename or its contents.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher). Need input → end with `STATUS: NEEDS_CONTEXT`. If you message anyway, first word `SC-470:`.
- If the report-file write is blocked, return the report inline.

## 4. Output

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r3-review-report.md` — opens with a ≤10-line executive summary (verdict, counts by severity, gate numbers you measured). Evidence files prefixed `sc470-r3-`.

## 5. Return contract

Final text: raw facts — verdict, findings list (severity, file:line, one line each), measured gate lines, `git status --porcelain` state, absolute path of every artifact.
