# SC-450 R2 review findings (verbatim from reviewer-B's inline report; reviewer's harness blocked the .md write)

Verdict: APPROVE_WITH_FINDINGS at 99ae762 (base f818002). 0 HIGH, 0 MED, 3 LOW, 6 INFO. Full battery green on head. Logs: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/logs/sc450-r2-*. Probe scripts: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/{probe.mjs,guardprobe.js}.

## LOW

1. **The harness gate only measures the resting state** (`visual-harness/shoot.mjs:2971`, `:2983`, `:3074`). The brief asked for rest, hover and focus-visible.
   - Proof: mutation M2 is a bare in-place write plus a hover-only rule, `.dse-nt__chip[aria-pressed='true']:not([data-pressed]):hover{background-image:none!important}`. Against it the gate still printed `pressed toggle parity OK (32 comparisons …)`, while the reviewer's probe reported `PROBE VIOLATED (2)` (dark and light, hover, idle→pressed).
   - The jest guard does catch the TS half of that mutation, which limits the risk.
   - Fix: run `measurePressedToggle` per state, the way the `BTN_STATES` sweep does. For hover, move the mouse to the element's centre before each read. For focus-visible, press Tab first, then `focus()`, and fail if `:focus-visible` doesn't match.

2. **The guard misses some write shapes** (`test/unit/build/ariaPressedWriters.test.ts:48`, `:63`, `:72`). Measured in `logs/sc450-r2-guard-bypass-shapes.log`, 0 hits each for:
   - `el.dataset.pressed = ''` and `delete el.dataset.pressed`
   - `Object.assign(el,{ariaPressed:'true'})`, `el['ariaPressed']=`, `el.ariaPressed ??=`
   - `'aria-'+'pressed'` and template-built names
   - any write placed after a string literal containing ` //` on the same line, because `stripComments` treats that as a comment.
   Multiline calls, constant indirection, `setAttributeNS` and helper attribute maps are all caught. Fix: add patterns for `\.dataset\.pressed\b`, `\bariaPressed\b\s*(\?\?|\|\||&&)?=`, `['"]ariaPressed['"]` and an `ariaPressed:` key. Strip comments with a string-aware tokenizer (or the TS scanner) instead of the regex.

3. **The allowlist counts writes per file** (`ariaPressedWriters.test.ts:31`, `:91`). If an edit to `initiative/view.ts` removes one read-only span write and adds one bare `aria-pressed` write, the count stays 2 and the guard passes. Fix: match each allowed hit by its line text, e.g. `/el\.toggleAttribute\('data-pressed', pressed\)/` with an exact count.

## INFO

- The gate red-proof works as designed, but "revert the fix and it goes red" can't hold: base f818002 has no drift. Mutation M1 (build stamps both, in-place repaint writes bare aria-pressed, rule keyed on `:not([data-pressed])`) turns it red. The gate is not vacuous.
- Jest red-proof: with head's tests on base src, 6 of 7 new tests fail; the 7th is the scanner self-test.
- **The writer module is exempt as a whole file** (`ariaPressedWriters.test.ts:89`), so a second writer added inside `iconButton.ts` would not be scanned. Minor; worth folding into the LOW-2 fix.
- Both owner DROP rulings stand (read-only spans never repainted, aria-pressed on a span would be invalid ARIA; pitfall chip matches motivation chip at rest/hover/focus-visible both schemes).
- Scratchpad is shared across the owner's session; another worker overwrote the reviewer's gate.sh. Use unique prefixes.
- Main checkout shows ` M draw-steel-elements` (Scott's vault dirt, expected).
