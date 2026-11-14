# SC-637 r1b — fold round (resume of the r1 implementer)

Same worktree, branch, footguns and report rules as `sc637-r1-implementer-brief.md` (re-read its sections 3-4). Base
stays dse `origin/develop` `7b9e82cf` — fetch and confirm; rebase if it moved and say so.

Owner ruling, verbatim from the ledger:

> **Unknown keys inside `currentArgument:` — FOLD** (same bug, same file, small). Unknown keys inside
> `currentArgument:` survive writes like the other levels (known keys in the existing order, then unknown in
> original order) for as long as that argument exists. When a write replaces or clears the current argument
> (whatever Complete Argument / Reset already do to it), its unknown keys go with it — they belong to that argument.

Do:

1. Carry unknown keys inside `currentArgument:` with the same WeakMap mechanism you used for the other levels. Do not
   change what Complete Argument / Reset do to the argument itself; only make the extras follow the argument's own
   lifetime. If `currentArgument` is replaced by a new object on some write that keeps the "same" argument (e.g. a
   motivation toggle inside the argument rebuilds it), the extras must follow it.
2. Tests: unit + jsdom, failing on `7b9e82cf`: extras inside `currentArgument` survive every write that keeps the
   argument (state which paths those are); extras are gone after a write that clears / replaces it (state which);
   order known-then-unknown; hostile keys (`__proto__`, `constructor`, `toJSON`, a key named like an argument field
   alias if any) do not pollute or shadow. One e2e only if a real-Obsidian path is not covered by jsdom — use a new
   free `NEGO-*` id, no bracketed ticket id in any title.
3. If the CHANGELOG bullet should mention the argument level, amend the superproject CHANGELOG commit (still one
   commit, still no pointer bump).
4. Write the SKILL proposal file `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-skill-proposal.md`
   (≤10-line summary first): your proposed dse-verify text (the known-bug count lines that change because SC-637's
   markers are gone, the CURRENT jest/e2e numbers after this branch, and the "fresh worktree has no node_modules: run
   `npm ci` in draw-steel-elements before the first gate" footgun).
5. Gates on the final head: tsc, lint, jest (fresh), e2e (full run). Lifecycle is NOT required this round (the
   reviewer re-runs the full battery). Check `styles.css` sha256 is still `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
   Expected: jest 12702 + new / 2 skipped; e2e `0 failed`, 18 known-bug, coverage 287/287 (ok/total + new e2e).

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r1b-fold-report.md`,
≤10-line executive summary first (shas, numbers), then tests added (id, file, fails-on-base), paths changed, logs.
Never `rm` anything in /tmp or the scratchpad. Final text to the owner: raw facts, shas, numbers, artifact paths.
