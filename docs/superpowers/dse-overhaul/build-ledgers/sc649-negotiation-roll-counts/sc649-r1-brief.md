# SC-649 R1 implementer brief — the negotiation power roll counts only what the card shows

Your final text goes to the ticket-owner, not a human. **You never call the tracker** (Linear) —
not to read, not to post.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc649-negotiation-roll-counts/decisions.md`
  (the ledger — current state of every ruling; it beats anything you infer).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc649-negotiation-roll-counts`, plugin at
  `.../draw-steel-elements` on branch `sc649-negotiation-roll-counts`, cut from dse develop
  `09c879f2`. Verify `pwd` / `git -C <abs> branch --show-current` before any write. NEVER edit under
  `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) — the only thing you write
  there is your report in the ledger dir. The main checkout's dse dirt (`demo-vault/Welcome.md`,
  untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore.
- First: `git -C <plugin abs> fetch origin` and confirm `origin/develop` is still `09c879f2`; if it
  moved, rebase onto it and say so in the report.
- Use `git -C <absolute path>` for every git command, never `cd X && git …`.
- Read the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`,
  ~470 KB — read it in parts: "The battery, in order", "Jest timeouts under load", "Lifecycle and
  e2e notes", "THE exit-code footgun", "Current expected numbers").
- A fresh worktree has no `node_modules`: run `npm ci` once in the plugin dir before the first gate
  (via a script file through `devbox run -c <abs plugin dir> -- bash <script>`, output to a log).

## 2. The task

Ticket: **"Negotiation: the argument's power roll counts a motivation, pitfall or Reuse that the
card does not show as chosen."** Ticket contract, verbatim:

> **Expected:** the tiers and Complete Argument use exactly what the card shows as chosen.

- Case 1 — `currentArgument.motivationsUsed: [Ghost]` where no motivation is named Ghost: no chip is
  pressed, yet the tiers use the motivation table, Same Argument is greyed out ("not while a
  Motivation is appealed to"), and Complete at High writes Interest 4. Same with `pitfallsUsed: [Ghost]`
  (every tier `-1 Interest, -1 Patience`).
- Case 2 — `reusedMotivation: true` with no spent motivation appealed to: the Reuse box is drawn
  unchecked and greyed out, yet the tiers apply the reuse table.

Pointers (from the SC-439 review): `src/drawSteelAdmonition/negotiation/ArgumentView.ts` ~103-111
(`sync` paints only existing chips), ~294-306 (Reuse box `reusable && arg.reusedMotivation`; Same
Argument `disabled: arg.usesMotivation()`), ~336-343 (`mountRoll` passes `usesMotivation()`,
`usesPitfall()`, raw `reusedMotivation` to `ArgumentPowerRoll.build`), ~440 (`resolveArgument` —
Complete uses `byTier` from that roll); `src/model/NegotiationData.ts` ~359-368 (`usesMotivation` /
`usesPitfall` are length-based), ~268 (`argumentReusesMotivation`).

Owner rulings, verbatim from the ledger:

> 1. **Drop the hidden entry from the roll; do not invent UI for it.** "What the card shows as
>    chosen" = the pressed motivation chips (entries of `motivationsUsed` that name a motivation the
>    block has), the pressed pitfall chips (same for pitfalls), and the Reuse box as drawn
>    (`argumentReusesMotivation() && reusedMotivation`). The roll tiers, the Same Argument box's
>    disabled state ("not while a Motivation is appealed to"), and Complete Argument all derive from
>    that, from ONE model-level source (NegotiationData / CurrentArgument), not from the raw lists.
> 2. **Do not rewrite the user's YAML on render.** The stray entry / raw flag stays in the file
>    until the user's own action (a chip toggle, Complete, Reset) writes the argument, consistent
>    with SC-637/SC-638 (keep what the user typed). If the user later restores the motivation's
>    name, the chip shows pressed again and the roll counts it — consistent with the contract.
> 3. Scope fence: SC-640 (duplicate / nameless motivation chips), SC-641 (defaults, Reset), SC-639
>    (Reset focus) and SC-648 (options menu position) are NOT this ticket. If the fix touches
>    name-based matching of chosen motivations, note the SC-640 interaction in the report.
> 4. Evidence: jsdom K11–K13 flip to plain tests; add jsdom tests for Complete Argument's Interest /
>    Patience and the Same Argument disabled state under Case 1, and Complete under Case 2; add ONE
>    e2e scenario (new global id, e.g. `NEGO-A14` after grep) driving Case 1 in real Obsidian.

Notes:
- `CurrentArgument` has no access to the motivation/pitfall lists; the "effective" queries belong on
  `NegotiationData` (or take the lists). Keep the existing name-matching semantics used by the chips
  (`ArgumentView.ts` ~168/186: `motivationsUsed.includes(name)`), including SC-638's typed-value text
  (a `motivationsUsed: [5]` entry matches a motivation named 5) — tests for that already exist; keep them green.
- Every caller of `usesMotivation()` / `usesPitfall()` / raw `reusedMotivation` that feeds the roll or a
  disabled state must go through the effective queries. Grep `src/` to be sure there are no others.
