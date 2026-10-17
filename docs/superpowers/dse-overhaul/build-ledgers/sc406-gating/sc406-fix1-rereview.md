# SC-406 fix round 1 — scoped re-review (dse `sc406-gating` 3fddf49..05a6ff3)

**Executive summary**
- **Verdict: LAND-READY.** All four r1 findings are closed. Each fix has a test that goes red when its line is removed (9 mutations, 9 red).
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 4. Nothing new needs fixing.
- **ON state is byte-for-byte develop:**
  - Jest, the same probe on base f8693b5 and on head with `{experimental:true}`: 6 counter-write variants (gated, typo and applied keys in mixed order) plus a prefs save are all identical.
  - Real Obsidian, base vs head-ON: identical except the alias removal Scott ruled.
- **MEDIUM-1 closed:**
  - My r1 repro (jest + real Obsidian phase C) now keeps `printPreview` in the note, in the author's position.
  - A typo key is still dropped, as on develop.
  - A net-zero edit leaves the note bytes unchanged, with the same write count as develop.
- MEDIUM-2 closed (real Obsidian: `prefs` keeps `printPreview`/`authoringControls` after a save while off). MEDIUM-3 closed (camera restore verified for a present file, an absent file and SIGINT). LOW-1 closed.
- Gates measured: tsc clean · lint clean · jest **4429 passed / 1 skipped / 218 of 219** · lifecycle **25/25** · shots **568, 0 FAIL** · freeze **`freeze OK (274/274 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## Verification per finding
- **LOW-1 (bcfe073)**:
  - `isDefinitionDeferredOff` deliberately excludes `hidden`.
  - Mutation F1 (guard removed) → `off: no trigger inside a ds-surges or ds-hero fence` goes red.
  - The ON control keeps ds-hero's keys.
- **MEDIUM-1 (71c4bc2)**:
  - Passthrough is populated only for `EXPERIMENTAL_PREF_KEYS`, and only while `!isExperimental()`.
  - `withPrefOverrides` with no passthrough takes the old path.
  - `prepareModel` only sets `prefPassthrough` when it is non-empty.
  - Mutations, all red:
    - F2 (values not stored) → 4 red
    - F3 (serializer only wired when overrides exist) → 2 red
    - F4 (author order ignored) → 2 red
  - **Probe (`fix1/probe-mut2.json`)**, head with the switch off, counter `+` written through the real `onload` processor:

    | Variant | Written `prefs:` block |
    |---|---|
    | V1 | `prefs: printPreview: on, reduceMotion: true` |
    | V2 (gated key only) | map kept |
    | V3 (`reduceMotion, bogusKey, printPreview`) | `reduceMotion, printPreview` (typo dropped, author order kept) |
    | V4 | `authoringControls, printPreview` |
    | V5 / V6 | unchanged |

    - In every variant the content above and below the fence is intact.
  - **Churn check**: re-render from the written note and apply + then −. The note bytes are unchanged, with 1 modify call, the same as develop with the switch on.
  - **Real Obsidian** (`fix1/obsidian/review-probe-results.json`, phase C): the counter block reads `prefs: | printPreview: on | reduceMotion: true | …`.
- **MEDIUM-2 (37c1947)**:
  - `retainUndescribed` is only called while off, so with the switch ON the store's retained set is empty and behaves exactly as develop.
  - `persist()` carries a retained key only while it has no descriptor.
  - Probe, switch off, stored `{textScale, printPreview, authoringControls, retiredKey}` + a `set` → `{reduceMotion, textScale, printPreview, authoringControls}` (the retired key is still dropped).
  - With the switch ON the result is identical to develop.
  - Real Obsidian phase A: `prefs` = `{printPreview:'on', authoringControls:true}` after a save with the switch off.
  - Mutations F5 (call removed) and F6 (carry-forward loop removed) → 3 red each.
- **MEDIUM-3 (05a6ff3)**:
  - Mutations, all red:
    - F7 (restore is a no-op) → 2 red
    - F8 (parse guard removed) → 1 red
    - F9 (absent file not deleted) → 1 red
  - End-to-end `npm run docs-shots -- --only=scc-reference.png` in a throwaway worktree:
    - **present** distinctive `data.json` → sha256 before = after (`7c4518…`).
    - **absent** → absent afterwards. A file the run's own Obsidian created is a scratch artifact of the run, so deleting it is correct and not a clobber.
  - **SIGINT** sent to the camera mid-run (Obsidian up, plugin loaded): exit 130, `data.json` sha before = after (`46d482…`), no Obsidian left on its port.

## INFO (no action required)
1. **Retained keys move to the end of `data.json`'s `prefs` object** after a save while off (`{reduceMotion, textScale, printPreview, authoringControls}` vs develop's `{reduceMotion, printPreview, …}`). Values are identical; only the order in a settings file changes. Harmless.
2. **Camera restore can revert a concurrent human pref change.**
   - When to expect it: docs-shots is documented as not needing a closed Obsidian. If Scott has the demo vault open in his own Obsidian during a camera run and changes a DSE pref, that change is reverted when the run ends.
   - Why it is acceptable: a bytes restore is the safer trade, because a merge-restore would leak the camera's own pref toggles into his data. The window is the run's length only. A one-line note in `visual-harness/README.md` would cover it.
3. **A signal during the warm-up launch skips the kill-first ordering.** `warmUpUpdate` runs only when the udd has no updated asar. A SIGINT during it restores immediately, because `liveChild` is still null while the warm-up Obsidian is alive and could rewrite `data.json` on exit. This is the same class as the already-ruled SIGKILL follow-up: dev tooling only. Optional fix: set `liveChild` inside `warmUpUpdate` too. Separately, `process.exit(130)` is used for SIGTERM as well; 143 would be conventional.
4. **The re-emitted value is unquoted.** The author's `printPreview: "on"` comes back as `printPreview: on`. This is the same `stringifyYaml` behaviour develop already applies to applied per-block keys with the switch on (the probe is identical on base), and it reads back as the string `on`.

## Housekeeping
- Worktree: HEAD 05a6ff3, `git status --porcelain` empty before and after, `--ignored` listing identical. The throwaway worktrees (`mut2` at 05a6ff3, `mutbase` at f8693b5) were removed and pruned. No Xvfb or Obsidian processes are left.
- I removed a stray empty file `workspace/1` from the superproject root (0 bytes, created 20:41 during my r1 run; most likely mine from a devbox redirect). The superproject still shows ` M draw-steel-elements` only: the same pre-existing main-checkout dirt as r1 INFO-6.
