# SC-672 decisions ledger — counter: a block that is empty or is not a map of keys

Owner: ticket-owner (Fable 5.2), session `5812b474-3aec-46a6-8f06-0ef85cf1e10a`.
Worktree `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block` (branch
`sc672-counter-malformed-block` in every submodule), cut 2026-11-20 from dse `develop` `129beb18`, superproject
workspace main `3a517cdf`.

## Ticket (as filed 2026-11-15 by the SC-442 e2e rollout; no comments on the thread at start)

Two related problems with `ds-counter` blocks that do not hold a YAML map.

1. **Text, a list or a number in the block** (`hello`, `- a`, `5`): the card shows a working counter at 0 with no
   error. The first − or + replaces the block's text with `current_value: 1`, so the user's text is lost. Montage and
   negotiation show an error card and write nothing (SC-628, SC-638).
2. **An empty block** (nothing inside the fence, or only a comment): the card shows a raw error, "Counter: failed to
   render (render)" and "Cannot read properties of null (reading 'max_value')". A freshly inserted empty block is a
   normal moment to see this.

Agent notes on the ticket: `src/model/Counter.ts:41-52` `parse` never checks the shape of `data`; `:44` reads
`raw.max_value` on `null` (`parseYaml('')` is `null`). `src/elements/counter/definition.ts` has no `schema`
(deliberate per its comment). Fixtures `e2e/vaults/shipped/Counter/wrong-block.md`, `empty-block.md` and the e2e
`knownBug` markers CTR-W01 / CTR-W02 exist ONLY on the SC-442 branch (not on develop `129beb18`).

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-20 — **No Scott decision needed to start.** Problem 1 is settled by the ticket's own comparison and the
  SC-628 / SC-638 precedent. Problem 2 is an owner call (R2), stated on the ticket as vetoable.
