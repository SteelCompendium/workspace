# SC-662 r1 — implement: the pinned sidebar never loses a pending save or an outside edit

You are an implementer for ticket SC-662. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the decisions ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/decisions.md`. It is the current state; the ticket text and rulings below are quoted from it.
- Read the SC-650 ledger and its review (how this was found, and the montage fix you build on):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc650-montage-outside-edit-window-ledger.md`
  and `.../build-ledgers/sc650-montage-outside-edit-window/sc650-r2-review-report.md` section "(b)" (OOS-1..3) and the probe table rows MPRB-50/51/52, MPRC-10/12, MPRD-02..04.
- The reviewer's real-Obsidian probe specs that reproduced OOS-1..3 (starting material for your e2e tests; copy, never edit in place):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/zz-r2-probes.e2e.ts` and `zz-r2-probes3.e2e.ts` (same dir).
- Prior art: `src/framework/chrome/windowHandoff.ts` (SC-608/SC-650), `src/framework/sidebar/SidebarPanel.ts` (`handleExternalChange`), `ElementView.persist()` / `flushPendingWrite()` (400 ms trailing debounce, SC-517/SC-570), the drawn-from/pin write rules (SC-556/SC-607/SC-612; ledgers in `docs/superpowers/dse-overhaul/build-ledgers/`).
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, ~490 KB: read it in parts — "The battery, in order", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", "Current expected numbers" CURRENT entry).
- **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in these files.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves` — plugin at `.../draw-steel-elements`, branch `sc662-sidebar-pending-saves`, on dse `develop` `42c26272`. Verify `pwd`/`git -C <abs> rev-parse HEAD` before any write. Before you start: `git -C /home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves/draw-steel-elements fetch origin` and confirm `origin/develop` is still `42c26272`; if it moved, rebase onto it and say so. The fresh worktree has no `node_modules`: run `npm ci` once first (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout). Workspace-level files live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves/...`) — but you do not need any workspace-level edit this round (no CHANGELOG; the owner does that later). The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: expected, ignore it.

## 2. The task

Ticket requirement (verbatim):

> When the pinned note changes from outside (Sync, another pane), the sidebar refreshes its card in place. That refresh loses data in three ways. All three were measured in real Obsidian and happen the same way on dse develop before SC-650.
>
> 1. **Pinned Conditions (`ds-conditions`) overwrites the outside change.** Stage "dazed" in the Conditions window. An outside edit adds "prone". The window closes and saves the staged list over the new note, so the note ends with "bleeding, dazed": "prone" is gone. With nothing staged, the window still closes on any refresh, with no Notice, and focus falls to the page.
> 2. **Pinned stamina bar loses the user's Apply.** Stage 3 damage. An outside edit lands somewhere else in the note. Then press Apply. The window stayed open, but it holds the old copy of the bar, so nothing reaches the note (`temp_stamina` stays 5). Without the outside edit, the same Apply writes.
> 3. **Pinned montage (likely every pinned card) loses its own save.** Press Log in a window. An outside edit lands somewhere else in the note within about 400 ms, before the save is written. The logged action never reaches the note. With a 700 ms gap, it is written.
>
> Expected: no outside change ever drops the outside edit or the user's own save. A window over a card whose block did not change stays open and saves. A window whose block did change closes with the SC-608 Notice.

Ticket agent notes (verbatim): Cause: `src/framework/sidebar/SidebarPanel.ts:321` `handleExternalChange` → `previous.update(model)`. It tears down child components (a window owned by ConditionsPanel closes and its `onClose` persists into the replaced model: `src/elements/conditions/panel.ts:165-185`), and it leaves windows owned by the view on the old model (`src/elements/stamina-bar/view.ts:159-167`). The hero sheet has the same shapes (`hero/view.ts:384`, `:561`; code-read only). Direction: in `handleExternalChange`, call `previous.flushPendingWrite()` before preparing the model, and skip the refresh when the incoming body equals what the view last loaded or wrote. Every element that holds a window adopts the SC-608/SC-650 sidebar rule: keep the window when the block is unchanged, otherwise close it with the Notice before replacing the model.

