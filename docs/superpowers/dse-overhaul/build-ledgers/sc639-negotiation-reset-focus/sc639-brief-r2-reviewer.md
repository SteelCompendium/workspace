# SC-639 r2 reviewer brief — independent adversarial review of the Reset focus fix

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/decisions.md` (rulings and scope fence — read whole).
- The r1 implementer report: `.../sc639-negotiation-reset-focus/sc639-r1-implementer-report.md` (summary first; body where needed). Do not take its claims on trust: re-measure.
- Precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc642-negotiation-complete-focus-ledger.md` and `sc642-negotiation-complete-focus/sc642-r2-review-report.md` (what the SC-642 review caught).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus/draw-steel-elements`, branch `sc639-negotiation-reset-focus`, head `8ef9b641`, on develop `e1be1775`. Diff: `git -C <plugin> diff e1be1775..8ef9b641`. `git -C <abs path>` for every git command.
- **You never call the tracker.** You do not edit product code; you may write probe tests / scratch specs in your private scratch dir or temporarily in the worktree, but leave the branch exactly as you found it (`git -C <plugin> status` clean at the end; note anything you stashed and restored).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (480 KB, read in parts: battery, devbox, lifecycle/e2e notes incl. the self-disabling-button / click-shield bullet, CURRENT numbers).
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore.

## 2. The task

Execute and probe, not just read. Judge the fix against the ticket and the owner rulings (quote, from the ledger):

> after Reset, focus goes to the NEW card's options button. Fallback only if that button is absent ...: the card root /
> the first focusable control of the card, via the kit helper's fallback chain.

> focus is moved only when it was inside the card before the action ... A Reset with focus elsewhere never pulls focus in.

> Change WHERE focus goes after Reset, not WHAT Reset does ... Do not touch `src/model/NegotiationData.ts`. Stay out of
> SC-649's files ... Reuse `src/framework/kit/controlFocus.ts`.

Probe at least:
1. Real Obsidian, Reading view and Live Preview: Enter- and Space-opened menu → Reset → `document.activeElement` is
   the new ⋮ button, and the next Tab continues inside the card. Check it is stable (still there ~1 s later, after the
   LP remount and any debounced write).
2. Focus elsewhere (another block, the editor, an outside edit, a second negotiation twin in the same note): Reset on
   card A never pulls focus into A, and never moves focus into twin B. Two negotiation blocks in one note must not
   cross-talk.
3. Escape out of the menu without choosing Reset: focus behaviour unchanged vs develop.
4. Untouched negotiation Reset (writes nothing, NEGO-R04): focus outcome.
5. Mouse path. Owner ruling (ledger): focus on the page + mouse Reset stays on the page; focus on a card control (e.g. a seal) + mouse press on ⋮ + mouse Reset lands on the new ⋮ button. Verify both, and report whether a focus ring (`:focus-visible`) shows on ⋮ in the second case — name what you see in words, not colour.
6. Leaks: any listener / stored "was focused" flag that outlives the menu (menu opened then closed by Escape, then a
   later unrelated re-render — does stale state move focus?). Unload/reload of the block.
7. Tests: are the flipped markers and new tests non-vacuous? Revert the fix locally (stash) and confirm the new tests
   go red, then restore.
8. Scope: diff touches nothing in `NegotiationData.ts`, nothing changing what Reset resets, nothing in SC-649's area
   (power roll / motivation matching).
9. Re-run the battery yourself (at minimum jest, the negotiation e2e specs, and a full e2e run; lifecycle all seven
   parts if the diff touches framework code). Expected: r1 measured on 8ef9b641 — tsc/lint clean; jest 13335 passed / 2 skipped fresh (base 13327 + 8); lifecycle 64/64; e2e `OBSIDIAN-E2E done: 603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0/0/24.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Gates — run per dse-verify. Lifecycle in SEVEN parts with `--only=` (EQUALS SIGN; check the log's first lines):
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a`
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40`
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
4. `G-S57,G-S62,G-S61,G-S56`
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
6. `G-S92,G-S96,G-S97,G-S99`
7. `G-S108,G-S112,G-S115` (~200 s: the tool backgrounds it; poll YOUR node pid with `timeout 175 tail --pid=<pid> -f /dev/null`)
Known flakes: G-S91 real unless "host too slow" after two re-runs; G-S115 (g) re-run part 7 once; e2e INIT-W10, SET-X03/X04
flaked once under load; SC-622 `demo-vault/.obsidian/appearance.json` dirt breaks G-S97 — restore it first. Jest timeout 30 s:
"Exceeded timeout" is a real hang until proven otherwise. Fresh worktree needs `npm ci` (already done by r1 — check).

## 4. Footguns

- `devbox run -c <plugin abs path> -- bash <script-file>`; never `cd` in a compound command; record exit codes in the script.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r2-<yourAgentId>/`, unique names, Write tool for files.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**; no `rm` with a variable target. Leave throwaway files.
- Never `pkill`/`killall` by pattern; kill only PIDs whose `/proc/<pid>/cwd` is inside this worktree. SC-649 and SC-631 run gates concurrently.
- One blocking foreground call per gate; no background job you then wait on for a notification.
- Redirect long output to files (600 s stream watchdog).
- Never key a wait-loop on a scratch filename or its contents.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input. Any stray message starts `SC-639:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/sc639-r2-review-report.md` —
≤10-line executive summary first (verdict, counts by severity). Inline if the write is blocked.

## 6. Return contract

Final text to the ticket-owner: raw facts. Verdict (LAND / FIX-THEN-LAND / REWORK), findings by severity with file:line,
measured gate numbers, the revert-probe result, and absolute paths of every evidence artifact.
