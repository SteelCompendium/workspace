# SC-158 — "Send block to sidebar" corrupts `ds-scc` blocks

**Status: FIXED.** Branch `sc158-anchor` (worktree `worktrees/sc158-anchor`), base
`ac78c6a`, one commit **`63d9be4`**. Nothing landed; superproject pointer left unstaged.

The camera that found this bug now proves it dead: `npm run obsidian-shots` went from
**exit 1** to **exit 0 (59/59)**, and the previously-failing capture is a real Obsidian
sidebar leaf showing a pinned `ds-scc` block rendering its card.

## Root cause

| | |
|---|---|
| Stamp written | `src/framework/sidebar/anchor.ts:50` — `ensureAnchor()` appends a `_dse_anchor: <id>` LINE to the block body |
| Called from | `src/framework/sidebar/registration.ts:118` — `sendToSidebar()`, inside `vault.process` (so it is written to the note) |
| Read back by | `src/framework/host/SidebarBlockHost.ts:158` — `getBlockInfo()` → `findAnchoredBlock()` |
| Breaks | `src/elements/scc/definition.ts` — `parseSccBody()`, whose contract is "the body is one SCC code" |

The sidebar has no `MarkdownPostProcessorContext`, so it cannot get block identity for
free the way reading mode does. Its answer is to make the block carry its own id: a
`_dse_anchor:` line inside the body, re-found by scanning. For a YAML-bodied element that
is invisible — the key rides along as an unknown property. The cost of that design was
already visible before this bug: three persisted models (`Counter`, `StaminaBar`,
`NegotiationData`) grew explicit `_dse_anchor` passthrough fields so `serialize` wouldn't
drop it, and `prepareModel` had to hide the key from AJV or every
`additionalProperties: false` schema would hard-fail on first pin.

`ds-scc` is where that design runs out of room. Its body is not a YAML mapping — it is one
SCC code, by a contract with six pinned refusal messages. Stamping a second line in makes
the body two lines, and the element correctly refuses it:

> This block has more than one line. `ds-scc` renders a synced-compendium entry; its body
> must be a single SCC code, e.g. `mcdm.heroes.v1/kit/panther`.

Because the stamp is written to the **note**, the block stays broken after the sidebar is
closed — the user is left with a block they must hand-edit to recover.

Reproduced in jsdom first, against the real `sendToSidebar` + the real pipeline
(`test/dom/framework/sidebarScc.test.ts`), before any fix:

```
- Expected  - 0
+ Received  + 1
      ```ds-scc
      mcdm.heroes.v1/kit/panther
    + _dse_anchor: 946d13
      ```
```

## The design call — (a): the framework does not write into a body it does not own

The brief offered (a) skip/out-of-band for strict-body elements, or (b) teach
`parseSccBody` to tolerate-and-strip the line. **I took (a).**

**Why not (b).** It would leave a plugin-authored line sitting inside a block whose entire
documented format is "one SCC code" — visible in source mode, in a block the user wrote by
hand, that they never typed. And it would make the strictness story a half-truth: the
element would go on saying *"its body must be a single SCC code"* in six pinned messages
while the parser quietly excused one extra line. That strictness is not pedantry, it is
the feature — it is what lets the *rendered output* stay explicitly unspecified (SC-149's
"what it looks like is not a promise") while the *input* stays a promise. A fix that
waters it down to rescue a framework convenience trades the wrong one away. It is also not
"lossless" in the sense the ticket asks for: the note changes.

**What (a) means concretely.** The anchor is framework metadata; an element may declare
that its body cannot carry framework metadata, and then the framework must find the block
another way. The body itself is that way.

- **`ElementDefinition.strictBody`** (`src/framework/registry.ts`) — "this body has an
  exact, non-YAML grammar; never write into it." `ds-scc` sets it. Deliberately distinct
  from the existing `parseHandlesRawBody` (which is about who owns a YAML *parse failure*):
  an element can want either without the other, `ds-scc` happens to want both.
- **`sendToSidebar`** consults `services.registry` for the alias and, for a `strictBody`
  element, **does not write at all** — the note is byte-identical — capturing the body as
  the panel's identity instead.
- **`SidebarPanelState.anchorId`** becomes `string | null`, with a new `body?` field for
  unanchored panels. It persists through `getState()`, so a pinned `ds-scc` block survives
  a restart. Exactly one of the two identities is ever set.
- **`SidebarBlockHost`** gained ONE locator, `locate(content)`, now shared by all four
  call sites that previously each called `findAnchoredBlock` themselves (`getBlockInfo`,
  `currentBody`, `applyFreshContent`, `replaceSource`) — so they cannot disagree about
  identity. Unanchored blocks resolve via the new `findFenceByBody`; if that misses and
  the note holds exactly one block of that alias, the host **re-binds** to it (so editing
  the code in a pinned block updates the panel instead of silently unbinding). With two or
  more candidates there is no safe guess, so it degrades through the existing "block
  vanished" path rather than binding to the wrong block.

