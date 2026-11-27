# SC-706 r2 — independent adversarial review brief

## 1. Context loading

- Ledger (the spec; rulings D1–D4 binding):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc706-destination-change-overwrites/decisions.md`
- r1 brief and report (read the report's executive summary, then the diff — judge the code, not
  the report's claims):
  `.../sc706-destination-change-overwrites/sc706-brief-r1-implementer.md`,
  `.../sc706-destination-change-overwrites/sc706-r1-implementer-report.md`
- SC-441's notes on the K12 marker and its mutants (`sc706partial`, `sc706full`, `sc706full2`):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc441-e2e-sync-migration-modals/sc441-r5-rereview-report.md` §2.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites`,
  plugin `<worktree>/draw-steel-elements`, branch `sc706-destination-change-overwrites`, base dse
  develop `e783b068`. Review head: `6961239e` (superproject `0e32b647`, CHANGELOG only). Diff: `git -C <plugin dir> diff e783b068..HEAD`.
  `git -C <plugin dir> fetch origin`; if `origin/develop` moved past `e783b068`, note it (do not
  rebase — this is review).
- You do not commit to the branch. Probes (mutants, temporary scenarios) go in a scratch copy or
  are reverted with `git -C <plugin dir> stash`/`checkout -- <file>` of files YOU changed; leave
  the branch exactly at the review head and say so.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- **You never call the tracker (Linear).**

## 2. The task

Adversarial review of the SC-706 fix. **Execute and probe, do not just read.** The ticket's
expected behaviour, quoted: "a Sync into a changed Destination never overwrites a file the plugin
did not install there, and asks first if the folder already holds files."

Rulings D1–D4 in the ledger are the spec — quote them, don't restate them from memory.

This code writes into user files, so integrity probes are mandatory:
1. Content of user notes in the new Destination survives every path (window shown → "Keep
   everything"; window shown → dismissed / Escape; empty new folder; absent new folder).
2. Same-root re-sync still updates plugin-installed files in place (no regression; SC-694's
   behaviour is out of scope and stays as is).
3. A hand-edited managed file under the OLD root after a Destination change: what happens? (Phase 2
   keeps modified files — confirm unchanged.)
4. Root-string edge cases: trailing slash, leading `./` or `/`, case differences on a
   case-insensitive FS assumption, a new root that is a subfolder of the old root or vice versa
   (`DS Compendium` → `DS Compendium/sub`, `Notes/DS Compendium` ↔ `Notes`), Destination changed
   back to the original after an intermediate sync.
5. Migration interaction: a manifest with a different root AND a new folder with ≥20 legacy paths
   → migration offer (as a first sync would); `migrationPending` with changed root.
6. The window's callback re-checks `latest.root !== options.root` — still correct with the new
   routing? Busy-lock ordering unchanged?
7. Mutation testing: revert each half of D1 separately and confirm the new jest tests AND e2e K12
   each catch it (`sc706partial`-style: only (a); only (b)). A test suite that stays green under a
   mutant is a finding.

Re-run the gates yourself (do not trust r1's numbers): tsc (incl. e2e), lint, jest, the full e2e
run, and the e2e `--element=sync` run. Lifecycle: run at least the part(s) that cover sync if the
skill maps one; otherwise report the r1 number as unverified. Confirm `styles.css` is byte-
identical to a clean `e783b068` build.

Out of scope (per D3) — don't report as findings unless the fix made them worse: SC-694, SC-695,
SC-698, SC-702, SC-653's window wording/buttons, the old folder's orphaned files.

## 3. Gates

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery table and
"Current expected numbers". Baseline at `e783b068`: jest 14991 passed / 1 skipped (shots cache) ·
lifecycle 64/64 · e2e `929/950 ok, 0 failed, 21 known-bug, coverage: 540/540 pairs`. Expected on the
branch: 0 failed, 20 known-bug, coverage Y/Y; r1's reported numbers: tsc/lint clean; jest 15003 passed / 2 skipped fresh (+13); lifecycle 64/64; e2e `932/952 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`; styles.css byte-identical (sha256 50436d6b…37e98). Out of scope, already filed: SC-708 (old folder left behind on a Destination change; A→B→A skip). Do not report it as a finding.

## 4. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites/draw-steel-elements -- bash <script>`.
  Never `cd` inside a compound command; never pipe a gate into `tail`; record exit codes inside a
  script FILE. Run each gate as one blocking foreground call, output to a log; no background jobs
  or monitors.
- `git -C <absolute path>` for every git command.
- Scratch: private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r2-review/`,
  uniquely named scripts and logs, written with the Write tool.
- No `rm` with a shell-variable path, no glob `rm`, never `rm -rf` a shared dir (`.superpowers/`,
  `/tmp/dse-obsidian-*`). Never `pkill`/`killall` by pattern; kill only by PID whose
  `readlink /proc/<pid>/cwd` is inside this worktree.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to a file (600 s
  stream watchdog).
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input → end with
  `STATUS: NEEDS_CONTEXT` + the question. Any message you do send starts with `SC-706:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc706-destination-change-overwrites/sc706-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / FIX REQUIRED, counts by severity,
gate numbers you measured). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a
failure scenario, and a prescribed fix. Mutation table. Absolute paths of every log/probe artifact.

## 6. Return contract

Final text to the ticket-owner, not a human: verdict, severity counts, measured gate lines, report
path, evidence paths. No prose.
