# SC-662 r2 — independent adversarial review

You are an independent reviewer (identity R1) for ticket SC-662. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Decisions ledger (current state; rulings quoted below come from it): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/decisions.md`.
- The implementer's report: `.../sc662-sidebar-pending-saves/sc662-r1-impl-report.md` (same dir). Read its executive summary and census; verify its claims rather than trusting them.
- How this was found: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc650-montage-outside-edit-window/sc650-r2-review-report.md` section "(b)" (OOS-1..3) and the probe specs `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/zz-r2-probes.e2e.ts`, `zz-r2-probes3.e2e.ts` (copy them; never edit in place).
- `draw-steel-elements/AGENTS.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, ~490 KB: read in parts — "The battery, in order", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", "Current expected numbers" CURRENT).
- **Workers never call the tracker** (Linear) — not to read, not to post.

Code under review: worktree `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves/draw-steel-elements`, branch `sc662-sidebar-pending-saves`, range `42c26272..5245240c`. Do NOT commit to or rebase this branch. For probes that need a mutated or base build, make your own scratch worktree with `git -C <abs plugin path> worktree add <abs path under your scratch dir> <sha>` and work there (it needs its own `npm ci`). Verify `origin/develop` (after `git -C … fetch origin`) is still `42c26272`; if it moved, say so and review against the new base.

## 2. The task

Ticket requirement (verbatim):

> When the pinned note changes from outside (Sync, another pane), the sidebar refreshes its card in place. That refresh loses data in three ways. [...]
> 1. **Pinned Conditions (`ds-conditions`) overwrites the outside change.** Stage "dazed" in the Conditions window. An outside edit adds "prone". The window closes and saves the staged list over the new note, so the note ends with "bleeding, dazed": "prone" is gone. With nothing staged, the window still closes on any refresh, with no Notice, and focus falls to the page.
> 2. **Pinned stamina bar loses the user's Apply.** Stage 3 damage. An outside edit lands somewhere else in the note. Then press Apply. The window stayed open, but it holds the old copy of the bar, so nothing reaches the note (`temp_stamina` stays 5). Without the outside edit, the same Apply writes.
> 3. **Pinned montage (likely every pinned card) loses its own save.** Press Log in a window. An outside edit lands somewhere else in the note within about 400 ms, before the save is written. The logged action never reaches the note. With a 700 ms gap, it is written.
>
> Expected: no outside change ever drops the outside edit or the user's own save. A window over a card whose block did not change stays open and saves. A window whose block did change closes with the SC-608 Notice.

Rulings (verbatim from the ledger):

- Scott, 2026-11-12, on SC-608: "Option 1" — Option 1 text: "Focus goes to the same control in the reloaded tracker, the one you opened the window from. Anything typed or staged in the window is dropped [...] It cannot overwrite the outside change."
- SC-608 owner ruling: Notice "The note changed outside, so this window closed without saving" (`OUTSIDE_CLOSE_NOTICE`), shown only when the window closed BECAUSE of an outside edit, never on the element's own write.
- Owner: Scope = every element that can be pinned to the sidebar (census first). For each: (a) a pending own write (the 400 ms `persist()` debounce) is never lost by a sidebar refresh; (b) a refresh whose incoming block body equals what the view last loaded or wrote does not rebuild the card (windows stay open, live model stays the live one, Apply writes); (c) a window over a block that DID change closes WITHOUT saving its staged state, shows `OUTSIDE_CLOSE_NOTICE`, and hands focus via `windowHandoff.ts` the way SC-608/SC-650 do; (d) the outside edit is never overwritten. One mechanism, in the sidebar host + windowHandoff.
- Owner: Conflict case (pending own write + outside edit to the SAME block within the debounce): the sidebar must do exactly what a Reading-view card does for the same sequence today. Measure and match.
- Owner: SC-550 (sidebar ds-counter click lost when a note card's save lands within ~400 ms) is the same mechanism; FOLD.
- Owner: Out of scope: SC-663, SC-666, SC-667, SC-656, SC-384. SC-652 (parallel) owns `pipeline.ts`, `collapsedKey.ts`, `prefOverrides.ts`.

Specific asks from the owner (in addition to the list below):

- The implementer's three follow-ups, probe each in real Obsidian on head (and base for comparison): (i) the FormModal edit pencil (pref `authoringControls` on) in the sidebar: open the form, outside edit to the same block and to another block, then Save; does the outside edit survive, does the Save land or say it was dropped? (ii) the stamina bar and hero undo toasts: Catch breath / a recovery, outside edit elsewhere and to the same block, then Undo; (iii) the recoveries popover (pref `staminaRecoveryPopover` on): presses, then an outside edit 50 ms later. For each: data loss or an overwritten outside edit is a finding with severity; otherwise INFO.
- The new `SidebarBlockHost.replaceSource` guard refuses a VIEW write when the note's block is no longer `viewBody`. Probe: does it ever refuse a legitimate write (two quick own presses, an own write right after the host adopted an outside body, a block with `prefs:` / `collapsed:` wrapper keys, CRLF line endings, an unterminated fence at EOF, the block moved by an outside edit above it)? A false refusal loses the user's save with a Notice — HIGH if it happens in normal use.
- `queueExternalChange` serialises refreshes: can a queued change be applied after the anchor was lost or the panel unpinned / closed (write into a gone block, an exception, a leak)?
- G-S61 was red on head and on clean base on the implementer's host (known SC-668, "disk read torn"). Re-run lifecycle part 4 at head; report the host load (`uptime`) next to the result.
- Shared files: `windowHandoff.ts` must be additive only (a parallel ticket SC-656 adds to it). Confirm no existing export changed behaviour.


Execute and probe, do not just read:

1. Independent census: is every pinnable element and every window it can open covered? Verify against the code, not the report.
2. Real-Obsidian probes (e2e harness scratch specs) on head AND base for: OOS-1 (staged + outside edit to the same block; nothing staged + outside edit elsewhere), OOS-2, OOS-3 at 50 / 250 / 700 ms gaps, SC-550, the same-block conflict case (sidebar vs Reading view, same sequence), two pinned same-kind blocks in one note, an outside edit to block A while a window is open on block B, and the sidebar card's OWN write (must never show the Notice, never close its own window). Every scenario: the outside edit text is in the note at the end; the user's save is in the note at the end of every non-conflict scenario; content above/below survives.
3. Does "skip the refresh when the body is unchanged" ever hide a real change (e.g. a change to a key the view does not read, a `prefs:`/`collapsed:` wrapper key, an attribute the sidebar header shows)? Does it ever leave the view's "last loaded" stale so a later write uses an out-of-date drawn-from / pin?
4. Does flushing on refresh ever write into the wrong block, into a block that the outside edit deleted, or twice?
5. Vacuity: run the new tests against base (red) and check the mutants the report lists; add your own where a guard looks untested.
6. Re-run the full battery at head (expected below).

## 3. Gates (full battery at head)

Expected at base `42c26272`: tsc + lint clean · jest **13448 passed / 1 skipped** with the shots cache, plus the branch's new tests · lifecycle **64/64** (65/65 if the branch adds G-S146) · e2e **`622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`** plus the branch's new tests · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24** (last).

- Lifecycle in SEVEN parts with `--only=A,B,C` (EQUALS sign; with a space it runs the whole suite — check the log's first lines). Ids per part in dse-verify row 4. Part 7 ~200 s; the Bash tool backgrounds calls over 180 s: one part per call, output to a unique log + rc via a script file, then `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pid whose `/proc/<pid>/cwd` is your tree) and read the log. Never wait for a background notification.
- Known flakes (re-run once): G-S91 FAIL is real unless it says the host was too slow after two re-runs; G-S115 (g) (SC-633) — re-run part 7 once; INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 under load. SC-622: restore `demo-vault/.obsidian/appearance.json` (`git -C <plugin> checkout --`) before blaming G-S97 on the change.
- Jest timeout is 30 s (SC-568): "Exceeded timeout" is a real hang until proven otherwise. `rm -f main.js styles.css` (literal names, in the plugin dir) before `npx jest`.
- Exit codes: run each gate through a script FILE via `devbox run -c <abs plugin path> -- bash <abs script>` that records `rc=$?` to its own file; read the gate's summary line as truth.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/sc662-r2-review-report.md`. Open with a ≤10-line executive summary: verdict (LAND / FIX), counts by severity, battery numbers, the one-line headline of each HIGH/MED. Then findings by severity (CRIT/HIGH/MED/LOW/INFO) each with file:line, failure scenario, measured evidence (probe id), and a prescribed fix; a probe table (id, scenario, base result, head result); battery; vacuity/mutants; out-of-scope findings (OOS-n) separately.

## 5. Return contract

Final text to the ticket-owner: raw facts — verdict, sha reviewed, severity counts, battery numbers, probe ids — no prose, plus the absolute path of every evidence artifact (report, probe specs, logs, failure bundles copied out).

## 6. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r2-R1/`, uniquely named scripts/logs, created with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad.** Leave throwaway files. No `rm` with a variable path.
- `git -C <absolute path>` for every git command; never `cd X; git …`; `devbox run -c <abs path> -- bash <script file>`.
- Never `pkill`/`killall` by pattern; kill only by PID inside your own tree. Never `rm -rf` a shared `/tmp` glob. Never touch `.superpowers/` outside your report file.
- Never push, never tag. Never edit under `/home/scott/code/steelCompendium/workspace/` except your report. Scott's live vault dirt in the main checkout's dse is expected.
- Name colours in prose (Scott is colourblind).
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts with `SC-662:`.
