# SC-153 — independent review of the "Open in sidebar" duplication fix

**Reviewer:** independent agent (did not write the fix). No code changed, no Linear touched.
**Subject:** branch `sc153-sidebar-dup` @ `102b43c` (`4d531b1` + `102b43c`) on dse `221acc9`.
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc153-sidebar-dup/draw-steel-elements` — clean.
**Date:** 2026-08-15.

## Recommendation

**FIX ROUND** — for one issue, not for the fix as a whole.

The diagnosis is right, the mechanism is right, the reported bug is genuinely fixed, and the
note write is surgical. But the fix makes "Open in sidebar" **destroy live combat state** in
the tracker it generated, and that behaviour is *not required* by the ticket. One narrow
change (don't rewrite a block that already exists — just bind to it) removes the risk while
keeping every idempotency property the fix earns. A second, smaller issue (duplicate panel
after the user deletes the generated block) can ride along or be filed.

Everything else verified clean, including the two things I most expected to break.

---

## Battery at `102b43c` (reproduced)

| Gate | Claimed | Measured | |
|---|---|---|---|
| `npm run tsc` | clean | clean, exit 0 | ✅ |
| `npm run lint` | clean | clean, exit 0 | ✅ |
| `npx jest` | 2710 / 1 skipped / 165 suites | **2710 passed, 1 skipped, 2711 total, 165 of 166 suites, 3 snapshots** | ✅ |
| `npm run shots` | 203 / 0 FAIL | **203 ok, 0 FAIL**, exit 0 | ✅ |
| `check-freeze.sh` | 67/67 | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 | ✅ |
| `npm run parity` | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | ✅ |

No collateral: the diff is 7 files (2 tests, 4 src, CHANGELOG), branch worktree clean, the
shared freeze baseline untouched (67 lines, mtime `2026-08-12 22:45`, predates this branch).

---

## Claim verdicts

**(1) Two compounding layers — CONFIRMED, reproduced at base myself.** In a scratch worktree
at `221acc9`, driving the real `plugin.onload()` wiring and three presses:

```
BASE press 1: fences=1 panels=1
BASE press 2: fences=2 panels=2
BASE press 3: fences=3 panels=3
BASE ambiguity notices: 2
```

Exactly the report's numbers, including the two "multiple ds-initiative blocks" Notices that
are the signature of the third, compounded symptom (the sidebar re-binding `fences[0]` while
the encounter appends at the end).

**(2) The identity mechanism — CONFIRMED and well-chosen.** `_dse_anchor` on the encounter,
`_dse_from` on the generated tracker. `serialize()` genuinely emits `_dse_anchor` when the
model carries it (probed directly: `party: {}\nmonsters: []\n_dse_anchor: abc123`), so the
round-trip claim holds. The `cursorLine` hand-off is real — `sendToSidebar` resolves it
through `findFenceAtLine`, and passing the opening-fence line is within that function's
inclusive `lineStart..lineEnd` range.

**(3) Idempotency N→1 — CONFIRMED, with one exception (Finding 2).** Three presses leave one
fence and one panel; a second encounter in the same note gets its own tracker with a distinct
id.

**(4) Live panel survives the in-place refresh — CONFIRMED.** The splice preserves the
`_dse_anchor` line the sidebar stamped, so the panel stays bound and non-degraded.

---

## Note-integrity probe table (the real risk)

All probed against the real `plugin.onload()` wiring with a note on the mock vault.

| # | Scenario | Result | Verdict |
|---|---|---|---|
| a | User prose **below** the tracker fence, then 2 more presses | 1 fence; intro preserved; tail preserved **and still after the fence** | ✅ **surgical** — the splice replaces only `[lineStart+1, lineEnd)`, never touching a byte outside the fence |
| b | **Two encounters** in one note, each pressed twice | 2 fences, 2 distinct `_dse_from` ids (`691724`, `1e8ab2`) | ✅ no cross-talk |
| c/e | Tracker **hand-edited** mid-combat (`round: 3`, an added hero with `current_hp: 7`), then pressed again | **`round: 3` GONE. `Improvised Ally` GONE.** Whole body replaced by a fresh generation; only `_dse_anchor` survives | ❌ **Finding 1 — data loss** |
| d | User **deletes** the tracker fence, presses again | Clean regeneration: 1 fence, no throw, no degrade card — but **2 panels**, both live, both showing the same block | ⚠️ **Finding 2** |
| f | Anchor **persistence** + re-render from the note | Anchor reaches the note; a fresh view parsed from it reuses the id → still **1 fence** | ✅ (see Finding 3 for the starved-timer case) |

A user's own hand-written `ds-initiative` block is never at risk: `findGeneratedBlock` matches
on `_dse_from: <id>`, which an unmanaged block does not carry.

---

## Findings

### Finding 1 — MAJOR: "Open in sidebar" silently destroys live tracker state

The refresh path rebuilds the tracker body from the encounter definition and splices it over
the existing body, preserving only `_dse_anchor`. Measured, before → after one press:

```
```ds-initiative                    ```ds-initiative
_dse_from: 9b29fb                   _dse_anchor: 0b3f9d
heroes: []                          _dse_from: 9b29fb
enemy_groups: []          ──►       heroes: []
malice: {value: 0}                  enemy_groups: []
round: 3            ← GONE          malice: {value: 0}
heroes:                             ```
  - name: Improvised Ally  ← GONE
    current_hp: 7          ← GONE
```

