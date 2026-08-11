# SC-158 — review of the `_dse_anchor` strict-body corruption fix

**Verdict: LAND.** The release-blocking corruption bug (any `ds-scc` block permanently
broken by "Send block to sidebar") is fixed correctly and durably, verified independently
with a can-fail proof. One new MEDIUM finding not covered by the shipped test suite or the
fix report's own concerns list — a narrow, non-corrupting, silent mis-bind in a specific
multi-block edge case — recommended as a follow-up, not a blocker.

Reviewer: independent, worktree `/home/scott/code/steelCompendium/worktrees/sc158-anchor`,
single commit `63d9be4` on dse main `ac78c6a`. No code modified in the worktree; two
throwaway probe files were written to a `/tmp` copy of the tree (one for the duplicate-body
edge case, one for the can-fail revert) and deleted afterward. Worktree `git status` clean;
superproject shows only the expected unstaged `draw-steel-elements` pointer bump.

---

## Battery — reproduced independently at `63d9be4`

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | 0 |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation warning) | 0 |
| `npx jest` | **2694 passed / 1 skipped / 2695 total, 165 passed suites (1 skipped) of 166, 3 snapshots** | 0 |
| `npm run shots` | **200 `ok` lines, 0 FAIL** | 0 |
| `check-freeze.sh <shots>` | **`freeze OK (66/66 steel-print PNGs byte-identical)`** | 0 |
| `npm run parity` (last) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0 |

Every number matches the fix report's "Battery (verbatim)" section exactly.

`obsidian-shots` NOT independently re-run, as instructed. The report's real-Obsidian
evidence is internally consistent: the before/after exit-code claim (1 → 0, 59/59), the
named previously-failing capture (`scc--obsidian-sidebar-steel-dark.png`), and the vault
grep pair (`scc.md` — 0 `_dse_anchor` hits; `statblock.md`/`hero.md`/`negotiation.md` — 1
hit each, distinct ids) all agree with each other and with what the jsdom battery
independently proves about the same mechanism. No internal contradiction found.

**Shared workspace state.** No `.pre-sc158*` backup of `freeze-baseline.sha256` exists, and
`63d9be4`'s diff touches nothing under `.superpowers/` — this branch does not write to the
shared baseline. (Aside, not an SC-158 finding: the shared `freeze-baseline.sha256` at the
main workspace checkout currently reads 66 lines, down from 200 lines observed in an
unrelated review earlier this session — that gap reflects ~11 days of unrelated concurrent
workspace activity between the two tasks, not anything this branch did. This worktree's own
`check-freeze.sh` run against its own regenerated shots came back a clean, self-consistent
`66/66`, matching the fix report's own stated baseline size at `ac78c6a` exactly.)

---

## Probe 1 — the corruption is dead: CONFIRMED

Reproduced against the real `sendToSidebar` + real pipeline (the shipped
`sidebarScc.test.ts`, re-run and re-read line by line):
- the note is byte-identical after pinning a `ds-scc` block, and contains no `_dse_anchor`
  anywhere;
- the block renders its card afterward (not the strict-body refusal — verified against the
  actual `.dse-ref-notice` DOM text, not just the absence of a thrown error);
- the panel mounts in a real sidebar leaf and shows the rendered card.

## Probe 2 — YAML elements unbroken: CONFIRMED

- `sendToSidebar` on a YAML-bodied element (`ds-counter` in the shipped suite) still stamps
  `_dse_anchor: <id>` into the note exactly as before — the `strictBody` branch is opt-in,
  gated per-element via `services.registry.get(alias)?.strictBody === true`, and nothing
  else in the registry sets it.
- The real-Obsidian evidence pair in the fix report shows the SAME camera run pinning
  `statblock.md`/`hero.md`/`negotiation.md` and all three still carrying distinct
  `_dse_anchor:` ids — the anchored mechanism is provably untouched in a real app, not just
  in jsdom.
- `SidebarBlockHost`'s anchored path (`locate()` → `findAnchoredBlock`) is unchanged logic;
  the only edit to its call sites was adding the new `boundBody` constructor parameter
  (`test/dom/framework/sidebarBlockHost.test.ts`'s only diff is passing `null` for it on the
  anchored-host test fixture). All of that file's pre-existing anchored-path assertions
  still pass.
- Re-pinning an already-anchored block: `ensureAnchor`'s idempotency (`readAnchor` finds
  the existing id and returns without a second write) is pre-existing, unmodified logic,
  covered by `test/unit/framework/anchor.test.ts`'s "idempotent once anchored" case, which
  still passes.

## Probe 3 — body-text addressing edge cases

