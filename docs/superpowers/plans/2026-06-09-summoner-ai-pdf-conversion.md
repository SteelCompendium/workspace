# Summoner AI PDF Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 62-page *Draw Steel: The Summoner v1.0b* supplement PDF into our annotated-markdown source form as a new book `mcdm.summoner.v1`, with **machine-proven word-for-word fidelity** to the publisher's text, and carry it through `steel-etl gen` onto the v2 site.

**Architecture:** Three layers. (1) **Deterministic, font-aware extraction** with `pdfminer.six` is the *sole source of truth for words and numbers* — no model ever reads prose off the page. (2) **AI structures and annotates** the extracted text into our form (`@type`/`@id` comments, ability stat-block tables, SCC links) — it only moves, wraps, and tags text it was handed; it never retypes a word. (3) A **mechanical fidelity gate** strips markup from the AI output and from the extraction, reduces both to normalized word-multisets, and fails the build on any added, dropped, or altered word — verifying 100% of the text by computer, not by eye. The only place vision/judgment is used is mapping the publisher's custom glyph font (action-type icons, power-roll tiers) to semantic tokens, because that font encodes icons as ordinary ASCII letters that would otherwise silently corrupt the prose.

**Tech Stack:** Python 3.12 + `pdfminer.six` (pure-Python, no native deps — `pymupdf` is unusable in this devbox due to a `libstdc++.so.6` load failure) for extraction and the fidelity gate; Go 1.26 `steel-etl` pipeline + site builder; annotated Markdown source; MkDocs Material (v2). All `python3`/`go`/`just`/`mkdocs` commands MUST be prefixed with `devbox run --` (tools are not on PATH).

---

## Critical Facts (verified against the actual PDF on 2026-06-09)

- **Ground-truth PDF:** `/home/vexa/Downloads/The Summoner v1.0b/Summoner v1.0b.pdf` (62 pages, 16 MB). **This PDF MUST NEVER be committed to any git repository.** It lives outside the repo tree. Read-only reference.
- **It is a real digital PDF, not a scan:** `Tagged: yes`, Creator `Adobe InDesign 21.0`, every font embedded with Unicode mapping (`uni: yes`). `pdftotext` pulls 33,941 words / 381,040 chars cleanly across all 62 pages. Words are therefore deterministically extractable.
- **The corruption trap:** the `GSADML+DrawSteelGlyphs-Regular` font (807 uses) and `GSADML+Wingdings-Regular` (41 uses) encode icons onto **ordinary ASCII/Latin codepoints** (`A`, `M`, `P`, `R`, `<`, `1`–`5`, `®`, `á`, `é`, `í`, …). A font-*blind* extractor silently turns an action-type icon into the letter "A" and glues it into prose. **Extraction MUST be font-aware** and isolate glyph-font characters from real text. This is the entire reason the plan exists.
- **Confirmed glyph semantics (seed map):** in power-roll blocks, `á` (0xe1) = tier **≤11**, `é` (0xe9) = tier **12-16**, `í` (0xed) = tier **17+**. Other DrawSteelGlyphs codepoints (characteristic icons, potency, distance 📏, target 🎯) are enumerated and verified in Task 6.
- **Art is unlicensed** — we ignore all images and only process the text layer.
- **Book identity:** new book `mcdm.summoner.v1` → output dir `../data/data-summoner` (mirrors `mcdm.beastheart.v1` → `data-beastheart`). The Summoner is a standalone supplement product like Beastheart, so it gets its own book.
- **Document structure (file-page index; book page ≈ index − 3, confirm via printed footer):**
  | Chunk | File pages | Chapter / sections |
  |---|---|---|
  | Front matter | 0–3 | Cover, Credits, blank, Table of Contents — **SKIP** (TOC is site-generated; credits optional) |
  | A. Fiction/lore | 4–5 | "THE SUMMONER" / *On Summoning* |
  | B. Class basics + 1st-level | 6–24 | "THE SUMMONER CLASS" / Basics, 1st-Level Features |
  | C. 2nd-level | 25–30 | 2nd-Level Features |
  | D. 3rd–5th level | 31–37 | 3rd/4th/5th-Level Features |
  | E. 6th–8th level | 38–43 | 6th/7th/8th-Level Features |
  | F. 9th–10th level | 44–45 | 9th/10th-Level Features |
  | G. Rewards | 46–50 | New Trinkets, New Leveled Treasures, New Titles |
  | H. Other Summoners | 51–56 | Retainer Summoner, Rival Summoner |
  | I. Advice | 57–60 | For Players, For Directors |
  | J. Creator License | 61–62 | DRAW STEEL CREATOR LICENSE — **SKIP** (boilerplate; site footer carries license) |

---

## File Structure