`ds-initiative` is not a static rendering — it is the **live combat document**: round counter,
current HP, conditions, turn order, ad-hoc combatants. All of it is regenerated away.

**Why this matters more than it looks.** The trigger is the button's *ordinary* use. A GM
presses "Open in sidebar" to start combat, plays for twenty minutes, closes the sidebar or
navigates away, then presses it again to bring the tracker back — and the encounter resets to
round 1 at full HP. The label promises navigation; the action performs regeneration. The
Notice says "was refreshed", which does not read as "your combat state was discarded".

**This is a behaviour regression relative to base.** Before the fix, a second press appended a
*new* tracker and left the old one — with its state — intact. Annoying, visible, recoverable.
After the fix it is overwritten in place and the state is unrecoverable (it exists nowhere
else; the encounter definition has no HP or round).

**And it is not required by the ticket.** The duplication is fixed by (i) not appending when a
generated block already exists and (ii) `addPanel` deduping. Neither needs the body rewritten.
The rewrite is an added capability that carries all of the risk.

**Prescription (smallest safe change):** on the "Open in sidebar" path, when
`findGeneratedBlock` finds a block, **bind to it without rewriting** — return its `lineStart`
and skip the splice. That keeps N→1 idempotency, keeps the panel bound, and makes the button
non-destructive. If keeping the tracker in sync with a changed encounter is wanted (it is a
reasonable want), it needs its own affordance — a "Regenerate tracker" action, or a refresh
that runs only when the body is still byte-identical to what was generated, or a confirm when
it is not. Any of those is a deliberate destructive action the user chose, which is the part
that is missing today.

I am flagging rather than deciding the product question: *should* re-pressing re-sync? That is
Scott's call. What is not a judgement call is that today it re-syncs **silently, by
overwriting live state, from a button that says "open"**.

### Finding 2 — MEDIUM: the duplicate panel returns once, after the user deletes the tracker

Delete the generated fence and press again: the note regenerates cleanly (1 fence, no crash,
no degrade card) but the sidebar ends up with **2 panels**, both live, both rendering the same
single block. A third press adds no more, so it does not grow — but the ticket's own symptom
is briefly back.

Cause: the surviving panel is keyed to the deleted block's `anchorId`; the regenerated block
gets a fresh one, so `samePanelTarget` sees a different target and mounts a second panel,
while `SidebarBlockHost`'s "single block of this alias → re-bind rather than degrade"
softening makes the orphan render the new block instead of showing "not addressable".

**Prescription:** either have the refresh/create path reuse the anchor of a panel already
pinned to this generator's output, or have `addPanel` treat a panel whose anchored block no
longer resolves as replaceable. Lower stakes than Finding 1 — nothing is corrupted and closing
a panel fixes it — but it is worth closing in the same round since it is the reported symptom.

### Finding 3 — LOW: the debounce window is real and I reproduced it

The implementer's own §8 concern, confirmed as reproducible rather than theoretical: if the
encounter view is re-created from the note **before** the debounced persist lands, the new view
sees no `_dse_anchor`, mints a different id, and appends a **second** tracker.

I hit it by accident first (installing fake timers before the flush) and then deliberately.
Under normal timing it does not fire: with a real-time wait the anchor reaches the note and a
fresh view parsed from that note reuses the id, leaving one fence. So the honest statement is
"narrow, timing-dependent, and it produces a stray empty tracker rather than corrupting
anything" — which matches the report. The report's proposed real fix (a `flush-now` path on
`persist()`) is the right one and is correctly out of scope here.

**The deadlock claim is also verified.** With the clock fully starved after setup — no timer
ever firing — the shipped handler still completes: tracker written, sidebar leaf opened. The
synchronous, non-awaiting `ensureEncounterAnchor` does what its comment says.

### Finding 4 — INFO: duplicated `_dse_from` (user copy-pastes the tracker)

`findGeneratedBlock` returns the first match, so a copied tracker leaves the second copy
orphaned and refreshes only the first. Not destructive beyond Finding 1's semantics, and
arguably correct. Recording it because the id is now user-visible text that can be copied.

### Verified clean (things I expected to break and did not)

- **strictBody (SC-158) is respected.** The only `strictBody` element is `ds-scc`; neither
  encounter nor initiative declares it. `_dse_from` is only ever written into a hardcoded
  `ds-initiative` fence, and the encounter's `_dse_anchor` goes through the element's own
  `serialize`, not the framework stamp. `sendToSidebar` still returns the note byte-identical
  for a strict body. No path added here can stamp into a strict body.
- **Can-fail re-derived independently.** I copied the branch's `dseSidebarView.test.ts` onto
  base source and ran it: **2 failed, 8 passed** — exactly the two new dedupe guards
  ("pinning the SAME anchored block twice…", "strict-body panels dedupe on BODY…") fail,
  while "three genuinely different blocks still get three panels" passes. The guards are
  targeted, not vacuous.
