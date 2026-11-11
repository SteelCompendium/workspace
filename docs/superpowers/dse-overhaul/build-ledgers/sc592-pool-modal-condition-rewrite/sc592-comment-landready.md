Conditions you typed as plain names now stay plain names when the plugin saves the initiative block. Removing one condition in the minion pool modal deletes only that line.

**This was not intended.** I treated it as a bug, the same call as SC-466. No decision needed from you.

**It was wider than the ticket said.** The cause was not in the pool modal. Every save of a `ds-initiative` block rewrote every plain-name condition as `- key: …`, on every hero and creature. That included saves that change nothing about conditions, such as a Malice +1 or a turn click.

**What changes for you:**

- A plain name like `- grabbed` stays `- grabbed` on every save.
- A condition you wrote as `- key: hexed` stays in that form.
- If you give a plain-name condition a colour, icon, effect or duration in the Conditions modal, it becomes the longer form, because a plain name can't hold that data.
- Extra fields you wrote on a condition, like `source: trap`, are no longer deleted on save. Before this fix they were.

Example: in a squad note with conditions `on-fire, grabbed, on-fire, dazed`, removing Grabbed in the pool modal used to turn the other three into `- key: on-fire` and so on. Now only the `- grabbed` line goes.

**Not fixed here: quotes and comments.** Every save of any block still drops quotes (`"Goblin Squad"` becomes `Goblin Squad`), drops `# comments` and turns one-line lists into one item per line. The note still works. Fixing that means changing how every element saves, so I filed it as **SC-599** for you to prioritise.

Also filed: **SC-600**. A creature group whose instance list doesn't match its `amount` gets a fresh, empty list, losing its conditions.

---

Ready to land (the dispatcher lands it).

- dse branch `sc592-pool-modal-condition-rewrite` @ `79da77f8` on develop `4f0c87f2`; workspace CHANGELOG commit `e9c9b6c9` on main `3eb1adbd`
- Only `src/elements/initiative/model.ts` changed in `src/`.
- New e2e steps POOL-C09 (pool removal keeps the other conditions as typed) and POOL-C10 (an unrelated save keeps them as typed). Both fail on the old code.
- Independent review: two LOW test gaps, fixed; scoped re-review clean. 7 of 10 mutants caught in round 1, and the one real survivor is now caught too.
- Gates on `79da77f8`: tsc and lint clean · jest 7262 passed / 1 skipped · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, run by the implementer and again by the reviewer. Lifecycle 55/55, shots 592, freeze 280/280 and parity 0/0/24 were measured at `1c66c5ca` and carried over, because the only `src/` change since is a comment.
