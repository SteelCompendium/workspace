# SC-592 r1 — independent adversarial review: plain-string conditions stay plain strings on ds-initiative writes

You are an `orchestration:reviewer`. You did not write this code. Execute and probe — do not just read.
Your final text goes to the ticket-owner, not a human.

## 1. Context loading

1. Ledger (binding rulings — read "Owner rulings on r0" in full):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/decisions.md`
2. Implementer brief (what was asked): `.../sc592-brief-r1-impl.md` in the same dir.
3. Implementer report (executive summary first): `.../sc592-r1-impl-report.md` in the same dir.
4. Survey (root cause and probes): `.../sc592-r0-survey-report.md`; probes in
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r0-survey-R0/` (read-only).
5. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read "The battery, in order"
   through "THE exit-code footgun" (lines ~20-217) only.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite` (branch
`sc592-pool-modal-condition-rewrite` in every submodule). Review range in the plugin: `94133a5a..<HEAD_SHA>` (dse develop moved ec26b709 → 94133a5a, SC-595: DseModal click guard, lifecycle G-S83) (owner fills
in below). Superproject CHANGELOG commit: `<CL_SHA>`. Do not commit to the branch; if you need to mutate source to
probe, do it and restore it exactly (`git -C <abs> diff` must be empty when you finish) or use a separate
`git worktree add` at an absolute path under your scratch dir.

**Workers never call the tracker.** Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
`demo-vault/*.md`) is Scott's live vault — expected; never touch the main checkout.

HEAD_SHA: 1c66c5ca  CL_SHA: 90060d68 (superproject, on f2cb454b)

Owner asks specifically: (1) PROBE the block edit form Save (`FormModal.ts:311-314`) — the implementer did not; (2) judge the "remove then re-add through the plugin comes back as a plain string" behaviour the implementer reports (ledger ruling says plugin-added keeps `- key: x`; owner accepts it as harmless — confirm it is confined to the same in-memory holder and cannot leak across a re-parse or to another holder); (3) the same-key-both-ways fallback to entry identity.

## 2. What to attack

The rule (ledger, verbatim):

> at parse, record per holder (hero / squad-minion instance / regular instance) which condition
> keys the user wrote as plain strings (module-private WeakMap keyed by the holder, same pattern
> as SC-466's `model.ts`). At serialize, a condition entry whose key is in that holder's
> recorded set AND that still carries nothing but `key` is written back as a plain string.
> Everything else is written as today. [...] a condition the plugin adds itself keeps today's output (`- key: x`) [...]
> an object the user wrote as `- key: hexed` stays an object.
> FOLD: authored condition objects keep their unknown keys on write (survey: `source: trap` deleted = data loss).

Probe at least:
- **Integrity of the user's file** (this writes into user notes): content above/below the block survives; two
  `ds-initiative` blocks in one note don't cross-talk (memory keyed per holder — can a holder from block A affect block B?);
  a hand-edit of the block between two plugin writes (string → object, object → string, key renamed) is respected on the
  next write; a re-parse after a write re-records strings (second and third writes stable — idempotence).
- Every writer the survey lists (tracker clicks incl. a no-op select, Conditions modal add/remove/edit, pool modal
  damage Apply and condition removal, block edit form Save): shape preserved where the rule says, promoted where it says.
- Edge cases: duplicates `[grabbed, grabbed]` remove-one; same key as string and as object in one holder; a key the user
  removed then the plugin re-added (string memory must not resurrect a plugin-added entry as a string? — judge against the
  ruling and say what happens); custom (non-registry) conditions; empty/whitespace; `undefined` fields after a modal edit;
  unknown keys on objects survive and in what order; heroes vs squad-minion instances vs regular instances; instance
  regeneration (SC-600, out of scope) not made worse.
- Holder identity: does anything clone holders (structuredClone, spread, JSON round-trip, undo snapshots, sidebar handoff,
  Reset encounter which re-parses — SC-576) so the WeakMap memory is lost or applied to the wrong holder? Find every clone path.
- Tests: are the new jest/e2e tests red on base (`94133a5a`) src and green on HEAD? Mutation-test the fix (e.g. drop the
  "nothing but key" check, drop the unknown-key fold, key memory by entry instead of holder) — each mutant must turn a test red.
  Were any existing assertions weakened rather than updated?
- e2e titles: no bracketed ticket id in any test title.
- Scope: nothing touched outside `src/elements/initiative/model.ts` + tests/fixtures/docs without a reason; no
  quote/comment work (SC-599), no instance regeneration change (SC-600). CHANGELOG bullet is in the worktree superproject,
  plain user-facing words, accurate (does not claim quotes are kept).

## 3. Gates — re-run independently on HEAD

tsc, lint, jest, e2e at minimum (lifecycle and shots/freeze/parity too if the implementer's numbers look off or `src` outside
the model changed). Expected (dse develop 94133a5a baseline): tsc/lint clean · jest 7238 passed / 2 skipped (fresh worktree) + the
implementer's new tests · lifecycle 55/55 (five parts per dse-verify: 21 + 16 + 9 + 4 + 5, part 5 =
`G-S59 G-S49 G-S73 G-S77 G-S83`, G-S56 last) · e2e `(262+N)/(267+N) ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`
(known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592, host-leak 163/978, modal host-leak 39/234,
capture clip 147 · freeze 280/280 · parity 0/0/24. Red-on-base checks are against 94133a5a src.

## 4. Rules and footguns

- **Never `rm -rf` a `/tmp` glob** (an SC-595 worker wiped other efforts' kept lifecycle FAIL dirs today). Delete only literal
  paths you created. No `rm` whose target is a shell variable or glob.
- **Never `pkill`/`killall` by pattern** — kill only a PID inside your worktree (`readlink /proc/<pid>/cwd`).
- `git -C <absolute path>` for every git command. Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; exit codes
  recorded inside script files; output redirected to files; read each gate's summary line. No `cd` inside compound commands.
- Scratch: private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-review-<yourAgentId>/`,
  uniquely named files, written with the Write tool.
- Each gate one blocking foreground call; no `run_in_background`, no Monitor. Never key a wait-loop on a scratch filename or its contents.
- Redirect long-running output to files — the 600 s stream watchdog kills silent agents.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a
  message anyway, its FIRST WORD must be `SC-592:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/sc592-r1-review-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / FIX-REQUIRED), counts by severity, gate lines.
Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix.

Return contract: raw facts — verdict, severity counts, one line per finding, measured gate lines, mutation results, and the
absolute path of every artifact (report, logs, probe scripts).
