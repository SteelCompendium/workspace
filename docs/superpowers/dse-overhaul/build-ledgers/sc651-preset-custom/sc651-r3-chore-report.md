SC-651 r3 chore report

- Superproject commits (local, NOT pushed): aacf5adb (CHANGELOG, amended), 913984ab (pointer bump to draw-steel-elements 031f6ca0).
- They sit on f7c064b0 (origin/main at rebase time). Expected base was c63ec316; I rebased onto f7c064b0.
- origin/main has since moved to 63843336 ("docs: sc646 ledger Done entry"). Not rebased again; the branch is one commit behind it.
- Rebase conflict in CHANGELOG.md resolved by keeping both bullets under ## Unreleased, SC-651 first. SC-651 body replaced with the brief's 4-line target text.
- ls-tree: 160000 commit 031f6ca03df2d0867f164dc484e69dbd0e48b73b	draw-steel-elements
- Submodule draw-steel-elements: HEAD 031f6ca0, git status --porcelain empty.
- Superproject git status --porcelain: empty.
- git log origin/main..HEAD: 913984ab, aacf5adb.
- git show --stat HEAD: touches only draw-steel-elements (1 insertion, 1 deletion).

git show HEAD~1 -- CHANGELOG.md:
commit aacf5adb77589a40ba3f26ba326aa994780f9b42
Author: Scott Tomaszewski <scottTomaszewski@gmail.com>
Date:   Sun Nov 15 01:20:14 2026 -0500

    docs(changelog): SC-651 Preset dropdown refuses a Custom pick

diff --git a/CHANGELOG.md b/CHANGELOG.md
index 3a102e39..3f4260d4 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -8,6 +8,12 @@ go under an *Internal* sub-heading.
 
 ## Unreleased
 
+- **DSE plugin: in the plugin settings, picking Custom in the statblock Preset dropdown no longer leaves it reading Custom when nothing changed (SC-651).**
+  The dropdown only reads Custom when your statblock options match none of Steel card, Sourcebook or Index card:
+  Custom is not a preset you can apply. Picking it used to leave the dropdown on Custom until you opened another
+  settings page and came back, when it read Steel card again. The dropdown now goes straight back to the preset your
+  options match (or stays on Custom when they match none), and nothing is saved.
+
 - **DSE plugin: a failed compendium Sync no longer leaves an "Uncaught (in promise)" error in the developer console (SC-646).**
   When Sync failed (for example, the GitHub release lookup answered 404), you saw the "compendium sync failed" Notice, and the
   console also got an unhandled `Uncaught (in promise) Error: GitHub release lookup failed (HTTP 404)`. That no longer
   happens, whether Sync was started from the settings tab, the "Sync compendium" command, or the compendium search
   window's Sync button. The failure Notice and its one console line are unchanged.
