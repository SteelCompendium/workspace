# SC-487 implementer report, round 4

**Executive summary**
- **Verdict: DONE.** MEDIUM-R3 folded as ruled. `origin/develop` is still `9f08f06` (no rebase needed); superproject needed none either.
- **Heads:** dse `37f575f` (one new commit on `4ec83ea`; 6 commits on `9f08f06`); superproject `28e03da` (new CHANGELOG commit on `101bfdd`). Not pushed; pointer not bumped.
- **Rule:** `fenceLanguage(info, fenceChar)`, parameter required. With a backtick in the info string: a backtick fence keeps r3's trimmed info (never claimed); a tilde fence returns the first space/tab word (`/^[^ \t]*/`), so `~~~ds-counter \`x\``, `~~~ds-counter x\`y`, `~~~ds-counter<TAB>\`x\`` and the quoted form are `ds-counter` again; `~~~ds-counter\`x`, NBSP / U+200B / `.y` / leading-backtick forms stay unclaimed. `fenceAlias(rest, fenceChar)` required too. Every caller passes `marker[0]` (fenceLine.ts, fenceScan.ts, anchor.ts x2, registration.ts, e2e `noteFences.ts` x2); tsc found the test callers.
- **SC-476 row** in `schemaSuggest.test.ts` reverted (byte-identical to `9f08f06`).
- **Gates at `37f575f`:** tsc + lint rc 0 · jest **5912 passed / 1 skipped / 241 of 242** (5901 + 11) · lifecycle **35/35 ok, 0 failed** · e2e **108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs** · shots **rc 0, 592, 0 FAIL, ran to the end** (pin drift warning, host-copy pin OK, host-leak 678, modal 228, both text-scale lines) · freeze **280/280** · parity **0 gap(s), 0 undeclared, 24 declared**.

## Changes
- `blockPrefix.ts` per the reviewer's candidate patch (without the default argument); doc comment updated.
- Tests (+11): `blockPrefix.test.ts` +10 (tilde rows host parse, anchor alias and direct; the existing backtick test now uses a backtick fence for the alias); e2eIntegrity table +9 rows (tilde `x`, `x\`y`-style, tab, quoted, NBSP, U+200B, `.y`, leading backtick -> claimed/unclaimed); `registration.test.ts` +1 (a `~~~ds-counter \`x\`` block: the host reports `ds-counter`, the pin stamps the anchor, mounts the panel, opening line kept, no Notice). Existing callers in `anchor.test.ts` / blockPrefix / e2eIntegrity updated for the new signature; every backtick-fence row keeps its value.
- Note on one row form: `~~~\`ds-x y` (no space after the tildes) is parsed by the existing `FENCE_MARKER` as a mixed fence run (`~~~\``) with no backtick in the info string, so the leading-backtick tilde rows use `~~~ \`ds-x y`.
- CHANGELOG clause now: "A ``` fence with a backtick on its opening line is not a block in either view and is now left alone too; a ~~~ fence with one is still a block in Reading view, as before, and still pins."

## Drive-by fixes:
none.

## Follow-ups:
1. (carried) SC-471's second lander maps `'unregistered'` in `sendFromCommand` and updates the ```` ```js ```` command test.
2. I ran lifecycle and e2e in one foreground call by mistake once; it passed the 10-minute limit and moved to the background, and I waited for its own log lines. Results are from that single run.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r4/`)
`gate-tsc.log`, `gate-lint.log`, `jest-full.log`, `gate-lifecycle.log`, `gate-e2e.log`, `gate-shots.log`, `gate-freeze.log`, `gate-parity.log`, `jest-p4.log`.
