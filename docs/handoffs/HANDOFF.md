# Handoff — 2026-05-31

## Active efforts

- **Retire the SCC address-bar rewrite** — ✅ COMPLETE & MERGED to `main` in all
  three repos (workspace, steel-etl, v2). No in-flight work. Design recorded in
  v2 ADR `v2/.repo-docs/decisions/2026-05-31-retire-scc-address-bar-rewrite.md`
  (supersedes `2026-05-23-scc-permalink-system.md`).
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — NOT touched this session. See each
  plan's own doc under `plans/` for status; this handoff makes no claim about them.

## You are here

**Nothing is in flight.** The SCC search-404 bug is fixed and merged.

If you are continuing: the only thing not empirically captured this session is a
**live-browser screenshot** of (a) in-page search working on a directly-loaded
former-SCC page and (b) the "🔗 Copy permalink" button. Both were verified
*deterministically* instead (see Gotchas). A nice-to-have next action is a manual
eyeball on the running site — not required for correctness.

## What landed (one line each)

- **steel-etl** `317e6e6` — dropped `scc-manifest.js` generation (`internal/site/permalinks.go`); redirect-stub generation unchanged.
- **v2** `7949b4a` — deleted `scc-permalink.js` + `scc-manifest.js` and the inline `replaceState`/`<base>` rewrite; self-canonical on the friendly page; new `docs/javascripts/scc-permalink-copy.js` (Copy-permalink button); `.repo-docs` updated.
- **workspace** `bbdd7c7` — removed the resolved `FOLLOWUPS.md` entry; bumped the steel-etl gitlink to `317e6e6`.

## Verified state (as of 2026-05-31)

- **Branches:** all three repos on `main`, clean (ignoring gitignored `site/` build output), in sync with `origin/main`. Feature branch `retire-scc-address-bar-rewrite` also exists at the same SHAs in each repo.
- **Gitlink consistency:** workspace gitlink for `steel-etl` = `317e6e6` = steel-etl `main` HEAD. ✅
- **steel-etl build/tests:** `go build ./...` clean; `go test ./internal/site/...` → `ok` (includes `TestGenerateSCCStubs_DoesNotWriteManifest`, the regression guard).
- **v2 build:** `mkdocs build` was green earlier this session; built `site/Browse/class/censor/index.html` confirmed: self-canonical (friendly), `scc-permalink` meta kept, no `replaceState`, neither retired script referenced, `scc-permalink-copy.js` wired, SCC stub still redirects. (Re-run the command below to re-confirm.)
- **Running process:** a `mkdocs serve` was running on `127.0.0.1:8123` (serves under the **`/v2/`** path prefix — i.e. `http://127.0.0.1:8123/v2/Browse/...`, not `/Browse/...`). May or may not still be up.

## Gotchas & lessons (cross-cutting / environment)

- **Root cause of the original bug (durable — full writeup in the 2026-05-31 ADR):**
  mkdocs-material resolves runtime fetch URLs as `new URL(config.base, location.href)`
  — against the **address bar**, NOT `document.baseURI`/`<base>`. Any client code
  that makes `location` disagree with the built path will break search/sitemap
  fetches. Don't reintroduce address-bar rewriting.
- **Browser automation is painful in this env** (only relevant if doing live UI checks):
  - Playwright MCP → "chrome executable not found".
  - Chromium binary exists at `~/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`.
  - `node` here is **v18** (no global `WebSocket`), and there's no `ws` package → CDP-over-WebSocket is out. (A prior note claimed devbox node v24; not true in this shell.)
  - `chrome --headless --dump-dom --virtual-time-budget` **hangs** on the heavy ~1 MB content pages (analytics/network never settles); it only completed on the small 404 page. Concurrent chrome instances also collide on the user-data-dir.
  - What worked instead: (1) executed the real `scc-permalink-copy.js` against a hand-rolled DOM stub in node to verify button inject/aria/label/click-copies/idempotency; (2) reproduced Material's `new URL(config.base, location.href)` resolution in node to show the friendly location → `/v2/search/search_index.json` (root) vs the old rewritten location → `/v2/scc/search/...` (the 404).
- **Merge/gitlink ordering:** the workspace gitlink points at a steel-etl commit
  SHA. It is **empirically verified equal** to steel-etl `main` HEAD right now
  (`317e6e6` = `317e6e6`; see Verified state + verification command #2) — so they
  ARE consistent as of this handoff, *regardless* of how the merge was done. The
  caveat is **only for future re-merges**: if steel-etl is squash- or
  rebase-merged later, its `main` SHA will change and you must re-point the
  workspace gitlink (`git add steel-etl` from a workspace where steel-etl is on
  the new `main`) and commit.

## Verification commands

```bash
# from workspace root
cd /home/vexa/code/steel_compendium/workspace

# 1. all three repos clean on main, synced with origin (ignore gitignored site/)
for r in . steel-etl v2; do echo "== $r =="; git -C "$r" status -sb | grep -vE '/site/'; done

# 2. gitlink matches steel-etl main HEAD
git ls-files --stage steel-etl | awk '{print $2}'; git -C steel-etl rev-parse HEAD

# 3. steel-etl builds + the no-manifest regression test passes
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/site/...'

# 4. (slower) v2 site builds; spot-check the censor page
devbox run -- bash -c 'cd /home/vexa/code/steel_compendium/workspace/v2 && mkdocs build'
grep -E 'rel="canonical"|scc-permalink-copy\.js|replaceState' v2/site/Browse/class/censor/index.html
# expect: canonical -> .../Browse/class/censor/ ; copy.js present ; replaceState absent
```
