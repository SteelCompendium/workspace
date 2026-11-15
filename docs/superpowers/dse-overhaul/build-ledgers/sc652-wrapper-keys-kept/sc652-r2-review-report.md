# SC-652 r2 independent adversarial review — dse `sc652-wrapper-keys-kept` `be843ebd` vs `fcc7278e`

## Executive summary
- **Verdict: FIX** (one MEDIUM, small and local; everything else holds).
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 2 · INFO 6.
- M-1: the "body already declares it" guard is a column-0 text test. On ds-hero (raw splice) a quoted or explicit
  reserved key (`"prefs":`, `'prefs':`, `? prefs`, `"collapsed": yes`) is not recognised, so the wrapper adds a second
  line; the next redraw is a parse error card ("Map keys must be unique"). r1 makes this NEW for unknown-only / scalar
  `prefs:` and non-boolean `collapsed:` (base kept those blocks valid). One-function fix, probed green (below).
- Measured at `be843ebd`: tsc (incl. e2e) clean · lint clean · jest **13526 passed / 1 skipped** (= implementer's
  13525/2 plus the cached-CSS test) · lifecycle **63/64** (G-S61 fails on torn disk reads, and fails the same way on base `fcc7278e` back to back: host, not this diff; I-6) · e2e **`618/627 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`** on the re-run (first run: only SET-X03 / SET-X04, SC-657). styles.css not in the diff: shots /
  freeze / parity not run (brief rule).
- Everything else the brief listed holds under runtime probes: all ruling bullets kept by value and once, every write
  path, behaviour on screen unchanged, no-key blocks byte-identical to base, sidebar refresh, hostile values, no
  by-reference mutation, tests non-vacuous (92 of 214 tests in the six SC-652 suites fail on base src).

## Findings

### MEDIUM

**M-1 — ds-hero: a quoted / explicit reserved key is written twice and the block becomes a parse error card.**
`src/framework/prefOverrides.ts:150` (`TOP_LEVEL_PREFS_RE = /^prefs\s*:/mu`, used at :170) and
`src/framework/chrome/collapsedKey.ts:258` (`topLevelRe`, used at :283).

The guard decides "the serialized body already declares `prefs:` / `collapsed:`" with a column-0 regex. ds-hero's
`serializeStateSplice` puts the author's raw definition text back, so the author's line is in the body in whatever
YAML spelling the author used. YAML spellings that parse to the key `prefs` but fail the regex: `"prefs":`, `'prefs':`,
`? prefs` / `: value`. The same for `collapsed`.

Failure scenario (jest, real ElementPipeline + ReadingModeBlockHost + FakeVault, `r2rev-probe.test.ts`):

```
"prefs": {boardDensity: compact}
name: Torin Stonefist
... (the rest of a valid ds-hero body)
```
Action: one click on the Surges + stepper. Head writes:
```
prefs:
  boardDensity: compact
"prefs": {boardDensity: compact}
name: Torin Stonefist
...
```
Redraw of that body (probe 2): error card `Hero sheet: failed to render (parse) Map keys must be unique at line 3`.
Base wrote the block unchanged apart from the surge (one `"prefs":` line, valid).

| input on ds-hero | base `fcc7278e` | head `be843ebd` |
|---|---|---|
| `"prefs": {boardDensity: compact}` | 1 line, valid | **2 lines, parse error** |
| `'prefs': compact` | 1 line, valid | **2 lines, parse error** |
| `? prefs` / `: {boardDensity: compact}` | valid | **duplicate key, parse error** |
| `"collapsed": yes` | 1 line, valid | **2 lines, parse error** |
| `"prefs": {reduceMotion: true}` (applied) | 2 lines, parse error | 2 lines, parse error (pre-existing SC-514) |
| `"collapsed": true` | 2 lines, parse error | 2 lines, parse error (pre-existing) |

The first four are what the owner's SC-514 ruling asked to be reported ("installing the `prefs:` wrapper in more cases
must not produce a second `prefs:` line on ds-hero"). No other element is affected: every other serializer re-stringifies
from its model, and `yaml`'s stringify never puts a column-0 `prefs:` / `collapsed:` inside a value (probed: block
scalar, folded plain / double-quoted strings, nested maps, list items, comments; `r2rev-yamlprobe.log`).