| Scenario | Behavior | Assessment |
|---|---|---|
| Two `ds-scc` blocks, **different** codes; pin the second (cursor inside it) | Panel binds to the correct (second, cursor-selected) block — `findFenceByBody` finds a unique exact-content match. Covered by the shipped `sidebarScc.test.ts` ("with two ds-scc blocks, the cursor picks which one is bound"), independently re-run and passing. | Correct, as designed. |
| Two `ds-scc` blocks, **identical** codes; pin the second (cursor inside it) | **New probe, not in the shipped suite.** `sendToSidebar` correctly identifies the cursor's block at bind time (`boundBody` = the second block's body — verified). But the very first `getBlockInfo()` call afterward resolves to the **first** (topmost) occurrence, not the second, because `findFenceByBody` returns on the first content match with no ambiguity check. No `Notice` fires, because `sendToSidebar`'s own ambiguity-notice logic (`noticeLine`) only fires when the cursor's block could **not** be resolved — here it was resolved correctly, so the mismatch is fully silent. | **Finding, MEDIUM — see below.** |
| Pinned block's own body edited, **single-block** note | Re-binds automatically (`findFenceByBody` misses the old body → falls to "note has exactly one block of this alias" → rebinds and updates `boundBody`). Covered by the shipped suite, re-verified. | Correct, matches the documented design. |
| Pinned block's own body edited, **multi-block** note (2+ blocks of that alias remain) | Exact match is lost, the single-block re-bind heuristic doesn't fire (`fences.length !== 1`), so `locate()` returns `null` → the existing "block vanished" signal (`notifyAnchorLost`/`onAnchorLost`) fires, driving the panel to its established read-only degrade card. No crash, no silent wrong-block bind. | Correct — matches the fix report's own stated design tradeoff ("with two or more candidates there is no safe guess, so it degrades... rather than binding to the wrong block"). |

### Finding: silent mis-bind to the wrong occurrence when two blocks share identical bodies (MEDIUM)

**Where:** `src/framework/sidebar/anchor.ts`'s `findFenceByBody` (returns the first content
match, unconditionally) and `SidebarBlockHost.findUnanchoredBlock` (calls it with no
ambiguity check — contrast with the *other* branch in the same function, the "note has
exactly one block of this alias" heuristic, which explicitly refuses to guess when there is
more than one candidate).

**What happens:** if a note has two `ds-scc` blocks with the exact same SCC code, and the
user pins the **second** one (cursor inside it), the panel is bound to the **first**
occurrence starting from the very first lookup — not from some later edit, immediately.
`sendToSidebar`'s own ambiguity-`Notice` mechanism does not catch this, because it only
fires when the cursor's block **could not** be resolved at bind time; here it resolves
correctly (to the second block) and the divergence appears one layer up, in
`SidebarBlockHost`, which has no way to prefer "the one that was originally bound" over
"the first one that matches."

**Why it's not release-blocking today:** `ds-scc` is `shape: 'static'` with no editable
model and no persisted write path from the sidebar panel itself, and the two blocks in
question are — by construction of this exact scenario — rendering identical content. So the
visible symptom today is nothing: the wrong block is silently substituted, but it looks
right. The consequence only surfaces on a **later, independent** edit or deletion of
specifically the second (originally pinned) block: the panel keeps tracking the untouched
first block and does not reflect that edit, which will read as "the sidebar didn't notice I
changed the code" rather than as an error.

