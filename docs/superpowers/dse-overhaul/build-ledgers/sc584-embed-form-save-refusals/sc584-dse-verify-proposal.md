# SC-584 dse-verify proposal (replacement text; SKILL.md is NOT edited by the implementer) — r9

Base: dse `develop` 93b3a382 (SC-577 landed; the branch was rebased onto a339e7b3, 734d7745, b4e7b4f4, f2889351, then 93b3a382). Branch sc584-embed-form-save-refusals. Supersedes the r1 text (an
open-time body search that r2 found unsafe and r3 removed) and the r3 text. Numbers come from the r5 gate logs (`sc584-r9-gate-*.log`; mutants and the sweep table from `sc584-r7-*`).

## 1. Replace the "Known refusals (SC-584)" bullet of "Block edit form Save and embeds (SC-556)" with

- **A form opened right after a + on a card in a hover preview or an embed (SC-584):**
  - **What Obsidian reports.** Right after a + the card's part (`getSectionInfo`) is still the one from BEFORE the + (about 20 ms
    after the + write lands it is fresh again), while the note and `host.lastKnownBody` already hold the new body (measured in real
    Obsidian 1.15.1; the form's open waits for the + write, `view.openAfterPendingWrite`). A hover preview has no `src`, so neither
    the link nor the part's text finds the block.
  - **The pin is the position of the host's own write (`ReadingModeBlockHost.lastWrite`).** `replaceSource` records, inside
    `Vault.process`, `{body, text: the note as the write left it, lineStart: the block's fence}` for a host drawn in an embed or
    hover preview. `rebasePin` (a block edit form's pin only, never a card write's) uses it as the LAST step, when the link
    (`verifiedPinLine`) and the unique-text search (`searchedPinLine`) place nothing and the body known at open is the body that
    write wrote. The pin is then an ordinary whole-note pin of the write's note text, so `mapLine` / `pinnedTarget` (pin-only, body
    check) judge every outside edit since the +: the block edited or deleted -> Save writes nothing + Notice; an identical block
    added or already there -> irrelevant (nothing searches the note for a body). The record is per host (a write by another host,
    a second pane, is not recorded), is replaced by the host's next write, dropped by `setMountedBody`, and the record and the known
    body are both taken when the pin is made (a write landing during the open-time read does not change the pin). A callout in an
    embed whose stale part holds no block with the known body (so no own fence) gets its pin from the same record
    (`pinFromLastWrite`). A form opened with NO + by that host on a stale part still refuses, as before SC-584.
  - **`^id` marker for a callout.** For a block inside a callout / quote `verifiedPinLine` looks for `^id` after the END OF THE
    EMBEDDED PART (`start` + the part's last non-blank line; measured: the cache's block position runs over the whole callout and the
    id stands after a blank line under the callout's last line). A plain fenced block keeps the rule it had (after its closing
    fence), whatever the length of the stale part.
  - **One window, several blocks (r4 CRITICAL-1, r5, r6 CRITICAL-1, r7 — the same class three times).** `findOwnFence` takes the plain-fence shortcut only when the
    section's first line is an un-prefixed fence (the window IS the block); for every other window (callout, header-less quote, nested quote, list item, footnote)
    it finds the card's block BY BODY, and right after a + the window is stale, so the only block holding the known body can be the TWIN (two identical counters, the
    + made the lower read like the upper): pinned there, Save wrote the UPPER counter with no Notice. The guard is therefore structural, in `takePin`: for a FORM in an
    embed, unless `parseOpenFence(section.text, section.lineStart)` is an un-prefixed fence, the host's own-write record (`pinFromLastWrite`) is the pin when it exists
    and its body is the known body. (r5 compared `ownFence.lineStart !== section.lineStart`, which is false when the twin sits on the window's FIRST line, e.g. a
    header-less quote that starts with a fence.) Record-first for EVERY form was tried and breaks the intended test "the embed was redrawn after the +, so its part is
    current" (a plain block, 1000 lines changed since the +: the diff gives up, the link finds the block), hence the plain-block exception; a form in a multi-block window
    with an old record refuses after hundreds of lines changed on both sides (a Notice, never a twin). The record is dropped when the host's section unloads
    (`onRenderChildUnload`) and by `setMountedBody` (`remountReused.ts:63` re-mounts a host onto a twin with the same body: load-bearing, tested).
    Sweep (jest, `reading-mode-host-pin.test.ts`, 36 cells, base b4e7b4f4 / r5 / now; the host source is unchanged by the f2889351 rebase): callout, header-less
    quote with text first, nested callout, quote inside a list item: lower counter on r5 and now (base: block embed refused, heading embed UPPER); header-less quote and
    nested quote whose FIRST line is the upper fence: UPPER on r5, lower now (base: block embed refused, heading embed UPPER); list item (bulleted, ordered) and footnote:
    refused everywhere (the + itself is not written in a list shape). Real Obsidian (G-S77): callout, header-less quote, both embed shapes, RV and LP land in the lower;
    a list item (block and heading embed) writes nothing, upper untouched. Probe: two IDENTICAL counters, NO + first, form on the lower: lower on base and head (the DOM
    ordinal).
  - **Authoring footguns.** (1) The + write re-serializes the block's YAML in the plugin's own key order (`max_value`,
    `current_value`, `min_value`, `name`): a fixture whose "twin" must read the same after the + needs the twin in THAT order.
    (2) Hover popover (corrected at r2 from the r1 note): the popover and its form SURVIVE the pointer moving into the modal (2 s+, RV
    and LP, real mouse path); the FIRST mouse CLICK inside the form closes popover and form, typed text lost (SC-595, base and head
    alike); a keyboard edit plus a Save click works. Phases (zk)-(zn) hold the popover with `hp.hide = () => {}`
    (`app.workspace.getMostRecentLeaf().view.hoverPopover`, restored in the cleanup): that stands in for the click-free path, it does
    not model a real mouse user. (3) A hover over `[[long note#Heading]]` is given a section chunk, not the heading's lines: a counter
    with an identical twin elsewhere has its + refused (SC-480; SC-594), so a phase that needs the + to land uses a different counter
    above the section. (4) A jest test of this needs the host's own + write to exist: `plus(host)` = `host.notePersistIntent()`, a
    25 ms settle (the pin's rebase reads the note once, `cachedRead` waits a macrotask), then `host.replaceSource(body, { fromView:
    true })`; setting `setMountedBody(new body)` instead records nothing and the form is (correctly) refused. The `embedded()` helper
    returns `sec` so a test can redraw the part (`sec.current = …`).
  - **(zc) and (z) are NOT controls.** The outside edit's redraw of the embed closes the form (measured r2: 16-80 ms), so "nothing is
    written" holds whatever the code does. The controls with teeth are in the jest host suite (`reading-mode-host-pin.test.ts`:
    P1 P1d P2 P2n P3 and the callout edited after the +); (zn) is a real control only because the hover popover is held open.
  - Still refused (no data lost): the form's block edited or deleted between the + and Save; a hover preview or embed whose block the
    link and the text cannot place and that had no + from its own card; a `^id` line not directly under the callout; a metadata
    cache that points at another block. Pre-existing and out of SC-584: SC-594 (card writes in hover previews), SC-595 (a click in
    the form closes a hover form), SC-596 (a block-only part edited before open without a +; general null-pin forms).

## 2. G-S64 row (lifecycle part 3)

G-S64 gains phases (zk) hover preview of a short note + then pencil lands, (zl) `[[long note#Tracker]]` hover + then pencil lands
(a different counter above the section stays untouched), (zm) the + made the block read like the one above it: Save lands in the lower
(the + block), the upper untouched, (zn) control: the form's own block edited from outside AND a block with the old body added in one
write: nothing written (form stays open, one Notice), (xc) `![[note#^id]]` of the lower of two identical callouts with text after the
counter lands (Reading view), (yc) the same in Live Preview, (xd) / (yd) the same after + on the card and at once the pencil (RV / LP),
(zc) smoke check only (see above). **G-S77** (new, SC-584 r5; before G-S56, in part 5 with G-S59 G-S49 G-S73): a callout with TWO counters, embedded as a block (`![[note#^id]]`) and by its heading, RV and LP: + on the lower counter and at once the pencil, Save writes the LOWER counter, the upper untouched, no Notice (fixtures `gs77-cal(h)|hq(h)|li(h)-src/-host`: callout, header-less quote whose first line is the upper fence, list item; trials (a)-(j); the shared trial `gs77Trial` returns what the note says and asserts nothing, so a scratch scenario can probe a variant). The 796f5a87 (r5) bundle fails (e)-(h) (the header-less quote: the upper counter written); the f2889351 base bundle fails (a)-(h) (block embeds refused with the Notice, heading embeds write the upper). Fixtures `gs584-hov-short(-host)`, `gs584-hov-head-src/-host`, `gs584-hov-twin(-host)`,
`gs584-cal-src/-host`. Lifecycle is now 54/54 in five parts (part 5 is `G-S59 G-S49 G-S73 G-S77`). Part 3 is at the ~480 s line
(part 3 took 444 s on b4e7b4f4 at loadavg 3-5, 499 s in the r4 review run, 485 s in r1 on eeed5182): no more phases for this area in G-S64; they go to G-S77 (part 5, 271 s). On the unpatched a339e7b3 bundle (`DSE_LIFECYCLE_BUNDLE`) G-S64 FAILs
(zk) (zl) (zm) (xc) (yc) (xd) (yd) and passes (zn).

## 3. CURRENT block

**CURRENT — dse `develop` @ `<land sha>` (SC-584 landed on `93b3a382`; a block edit form opened right after a + on a card in a hover preview or an embed is pinned at the position of the host's own + write (`lastWrite`, recorded inside `Vault.process`; judged by `mapLine` / `pinnedTarget` like any pin): for a card that is a block on its own the link and the text come first and the record is the last step, for a card whose section window is anything but its own plain fenced block (callout, quote, nested quote, list item, footnote) the record is the pin, so two counters that read the same after the + save the lower one; a `![[note#^id]]` embed of a callout looks for its `^id` after the end of the part (a plain fenced block keeps its old rule); new lifecycle scenario G-S77 (54 scenarios, part 5 `G-S59 G-S49 G-S73 G-S77`), G-S64 phases (zk) (zl) (zm) (zn) (xc) (yc) (xd) (yd) plus the smoke check (zc), no CSS change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7177 non-skipped passed / 2 skipped / 260 of 261 suites** in a fresh worktree (7176 in the full run plus the SC-568 load timeouts, `initiative-default-keys` and `twin-reuse`, 78/78 green alone; the pin suite is 145 tests, 74 on the base) · lifecycle **54/54** (five `--only` parts 21 + 16 + 9 + 4 + 4; wall 187 s / 341 s / 444 s / 313 s / 272 s, loadavg 3-14; G-S77 alone about 60 s) · e2e **`OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** on the second full run (346 s; the first run failed RECOV-R07 (SC-517 / SC-570) at loadavg 12-21, which also failed alone at loadavg 21: a load flake) · `styles.css` sha256 `5e5ff488…` byte-identical to a clean `93b3a382` build, so shots **592** / host-leak 163/978 / modal host-leak 39 kinds / 234 comparisons / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Red-on-base references, the 36-cell sweep table and the mutant list (killed 1-38 tests each; mF mL mN equivalent) are those of the r7 round on `f2889351` / `b4e7b4f4`: the host source, G-S77 and the pin suite are unchanged by the rebases (range-diff: every code commit `=`, the two CHANGELOG commits differ only by SC-577's bullet above them). Numbers as measured by the SC-584 r9 implementer.
