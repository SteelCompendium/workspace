A + or - in a hover preview of a heading link now saves into the counter you hovered, even when an identical counter sits elsewhere in the note. It is ready to land; no decision is needed from you.

What changes for you:

- Hover `[[long note#Tracker]]` and press + or -: the click is saved into that counter, and the identical one is left alone. Before, nothing was saved and the "changed on disk first" Notice showed. The same now works for a block-link hover (`[[note#^id]]`), a counter in a callout, a second click in the same preview, Reading view and Live Preview.
- Wrong-counter writes that already existed are closed. If the note was edited from outside (Sync, another app) just before your click, a click in a preview or in a heading / block embed (`![[note#Tracker]]`, `![[note#^id]]`) could be written into the identical counter elsewhere. Now it saves nothing and shows the Notice.

How the plugin knows which counter you hovered: Obsidian reports the link behind every hover preview. The plugin keeps the link that opened each preview and confirms it against the note's text. When the note does not confirm it, the click is refused with the Notice, as you ruled on SC-556 ("Save nothing with a notice is fine").

Still not saved (Notice shown, note untouched): a counter in a list item or footnote (SC-461); a counter or its section edited from outside in the moment before the click; a heading written with an underline (`Tracker` over `===`) or whose name differs from the link; a link that names two places while the counter also occurs twice; a preview that was already open when the plugin loaded.

One known gap, filed as SC-607 (Backlog, Low, and it behaves the same before this fix): if a preview stays open while you delete or rename its section elsewhere, and the note has two sections of that name with identical counters, a click can go into the other one.

The Edit form opened from a preview is unchanged (SC-596).

+++ Agent notes

Land-ready. dse branch `sc594-hover-heading-card-write` @ `da2bdbc6` (15 commits on develop `8b84b635`); superproject branch @ `6b07b11c` (CHANGELOG only; no pointer bump).

Gates on `da2bdbc6`: tsc + lint clean · jest 7671 passed / 2 skipped (develop 7341 + 330) · lifecycle 58/58 in six `--only` parts (21 / 16 / 9 / 4 / 7 / 1; part 6 = `G-S92` alone, 103 s; part 5 393 s) · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · styles.css identical to a clean `8b84b635` build, so shots / freeze / parity carry.

Review pipeline: r1 design (real-Obsidian measurements; a hover card's section is the heading's body only, so it matched the twin) -> r2 implementation -> r3 independent review (HIGH: a lagging metadata cache placed a heading hover on the wrong counter) -> r4 fix (placement from the note text) -> r5 re-review (code SHIP; docs corrections) -> r6 docs, one test, rebase. Red on base: 119 jest tests and all G-S92 trials. Mutants: all killed but one equivalent.

New lifecycle scenario G-S92 needs a sixth `--only` part (part 5 has no room after SC-598's G-S91): proposal `sc594-dse-verify-proposal.md` in the ledger dir. Filed / updated: SC-607 (new), SC-596 and SC-524 (fix ideas appended).

+++
