Pressing Escape while typing in the Stamina editor now cancels only the typing. The editor stays open with your pending Damage, and a second Escape closes it without saving. This is fixed and ready to land; nothing needs your decision.

**What changed for users**

- **Stamina editor, Stamina and Temporary Stamina fields:** the first Escape reverts the half-typed number only. Before, it closed the whole editor and threw away every pending change.
- **Minion Stamina pool window, pool Stamina field:** same behavior. The damage and minion-count boxes there still close the window on Escape, as before.
- **Conditions window, "Add condition" dropdown:** Escape with the dropdown open now closes only the dropdown. Before, it closed the whole Conditions window. This had the same cause. The review confirmed it in real Obsidian, so I folded it in rather than filing a separate ticket.

Escape still closes these windows straight away when you haven't typed anything.

**Why it happened**

Obsidian handles Escape for a modal window before the focused field ever sees the key. The field's own "keep this Escape to myself" code could never run first. The fix hooks into the method Obsidian calls when a modal gets Escape. It asks the focused field whether it has something to undo, and only closes the window if it doesn't. Obsidian 1.1.16, 1.13.7 and 1.14.4 all call that method the same way, and Obsidian's own settings and theme windows rely on it too.

**Verification**

- The real-Obsidian test that recorded the bug (STAM-S06) now asserts the fixed behavior and passes.
- New real-Obsidian tests cover the Temporary Stamina field (STAM-T12) and the Conditions dropdown (COND-E01).
- With the fix removed, all three fail, so they are real checks.
- The independent reviewer found no blocking issues. Its three small findings (one changelog overclaim, two test-hygiene problems) are fixed.

<details><summary>Mechanics</summary>

- Branch `sc431-escape-field`, draw-steel-elements head `73e6a80` on `develop` `7817133`. Superproject CHANGELOG commit `b67a07c`.
- The new shared registry is `src/framework/kit/escapeConsumer.ts`. `DseModal.onEscapeKey` (in `managedModal.ts`) consults it.
- Gates at the head:
  - tsc and lint clean
  - jest 5033 passed / 1 skipped / 229 of 230 suites
  - lifecycle 26/26
  - e2e 74/78 ok, 0 failed, 4 known-bug, coverage 57/57 pairs
  - shots 572, 0 FAIL
  - freeze 276/276
  - parity 0 GAPs / 0 undeclared / 24 declared
</details>
