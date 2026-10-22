Fixed: a block with no closing ``` at the end of a note no longer deletes the note's final newline when it saves. Ready to land. You don't need to do anything unless you disagree with the decision below.

**The decision the ticket asked for.** I kept the trailing newline(s). The old behaviour was not intended. The SC-343 notes give no reason for deleting them, and they are bytes you wrote outside the block.

The review found the problem was wider than the ticket said. In real Obsidian, every save deleted the final newline, including a save while the note was still on screen. The ticket only named the save that happens after you switch away. Both saves now keep it, and they write the same bytes. If you want the old behaviour back, say so and I will reverse it.

**What changed.** When DSE closes an unterminated block at the end of a note, it puts the closing ``` right after the block's last line of text. Any blank lines and the final newline that followed stay after it. A note that ended with no newline still gets none added. One small side effect: a line containing only spaces or tabs at the very end of the note now sits after the closing ```, not inside the block. Its bytes are kept.

**Evidence**
- Jest: new tests cover one trailing newline, several blank lines, whitespace-only lines, Windows line endings (CRLF) and no trailing newline. Each test runs both save paths and checks that their output matches byte for byte. They failed before the fix.
- Real Obsidian: lifecycle G-S6u (save after switching away) and the new G-S28 (save while on screen) check that the note still ends with its newline. Both failed before the fix.
- Independent review: round 1 found the on-screen save problem above; round 2 verdict LAND, no findings. The reviewer also confirmed in real Obsidian that 9 note shapes (one newline, several blank lines, spaces or tabs on the last lines, Windows line endings) come out byte-identical from both saves, and that the older SC-343 data-loss traps are unchanged.

Mechanics:
- dse `sc477-unterminated-newline` @ d152ea4 on `develop` e8f6a14; superproject @ 7d468ed on origin/main 40334fb.
- Fix: `src/framework/host/ReadingModeBlockHost.ts` (`locateUnterminatedTrailingFence` and the in-place unterminated-at-EOF range).
- Gates: tsc + lint clean · jest 5769 passed / 1 skipped / 238 of 239 · lifecycle 32/32 (new G-S28) · e2e `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24.
