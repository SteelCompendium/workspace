**Ready to land: the button host-leak check now also compares a selected negotiation tier row, a checked track seal, and the vertical (Interest) track seals.** Before, each of these shared a key with an idle row or a horizontal seal, so only the idle or horizontal one was ever checked. A host CSS leak that hit only them would have passed. Nothing is waiting on you; this is harness-only.

**What changed.** The sweep's kind key (`tagButtons` in `visual-harness/shoot.mjs`) now adds two things:
- `|checked`, but only when `aria-checked="true"`. No style rule anywhere targets `aria-checked="false"` or `"mixed"`, so idle radios keep their old key and no existing kind is renamed.
- `|in:track--vertical` for a seal inside a vertical track. Vertical seals set their own padding, width, border and colour differently from horizontal ones, so they need their own comparison. The survey found this second gap, and I folded it in because it is the same kind of hidden variant.

No new click or gallery section was needed. SC-527's negotiation section already picks a tier, and one seal is checked when the page loads.

**Result.**
- Button kinds go from 157 to 161, and comparisons from 942 to 966. The 34-record skip list is unchanged, name for name.
- No existing kind is lost, renamed, or compared on a different node.
- All 592 screenshots are byte-identical and the freeze check passes 280/280. The plugin's built `main.js` and `styles.css` are unchanged.
- **Proof it can fail.** A planted host-only style on the selected tier row turns the check red, naming only that kind. Before this change the same style passed. A planted style on a vertical seal is caught the same way. If the tier click is removed, the check fails by name.

**Mechanics**
- dse branch `sc530-hostleak-aria-checked` @ `97284051` on develop `88cb7db9`. It has four commits: the prototype, the vertical suffix and `SC530_EXPECT`, the jest tests, and the review fixes.
- Gates:
  - tsc and lint clean.
  - jest 6252 passed / 1 skipped / 249 of 250 suites, including 7 new SC-530 tests. Each test was proved to fail on a matching one-line break.
  - Shots 592 with 0 FAIL; button host-leak 161/966; modal 228; input 15/176; checkbox 7/116; prose 106 [212].
  - Freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
  - Lifecycle 45/45 and e2e 124/124 (87/87 pairs) are carried from develop, because the built plugin is byte-identical.
- Independent review: LAND-READY, with 0 HIGH, 0 MED, 2 LOW and 5 INFO findings. Both LOWs were test gaps and are fixed. A scoped re-review covered the fixes.
- Not done here: the Recoveries popover stays with SC-526. The review found that no real Obsidian button rule could reach the remaining shared-key variants (non-first tier rows, last-edge seals) without also reaching the node already compared, so no ticket was filed.