Inherited rulings (verbatim from the ledger):

- Scott, 2026-11-12, on SC-608: "Option 1" — Option 1 text: "Focus goes to the same control in the reloaded tracker, the one you opened the window from. Anything typed or staged in the window is dropped [...] It cannot overwrite the outside change."
- SC-608 owner ruling (not vetoed at landing): Notice "The note changed outside, so this window closed without saving" (`OUTSIDE_CLOSE_NOTICE`), shown only when the window closed BECAUSE of an outside edit, never on the element's own write.

Owner rulings (verbatim from the ledger):

- Scope = every element that can be pinned to the sidebar (census first), not only the three named. For each: (a) a pending own write (the 400 ms `persist()` debounce) is never lost by a sidebar refresh; (b) a refresh whose incoming block body equals what the view last loaded or wrote does not rebuild the card (windows stay open, live model stays the live one, Apply writes); (c) a window over a block that DID change closes WITHOUT saving its staged state, shows `OUTSIDE_CLOSE_NOTICE`, and hands focus via `windowHandoff.ts` the way SC-608/SC-650 do; (d) the outside edit is never overwritten. One mechanism, in the sidebar host + windowHandoff; no per-element ad-hoc copies where a shared path fits.
- Conflict case (pending own write + outside edit to the SAME block within the debounce): the sidebar must do exactly what a Reading-view card does for the same sequence today (the SC-556/SC-607/SC-612 drawn-from / pin rules). Measure the Reading-view behaviour first and match it. If Reading view itself silently loses a committed save there, report it as a follow-up; do not redesign the write rules in this ticket.
- SC-550 (sidebar ds-counter click lost when a note card's save lands within ~400 ms) is the same mechanism (the note card's write is an outside change to the sidebar). FOLD: reproduce it, it should be fixed by (a); add a test. If fixed, the owner closes SC-550 as fixed by SC-662.
- Hero sheet (`hero/view.ts:384`, `:561`): in scope only if `ds-hero` can be pinned to the sidebar (census answers it). If it can't be pinned, report only.
- Out of scope: SC-663 (sidebar Add a hero width), SC-666, SC-667, SC-656, SC-384. Parallel SC-652 owns `pipeline.ts`, `src/framework/chrome/collapsedKey.ts`, `src/framework/prefOverrides.ts` — do not edit them; if the fix needs one, stop and report (NEEDS_CONTEXT).

Steps:

