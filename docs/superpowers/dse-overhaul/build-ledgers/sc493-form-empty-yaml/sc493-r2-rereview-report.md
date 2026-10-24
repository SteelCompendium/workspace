# SC-493 r2: scoped re-review by reviewer B (afa49f9a4ee2f356b)

## Executive summary
- **Verdict: LAND-READY** at dse `efc17de` on `a993a60`, superproject `ca49bf6` on origin/main `84b3712`. No new findings above INFO.
- The rebase changed nothing: `git range-diff c98bd82..1175a3b a993a60..5cf8386` shows all 4 commits as `=`.
- MEDIUM-1 is fixed. In real Obsidian the preview has no `data-dse-readonly` and no badge, and the full D5 sentence is readable (`sc493-r2-shot-counter.png`).
- The r2 tests fail against the pre-r2 FormModal (5cf8386): 3 failed / 42 passed. At HEAD: 45/45. Four new mutants, all fail tests (1, 2, 2 and 1 failing).
- LOW-1 is folded: values-row, characteristics, feature and featureblock are in CASES, and the CHANGELOG names six elements.
- LOW-2(b) is folded and the check is generic: it looks only at the shape of the model (`kind === 'invalid'`), the shared `RefOrInline` variant from `elements/shared/withReference.ts`. It imports no element code. Invalid ds-scc bodies now turn Save off with ds-scc's own message. Valid ones (a bare code, `scc.v1:`/`scc:` code, padded code, `collapsed: true` above a code) still save and render.
- Probe table rows for counter, montage and scc at HEAD all match the intent. 0 console warn/error calls on any keystroke.
- Battery: I re-ran tsc, lint, jest, e2e and freeze myself. A's other logs on the final tip are real (rc 0 plus summary lines; timing below).
- Remaining items are INFO only.

## Checks

### 1. Range-diff
| Before (on c98bd82) | After (on a993a60) | Range-diff |
|---|---|---|
| 878fd07 | bb71435 | `=` |
| fc0b8e2 | 4db446b | `=` |
| 4e8adfb | d07c8e1 | `=` |
| 1175a3b | 5cf8386 | `=` |

The new commits are a8d1366 (tests only, +56 lines in `formModalEmptyYaml.test.ts`) and efc17de (`FormModal.ts` only).

### 2. MEDIUM-1
- **Change:** `src/authoring/FormModal.ts:401` `this.previewEl.removeAttribute('data-dse-readonly')`, right after `empty()` and before the `saveDisabled` early return. The mount path sets the attribute again.
- **Test:** "SC-493 r2: the emptied preview drops its read-only badge". The attribute is present for a valid box, absent after emptying, and present again after `current_value: 4`.
- **Mutants:**
  - r2a (removeAttribute deleted): 1 test fails, this one.
  - r2d (removeAttribute moved after the early return): 1 test fails, this one.
- **Real Obsidian 1.15.0** (private Xvfb :161, port 9298, temporary scenario on the current lifecycle harness, deleted afterwards):
  - Error line: x=457, width 526, scrollWidth 526, one line.
  - Preview: 0 px tall, `data-dse-readonly` false, `::after` content `none`.
  - A real click on the disabled Save left the note byte-identical. Page errors: 0.
- **`sc493-r2-shot-counter.png`:** a note titled "SC-493 counter" with a Counter card showing 3 and "Victories". In front of it is the "EDIT COUNTER" dialog: an empty YAML box with the text cursor in it. Directly under the box the whole sentence reads "This block can't be empty. Add at least one setting, or press Cancel.", with no badge over it. At the bottom right are the Save icon button, dimmed and disabled, and the Cancel (X) button.