**New tooling (in-repo, reusable for future supplements):**
- `steel-etl/tools/pdf-extract/requirements.txt` — pinned `pdfminer.six`.
- `steel-etl/tools/pdf-extract/extract.py` — font-aware, reading-order, per-page extraction. Emits raw page text with glyph chars wrapped as `⟦g:0xNN⟧` placeholders, plus `glyphs-found.json` (distinct glyph codepoints + counts + surrounding context).
- `steel-etl/tools/pdf-extract/glyphs.json` — codepoint → semantic-token map (hand-built, verified).
- `steel-etl/tools/pdf-extract/normalize.py` — pure functions: text → normalized word-multiset (the gate's core; the only thing under unit test besides the checker).
- `steel-etl/tools/pdf-extract/fidelity_check.py` — CLI: compares an annotated-markdown file (or dir) against the extraction word-multiset; exits non-zero on any mismatch and prints the diff.
- `steel-etl/tools/pdf-extract/tests/test_normalize.py` — unit tests for normalization.
- `steel-etl/tools/pdf-extract/tests/test_fidelity_check.py` — unit tests for the gate (catches add/remove/change).
- `steel-etl/tools/pdf-extract/README.md` — how to run the pipeline on a new supplement PDF.

**Generated/extraction artifacts (gitignored, NOT committed):**
- `steel-etl/tools/pdf-extract/out/summoner/pages/NNN.txt` — per-page extracted text.
- `steel-etl/tools/pdf-extract/out/summoner/glyphs-found.json`, `wordbag.json`.

**Source output (committed — this is the deliverable):**
- `steel-etl/input/summoner/Draw Steel Summoner.md` — annotated markdown source.

**Wiring (modified):**
- `steel-etl/pipeline.yaml` — add `mcdm.summoner.v1` to `books:`.
- `v2/site.yaml` — add `../data/data-summoner/en/md-linked` to `source_dirs` and a `books:` entry.

---

## Phase 0 — Scaffolding

### Task 1: Tool directory, pinned deps, and gitignore

**Files:**
- Create: `steel-etl/tools/pdf-extract/requirements.txt`
- Create: `steel-etl/tools/pdf-extract/.gitignore`
- Create: `steel-etl/tools/pdf-extract/README.md`

- [ ] **Step 1: Create the requirements file**

`steel-etl/tools/pdf-extract/requirements.txt`:
```
pdfminer.six==20240706
```

- [ ] **Step 2: Create the gitignore for extraction artifacts**

`steel-etl/tools/pdf-extract/.gitignore`:
```
out/
__pycache__/
.venv/
```

- [ ] **Step 3: Create the README**

`steel-etl/tools/pdf-extract/README.md`:
```markdown
# pdf-extract — fidelity-checked supplement conversion

Deterministic, font-aware text extraction for converting Draw Steel supplement
PDFs into annotated-markdown source with machine-proven word-for-word fidelity.

**The source PDF is never committed.** Pass its path on the command line.

## Pipeline
```bash
cd steel-etl/tools/pdf-extract
devbox run -- pip install -r requirements.txt          # one-time
# 1. Extract (font-aware, reading order). Glyphs become ⟦g:0xNN⟧ placeholders.
devbox run -- python3 extract.py "/path/to/Supplement.pdf" --out out/<book>
# 2. (First time for a new publisher PDF) build/verify glyphs.json from glyphs-found.json
# 3. Convert: structure + annotate out/<book>/pages/*.txt into the book .md (AI step)
# 4. Gate: prove no word was added/removed/changed
devbox run -- python3 fidelity_check.py \
  --markdown ../../input/<book>/Draw\ Steel\ <Book>.md \
  --wordbag out/<book>/wordbag.json
```
Exit 0 = every publisher word is present and unchanged. Non-zero = mismatch (printed).
```

- [ ] **Step 4: Verify deps install**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && devbox run -- pip install -r requirements.txt`
Expected: pip reports `pdfminer.six` installed (or "already satisfied").

- [ ] **Step 5: Commit**

```bash
git add steel-etl/tools/pdf-extract/requirements.txt steel-etl/tools/pdf-extract/.gitignore steel-etl/tools/pdf-extract/README.md
git commit -m "chore: scaffold pdf-extract fidelity-conversion tool"
```

---

## Phase 1 — Normalization (the gate's core, TDD)

The fidelity gate reduces both the publisher text and the AI markdown to a **normalized word-multiset** and compares. Normalization is the only subtle part, so it is built test-first.

### Task 2: Normalization rules

**Files:**
- Create: `steel-etl/tools/pdf-extract/normalize.py`
- Test: `steel-etl/tools/pdf-extract/tests/test_normalize.py`

- [ ] **Step 1: Write the failing tests**

`steel-etl/tools/pdf-extract/tests/test_normalize.py`:
```python
from collections import Counter
import normalize


def test_lowercases_and_splits_on_whitespace():
    assert normalize.wordbag("The Summoner Calls") == Counter(["the", "summoner", "calls"])


def test_strips_surrounding_punctuation_but_keeps_internal():
    # quotes/commas/periods dropped; intra-word hyphen/apostrophe kept
    assert normalize.wordbag('"rock-solid," she said.') == Counter(
        ["rock-solid", "she", "said"]
    )


def test_dehyphenates_line_break_splits():
    # a word split across a column line-break must rejoin to one token
    assert normalize.wordbag("rock-\nsolid take") == Counter(["rocksolid", "take"])


def test_normalizes_smart_quotes_and_dashes():
    # curly quotes -> straight, em/en dash -> space-separated, so tokens are stable
    assert normalize.wordbag("don’t — stop") == Counter(["don't", "stop"])


def test_drops_glyph_placeholders():
    assert normalize.wordbag("inflict ⟦g:0x69⟧ taunted") == Counter(
        ["inflict", "taunted"]
    )


def test_keeps_numbers_as_tokens():
    assert normalize.wordbag("5 Essence, 12-16 damage") == Counter(
        ["5", "essence", "12-16", "damage"]
    )


def test_strips_markdown_and_scc_links():
    md = "**Effect:** the [taunted](scc:mcdm.x/condition/taunted) foe"
    assert normalize.wordbag_from_markdown(md) == Counter(
        ["effect", "the", "taunted", "foe"]
    )
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && devbox run -- python3 -m pytest tests/test_normalize.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'normalize'` (and pytest may need install: `devbox run -- pip install pytest`).

- [ ] **Step 3: Write the implementation**

`steel-etl/tools/pdf-extract/normalize.py`:
```python
"""Reduce text to a normalized word-multiset for the fidelity gate.

The multiset is order-insensitive (so column de-interleaving by the AI cannot
cause false mismatches) but counts every word, so a dropped/added/changed word
always changes the multiset.
"""
import re
from collections import Counter

# ⟦g:0xNN⟧ glyph placeholders emitted by extract.py
_GLYPH = re.compile(r"⟦[gw]:0x[0-9a-fA-F]+⟧")
# scc: link targets inside markdown: [text](scc:...) -> keep text, drop target
_SCC_LINK = re.compile(r"\[([^\]]*)\]\(scc:[^)]*\)")
_MD_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
# HTML annotation comments <!-- @type: ... -->
_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
# markdown emphasis/heading/table/pipe punctuation to strip to spaces
_MD_PUNCT = re.compile(r"[#>*_`|]+")
_LINE_HYPHEN = re.compile(r"-\n")           # hyphenated line-break -> join
_SMART = {
    "’": "'", "‘": "'", "“": '"', "”": '"',
    "—": " ", "–": " ", "…": " ",
    "®": " ", "™": " ",            # ® ™ are layout marks, not words
}
# keep letters/digits plus internal ' and - ; drop everything else
_TOKEN = re.compile(r"[0-9a-z]+(?:['-][0-9a-z]+)*")


def _canon(text: str) -> str:
    for k, v in _SMART.items():
        text = text.replace(k, v)
    text = _LINE_HYPHEN.sub("", text)       # rock-\nsolid -> rocksolid
    return text.lower()


def wordbag(text: str) -> Counter:
    text = _GLYPH.sub(" ", text)
    text = _canon(text)
    return Counter(_TOKEN.findall(text))


def wordbag_from_markdown(md: str) -> Counter:
    md = _COMMENT.sub(" ", md)
    md = _SCC_LINK.sub(r"\1", md)
    md = _MD_LINK.sub(r"\1", md)
    md = _MD_PUNCT.sub(" ", md)
    return wordbag(md)
```

- [ ] **Step 4: Install pytest and run tests to verify they pass**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && devbox run -- pip install pytest && devbox run -- python3 -m pytest tests/test_normalize.py -v`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
git add steel-etl/tools/pdf-extract/normalize.py steel-etl/tools/pdf-extract/tests/test_normalize.py
git commit -m "feat: word-multiset normalization for fidelity gate"
```

---

## Phase 2 — Font-aware extraction

### Task 3: Extraction script

**Files:**
- Create: `steel-etl/tools/pdf-extract/extract.py`

- [ ] **Step 1: Write the extraction script**

`steel-etl/tools/pdf-extract/extract.py`:
```python
"""Font-aware, reading-order text extraction for Draw Steel supplement PDFs.

Real-text characters are emitted verbatim. Characters rendered in a custom glyph
font (DrawSteelGlyphs, Wingdings) are emitted as ⟦g:0xNN⟧ / ⟦w:0xNN⟧ placeholders
so they can never masquerade as prose. Reading order sorts text boxes by column
then vertical position to handle the two-column layout.
"""
import argparse
import json
import os
from collections import Counter
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LTTextLine, LTChar

GLYPH_FONTS = ("DrawSteelGlyphs", "Wingdings")


def _is_glyph(fontname: str):
    for g in GLYPH_FONTS:
        if g in fontname:
            return "w" if "Wingding" in fontname else "g"
    return None


def _line_text(line, glyphs_found):
    s = []
    for c in line:
        if not isinstance(c, LTChar):
            s.append(c.get_text())
            continue
        kind = _is_glyph(c.fontname)
        if kind:
            cp = ord(c.get_text()) if len(c.get_text()) == 1 else 0
            tag = f"⟦{kind}:{hex(cp)}⟧"
            s.append(tag)
            glyphs_found[(kind, hex(cp))] += 1
        else:
            s.append(c.get_text())
    return "".join(s)


def _page_text(layout, page_width, glyphs_found):
    """Reading order: split into left/right column by box midpoint, sort by -y."""
    boxes = [el for el in layout if isinstance(el, LTTextContainer)]
    mid = page_width / 2
    left = sorted([b for b in boxes if (b.x0 + b.x1) / 2 < mid], key=lambda b: -b.y1)
    right = sorted([b for b in boxes if (b.x0 + b.x1) / 2 >= mid], key=lambda b: -b.y1)
    lines = []
    for b in left + right:
        for line in b:
            if isinstance(line, LTTextLine):
                t = _line_text(line, glyphs_found).rstrip()
                if t.strip():
                    lines.append(t)
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    pages_dir = os.path.join(args.out, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    glyphs_found = Counter()

    import normalize
    full_bag = Counter()
    for pi, layout in enumerate(extract_pages(args.pdf)):
        text = _page_text(layout, layout.width, glyphs_found)
        with open(os.path.join(pages_dir, f"{pi:03d}.txt"), "w") as f:
            f.write(text)
        full_bag += normalize.wordbag(text)

    with open(os.path.join(args.out, "glyphs-found.json"), "w") as f:
        json.dump(
            sorted([{"kind": k, "cp": cp, "count": n} for (k, cp), n in glyphs_found.items()],
                   key=lambda d: -d["count"]),
            f, indent=2,
        )
    with open(os.path.join(args.out, "wordbag.json"), "w") as f:
        json.dump(dict(full_bag), f, indent=2, ensure_ascii=False)
    print(f"pages: {pi + 1}  distinct glyphs: {len(glyphs_found)}  words: {sum(full_bag.values())}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run extraction on the Summoner PDF**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 extract.py "/home/vexa/Downloads/The Summoner v1.0b/Summoner v1.0b.pdf" --out out/summoner
```
Expected: prints `pages: 62  distinct glyphs: N  words: ~34000` (word count near `pdftotext`'s 33,941). `out/summoner/pages/000.txt`..`061.txt`, `glyphs-found.json`, `wordbag.json` exist.

- [ ] **Step 3: Sanity-check reading order on a content page**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && sed -n '1,40p' out/summoner/pages/006.txt`
Expected: "THE SUMMONER CLASS" / "Basics" content in coherent reading order, glyphs shown as `⟦g:0x..⟧`, no column interleaving.

- [ ] **Step 4: Commit**

```bash
git add steel-etl/tools/pdf-extract/extract.py
git commit -m "feat: font-aware reading-order PDF extraction"
```

---

## Phase 3 — Fidelity gate

### Task 4: Fidelity checker (TDD)

**Files:**
- Create: `steel-etl/tools/pdf-extract/fidelity_check.py`
- Test: `steel-etl/tools/pdf-extract/tests/test_fidelity_check.py`

- [ ] **Step 1: Write the failing tests**

`steel-etl/tools/pdf-extract/tests/test_fidelity_check.py`:
```python
from collections import Counter
import fidelity_check as fc


def _bag(d):
    return Counter(d)


def test_passes_when_words_match():
    md = "**Effect:** the foe is taunted"
    pub = _bag({"effect": 1, "the": 1, "foe": 1, "is": 1, "taunted": 1})
    result = fc.compare(md, pub)
    assert result.ok
    assert result.missing == Counter()
    assert result.extra == Counter()


def test_flags_dropped_word():
    md = "the foe taunted"          # 'is' dropped vs publisher
    pub = _bag({"the": 1, "foe": 1, "is": 1, "taunted": 1})
    result = fc.compare(md, pub)
    assert not result.ok
    assert result.missing == Counter({"is": 1})


def test_flags_added_or_changed_word():
    md = "the brave foe taunted"    # 'brave' hallucinated; 'is' missing
    pub = _bag({"the": 1, "foe": 1, "is": 1, "taunted": 1})
    result = fc.compare(md, pub)
    assert not result.ok
    assert result.extra == Counter({"brave": 1})
    assert result.missing == Counter({"is": 1})


def test_counts_matter_not_just_presence():
    md = "fire fire fire"           # publisher had it twice
    pub = _bag({"fire": 2})
    result = fc.compare(md, pub)
    assert not result.ok
    assert result.extra == Counter({"fire": 1})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && devbox run -- python3 -m pytest tests/test_fidelity_check.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'fidelity_check'`.

- [ ] **Step 3: Write the implementation**

`steel-etl/tools/pdf-extract/fidelity_check.py`:
```python
"""Fidelity gate: prove the annotated markdown contains exactly the publisher's
words. Order-insensitive (multiset) but count-exact, so any added, dropped, or
altered word is reported. Exit 0 = clean, 1 = mismatch.
"""
import argparse
import json
import sys
from collections import Counter
from dataclasses import dataclass

import normalize


@dataclass
class Result:
    ok: bool
    missing: Counter   # in publisher, not in markdown (dropped/changed)
    extra: Counter     # in markdown, not in publisher (added/hallucinated/changed)


def compare(markdown_text: str, publisher_bag: Counter) -> Result:
    md_bag = normalize.wordbag_from_markdown(markdown_text)
    missing = publisher_bag - md_bag
    extra = md_bag - publisher_bag
    return Result(ok=(not missing and not extra), missing=missing, extra=extra)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markdown", required=True, help="annotated .md file")
    ap.add_argument("--wordbag", required=True, help="publisher wordbag.json")
    args = ap.parse_args()

    with open(args.markdown) as f:
        md = f.read()
    with open(args.wordbag) as f:
        pub = Counter(json.load(f))

    r = compare(md, pub)
    if r.ok:
        print("FIDELITY OK — every publisher word present and unchanged.")
        sys.exit(0)
    if r.missing:
        print(f"MISSING ({sum(r.missing.values())} word-instances dropped or altered):")
        for w, n in r.missing.most_common(200):
            print(f"  -{n:>4}  {w}")
    if r.extra:
        print(f"EXTRA ({sum(r.extra.values())} word-instances added or altered):")
        for w, n in r.extra.most_common(200):
            print(f"  +{n:>4}  {w}")
    sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && devbox run -- python3 -m pytest tests/ -v`
Expected: PASS (all normalize + fidelity tests).

- [ ] **Step 5: Commit**

```bash
git add steel-etl/tools/pdf-extract/fidelity_check.py steel-etl/tools/pdf-extract/tests/test_fidelity_check.py
git commit -m "feat: fidelity gate — count-exact word-multiset diff"
```

---

## Phase 4 — Glyph map

### Task 5: Enumerate the distinct glyphs

**Files:**
- Read: `steel-etl/tools/pdf-extract/out/summoner/glyphs-found.json`

- [ ] **Step 1: List the distinct glyph codepoints and their frequency**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract && cat out/summoner/glyphs-found.json`
Expected: a JSON array of `{kind, cp, count}` — the complete, bounded set of icon codepoints to map (expected ~10–20 distinct).

- [ ] **Step 2: Dump each glyph's surrounding context to infer meaning**

Write and run this one-off context dumper (does not need committing):
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 - <<'PY'
import glob, re, json
from collections import defaultdict
ctx = defaultdict(list)
for fn in sorted(glob.glob("out/summoner/pages/*.txt")):
    for m in re.finditer(r"(.{0,30})(⟦[gw]:0x[0-9a-f]+⟧)(.{0,30})", open(fn).read()):
        tag = m.group(2)
        if len(ctx[tag]) < 5:
            ctx[tag].append((m.group(1) + "[" + tag + "]" + m.group(3)).replace("\n", " "))
for tag, samples in sorted(ctx.items()):
    print(tag)
    for s in samples:
        print("   ", s)
PY
```
Expected: for each glyph, up to 5 in-context snippets (e.g. `[⟦g:0xe1⟧] Three creatures` → tier ≤11; `Magic, Ranged [⟦g:0x..⟧] 3 burst` → distance icon; `Maneuver [⟦g:0x..⟧] All Allies` → target icon).

### Task 6: Build and verify the glyph map

**Files:**
- Create: `steel-etl/tools/pdf-extract/glyphs.json`

- [ ] **Step 1: Cross-check ambiguous glyphs against the rendered page**

For any glyph whose meaning is not obvious from context, open the page image to read the icon visually. Run (renders the page that uses it; pick the page from the context dump):
Run: `devbox run -- python3 -c "import sys" ` then use the **Read tool** on the PDF at the relevant page (`Read` supports `pages:` for PDFs) to view the icon and confirm its action-type/characteristic meaning. Map against the conventions already used in `steel-etl/input/beastheart/Draw Steel Beastheart.md` (📏 distance, 🎯 target, `≤11`/`12-16`/`17+` tiers, characteristic letters M/A/R/I/P).

- [ ] **Step 2: Write the verified glyph map**

`steel-etl/tools/pdf-extract/glyphs.json` (fill every codepoint from `glyphs-found.json`; seed values below are confirmed, replace `TODO` after Step 1 verification — there must be **no `TODO` left** when this task completes):
```json
{
  "_doc": "DrawSteelGlyphs/Wingdings codepoint -> semantic token used during structuring. Power-roll tiers and distance/target icons confirmed 2026-06-09.",
  "g:0xe1": "≤11",
  "g:0xe9": "12-16",
  "g:0xed": "17+",
  "g:0x50": "📏",
  "g:0x52": "🎯"
}
```
> Note: `g:0x50`/`g:0x52` (`P`/`R` codepoints = distance/target markers) are the seed guess from the `📏 distance` / `🎯 target` row positions; **confirm visually in Step 1** before finalizing. Add an entry for every codepoint present in `glyphs-found.json` (characteristic icons, potency, surge/essence symbols, Wingdings bullets).

- [ ] **Step 3: Verify the map is complete (no unmapped glyph remains)**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 - <<'PY'
import json
found = {f"{g['kind']}:{g['cp']}" for g in json.load(open("out/summoner/glyphs-found.json"))}
mapped = {k for k in json.load(open("glyphs.json")) if not k.startswith("_")}
unmapped = found - mapped
print("UNMAPPED:", sorted(unmapped) or "none")
assert not unmapped, "every glyph codepoint must be mapped"
print("glyph map complete")
PY
```
Expected: `UNMAPPED: none` / `glyph map complete`.

- [ ] **Step 4: Commit**

```bash
git add steel-etl/tools/pdf-extract/glyphs.json
git commit -m "feat: verified DrawSteelGlyphs->semantic-token map for Summoner"
```

---

## Phase 5 — Vertical slice (de-risk format + wiring before bulk)

Convert the **smallest meaningful end-to-end slice** — the fiction chapter (pages 4–5) plus the class "Basics" + the first signature ability with a power-roll stat block (from pages 6–8) — all the way onto the site, before bulk-converting. This locks the target format, the glyph rendering, the normalization calibration, and the new-book wiring.

### Task 7: Frontmatter + fiction chapter (slice part 1)

**Files:**
- Create: `steel-etl/input/summoner/Draw Steel Summoner.md`

- [ ] **Step 1: Read the source pages**

Read `steel-etl/tools/pdf-extract/out/summoner/pages/004.txt` and `005.txt`. Cross-reference structure with the **Read tool on the PDF pages 4–5** (for column order / headings only — words come from the .txt). Identify chapter title and the *On Summoning* section.

- [ ] **Step 2: Write frontmatter + fiction, following the beastheart pattern**

Begin `steel-etl/input/summoner/Draw Steel Summoner.md`. Use `steel-etl/input/beastheart/Draw Steel Beastheart.md` lines 1–6 as the exact frontmatter shape and its chapter annotation as the pattern:
```markdown
---
book: mcdm.summoner.v1
source: MCDM
title: Draw Steel Summoner
---

<!-- @type: chapter | @id: the-summoner -->
# The Summoner

<!-- @type: feature | @id: on-summoning -->
## On Summoning

<paste the prose from pages/004.txt–005.txt verbatim, fixing only column order
and re-flowing paragraphs; replace any ⟦g:...⟧ with its glyphs.json token;
do NOT reword anything>
```
**Rule:** every word in the body must come from the `.txt` extraction. You may reorder (column de-interleave), re-paragraph, and add annotation comments/markdown. You may not paraphrase, summarize, or "clean up" wording.

- [ ] **Step 3: Build a slice-only wordbag and gate it**

Build a wordbag covering only pages 4–5 and check the file so far:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 - <<'PY'
import json, glob
from collections import Counter
import normalize
bag = Counter()
for p in ["004", "005"]:
    bag += normalize.wordbag(open(f"out/summoner/pages/{p}.txt").read())
json.dump(dict(bag), open("out/summoner/wordbag-slice.json", "w"), ensure_ascii=False)
print("slice words:", sum(bag.values()))
PY
devbox run -- python3 fidelity_check.py --markdown "../../input/summoner/Draw Steel Summoner.md" --wordbag out/summoner/wordbag-slice.json
```
Expected: First run likely reports a handful of MISSING/EXTRA — **this is the normalization calibration step.** Inspect each: if it's a real wording error, fix the markdown; if it's a normalization artifact (a ligature, an unusual dash, a glyph token leaking through, the credits/copyright symbol), fix `normalize.py` and re-run its unit tests. Iterate until `FIDELITY OK`.

- [ ] **Step 4: Commit (slice part 1 + any normalization fixes)**

```bash
git add "steel-etl/input/summoner/Draw Steel Summoner.md" steel-etl/tools/pdf-extract/normalize.py steel-etl/tools/pdf-extract/tests/test_normalize.py
git commit -m "feat(summoner): fiction chapter + normalization calibration"
```

### Task 8: Class basics + first signature ability with stat block (slice part 2)

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md`

- [ ] **Step 1: Read source pages 6–8**

Read `out/summoner/pages/006.txt`, `007.txt`, `008.txt`. Use the Read tool on PDF pages 6–8 to confirm the class basics layout and the first signature ability's stat-block (action type, distance, target, power-roll tiers).

- [ ] **Step 2: Append the class + an ability stat block, matching beastheart's exact table form**

Use `steel-etl/input/beastheart/Draw Steel Beastheart.md` lines 269–272 (class annotation) and 363–375 (ability with the two-row keyword/action + 📏/🎯 table and `**Power Roll + X:**` `- **≤11:**` list) as the literal templates. Append to the file:
```markdown
<!-- @type: class | @id: summoner -->
## Summoner

<class intro prose, verbatim from pages/006.txt>

<!-- @type: feature | @id: ... -->
### Basics

<basics prose verbatim>

<!-- @type: ability | @subtype: signature | @id: <kebab-name> -->
##### <Ability Name>

*<flavor line verbatim>*

| **<Keywords>** | **<Action type>** |
|---|---:|
| **📏 <distance>** | **🎯 <target>** |

**Power Roll + <Characteristic>:**

- **≤11:** <tier-1 effect verbatim>
- **12-16:** <tier-2 effect verbatim>
- **17+:** <tier-3 effect verbatim>

**Effect:** <effect text verbatim>
```
Render `⟦g:0xe1/0xe9/0xed⟧` as the `≤11`/`12-16`/`17+` list labels and `📏`/`🎯` from `glyphs.json`.

- [ ] **Step 3: Gate the slice (pages 4–8)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 - <<'PY'
import json
from collections import Counter
import normalize
bag = Counter()
for p in ["004","005","006","007","008"]:
    bag += normalize.wordbag(open(f"out/summoner/pages/{p}.txt").read())
json.dump(dict(bag), open("out/summoner/wordbag-slice.json","w"), ensure_ascii=False)
PY
devbox run -- python3 fidelity_check.py --markdown "../../input/summoner/Draw Steel Summoner.md" --wordbag out/summoner/wordbag-slice.json
```
Expected: `FIDELITY OK`. (Power-roll tier tokens `≤11` etc. are glyph-sourced, not publisher words, so they don't appear in the bag; effect prose does and must match.)

- [ ] **Step 4: Commit**

```bash
git add "steel-etl/input/summoner/Draw Steel Summoner.md"
git commit -m "feat(summoner): class basics + first signature ability (slice)"
```

### Task 9: Register the book and run the slice through gen + site

**Files:**
- Modify: `steel-etl/pipeline.yaml:books`
- Modify: `v2/site.yaml` (`source_dirs` + `books`)

- [ ] **Step 1: Add the book to pipeline.yaml**

In `steel-etl/pipeline.yaml`, append under `books:` (after the beastheart entry):
```yaml
  - book: mcdm.summoner.v1
    input: ./input/summoner/Draw Steel Summoner.md
    output:
      base_dir: ../data/data-summoner
```

- [ ] **Step 2: Generate just the summoner book**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.summoner.v1`
Expected: success; `data/data-summoner/en/md-linked/` populated. (Recall the multi-book gotcha: a bare `gen` would only do the primary heroes book.)

- [ ] **Step 3: Validate annotation coverage and SCC**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl validate --config pipeline.yaml --book mcdm.summoner.v1`
Expected: no unknown `@type`s, full annotation coverage on the slice, SCC codes minted for `mcdm.summoner.v1/...`. (If the validate flag surface differs, run `devbox run -- go run ./cmd/steel-etl validate --help` and use the book-scoped form.)

- [ ] **Step 4: Wire the site source + book card**

In `v2/site.yaml`, add to `source_dirs:`:
```yaml
  - ../data/data-summoner/en/md-linked
```
and add to `books:` (pick an `icon` that EXISTS in `iconPaths` — see `steel-etl/internal/site/cards.go`; if unsure use `sword-cross` like heroes):
```yaml
  - key: mcdm.summoner.v1
    folder: summoner
    label: Summoner
    order: 3
    icon: account-group
    description: The summoner class — call forth minions, signature creatures, and dominion fixtures to fight at your side.
```
(Bump `order` of monsters/bestiary if needed so ordering stays intentional.)

- [ ] **Step 5: Build the site and spot-check the slice**

Run: `cd /home/vexa/code/steel_compendium/workspace/v2 && devbox run -- mkdocs build`
Expected: clean build. Then spot-check the generated ability page renders the stat-block table and power-roll tiers, and the SCC permalink resolves. (Use the Brave-based Playwright path from memory if a live check is wanted; otherwise inspect `v2/site/` output HTML for the ability.)

- [ ] **Step 6: Commit the wiring**

```bash
git add steel-etl/pipeline.yaml v2/site.yaml
git commit -m "feat(summoner): register mcdm.summoner.v1 book + site wiring"
```

---

## Phase 6 — Bulk conversion (repeat the gated recipe per chunk)

For each remaining chunk B–I from the structure table, follow this **exact recipe** (the slice proved it):

1. Read the chunk's `out/summoner/pages/NNN.txt` files; use the Read tool on the same PDF pages for column order / heading levels / glyph confirmation only.
2. Append annotated markdown to `steel-etl/input/summoner/Draw Steel Summoner.md`, matching the beastheart templates for each construct (`@type: class`/`feature`/`feature-group`/`ability`/`perk`/`treasure`/`treasure-group`/`title`). Words verbatim from the `.txt`; only reorder, re-paragraph, annotate, render glyphs via `glyphs.json`.
3. Build a cumulative wordbag for all pages converted so far and run the gate; iterate to `FIDELITY OK`.
4. Commit the chunk.

The cumulative-gate helper (run from `steel-etl/tools/pdf-extract`, edit the page list per chunk):
```bash
devbox run -- python3 - <<'PY'
import json
from collections import Counter
import normalize
PAGES = [f"{i:03d}" for i in range(4, 31)]   # <-- update upper bound per chunk
bag = Counter()
for p in PAGES:
    bag += normalize.wordbag(open(f"out/summoner/pages/{p}.txt").read())
json.dump(dict(bag), open("out/summoner/wordbag-cumulative.json","w"), ensure_ascii=False)
print("cumulative words:", sum(bag.values()))
PY
devbox run -- python3 fidelity_check.py --markdown "../../input/summoner/Draw Steel Summoner.md" --wordbag out/summoner/wordbag-cumulative.json
```

### Task 10: Chunk B — Class basics remainder + all 1st-Level Features (pages 9–24)

- [ ] **Step 1:** Convert pages 9–24 per the recipe (this is the largest chunk — 1st-level features, signature minions, essence abilities; expect many `@type: ability` blocks).
- [ ] **Step 2:** Run the cumulative gate with `range(4, 25)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): class basics + 1st-level features"`

### Task 11: Chunk C — 2nd-Level Features (pages 25–30)

- [ ] **Step 1:** Convert pages 25–30 per the recipe.
- [ ] **Step 2:** Run the cumulative gate with `range(4, 31)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): 2nd-level features"`

### Task 12: Chunk D — 3rd–5th-Level Features (pages 31–37)

- [ ] **Step 1:** Convert pages 31–37 per the recipe.
- [ ] **Step 2:** Run the cumulative gate with `range(4, 38)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): 3rd-5th-level features"`

### Task 13: Chunk E — 6th–8th-Level Features (pages 38–43)

- [ ] **Step 1:** Convert pages 38–43 per the recipe.
- [ ] **Step 2:** Run the cumulative gate with `range(4, 44)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): 6th-8th-level features"`

### Task 14: Chunk F — 9th–10th-Level Features (pages 44–45)

- [ ] **Step 1:** Convert pages 44–45 per the recipe.
- [ ] **Step 2:** Run the cumulative gate with `range(4, 46)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): 9th-10th-level features"`

### Task 15: Chunk G — Rewards: Trinkets, Leveled Treasures, Titles (pages 46–50)

- [ ] **Step 1:** Convert pages 46–50. Use beastheart's `@type: treasure`/`treasure-group` and the heroes book's title constructs as templates; check the SCC docs for the `treasure/<tier>/<category>/<item>` hierarchy and title echelon grouping noted in workspace `CLAUDE.md`.
- [ ] **Step 2:** Run the cumulative gate with `range(4, 51)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): rewards (trinkets, treasures, titles)"`

### Task 16: Chunk H — Other Summoners: Retainer + Rival (pages 51–56)

- [ ] **Step 1:** Convert pages 51–56. These are NPC/statblock-flavored; check beastheart/monsters statblock annotation (`retainer` type already exists per workspace `CLAUDE.md`).
- [ ] **Step 2:** Run the cumulative gate with `range(4, 57)`. Expected: `FIDELITY OK`.
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): other summoners (retainer, rival)"`

### Task 17: Chunk I — Summoner Advice: For Players + For Directors (pages 57–60)

- [ ] **Step 1:** Convert pages 57–60 (prose `@type: feature` sections under an advice chapter).
- [ ] **Step 2:** Run the FULL-book gate with `range(4, 61)` (skip front matter 0–3 and license 61). Expected: `FIDELITY OK` — **this is the whole-book proof.**
- [ ] **Step 3:** Commit: `git commit -m "feat(summoner): summoner advice (players, directors)"`

---

## Phase 7 — Whole-book integration, validation, deploy

### Task 18: Full-book fidelity proof + validate

**Files:** none (verification only)

- [ ] **Step 1: Regenerate the canonical full-book wordbag (pages 4–60)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl/tools/pdf-extract
devbox run -- python3 - <<'PY'
import json
from collections import Counter
import normalize
bag = Counter()
for i in range(4, 61):           # content pages only; 0-3 frontmatter, 61 license skipped
    bag += normalize.wordbag(open(f"out/summoner/pages/{i:03d}.txt").read())
json.dump(dict(bag), open("out/summoner/wordbag.json","w"), ensure_ascii=False)
print("book words:", sum(bag.values()))
PY
devbox run -- python3 fidelity_check.py --markdown "../../input/summoner/Draw Steel Summoner.md" --wordbag out/summoner/wordbag.json
```
Expected: `FIDELITY OK — every publisher word present and unchanged.`

- [ ] **Step 2: Generate + validate the full book**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.summoner.v1
devbox run -- go run ./cmd/steel-etl validate --config pipeline.yaml --book mcdm.summoner.v1
```
Expected: gen success; validate reports full annotation coverage, no unknown types, SCC stability for `mcdm.summoner.v1`.

- [ ] **Step 3: Run the steel-etl Go test suite (no regressions to existing books)**

Run: `cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./...`
Expected: PASS.

### Task 19: Docs + memory

**Files:**
- Modify: `CLAUDE.md` (workspace) — registry/book note
- Modify: `ARCHITECTURE.md` — note the new book + the pdf-extract tool, if it changes the data-flow diagram
- Create: memory file for the conversion approach

- [ ] **Step 1: Update workspace CLAUDE.md**

Add `mcdm.summoner.v1` to the books listed in the SCC/Registry paragraph and the Layout `data/` note (alongside data-rules/data-unified/data-bestiary/data-beastheart). Note that supplement PDFs are now converted via the fidelity-gated `steel-etl/tools/pdf-extract` tool (deterministic words + AI structure + word-multiset gate), replacing marker-pdf.

- [ ] **Step 2: Update ARCHITECTURE.md**

Add a short note (and a box in the diagram if appropriate) that new supplement books enter via `steel-etl/tools/pdf-extract` → annotated `input/<book>/*.md`, gated by `fidelity_check.py`, before the normal `gen` flow.

- [ ] **Step 3: Save a memory of the conversion approach**

Create `/home/vexa/.claude/projects/-home-vexa-code-steel-compendium-workspace/memory/project_pdf_conversion_pipeline.md` (type: project) describing: deterministic font-aware pdfminer extraction is the source of truth for words; DrawSteelGlyphs encodes icons as ASCII so extraction must be font-aware; AI only structures/annotates; `fidelity_check.py` word-multiset gate proves zero word changes; pymupdf unusable in devbox (libstdc++), use pdfminer.six. Add the index line to `MEMORY.md`.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md ARCHITECTURE.md
git commit -m "docs: register summoner book + fidelity-gated pdf-extract pipeline"
```

### Task 20: Deploy

**Files:** none (deploy)

- [ ] **Step 1: Full deploy (gen --all + API + site)**

Run: `cd /home/vexa/code/steel_compendium/workspace && devbox run -- just deploy`
Expected: `gen --all` regenerates every book (heroes + beastheart + monsters + summoner), commits the SCC API to the org repo, builds + commits the v2 site. No dirty timestamp-only diffs (the `deploy` recipe inlines a single shared gen).

- [ ] **Step 2: Live spot-check**

Verify on the deployed site: the Summoner book card appears in the Books/Read tabs; a signature ability page renders its stat-block + power-roll tiers; an `/scc/mcdm.summoner.v1/...` permalink resolves. (Use the Brave Playwright path from memory for the live check.)

- [ ] **Step 3: Confirm the PDF was never committed**

Run: `cd /home/vexa/code/steel_compendium/workspace && git log --all --oneline -- '*.pdf' | head && git ls-files | grep -i '\.pdf$' || echo "no PDFs tracked — good"`
Expected: no Summoner PDF tracked anywhere.

---

## Self-Review (completed during authoring)

- **Spec coverage:** every chapter in the document structure table maps to a task (fiction→T7, class/levels→T8/T10–14, rewards→T15, other summoners→T16, advice→T17; front matter + license intentionally skipped). Tooling (extraction, glyph map, fidelity gate), wiring (pipeline.yaml, site.yaml), validation, docs, deploy all have tasks. The core requirement — *provable* word-fidelity — is enforced by the gate at every chunk and proven whole-book in T18.
- **Placeholder scan:** the only `TODO` token is in `glyphs.json` and Task 6 Step 2 explicitly requires it be eliminated before the task completes; the gate complete-coverage check (T6S3) enforces it. Content tasks intentionally do not embed 57 pages of hand-converted prose (that is the work product, not plannable text) — instead each provides the exact repeatable recipe + the exact gate command and expected output, with T7/T8 fully worked as the template.
- **Type/name consistency:** `wordbag`/`wordbag_from_markdown`/`compare`/`Result(ok,missing,extra)` are defined in Tasks 2 & 4 and used consistently in T7–T18; `⟦g:0xNN⟧` placeholder format is identical in `extract.py`, `normalize.py` (`_GLYPH`), and the context dumper; book id `mcdm.summoner.v1` and dir `data-summoner` are consistent across pipeline.yaml, site.yaml, gen/validate, and deploy.

---

## Residual risks (honest)

- **Glyph map correctness** is the one place human/vision judgment enters; a wrong map mislabels an action type or tier (not a prose word). Mitigation: T5 context dump + T6 visual confirmation against the rendered page and beastheart conventions; tiers `á/é/í` already confirmed.
- **Normalization false positives/negatives:** the gate is calibrated on the slice (T7S3). A pathological case — e.g. the publisher legitimately hyphenating a compound that the AI joins — is surfaced as a diff and reviewed, not silently passed. The gate is count-exact, so it cannot hide a dropped word, only (at worst) flag a benign formatting difference for human judgment.
- **Reading order** quirks (sidebars, pull quotes) are tolerated by the order-insensitive multiset for *completeness*; the AI fixes human-facing order using the page images. Order errors can never become word errors.
```