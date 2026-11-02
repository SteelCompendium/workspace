# SC-546 proposed dse-verify text (not applied; SKILL.md untouched)

Step 4 (lifecycle) and 4b (e2e) rows, one sentence each:

- Lifecycle: "Its Xvfb (:160-:199) is started through `scripts/xvfb-owned.mjs` (SC-546): the display is used only after OUR Xvfb reports it is listening (`-displayfd`), so two lifecycle runs started in the same instant never share a display; a lost race moves on to the next number."
- e2e: same sentence for :200-:239; plus: "Probing the race needs no exclusive range: use a temporary, uncommitted private range (:5300-:5339) and a wall-clock barrier before `startXvfb`."
- Footgun line: "`Xvfb -displayfd` skips the `/tmp/.X<n>-lock` file (measured, Xvfb 21.1.24): do not use the lock file as an ownership proof; and a race loser started WITHOUT `-displayfd` can stay alive for at least ~1 s holding no socket (7 of 12 simultaneous cross-process pairs; depends on lock-file timing), so an exit-code check alone does not catch it."

- Mixed-fleet caveat (r3, LOW-1): "Holds once every worktree is on SC-546 or later. Until then, an un-rebased lifecycle or docs-shots run started in the same instant can still land on a new run's display, so rebase before running lifecycle concurrently." (r4 INFO-C/INFO-D wording applied by the owner, 2026-11-02.)