Prescribed fix: decide "declares the key" by parsing, falling back to the line test only when the body does not parse
to a map. One shared helper in `prefOverrides.ts`, used by both wrappers:

```ts
export function bodyDeclaresTopLevel(body: string, key: string): boolean {
	try {
		const p: unknown = parseYaml(body);
		if (p && typeof p === 'object' && !Array.isArray(p)) return Object.prototype.hasOwnProperty.call(p, key);
	} catch { /* fall back to the line test */ }
	return new RegExp('^' + key + '\\s*:', 'mu').test(body);
}
```
`withPrefOverrides`: `if (bodyDeclaresTopLevel(body, 'prefs')) return body;` · `withCollapseKeys`:
`if (!bodyDeclaresTopLevel(body, key)) missing[key] = value;` (then drop `TOP_LEVEL_PREFS_RE` / `topLevelRe`).
Probed in a throwaway copy of the head: all six rows above become one line and valid (including the two pre-existing
SC-514 rows); every non-hero probe output is byte-identical to the unfixed head; the SC-652 suites (wrapperKeysKept,
reservedKeysKept, formModalCollapseKeys, sidebarInitiative, experimentalGate, prefOverrides) 214/214 pass. Add hero
cases for `"prefs":`, `'prefs':` and `"collapsed": yes` to `wrapperKeysKept.test.ts`'s SC-514 block (they fail on the
current head).

### LOW

