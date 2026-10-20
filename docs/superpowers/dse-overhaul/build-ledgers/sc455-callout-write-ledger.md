# SC-455 decisions ledger — DSE blocks inside a callout / blockquote: writes land

Ticket-owner: Opus 5.5 (Scott's choice), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc455-callout-write (every submodule on branch `sc455-callout-write`).
dse base: `develop` @ 6bcf9c8 (dse-verify CURRENT row, 2026-10-19). Workspace main 724c7a1.

## Spec (ticket description, verbatim, 2026-10-19)

> Found by the SC-290 review (INFO-3). A DSE block nested in a callout or blockquote (each line prefixed with `> `) renders and accepts clicks, but `ReadingModeBlockHost` never writes the change back to the note, and no Notice tells the user. The state silently reverts on the next re-render.
>
> This predates SC-290 (output identical on its base).
>
> Decide: support writes through the `> ` prefix, or show a Notice saying the block can't be edited there.
>
> Where: `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts` ~438-472 (at SC-290's head). Context: `.superpowers/sdd/sc290-info-string/sc290-review-report.md` INFO-3.

SC-290 review INFO-3 (verbatim): "`OPEN_FENCE` is anchored at column 0, so `> ```ds-counter extra` never parses. `knownLanguage` stays null, which gives `'abort'` and `replaceSource` returns false with no Notice."

## Scott rulings

(none yet — 2026-10-19: ticket has no comments)

## Owner rulings

- 2026-10-19 (owner, the ticket's "Decide"): **Support writes through the `> ` prefix.** Reason: a control that renders and accepts clicks but silently discards the change is exactly what `docs/working-preferences.md` "UI principle: explicit read-only states" forbids, and Scott's "do the right thing over minimizing work" rule picks real support over a Notice when support is feasible. Scope:
  1. Blocks whose fence lines and body carry a blockquote prefix: plain blockquotes and callouts (`> [!note]` …), nested to any depth (`> > `), with or without the space after `>` (`>` alone on an empty body line too). The write re-emits the block's own prefix on every line it writes and leaves every other byte of the note (callout header, other callout lines, other blocks, line endings per SC-453) byte-identical.
  2. Every DSE write path that rewrites or locates an existing block: `ReadingModeBlockHost` (Reading view and Live Preview writes), `SidebarBlockHost` + sidebar `registration.ts` body splice, anchor (`_dse_anchor`) stamping/lookup, and any other site the survey finds.
  3. **No silent failures remain.** Any write that still cannot land (an unparseable or ambiguous location, or a nesting shape we do not support, e.g. a fence indented inside a list item) shows a Notice saying the block could not be saved, instead of returning false silently.
  4. Any nesting shape left unsupported is documented in the plugin's user-facing site docs as "what works / what doesn't yet" (Scott's 2026-08-16 deferred-functionality rule), and gets a Backlog ticket from the owner.

## Round log

- 2026-10-19: Worktree created (`just wt-new sc455-callout-write`), dse cut at 6bcf9c8. R1 implementer (orchestration:implementer, id a1e8024…) dispatched on `sc455-brief-impl.md`. Reviewer must be a different identity. (Live session task dir is 1efbabcf-839e-4390-b636-65140a046f71; scratchpad id be71a0a9-199f-4e14-967b-191935312b05.)
- 2026-10-19 (dispatcher): dse origin/develop moved 6bcf9c8 -> d58cf6a (SC-427: StaminaEditModal / MinionStaminaPoolModal clamping + Apply label; workspace main 2b9b29d). "Land-ready must be on d58cf6a." New base numbers: jest 4950 passed / 1 skipped / 229 of 230 suites · lifecycle 26/26 · e2e 71/76 ok, 0 failed, 5 known-bug, coverage 51/51 pairs · shots 572 + pressed-toggle parity line · freeze 276/276 · parity 0/0/24 DECLARED. Owner: SendMessage to R1 implementer to rebase onto d58cf6a before its final battery; review brief numbers updated to d58cf6a.
- 2026-10-20: R1 DONE at dse e4f60eb on d58cf6a (8c14c95 d17445a efa3e9a 0eade9f 99ad387 e4f60eb). jest 5024/1/230 of 231 · lifecycle 27/27 (new G-S11) · e2e 80/85 0 failed 5 known-bug 51/51 · shots 572 + pressed line · freeze 276/276 · parity 0/0/24. FAIL-on-base: jest 48/53 new (+23 blockPrefix suite unloadable), e2e callout 0/9, G-S11 FAIL.
- 2026-10-20: Owner rulings on R1 follow-ups:
  1. List-indented fences (unsupported; Notice + docs) -> filed SC-461 (Backlog, related SC-455). OUT OF SCOPE.
  2. LP click inside a callout opens the callout as source (write lands) -> filed SC-463 (Backlog). OUT OF SCOPE.
  3. Authoring inserts lose `> ` inside a callout -> filed SC-462 (Backlog). OUT OF SCOPE.
  4. `blockKey()` may change once for an LP-callout block -> pending reviewer probe; default DROP.
  5. Notice rate-limited one per note per 5 s (existing limiter) -> KEEP; satisfies ruling item 3 without spam.
  6. `ReadingModeBlockHost.replaceSource` silent false when the TFile is missing -> FOLD into the fix round (ruling item 3: no silent failures).
  7. dse-verify expected numbers -> land-ready report (dispatcher bookkeeping).
  Workspace CHANGELOG bullet -> fix round adds it in the WORKTREE superproject's CHANGELOG.md.
- 2026-10-20: R1 review dispatched to orchestration:reviewer (fresh identity, id a04b3e5…) on `sc455-brief-review.md`. Fix round -> R1 implementer (a1e8024…); scoped re-review -> this reviewer.
- 2026-10-20 (dispatcher): dse origin/develop moved d58cf6a -> 7817133 (SC-360: sidebar anchor ids always read as YAML strings; anchor/provenance readers accept any scalar token; encounter builder shares the anchor generator; workspace main b874ac0). "Land-ready must be on 7817133." New base numbers: jest 5013 passed / 1 skipped / 229 of 230 suites · lifecycle 26/26 · e2e 71/76 ok, 0 failed, 5 known-bug, coverage 51/51 pairs · shots 572 + pressed-toggle line · freeze 276/276 · parity 0/0/24 DECLARED.
- 2026-10-20 (owner): The R1 review keeps running on e4f60eb (same worktree, so no rebase while it runs). The fix round rebases onto 7817133 first. SC-360 touches `anchor.ts`, so conflicts with our `blockPrefix` changes there are likely. The resolution must keep SC-360's any-scalar-token anchor reading AND our prefix handling. Then the fix-round items, then the full battery. Expected after: jest 5087 (5013 + 74, plus fix-round tests) / 1 / 230 of 231 · lifecycle 27/27 · e2e 80/85 0 failed 5 known-bug 51/51 · shots 572 + pressed line · freeze 276/276 · parity 0/0/24. The scoped re-review covers the fix delta AND the rebase conflict resolution.
- 2026-10-20: R1 reviewer (a04b3e5…) killed by an Opus API usage limit (owner session too). No report written; scratch `sc455-review-20261020-001424/` holds gate logs, mutation logs (M1-M6), probes, rebase-trial merge tree vs 7817133. dse head e4f60eb, tree clean. Reviewer resumed via SendMessage to finish probes and write the report.
- 2026-10-20: R1 review (a04b3e5…) FIX-REQUIRED on e4f60eb: 0 CRIT / 1 HIGH / 0 MED / 3 LOW / 4 INFO. Report `sc455-review-report.md`. Reviewer gates match the implementer. All six prefix-helper mutants caught. Rebase hazard vs 7817133: one small `anchor.ts` conflict (branch removes `FENCE_LINE`; SC-360 adds `LEADING_LETTERS` + `generateAnchorId` right after it): keep the removal AND SC-360's additions.
- 2026-10-20: Owner rulings on R1 review:
  - HIGH-1 (no space after `>`: each write shrinks body indentation by one space; raw-mode form save re-nests YAML) -> FOLD the prescribed fix: `stripBlockPrefix(addBlockPrefix(p, t), p) === t` for every prefix and text; the test.each round-trip property plus a host-level two-writes test for a `>` prefix.
  - LOW-1 (LP callout write before the widget attaches goes to the twin nearest line 0, silently) -> FOLD: never default `knownLineStart` to 0. Until the location resolves, either resolve by `domOrdinal()` or abort with the Notice. It must never write to the wrong twin.
  - LOW-2 (form-editor save of an unsavable block shows two Notices) -> FOLD: exactly one Notice per attempt; the host reports, the FormModal does not repeat it.
  - LOW-3 (e2e N01/N02 accept any "was not saved" Notice and don't count them) -> FOLD: assert the exact unsavable text and exactly one new DSE Notice.
  - INFO-1 (unsavable Notice always mentions lists) -> FOLD: the list hint only when the reason is a list shape.
  - INFO-2 -> covered by folded follow-up 6 (missing TFile Notice).
  - INFO-3 (ReferenceResolver / typeAdapters column-0 readers) -> filed SC-464 (Backlog). OUT OF SCOPE.
  - INFO-4 (workspace CHANGELOG bullet) -> FOLD (already assigned).
  - Follow-up 4 (`blockKey`) -> DROP: the reviewer measured it stable before and after a write in real Obsidian.
- 2026-10-20: Fix round 1 (rebase onto 7817133 + the folds above) sent to the R1 implementer (a1e8024…) via SendMessage resume. Scoped re-review -> reviewer a04b3e5…
- 2026-10-20: Fix round 1 DONE: dse b6b08f3 on 7817133 (the six rebased commits plus 505b76b tests, 018265e src, b6b08f3 e2e). Superproject worktree 5cbae52 = CHANGELOG.md bullet only. One rebase conflict (anchor.ts): kept our FENCE_LINE removal plus SC-360's LEADING_LETTERS / generateAnchorId / SCALAR_TOKEN. Every finding fixed. 42 new tests fail on e4f60eb src. Gates: jest 5242/1/230 of 231 · lifecycle 27/27 · e2e 80/85 0 failed 5 known-bug 51/51 · shots 572 + pressed line · freeze 276/276 · parity 0/0/24. The commit message "(SC-455 fix round 1)" is a nit: DROP.
- 2026-10-20: Scoped re-review -> reviewer a04b3e5… on `sc455-brief-rereview.md`.
- 2026-10-20: Scoped re-review (a04b3e5…) LAND-READY on dse b6b08f3 / superproject 5cbae52: 0 CRIT/HIGH/MED/LOW, 4 INFO. Reviewer re-ran tsc/lint/jest 5242/lifecycle 27/27/e2e 80/85/freeze 276/276; jest count reconciled (5013 + 74 + 145 + 7 + 2 + 1). Owner rulings:
  - INFO-1 (missing-note Notice uses the generic "can't tell where" reason) -> DROP: rare edge, the user is still told the save failed; not worth another battery.
  - INFO-2 (form save within 5 s of an earlier Notice shows none) -> DROP: consequence of the accepted rate limit.
  - INFO-3 (tab case in blockPrefix.ts:90 untested) -> DROP: test nit.
  - INFO-4 (stale FENCE_LINE comment ReadingModeBlockHost.ts:154) -> DROP: cosmetic; pass to the dispatcher as an optional one-line touch-up.
- 2026-10-20: LAND-READY reported to the dispatcher: dse sc455-callout-write @ b6b08f3 on 7817133; superproject sc455-callout-write @ 5cbae52 (CHANGELOG only).
- 2026-10-20: LANDED (dse develop b6b08f3, workspace 8bc5338 + 8969a34 ledger/dse-verify). Ticket flipped to Done.
