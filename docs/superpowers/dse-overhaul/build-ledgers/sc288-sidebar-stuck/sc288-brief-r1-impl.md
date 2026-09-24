# SC-288 r1 implementer brief — degraded sidebar panel never recovers via the fast path

## 1. Context loading
- Ledger (read first): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/decisions.md
- Original finding: /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc184-sidebar-investigation/sc184-rereview-report.md (search "N-1").
- Worktree: /home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck — work ONLY in its `draw-steel-elements/` submodule, branch `sc288-sidebar-stuck`. Verify `pwd` and `git branch --show-current` before every write. NEVER touch /home/scott/code/steelCompendium/workspace/draw-steel-elements (the shared main checkout).
- First: inside the worktree's draw-steel-elements, `git fetch origin && git rebase origin/develop`. At dispatch origin/develop = `f6fb208` (it may have moved; rebase onto whatever is current and record the sha). Branch currently sits on `46c0c4c`.
- You never call the tracker (Linear) — not to read, not to post.

## 2. The task
Ticket body (Scott-authored), verbatim:
> `src/framework/sidebar/SidebarPanel.ts` — `handleExternalChange`'s fast path (`if (previous instanceof ElementView) { … await previous.update(model); return; }`) returns before both the pipeline remount and the attribute clear. `handleAnchorLost` calls `removeChild(previous)` but never clears `host.lastMountedChild`, so after a degrade, a valid external change takes the fast path on a stale view and the panel never recovers (verified under production-shaped services by the re-review).
>
> One-line fix, either: null `lastMountedChild` in `handleAnchorLost`, or gate the fast path on `!hasAttribute('data-dse-sidebar-unavailable')`.

Owner ruling (ledger): fix the root cause — `SidebarBlockHost.lastMountedChild` (src/framework/host/SidebarBlockHost.ts ~l.234) is a getter over a private `mountedChild` with no clear path. Add a way to forget it, and have SidebarPanel call it wherever it removes the mounted child (`handleAnchorLost` AND the remount branch of `handleExternalChange`; check any other removeChild(previous)/unload sites too, e.g. panel teardown). The attribute gate is optional belt-and-braces — your call; justify in the report. Keep the SidebarPanel doc comment (which already claims "nothing is currently mounted (e.g. the panel was previously degraded)") true.

Tests (TDD — write the failing test first, show it red on the unfixed code, then green):
- Regression: production-shaped deps (refs + validation + prefs ALL present, so the fast path is live) → mount a valid block → trigger anchor-lost degrade (panel gets `data-dse-sidebar-unavailable`) → deliver a valid external change → panel recovers: attribute gone, degrade card gone, element re-rendered via the pipeline (not `.update()` on the stale view).
- Guard: normal (non-degraded) external change still takes the in-place fast path (rootEl identity preserved), so the fix doesn't silently kill the fast path.
- A host-level unit test for the new forget/clear method if it's cheap.
Find the existing SidebarPanel / SidebarBlockHost tests under `test/` and extend them in their style.

DSE CHANGELOG.md: one user-facing bullet under the `## 7.0.0 (unreleased…)` section (e.g. a pinned sidebar panel that showed "backing block not found" now recovers when the block reappears / is edited elsewhere). Match neighbouring bullet style.

Commit after each coherent step (test, fix, changelog). Conventional commit messages prefixed `fix(sidebar): SC-288 …`. Do not add Claude/AI co-author trailers.

## 3. Gates — the `dse-verify` skill
Read /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md and run the full battery in order in the worktree's draw-steel-elements: tsc, lint, jest (`rm -f main.js styles.css` first), shots, freeze check, parity LAST. Skip obsidian-shots unless a display is available (not required).
Expected: tsc/lint clean; jest all green — measure the BASE count on the rebased origin/develop sha before your change so you can report the delta (expect only your new tests added); shots 0 FAIL; freeze `freeze OK (260/260 …)` unchanged — this change must move ZERO frozen bytes; parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0.
Never touch `.superpowers/sdd/freeze-baseline.sha256`. Never `rm -rf` anything under `.superpowers/` except your own sc288-prefixed files.

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-impl-report.md. Gate logs to the same dir as sc288-r1-<gate>.log.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, base sha, head sha, commit list, measured gate numbers (base jest count vs head), red-then-green evidence for the regression test, file:line of the fix, plus the absolute path of every artifact (report, logs). The report file must open with a ≤10-line executive summary. List `Drive-by fixes:` and `Follow-ups:` separately.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run every gate in the FOREGROUND; never background a gate and wait for a notification (it never comes).
- devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`, gate command LAST in the string, no `| tail`/`; echo` after it (see dse-verify "exit-code footgun").
- Load-sensitive jest suites (settings-tab / settings-preview timeouts): check /proc/loadavg and re-run before believing a timeout red.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-288:`.