- Flip K11/K12/K13: `test.failing` → `test`, and drop the `[known bug SC-649]` suffix and the
  "SC-649: …never a specific fix" comment wording that no longer applies (keep the helper). Keep their
  `[K11]`… ids. **Never put a bracketed ticket id in any test title** (e2e reads titles for scenario
  ids; ids are global — grep `e2e/` and `test/` before choosing a new one).
- The e2e scenario: a note seeded with Case 1 YAML (or an external edit renaming the appealed motivation)
  — assert the tier rows show the no-motivation tiers, Same Argument is enabled, and picking a tier then
  Complete writes the no-motivation Interest/Patience to the NOTE FILE. Follow `e2e/README.md` and the
  existing `e2e/specs/negotiation/*.e2e.ts` conventions. If it needs a new manifest pair, add it; the
  coverage gate must stay Y/Y.
- Do not touch the options menu / chrome code (SC-648 is in it concurrently).
- Commit after every coherent step (plugin repo only, on your branch; message style `fix(SC-649): …` /
  `test(SC-649): …`). Do NOT bump the superproject pointer and do NOT edit CHANGELOG — the owner does that
  in a later round. No push.

## 3. Gates (dse-verify, full battery; expected numbers)

Baseline at `09c879f2`: jest 13317 passed / 2 skipped fresh (13318 / 1 with the shots cache) ·
lifecycle 64/64 · e2e `591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` · shots 592,
host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after your change: tsc + lint clean; jest = baseline + your new tests (K11–K13 stay counted
as passed); lifecycle 64/64; e2e `592/609 ok, 0 failed, 17 known-bug, coverage: Y/Y` (+1 for your
scenario; known-bug count unchanged since SC-649 has no e2e markers); shots/host-leak/clip unchanged;
freeze 280/280 (0 FAILED); parity 0/0/24. Any other movement must be explained.

Lifecycle runs in SEVEN parts with `--only=` (equals sign! with a space it runs the whole suite),
one part per Bash call, output to a unique log, poll the log/pid:
`G-S7a … G-S9a` (21) · `G-S9b … G-S40` (16) · `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9) ·
`G-S57,G-S62,G-S61,G-S56` (4) · `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) · `G-S92,G-S96,G-S97,G-S99` (4) ·
`G-S108,G-S112,G-S115` (3). Take the exact id lists for parts 1–2 from row 4 of the battery table in the skill (line ~32). Ids comma-separated.
Part 7 takes ~200 s, over the 180 s tool limit — run it with output to a log and poll the pid.

Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs ·
G-S115 (g) suspected flake (SC-633): re-run part 7 once; anything else is real · INIT-W10 e2e (SC-654)
and SET-X03/SET-X04 e2e (SC-657) flaked once under load — re-run that id once with `--only=` and
report both runs · SC-622: if G-S97 fails, check `git -C <plugin> status demo-vault/.obsidian/appearance.json`
and restore it before blaming the change. Jest's timeout is 30 s: treat "Exceeded timeout" as a real hang.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; never `cd` inside a compound command;
  devbox's `sh` wrapper eats `$?` and `| tail` hides failures — record exit codes inside the script file
  and read each gate's summary line.
- Your scratch goes in a private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r1-<your agent id>/`,
  with uniquely named scripts and logs. Use the Write tool for scratch files.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and no `rm` with a
  variable target** — it hangs on a permission prompt. Overwrite with `>` and leave throwaway files.
  Never delete a glob in /tmp (other efforts' lifecycle vaults match).
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is inside
  your worktree.
- Run each gate as one blocking foreground call (split lifecycle/e2e/shots into separate calls), output
  redirected to a file. No `run_in_background` + waiting for a notice, no Monitor — the notice never wakes
  you. If a call must exceed the tool timeout, start it with output to a per-run unique log + rc file and
  poll THAT log/rc file. Never key a wait-loop on a scratch filename or contents that could pre-exist —
  the scratch dir is shared across sessions and a stale log will match.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills
  silent agents.
- `grep` is ugrep with `-I` and reads `e2e/run.mjs` as binary — use `command grep -a` on it.
- Never `--headed` e2e.
- You cannot `SendMessage` me (a depth-2 agent cannot reach its parent; `to: 'main'` goes to the
  dispatcher). If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll
  resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-649:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc649-negotiation-roll-counts/sc649-r1-report.md`.
It must open with a ≤10-line executive summary (verdict, final plugin sha, gate numbers). Then: the design
(where the effective queries live, every call site changed, file:line), the SC-640 interaction note if any,
the new tests by title, each gate's summary line verbatim with its log path, and two lists:
`Drive-by fixes:` (already made — obviously correct, local to a touched file, can't move a baseline) and
`Follow-ups:` (left alone). If the report-file write is blocked, return the report inline.

## 6. Return contract

Your final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin branch + sha, every gate's
measured number, the report path, and the absolute path of every evidence artifact (logs, e2e `.out` bundles
copied out if relevant). No prose.
