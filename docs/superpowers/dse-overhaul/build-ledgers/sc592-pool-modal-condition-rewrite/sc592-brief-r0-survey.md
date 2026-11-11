# SC-592 r0 — bounded survey (reviewer): how the pool modal's condition removal rewrites the block, and the fix options

You are an `orchestration:reviewer` doing a SURVEY round. Write NO code, make NO commits.

## Context loading

- Ledger (read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/decisions.md`
- Worktree (read-only for you): `/home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite/draw-steel-elements`
  on branch `sc592-pool-modal-condition-rewrite` at dse develop `ec26b709`. Verify with
  `git -C <abs path> log --oneline -1` — use `git -C <absolute path>` for every git command, never `cd X; git …`.
- Prior art: SC-466 fixed the same class for `ds-stamina-bar` (WeakMap of keys the source omitted;
  serialize drops a key only if omitted AND still default). Ledger:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc466-stamina-bar-defaults-ledger.md`.
  SC-574 (just landed) touched the same removal handler — `src/views/MinionStaminaPoolModal.ts:~674`.
  SC-572 r2 reviewer report (origin of this ticket, INFO-4):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-r2-reviewer-report.md` (grep for INFO-4; don't read it all).
- **Workers never call the tracker** (Linear) — not to read, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected, not yours, never touch it.

## Ticket (verbatim)

> When a condition is removed in the minion pool modal, the whole block is written back. Conditions
> the user wrote as plain strings come back as `{key: ...}` objects, and quotes are dropped. The note
> still works, but the user's hand-written text changes shape when they only meant to remove one
> condition. Decide whether this is intended. If it is not, a removal should change only the
> condition that was removed.

Owner verdict (ledger): NOT intended. Your job is to map the mechanics so I can rule on the fix.

## Questions to answer (with file:line, at ec26b709)

1. **Write path.** From the removal click (`MinionStaminaPoolModal.ts` ~674, `this.persist()`) to the
   bytes in the file: which block is written (initiative block? squad?), which parser normalises
   string conditions into `{key}` objects, which serializer writes them back (`stringifyYaml`?
   custom?). Same for the conditions parsers named in the SC-574 ledger ("both parsers turn strings
   into fresh `{key}` objects").
2. **Blast radius.** Does ANY write through this path (pool modal damage/apply, initiative tracker
   writes, the tracker's own condition add/remove, Conditions modal) already rewrite every condition
   in the whole block the same way — i.e. is this a removal-specific bug or a serializer-wide one?
   List the writers that reach the same serializer.
3. **What exactly changes, byte-wise.** PROBE IT: write a throwaway jest or node script (in your
   private scratch dir, not the repo) that parses a hand-written initiative/squad block with
   (a) plain-string conditions, (b) quoted strings `"grabbed"`, (c) mixed string + `{key: ..., ...}`
   objects, (d) a custom condition, (e) flow-style list `[a, b]`, (f) a YAML comment — removes one
   condition via the same model calls the modal makes, serializes, and diffs. Report every byte
   change category (shape, quoting, list style, key order, comments, other fields elsewhere in the
   block e.g. names or numbers losing quotes). Separate "caused by condition normalisation" from
   "general stringifyYaml re-emit" (the latter happens on every write already).
4. **Options**, each with the layer it lives in, rough size, risk, and what it preserves:
   - A: SC-466-style memory — record each entry's authored shape at parse (e.g. WeakMap entry→was-string)
     and re-emit unchanged string entries as strings.
   - B: keep the original raw array and write back only the surviving raw items (removal-only fix in
     the modal/model).
   - C: format-preserving surgical edit of the YAML document (does the codebase already have a
     `yaml` Document/CST helper or a fence-locating writer that could do this? SC-457 touched
     `src/framework/host/` fence locating).
   - anything better you find.
   Say which one makes "a removal changes only the condition that was removed" true for shape AND
   quotes, and which only for shape. Is quote preservation achievable without option C?
5. **Existing tests** that pin the current normalised output (would need updating) — file:line.
6. Related tickets in the same class to mention: SC-466 (landed), SC-482 (other ComponentWrapper
   elements leak defaults), SC-483. Note if any already covers the initiative block.

Bound: this is a survey, not a full review. Stop at ~60 tool calls. No battery runs.

## Rules

- Scratch: a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r0-survey-<yourAgentId>/`
  with uniquely named files. Write scratch files with the Write tool. No `rm` with variables or globs;
  never `rm -rf` any `/tmp` glob. Leave your scratch in place.
- Devbox: Node is not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite/draw-steel-elements -- bash <script-file>`;
  no `cd` inside compound commands. Redirect long output to a file. If you run jest, `rm -f main.js styles.css`
  in the plugin root is NOT needed for a targeted probe — use `npx jest <path>` with output to a file.
- Never `pkill`/`killall` by pattern.
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question.
  If you ever do send a message anyway, its FIRST WORD must be `SC-592:`.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/sc592-r0-survey-report.md`.
It must OPEN with a ≤10-line executive summary: root-cause layer, blast radius (removal-only vs every
write), recommended option and why, whether quotes are preservable cheaply.

Return contract: your final text goes to the ticket-owner, not a human — raw facts (answers 1-6 in
one line each, recommended option), no prose, plus the absolute path of every artifact you produced
(report, probe scripts, probe output).
