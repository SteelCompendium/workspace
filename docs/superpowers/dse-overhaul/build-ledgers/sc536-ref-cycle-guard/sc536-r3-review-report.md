# SC-536 r3 — independent adversarial review

## Executive summary
- **Verdict: LAND-READY.** No HIGH and no MEDIUM findings. Plugin `458abe3..432c50e2` and superproject `2f5eb7d1` reviewed. Worktree left as found: plugin clean, superproject ` M draw-steel-elements` (the unstaged pointer, as r2 left it).
- **Gates, re-run by me on 432c50e2:** tsc and lint clean · jest **6221 passed / 1 skipped / 249 of 250** · lifecycle **21/21 + 22/22 = 43/43** · e2e **124/124 ok, 0 failed, 0 known-bug, coverage 87/87**. All match r2. Shots, freeze and parity were not re-run (see §2).
- **Real Obsidian 1.15.0, head bundle** (byte-identical to the worktree's `main.js`):
  - Bug 1 is fixed. Self, `[[Cyc]]  ` alias, A→B→A and Live Preview each stop after 2/2/3/2 lookups with one "Reference loop" card. At natural speed the lookup count stays at 2 for 20 s.
  - The 7-chain shows 5 cards plus the cap card, with 5 lookups.
  - Bug 2 is fixed: split + redraw at natural speed 0/5, plugin off/on 0/3, and every held FIFO/LIFO variant clean.
- **Sidebar (r1 had only reasoned about it), now measured:**
  - A pinned card that nests `@Cyc.md` stops at one loop card in the panel and the lookup count stays put.
  - A pinned card that nests `@Ref.md`, with the note open in Reading view, shows no error. This holds after a redraw and after a plugin off/on with both reads held at once.
- **SC-481 twins:** two `@Ref.md` blocks, two `@Outer.md` blocks and two `@Cyc.md` blocks all render correctly in Reading view. They stay correct after a line inserted above, after the first block was changed (its old element reused for the twin), after it was changed back, and after a redraw. No reused root caused a false loop.
- **Mutants: 12 run, 10 red.** The two survivors cannot change behaviour (INFO-1). G-S56 fails all 6 phases on 458abe3 src and passes 3 of 3 runs on head (alone ×2, plus the B half).
- **Findings:** 0 HIGH, 0 MEDIUM, 2 LOW (both pre-existing tangents for Backlog tickets), 5 INFO.
- **Screenshots:** head and base for the cycle note and for two panes, as the owner asked. Paths are in §6.

## 1. Code review against the ruled design (decisions.md "Owner rulings on r1")
| Ruling | Code (`src/elements/shared/RefUnwrapView.ts` @432c50e2) | OK |
|---|---|---|
| `REF_CHAIN = WeakMap<HTMLElement,{targets,depth}>`, `nearestChain` walks `parentElement` from the root's parent | :63-77 | yes |
| `REF_CHAIN.delete(root)` at the top of `onMount`, next to `resolveGen++` | :113-116. Every path deletes first: invalid, inline, ref, and `onUpdate`, which reaches it through `onMount`. M3 is red. | yes |
| Cap check before any lookup; only reference-resolved roots count | :185. Depth is set only in `claimChain` (:326), so inline cards and other elements never count. M9 (`>`) is red. Real Obsidian: 5 lookups. | yes |
| `claimChain` right before each `mountBase`, after the last gen check | Legacy :308-311 (M4 and M11 red). SCC :254-258 (see INFO-1). | yes |
| Targets: `file:<path>`, fallback `raw:<base.id>\|<trimmed>`; SCC `scc:<code>` + `file:<entity.file.path>` | :257, :310. `raw` is already trimmed when it reaches `resolveLegacyRef` (:195). M5 and M7 are red. | yes |
| Remove `IN_FLIGHT_REFS` and `isUnloaded()`; keep the private `unloaded` flag (SC-519) | `src/framework/view.ts`: only `isUnloaded()` was removed. `unloaded` is still at :93/:112/:327. A repo grep finds no other caller. | yes |
| `resolveGen` unchanged | Every gen check is the same as on 458abe3. | yes |
| `ReadingModeBlockHost.ts` untouched | `git diff --stat` shows only 6 files, none of them in `host/`. | yes |
| Wording | Loop: `Reference loop: ${raw} is already shown by a card this one is inside.`; cap: `Reference nesting too deep: more than ${MAX_REF_DEPTH} references inside one another.` Both match the ledger exactly. | yes |
| §6 folds | `renderMarkdown` doc line at view.ts:244-246. The `view.ts:291-298` block was the removed `isUnloaded` doc. | yes |

Target identity, probed:
- **Alias and trailing spaces.** In jsdom, `[[A]]` and `@A.md  ` are both refused at level 2. In real Obsidian, `[[Cyc]]  ` → `@Cyc.md` stops after 2 lookups.
- **`#anchor`.** In real Obsidian (R3-ANCHOR), the at-path and wikilink providers cannot resolve `@X.md#H` or `[[X#H]]` at all: the result is "Reference file … not found". So an anchor cannot hide a cycle. `codeFromRaw` drops `#…` for SCC, and the `file:` key would catch it anyway.
- **SCC code vs `@path` to the same file.** Covered by the jsdom test "an entity whose file is the nested @path target" (M7 is red). The SCC ladder was not probed in real Obsidian: the lifecycle vault has no compendium.
- **One file per code.** `CompendiumIndex.getEntry` maps a code to exactly one file (`codeToPath`), so the `file:` key cannot merge two different codes.

## 2. Gates (re-run by me; logs in the ledger dir)
| Gate | Result | Log |
|---|---|---|
| tsc / lint | rc 0 / rc 0 (only the known `.eslintignore` warning) | `sc536-r3-gate-tsc.log`, `sc536-r3-gate-lint.log` |
| jest | 6221 passed, 1 skipped, 6222 total; suites 249 of 250; rc 0 (the shots CSS is cached in the worktree) | `sc536-r3-gate-jest.log` |
| lifecycle A | `21/21 ok, 0 failed` (port 9571) | `sc536-r3-lifecycle-a.log` |
| lifecycle B | `22/22 ok, 0 failed`, G-S56 ok (all 6 phases) (port 9572) | `sc536-r3-lifecycle-b.log` |
| e2e | `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0; no CHR-F02 flake | `sc536-r3-gate-e2e.log` |
| shots / freeze / parity | **Not re-run.** The diff draws nothing new outside error cards. The guard keeps its state in a WeakMap, not on the DOM. The only output change is the error-card text. No shot fixture holds a reference cycle or the old message (repo grep: only tests and the lifecycle harness). Legitimate nesting draws the same as before (jsdom; real-Obsidian S536-NEST: outer + nested card, 0 error cards). r2's 592 / 157-942 / 280-280 / 0-0-24 stand. | — |

## 3. Real-Obsidian probes (my own build of HEAD and of 458abe3 src, from a scratch `git archive` copy; ports 9573-9583, own Xvfb)
| Probe | Head | Base (458abe3 src) |
|---|---|---|
| S536-CYC (held, released one level at a time): `@Cyc`, `[[Cyc]]  `, A→B→A, 7-chain, Live Preview | 2 / 2 / 3 / 5 lookups, then STOPPED. One error card in each case. The chain ends at depth 5 with the cap card. | (r1: 8/8, still going) |
| S536-CYCN (natural speed, 20 s) | lookups 2 @246 ms → 2 @20 s, 2 feature elements, 1 loop card, settled | — |
| S536-B2 | A: 2 held, no refusal. H1/H2 FIFO/LIFO: 2 held, clean. **Natural split + redraw: 0/5. Natural plugin off/on: 0/3.** H3 FIFO/LIFO clean. 0 page errors. | R3-SHOT-2P: 1 held, pane 2 shows "Reference nesting too deep — `@Ref.md` is already resolving in this block" |
| S536-NEST (legitimate `@Outer`→`@Ref`) | 2 cards, depth 1, 0 error cards, 2 lookups | — |
| R3-SB sidebar: pinned inline card nesting `@Cyc.md` | Panel: 3 feature elements (host, Cyc, loop card), 1 loop. Lookups 4 → 4 across an extra settle (settled). Reading view unchanged. | skipped (base runs away) |
| R3-SB sidebar: pinned card nesting `@Ref.md` + the same note in Reading view | Reading view and panel: 2 cards each, 0 errors. Same after `rerender(true)`. Plugin off/on with **2 reads held at once**, released FIFO: both show 2 cards, 0 errors. | same (base had no false error here either) |
| R3-TWIN (SC-481), Reading view | `@Ref`×2: 2 cards. `@Outer`×2: 4 cards, depth 1, 0 errors. `@Cyc`×2: 2 cards + 2 loop cards. All of these hold after "line inserted above" (both roots reused: tags `orig0, orig1`), after "first block changed to `@Ref.md`" (tags `new, orig0`: block 1's old Outer root now serves block 2, which still shows Outer with its nested Ref card and **no loop card**), after "changed back", and after a redraw. 0 page errors. | — |
| R3-LP twins | `@Ref`×2: 2 widgets. `@Cyc`×2: 2 widgets, 2 loop cards. `@Outer`×2: see INFO-4. | identical for `@Ref`/`@Outer` |
| G-S56 alone (HEAD harness) | ok ×2 (`sc536-r3-lifecycle-gs56-head-run{1,2}.log`) | **FAIL all 6 phases**: (a)/(a′) still going after 8 released, (cap) 7 lookups, (b)/(c)/(d) 1 read held, want 2 (`sc536-r3-lifecycle-gs56-base.log`, `…-base-FAIL.png`) |

G-S56 determinism: its holds are hook holds (`services.refs.resolve`, `app.vault.read/cachedRead` by path), released by hand. Settling is a condition plus 2 rAF, then the condition again. The scenario uses no timer of its own; the only sleep is the 700 ms inside the harness's shared `t.open`. The fresh-leaf setup has its explanatory comment at `visual-harness/obsidian-lifecycle.mjs` (G-S56 run, "The scenarios before this one leave leaves behind …"), as the owner asked.

## 4. Test quality
The 6-mutant table was re-run in full in a scratch copy, plus 6 mutants of my own. Logs: `sc536-r3-mutant-*.log`. Each count is out of 4469 dom tests.

| Mutant | Failed | Named red tests |
|---|---|---|
| M1 drop cycle check | 18 | (same as r2) |
| M3 drop `REF_CHAIN.delete` | 2 | "updated to an inline body starts a new chain", ×2 variants |
| **M4 claimChain before last gen check (legacy)** | 2 | "a superseded resolution never stamps a chain", ×2 |
| M5 key on raw text | 4 | alias tests |
| M6 walk one parent level | 20 | — |
| M7 (mine) SCC drops `file:` key | 2 | "SCC entity whose file is the nested @path target" |
| M8 (mine) SCC claimChain before the body-await gen check | **0** | INFO-1 |
| M9 (mine) cap `>` instead of `>=` | 2 | cap test |
| M10 (mine) chain does not inherit parent targets | 3 | A→B→A (both variants + SC-525 describe) |
| M11 (mine) drop the gen check after `legacyRefRawText` | 3 | superseded-stamp ×2 + "legacy: updated while block text is read" |
| M12 (mine) drop the gen check after `refs.resolve` | **0** | INFO-2 |

- The rewritten SC-525 describe now runs on the nested-host model. Its `resolveGen` tests still bite: M11 turns one red.
- The `formModalStalePreview` matcher was widened deliberately, to reject "Reference loop" as well. It was not loosened.
- displayCardHybrid (d) now asserts the exact loop message on a host nested inside `.dse-card__body`.
- The jsdom view brake (`VIEW_CAP = 30`) keeps red runs bounded.

## 5. Findings

**LOW-1 (pre-existing, not SC-536; tangent ticket): pinning a whole-block reference card to the sidebar breaks the block.**
- **Where:** `src/framework/sidebar/registration.ts:250-273` and `anchor.ts` `ensureAnchor`. `ds-feature` is not `strictBody`.
- **What happens:** "Pin to sidebar" on a `ds-feature` block whose body is `@Ref.md` appends `_dse_anchor: <id>` to the body. The body becomes two lines, so `detectWholeBlockRef` (`withReference.ts:86-101`) no longer reads it as a reference. Both the Reading view and the panel then show "Implicit keys need to be on a single line at line 1 … @Ref.md". The anchor line stays in the user's note.
- **Measured:** the same on 458abe3 (R3-SB `refDirect` on base). Disk after the pin: `@Ref.md\n_dse_anchor: d5b05a`. It is experimental-only, because the pin item needs the `experimental` switch.
- **Fix:** treat a reference body like `strictBody` (no stamp; find the fence by body), or let `detectWholeBlockRef` ignore an `_dse_anchor:` line. Owner to file a Backlog ticket linking SC-536.
- **Impact on SC-536:** none. For this reason the sidebar cycle was probed through a pinned inline card that nests the reference.

**LOW-2 (pre-existing styling, newly reachable; cosmetic tangent): at sidebar width, a nested loop card's message wraps one character per line.**
- **Where:** `sc536-r3-shot-sidebar-cyc-head.png`, right-hand panel.
- **What happens:** the error card's monospace message gets about 70 px inside two nested cards, and it breaks after every character.
- **Why it is new:** before SC-536 this state could not be reached, because the chain never stopped.
- **Fix:** let `.dse-error-card-message` wrap at word boundaries (`overflow-wrap: anywhere` rather than break-all, or whatever applies there), or add a minimum inline size for nested error cards. Optional Backlog ticket.

**INFO-1: M8 survives because it cannot change behaviour.**
- Moving the SCC-ladder `claimChain` above `await entity.body()` (`RefUnwrapView.ts:253-257`) still claims while `gen` is current: no await lies between the `model()` gen check (:241) and the claim.
- Any later supersession goes through `onMount`, which runs `REF_CHAIN.delete(root)` first. So no test can tell the two orders apart.
- The code follows the ruling (claim after the last gen check). No action.

**INFO-2: M12 survives (pre-existing).** The gen check after `refs.resolve` (:305) is redundant with the one after `legacyRefRawText` (:307). The only effect of dropping it is one extra file read for a stale resolution. It is not SC-536's code. No action.

**INFO-3: G-S56's base-failure message says "8 made" but lists 9 raws.** `stepThrough` reads `K.calls()` and then `K.raws()` (`obsidian-lifecycle.mjs`, G-S56 `stepThrough` return), and the 9th lookup starts between the two reads. This affects only the diagnostic text on a failing base run. Optional fix: read both in one `t.ev`.

**INFO-4 (not SC-536; the same on base): in Live Preview, two identical tall `@Outer.md` blocks show one `.cm-embed-block` widget.**
- This holds even after scrolling to the end, although 4 lookups ran.
- Two identical `@Ref.md` blocks and two identical `@Cyc.md` blocks show 2 widgets each.
- I did not investigate further: it may be CM6 viewport handling or something adjacent to SC-537. Evidence: `sc536-r3-shot-lp-twins-outer-{head,base}.png`, `sc536-r3-obsidian-head-run4.log` / `base-run2.log` (`R3-LP-JSON`). Worth a look by whoever owns SC-537.

**INFO-5: G-S56 detaches every other markdown and sidebar leaf, and it runs last.** A scenario appended after it starts from one leaf. That is harmless today; whoever adds G-S57+ should know.

**Docs.**
- The CHANGELOG `## Unreleased` bullet is plain and accurate. It covers the loop card, the 5-deep cap, two panes, plugin off/on and a double redraw, and its wording matches the code.
- dse-verify `SKILL.md`: only line 30 changed (the battery row 4: 43/43, halves 21 + 22, G-S56). The CURRENT block (line 1231) was **not** edited.

## 6. Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/`)
- Report: `sc536-r3-review-report.md`.
- Screenshots:
  - Requested by the owner: `sc536-r3-shot-cycle-head.png`, `sc536-r3-shot-twopanes-head.png`, `sc536-r3-shot-cycle-base.png` (4 levels released, 5th held), `sc536-r3-shot-twopanes-base.png` (held off/on, released FIFO).
  - Extra: `sc536-r3-shot-sidebar-cyc-head.png`, `sc536-r3-shot-sidebar-ref-{head,base}.png`, `sc536-r3-shot-lp-twins-outer-{head,base}.png`, `sc536-r3-lifecycle-gs56-base-FAIL.png`.
- Gate logs: `sc536-r3-gate-{tsc,lint,jest,e2e}.log`, `sc536-r3-lifecycle-{a,b}.log`, `sc536-r3-lifecycle-gs56-{base,head-run1,head-run2}.log`.
- Probe logs: `sc536-r3-obsidian-head-run{1..5}.log`, `sc536-r3-obsidian-base-run{1,2}.log`.
- Mutant logs: `sc536-r3-mutant-*.log` (12, plus `none`).
- Scripts: `sc536-r3-obsidian-{kit,scenarios}.js.txt`, `sc536-r3-obsidian-run.sh.txt`, `sc536-r3-build-bundles.sh.txt`, `sc536-r3-mutate.py.txt`, `sc536-r3-mutate-run.sh.txt`, `sc536-r3-gs56-run.sh.txt`, `sc536-r3-lifecycle-only.sh.txt`, `sc536-r3-gate.sh.txt`.
  - The probes also load r1's `sc536-r1-obsidian-{kit,scenarios}.js.txt`. The only local change was one line in the kit: the bundle tag now recognises `bundle-head`.
- Scratch copy: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r3-rev7k/`. The one kept lifecycle temp dir (`/tmp/dse-obsidian-lifecycle-rgGCbN`, mine) was deleted by literal path.
