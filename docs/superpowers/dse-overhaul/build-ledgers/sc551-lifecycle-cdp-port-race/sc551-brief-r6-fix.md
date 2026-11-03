# SC-551 r6 — small fix round: wrapper launchers (r5 LOW-1) + two-listener test (r5 I-1)

You are the SC-551 implementer. Final text to the ticket-owner: raw facts, final sha, gate lines, absolute paths.
`sc551-brief-r1-impl.md` §1 and §5 still apply, plus: never a glob `rm` anywhere; a run that fails on a missing
vault/udd/kept-FAIL dir is environmental — re-run once and report both.

Inputs: ledger rulings **R16, R17** in `decisions.md`; the r5 report `sc551-r5-rereview-report.md` (LOW-1 and I-1
sections; its wrapper probe is `sc551-r5-evidence/wrapper-*.log` + `scripts/`). Branch head `38b4f856` on develop
`711f740d`. First `git -C <plugin> fetch origin`: if `origin/develop` moved past `711f740d`, rebase onto it and say so
(keep every scenario intact), and use the new tip's numbers from the dse-verify CURRENT block.

## The task — rulings verbatim

> R16 (owner, 2026-11-02) — r5 LOW-1 FOLD: a launcher wrapper that does not `exec` (`DSE_LIFECYCLE_BIN` /
> `DSE_CAMERA_BIN` = a script, `flatpak run`) now always exits 2, a regression vs eafe76e1 that would cost real time on
> another machine. Fix as prescribed: accept a LISTEN inode owned by `child.pid` OR any of its descendants (ppid walk over
> `/proc/*/stat`, injectable seam like `fdLinks`); never a process outside our child's tree (H-1 stays closed: the other
> run's Obsidian is never our descendant). Name the owning pid + command in the `foreign-listener` message. Unit tests: a
> socket owned by a child process passes; a socket owned by a non-descendant still fails.

> R17 — r5 I-1 FOLD (cheap, same test file): a test with two listeners on one port (ours on 127.0.0.1, a stranger's on
> `[::1]`) that kills the `some`→`every` mutant (i.e. any foreign listener on the port fails the proof).

Careful with `/proc/<pid>/stat` parsing: the comm field is in parentheses and may contain spaces/`)` — split on the
LAST `)`. Bound the walk (no infinite loop on a ppid cycle/race).

## Proofs

- The r5 wrapper probe (a non-`exec` shell wrapper as `DSE_LIFECYCLE_BIN` and as `DSE_CAMERA_BIN`): before (r5 logs)
  rc 2; after → passes. Control with `/usr/bin/obsidian` passes.
- H-1 still closed: the r4 two-cameras-same-`DSE_CAMERA_TMP` probe, 3 pairs at 0 ms → loser exit 2, 0 wrong-instance.
- Lifecycle pinned-port pair, 2 tries → one pass + one exit 2.

## Gates (final sha)

tsc (incl. `-p e2e`) + lint clean; jest = `6321 + new tests passed / 2 skipped`, `252 of 253` (fresh); lifecycle
48/48 in FOUR `--only` parts each on its own private port (part 1 `G-S7a … G-S9a` 21, part 2 `G-S9b … G-S40` 16,
part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` 7, part 4 `G-S57 G-S62 G-S61 G-S56` 4); obsidian-shots once
(private display + `DSE_CAMERA_TMP`, no port env) → `all 61 shots written`; `main.js`/`styles.css` sha256 equal to the
`711f740d` build (`1bb51153…` / `93be34af…`). e2e is NOT re-run if nothing under `e2e/` changed and e2e does not
import `scripts/cdp-owned.mjs` (check with `grep -a -rn cdp-owned <plugin>/e2e` and say so); if either is false, run
the full e2e (128/128, 89/89).

## Report

`.../sc551-lifecycle-cdp-port-race/sc551-r6-fix-report.md`, ≤10-line executive summary first; evidence in
`.../sc551-r6-evidence/`. Update the proposal file only if wording changes (e.g. the `*_BIN` note). `Drive-by fixes:`
/ `Follow-ups:` at the end. Tree clean at the end.
