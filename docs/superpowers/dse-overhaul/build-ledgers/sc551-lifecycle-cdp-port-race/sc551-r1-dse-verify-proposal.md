# SC-551 r1 — proposed dse-verify text (SKILL.md is NOT edited; owner applies)

## 1. Row 4 (lifecycle), the sentence near the end

Current: `… a lost race moves on to the next number. CDP port 9262, scratch vault — never :1. Exit 2 = environment (no Xvfb/asar/binary, port busy), not a code failure |`

Proposed:

`… a lost race moves on to the next number. CDP port (SC-551): by default Obsidian is started with --remote-debugging-port=0 and the run uses the port OUR Obsidian reported in the DevToolsActivePort file of its own scratch --user-data-dir, after the browser id in that file equals the one /json/version serves on that port (scripts/cdp-owned.mjs) — no CDP command is sent to anything else, so two runs started in the same instant get distinct ports and never share an Obsidian. Scratch vault — never :1. Exit 2 = environment (no Xvfb/asar/binary; a pinned DSE_LIFECYCLE_PORT that is already in use or that our Obsidian did not get), not a code failure |`

## 2. The `DSE_LIFECYCLE_PORT` paragraph (SKILL.md lines ~61-64)

Current: `Mandatory — unlike obsidian-shots it needs no real display. Set your own DSE_LIFECYCLE_PORT (e.g. DSE_LIFECYCLE_PORT=9285 npm run obsidian-lifecycle) when another session may already be running this gate on the default port 9262 — a busy port makes your run exit 2, not a code failure.`

Proposed:

`Mandatory — unlike obsidian-shots it needs no real display. No port setup is needed (SC-551): the default is an OS-assigned CDP port read back from your own Obsidian, so concurrent lifecycle runs on one machine do not collide; the start line prints it (port <n>). DSE_LIFECYCLE_PORT=<n> still pins a port: it must be free (any listener counts) and your Obsidian must report exactly it, otherwise the run exits 2 naming the port ("… another instance owns it"; a lost bind race takes up to 30 s to be reported) and evaluates nothing in the other instance. Before SC-551 a run that lost the bind race attached to the OTHER run's Obsidian and ran its scenarios inside it (reproduced 11 of 11 pairs on base). Mixed-fleet caveat: a worktree still on the pre-SC-551 runner can attach to a new run's Obsidian when both pin the same port, so rebase before running lifecycle concurrently on a shared pinned port.`

## 3. Optional, one clause for the e2e row / dispatcher rule

"set your own DSE_LIFECYCLE_PORT for every gate run" can be dropped for lifecycle once SC-551 is on develop (keep it for runners the survey says still bind a fixed port).

## 4. (r2, corrected in r4) Camera line, SKILL.md ~336

Current: `Run the camera on a PRIVATE Xvfb + port (DSE_CAMERA_DISPLAY, DSE_CAMERA_PORT), never Scott's :1.`

Proposed:

`Run the camera on a PRIVATE Xvfb (DSE_CAMERA_DISPLAY) and a PRIVATE scratch root (DSE_CAMERA_TMP=<path under your own scratch>), never Scott's :1. The default scratch root, and so the camera's user-data-dir, is ONE machine-wide path shared by every camera, docs-shots and sc184 run (SC-554): two runs on it write the same DevToolsActivePort and seed over each other's obsidian.json, so without a private DSE_CAMERA_TMP concurrent camera runs are not isolated (since SC-551 the second one exits 2 instead of driving the first one's Obsidian, but it still does not run). No port setup is needed (SC-551): the camera starts Obsidian with --remote-debugging-port=0 and talks CDP only to a port whose LISTEN socket belongs to OUR Obsidian's pid and whose browser id matches DevToolsActivePort and /json/version (scripts/cdp-owned.mjs). DSE_CAMERA_PORT=<n> still pins a port: it must be free and our Obsidian must report it, else exit 2 "OBSIDIAN-CAMERA environment: … another instance owns it"; pin ports below 32768 (outside the ephemeral range, which a port-0 Obsidian or any client socket may draw from).`

## 5. (r4) Lifecycle paragraph additions (to §2)

- "the proof also requires the LISTEN socket on the reported port to belong to the spawned Obsidian's pid (`/proc/net/tcp{,6}` inode found under `/proc/<pid>/fd`), and the helper deletes a stale `DevToolsActivePort` before each proven spawn (`clearStaleReport`); lifecycle's scratch user-data-dir is always fresh and private, so nothing is shared there."
- "Pin ports below 32768 (outside the ephemeral range)."
- Exit codes: `obsidian-camera.mjs` and `docs-shots.mjs` return 2 for environment problems (port in use, no report, ownership mismatch, our Obsidian exiting before CDP is up); a docs-shots run whose only failure is the camera's exit 2 exits 2.
- (r6) `DSE_LIFECYCLE_BIN` / `DSE_CAMERA_BIN` may be a launcher wrapper that does not `exec` (a script, `flatpak run`): the ownership proof accepts a DevTools socket held by the spawned pid or any of its descendants, and still rejects one held by a process outside that tree. A `foreign-listener` failure now names the holding pid and command (`… held by pid N "obsidian"`).
