The button host-leak gate now checks all three button states — rest, hover, and keyboard focus — in both color schemes against Obsidian's complete real button CSS, and nothing visible changed: zero pixels moved, zero frozen screenshots changed. This is the "gate got stricter" ticket, landing exactly as scoped.

**What was wrong.** The gate sampled buttons at rest only, and its copy of Obsidian's button CSS carried 2 of the 5 rules the real app.css reaches a plugin button with — so the next plugin state rule authored at low specificity would slip through silently, the same way the SC-189 `color` leak did.

**What the gate does now:**

- Sweeps **111 button kinds × 3 states × dark+light = 666 comparisons** (computed-style invariance, with vs. without Obsidian's real rules) → **0 differences**. A button that fails to reach keyboard-focus state fails the run loudly instead of silently passing; only 12 records are exempt, each with its reason printed (disabled, hidden, or unhittable).
- The host copy was **re-extracted from the shipped Obsidian 1.13.7** — the old hand transcription had drifted in 4 places, including the dark-scheme hover background (it said #363636; the real value is #3f3f3f) — and is now **pinned**: a self-check compares it against the newest installed Obsidian on every `npm run shots`, so a future Obsidian update fails the gate instead of quietly aging the copy. On machines without Obsidian it prints a loud "PARTIAL" note rather than pretending it checked.
- The undo notice's "Undo" control is now test-guarded to stay a non-`button` element — the only reason Obsidian's type-selector rules can't reach it.
- The `styles-source.css` comment that over-claimed the sweep ("rest AND on hover") is now true, and broader than it claimed.

**Proven can-fail, not assumed:** forcing the previously-missing Obsidian rules past the plugin's CSS produces hundreds of loud failures; sabotaging the pin, the sheet listing, or an exemption each fails the run by name. All reverted, re-verified green.

**Review:** implementer + independent reviewer, three review rounds; every finding fixed or filed. Deferred findings became Backlog tickets: SC-275 (harness `.mjs` files aren't linted/type-checked), SC-276 (latent parser edge cases in the new pin — audited unreachable on today's app.css).

**Landing state:** dse branch `sc205-btn-host-leak` at `c09cf6f` (3 commits on `16e25ff`), full battery green — jest 3257 passed / 185 suites, shots 474 PNGs / 0 FAIL, freeze 210/210 / 0 mismatches, parity 0 GAPs / 0 undeclared / 16 DECLARED. No freeze rebaseline, no sanction needed — nothing visual moved. Land-ready; the dispatcher lands it. Shots runtime grew ~35 s (+11%) from the two extra state passes.