**What this costs.** A stamped id survives *any* edit to the block; a body identity does
not survive editing the block's own body in a note that has several blocks of that alias.
That is the price of a byte-identical note, it is narrow, and "you changed the code, so
this is no longer the thing you pinned" is a defensible reading. Anchoring is **untouched**
for every other element — same stamp, same scan, same passthrough fields.

## Tests

`test/dom/framework/sidebarScc.test.ts` (8 cases, real `sendToSidebar` + real pipeline):

- the note is **byte-identical** after a pin, and contains no `_dse_anchor`;
- the block still renders its card, not the strict-body refusal;
- **a YAML-bodied element (`ds-counter`) is still stamped** — guards against the flag
  being applied too widely, which would quietly disable anchoring;
- the sidebar gets a panel and it mounts (pin works);
- panel state persists `anchorId: null` + `body` (restore across restart);
- the binding survives line drift above the block — the property the anchor bought;
- editing the code in a single-block note re-binds instead of unbinding;
- with two `ds-scc` blocks the cursor picks which one is bound, and neither is stamped.

**Can-fail proof:** reverting `strictBody: true` fails 6 of the 8.

Docs: `docs/writing-blocks.md` and `docs/gm-trackers.md` now say what the `_dse_anchor:`
line is, and that a `ds-scc` block never gets one. CHANGELOG carries a plain-language
`[FIX]` entry including the recovery step for a note already corrupted by an earlier build.

## Battery (verbatim)

Baselines at `ac78c6a`: jest 2686 + 1 skipped / 164 suites · shots 200 · freeze 66/66 ·
parity 0/0/16 · **obsidian-shots exit 1** (the true positive this ticket exists for).

```
$ npm run tsc          → exit 0, no output
$ npm run lint         → exit 0, no output

$ npx jest
Test Suites: 1 skipped, 165 passed, 165 of 166 total
Tests:       1 skipped, 2694 passed, 2695 total
Snapshots:   3 passed, 3 total
exit 0

$ npm run shots        → 200 shots, 0 FAIL, exit 0
$ check-freeze.sh …    → freeze OK (66/66 steel-print PNGs byte-identical), exit 0
$ npm run parity       → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0

$ DSE_CAMERA_DISPLAY=:100 DISPLAY=:100 DSE_CAMERA_PORT=9231 npm run obsidian-shots
  …
  ok scc--obsidian-sidebar-steel-dark.png (162484 bytes, clip 300x1060) — sidebar leaf confirmed
  …
quit cleanly in-app
all 59 shots written to …/visual-harness/shots
exit 0        (59 captures, 0 FAIL — was exit 1 before this fix)
```

Jest +8 (this ticket's suite). Shots, freeze and parity all unmoved — no rendered surface
changed, which is the correct result for a fix that stops a WRITE.

**How obsidian-shots was run.** Xvfb from this repo's devbox package set
(`.devbox/nix/profile/default/bin/Xvfb`) on **`:100`** — `:99` was already taken and `:1`
is Scott's, never touched — plus `DSE_CAMERA_PORT=9231`, because the default CDP port 9223
was already claimed by another process on this machine. Xvfb was stopped afterwards.

## The real-Obsidian evidence pair

From the vault of that same camera run, after the camera pinned blocks to the sidebar:

```
$ cat demo-vault/Harness/scc.md          # pinned to the sidebar by the run
# scc

```ds-scc
mcdm.heroes.v1/kit/panther
```
$ grep -c _dse_anchor demo-vault/Harness/scc.md
0
$ grep -n _dse_anchor demo-vault/Harness/{statblock,hero,negotiation}.md
demo-vault/Harness/statblock.md:140:_dse_anchor: 526b7f
demo-vault/Harness/hero.md:30:_dse_anchor: 1cfd1b
demo-vault/Harness/negotiation.md:21:_dse_anchor: d7a8bf
```

The strict-body block came through untouched; the YAML-bodied blocks the same run pinned
are still anchored exactly as before.

## Concerns

1. **Notes already corrupted by an earlier build are not auto-repaired.** A user who
   pinned a `ds-scc` block on a pre-fix build still has a stray `_dse_anchor:` line in
   that note and still sees the refusal card. The CHANGELOG says to delete the line. A
   migration could strip it, but silently editing users' notes to clean up after ourselves
   is a bigger decision than this fix — flagging rather than taking it.
2. **`strictBody` is a contract future framework code must honor.** Anything that starts
   writing into block bodies (a future formatter, a migration) has to check it. The flag's
   doc says so; nothing enforces it mechanically.
3. **Body identity is weaker than a stamped id** in the multi-block-plus-edit case (see
   the design section). Deliberate, and the single-block re-bind covers the common note.
4. `obsidian-shots` captures come from a real, self-updating app and are not byte-frozen —
   the gate is the camera's own in-run assertions (which is exactly what caught this bug),
   not a hash.