**Why it's worth a finding regardless:** it contradicts the documented guarantee
(`sendToSidebar`'s own doc comment: "binds the occurrence at (or nearest) the cursor... only
when that fallback was actually ambiguous... surfaces a Notice") for a case the author
didn't have in view — the fix report's "Concerns" section discusses only the
multi-block-plus-edit degrade case (item 3), not this duplicate-content case, and no test in
the shipped suite exercises two blocks with the *same* body (the existing two-block test
deliberately uses different codes, which is exactly what makes it pass and this case fail).
It is also the first `strictBody` element's mechanism, so it will inherit unchanged by any
future `strictBody` element — including one that DOES have a persisted, writable model,
where a silent bind to the wrong-but-content-identical-at-pin-time block followed by a write
would move a user's edit into a block they didn't intend to touch.

**Suggested fix (not scoped to this round; filing as follow-up):** disambiguate
`findFenceByBody`/`findUnanchoredBlock` by position — e.g. thread the original
`cursorLine`/ordinal through `SidebarPanelState` alongside `body`, and prefer the candidate
closest to (or matching) that recorded position when more than one block's body matches
exactly, falling back to "first" only when no position hint is available (e.g. after a
restart with `getState()`-only data). Reproduced via a probe test, not shipped with this
review — available on request; not committed anywhere.

## Probe 4 — the `strictBody` contract: CONFIRMED, no other violators found

- `strictBody` is defined once (`src/framework/registry.ts`, `ElementDefinition.strictBody`)
  with the documented contract ("this element's body has an EXACT, non-YAML grammar... the
  framework must never write its own metadata into it").
- `ds-scc` is the only element that sets it (`src/elements/scc/definition.ts:230`); grepped
  `strictBody` across `src/` — every other hit is either the definition, its one reader
  (`registration.ts`'s `sendToSidebar`), or doc-comment cross-references in
  `anchor.ts`/`SidebarBlockHost.ts`/`DseSidebarView.ts`.
- Checked every other body-writing path in the framework:
  - **`prefOverrides.ts`'s `extractPrefOverrides`** only pops a `prefs:` key from a parsed
    YAML **object**. A `ds-scc` body that successfully resolves to a `ref` is, by
    `parseSccBody`'s own grammar, always a bare scalar string (no colon survives
    `SCC_CODE_RE`, and any body containing one is refused before reaching a `ref` result) —
    `parseYaml` on it never produces an object, so `extractPrefOverrides` returns `undefined`
    immediately by its own type guard. This path cannot engage for a `ds-scc` body at all,
    strict or not.
  - **The authoring pencil (`FormModal.openFormEditor`)** — the pencil-edit affordance is
    gated only on `canPersist`/`noAuthoringButton`/the `authoringControls` pref, not on
    `strictBody` or `shape`, so it does appear for a `ds-scc` block. Read the modal: `ds-scc`
    has no `def.schema`, so it opens in `rawMode` (a plain textarea seeded with
    `this.source` verbatim) and, on Save, calls `replaceSource(this.rawText)` — a
    byte-verbatim round trip if the user changes nothing, and otherwise exactly what the
    user typed. This is a **manual, user-driven** editing surface (functionally identical
    to editing the block directly in the note), not automatic framework metadata injection
    — it does not violate the "the framework must not write into it" contract as stated,
    which is specifically about unsolicited writes. Not a finding, but worth naming since it
    is technically "another writer into the body" — just not one that stamps anything.
  - **`def.serialize`** (the persisted-element round-trip `withPrefOverrides` wraps) is
    never invoked for `ds-scc`: `sccElement`/`sccBase` set no `serialize`, so
    `pipeline.ts`'s `if (def.serialize) {...}` branch is skipped entirely and no serializer
    is ever attached to the view.

No other writer into a strict body was found.

## Probe 5 — regression tests: can-fail proof reproduced

Reverted `strictBody: true` in a scratch copy of the tree (single line commented out in
`src/elements/scc/definition.ts`) and re-ran `sidebarScc.test.ts` in isolation:

```
Tests:  6 failed, 2 passed, 8 total
```

Matches the fix report's claim ("reverting `strictBody: true` fails six of them") exactly.
The two survivors are the tests that don't depend on the flag at all (the YAML-bodied
`ds-counter` still-stamped case, and one other body-agnostic assertion) — expected, not a
gap in the proof.

## Probe 6 — battery reproduction: see table above, all numbers match.

## Probe 7 — collateral / shared baseline: CLEAN

Full diffstat (`git show 63d9be4 --stat`, 12 files, +403/-14) reviewed file-by-file:
`CHANGELOG.md`, `docs/gm-trackers.md`, `docs/writing-blocks.md` (all coherent, cross-linked,
include the pre-fix-note recovery step), `src/elements/scc/definition.ts`,
`src/framework/host/SidebarBlockHost.ts`, `src/framework/registry.ts`,
`src/framework/sidebar/{DseSidebarView,SidebarPanel,anchor,registration}.ts`, and the two
test files. Every hunk maps directly to the fix's own stated design. No collateral changes.
Shared `freeze-baseline.sha256` untouched by this branch (see the battery section above for
the unrelated cross-session count discrepancy, which is not this branch's doing).

---

## Findings summary

| Severity | Finding |
|---|---|
| MEDIUM | Two blocks of a `strictBody` alias with **identical** bodies: pinning the non-first occurrence silently binds to the first one instead, from the first lookup onward, with no Notice. Benign today (ds-scc is read-only/static and the content is by definition identical at bind time), but contradicts the documented cursor-targeting guarantee and is untested. Recommend filing as a follow-up, not blocking this release-blocking fix. |
| — | Everything else probed (corruption dead, YAML mechanism untouched, re-pin idempotency, different-code two-block case, single-block edit re-bind, multi-block edit graceful degrade, `strictBody` contract exclusivity, no other body writers, can-fail proof, full battery) verified clean. |

## Recommendation

**LAND.** The release-blocking corruption this ticket exists for is fixed correctly,
matches the reviewer's own preferred design axis (the framework doesn't write into a body it
doesn't own), is proven with a genuine can-fail regression suite (verified independently,
not just trusted), and leaves the pre-existing anchored mechanism for every other element
provably untouched in both jsdom and a real Obsidian session. The one new finding (duplicate
same-code blocks silently binding to the wrong-but-identical occurrence) is real but narrow,
non-corrupting, and does not reintroduce or resemble the bug this ticket targets — appropriate
as a follow-up ticket, not a reason to hold this fix.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc158/sc158-review-report.md`
