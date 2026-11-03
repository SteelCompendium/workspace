# SC-551 r1 survey: do the other runners have the lifecycle CDP port race?

Read at dse `develop` @ `eafe76e1`. I ran private probes only: a throwaway worktree (removed), displays :5447–:5452, ports 48101–48502.
Evidence is in `sc551-r1-survey-evidence/` (logs `p1`–`p6`, `scripts/`, one PNG).

## Executive summary

- **e2e, Obsidian DevTools port**: race no. Consequence n/a. Fix: none. Chromedriver already starts Obsidian with `--remote-debugging-port=0` and reads `DevToolsActivePort` back from the per-session user-data-dir, which is the R1 pattern (P2).
- **e2e, chromedriver's own HTTP port**: race yes, but the window is 14–26 ms and the port is a random odd number in 32769–46879, so it is very unlikely (P3). Consequence: **wrong-instance** when the port is taken on 127.0.0.1. Our chromedriver exits 1, wdio does not notice, and the session runs on the other chromedriver with its Obsidian on the other display (P1, P2). It is a clean failure when the port is taken on ::1 only or only for a moment. Fix: optional Backlog. In `wdio.conf.mts` `before`, check that `wdio:driverPID` is alive and owns the listening socket on `options.port`; otherwise throw `SevereServiceError` (exit 2).
- **obsidian-shots (`obsidian-camera.mjs`)**: race yes. Consequence: **wrong-instance**, and harmful (P4: it evaluated inside the other Obsidian and photographed the other vault; the camera also deletes/creates notes, writes theme/appearance, and calls `app.quit()` on whatever it attached to). Fix: the R1 helper. Default to port 0, read port and GUID back from our process, check the GUID against `/json/version` before any `Cdp.connect`, look up targets only on that port (3 lookup sites), and unlink a stale `DevToolsActivePort` before spawning, because the camera's user-data-dir persists.
- **docs-shots (`docs-shots.mjs`)**: the browser half has no race (Playwright `--remote-debugging-pipe`, no TCP port). Consequence n/a. The Obsidian half is `obsidian-camera.mjs --docs`: race yes, **wrong-instance**, same default port 9223 and same user-data-dir as obsidian-shots. Fix: comes with the camera fix.
- **`settings-evidence.mjs`**: race yes, **wrong-instance** (same code shape, default port 9224, and the poll has no `child.alive` check). Fix: reuse the helper, or leave it (one-off; Backlog).
- **`sc184-evidence.mjs`**: race yes, **wrong-instance** (same code shape, and the same default port 9223 and user-data-dir as the camera). Fix: reuse the helper, or leave it (one-off; Backlog).
- **Every other launcher** (`shoot`, `parity/*`, `shoot-url`, `obsidian-light-island`, `sc191/*`, `sc379/*`, `mocks/*`): race no. They use Playwright `chromium.launch()` over a pipe, and no HTTP server exists in the plugin. Consequence n/a. Fix: none.
- **Related findings (not ports, but hit by the same concurrent runs)**: (1) `DSE_CAMERA_TMP` defaults to one fixed path, so all camera, docs-shots and sc184 runs on the machine share one user-data-dir. A second Obsidian on it exits 0 because of the Chromium process singleton (P6). (2) `DevToolsActivePort` stays on disk after Obsidian exits (P2, P5), so the R1 helper must never trust a file it did not see written after its own spawn.

---

## 1. e2e (`e2e/run.mjs` → `@wdio/cli` → wdio-obsidian-service 3.3.0 → chromedriver → Obsidian 1.14.4)

### Ports and endpoints, and where each number comes from

