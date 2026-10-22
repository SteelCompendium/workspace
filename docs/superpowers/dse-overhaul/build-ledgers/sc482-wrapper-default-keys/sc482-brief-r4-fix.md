# SC-482 r4 brief: fix MEDIUM-2 (`prefs:` + `{}` writes invalid YAML), then the full battery

## 1. Context

- Read the bottom of the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md`. Then read the MEDIUM-2 section of `sc482-r3-check-report.md` in the same dir.
- Use the same worktree, branch, scratch dir and run rules as your earlier rounds, with the new log prefix `k-`. Never call the tracker.
- You may edit `src/framework/prefOverrides.ts` and `src/framework/chrome/collapsedKey.ts` this round. These stay off limits: `src/authoring/FormModal.ts`, `src/framework/host/`, `src/elements/initiative/` and `src/elements/hero/`. SC-493 (the empty raw textarea in the block edit form) is out of scope.
- Before you start, fetch. dse origin/develop should still be `54f8f88` and superproject origin/main `46ae296`. If either has moved, rebase onto it and say so.

## 2. Task

The ruling, quoted from the ledger:

> MEDIUM-2 (a source with only a `prefs:` map (+ ignored keys) returning to defaults is written `prefs:\n  sbDensity: compact\n{}` — invalid YAML -> error card; `src/framework/prefOverrides.ts:145`/`:152`, `src/framework/chrome/collapsedKey.ts:265`; seen in real Obsidian for counter + montage, jest for negotiation; base 54f8f88 passes): FOLD with R's prescribed fix — in both wrappers treat an inner body of exactly `{}` as `''`, then `trimEnd()`. No `FormModal.ts` edit. Tests per R: counter `prefs:` + `title: Deaths` and montage `prefs:`-only each write back just their `prefs:` lines and re-render with no error card; montage `collapsed: false` writes back `collapsed: false`. Wrappers are framework-wide -> full battery.

1. Write the red tests first, through the real write path and then a re-render, and commit them.
2. Make the fix and commit it.
3. Also confirm two things and list them in the report:
   - A block with no `prefs:` or collapse key still writes `{}` when it returns to its defaults (MEDIUM-1 is unchanged).
   - A fully-authored block with `prefs:` still writes byte-identical output.

## 3. Gates: the full `dse-verify` battery on the head

Run every gate in the FOREGROUND as one blocking Bash call: a script file run through devbox, output redirected to a unique `k-*` log, Bash timeout 600000. Never use run_in_background or Monitor, and never wait for a notification. If a gate outlasts the timeout, read its log.

Expected:
- tsc (incl. `tsc -p e2e`) and lint: clean
- jest: 5682 + your new tests passed / 1 skipped / 237 of 238 suites (compare after shots)
- lifecycle: 31/31
- e2e: 95/98 ok, 0 failed, 3 known-bug, coverage 66/66
- shots: 580, plus both text-scale lines
- freeze: `freeze OK (280/280 …)`
- parity: 0 / 0 / 24

## 4. Report and return

Write `sc482-r4-fix-report.md` in the ledger dir. Open it with an executive summary of 10 lines or fewer: shas, bases, test names, gate numbers and the e2e run id. Your final text is raw facts plus paths. If you need input, end with STATUS: NEEDS_CONTEXT. Start any message you send with `SC-482:`.