1. **Census** (write it into your report): every element type that can be pinned (experimental switch on), and for each, every window/modal/popover it can open from the sidebar card, who owns it (the view or a child component), and what its close path does (persist? discard?). Include SC-650's montage and SC-608's initiative as already-handled rows.
2. **Red first.** Before any product change, write the failing tests at `42c26272`: jsdom (sidebar host tests, see SC-650's OW24/OW25/OW30 for the shape) AND real-Obsidian e2e under `e2e/specs/sidebar/` for OOS-1, OOS-2, OOS-3 and SC-550 at minimum. Record red-on-base counts. e2e tests that encode the fix should be plain tests in the final branch (they go red on base, green on the branch); if you need to land an interim known-bug marker don't — just record red-on-base.
3. Fix, per the rulings. Then integrity probes (this writes into user files): content above and below the block survives; two pinned same-kind blocks in one note don't cross-talk; an outside edit to block A doesn't close/disturb a window on block B; the outside edit text is present in the note at the end of every scenario; the user's own save is present at the end of every non-conflict scenario.
4. Mutants: for each mechanism you add (flush-before-refresh, skip-identical-refresh, close-without-save, Notice), revert it alone and show a named test going red. Use literal times in tests (never the product's 400 ms constant), fake timers per the dse-verify "Jest timeouts under load" rules.
5. Commit after every coherent step (`git -C <abs plugin path> commit`), with messages `fix(SC-662): …` / `test(SC-662): …` / `docs(SC-662): …`. Update the plugin's own docs where the sidebar/window behaviour is described (e.g. `docs/architecture.md` if it describes the sidebar refresh). Do NOT push anything, anywhere.

Test-title rule: the e2e runner reads test titles for scenario ids and scenario ids are global — pick fresh ids (e.g. `SIDE-OE01…`; grep to confirm unused), and never put a bracketed ticket id like `[SC-662]` in a test title. If you add a lifecycle scenario, its id is `G-S146` (and G-S56 stays LAST in SCENARIOS order).

## 3. Gates (dse-verify, full battery at your final head)

Expected at base `42c26272`: tsc + lint clean · jest **13448 passed / 1 skipped** with the shots cache (your new tests add to that; a fresh worktree reads one fewer passed and 2 skipped until shots has run) · lifecycle **64/64** (65/65 if you add G-S146) · e2e **`622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`** plus your new tests (new manifest pairs only if you add controls; coverage must stay Y/Y) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24** (last).

- Lifecycle runs in SEVEN parts with `--only=A,B,C` (EQUALS sign — with a space the runner silently runs the whole suite; check the log's first lines). Exact ids per part are in dse-verify row 4. Part 7 (`G-S108,G-S112,G-S115`) takes ~200 s. The Bash tool backgrounds any call over 180 s: run one part per call with output to a unique log + rc file via a script file, then wait with `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pid whose `/proc/<pid>/cwd` is your worktree) and read the log. Never wait for a background-completion notification — it does not wake you.
- e2e full run and shots can exceed 10 minutes under load: start with output to a unique log + rc file and poll that log/rc, never a notification.
- Known flakes (re-run once before believing): G-S91 FAIL is real unless it says the host was too slow after two re-runs; G-S115 (g) suspected flake (SC-633) — re-run part 7 once; INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 e2e flake under load. SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty, which fails G-S97 — `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change.
- Jest's timeout is 30 s since SC-568: an "Exceeded timeout" is a real hang until proven otherwise. `rm -f main.js styles.css` in the plugin root (literal path) before `npx jest`.
- Exit codes: devbox eats `$?`. Run each gate through a script FILE (`devbox run -c /home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves/draw-steel-elements -- bash <abs script>`) that writes `rc=$?` to its own rc file, and read the gate's own summary line as the truth.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/sc662-r1-impl-report.md` (this one file in the shared ledger dir is the only write you make under `workspace/`). It must OPEN with a ≤10-line executive summary: verdict, final sha, the battery numbers, red-on-base counts, mutant results, census headline. Then: census table, design (what changed where, file:line), conflict-case measurement (Reading view vs sidebar), integrity probe table, mutant table, `Drive-by fixes:` (already made, obviously correct, local) and `Follow-ups:` (left alone, with why).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), final sha + commit list, measured gate numbers, red-on-base counts, mutant results — no prose. Plus the absolute filesystem path of every evidence artifact you produced (report, logs, failure bundles you copied out).

## 6. Footguns (each cost real time once)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Scratch: use a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r1-I1/` with uniquely named scripts and logs; create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers this wave hung on a permission prompt doing that). Leave throwaway files in place. No `rm` with a variable path ever. (`rm -f main.js styles.css` inside your worktree plugin dir, as literal relative names in your gate script, is the one exception the jest protocol needs.)
- Every git command is `git -C <absolute path>`, never `cd X; git …`. Never `cd` inside a compound command; use `devbox run -c <abs path> -- bash <script file>`.
- Never `pkill`/`killall` by pattern: kill only by PID whose `/proc/<pid>/cwd` or command line is inside your worktree. Never `rm -rf` a shared `/tmp` glob (other efforts' lifecycle vaults live there). Never touch `.superpowers/` outside your report file.
- Never push anything to origin, including a feature branch. Never tag.
- Name colours in prose in any report text (Scott is colourblind).
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-662:`.