- 2026-11-20 — **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
  (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
  and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.` (the same string montage
  `src/elements/montage/model.ts:337` and negotiation `src/model/NegotiationData.ts:276` use). The pipeline draws it
  as the error card. An error card has no − / + / number box, so nothing can replace the user's text. No raw
  JavaScript message (`Cannot read properties`, `is not a function`, `TypeError`, `undefined`) reaches the card.
  The YAML-parse error path (`Invalid YAML format: …`) is unchanged.
- 2026-11-20 — **R2. An empty block → a fresh counter at 0 (no error).** "Empty" = whatever parses to null /
  undefined: nothing inside the fence, blank lines / whitespace only, only comments, a bare `null` or `~`. It draws
  exactly the counter a `{}` block draws today (no name, current 0, min 0, no max). Reasons: every counter key is
  optional and `{}` already draws this counter, so refusing zero keys written as an empty body while accepting zero
  keys written as `{}` would be an inconsistency inside the counter; montage, project and roll (the elements whose
  keys are all optional) already draw their default for an empty block; the ticket calls a freshly inserted empty
  block "a normal moment". This deliberately differs from negotiation (SC-638 kept its refusal, with a plain
  message): a negotiation with no data is not a usable negotiation, a counter with no data is a counter at 0.
  Consequences accepted:
  - The first − / + / typed value on an empty block WRITES into it (e.g. `current_value: 1`). That is a write into a
    user file, so it gets integrity tests (text above and below the block survives; two empty counter blocks in one
    note do not cross-talk; Reading view and Live Preview).
  - A comment-only block loses its comment on that first write. That is the plugin-wide behaviour for every block
    (SC-599, Backlog: any write drops YAML comments) — out of scope here, not a new loss class.
  - The block edit form's Save for a counter becomes available with an empty box (FormModal treats elements that
    accept an empty body that way, like montage / project). Fine.
  - `src/elements/shared/undeclaredDefaults.ts`: a counter that came from a blank body and has nothing left to write
    is written back as a blank body (the existing generic rule), a `{}` source stays `{}`. Its comment that says
    counter "cannot re-parse" an empty body gets corrected.
- 2026-11-20 — **Scope: counter only, block-level shape only.** Out of scope, do not touch: SC-671 (a write deletes
  unknown keys), SC-673 (number-box rewrites, out-of-range), SC-674 (quoted `current_value`), SC-680 (wheel scroll),
  SC-599 (comments / quotes / flow lists), SC-670 (focus after an outside change). Wrong-typed VALUES inside a map
  (`max_value: banana`, `name: [a]`) are not this ticket; the reviewer probes them and anything that shows a raw JS
  error or loses data comes back as a finding for an owner ruling. No shared helper extracted out of montage or
  negotiation; a counter-local check (or an existing framework helper) is fine.
- 2026-11-20 — **Tests.** Unit (`Counter.parse`) + jsdom (error card / fresh counter, nothing written) + e2e in real
  Obsidian. New e2e ids continue the counter families: CTR-W03 onward (CTR-W01 / W02 are taken on the SC-442 branch).
  Never a bracketed ticket id in a test title. New spec file, so nothing collides with SC-442's
  `counter-bugs.e2e.ts`. Fixtures `wrong-block.md` and `empty-block.md` are created byte-identical to SC-442's (an
  identical add on both branches rebases cleanly); other fixtures get new names.
- 2026-11-20 — **Docs.** One CHANGELOG bullet under `## Unreleased` in the worktree superproject. A short line in
  the plugin's `docs/counter.md` if it has a natural place (an empty block is a counter at 0).

## Overlap with SC-442 (in flight, Awaiting, head `ed7130d9` on `129beb18`)

SC-442 adds the e2e markers `knownBug('SC-672')` CTR-W01 (`wrong-block.md`) and CTR-W02 (`empty-block.md`) in
`e2e/specs/counter/counter-bugs.e2e.ts`, and keeps `wrong-block` out of the jsdom census `RENDERS` list. Whichever of
the two efforts lands second has to turn those two markers into plain tests (a known-bug marker that passes fails the
run). Preferred order: SC-442 first, then this branch rebases and flips them. Told to the dispatcher at first report.

## Baseline (dse `develop` @ `129beb18`, from dse-verify CURRENT, 2026-11-15)

tsc and lint clean · jest 13703 passed / 1 skipped with the shots cache (13702 / 2 fresh, derived) · lifecycle 64/64
(seven `--only` parts) · e2e `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots
592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.

Expected after the fix: jest 13702 + new tests / 2 skipped fresh; lifecycle 64/64; e2e ok 658 + new, total 667 + new,
9 known-bug, coverage 418/418 (no new control: an error card has none, a fresh counter has the same three); if
`styles.css` is byte-identical to a clean `129beb18` build, shots / freeze / parity carry.

## Rounds

- r1 implementer (orchestration:implementer) — brief `sc672-r1-implementer-brief.md`, report
  `sc672-r1-implementer-report.md`. Dispatched 2026-11-20.
  r1 result (2026-11-20): DONE_WITH_CONCERNS. dse `86397967` on `129beb18` (b016c3e8 fix, 1743a4a7 jest, e6ce602e
  e2e spec + fixtures + README rows, 86397967 docs/counter.md); superproject CHANGELOG `c7c04a7b` on `3a517cdf`, no
  pointer bump. +50 jest (25 unit, 19 jsdom, 6 in wrapperDefaultKeys). jest 13752 / 2 skipped fresh; e2e new spec
  10/10 (CTR-W03..W12), full `668/677 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`; lifecycle 63/64 (only
  G-S61, red the same way on a clean `129beb18` build: SC-668); styles.css `18730938…f1f9` identical to clean base,
  shots / freeze / parity carry. Existing tests changed: `formModalEmptyYaml.test.ts` (counter now accepts an empty
  box; two refuse-empty tests moved to negotiation), `wrapperDefaultKeys.test.ts` (blank-body case now covers
  counter). Source diff is 2 files: `src/model/Counter.ts` (the check) and a comment in `undeclaredDefaults.ts`.
- 2026-11-20 — r1 follow-ups ruled:
  - **View-registry collision when a write makes two identical counters identical again (+ on 2nd, then + on 1st;
    `collisions=1`, bytes correct; reproduced on the existing non-empty `twins.md`) — reviewer confirms on clean base
    and says what the user sees (brief addendum F); then FILE a Backlog ticket (it is in `src/framework/host`, not
    this ticket's area, and it constrains how twin e2e tests can be written).** Out of scope for any fix round here.
  - **G-S61 red — DROP** (SC-668 already tracks it; red on base).
  - **SC-442 overlap — carried** (see the overlap section; resolved at whichever landing is second).
- r2 reviewer (orchestration:reviewer) — brief `sc672-r2-reviewer-brief.md`, report `sc672-r2-review-report.md`,
  reviewing `86397967`. Dispatched 2026-11-20.

## Baseline moves

- 2026-11-20 (dispatcher, while r2 was running) — SC-675 landed (block inserts via new `src/authoring/blockInsert.ts`;
  CHANGELOG bullet added). dse `origin/develop` `129beb18` → **`3b47e55b`**; workspace `origin/main` → **`49ac1c10`**.
  Rebase the dse branch onto `3b47e55b` before land-ready; superproject branch onto `49ac1c10` (CHANGELOG commit,
  then ONE pointer bump). No new battery baseline from the landing skill; numbers as reported by SC-675: jest 13855
  passed / 2 skipped, e2e `658/667 ok, 9 known-bug, 418/418 pairs`, lifecycle 63/64 (G-S61 torn-read line, same on
  base = SC-668). Expected for SC-672 on it (r1 as is): jest 13855 + 50 = 13905 / 2 skipped; e2e `668/677 ok,
  0 failed, 9 known-bug, coverage: 418/418 pairs`; lifecycle 63/64 with only G-S61 red.
  NOT rebased under the running r2 reviewer (it reviews `86397967` on `129beb18`); the rebase goes into the round
  after r2 (fix round or a rebase-only round), with the full battery on the rebased head.

## Resume 2026-11-22 (new owner session; dispatcher session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`)

