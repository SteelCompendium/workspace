# SC-638 r1 — implementer brief: negotiation reads hand-typed wrong-type values without a raw error or data loss

## 1. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/decisions.md`.
  It is the current state of every decision. Its "Owner rulings" R1–R4, Scope and Markers are binding; quote, don't
  reinterpret.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in this brief and
  the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values`, branch
  `sc638-negotiation-wrong-type-values` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/draw-steel-elements`.
  Verify `git -C <abs> branch --show-current` before any write. **Never write under
  `/home/scott/code/steelCompendium/workspace/`** except your report into the ledger dir. The workspace-level
  `CHANGELOG.md` you edit is YOUR worktree's:
  `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/CHANGELOG.md` — never the one under
  `/home/scott/code/steelCompendium/workspace/`. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not yours, don't touch or report it.
- Base: dse `develop` @ `620d5774` (the branch already sits there); superproject on workspace main `28ed9439`. Run
  `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `620d5774`; if it moved, rebase onto it
  and say so in the report.
- **Fresh worktree: no `node_modules`.** Run `npm ci` once in the plugin dir (through
  `devbox run -c <plugin abs path> -- bash <script file>`, output to a log) before the first gate.
- **Prior art (landed):**
  - SC-637 (negotiation writes keep unknown keys, in `620d5774`): ledger
    `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc637-negotiation-unknown-yaml-keys/decisions.md`.
    Its design: unknown keys live in a module-private WeakMap in `src/model/NegotiationData.ts` (no own props on the
    model). Your R2 (untouched values written back as typed) must coexist with it — never put a non-schema own
    property on the model or its entries (the serializer would write it).
  - SC-439 (negotiation e2e, filed this ticket): ledger
    `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc439-e2e-negotiation-ledger.md`
    — grep it for `SC-638`. Fixtures `e2e/vaults/shipped/Negotiation/wrong-name.md`, `fraction.md`; e2e
    `e2e/specs/negotiation/wrong-values.e2e.ts` (NEGO-W02, NEGO-W03); jsdom `test/dom/elements/negotiation-bugs.test.ts`
    (K03, K04).
  - Error-card precedent: `src/elements/encounter/model.ts` ~line 98 (`Invalid data: 'monsters' field must be a
    list.`), `src/elements/party/model.ts:71`, `src/elements/conditions/model.ts:59`; card drawn by
    `src/framework/errorCard.ts`.
- Read the `dse-verify` skill's battery table and notes:
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-244 (some lines are very
  long; read with `cut -c1-2000`), plus the "Current expected numbers" CURRENT paragraph (grep `## Current expected`).

## 2. The task

Fix every input listed in the ledger's "Ticket" section (case 1, case 2, and the three added by the SC-637 owner's
comment), exactly per the ledger's Owner rulings, quoted here:

