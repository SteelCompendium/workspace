# SC-540 r2 independent review — plugin 992375b6 on eaf64ba6, superproject 5a18ee74

## Executive summary
- VERDICT: **FIX** (1 HIGH, 0 MEDIUM, 2 LOW, 4 INFO). The fix works for everything the FIX RULE names, but not for a control whose click handler rebuilds the card's DOM in the same click.
- HIGH-1: in a `> [!note]` callout, ds-initiative's **Advance round** (and ds-project's **Add project roll**) still turns the callout into raw source at HEAD (selection 0-0 -> 144-309). Cause: the clicked button is detached from the root before Obsidian's deferred click handler (10/150 ms timer) walks up from it, so the walk never reaches the marked root. The same hole exists in LP embeds (SC-522): the embed gets selected (0-0 -> 204-222). A scratch bundle with a 7-line bubble-phase fix (below) closes all three cases and leaves the guards as they were.
- Everything else measured in real Obsidian 1.15.0 LP is as specified: + in a callout, Enter/Space on the pencil, card text, double/triple click, drag, stamina modal, Expand, checkbox, typing in inputs, nested/embedded cases, links (plain/Ctrl/Ctrl-hover), callout text/title/`</>`/chevron, plain fence, LP embed, Reading view (never marked).
- Mod+A in a DSE input (follow-up i): **identical on base and HEAD** in a callout, a plain fence and an LP embed (it selects the input's text and the note selection does not move). The comment saying the mark changes Mod+A is wrong in practice (LOW-1).
- Twins (2 callouts, no park): + upper then + lower -> disk [6,5] then [6,6], cards match; form Save upper then + lower -> [5,5] names [Edited,Twin], then [5,6]. Correct on HEAD and on base.
- G-S62 discriminates: base FAIL (a)(b)(e), no-callout-mark mutant FAIL (a)(b)(e), HEAD ok (74-75 s each). The "mark in Reading view too" mutant passes G-S62, but jest catches it (LOW-2 / INFO). Jest mutants: no-callout 5 red, no-`.cm-content` 1 red, `.callout` 1 red, all `.cm-embed-block` 2 red.
- Gates at HEAD (mine): tsc clean, lint clean, jest 6269 / 1 skipped / 249 of 250 (54 s), lifecycle 47/47 = 21 (189 s) + 16 (332 s) + 10 (428 s, G-S52 + G-S57 ok inside), e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` + pointer parked. I did not re-run shots, freeze or parity, because no style or DOM-at-rest change was made.
- origin/develop: eaf64ba6 at my fetch. The owner later said it moved to 423e798d (SC-546, harness only). I did not rebase. Trees unchanged: plugin clean, superproject ` M draw-steel-elements` (as found).

## Method
Bundles built from `git archive` into my scratch folder (hashes match r1: base `aa4efdf671c9`, head `1e1036c0aeb1`, nocallout `564f63159c17`; fixprobe `bfe2f8427147`). Probe = a scratch copy of the in-tree lifecycle harness with an injected `R540` scenario (`sc540-r2-evidence/r2probe.mjs.txt`), port 9547, real CDP mouse and keys. Each case opens its note fresh in LP with the cursor at 0 and scrolls the block into view (it never counts `.cm-embed-block`). Snapshots are taken right before the press (`preClick`) and 1.5-2 s after. "RAW" means a `.cm-line` beginning `> [!`.

## Findings

### HIGH-1 — a control that rebuilds the card on click still opens the callout as source (and still selects an LP embed)
- Where: `src/framework/pipeline.ts:211-215` (`markInEditorWidget`: the mark goes on the root only). The trigger is any synchronous DOM rebuild inside a click handler, e.g. `src/elements/initiative/view.ts:178-181` (`advanceRound` -> `rebuildAndPersist`, 10 call sites in that file), and ds-project's Add project roll.
- Why: Obsidian's `Ah` (app.js 1.15.0 @820778) defers the selection with `setTimeout(…, s ? 150 : 10)`. Then `hookClickHandler` (@1764356) walks `n = r.targetNode; while (n && n !== contentDOM) { if matches('.cm-editor, .interactive-child') return; n = n.parentNode }` and calls `selectElement`. When the clicked button has been detached by the rebuild, the walk ends at `null` without ever passing the root.
- Measured at HEAD (`probe-all-summaries.txt`, case `rebuild-*`; diag = a document capture listener that redoes Obsidian's walk 200 ms later):

| case | HEAD | base | fixprobe |
|---|---|---|---|
| initiative Advance round in callout | RAW, sel 0-0 -> 144-309, written; target connected false, walk end `null (detached)` | RAW 144-309 | card, sel 0-0, walk hits `DIV.dse-init.interactive-child` |
| project Add project roll in callout | RAW, sel 0-0 -> 144-332, written | — | card, sel 0-0 |
| initiative Advance round in LP embed (SC-522 path) | embed selected, sel 0-0 -> 204-222 (`![[R540/init-src]]`), scroll unmoved | same | sel 0-0 |
| same in a plain fence (control) | sel 0-0, card | — | same |

  Screenshots: `sc540-r2-head-initiative-advance-round-callout-raw.png` (HEAD: the callout is shown as markdown with `round: 2` written) and `sc540-r2-fixprobe-initiative-advance-round-callout-card.png`.
- Scenario for a user: an initiative tracker kept in a callout. Clicking "Advance round" writes the round and then replaces the whole tracker with its YAML, with the cursor inside it. This is exactly the ticket's symptom, so the FIX RULE's "a real mouse click on a control inside a callout … leaves the callout drawn as a card" does not hold for this control class.
- Prescribed fix (measured in the fixprobe bundle): in `armClickShield`, right after the capture listener, add a bubble-phase listener on the root:
  ```ts
  root.addEventListener('click', (event) => {
  	if (!root.classList.contains('interactive-child')) return;
  	let n = event.target as Node | null;
  	if (!n || root.contains(n)) return;
  	while (n.parentNode) n = n.parentNode; // the target was detached by a rebuild during this click
  	if (n.nodeType === 1) (n as HTMLElement).classList.add('interactive-child'); // Obsidian's deferred walk starts at the target
  });
  ```
  It marks only the detached (garbage) subtree, does not stop or cancel the click, and covers callouts and embeds. In the fixprobe these stayed exactly as on HEAD: + in callout ([6,5], card, sel 0-0), links (plain navigates; Ctrl opens a new tab), callout text (still RAW), checkbox (toggles). Add a jest pin (a click handler on a button that empties and rebuilds the card; after the click Obsidian's walk from the detached target must stop on `.interactive-child`) and a G-S62 phase (g): Advance round on a ds-initiative in a callout (card, selection unmoved, written). On HEAD that phase FAILs with the numbers above. Updating the comment block to name this case is part of the fix.

### LOW-1 — the comment overstates what the mark changes for Mod+A
- `src/framework/pipeline.ts:199-200` ("Obsidian also tests the class for Mod+A in the editor (select the input's text, not the note)"). The r1 report calls this a user-visible improvement.
- Measured (cases `modA-*`, base vs HEAD identical): with focus in the counter's number input, Mod+A selects the input's text (window selection "5") and the editor selection stays 0-0. That holds in a callout, a plain fence, an LP embed, and with focus given without a click. On the project roll input nothing is selected (empty input) in both. With focus on the editor after a + click, Mod+A selects the whole note (0-764) on both, so the callout shows source because the selection covers it. That is normal Obsidian behaviour. Obsidian's Mod+A branch (@2662579) is therefore not observable for these inputs: native select-all already does the same, because CodeMirror ignores keydown from inside a widget.
- Fix: reword it to say Obsidian's Mod+A handler also reads the class, but measured behaviour is the same with or without it (input text selected). Comment only. Keep the same wording in livePreviewScrollHold.ts if it is repeated there.

### LOW-2 — G-S62 does not check that Reading view stays unmarked
- `visual-harness/obsidian-lifecycle.mjs` G-S62. Mutant `root.closest('.callout')` (marks every callout, Reading view included) passes G-S62 (`gs62-mutreading.log`, ok in 74 s). Jest catches it (`jestmut-mutreading.log`: 1 failed).
- Optional fix: a cheap phase in G-S62 that clicks + on the same note in Reading view and asserts `!root.classList.contains('interactive-child')`. My probe `reading-plus` measured exactly that on HEAD: written [6,5], both roots unmarked. Alternatively, accept jest as the only pin and say so in the proposal text. The mark is invisible in Reading view except in canvas, where Obsidian's click-to-edit handlers @2238477/@2937585 skip `.interactive-child`, so the jest pin matters.

### INFO
1. Right-click in a card in a callout opens Obsidian's callout menu (`Edit`, `Callout type`); in a plain fence it opens the editor menu (`Add link`, … `Select all`). This is the same on base and HEAD and is unaffected by the mark (`contextmenu`, not `click`). Choosing `Edit` there enters source, as it should.
2. The mark is lazy: it goes on at the first press or click and is lost when the root is redrawn (`ic` 1 -> 0 after the + write). This is harmless because every press re-marks before the event reaches the widget, and keyboard activation sends a `click` too (Enter and Space on the pencil measured: card, sel 0-0).
3. Base facts the r1 table lacks: on base, double-click, triple-click, a drag across the card text, a click on the stamina bar (after the modal closes), the collapsed one-liner's Expand, and a double-click on + (+2 written) all turned the callout RAW. Typing into a DSE input in a callout was already fine on base (`Ah` skips a click while focus is inside the widget). At HEAD all of these stay a card with the selection unmoved, and dbl/tri/drag select no card text, the same as the plain fence (the shield cancels the press).
4. Mobile: `selectElement` has an `isMobile` branch on the same path that the mark short-circuits. It was not probed (no mobile runtime). Canvas (#3, #6) and Bases (#2, #5) uses of the class do not apply to a DSE root in an LP callout.

## Probe results at HEAD (base in brackets where it differs)
- Ticket: + in callout: written [6,5], card, sel 0-0, scrollTop 433 -> 433 [RAW, 0-0 -> 197-316]. Enter on pencil: modal, card, sel 0-0 at open and after Escape [sel 197-316]. Space: same as Enter [197-316].
- Must NOT change (identical on base): callout text / title / `</>` -> RAW, sel 197-316. Chevron unfolds (collapsed true -> false), sel 0-0. Link plain -> tab shows `R540/link-target.md`. Ctrl-click -> new tab, this tab unchanged. Ctrl-hover -> 1 hover popover (callout and plain). Plain fence + [5,6], sel 0-0. LP embed + -> `emb-src` [6], sel 0-0, root marked (SC-522). Reading view + -> written, roots unmarked.
- Other blocks in callouts: counter number input typed "12" -> value 12, Tab commits [12,5], card. Project roll input "14", initiative quick-add label "abc", no lost characters, card. Project checkbox toggles false -> true, card. Stamina bar click opens the modal, card after Escape [RAW after close]. Collapsed one-liner Expand expands, card [RAW, still collapsed]. Initiative Advance round: **HIGH-1**.
- Follow-up ii: double-click on card text -> card, no word selected, sel 0-0 [RAW]. Triple-click the same [RAW]. Double-click on + -> [7,5], card [RAW]. Plain fence: same as HEAD-callout.
- Nesting: callout-in-callout + [6], card, sel 0-0 [RAW 197-326]. Embed-in-callout + -> embedded note [6], sel 0-0 (already so on base via SC-522). Callout-in-embedded-note + -> [6], sel 0-0 (already so on base).
- Twins (2 identical callouts, cursor not parked): + upper -> disk [6,5], cards 0:6 1:5. + lower -> [6,6], cards 6/6. Form Save upper (Twin -> Edited) -> [5,5], names [Edited,Twin], cards Edited:5 Twin:5. + lower -> [5,6], cards 5/6. HEAD: both cards drawn throughout, no misroute. Base: same disk values, but the clicked callout was RAW. No rapid-click sequences were run (SC-544 territory).
- app.js `interactive-child` uses (read on the r1 copy, sha256 `12194d5e…`: 6 offsets. A `grep -c` on the raw asar counts lines, not occurrences, and gives 5, so two uses probably share one line. I did not chase this further): agree with r1's list. Only `hookClickHandler` and the Mod+A keydown apply. The Mod+A one makes no measurable difference (LOW-1).

## Red/green
- G-S62 (in-tree harness, `DSE_LIFECYCLE_BUNDLE`, port 9547): base FAIL (a) RAW, sel 0-0 -> 327-208, scrollTop 856 -> 796; (b) sel moved at open and close; (e) as (a). (c), (d), (f) pass. nocallout: identical FAIL. mutreading: ok. HEAD: ok, 75 s.
- Jest `test/dom/framework/pipeline.test.ts` against mutants: head 50/50; nocallout 5 failed; mutnocontent (`.cm-embed-block.cm-callout`) 1 failed; mutreading (`.callout`) 1 failed; mutcmonly (`.cm-content .cm-embed-block`) 2 failed.

## Gates (HEAD 992375b6, plugin tree; logs in `sc540-r2-evidence/`)
| gate | result |
|---|---|
| tsc (+ `-p e2e`) | clean, rc 0, 12 s |
| lint (+ e2e) | clean, rc 0, 16 s |
| jest | `Tests: 1 skipped, 6269 passed, 6270 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250 total`, 54 s |
| lifecycle 1 | 21/21 ok, 189 s |
| lifecycle 2 | 16/16 ok, 332 s |
| lifecycle 3 | 10/10 ok, 428 s (load 9.6 at end); G-S52 ok, G-S57 ok |
| e2e | `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, pointer parked at 0,0 on :200, 63 s |
| shots / freeze / parity | not re-run (no style change; r1: 592 0 FAIL 161/966, 280/280, 0/0/24) |

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r2-review-report.md`
- Screenshots: `…/sc540-r2-head-initiative-advance-round-callout-raw.png`, `…/sc540-r2-fixprobe-initiative-advance-round-callout-card.png`
- Evidence dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r2-evidence/` (probe source `r2probe.mjs.txt`, `probe-all-summaries.txt`, raw `r540-*-summary.jsonl`, `gate-*.log`, `gs62-*.log`, `jestmut-*.log`, `bundles-summary.log`, bundle and run scripts incl. `r2bundle-fix.sh` = the prescribed fix as a scratch variant)
- Scratch (bundles, per-case PNGs): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r2-review-r1/`
