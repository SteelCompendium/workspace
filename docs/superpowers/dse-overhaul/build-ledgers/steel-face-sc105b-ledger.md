# SDD ledger — SC-105 face decision: Option B (SS4 + 400 weight)
Scott picked Option B from the attached swatches (2026-08-02): body prose at true 400 weight,
titles keep 600/700. DELIBERATE visible change (steel-dark/light body strokes thinner) — the
approved swatch IS the visual sign-off. Worktree: steel-face (off main @ dse 2634568).
Expectations: freeze 101/101 HOLDS (Legacy never references SS4; print body is screen-scoped
out); parity 0/10 HOLDS (weight not a measured prop; family unchanged). Steel shots change.
IMPL 9863d35 (font+@font-face+changelog) → review PASS/PASS (1 Low: bundle delta 27KB not 20KB)
→ fix ccf465e → LANDED (dse 2634568..ccf465e, superproject merge ab2be88, pushed). Byte-exact
swatch match (sha256) = acceptance proof. Worktree removed. SC-105 fully complete.