- State found: dse branch still `86397967` on `129beb18` (NOT rebased), superproject `c7c04a7b` on `3a517cdf`,
  worktree clean apart from the expected unstaged ` M draw-steel-elements` pointer. **The r2 reviewer never
  reported** (no `sc672-r2-review-report.md`; it died with the earlier session at the usage limit). No Scott comment
  on the ticket since the owner's start comment (2026-11-20), so R2 stands un-vetoed.
- Baseline moved again: dse `origin/develop` → **`bdf0255e`** (SC-675, SC-434, SC-641 landed), workspace
  `origin/main` → **`8e7a7bbe`**. dse-verify CURRENT at `bdf0255e`: tsc and lint clean · jest **13861 passed /
  2 skipped** fresh · lifecycle **64/64** · e2e `OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug, coverage:
  418/418 pairs` · shots 592, freeze 280/280, parity 0 / 0 / 24 carry.
- Expected for SC-672 rebased onto `bdf0255e`: jest 13861 + 50 = **13911 passed / 2 skipped** fresh; e2e
  **`670/677 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`**; lifecycle 64/64 (G-S61 alone red is the known
  SC-668 busy-host red); `styles.css` identical to a clean `bdf0255e` build → shots / freeze / parity carry.
- SC-442 has NOT landed (its worktree `sc442-e2e-counter-topup` still exists; develop's e2e total is still 667), so
  no CTR-W01 / W02 marker flip is needed on this branch. SC-671 (counter: a write deletes unknown keys; worktree
  `sc671-counter-unknown-keys`) is in flight in this session and likely touches `src/model/Counter.ts`: whichever of
  SC-671 / SC-672 lands second rebases over the other.
- Plan: r3 implementer = rebase-only round onto `bdf0255e` / `8e7a7bbe` + full battery (brief
  `sc672-r3-rebase-brief.md`, report `sc672-r3-rebase-report.md`). Then r4 = fresh independent reviewer on the
  rebased head (the r2 brief re-issued with new shas; brief `sc672-r4-reviewer-brief.md`, report
  `sc672-r4-review-report.md`). r2 is void.
- r3 result (2026-11-23): DONE. dse **`ccacc3cc`** (4 commits, range-diff all `=`, no conflicts) on `bdf0255e`;
  superproject **`4765ecf2`** on workspace main `565a35c1` (main had moved past `8e7a7bbe` by one docs commit;
  CHANGELOG conflict resolved keeping both sides, SC-672 bullet on top). No test changed, no `npm ci` needed.
  tsc (incl. `-p e2e`) + lint clean · jest `13911 passed / 2 skipped` (no shots cache) · e2e full
  `OBSIDIAN-E2E done: 670/677 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`, new spec 10/10 · lifecycle
  64/64 (seven parts; G-S61 green) · `styles.css` `18730938…f1f9` = base, shots / freeze / parity carry.
  Evidence: `<scratchpad e255a3cd…>/sc672-r3-rebase/`.
- r4 reviewer (orchestration:reviewer) — brief `sc672-r4-reviewer-brief.md`, report `sc672-r4-review-report.md`,
  reviewing `ccacc3cc` on `bdf0255e`. Dispatched 2026-11-23.
- r4 result (2026-11-23): **FIX-THEN-LAND** — HIGH 1, MEDIUM 1, LOW 4, INFO 6. Gates re-measured on `ccacc3cc`:
  tsc + lint clean · jest 13911 / 2 skipped · e2e `670/677 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` ·
  G-S61 alone 1/1 at loadavg 0.8 · `styles.css` = base. Fix reverted: 48/50 jest and all 10 e2e go red for the right
  reason. Regressions C: `{}` / normal / shipped example write identical bytes on base and head.

## Owner rulings on the r4 findings (2026-11-23)

- **H1 (palette command "Send block to sidebar" appends `_dse_anchor: <id>` to a `hello` block; same on base, same
  for montage; `src/framework/sidebar/registration.ts:278`, `anchor.ts:93-101`) — FILED as SC-686 (Backlog), OUT OF
  SCOPE for this branch.** Reasons: it is framework / sidebar code, not the counter; it is identical on base for
  every element; it touches a deliberate earlier ruling (SC-360 r4 MEDIUM-A: a YAML error must not stop a pin), so it
  needs a decision; the sidebar is behind the experimental switch (SC-403); the user's text is kept. What this branch
  does about it: the CHANGELOG sentence "the note is never written" is reworded to say the CARD cannot change the
  note (fold, r5).
- **M1 (a block that YAML reads as a non-plain object — `!!timestamp` Date, `!!binary` Uint8Array, `!!set` Set,
  `!!omap` Map — passes the check, draws a counter, + replaces the text; `src/model/Counter.ts:45`) — FOLD into
  r5.** R1 says "anything `parseYaml` returns that is not a plain map and not null / undefined", and the fix is one
  predicate in the line this ticket adds. Counter only. The same loose predicate in montage
  (`src/elements/montage/model.ts:336`) and negotiation (`isMap`, `src/model/NegotiationData.ts:131`) — **DROP**: only
  reachable by hand-typing an explicit YAML type tag as the whole block body; not worth a ticket.
- **L1 (docs + CHANGELOG say "first click on + or -"; − is disabled at 0) — FOLD** (wording).
- **L2 (docs say the block must be a "list of keys" while a bulleted list is refused; the field table marks `name`
  required) — FOLD** (wording in `docs/counter.md` and the CHANGELOG). The two commit SUBJECTS that say "list of
  keys" — **DROP** (not user-facing, the ticket title uses the same phrase, not worth a history rewrite).
- **L3 (+ then − on an empty block: blank body again only in Reading view with an adopted view; Live Preview and a
  rebuilt view write `current_value: 0`; a block with nothing between the fences gains one blank line inside the
  fence; `{}` behaves the same on base) — no code change; FOLD one e2e that pins the user-facing contract** (after a
  + then − cycle the block still draws a counter at 0, text outside the fence is byte-identical, a second cycle does
  not change the note again). This CORRECTS the R2 consequence line above: "a blank source goes back to a blank
  body" holds in Reading view with an adopted view only; elsewhere the block ends as `current_value: 0`. Accepted:
  it is the generic adoption mechanism and identical to `{}` on base.
- **L4 + I1 (view-registry collision when two counters become identical again; reproduces on base `twins.md`; bytes
  and numbers always right; a KEYBOARD user loses focus to `<body>` and the next Enter does nothing) — already filed
  by the SC-671 owner as SC-685 (Backlog).** Owner posts the user-visible symptom on SC-685. **FOLD into r5: one e2e
  in the natural order (+ on the 2nd empty block, then + on the 1st) marked `knownBug('SC-685')`**, if the harness
  can hold it as a known-bug (else skip and report). OUT OF SCOPE to fix.
- **Section D row `current_value: {a: 1}` (+ writes `current_value: "[object Object]1"`, same on base) — DROP as a
  new ticket**: it is the same string concatenation as SC-674 (quoted `current_value`); owner notes the shape on
  SC-674. Other D rows: no loss, no raw JS message, nothing to file.
- **I2 (counter in a list item draws but + writes nothing) — DROP**, SC-461 covers it. **I3 (typed `-2` writes
  nothing) — DROP**, SC-673 territory. I4–I6: working as intended.
- r5 implementer fix round (resume of the r3 implementer) — brief `sc672-r5-fix-brief.md`, report
  `sc672-r5-fix-report.md`. Dispatched 2026-11-23. Scoped re-review of the delta then goes to the r4 reviewer.

## Baseline move 2026-11-23 (dispatcher FYI, while r5 was running)

- SC-644 landed (settings "Collapsible by default" / "Start collapsed" / "Show edit button" reach already-open
  blocks; 8 commits). dse `origin/develop` `bdf0255e` → **`fefd9029`**; workspace `origin/main` → **`b79eef2b`**
  (CHANGELOG gained an SC-644 bullet). dse-verify CURRENT @ `fefd9029`: jest **13902 / 2 skipped** fresh (13903 / 1
  with the shots cache) · lifecycle 64/64 · e2e `664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` ·
  shots 592 / freeze 280/280 / parity 0 / 0 / 24. Dispatcher: "Rebase onto fefd9029 before reporting land-ready."
- Expected for SC-672 on `fefd9029` (r1's +50 jest, +10 e2e; r5 adds N jest and M e2e, one of them a known-bug if
  Item 4 is in): jest **13952 + N / 2 skipped**; e2e **`(674 + M − 1)/(679 + M) ok, 0 failed, 6 known-bug,
  coverage: 418/418 pairs`** (Item 4 skipped: `(674 + M)/(679 + M)`, 5 known-bug); lifecycle 64/64; `styles.css`
  identical to a clean `fefd9029` build.
- r5 worker told by message (r5 addendum) to rebase onto `fefd9029` / `origin/main` after committing its five items
  and to run the ONE battery on the rebased head. The scoped re-review (r6) then reviews the r5 delta on that head.
- r5 result (2026-11-23): DONE_WITH_CONCERNS (Item 4 skipped). dse **`52cc1b49`** (6 commits; r5 added `0098eb44`
  fix + tests and `52cc1b49` docs) rebased onto **`fefd9029`**, no conflicts, range-diff all `=`; superproject
  **`1bb51fab`** (2 CHANGELOG commits) on workspace main **`334058e2`** (main moved one commit past `b79eef2b`).
  N = 10 jest, M = 3 e2e (CTR-W13 tagged block, CTR-W14 / W15 + then − cycle in Reading view / Live Preview).
  Predicate: `Object.prototype.toString.call(data) !== "[object Object]"` → refuse (`src/model/Counter.ts:47`).
  Red proof with the old predicate: jest `9 failed`, CTR-W13 `0/1 ok`.
  Gates on `52cc1b49`: tsc (incl. `-p e2e`) + lint clean · jest `13962 passed / 2 skipped` (13952 + 10) · e2e full
  `OBSIDIAN-E2E done: 677/682 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` · spec alone 13/13 ×3 ·
  lifecycle 64/64 (G-S61 green) · `styles.css` `18730938…f1f9` = clean `fefd9029` build (scratch worktree) →
  shots / freeze / parity carry.
- **Item 4 skipped — ACCEPTED (owner, 2026-11-23).** A `knownBug('SC-685')` test cannot hold the collision: the
  after-test invariant (`e2e/driver/invariants.ts:38-43`, `view registry collisions=1 ambiguous=0`) runs after the
  marker swallows the body's failure and fails the run. No invariant weakened, test removed. The natural-order test
  belongs to SC-685's own fix; owner corrects the note on SC-685 (which said this branch adds the marker). No new
  ticket: SC-685 already carries it.
- r6 scoped re-review (resume of the r4 reviewer) — brief `sc672-r6-rereview-brief.md`, report
  `sc672-r6-rereview-report.md`, delta `0098eb44` + `52cc1b49` (+ superproject CHANGELOG wording) on head
  `52cc1b49`. Dispatched 2026-11-23.

## Baseline move 2026-11-23 #2 (dispatcher FYI, while r6 was running)

- SC-671 landed (a Counter write keeps the YAML keys the counter does not use; 6 commits). dse `origin/develop`
  `fefd9029` → **`d582e7ff`**; workspace `origin/main` → **`c5d38e9b`** (CHANGELOG gained SC-671 bullets).
  dse-verify CURRENT @ `d582e7ff`: jest **13936 / 2 skipped** fresh · lifecycle 64/64 · e2e `668/673 ok, 0 failed,
  5 known-bug, coverage: 418/418 pairs` · shots 592 / freeze 280/280 / parity 0 / 0 / 24. SC-671 owner, verbatim:
  "SC-672: I expect it to touch the same counter model file, so it should rebase onto this after landing. I did not
  check its branch." Dispatcher: "Rebase onto d582e7ff before reporting land-ready."
- Owner check of the overlap (read `git diff fefd9029 d582e7ff`): SC-671 did NOT touch `src/model/Counter.ts`. It
  changed `src/elements/counter/model.ts` (`parse` calls `Counter.parse(data)` FIRST, then `unknownPairs(data)`,
  which returns `[]` for null / non-object / array; `serialize` writes the carried pairs), plus
  `test/dom/elements/wrapperDefaultKeys.test.ts`, `e2e/README.md`, new tests / fixture `own-keys`. So no `src/`
  textual conflict is expected; likely textual conflicts are `wrapperDefaultKeys.test.ts` and `e2e/README.md`.
  Semantic points to verify after the rebase: (a) a non-map block still throws before `unknownPairs` runs (error
  card, nothing written); (b) an empty block → `unknownPairs(null)` is `[]`, fresh counter, + writes
  `current_value: 1`; (c) a block that holds ONLY unknown keys (`note_to_self: x`) then + keeps the key (SC-671)
  and is not treated as blank; (d) the + then − cycle tests CTR-W14 / W15 still hold.
- Expected for SC-672 on `d582e7ff` (+60 jest, +13 e2e, no known-bug added): jest **13996 passed / 2 skipped**;
  e2e **`OBSIDIAN-E2E done: 681/686 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**; lifecycle 64/64;
  `styles.css` identical to a clean `d582e7ff` build.
- r6 reviewer told by message to drop its full jest / full e2e (the head it reviews will not land) and keep the
  delta review. Plan: r7 = implementer rebase onto `d582e7ff` / workspace `origin/main` + full battery (brief
  `sc672-r7-rebase-brief.md`, report `sc672-r7-rebase-report.md`); r8 = reviewer scoped check of the rebase
  resolution + independent full e2e on the landing head.
- r6 result (2026-11-23): **LAND for the delta** `0098eb44` + `52cc1b49` — HIGH 0, MEDIUM 0, LOW 1, INFO 3. M1
  closed in real Obsidian (Reading view, Live Preview, a popout window): `!!set`, `!!timestamp`, `!!binary`,
  `!!omap`, `%YAML 1.1` date / set / `yes`, `!<tag:yaml.org,2002:set>`, `!!pairs`, `!!null hello`, `&a hello` all
  refused with the plain card; `{}`, `!!map {}`, `--- !!map`, anchors / aliases, a merge key, `__proto__` /
  `toString` keys, `!foo {…}`, all R2 empty forms, a normal counter accepted with bytes identical to `c203beef`. No
  false refusal. Red proof repeated (jest 9 failed, CTR-W13 0/1). Item 4 skip confirmed honest
  (`e2e/driver/session.ts:42-44`; no driver change). SC-644 settings probe: cards and bytes unchanged. Gates on
  `52cc1b49`: tsc + lint clean, jest `13962 / 2 skipped`, counter spec 13/13 ×3; full e2e dropped per addendum.
  - **r6 L1 (CHANGELOG: "(or a number typed into the box) fills the block in (`current_value: 1`)" — a typed number
    writes that number, not 1) — FOLD into r7** (one sentence).
  - r6 INFO (Tab reaches Obsidian's own "Click to edit" button, not the card; `__proto__` key dropped on write on
    the pre-SC-671 head; `!!seq {}` reads as `{}`) — **DROP**, none is this branch's behaviour.
- r7 implementer (resume of the r3 / r5 implementer) — brief `sc672-r7-rebase-brief.md`, report
  `sc672-r7-rebase-report.md`. Dispatched 2026-11-23.
- r7 result (2026-11-23): **NEEDS_CONTEXT** (one develop-side SC-671 test red by this branch's ruled behaviour;
  everything else green). dse **`079c9c7e`** (7 commits: r5's 6 rebased + the interaction-tests commit) on
  `d582e7ff`; superproject `70655862` (3 CHANGELOG commits, incl. the r6 L1 wording) on workspace main `0ec2f4f9`.
  Conflicts (both sides kept): `wrapperDefaultKeys.test.ts`, `e2e/README.md`, `CHANGELOG.md`. N = 9 jest, M = 1 e2e
  (CTR-W16, fixture `Counter/only-unknown-keys.md`). (a)-(d) all hold with no `src/` change: non-map → plain
  message before any unknown-key handling, nothing written; empty → + writes `current_value: 1`; `note_to_self: x`
  → + writes `current_value: 1\nnote_to_self: x`, − writes `note_to_self: x`; empty + then − → `''`.
  Gates on `079c9c7e`: tsc (incl. `-p e2e`) + lint clean · jest `1 failed, 2 skipped, 14004 passed` (the one SC-671
  test) · e2e full `OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` · counter spec
  14/14, `own-keys` 4/4 · lifecycle 64/64 · `styles.css` `18730938…f1f9` = clean `d582e7ff` build.
- **Owner ruling on the red SC-671 test (2026-11-23).** `test/unit/model/counter-serialize.test.ts:164-170`, "a
  non-map body keeps today's behaviour: nothing is carried, nothing crashes differently", pins the pre-SC-672
  behaviour and says so itself ("SC-672 owns whether that is right"): `roundTrip('hello')` → `''`,
  `roundTrip('- a\n- b')` → `'{}'`, `parse(null, '')` throws `TypeError`. R1 and R2 change all three. **REWRITE the
  test in place to pin the ruled behaviour** (keeping its purpose: a non-map carries nothing): `hello` and
  `- a\n- b` throw exactly `Invalid data: the block must be a map of keys.` through the element `parse`; a
  `null` / empty source does not throw, is a fresh counter, and serializes with no carried key (pin the measured
  string). No `src/` change. Goes to the implementer as r7b; the r8 reviewer checks it.
- Usage-limit interruption (dispatcher message): no worker was running (r7 had already returned), no orphaned gate
  process in the worktree, heads intact. Workspace `origin/main` has moved again to `b034ff73`; r7b rebases the
  superproject onto it. A stale, prunable git worktree entry from the dead r2 reviewer
  (`…/5812b474…/scratchpad/sc672-r2-rev/base`, `129beb18`) is registered in the plugin repo; harmless, left alone.
- r7b result (2026-11-23): DONE. dse **`28402e57`** (8 commits; `079c9c7e` + one test-only commit rewriting the
  SC-671 test per the ruling) on `d582e7ff`; superproject **`0500eb78`** (3 CHANGELOG commits) on workspace main
  `b034ff73`. tsc (incl. `-p e2e`) + lint clean · jest `14005 passed / 2 skipped, 0 failed` · `main.js`
  `9893e494…70cb` and `styles.css` `18730938…f1f9` byte-identical to the `079c9c7e` build → e2e `682/687 ok,
  0 failed, 5 known-bug, coverage: 418/418 pairs` and lifecycle 64/64 carry from `079c9c7e`.
- r8 scoped re-review (resume of the r4 / r6 reviewer) — brief `sc672-r8-rereview-brief.md`, report
  `sc672-r8-rereview-report.md`, head `28402e57`. Dispatched 2026-11-23.

## Baseline move 2026-11-23 #3 (dispatcher FYI, while r8 was running)

- SC-679 landed (accepting an in-block suggestion with nothing typed; 7 commits). dse `origin/develop` `d582e7ff` →
  **`8c08bce2`**; workspace `origin/main` → **`66b1e5ec`** (CHANGELOG gained an SC-679 bullet). dse-verify CURRENT
  @ `8c08bce2`: jest **13944 / 2 skipped** fresh · lifecycle 64/64 · e2e `668/673 ok, 0 failed, 5 known-bug,
  coverage: 418/418 pairs` · shots 592 / freeze 280/280 / parity 0 / 0 / 24. Dispatcher: "Rebase onto 8c08bce2
  before reporting land-ready."
- Expected for SC-672 on `8c08bce2` (+69 jest, +14 e2e, no known-bug added): jest **14013 passed / 2 skipped**;
  e2e **`OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**; lifecycle 64/64;
  `styles.css` identical to a clean `8c08bce2` build.
- r8 reviewer told by message to drop its full jest / full e2e (its head will not land) and keep the delta review
  and probes. Plan: r9 = implementer rebase-only round onto `8c08bce2` / workspace `origin/main` + full battery
  (brief `sc672-r9-rebase-brief.md`, report `sc672-r9-rebase-report.md`). **Owner ruling:** SC-679 is editor /
  suggestion code, not the counter; if the r9 range-diff is all `=` (apart from context in `e2e/README.md`), no
  conflict touches a test body or `src/`, and the full battery is green on the rebased head, the branch is
  land-ready WITHOUT another review round — the code was reviewed at `28402e57` (r8) and a clean rebase over
  unrelated commits changes nothing the review looked at. Any conflict in a test body or `src/`, or any red gate,
  goes back to the reviewer.
- r8 result (2026-11-23): **LAND** for `28402e57` on `d582e7ff` — HIGH 0, MEDIUM 0, LOW 0, INFO 3. Rebase kept both
  tickets whole (`src/` diff = `Counter.ts` + the `undeclaredDefaults.ts` comment; no SC-671 or SC-672 test / README
  row lost). SC-671 × SC-672 in real Obsidian, Reading view and Live Preview: (a)-(d) hold, no cross-talk, every
  case base can draw writes bytes identical to base. Pre-SC-672 `Counter.ts` → 31 of 49 counter tests red
  (interaction (a) ×4, (b) ×3, (d), the rewritten SC-671 test). CHANGELOG sentence true; main's bullets intact.
  Gates on `28402e57`: tsc + lint clean · full jest `14005 passed / 2 skipped` · counter spec 14/14, `own-keys` 4/4
  · `styles.css` `18730938…f1f9`, `main.js` `9893e494…70cb`. Full e2e dropped per addendum.
  - INFO, all **DROP**: I1 a tagged VALUE inside a normal map loses its tag on a write (`extra: !!set {a}` → a
    list) — SC-671 / SC-599 formatting behaviour, identical on base; I2 Live Preview + then − on `note_to_self: x`
    leaves `current_value: 0` beside the key — the generic adoption rule, identical on base (same as r4 L3); I3
    interaction test (c) is green without the fix — correct, it pins SC-671 behaviour that must not regress.
- r9 implementer (resume) — brief `sc672-r9-rebase-brief.md`, report `sc672-r9-rebase-report.md`. Dispatched
  2026-11-23.
- r9 result (2026-11-23): DONE_WITH_CONCERNS (one lifecycle scenario red once, green on re-run). dse
  **`957e4b11`** (8 commits) on `8c08bce2`, no conflicts, range-diff all `=`; superproject **`fd060663`** (3
  CHANGELOG commits, +6 / −0) on workspace main `e7f6b4a1`, range-diff all `=`. `src/` diff = `src/model/Counter.ts`
  + the `undeclaredDefaults.ts` comment. Gates on `957e4b11` (owner re-read the summary lines from the worker's own
  logs): tsc (incl. `-p e2e`) + lint clean · jest `2 skipped, 14013 passed, 14015 total` · e2e
  `OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` · lifecycle 21 + 16 + 9 + 4 + 7 +
  4 + 3 = 64/64 as a union (part 3's FIRST run was 8/9: G-S63 cell (a) "the fallback ran (1 setViewData(.., true)
  call(s))" at load 1.1-1.6; G-S63 alone 1/1; part 3 re-run 9/9) · `styles.css` `18730938…f1f9` = clean `8c08bce2`
  build → shots 592 / freeze 280/280 / parity 0 / 0 / 24 carry.
- **Owner ruling on the G-S63 red (2026-11-23): not caused by this branch; FILED as SC-689 (Backlog); does not
  block landing.** G-S63 is SC-545's plugin off/on redraw check on a NORMAL counter in a callout; this branch only
  changes how an empty or non-map body is read; G-S63 was green in this branch's three earlier full lifecycle runs
  (r3, r5, r7) and in 2 of 3 runs on this head, including a full re-run of its part. Precedent: a flake-only red
  followed by a clean re-run has been accepted for e2e (SC-651) and for G-S61 (SC-668).
- **LAND-READY 2026-11-23**: dse `957e4b11` on develop `8c08bce2`; superproject `fd060663` on main `e7f6b4a1`
  (pointer unstaged, for the landing to bump). Per the "Baseline move #3" ruling no further review round: reviewed
  at `28402e57` (r8 LAND), rebase all `=`, battery green. Tickets filed by this effort: SC-686 (sidebar command
  writes into a non-map block), SC-689 (G-S63 flake). Notes added on SC-685 and SC-674. No freeze delta, no
  rebaseline. SC-442 (still in flight) carries `knownBug('SC-672')` markers CTR-W01 / W02 and fixtures
  `wrong-block.md` / `empty-block.md` (byte-identical here): after this lands, SC-442 must turn those two markers
  into plain tests when it rebases.
- **LANDED 2026-11-23 (dispatcher):** dse `origin/develop` = `957e4b11` (`8c08bce2..957e4b11`, fast-forward, 8
  commits); workspace main merge `f2446052`, pointer bump `746554ad`, bookkeeping `28ba594f`. Worktree removed;
  ledger preserved to `docs/superpowers/dse-overhaul/build-ledgers/sc672-counter-malformed-block/`. CTR-W01 / W02
  note relayed to the SC-442 owner.
- **DONE 2026-11-23 (owner):** closing comment posted on SC-672, state → Done. R2 (an empty block is a counter at
  0) was never vetoed; the closing comment says a change of mind goes on a new ticket. Open follow-ups: SC-686,
  SC-689 (filed here); SC-685, SC-674 (noted).