> **R1. Scalar where text is expected → read as text.** A number or boolean in any text field (`name`, a motivation's /
> pitfall's `name` and `reason`, `i0`..`i5`, each entry of `motivationsUsed` / `pitfallsUsed`) is read as its text
> (`2024` → "2024"). A map or list in a text field is malformed → R3. `null` / absent keeps today's behaviour.

> **R2. Untouched values are written back as typed.** A value the negotiation did not change on that write is written
> back with the same value AND type the user typed: `name: 2024` stays `name: 2024`, never `name: "2024"`. Matching by
> name (a motivation chip ↔ `motivationsUsed`, `hasBeenAppealedTo`, reuse detection) compares the TEXT, so
> `motivationsUsed: [5]` matches a motivation with `name: 5`. (Value-level only: formatting, comments and quotes stay
> SC-599's, untouched — same boundary as SC-637's ruling.)

> **R3. Wrong-shaped structure → a plain error card naming the key; the card writes nothing.** Precedent: encounter /
> party / conditions throw `Invalid data: 'monsters' field must be a list.` and the pipeline's error card shows it.
> Same form here. Covers: `motivations` / `pitfalls` that is not a list (text, map, number); an item of either list
> that is not a map (`-` blank / null, `- Legacy`, a number, a list) — the message names the list and the item's
> position (1-based); `currentArgument` that is not a map; `motivationsUsed` / `pitfallsUsed` that is not a list; a map
> or list in a text field (R1). Because the card is an error card, no control exists to write the block, so `- Legacy`
> and `currentArgument: hello` are no longer lost. No raw JavaScript message (`is not a function`, `Cannot read
> properties`, `_a.`/`_g.`) ever reaches the card for any of these inputs. The YAML-parse error path (`Invalid YAML
> format: …`) is unchanged.

> **R4. One reading of a standing for both the seal and the ending.** The seal drawn today is the truth: `ending()`
> (and anything else that decides "deal / hostile / final offer / live") reads each standing exactly as the seal
> display reads it (clamp 0..5, `Math.round`, non-number → 0 — whatever `kit/track.ts` + `clampStanding` do today; one
> shared function, not two copies). Results: `current_interest: 0.4` → seal 0 and hostile (ended); `4.5` → seal 5 and a
> deal; `current_patience: banana` → Patience 0 and the final offer. The drawn seal does not change for any input; only
> the ending follows it. The +/- behaviour of `advanceStanding` on a non-number is not changed by this ticket.

Scope and markers (also from the ledger, binding):

> **Scope: negotiation only.** No montage code (SC-628 is the montage twin, separate ticket). Out of scope: SC-639,
> SC-640, SC-641, SC-642, SC-648, SC-649, SC-599, SC-652. SC-640 is named in the same `wrong-values.e2e.ts` header —
> leave its markers alone. Do not extract a shared helper out of montage or another element; a negotiation-local helper
> (or reuse of an existing framework one) is fine.

> **Markers:** NEGO-W02, NEGO-W03 (e2e) and K03, K04 (jsdom) flip to plain tests (remove the `knownBug` /
> `test.failing` wrapper and the "[known bug SC-638]" title suffix); their assertions stay as written unless they
> contradict R1–R4. New tests for every input in the ticket and the comment, at unit + jsdom level, and e2e for the two
> data-loss inputs (`- Legacy`, `currentArgument: hello`: the card shows the plain error naming the key and the note is
> byte-identical after the test's interactions) and for one R2 round trip (`name: 2024` stays `2024` after a seal
> click). New e2e ids continue the existing families (next free: NEGO-W08…, NEGO-X14…); never a bracketed ticket id in
> a test title.

Also:
- Every write path must still keep SC-637's unknown keys (its tests must stay green), and the sidebar host
  (`SidebarBlockHost.ts` uses `NegotiationData`) gets the same reading as the card.
- Check where the parse-time throw surfaces (which error-card stage it shows) and keep it consistent with encounter's.
- Integrity probes (required, at jsdom or e2e level): for an R2 value, content above and below the fence survives a
  write; two negotiation blocks in one note do not cross-talk (one malformed, one valid: the valid one still writes and
  the malformed one's text is unchanged).
- Each test you add must FAIL on base `620d5774` where the bug exists (state "fails-on-base yes/no" per test).
- Commit after every coherent step (fix + unit, jsdom, e2e flip + new e2e, fixtures/README). Commit messages end with
  `(SC-638)`; no AI attribution or co-author trailers. CHANGELOG: one user-facing bullet under `## Unreleased` in the
  worktree superproject, committed there; **no pointer bump** (the owner does that at land-ready). Update
  `e2e/README.md`'s fixture table rows for `wrong-name.md` / `fraction.md` (they describe the bug) and add rows for new
  fixtures.

## 3. Gates (dse-verify) — expected numbers at dispatch (CURRENT @ `620d5774`)

tsc and lint clean · jest **12913 passed / 2 skipped** fresh (12914 / 1 with the shots cache) · lifecycle **64/64** ·
e2e **`OBSIDIAN-E2E done: 567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`** · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

After your change expect: jest = 12913 + your new tests (fresh; flipped `test.failing` already count as passed), 2
skipped; e2e **known-bug 24 → 22**, ok = 569 + new e2e, total = 591 + new, `0 failed`, coverage 416/416 (an error card
adds no control; if Y changes, explain); lifecycle 64/64.

- Run in order: the literal `rm -f` of the two build files (below), then tsc, lint, jest, lifecycle (seven parts), e2e.
- **Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign — with a space the runner runs the whole suite)**, one
  part per Bash call, comma-separated ids:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3) — about 200 s
  Check the ids against the runner's SCENARIOS list before the first run (the union must be all 64; check the first
  lines of each log print only that part's ids). Any Bash call over 180 s is moved to the background by the tool:
  start each part with output to a unique log in your private scratch dir, then poll the log / your OWN node pid
  (`readlink /proc/<pid>/cwd` must be your worktree's plugin dir) with `timeout 175 tail --pid=<pid> -f /dev/null`.
  Never wait for a completion notice.
- No new lifecycle scenario is expected. If you need one, the free id is `G-S131` — say so in the report.
- Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 cell (g) only
  (SC-633): ONE re-run of part 7 on a loaded host; any other failure is real. If G-S97 fails, first check
  `git -C <plugin> status demo-vault/.obsidian/appearance.json` — the camera tool can leave it dirty (SC-622); restore
  it with `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` and re-run before blaming code. INIT-W10
  (e2e) flaked once under heavy load (SC-654): re-run it alone with `--only=INIT-W10` once; then the full run must still
  end `0 failed`.
- Jest timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise (re-run that suite alone).
- e2e page-side strings (SC-637): inside a TS template literal passed to `dse.externalEdit(...)`, write `\\n` for a
  newline in the page-side string.
- **Shots / freeze / parity:** if your change touches no CSS, build once and compare `styles.css` against a clean
  `620d5774` build (sha256). If byte-identical, shots/freeze/parity carry — say so with both hashes. If not, run them.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/draw-steel-elements -- bash <script file>`.
  `$?` echoed inside `bash -c '…'` is ALWAYS 0 — record exit codes from a script FILE, and read each gate's own
  summary line (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`). Never pipe a gate into `tail`.