### 3. LOW-1
- CASES now includes values-row, characteristics, feature and featureblock (acceptsEmpty false, source = the element's own `authoring.example`). Each of empty, whitespace-only and comment-only shows the D5 text, keeps Save off and writes nothing.
- CHANGELOG `ca49bf6`: "For a block the form edits as raw YAML (for example Counter, Negotiation, Party, Encounter, Values row, Characteristics)…". The wording matches.

### 4. LOW-2(b)
- **Code:** `FormModal.ts:337-341`. If the model is a non-null object whose `kind` is `'invalid'`, the check throws the model's string `message`. If there is no string message it falls back to "This block can't be saved as written.".
- **Generic:** no element import. `RefOrInline` is declared in shared `withReference.ts:36` and presented by shared `RefUnwrapView.ts:85`. Only ds-scc's `parse` (`scc/definition.ts:268`) returns this shape today. I checked the raw-box element models for any other top-level `kind: 'invalid'`: none (the montage and encounter `kind` fields are view-internal and never a parse result).
- **Tests:** a stub def that returns `{kind:'invalid'}` on null; ds-scc with an inline link and with an empty body (Save off, ds-scc's own message), then its example code (Save on).
- **Mutants:**
  - r2b (check disabled): both tests fail.
  - r2c (always the fallback message, never the model's): both tests fail.
- **Accepted side effect (owner ruling):** an empty ds-scc box shows ds-scc's own "Empty block. `ds-scc` renders a synced-compendium entry…" with Save off, not the D5 text.

### 5. Probe table at efc17de (real pencil, real FormModal, real ReadingModeBlockHost, then a re-render through the real pipeline; md-dse compendium fixtures loaded; typed one keystroke at a time)
| Box | counter | montage | scc |
|---|---|---|---|
| `''` / whitespace | off: D5 | SAVE, renders | off: "Empty block…" |
| `# comment` | off: D5 | SAVE, renders | off: "`# comment` is not a full SCC code…" |
| `---` | off: D5 | SAVE, renders | off: not a full SCC code |
| `prefs:` / `prefs:` map | SAVE, renders | SAVE, renders | off: not a full code / more than one line |
| `^block-id` | SAVE, renders | SAVE, renders | off: not a full SCC code |
| `- a\n- b` | SAVE, renders | SAVE, renders | off: more than one line |
| `hello` | SAVE, renders | SAVE, renders | off: not a full SCC code |
| `key: [unclosed` | off: YAML message | off: YAML | off: not a full SCC code |
| `collapsed: true` | SAVE, renders | SAVE, renders | off: not a full SCC code |
| `collapsed: true\nSome prose: and: more` | off: YAML | off: YAML | off: not a full SCC code |
| `@Note.md` | off: YAML | off: YAML | off: "Wikilink and @path references are not supported here…" |
| `a: 1\na: 2` | off: YAML | off: YAML | off: more than one line |

ds-scc valid and invalid bodies:

| Body | Result |
|---|---|
| `mcdm.heroes.v1/kit/panther` | SAVE, renders |
| `  …panther  \n` (padded) | SAVE, renders |
| `scc.v1:…` | SAVE, renders |
| `scc:…` | SAVE, renders |
| `collapsed: true\nmcdm.heroes.v1/kit/panther` (collapse-key rescue) | SAVE, renders |
| `mcdm.heroes.v1/kit/nonexistent` | SAVE, then the "Not installed locally… Sync compendium" notice (INFO-1) |
| `hello world`, `[[Panther]]`, `@Ref.md`, an inline link, a backticked code, `a: 1` | off, each with ds-scc's own message |

The brief lists "YAML mapping" among valid ds-scc bodies. ds-scc has never accepted one: the pipeline renders "`a: 1` is not a full SCC code" at base too. So Save off is right.

Console: 0 console.warn and 0 console.error calls on every keystroke of every row.

### 6. Battery
Re-run by me at efc17de:

| Gate | Result |
|---|---|
| tsc (+ `-p e2e`) | rc 0 |
| lint | rc 0 |
| jest | `Tests: 1 skipped, 6003 passed, 6004 total` · `Test Suites: 1 skipped, 242 passed, 242 of 243` · rc 0 |
| e2e | `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · rc 0 |
| freeze (against A's efc17de shots dir) | `freeze OK (280/280 …)` · rc 0 |

A's logs in `…/scratchpad/sc493-r1-impl-A/`:

| Log | Written | rc | Summary line |
|---|---|---|---|
| tsc4 | 19:31:54 | 0 | — |
| lint4 | 19:32:20 | 0 | — |
| jest4 | 19:33:39 | 0 | 6003 / 1 / 242 of 243 |
| lifecycle4 | 19:42:22 | 0 | `start: obsidian 1.15.0 … 36 scenario(s)` / `done: 36/36 ok, 0 failed` |
| e2e4 | 19:43:41 | 0 | `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` |
| shots4 | 19:57:04 | 0 | 0 FAIL lines |
| freeze4 | 19:57:08 | no rc file | `freeze OK (280/280 …)` |
| parity4 | 19:57:15 | 0 | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |

The logs do not print a sha. They tie to the tip by time: efc17de was committed at 19:32:38 and the tree has not changed since. tsc4 and lint4 ran just before the commit, on the uncommitted fix, which is why I re-ran both. freeze4 has no rc file, which is why I re-ran freeze.

## INFO
- INFO-1: a ds-scc code with valid syntax that is not in the compendium (`…/kit/nonexistent`) saves and renders the "Not installed locally" notice. The form does not resolve references, the same class as LOW-2(a), which the owner dropped. No action.
- INFO-2: the error line sits directly under the textarea, so the top of its first glyphs touches the box's focus outline (see the shot). The text is fully readable. Form layout is SC-404's. No action.
- INFO-3: the brief's "YAML mapping" is not a valid ds-scc body (see section 5). This is not a defect.

## Tree state
At start and end, plugin `git status --porcelain` is empty and the superproject shows ` M draw-steel-elements` (pointer not bumped). The temporary probe test and screenshot scenario were deleted. My lifecycle runs left no temp dir.

## Artifacts
- Report: this file.
- Screenshot: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/sc493-r2-shot-counter.png`.
- Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r2-rereview-afa49f9a4ee2f356b/`:
  - gates: `gate-{tsc,lint,jest,e2e,freeze}.{log,rc}`
  - r2 red test: `red-r2.{log,rc}`
  - mutants: `mut-*.{log,rc}`
  - probe tables: `probe-main.json`, `probe-scc.json`
  - real-Obsidian run: `obs-shots.log`, `obsidian-shots/`
  - temporary probe source: `zzSc493Probe.r2.test.ts`
