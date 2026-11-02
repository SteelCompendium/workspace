# SC-539 r3: independent adversarial review of the pointer-park fix (plugin `ec576f5b` on `fb24f8a2`)

**Executive summary**
- **Verdict: FIX-FIRST, but the fix is doc-only.** The code is correct and fixes the flake. One factual error needs correcting in the module comment and the dse-verify proposal before land. No re-gate is needed beyond lint.
- **Findings:** HIGH 0, MEDIUM 1 (the keeper's mechanism is misdescribed), LOW 0, INFO 6.
- **Flake proof** (150 ms foreign-window churn, CHR-F02/F03/L01 + INIT-DEF-E04, 1 shard):
  - HEAD: **8/8 pass** over 2 runs, 0 foreign leaves.
  - Park disabled: **0/4 pass** (1 run), 28-30 leaves per test at 512,400. The failure messages match the field ones.
- **Safety:** the runner's only X connect() is `/tmp/.X11-unix/X200`, even with `DISPLAY=:1` exported (strace). `:1`'s pointer read 2263,430 before and after the run, using read-only XQueryPointer. `--headed` is untouched. There is no xdotool or devbox change, no new dependency, and CI runs no e2e.
- **Failure modes:** 20 fake-server and bad-name cases. All of them either reject with a reason or resolve correctly, inside the 2 s bound, and the socket is closed every time. The WARN line printed at the start and again after `done`, and the run continued (rc 1 came from the test failures, never 2). The request bytes match the X11 core spec.
- **Keeper:** across one full run, 130/130 live samples read 0,0, and the pointer window was the keeper the whole time. The one sample that was off came after Xvfb teardown. The process exits by itself. Nothing is left behind (no Xvfb, socket, lock or process).
- **Full e2e:** `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, with the parked line. tsc and lint are clean. sha256 of main.js and styles.css matches r2 and base.

## Findings

### MEDIUM M1: the snap-back is an X server reset when the last client disconnects, not a "last mapped window" effect
- **Where:**
  - `e2e/x11-pointer.mjs:18-24` (the THE KEEPER paragraph: "the warp only sticks while at least one window is mapped … on a bare Xvfb WarpPointer is a no-op … when the last mapped window goes away the pointer snaps back").
  - `sc539-dse-verify-proposal.md` §1 ("a 1x1 'keeper' window plus WarpPointer: the warp only sticks while some window is mapped").
  - The r2 report's "Finding that shaped the design".
- **Evidence:** `r3-reset.log`, on a throwaway Xvfb `:5391` with the same flags.
  - **T1:** a client holds a bare connection with no window. `xdotool mousemove 0 0` then reads **0,0**. Once that client disconnects, the pointer reads 800,600.
  - **T2:** `Xvfb -noreset`, bare, with no client kept. `xdotool mousemove 0 0` reads **0,0**.
  - **T3:** xlogo is mapped, then warped to 0,0, then **unmapped but still connected**. The pointer reads 0,0. It goes back to 800,600 only when xlogo exits.
  - r2's observations reproduce (`r3-xprobe.log` A/B): a bare warp reads 800,600, and so does the pointer after xlogo exits. But that happens because each xdotool or xlogo was the last client and its exit reset the server. A warp on a bare Xvfb is not a no-op.
- **Why it matters:** the code works, because the keeper's open connection is what stops the reset. But the comment says the window is the reason. It will go into SKILL.md as canonical text.
- **Failure scenario:** a maintainer trusts the comment and decides the keeper is redundant once Obsidian windows exist. They move a one-shot warp into the session `before` hook, or close the connection after the warp. Between spec files there can be a moment with zero X clients. The server resets, the pointer recentres inside every window, and the flake returns silently. The readback still passes, because it is read on the same connection before the reset.
- **Prescribed fix (doc-only):**
  - Rewrite `x11-pointer.mjs:18-24` along these lines: "Xvfb resets (and recentres the pointer) whenever its last client disconnects, so a one-shot warp from a short-lived client is lost at once, and lost again whenever every Obsidian has exited between spec files. The returned handle therefore keeps this connection open for the whole run; the 1x1 InputOnly window at 0,0 is not what holds the warp (kept only as a harmless marker)."
  - Change the proposal bullet to "the park holds a connection open: Xvfb resets and recentres the pointer when its last client disconnects".
- **Optional belt (owner's call):** add `-noreset` to the Xvfb args at `e2e/run.mjs:352`. The park then survives even if the keeper connection is lost, and CreateWindow/MapWindow become droppable. This is not required: the current code is proven.
- **Side effect worth one line in the comment:** with the keeper connected, the private Xvfb never resets between spec files. Before this change it reset whenever every Obsidian had exited. No test showed any effect (124/124).

### INFO
1. **The Authenticate reason is read from an unused byte.** `x11-pointer.mjs:85` takes `buf[1]` as the reason length for both refusal statuses. For status 2 (Authenticate), byte 1 is unused, so the reason prints empty: fake-server result `(authenticate: )`. The run cannot reach this, because Xvfb runs without `-auth`. Fix if wanted: for status 2, use the additional-data bytes and trim the NUL padding.
2. **A setup reply shorter than the fixed header gives a cryptic message.** If the setup reply says success with 0 extra words, the client rejects with Node's RangeError `The value of "offset" is out of range…`. It is still loud and still the WARN path. Fix if wanted: add `if (total < 40) throw new Error('setup reply too short')` before line 88.
3. **ECONNREFUSED is not retried.** There is a bind-to-listen window at Xvfb startup, and an ECONNREFUSED there is not retried. Measured: 15/15 immediate parks succeeded, 4-6 ms after the socket appeared (`r3-xprobe.log` D). If it ever happens it shows as WARN. No fix needed.
4. **Pre-existing race, not from this diff.** `startXvfb` (run.mjs:350-363) treats "socket file exists" as "mine". In a two-runner race on the same number, it could return the other runner's display, and the park would act on that display. That display is still a private one in `:200-239`, never `:1`.
5. **The handle is never released.** run.mjs:501 discards it, so `release()` is never called. That is fine: `sock.unref()` keeps the event loop free (the process exited 0 ms after the park in 16/16 probes), and the socket closes when `reapAll()` kills Xvfb (`close` after `done` is a no-op). After resolve, the `data` listener only appends to `buf`. No events are selected, so this is negligible.
6. **Geometry checked; one wording nit.** Each Obsidian also owns a 1x1+0+0 window, a "Chromium clipboard" window at 10x10+-100+-100 and an "obsidian" window at 10x10+10+10 (`r3-full-*.samples`). Across all 130 samples `xdotool` reported the pointer's window as the keeper `0x200001`, so none of them is mapped over 0,0. Obsidian windows appear at 1024x800+288+200 before `setWindowSize`, then 1440x1100+288+200. Both contain the screen centre and neither contains 0,0. The proposal's "every window 1440x1100 at +288+200" omits the initial size (nit).

## Probe-by-probe

1. **Does it fix the flake?** Instrumentation is r2's `sc539-r2-proof-churn-instrumentation.diff.txt`, applied temporarily and reverted.

   | Variant | Result | Leaves per test |
   |---|---|---|
   | HEAD run 1 | 4/4 pass | 0 |
   | HEAD run 2 | 4/4 pass | 0 |
   | Park disabled (temporary throw at run.mjs:501, reverted) | 0/4 pass | 28-30, at 512,400 |

   - Churn was on in every session (6-9 flips per session at HEAD).
   - Park-disabled failures: `init.reset-encounter` / `chrome.collapse` `still not displayed after 8000ms`.
2. **Safety.** The raw X11 client was built as ruled; there is no xdotool fallback.
   - The display comes only from `startXvfb()`'s `:${n}` (run.mjs:497), in the non-headed branch.
   - `parkPointer` derives the socket path from that string alone and never reads `DISPLAY`.
   - The full run had `DISPLAY=:1` exported. strace of the runner's connect() calls: one `/tmp/.X11-unix/X200` and one tsx pipe, nothing else.
   - `:1`'s pointer was read only (xdotool getmouselocation = XQueryPointer): `x:2263 y:430` before and after.
3. **Failure modes** (`r3-fakex.log`, fake servers on `/tmp/.X11-unix/X5390`, removed afterwards).
   - **No socket:** ENOENT (connect).
   - **Bad names:** `:1x`, `bogus`, `localhost:200` and `:200.0.1` are all rejected.
   - **Accepts but never answers:** "timed out after 2000 ms (setup)", after 2002 ms.
   - **Setup OK, then no answer to the requests:** "timed out … (request)".
   - **Short reply then close, or close before the reply:** "connection closed (setup)" or "(request)".
   - **Failed (status 0):** the reason is shown.
   - **Authenticate:** INFO 1.
   - **Truncated screen, or vendor length 65535:** "setup reply has no screen".
   - **X error on CreateWindow:** "X error 8 on request 1 (opcode 1)".
   - **Readback 5,5 or -1,0:** rejects, with the signed value read correctly.
   - **Event before the reply, and a reply dribbled in 1-byte chunks:** both resolve.
   - **Garbage after resolve:** no crash.
   - **A regular file at the socket path:** ECONNREFUSED.
   - The client socket was closed in every case.
   - **Spec check of the decoded request bytes:**
     - Setup is `6c 00 0b00 0000 0000 0000 0000` ('l', 11.0, no auth).
     - CreateWindow is op 1, depth 0, len 8, wid = base|1, parent = root, 0,0 1x1, border 0, class 2 (InputOnly), visual 0 (CopyFromParent), mask 0.
     - MapWindow is op 8, len 2.
     - WarpPointer is op 41, len 6, src None, dst root, src rect 0, dst 0,0.
     - QueryPointer is op 38, len 2, on root. Its reply is read at root-x/root-y (offsets 16/18), signed.
     - The setup parse is `40 + pad4(vendor) + 8*formats` → screen[0].root, checked with odd vendor lengths (5, 3) and 2 and 7 formats.
   - The WARN path in a real run printed at the start and after `done`, and the run continued.
   - **CI:** neither workflow mentions `e2e`, `xvfb`, `devbox` or `xdotool` (0 matches). CI does lint e2e/, which is clean.
3b. **Keeper.** The snap-back is real; its cause is M1. Results from `r3-xprobe.log` C (the keeper) and the full run (`r3-full-*.samples`):
   - **With the keeper:** the pointer stayed at 0,0 through 20 flips of a full-screen foreign window and 5 map/destroy cycles at Obsidian's geometry.
   - **After `release()`:** the pointer returned to 800,600, as expected.
   - **Full run:** 130/130 samples read 0,0. The pointer window was the keeper throughout, so no Obsidian window and no Chromium helper is over 0,0.
   - X input focus belonged to the Obsidian windows (Chromium sets it explicitly), so the keeper takes no keyboard focus.
   - All test input is CDP (`dse.ts:309-311`, `moveTo`, `browser.keys`, `action('wheel')`). There is no OS-level input, so the keeper receives nothing a test relies on.
   - **Teardown:** the socket and lock were gone, no Xvfb was left on `:200`, and no process with the worktree in its command line was left.
4. **Every shard and every window lifetime:**
   - There is one Xvfb per run, started once in `main()`, and the 4 shards share it (`wdio.conf.mts:22` `maxInstances: shards`). It is parked once and held for the whole run.
   - Nothing moves the X pointer later: there is no xdotool, warp or pointer-lock in `src/` or `e2e/`, and CDP input does not touch the X pointer.
   - CHR-L01's CDP pointer is synthetic, so parking cannot break it. It passed under churn and in the full run.
5. **Nothing weakened.** The `git diff fb24f8a2..HEAD` stat shows only `e2e/README.md`, `e2e/run.mjs` and `e2e/x11-pointer.mjs`. No spec, `src/`, package or devbox file changed. CHR-F02 is unchanged (`chrome-focus.e2e.ts:64-75`). The HEAD build hashes match r2's base and head:
   - `main.js` `dcbe5f58b37bbd76c39524bd702cce60d943a4cc5fdf896058b449b857977515`
   - `styles.css` `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0`
6. **Battery:**
   - Full e2e rc 0: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, preceded by `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`. 16 files, 4 shards, load 1.9 at the start and 6.0 at the end.
   - `npm run tsc`: rc 0.
   - `npm run lint`: rc 0. Only the known `.eslintignore` warning.
7. **Proposal accuracy.**
   - The OK and WARN lines and their placement ("right before `start:`", and again after `done`) are accurate. "Exit code unaffected" is accurate: the WARN run gave rc 1 from its failures.
   - The keeper sentence is wrong (M1). The geometry is a nit (INFO 6).
   - The `command grep -a` note is accurate: ugrep skips run.mjs.
   - The CURRENT numbers are consistent with this run.

## Tree state

The plugin worktree was clean before and after (`git status --porcelain` printed nothing). HEAD is still `ec576f5b`. The superproject's ` M draw-steel-elements` was present at start and is unchanged. My temporary edits were reverted with `git checkout --`: r1's instrumentation in `dse.ts` / `session.ts`, and the temporary throw in `run.mjs`. Per-run bundles land in the gitignored `e2e/.out/`.

## Artifacts

All of these are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r3-ab047c5be998a380b/`:

- **Logs:**
  - `r3-head-churn150-run1.log`
  - `r3-head-churn150-run2.log`
  - `r3-nopark-churn150-run1.log`
  - `r3-full-1793612961-982695.log`, with `.samples`, `.strace` and `r3-full-run1.out`
  - `r3-xprobe.log`, `r3-reset.log`, `r3-fakex.log`
  - `r3-tsc.log`, `r3-lint.log`, `r3-lint-mjs.log`, `r3-build-head.log`, `r3-static.out`
- **Scripts:**
  - `r3-run-e2e.sh`, `r3-full.sh`, `r3-static.sh`
  - `r3-xprobe.sh`, `r3-reset.sh`
  - `r3-keeper.mjs`, `r3-park-once.mjs`, `r3-hold.mjs`, `r3-fakex.mjs`