- Never `cd` inside a compound command; use absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/`
  with uniquely named scripts/logs. Create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (and no `rm` with a shell variable in
  its path, no glob `rm` anywhere) — two workers this wave hung on a permission prompt doing that. Leave throwaway
  files in place; overwrite with `>` or use fresh names. The only allowed `rm` is the literal
  `rm -f /home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/draw-steel-elements/styles.css`
  before jest.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your own report file below.
- Run each gate as a blocking foreground call where it fits under 180 s; otherwise the log + pid poll above. No
  `Monitor`, no waiting on notifications. Redirect long output to files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — use per-run unique paths and your own
  pid.
- In agent shells `grep` is ugrep and skips `e2e/run.mjs` as binary; use `command grep -a`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question;
  I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-638:`.
- Do not edit `.claude/skills/dse-verify/SKILL.md`. If its notes need an update (e.g. the e2e CURRENT line), write the
  proposed text into your report.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/sc638-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (verdict, final dse sha, superproject CHANGELOG sha, gate numbers).
Then: a table of every input from the ledger's Ticket section → what the card now shows / writes; the design for R2
(where the typed value is kept and why it cannot leak into the serialized YAML) and R4 (the one shared reading); every
test added (id, file, fails-on-base yes/no); gate log paths; `styles.css` hashes; `Drive-by fixes:`; `Follow-ups:`;
proposed SKILL.md text.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas (dse branch head, superproject
CHANGELOG commit), measured numbers per gate — no prose, plus the absolute path of every evidence artifact you produced
(report, gate logs).
