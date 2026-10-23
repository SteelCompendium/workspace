Pin to sidebar now works on a block whose name is followed by a zero-width space or similar character. For a block type the sidebar can't show, it writes nothing into the note and shows one Notice. Land-ready; nothing is needed from you.

**What you'll see**

- A block written as ```` ```ds-counter ```` followed by an invisible character (zero-width space, soft hyphen, a direction mark and the like), or by punctuation such as `.x`, `(x)` or `:`, is one that Live Preview already draws as a counter. "Pin to sidebar" on it now opens the panel, and a change made in the panel saves to the note. The opening line is kept byte for byte.
- Before, Pin wrote a `_dse_anchor` into the note, showed the "unavailable" card, and lost the panel's save.
- "Pin to sidebar" or "Send block to sidebar" on a block the sidebar can't show (```` ```js ````, ```` ```statblock ````, a misspelled `ds-` name) no longer touches the note. One Notice says it can't be pinned, and an invisible character in the name is spelled out as `<U+200B>` so the message isn't confusing.

**How DSE now reads a block's name**

It uses Obsidian's own rule: after the backticks and any spaces or tabs, the name is the run of letters, digits and `_ / + # -`, and it ends at the first other character. We found the rule in Obsidian's code (the same in 1.14.4 and 1.15.0) and checked it against 22 openers in real Obsidian. Every opener that already worked keeps working, including the SC-457 ones (a space before the name, a no-break space after it).

Reading view still shows these openers as plain code, as it did before. Only Live Preview draws them as blocks, and DSE now matches that.

One exception follows Obsidian too. A backtick on a ```` ``` ```` opening line means neither view draws a block, so DSE leaves it alone. A `~~~` block with a backtick after its name, such as ```` ~~~ds-counter `x` ````, is still drawn by Reading view, so it still saves and pins as before.

---

Mechanics:
- dse `sc487-pin-zwsp` @ `a993a60` on develop `b624eef`, 8 commits. The first refuses an anchor for a type the sidebar can't mount. The name-rule commits change `fenceLanguage` in `src/framework/host/blockPrefix.ts`, which now takes the fence kind, and the Notice. One commit adds lifecycle G-S33 (Live Preview pin of a zero-width-space block: anchored, panel mounted, panel write lands; fails on the old code).
- Superproject `4713fc2` on origin/main `0e9a29b`: CHANGELOG bullet plus the dse-verify lifecycle row (36/36).
- Gates at `a993a60`: tsc and lint clean · jest 5958 passed / 1 skipped / 241 of 242 · lifecycle 36/36 · e2e 114/114, 0 known-bug, coverage 79/79 · shots 592, 0 FAIL, ran to the end · freeze 280/280 · parity 0 / 0 / 24 declared.
- Review: five rounds by two independent Opus reviewers, with each fix probed in real Obsidian 1.14.4 and 1.15.0. The findings were a name rule narrower than Obsidian's, the Notice spelling, a backtick case, the `~~~` exception in Reading view, and a form-feed case. All are fixed. The last review (at `944922e`) was land-ready with no findings above INFO. After it, only a rebase and a comment-only commit were added (range-diff equal apart from conflict context in the lifecycle driver).
- Filed, all found along the way and all the same on develop before this change: SC-499 (the lifecycle gate runs whatever Obsidian is installed), SC-507 (a fence marker that mixes backticks and tildes still gets pinned), SC-508 (a lone carriage return inside an opening line loses saves with no Notice).
- Landing note: SC-471 (parked) edits the same file. Whichever lands second maps the new `unregistered` result in SC-471's command path and updates one command test.
