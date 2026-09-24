# SC-240 implementation brief (round 1)

You are the implementer for Linear ticket SC-240. **You never call the tracker (Linear)** — not
to read history, not to post. Everything you need is in this brief and the ledger.

## 1. Context loading

- Ledger (authoritative, read FIRST): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error`
- Repo you edit: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements`
  on branch `sc240-scc-ref-error`. **Verify `pwd` / `git -C <repo> rev-parse --abbrev-ref HEAD`
  before any write.** Never edit anything under `/home/scott/code/steelCompendium/workspace/`
  except your report file in the ledger dir. Any workspace-level file you might think to touch
  lives in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/…`) —
  but this task should need none.
- **First step:** inside the dse repo, `git fetch origin && git rebase origin/develop`. Expected
  `origin/develop` = `46c0c4c` (branch currently sits at `0c132d8`, 3 commits behind, no local
  commits). If `package.json` changed across the rebase, `npm ci` (footgun: stale node_modules →
  phantom tsc errors). DSE tracks `develop` — never touch `main`, never create tags/releases.
- Commit after every coherent step (red test, fix, docs). Never leave work uncommitted through a
  gate run.

## 2. The task

Background (from the ticket, found in SC-134's review): builder-emitted `scc.v1:` statblock refs
in the initiative tracker have two UX warts.

**(a) Bogus filename hint.** When an SCC ref can't resolve, `src/elements/initiative/resolveRefs.ts`
(hero loop ~:122, creature loop ~:147) wraps SccRefProvider's good message ("…is not available in
this vault. Sync the compendium…") in the legacy hint "Are there multiple instances of the
'<ref>' file in your vault? If so, please specify the full path." — nonsense for an SCC code.

**(b) Portrait warn noise.** Every builder-created tracker fires
`console.warn("Draw Steel Elements: no portrait image found for …")` per creature
(`src/elements/initiative/view.ts` ~:1180 in `renderPortrait`) because md-dse statblocks carry no
`image` key.

Owner rulings, quoted verbatim from the ledger:

> 1. **(a) Error text.** For a `scc:` / `scc.vN:`-shaped statblock ref that fails to resolve
>    (hero or creature loop in `src/elements/initiative/resolveRefs.ts`), the thrown message must
>    NOT carry the legacy "Are there multiple instances of the '<ref>' file in your vault? If so,
>    please specify the full path." hint. It keeps the "Failed to resolve … statblock reference at
>    index N (<ref>):" lead-in and SccRefProvider's own message (the "…is not available in this
>    vault. Sync the compendium…" text). **Bare-path refs stay byte-identical to the legacy
>    oracle** — the existing pinned assertions in `test/unit/model/initiative-resolve-refs.test.ts`
>    for bare paths are NOT changed; new SCC-shape assertions are added alongside (deliberate
>    contract update, documented in the test header comment).
>    Legacy `src/drawSteelAdmonition/EncounterData.ts` is untouched (legacy oracle).
> 2. **(b) Portrait warn.** Shipping portrait images in md-dse is not an option (the compendium
>    carries no creature art). Since SC-162 a missing portrait already renders a themed fallback
>    glyph (shield for heroes, skull for enemies), so "no image" is a handled, expected state.
>    Ruling: the `console.warn("…no portrait image found…")` in `initiative/view.ts`
>    `renderPortrait` fires ONLY when an image WAS specified (non-empty `imgSrcRaw`) and could not
>    be resolved. No `image:` key → silent (fallback glyph still renders exactly as today). This
>    applies to all rows, not just compendium-sourced ones (absence of an optional field is not a
>    warning anywhere). No visual change.
> 3. No pixels should move. If any shot/freeze byte moves, STOP and report — no rebaseline.

Also check `src/framework/seams/refs.ts` ~:221 (a comment references the hint) and keep comments
accurate. Reuse the existing shape predicate that SC-134 added (`resolveStatblockRef` / its scc
detection) — do not write a second predicate. Check whether the same warn text also fires from
another site (`:741` was cited in SC-134) and apply the ruling consistently to every site.

Tests (TDD, red first, commit the red):
- SCC-shape failure (hero and creature): message contains the SccRefProvider text, does NOT
  contain "multiple instances", still has the "Failed to resolve … at index N (<ref>)" lead-in.
  Prefer driving through the real provider stack like SC-134's negative-control test in
  `test/dom/elements/encounter.test.ts` (builder → tracker with an unsynced code); a unit-level
  case in `initiative-resolve-refs.test.ts` is also expected.
- Bare-path failures: existing byte-exact assertions untouched and green.
- Portrait: a row with no `image` → zero `console.warn` calls from the portrait path and the
  fallback glyph still mounts; a row with an `image` that fails to resolve → the warn still fires
  (spy on console.warn). Prove can-fail: temporarily revert each fix and show the new test red;
  record that in the report.

Docs: add one bullet under `## Unreleased` in the dse repo's `CHANGELOG.md` (user-facing: the
tracker's error for an unsynced compendium creature no longer asks about duplicate files; the
console no longer logs a warning for every creature without a portrait).

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the gate
table near the top, the devbox command shapes, the freeze rules). Run the full battery in order
against the WORKTREE's dse repo, foreground, output redirected to files under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/` with `sc240-`
prefixed names. Use a wrapper script file per gate that captures the exit code (devbox's sh
wrapper eats `$?`/`$PIPESTATUS`; piping a gate into `tail` eats failures). Shape:
`devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements && npm run tsc'`.

Measure the jest baseline on the rebased tree BEFORE your change (record it). Expected numbers
(last recorded, SC-334 landing; develop has added tests since, so your measured baseline wins):
- tsc clean; lint clean, exit 0
- jest: ~3919+ passed / 1 skipped / 202 of 203 suites → after = baseline + your new tests, 0 failed
- shots: 524 PNGs, 0 FAIL
- freeze: `freeze OK (260/260 …)`, exit 0 — `check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`
- parity (LAST): 0 GAPs / 0 undeclared WARNs / 16 DECLARED, exit 0

Never touch `.superpowers/sdd/freeze-baseline.sha256`. Never `rm -rf` anything under
`.superpowers/` except your own `sc240-` files.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-impl-report.md`.
It must open with a ≤10-line executive summary (verdict, final dse sha, gate numbers, can-fail
proofs yes/no). Then: commits (sha + subject), before/after error text for an SCC failure (exact
strings), per-gate numbers with log paths, `Drive-by fixes:` and `Follow-ups:` lists.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts: verdict, final dse sha, measured
numbers, plus the absolute path of every evidence artifact (report, gate logs). No prose.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run every gate in the FOREGROUND (Bash timeout up to 600000 ms). Never
  background a gate and "wait for a notification" — it never comes.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes
  to the top-level dispatcher, not me. If you need input mid-task, end your turn with
  STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-240:`.
- Never run `just deploy*`, never push, never tag.
