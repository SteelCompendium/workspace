**Option A is ready to land, including the 2 new frozen print captures you sanctioned.** Nothing else needs you on this ticket.

The branch is rebased on top of SC-235's section-title change. With both changes, the full check battery passes. The heading-ladder print captures are byte-identical across two clean runs, and SC-235 did not move them.

---
Mechanics:
- dse `dfb7395` (10 commits on develop `6dca388`); workspace `e205a42` (on main `fa0fcb7`).
- Gates: jest 4147 passed / 1 skipped, 0 failures; lifecycle 19/19; shots 536, 0 FAIL; freeze 260/260; parity 0 gaps / 0 undeclared / 14 declared (same as develop; SC-318 adds none).
- Sanctioned widening (your comment "Option A is good. Sanctioned"): `perk-headings--steel-print.png` + `perk-headings--steel-realprint.png`, 260 -> 262 at landing.
