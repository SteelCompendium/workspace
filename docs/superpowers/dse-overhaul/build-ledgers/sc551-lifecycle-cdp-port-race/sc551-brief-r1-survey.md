# SC-551 r1 survey — do e2e, docs-shots and obsidian-shots have the same CDP/driver port race?

You are the r1 survey reviewer for SC-551 (read + private probes; you change no tracked file). Your final text
goes to the ticket-owner, not a human: raw facts, no prose, plus the absolute path of every artifact.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/decisions.md`
  (owner findings + rulings; you are ruling R3). The lifecycle race itself is being fixed by a separate
  implementer — do NOT survey or change lifecycle.
- Code to read: the plugin at `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (main checkout,
  dse `develop` @ `eafe76e1`, has `node_modules`) — READ ONLY there: never build, run a gate, `npm` anything, or
  write in the main checkout. The fix worktree `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race`
  belongs to the implementer — do not write or run anything there either.
- **Workers never call the tracker (Linear).**
- `e2e/run.mjs` reads as BINARY to the agent shell's grep: use `grep -a`.
- Other sessions (SC-472, SC-540, SC-544) run lifecycle/e2e on this machine now. Never connect to, evaluate in,
  or kill another session's Obsidian, chromedriver, or Xvfb.

## 2. The question

The lifecycle bug (decisions.md "Owner findings"): a port is checked once ("is it free?"), then used seconds
later; another run can take it in between, and the run then talks to the OTHER instance (wrong-instance), not
to a clean error. For each runner below answer:

1. Which ports/endpoints does it use (Obsidian/Chromium `--remote-debugging-port`, chromedriver's own HTTP port,
   any devtools/BiDi port, any HTTP server)? Where is each number chosen — fixed, env, `get-port`-style "find a
   free one" then pass it on, or OS-assigned (`0`) and read back from the process? file:line, including inside
   `node_modules` (wdio-obsidian-service, `@wdio/*`, `webdriverio`, chromedriver launcher, `get-port`, etc.).
2. Is there a check-then-use window? If another process takes the number in that window, what happens:
   **wrong-instance** (talks to someone else's process), or **clean failure** (bind error → run fails/exits)?
   Say which and why, with file:line.
3. Severity for the gate (mass FAIL that looks like a code failure? flaky? harmless?) and a prescribed fix
   (ideally the R1 helper pattern: number reported by OUR process, GUID/PID proof before use).

Runners: **e2e** (`e2e/run.mjs`, `e2e/wdio*.{ts,mjs}`, its shards — 4 shards in one run each get what?),
**docs-shots** (`visual-harness/docs-shots.mjs` — confirm whether it uses a CDP port at all, or Playwright
over a pipe), **obsidian-shots** (`visual-harness/obsidian-camera.mjs`, `DSE_CAMERA_PORT`), and the evidence
scripts `visual-harness/settings-evidence.mjs`, `visual-harness/sc184-evidence.mjs` (one-line verdict each),
plus anything else in the plugin that passes `--remote-debugging-port` or picks a port (grep for it).

## 3. Probes (only if reading cannot settle a point)

Execute and probe rather than guess, but ONLY on private resources: a throwaway copy under your scratch folder
(`git -C /home/scott/code/steelCompendium/workspace/draw-steel-elements worktree add <abs scratch path>/dse eafe76e1`
is fine; `npm ci` there via `devbox run -c <that abs path> -- npm ci`), private Xvfb displays in `:5440–:5479`,
private ports `48000–48999`. E.g. a node TCP listener that grabs the number a launcher just chose, to see
whether the run fails cleanly or attaches elsewhere. Do not run the full e2e battery. Remove your throwaway
worktree at the end with `git -C /home/scott/code/steelCompendium/workspace/draw-steel-elements worktree remove --force <literal abs path>`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-survey-report.md`,
OPENING with a ≤10-line executive summary: one line per runner — `race: yes/no`, `consequence:
wrong-instance / clean-fail / n/a`, `fix: <one line>`. Then the detail with file:line, probe logs under
`.../sc551-lifecycle-cdp-port-race/sc551-r1-survey-evidence/`.

## 5. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — read the process's own output or a per-run
  unique path.
- Redirect long-running output to a file; the 600 s stream watchdog kills silent agents. No background jobs or
  Monitor waits.
- Private scratch folder only:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-survey/`;
  write scratch files with the Write tool, not heredocs.
- `devbox run -c <abs path> -- …`; never `cd X && …` in a compound command; `git -C <abs path>` always.
- Never `pkill`/`killall` by pattern; kill only PIDs you spawned and recorded. No `rm` with a shell-variable
  target, no glob `rm`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, the FIRST WORD must be `SC-551:`.