| Endpoint | Number chosen at | How |
|---|---|---|
| chromedriver HTTP (WebDriver) | `node_modules/@wdio/utils/build/node.js:387` `const port = await getPort();` | `get-port` 7.2.0 with no options: `index.js:86` yields `0`. `:47-59` `checkAvailablePort` listens on port 0, reads the port the OS assigned, **closes**, and returns the number. `:417-418` passes `--port=<n>` to chromedriver. `:481` `waitPort({port})`. `:485` `options.port = port`. |
| Obsidian DevTools (chromedriver ↔ Obsidian) | inside chromedriver | `--remote-debugging-port=0`. Chromedriver reads `<user-data-dir>/DevToolsActivePort`. Seen on a live e2e Obsidian's cmdline (passive `/proc` read) and in P2: `OUR udd DevToolsActivePort: "42975\n/devtools/browser/ccdb41f9-…"`. |
| user-data-dir | `node_modules/wdio-obsidian-service/dist/index.js:3011-3021` | `--user-data-dir=<configDir>` from `obsidianLauncher.setupConfigDir`, a fresh tmp dir under the run's own `TMPDIR` (`/tmp/dse-e2e-<runId>/obsidian-launcher-config-XXXX`). |
| BiDi / websocket | none | `wdio-obsidian-service/dist/index.js:2946` sets `wdio:enforceWebDriverClassic = true`, so no BiDi websocket is opened. `e2e/driver/recorders.ts:84` CDP goes through `browser.sendCommandAndGetResult`, i.e. chromedriver's `goog/cdp/execute` over the same WebDriver HTTP connection, not a direct DevTools port. |
| anything else | none | `e2e/wdio.conf.mts` sets no port. wdio-obsidian-service sets no debugging flag (`:2932-2946`: only `--no-sandbox`, and `--ozone-platform=x11` on Wayland). `allowedIps: []`, so no `--allowed-ips` flag is passed and chromedriver binds localhost only. No spec calls `reloadObsidian`/`reloadSession`, so there is one chromedriver per spec file. |

**What the shards get.** There are 4 shards (`maxInstances` = `DSE_E2E_SHARDS` = min(4, floor(12/3)) on this host) and 17 spec files. wdio forks one worker per spec file, at most 4 at a time. Each worker gets:
- its own `get-port` draw, so its own chromedriver port (17 draws per full run);
- its own chromedriver process;
- its own Obsidian with `--remote-debugging-port=0` and its own user-data-dir.

All workers share the run's single private Xvfb display. `get-port`'s `lockedPorts` set is per-process (`index.js:10-13`), so workers do not coordinate. Collisions between them are only as likely as two random bind(0) results matching.

### Check-then-use window

- **Obsidian DevTools: no window.** The port is assigned by the OS and read back from that session's own user-data-dir.
- **Chromedriver port: there is a window.** It runs from `checkAvailablePort` closing the socket to chromedriver binding. Measured 21 16 20 26 18 23 14 18 21 20 ms (P3).
- P3 also showed that `get-port` on this kernel (6.8, `ip_local_port_range` 32768–60999) gives back **odd ports only, in 32769–46879** (2000/2000 odd, 2000 distinct, random order). That is about 7,000 possible values.
- For another process to take the number inside that ~20 ms window, it has to bind(0) at that moment and get that exact value. Candidates are other e2e workers, chromedriver-launched Obsidians (port 0), and lifecycle after R1 (port 0).
- My estimate is around 1e-6 per session. That is not measured: it assumes well under one foreign bind(0) per 20 ms on the machine.

### What happens when the number is taken (P1, P2)