- **The note write is surgical** (probe a) — the single most important property for code that
  writes into user notes, and it holds.

---

## What a fix round should contain

1. **Finding 1** — stop rewriting an existing generated block on the "open" path; bind to it.
   If re-sync is wanted, give it its own explicit action.
2. **Finding 2** — make the regenerated block reclaim the existing panel (or let `addPanel`
   replace a panel whose block no longer resolves).
3. Re-run the battery; a note-integrity test for "hand-edited tracker is not clobbered"
   belongs with (1), and the delete-and-repress panel count belongs with (2).

Findings 3 and 4 are fine to leave documented as-is.

## Review hygiene

Three temporary probe suites were added under `test/dom/framework/_sc153ReviewProbe*.test.ts`
and **deleted** after the run; one scratch worktree at `221acc9` was created and removed
(`git worktree prune` run). The branch worktree is clean at `102b43c` and the workspace shows
only the pre-existing `m draw-steel-elements` submodule-pointer modification. One correction
worth recording: my first persistence probe reported a false "the anchor never reaches the
note" because its regex matched `_dse_anchor` across the fence boundary into the *initiative*
block, and its fake-timer placement starved the flush. Re-probed properly, the mechanism
works — the false alarm is not in the findings above.

---

# Fix round 1 — applied (same reviewer, now implementing)

**Commit:** `ff56aca` `fix(encounter,sidebar): stop "Open in sidebar" destroying live tracker
state (SC-153 fix round 1)`, on top of `102b43c`. Branch `sc153-sidebar-dup`, unlanded,
superproject pointer left unstaged. Shared main checkout and shared freeze baseline untouched.

Scope was the orchestrator's ruling: fix Findings 1 and 2, keep the landed dedupes and the
strictBody contract, add no re-sync affordance, and leave Findings 3 (debounce starvation) and
4 (copy-pasted `_dse_from`) to FOLLOWUPS #68/#69.

## Finding 1 — the destructive rewrite is gone

`writeTrackerBlock`'s `vault.process` callback, when `findGeneratedBlock` finds this
encounter's tracker, now returns `content` **unchanged** and takes only `existing.lineStart`
for the hand-off. The splice, the anchor-line re-stamp and the regenerated body are all
removed from that branch. The create branch (no marked block found — first press, or the user
deleted it) is untouched.

The Notice changed with the behaviour: `"…already has an initiative tracker block — opening
it."` rather than `"…was refreshed."`, because nothing is refreshed and the warmer wording
implied exactly the destructive semantic being removed.

**Accepted consequence, recorded in the code:** an encounter edited *after* its tracker was
generated no longer pushes those edits into the tracker. That is the cost of not regenerating
a live document behind a button labelled "Open in sidebar"; re-sync needs its own explicit
action, which is out of scope by ruling. The manual regenerate — delete the tracker block and
press again — works, and is covered by the delete-and-re-press test below.

## Finding 2 — the orphaned panel is swept

`DseSidebarView.addPanel` keeps the identity dedupe first (a re-pin of a block that still
exists reveals its panel and returns). When it does mount a new panel, it then runs
`evictOrphanedSiblings`: same note **and** same alias, never the panel just mounted, removing
only those whose backing block no longer resolves.

The check is `SidebarPanel.stillAddressable()`, which **re-reads the note through the host**
instead of trusting cached content — it runs precisely when someone else has just changed the
file, and the vault `modify` listener is not guaranteed to have landed (in a synthetic host it
may never fire at all). `SidebarBlockHost.refresh()` is safe to call again; its listener
registration is guarded. The method answers "keep" for anything that is not a definite "gone"
(no host yet, read failure), so it can only ever remove debris.

## Tests

`test/dom/framework/sidebarEncounterHandoff.test.ts`: the "later press REFRESHES" case is
**retargeted** to "later press BINDS and writes nothing" — its strongest new assertion is
`expect(afterSecond).toBe(afterFirst)`, a byte-identical note across the press — plus two new
cases pinning the findings directly:

- **state survival:** create the tracker, hand-edit it with `round: 3` and a combatant at
  `current_hp: 7`, press again → all three survive, and it is still one fence and one panel.
- **delete-and-re-press:** delete the fence, press again → one fence, and **exactly one**
  panel, non-degraded, with a live `[data-dse-element="initiative"]` inside it.

**Can-fail proven, both directions.** Restoring the splice fails the byte-identical case *and*
the state-survival case (2 failed / 7 passed). Removing the `evictOrphanedSiblings` call fails
the delete-and-re-press case (1 failed / 8 passed). Both mutations reverted; the worktree is
clean.

## Battery (verbatim, at `ff56aca`)