**L-1 — stale comment says `withPrefOverrides` has no guard.** `src/framework/chrome/collapsedKey.ts:271-273`
("`withPrefOverrides` has the same latent double-emit against a raw-splicing serializer; that is a pre-existing gap,
filed rather than fixed here"). r1 added that guard (`prefOverrides.ts:157-171`). Fix: replace the sentence with a
pointer to the shared guard (or drop it with the M-1 change).

**L-2 — "SC-514 is effectively fixed" is true only for a plain column-0 `prefs:`.** Measured: ds-hero
`prefs:\n  reduceMotion: true` repeated three writes: base 2 lines (parse error), head 1 line, valid — fixed. But
`"prefs": {reduceMotion: true}` still writes twice at head (table above). Owner: do not close SC-514 on r1's claim
alone; with the M-1 fix the quoted variants are fixed too (probed).

### INFO

- **I-1 — by-value re-stringify changes a few exotic values (expected under the "Not SC-599" ruling, no action).**
  `prefs: {~: c}` comes back as `"": c`; `prefs: {1: a, true: b}` as `"1": a` / `"true": b`; `? [a, b] : c` as
  `"[ a, b ]": c`; `!custom x` loses its tag; `prefs: 0x10` becomes `16`; an alias (`prefs: &p {...}` / `x: *p`) is
  expanded. Same behaviour as every other field the serializers re-stringify. `__proto__` / `constructor` /
  `toString` / `hasOwnProperty` keys are kept as own keys, no prototype pollution (`({}).polluted` undefined).
- **I-2 — no by-reference mutation found.** The passthrough holds the parsed object; nothing writes to it.
  `applyPrefOverrides` reads only; FormModal's preview re-serializes the same object unchanged; every render re-parses.
  Strongest probe: `prefs: {roster: &r [...]}` with `participants: *r` on ds-montage, then `addMontageHero`: the
  written `prefs.roster` still equals the note (the montage model does not share the alias array).
- **I-3 — ds-hero bodies whose whole document is indented are already broken by a write at base** (raw splice puts
  `state:` at column 0: "Unexpected scalar at node end"). r1 changes the shape of the breakage when `prefs:` is
  present (the wrapper's column-0 `prefs:` turns the rest into a nested map) but the block was invalid after a write
  either way. Pre-existing, not SC-652; candidate Backlog ticket.
- **I-4 — CTR-K01 (a counter scenario) lives in `e2e/specs/montage/kept-keys.e2e.ts`.** Ids unique (one spec hit each,
  none elsewhere), titles carry scenario ids only (no ticket ids). Cosmetic; move to a counter spec if the e2e layout
  convention cares.
- **I-5 — peel path is safe by construction.** `peelLeadingCollapseKeys` (`collapsedKey.ts:226-236`) only removes a
  line whose value parses to a boolean, so a non-boolean is never removed from the source; and every element that
  accepts a non-mapping body (`withReference`, `ds-scc`, generic cards) has `serialize: undefined`, so the rescue path
  has no write-back at all.
- **I-6 — G-S61 failed on this host on head AND base; not attributable to this diff.** Every failing phase reads
  "the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run" (N = 3..12) with 0
  counted stale frames and correct final disk/card values. Runs: chain part 4 (load ~7), alone x3 on head (load 4-16),
  alone x1 on base `fcc7278e` between two head runs (load 4.6 -> 3.5): all FAIL, same cause, similar torn counts
  (base longest runs 4/4/10/11, head 3..11). The implementer's earlier run had torn ~0 in every phase. G-S61's
  counters carry no reserved key, so no wrapper is installed and their writes are byte-identical to base (probe
  `counter.none`). Not in the brief's known-flake list: owner may want a Backlog ticket for G-S61's torn-read
  threshold (`visual-harness/obsidian-lifecycle.mjs:7340`, `tornLongest >= 3`) and should treat 64/64 as unproven on
  this host today rather than as a regression.

## Ruling coverage (runtime evidence)

All through the real pipeline + ReadingModeBlockHost + FakeVault unless noted; "kept" = re-parsed value equal to the
note, one line, block re-renders.

| ruling bullet | where shown | result |
|---|---|---|
| `prefs:` unknown-only, typo | wrapperKeysKept (4 elements), r2rev-probe (counter/montage/hero/stamina), e2e MONT-X15 | kept |
| attr-less, css-bearing, `perBlock: false` | wrapperKeysKept MIXED_PREFS, formModalCollapseKeys MIXED | kept, order kept |
| gated, switch off / on | experimentalGate SC-406 block (off: kept with typo key; on: applied) | kept |
| mixed applied + unknown, author order | wrapperKeysKept "author's order" | kept |
| non-map `prefs:` scalar / list / empty / `{}` | wrapperKeysKept, e2e CTR-K01, r2rev-probe `counter.flowPrefsEmpty` | kept (`prefs:` -> `prefs: null` is SC-599, ruled out) |
| `collapsed: yes` / `1` / `"true"` | wrapperKeysKept, r2rev-probe `counter.collapsedVariants`, e2e MONT-X16/X18 | kept |
| claimed `collapsible: no` / `collapse_default: 1` | r2rev-probe `counter.collapsibleNo`, wrapperKeysKept | kept |
| model-owned pair (`ds-stamina-bar`) | r2rev-probe `stamina.ownedKeys` | owned keys once, `prefs`/`collapsed` once |
| peel path | code + unit tests (I-5) | nothing removable |
| reserved keys placed `prefs` then `collapsed` then body, even when authored last | r2rev-probe `counter.reservedAtEnd` | today's placement |

Write paths: in-block interaction (above); outside-edit refresh in the sidebar (sidebarInitiative: add, hand edit,
delete; both new tests fail on base); block edit form Save (formModalCollapseKeys SC-652 block; r2rev-probe2 ds-hero
form Save with unknown `prefs:` + `collapsed: yes`, with a quoted `"prefs":`, with an applied override: one line each,
re-renders clean). `grep` of every caller of `extractPrefOverrides` / `extractCollapseKeys` / `withReservedKeys` /
`prepareModel` / `setSerializer`: pipeline.ts:340/358/485/533, FormModal.ts:154/157/331, SidebarPanel.ts:316/326,
initiative/view.ts:208 (wraps whatever it is given; re-wrap safe). Other vault writers (`registration.ts:259`
anchor stamp, `encounter/view.ts:458` tracker creation) do not rewrite a block from a model. Nothing missed.

Behaviour unchanged: on-screen HTML identical with and without each kept key (wrapperKeysKept); `data-dse-collapsed`
for absent / `yes` / `"true"` / `1` is identical (null with global collapseDefault false, `on` with true) on base and
head (r2rev-probe `collapseState.*`). Blocks with no reserved key: written bodies byte-identical base vs head for
counter, montage, stamina-bar, hero (two writes each).

Integrity: text above/below unchanged in every probe case; two same-kind blocks no cross-talk, hand edit kept, delete
not resurrected, repeated writes idempotent (wrapperKeysKept integrity block; sidebarInitiative; r2rev-probe 2-3 writes
per case).

SC-644 / scope: `pipeline.ts` diff is the passthrough init (3 lines) and a doc comment; `resolveCollapseState` and the
settings path untouched; SidebarPanel change rebuilds the serializer only (SC-665 display refresh not attempted).

## Test quality (head tests run against base src, `r2rev-mut.sh`)

| suite | failing on base |
|---|---|
| wrapperKeysKept (69) | 46 |
| reservedKeysKept (25) | 20 |
| formModalCollapseKeys (45) | 21 |
| sidebarInitiative (29) | 2 (both SC-652 tests) |
| experimentalGate (43) | 1 (the reversed typo-key test) |
| prefOverrides unit (3) | 2 |

Non-vacuous. Gap: no test covers a quoted reserved key on ds-hero (M-1).

## Gates at `be843ebd` (this review, branch worktree)

| gate | result | log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, EXIT=0 | r2rev-tsc.log |
| lint | clean, EXIT=0 | r2rev-lint.log |
| jest | 13526 passed / 1 skipped (295 suites + 1 skipped), EXIT=0 | r2rev-jest.log |
| lifecycle p1..p7 | 21/21 · 16/16 · 9/9 · **3/4 (G-S61 FAIL)** · 7/7 · 4/4 · 3/3 = 63/64; G-S61 alone: head FAIL x3, base `fcc7278e` FAIL x1 (same torn-read cause, I-6) | r2rev-lc-p1..p7.log, r2rev-lc-p4-rerun-gs61.log, r2rev-gs61-{head2,base1,head3}.log | r2rev-lc-p1..p7.log |
| e2e | run 1: `616/627 ok, 2 failed, 9 known-bug, coverage: 415/417 pairs` (SET-X03, SET-X04 only, SC-657); run 2: `618/627 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, EXIT=0 | r2rev-e2e.log, r2rev-e2e-rerun.log |
| shots / freeze / parity | not run: `styles.css` / CSS not in the diff | — |

## Probes run

| probe | file | result |
|---|---|---|
| yaml guard-fooling + hostile round trip (node, real `yaml`) | r2rev-yamlprobe.cjs / .log | guard never fooled by stringify output; exotic value changes listed in I-1 |
| 36-case write matrix, base vs head (hero quoted/explicit/indented/after-state/CRLF/repeated; counter/montage block-scalar, nested, list, comment; hostile; collapse variants; placement; no-key byte identity; stamina owned keys; collapse state x global default) | r2rev-probe.test.ts -> r2rev-out-{base,head}-p1.json, r2rev-summary-p1.txt, r2rev-summary-p1-full.txt | M-1; rest as listed |
| form Save on ds-hero / ds-counter, redraw of the head's hero write, montage alias mutation | r2rev-probe2.test.ts -> r2rev-out-head-p2.json | form OK; redraw = error card (M-1); no mutation (I-2) |
| head tests vs base src | r2rev-mut.sh -> r2rev-mut-*.log | table above |
| prescribed M-1 fix in a throwaway head copy | r2rev-fixprobe.sh -> r2rev-out-headfix-p1.json, r2rev-probe-headfix-p1.log, r2rev-fixprobe-suites.log | 6 hero rows fixed, non-hero identical, 214/214 |
| G-S61 alone, head / base / head back to back | r2rev-gs61.sh -> r2rev-gs61-{head2,base1,head3}.log | all FAIL on torn reads (I-6) |

All artifacts under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r2-review/`.
Throwaway worktrees `wt-head` (be843ebd, detached; src reverted, two untracked probe tests) and `wt-base` (fcc7278e,
detached, tests restored) are registered in the dse repo's worktree list; remove with `git worktree remove` when the
scratch is cleared (not done here: no deletes in scratch). Branch worktree left at `be843ebd`, clean.