**P1** ran chromedriver 150.0.7871.250 (Electron 43.7.7 build, e2e's exact flags `--port --binary --allowed-origins=*`) against a port that was already held:

| Held on | Our chromedriver | `wait-port({port})` | `GET http://localhost:P` | Result |
|---|---|---|---|---|
| 127.0.0.1 | `bind() failed: Address already in use` → `IPv4 port not available. Exiting...`, exit 1 | resolves `{open:true, ipVersion:4}` | answered by the other holder | **wrong-instance** |
| ::1 | `IPv6 port not available. Exiting...`, exit 1 | resolves (v6) | ECONNREFUSED (localhost → 127.0.0.1) | clean failure |
| both / `::` | exits 1 | resolves | answered by the other holder | **wrong-instance** |
| another chromedriver | exits 1 | resolves | 200 `ChromeDriver ready for new sessions` from the other one | **wrong-instance** |

`startWebDriver` never watches the driver process exit (`@wdio/utils/build/node.js:368-488` has no exit handler). It logs `Started Chromedriver … on port P` even though ours has already died (P2 log, 18:56:42.156 "Exiting..." then 18:56:42.160 "Started").

**P2** was a real `webdriverio.remote()` with e2e-shaped capabilities. `get-port` was forced, through a resolve hook, to a port held by another chromedriver with `DISPLAY=:5447`; ours had `DISPLAY=:5448`. Results:
- `SESSION CREATED … wdio thinks driver is localhost:48202`.
- The Obsidian process was parented by the **other** chromedriver (pid 1913191).
- Its window was **on the other display** (`windows on FOREIGN display :5447: "Obsidian"`, `windows on OUR display :5448: none`).
- It still used OUR user-data-dir, vault and binary.
- `deleteSession` then ended it through the other chromedriver, and wdio's `killDriverProcess` hit `ESRCH` on our dead driver.

**Consequence in a real run (wrong-instance):**
- Our spec file runs in an Obsidian that is a child of another run's chromedriver, on another run's display. That display might be another session's Xvfb, or `:1` if the other run is `--headed`. Hover/focus would interfere both ways, which is the SC-539 class of problem.
- When the other worker finishes its own spec file, it kills its chromedriver and with it our session. The rest of our spec file then shows as `FAIL … did not run (an earlier hook or session failure?)`.
- `e2e/run.mjs:574-578` counts those as failures, and `:603` returns **exit 1, not 2**. A gate reader sees a block of FAILs that looks like a code failure.
- The other run's reaper (`run.mjs:258-274` descendant tracking) may also count our Obsidian as its "leftover".

**When the taker is not a WebDriver server** (an Obsidian DevTools listener, or another `get-port` probe that closes again): the session POST fails or `waitPort` times out (`node.js:481-483` "Timed out to connect to Chromedriver"). That is a clean failure, but it is still reported as exit 1 with "did not run" lines, not as the environment exit 2 that `run.mjs:13` documents.

**Severity:** very unlikely, so not worth fixing in SC-551. If it ever happens it shows up as a burst of FAILs in one spec file.

**Prescribed fix (optional Backlog, not SC-551 scope):**
- In `e2e/wdio.conf.mts`, add a `before` (or `beforeSession` → `before`) hook that proves the driver is ours: `caps['wdio:driverPID']` is alive (`process.kill(pid, 0)`) and owns the listening socket on `browser.options.port`. To check ownership, find the socket's inode for that port in `/proc/net/tcp{,6}` and look for it under `/proc/<driverPID>/fd`.
- Optionally also check that the Obsidian whose cmdline carries this session's `--user-data-dir` has ppid == driverPID.
- On failure, throw `SevereServiceError('chromedriver port taken by another process')`, and have `run.mjs` map that to exit 2.
- A cheaper partial fix: fail fast if `/proc/<driverPID>` is gone. That catches every wrong-instance case in P1, because chromedriver always exits when it cannot bind.

## 2. obsidian-shots (`visual-harness/obsidian-camera.mjs`)

**Ports and settings:**
- `:82` `PORT = Number(process.env.DSE_CAMERA_PORT ?? 9223)`, a fixed default.
- `:85-86` `tmpRoot` defaults to `/tmp/claude-1000/dse-obsidian-camera` and the user-data-dir is `<tmpRoot>/obsidian-harness-udd`. This is one path for every checkout, and it persists between runs.
- `:583` spawns `--remote-debugging-port=${PORT}` with `stdio: 'ignore'`.
- `:545` `jsonList()` fetches `http://localhost:${PORT}/json/list`.

**Window:**
- `:635-637` is the only ownership check, a single `/json/list` fetch.
- It runs before `seedUdd()` (`:638`), `seedExperimental` (`:648`), `warmUpUpdate()` (`:659`; up to 90 s on a fresh tmp root, when its own warm-up Obsidian binds PORT and is then killed), and `spawnObsidian()` (`:660`).
- So the window runs from the check, through any warm-up, to our Obsidian actually binding DevTools, which takes about 0.5 s after spawn.

**Attach:**
- `:670-683` polls for **any** `page` target whose url starts with `app://obsidian.md` on PORT.
- The first poll runs about 2 ms after spawn, before our child could have bound anything. The `child.alive` check (`:671`) cannot catch this: on a taken port our Obsidian **stays alive with no DevTools server and prints nothing about it** (P5 "held": alive after 8 s, no `DevToolsActivePort`, no DevTools line).
- The settings-popout and sidebar lookups (`:1459`, `:1833`) also search all of PORT.

**Consequence: wrong-instance, proven (P4).** The camera ran unmodified with `DSE_CAMERA_PORT=48301`. The other Obsidian (vault `FOREIGN-VAULT`) owned 48301 from the moment the camera's check finished. The camera printed:
- `attached: obsidian unknown, vault "FOREIGN-VAULT"`;
- `plugin not loaded (restricted mode?) — enabling via app.plugins APIs…`, i.e. it ran `app.plugins.setEnable(true)` and `enablePluginAndSave` **inside the other Obsidian**;
- a "BLOCKED" window shot of the other vault: `sc551-r1-survey-evidence/p4-camera-shot-of-FOREIGN-obsidian.png`.

**What the camera does to whatever it attached to, once its plugin loads.** If the other Obsidian is another checkout's camera or lifecycle with DSE loaded, the camera goes on to:
- delete and create notes (`:1700`);
- write the plugin theme and `appearance.json` (`:2186-2188`);
- call `window.electron.remote.app.quit()` (`:2198`), which **quits the other session's Obsidian**.

Its own Obsidian, alive with no DevTools, is then killed by `killChild`. The PNGs it writes would show the other checkout's plugin build.

**Severity:**
- obsidian-shots is dse-verify battery step 8, plus the SC-334 modal assertions run inside the camera.
- dse-verify tells agents to use a private `DSE_CAMERA_PORT`. If two agents pick the same number, or both leave the 9223 default, and start within about 0.5 s of each other (or one starts in the gap after another's warm-up), the result is false shots or FAILs and damage to the other session.
- Outside that window, the one-shot check catches the collision cleanly (`port 9223 already serving CDP — another instance owns it; aborting`).

**Prescribed fix: reuse R1(e)'s `scripts/cdp-owned.mjs`.**
- Spawn with `--remote-debugging-port=0` by default; keep `DSE_CAMERA_PORT` as an explicit pin, following R1(b).
- Read the port and GUID from our child. Both sources exist for `/usr/bin/obsidian` plus a 1.14.5 asar (P5 "zero"): the stderr line `DevTools listening on ws://127.0.0.1:36743/devtools/browser/bdf9262e-…` (this needs `stdio` piped, not `'ignore'`) and `<udd>/DevToolsActivePort` = `"36743\n/devtools/browser/bdf9262e-…"`. The GUID matched `/json/version` `webSocketDebuggerUrl`.
- Because the camera's user-data-dir persists, **`unlink(<udd>/DevToolsActivePort)` before every spawn**. The file survives exit (P5 and P2 user-data-dirs still have it, and the shared camera user-data-dir has one right now). Alternatively, prefer the stderr line.
- Do the GUID proof before the first `Cdp.connect` (`:683`). Then use the owned port for `:673/:678/:1459/:1833`.
- The warm-up launch (`:613`) needs no CDP at all: drop its `--remote-debugging-port` or use 0.
- If the port is pinned and our process never reports it, fail with exit 2 and a message that names the port.

## 3. docs-shots (`visual-harness/docs-shots.mjs`)

**Browser half:**
- `:107` `chromium.launch()` and `docs-gif.mjs:631` `chromium.launch({ args: ['--disable-partial-raster'] })` use Playwright 1.61.1.
- `node_modules/playwright-core/lib/coreBundle.js:42515-42518` `defaultArgs` pushes `--remote-debugging-pipe`, so there is no TCP port and no race.
- There is no HTTP server anywhere in `visual-harness/` (no `createServer` or `.listen(`).

**Obsidian half:**
- `:313-316` runs `obsidian-camera.mjs --docs` through `spawnSync`, with env `DSE_CAMERA_DISPLAY`/`DISPLAY` set to its own Xvfb (SC-546 `startOwnedXvfb`, `:265-288`).
- It does **not** set `DSE_CAMERA_PORT` or `DSE_CAMERA_TMP`. Every docs-shots run therefore uses port 9223 and the shared user-data-dir, the same as obsidian-shots.
- Race: yes. Consequence: wrong-instance, exactly as in §2. The extra harm here is that docs images in `docs/Media` could be captured from another checkout's Obsidian.
- Fix: comes with the camera fix (port 0 by default means docs-shots needs no change).

## 4. Evidence scripts (one-off, not in any gate)

- **`settings-evidence.mjs`**: wrong-instance.
  - `:41` port defaults to 9224. `:44-45` user-data-dir is `<shared tmpRoot>/obsidian-sc131-udd`. `:356` checks once, then warm-up (`:358`), then spawn (`:362`).
  - `:369-373` polls for any `app://obsidian.md` target with **no `child.alive` check**. `:393` does the popout lookup on PORT. `:380` writes the theme in the attached Obsidian.
  - Fix: use the helper if it is ever re-run; otherwise leave it.
- **`sc184-evidence.mjs`**: wrong-instance.
  - `:29` port defaults to **9223**, the same as the camera. `:32-33` it uses the **same user-data-dir** as the camera (`obsidian-harness-udd`). `:259` checks once, then `:260-261` seeds and spawns.
  - `:271` polls for any `app://obsidian.md` target. `:296` writes the theme.
  - Fix: same as `settings-evidence.mjs`.

## 5. Other port users in the plugin (grep for `remote-debugging`, `connectOverCDP`, `createServer`, `.listen(`, `getPort`, `_PORT`, `chromium.launch`)

- Only lifecycle (out of scope), the camera and the two evidence scripts pass `--remote-debugging-port`.
- `shoot.mjs:7171`, `parity/plugin-capture.mjs:28`, `parity/site-capture.mjs:29`, `shoot-url.mjs:14`, `obsidian-light-island.mjs:278`, `sc191/*`, `sc379/shoot-sc379.mjs:76` and `mocks/sc186-shoot.mjs:34` all use Playwright `chromium.launch()` over a pipe.
- `e2e/x11-pointer.mjs` uses X only. `scripts/xvfb-owned.mjs` handles displays only (SC-546).
- Nothing else picks a port.

## 6. Related findings (not port races; for the owner to scope)

1. **The camera's user-data-dir is shared by default.**
   - Every camera, docs-shots and sc184 run on the machine uses `/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd`.
   - P6 ran two Obsidians with the same user-data-dir on different ports. The second **exited with code 0 within 0.8 s** (Chromium process singleton hands off to the first) and never served its port. With distinct ports, a second camera therefore fails cleanly (`obsidian exited before CDP came up`, `:671`).
   - Meanwhile its `seedUdd()` (`:560-578`) has already rewritten the first run's live `obsidian.json` and window JSON.
   - Fix: a per-run `mkdtemp` user-data-dir, with the updated asar copied in from a shared cache.
2. **`DevToolsActivePort` is never cleaned up.** Chromium leaves it behind after exit, both on SIGTERM and with a fixed port. The R1 helper should only trust a file that appeared after its own spawn (unlink it first, or compare mtime with the spawn time), or the stderr line. Lifecycle's `mkdtemp` user-data-dir does not have this problem; the camera's does.
3. **e2e misclassifies a session that never started.** When one shard's session never starts, the result is exit 1 with "did not run" FAIL lines, not the exit 2 that `run.mjs:13` documents. That is because `:574-578` counts unreported ids before `:604-606` would return 2. This holds for any session-start failure, not only the port race.

## 7. Probe log

| Probe | What | Result |
|---|---|---|
| P1 `p1.log` | chromedriver started on a port already held (5 holder shapes) | always exits 1. `wait-port` still resolves. HTTP to localhost reaches the holder unless it is on ::1 only. |
| P2 `p2.log` | real `remote()` with `get-port` forced to another chromedriver's port | session created on the other chromedriver. Obsidian ppid = the other one. Window on the other display. Our user-data-dir got `DevToolsActivePort` (port 0 readback). |
| P3 `p3.log`, `p3b.log` | `get-port` value range and window length | odd ports 32769–46879, random. 14–26 ms until chromedriver listens. |
| P4 `p4.log`, `.png` | the real camera with another Obsidian taking PORT after its check | `attached: … vault "FOREIGN-VAULT"`, plus evaluates and a screenshot inside the other Obsidian |
| P5 `p5.log` | `/usr/bin/obsidian` + 1.14.5 asar, port held vs port 0 | held: alive, silent, no DevTools. 0: stderr `DevTools listening on ws://127.0.0.1:<p>/devtools/browser/<guid>` plus `DevToolsActivePort`, GUID = `/json/version`. |
| P6 `p6.log` | two Obsidians sharing one user-data-dir | the second exits 0 in 0.8 s and never serves its port |

**Process notes:**
- I killed every process by its recorded PID. After each probe, `ps` showed nothing left carrying the scratch path.
- I connected to, evaluated in, or killed no other session's process. The only cross-session access was passive `/proc/<pid>/cmdline` reads of live e2e and lifecycle processes, to confirm the `--remote-debugging-port=0` and `--port` flags.
- Lapse: early on I ran `/opt/Obsidian/obsidian --version` without `--user-data-dir`. It loaded `~/.config/obsidian/obsidian-1.15.0.asar`, printed an "installer out of date" notice, and exited. No real-config Obsidian was running at the time (I checked `ps` right after), so nothing was handed off to a live instance.
- Two scratch files (`p3b.mjs` and a one-line python patch) were written with heredocs, not the Write tool.