```
tsc=0
lint=0
jest=0
Test Suites: 1 skipped, 165 passed, 165 of 166 total
Tests:       1 skipped, 2712 passed, 2713 total
Snapshots:   3 passed, 3 total
shots=0
203        (ok lines)
0          (FAIL lines)
freeze=0
freeze OK (67/67 steel-print PNGs byte-identical)
parity=0
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

Jest 2710 → **2712** (+2: one retargeted in place, two added). Shots, freeze and parity all
unmoved, as expected for a TS-only change.

## Post-fix status of the review's findings

| Finding | Status |
|---|---|
| MAJOR 1 — live tracker state destroyed on re-press | **FIXED**, can-fail proven |
| MEDIUM 2 — duplicate panel after deleting the tracker | **FIXED**, can-fail proven |
| LOW 3 — debounce starvation window | deferred, FOLLOWUPS #68 |
| INFO 4 — copy-pasted `_dse_from` | deferred, FOLLOWUPS #69 |
| Note write is surgical (probe a) | unchanged, still holds |
| strictBody / SC-158 | unchanged — this round adds no write path at all |

## Concerns

1. **The encounter/tracker sync gap is now permanent until someone builds the re-sync
   action.** Editing an encounter after generating its tracker leaves the two silently out of
   step, with no affordance saying so. That is the deliberate trade (a stale tracker is
   recoverable; a wiped one is not), but it is a real usability hole and should be a ticket
   rather than folklore.
2. **`stillAddressable()` costs one vault read per same-note/same-alias sibling panel, per
   pin.** Negligible at realistic panel counts and it is `cachedRead`, but it is I/O on a path
   that previously did none.
3. **The orphan sweep is async and fire-and-forget**, matching `mountPanel`'s existing
   convention. The new test therefore awaits two macrotask flushes; a caller that inspects
   panel count synchronously right after `addPanel` will still briefly see the orphan.
4. I both reviewed and fixed this. The can-fail proofs are the guard against that being a
   rubber stamp, but a second pair of eyes on `ff56aca` is worth having before landing.
# SC-153 — independent RE-review of fix round 1 (delta `102b43c..a0c23e4`)

**Reviewer:** second independent agent. Did not write the original review, did not write the
fix. No source changed (two mutations applied and reverted — see "Can-fail, re-derived"),
no Linear touched, shared main checkout untouched, shared freeze baseline untouched.
**Subject:** `ff56aca` (fix) + `a0c23e4` (docs) on branch `sc153-sidebar-dup`, worktree
`/home/scott/code/steelCompendium/worktrees/sc153-sidebar-dup/draw-steel-elements`.
**Date:** 2026-08-16. Worktree left clean at `a0c23e4`.

## Verdict

**FIX ROUND — text only. The code is LAND.**

Both graded defects are genuinely fixed, and I could not break either one. Every
note-integrity property I pushed on held, including three cases the original review never
tried (block moved by hand, two notes each with a tracker, a real tracker self-write through
`replaceSource`). The battery reproduces exactly as claimed. The fixer's own three concerns
were probed by execution and all three came back smaller than stated.

What is not shippable as-is is the **user-facing prose**: `CHANGELOG.md` still tells users
that a re-press "refreshes that same block in place" — the precise destructive behaviour this
round deleted — and the reused Notice string now claims the "Create tracker block" button is
"opening it" when it opens nothing. Two text edits, no logic, re-gated by `tsc`/`lint`/`jest`
only (shots/freeze/parity cannot move on a string). If the orchestrator would rather land the
code now and file the text, that is a defensible call — nothing here risks data.

---

## Battery at `a0c23e4` — measured, full battery in order

| Gate | Claimed | Measured | |
|---|---|---|---|
| `npm run tsc` | 0 | exit **0**, no output | ✅ |
| `npm run lint` | 0 | exit **0**, no output | ✅ |
| `npx jest` | 2712 + 1 skipped / 165 suites | exit **0** — **2712 passed, 1 skipped, 2713 total; 165 passed + 1 skipped of 166 suites; 3 snapshots** | ✅ |
| `npm run shots` | 203 / 0 | exit **0** — **203 `ok`, 0 `FAIL`** | ✅ |
| `check-freeze.sh` | 67/67 | exit **0** — `freeze OK (67/67 steel-print PNGs byte-identical)` | ✅ |
| `npm run parity` | 0/0/16 | exit **0** — **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, 16 `DECLARED` rows, 0 `GAP` | ✅ |

Run from the worktree (jest counts are location-sensitive — `token-coverage.test.ts` skips 2
outside a known layout; the `1 skipped` here is the expected single skip, not that artifact).
Freeze baseline verified untouched: 67 lines, mtime `2026-08-12 22:45`, predating the branch.
Delta is 5 files (1 doc, 3 src, 1 test); no CHANGELOG, no fixture, no CSS — consistent with
shots/freeze/parity being immovable.

---

## Claim-by-claim, by execution

All probes ran against the real `plugin.onload()` wiring on the mock vault, in a temporary
suite (`test/dom/framework/_sc153RereviewProbe.test.ts`, 16 cases, all green) that has since
been **deleted**.

### (1) MAJOR 1 — live tracker state survives a re-press: **CONFIRMED**

- **P-A** — create the tracker, hand-edit it (`round: 3`, `Improvised Ally`, `current_hp: 7`),
  press again: `byteIdentical=true`, `round3=true ally=true hp7=true`, `fences=1 panels=1`,
  panel non-degraded. The note is returned **byte-identical**, not merely "state-preserving".
- **P-I — the case the branch's own tests do not cover, and the one that actually matters.**
  Instead of hand-editing note text, I drove the panel's **real** persist path
  (`SidebarBlockHost.replaceSource` on the live mounted panel, the way the tracker's own
  controls write), then pressed again: `wrote=true round4kept=true
  byteIdenticalAcrossPress=true fences=1 panels=1`. This is the actual "GM plays for twenty
  minutes, presses again" gesture, through production write machinery.
- **P-H — the load-bearing round-trip, also uncovered by the branch.** The whole fix rests on
  `findGeneratedBlock` still matching after the tracker has saved itself. Driving
  `ds-initiative`'s own `parse` → `serialize`: `roundtripHasFrom=true
  roundtripHasAnchor=true`. Both `_dse_from` and `_dse_anchor` survive the element's
  serializer, so no realistic in-app path strips the provenance marker.
- **P-L** — stale-not-corrupt: re-press leaves the note byte-identical, fires the new Notice
  once, and fires `/was refreshed/` **zero** times.
- **P-B — create branch untouched:** first press on a virgin note → `fences=1 panels=1
  hasFrom=true hasAnchor=true`, "tracker block created" Notice present.

### (2) MEDIUM 2 — exactly one live panel after delete-and-re-press: **CONFIRMED**

**P-C**: pin, delete the whole fence, press again → `finalPanels=1`, `degraded=[null]`,
`live=[true]` (a real `[data-dse-element="initiative"]` inside), `fences=1`. No degrade card,
no duplicate.

**P-O — the safety property the fix must not violate, which no shipped test pins.** The sweep
must take the orphan and *only* the orphan. Three anchored `ds-initiative` blocks in one note
(`aaa111`, `bbb222`, `ccc333`); pin the first two; delete `aaa111`'s block; pin `ccc333`:

```
panelsAfterTwoPins  = 2   anchors = [aaa111, bbb222]
panelsAfterThirdPin = 2   anchors = [bbb222, ccc333]   ← orphan gone, HEALTHY sibling kept
```

`evictOrphanedSiblings` is correctly narrow for anchored elements. (For strict-body elements
it is not quite — Finding 3.)

### (3) Can-fail, re-derived independently — **both directions confirmed**

I applied each mutation myself and reverted it (`git checkout`; worktree verified clean after):

| Mutation | Claimed | Measured |
|---|---|---|
| `void this.evictOrphanedSiblings(panel);` removed from `addPanel` | 1 test fails | **1 failed / 8 passed** — `deleting the tracker and pressing again leaves exactly ONE live panel`, `Expected length: 1 / Received length: 2` |
| Pre-fix splice restored in `writeTrackerBlock` | 2 tests fail | **2 failed / 7 passed** — `a later press BINDS to the same block and writes nothing` + `re-pressing does NOT destroy live tracker state` |

Both guards bite, and they bite on exactly the right assertions. Worth recording from the
first mutation's failure dump: **both** surviving panels render fully-live initiative DOM —
the orphan is not a visible degrade card in the harness (the mock vault's `on()` is a no-op
stub, so no `modify` ever fires). That is precisely why `stillAddressable()` re-reads through
`host.refresh()` rather than trusting cached content; the fixer's rationale for that choice is
correct and I could not find a cheaper substitute that works in the same conditions.

### (4) Note integrity — **holds everywhere I pushed**

| Probe | Scenario | Result |
|---|---|---|
| P-D | Prose above **and** below the fence, then 2 more presses | note byte-identical; intro kept; `TAIL PROSE` kept and **still after** the fence |
| P-E | **Two encounters, one note**, pressed repeatedly | `fences=2`, two distinct `_dse_from` ids, 2 live non-degraded panels — no cross-talk, and no cross-eviction |
| P-F | **Two notes**, each with its own tracker, pinned in turn | 2 panels, both live; `filePath` guard stops the sweep from reaching across notes |
| P-G | Generated block **cut and moved by hand** to the top of the note | note byte-identical, `fences=1`, 1 live panel, **0** ambiguity Notices — the id-based lookup survives repositioning, which is the property position-keyed addressing never had |
| P-N | strictBody (`ds-scc`) pinned | note **byte-identical** through both pins |

**strictBody / SC-158 contract intact.** `ds-scc` is still the only `strictBody: true`
element; the delta adds no write path at all (the reuse branch now `return content`s, and
`stillAddressable` is `cachedRead` + a pure string scan). Verified by execution in P-N, not
just by reading.

**Popout windows — clean, by inspection (jsdom cannot test multi-window).** The three changed
source files contain **zero** references to `window`, `document`, `activeDocument`,
`activeWindow` or `globalThis` (the only greps that hit are the word "document" inside prose
comments). `stillAddressable()` is pure vault I/O; `evictOrphanedSiblings` walks the view's own
panel array; `reveal()`'s `scrollIntoView` is invoked on the element itself, so it resolves in
whatever window owns it. This delta introduces no new window-bound surface.

### (6) The docs commit `a0c23e4` — **good**

Docs-only (`docs/running-an-encounter.md`, +22, single file). Plain-language and user-facing;
**no ticket references in the body** (SC-153 appears only in the commit subject); it states
the snapshot semantic explicitly, explains *why* rather than just *what*, and gives the
regenerate procedure (delete the block, press again) with the right warning ("between fights,
not during one"). It lands in the correct place in the guide, right after the two buttons are
introduced. One sentence is inaccurate — see Finding 2.

---

## Findings

### Finding 1 — MEDIUM: `CHANGELOG.md` still ships the removed destructive behaviour

`CHANGELOG.md` line 24, under `## Unreleased`, still reads:

> …the first press creates the tracker, **and every press after that refreshes that same
> block in place** and reveals the panel it is already pinned to.

That bullet was written for `4d531b1`/`102b43c`. `ff56aca` deleted exactly that behaviour, and
`a0c23e4` added a docs section that says the **opposite** ("those changes do not appear in a
tracker that already exists"). The fix round updated the guide and left the changelog behind.

This is the public record — the workspace CLAUDE.md routes user-facing changes here, and the
bullet gets promoted to a dated header at deploy. A GM reading it would expect encounter edits
to flow into an existing tracker (they do not, by design) and could reasonably fear the button
rewrites their combat state (it does not, by design). It is wrong in both directions at once.

**Reproduction:** `sed -n '17,26p' CHANGELOG.md` at `a0c23e4`, against probe P-A/P-L (note
byte-identical across a re-press) and the docs section at `docs/running-an-encounter.md:59`.

**Fix:** replace the second half of the bullet. Something like — *"…the first press creates the
tracker; every press after that simply reopens the one it already made, leaving your combat
state untouched. The tracker is a snapshot of the encounter at build time, so later encounter
edits need a manual regenerate: delete the tracker block and press again."*

### Finding 2 — LOW: the "Create tracker block" button now claims it is "opening it", and opens nothing

The reuse Notice is shared by both handlers, and this delta retargeted it to sidebar-specific
wording. Measured (probe P-P), second press of `[aria-label="Create initiative tracker block"]`:

```
notices = ['Draw Steel Elements: this encounter already has an initiative tracker block — opening it.']
sidebarLeafOpened = 0        fences = 1
```

`handleCreateTrackerBlock` only calls `writeTrackerBlock`; there is no hand-off and no leaf.
The pre-fix string ("was refreshed") was wrong in a different way, but it was at least neutral
between the two buttons — the new one is a direct claim about something that did not happen.
The same slip reaches the new docs: *"after that they just reopen the one you already have"* is
true of **Open in sidebar** only.

**Fix:** pass the wording in from the caller, or make it button-neutral (e.g. "…already has an
initiative tracker block — leaving it as it is."), and soften the docs sentence to name the
sidebar button.

### Finding 3 — LOW: the sweep can silently close a strict-body panel the user is still looking at

New behaviour introduced by `evictOrphanedSiblings`, reachable only for `strictBody` elements
(today: `ds-scc` alone). Measured (probe P-N) — note with two `ds-scc` blocks:

1. Pin block A (`…/gouge`) → 1 panel; note byte-identical. ✅
2. User **edits block A's body** to `…/gouge-renamed`. For a strict-body block the body *is*
   the identity, so the binding is now stale.
3. Pin the unrelated block B (`…/hurl`) → new panel mounts, sweep runs →
   **`panelsAfterSecondPin = 1`.** Panel A is gone.

Cause: `findUnanchoredBlock`'s exact-body lookup misses, and its "single fence of this alias →
re-bind" softening cannot fire because the note now has two fences → `getBlockInfo()` is null
→ evicted. Before this delta the user got the designed affordance — the *"Backing block not
found — re-link this panel from the note"* card, which tells them what happened. Now the panel
simply disappears, as a side effect of pinning something unrelated, with no Notice.

Defensible as "debris is debris", and narrow (needs ≥2 `ds-scc` in one note, one pinned, its
body edited, then another pinned). Note integrity is untouched throughout. But it is a new,
silent, user-visible panel close and it deletes a message the user was meant to read.

**Fix (either):** skip eviction for panels currently rendering the degrade card (they are the
user's notification, not debris); or restrict the sweep to anchored panels
(`state.anchorId !== null`), which is the only case the fix was written for — P-C and P-O both
still pass under that restriction.

### Finding 4 — INFO: the async sweep, quantified (fixer's concern 3 — real, harmless)

Probe P-M, reading the panel array with zero awaits after a direct `addPanel`:

```
panelsSync = 2   domSync = 2   afterFlush1 = 1   afterFlush3 = 1
```

Confirmed exactly as the fixer described. **No production path is affected:** the only
`addPanel` caller is `sendToSidebar`, which discards the return value and reads nothing;
`setState` uses `mountPanel` and bypasses the sweep entirely. The one theoretical exposure is
`getState()` (workspace layout serialization) landing inside that one-macrotask window and
persisting the orphan, which `setState` would then remount unswept — self-healing on the next
pin. Not worth code.

### Finding 5 — INFO: `stillAddressable()`'s I/O cost is smaller than the fixer feared (concern 2)

Probe P-K instruments `vault.cachedRead` across a **deduped re-press** — the overwhelmingly
common case, and the one the ticket is about:

```
cachedReads on a deduped re-press = 0
```

The identity dedupe in `addPanel` returns before the sweep is ever reached, so the ordinary
"press the button again" path adds **zero** vault reads. The one-read-per-sibling cost is paid
only when a genuinely new panel mounts, bounded by same-note **and** same-alias siblings. Concern
2 can be closed rather than carried.

### Finding 6 — INFO: hand-stripping `_dse_from` resurrects the duplicate

Probe P-J: delete the `_dse_from:` line from the generated fence, press again → `fences=2
panels=2`. By construction — the marker *is* the identity. Same class as FOLLOWUPS #69, and
P-H shows no in-app path strips it (the element's own serializer round-trips it), so this needs
a user with a text editor and a reason. Recording it only because it is the one input that
brings the reported symptom back.

---

## Fixer's concerns — disposition

| # | Concern | Verdict |
|---|---|---|
| 1 | Encounter/tracker sync gap is now permanent until someone builds re-sync | Real, correctly documented in `docs/running-an-encounter.md`. Deserves a ticket, not folklore — agreed. Not a blocker. |
| 2 | `stillAddressable()` costs a `cachedRead` per sibling per pin | **Overstated** — 0 reads on the deduped re-press (P-K). Close it. |
| 3 | Sweep is async; a synchronous count sees the orphan | **Reproduced** (P-M), **no production path affected**. Finding 4. |
| 4 | "I both reviewed and fixed this" | Addressed: both can-fail proofs independently re-derived, and 8 scenarios probed that the fix round's own tests do not cover (P-F, P-G, P-H, P-I, P-J, P-K, P-N, P-O). Two of those (P-H, P-I) exercise the load-bearing round-trip the shipped tests only approximate by hand-editing text. |

## Prior findings — status at `a0c23e4`

| Finding | Status |
|---|---|
| MAJOR 1 — live tracker state destroyed on re-press | **FIXED**, independently verified through the real persist path (P-I) |
| MEDIUM 2 — duplicate panel after deleting the tracker | **FIXED**, and the sweep verified narrow (P-O) |
| LOW 3 — debounce starvation | deferred, FOLLOWUPS #68 — confirmed present in the file |
| INFO 4 — copy-pasted `_dse_from` | deferred, FOLLOWUPS #69 — confirmed present in the file |
| Surgical note write | holds, extended: byte-identical, and survives the block being moved (P-G) |
| strictBody / SC-158 | holds, verified by execution (P-N); the delta adds no write path |

## Review hygiene

One temporary probe suite (`test/dom/framework/_sc153RereviewProbe.test.ts`, 16 cases) added
and **deleted**. Two source mutations applied for can-fail re-derivation
(`DseSidebarView.ts`, `encounter/view.ts`), both reverted via `git checkout`. No scratch
worktree created. Shared main checkout never touched; shared freeze baseline never touched
(67 lines, mtime `2026-08-12 22:45`); display `:1` never used (no `obsidian-shots`/`docs-shots`).
Worktree verified clean at `a0c23e4` (`git status --porcelain` empty); the workspace shows only
the pre-existing `m draw-steel-elements` submodule-pointer modification.

---

# Fix round 2 — applied (same agent, now implementing)

**Commit:** `8ee1b72` `fix(sidebar,encounter,docs): SC-153 fix round 2 — re-review findings 1-3`,
on top of `a0c23e4`. Branch `sc153-sidebar-dup`, unlanded, superproject pointer left unstaged.
Shared main checkout untouched, shared freeze baseline untouched, display `:1` never used.

Scope was the orchestrator's ruling: fix re-review Findings 1, 2 and 3 and nothing else.
Findings 4/5/6 closed by ruling (5 retracted, 6 → FOLLOWUPS #69).

## Finding 1 — the CHANGELOG now describes what ships

The `## Unreleased` bullet still said *"every press after that refreshes that same block in
place"* — the destructive rewrite fix round 1 deleted, and the direct opposite of the docs
section that same round added. Rewritten to the shipped behaviour: a re-press binds and
reopens **without writing a byte**, so a fight in progress keeps its round counter, Stamina,
conditions and table-added combatants; the tracker is a snapshot; delete the block and press
again to regenerate. The surrounding bullet (the bug description, the durable-id sentence, the
sidebar-wide dedupe sentence) is unchanged — only the half that was wrong.

## Finding 2 — the Notice is per button

`writeTrackerBlock` gained an `opensSidebar: boolean` that selects **wording only** — the write
path is byte-identical for both callers, which the parameter's doc says explicitly.
`handleCreateTrackerBlock` passes `false`, `handleOpenInSidebar` passes `true`.

- **Open in sidebar** (unchanged): *"…already has an initiative tracker block — opening it."*
- **Create tracker block** (new): *"…already has an initiative tracker block — left unchanged.
  Delete it to build a fresh one."*

The reuse branch is the one moment the user is standing in front of the manual regenerate, so
the non-opening variant names it. `docs/running-an-encounter.md`'s *"after that they just
reopen the one you already have"* — true of one button only — now splits the two by name.

## Finding 3 — the sweep is anchored-only

`evictOrphanedSiblings` skips any panel with `state.anchorId === null`.

The reasoning matters more than the line, and it is recorded in the code: **only a stamped
`_dse_anchor` makes "not addressable" mean "definitely gone."** `findAnchoredBlock` scans for a
durable id, so a miss is a deletion (or a move to another note). A body-addressed panel
(SC-158 `strictBody`, i.e. `ds-scc`) has no id — its identity IS its body text — so one
retyped character reads as "gone" while the block sits right there, and the thing the sweep
then closed was the *"Backing block not found — re-link this panel from the note"* card, which
is the user's only notice that the binding broke.

**The obvious alternative guard is wrong, and this is the load-bearing finding of the round.**
"Skip panels currently showing the degrade card" looks equivalent and is not: in **production**
the orphan this sweep exists to clear is *normally already degraded* — deleting the block fires
vault `modify` → `notifyAnchorLost` → that same card. So that guard would un-fix MEDIUM 2 in
the real app **while every jsdom test kept passing**, because the mock vault's `on()` is a
no-op stub and the harness never degrades the orphan at all. A false green of exactly the kind
this review exists to catch. Authoritative identity is the property that actually separates
"deleted" from "edited"; degradation state does not.

## Tests (+2, both can-fail proven)

| Test | Mutation | Result |
|---|---|---|
| `dseSidebarView`: *the orphan sweep never closes a BODY-ADDRESSED panel — its degrade card survives* | remove the `anchorId === null` guard | **1 failed** — the degraded panel is swept |
| `sidebarEncounterHandoff`: *"Create tracker block" re-press does not claim to open anything* | collapse the Notice split back to one string | **1 failed** — asserts zero sidebar leaves and the non-opening wording |

The existing re-press case was tightened from `/already has an initiative tracker/` to the
`— opening it` variant specifically, so the two wordings cannot drift into each other.

One assertion had to be corrected during development and is worth recording: `isConnected` is
useless in this harness — the whole leaf subtree is detached from `document` in jsdom, so
**every** panel reports `isConnected === false`, passing or failing. The test asserts
membership in the live panel list instead.

## A leaked timer, found and fixed

The new create-button test initially made jest's worker teardown report *"Active timers can
also cause this, ensure that .unref() was called on them."* Bisected to that single test
(skipping it → zero occurrences), diagnosed rather than suppressed: the first press mints the
encounter's `_dse_anchor` and schedules `ElementView.persist()`'s 400ms write-behind
(`PERSIST_DEBOUNCE_MS`), while `flushAsync` only pumps three `setTimeout(0)` macrotasks. Every
other case in this file opens a sidebar leaf, so `plugin.onunload()` has a panel to tear down;
this one never does, so nothing flushed the timer. The test now waits out the debounce.
Verified: `warn=0`, exit 0.

## Battery at `8ee1b72` — full battery in order, all six gates exit 0

| Gate | Expected | Measured | |
|---|---|---|---|
| `npm run tsc` | 0 | **0** | ✅ |
| `npm run lint` | 0 | **0** | ✅ |
| `npx jest` | 2712 +1/+2 | **2714 passed, 1 skipped, 2715 total; 165 of 166 suites; 3 snapshots** (+2) | ✅ |
| `npm run shots` | 203 / 0 | **203 ok, 0 FAIL** | ✅ |
| `check-freeze.sh` | 67/67 | **`freeze OK (67/67 steel-print PNGs byte-identical)`** | ✅ |
| `npm run parity` | 0/0/16 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | ✅ |

Shots/freeze/parity unmoved, as expected for a TS+markdown change.

## Environment note — a PRE-EXISTING flaky suite, not this branch

While gating, intermediate full-jest runs failed 1–9 tests, always in
`test/dom/views/settings-tab.test.ts` / `settings-preview.test.ts`, always
`Exceeded timeout of 5000 ms`, with those suites taking 26–111s wall. Cause: an external load
spike on this machine (load average peaked at **63** with **zero** node processes belonging to
this session).

Proven pre-existing rather than caused by this branch:

- `settings-tab.test.ts` run alone: **48/48 passed, three times in a row.**
- **Baseline `a0c23e4` with these changes stashed, under the same load: the same suite failed
  the same way** (1 failed, 5000ms timeout).
- Both suites are settings/preferences code; this branch touches sidebar + encounter only.

The battery table above was taken at normal load. Worth a FOLLOWUPS entry (a 5s per-test
timeout across 48 tests that each build a loaded plugin is load-sensitive by construction) —
**not filed here**, because `FOLLOWUPS.md` lives in the shared main checkout this agent must
not touch. Flagged to the orchestrator instead.

## Review hygiene

Four source mutations applied for can-fail derivation and all four reverted (verified by
`git diff` before commit). No probe files remain. Worktree clean at `8ee1b72`.
