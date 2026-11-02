# SC-539 r5: scoped re-review of the r4 fix (plugin `88cb7db9` = `c34f6904` + `88cb7db9` on `ad018cda`)

**Executive summary**
- **Verdict: LAND.** Findings: HIGH 0, MEDIUM 0, LOW 0, INFO 1 (wording only, no change needed).
- **(1) Rebase:** the range-diff reads `1: ec576f5b = 1: c34f6904`, so the park commit is unchanged.
- **(2) M1 comment:** `x11-pointer.mjs:18-26` now matches the r3 measurements. Xvfb resets on its last client's disconnect, the open connection is what holds the park, and the window is only a marker.
- **(3) `-noreset`:** a live run confirmed the flag is on the Xvfb command line. The park holds even after its client leaves. Teardown leaves no socket, lock, Xvfb or process, and the keeper is still created and held.
- **(4) Fake-X probes:** 28 server cases plus 5 bad display names. Every failure rejected with a reason and closed the socket: within 1 ms, or at 2002-2003 ms for the four timeout cases. The authenticate reason and the short-reply message now read correctly.
- **(5) Proposal:** accurate, including the CURRENT line at `ad018cd` (matches SKILL.md:1231-1233).
- **(6) Churn and static gates:** churn-150 at head **4/4, leave=0 in every test**, with 32/32 pointer samples at 0,0. tsc rc 0, lint rc 0. The `main.js` / `styles.css` sha256 matches r4's ad018cda value.

## Checks

1. **Rebase.** `git range-diff fb24f8a2..ec576f5b ad018cda..c34f6904` reads `1: ec576f5b = 1: c34f6904`, so the commit is identical. `git diff ad018cda..HEAD --stat` lists only `e2e/README.md`, `e2e/run.mjs` and `e2e/x11-pointer.mjs`. There is no change to package, devbox, `src/` or `styles-source.css` relative to `ad018cda`.
2. **M1 comment (`88cb7db9`, `x11-pointer.mjs:18-26`).** It says Xvfb resets and recentres the pointer when its LAST CLIENT disconnects. It says a one-shot warp from a short-lived client is lost at once, and lost again between spec files. It says the open connection holds the pointer, not the window, and that the 1x1 InputOnly window is a harmless marker. It notes that the Xvfb no longer resets between spec files, and that `-noreset` is a backstop. All of this matches r3's T1-T3 and this round's `-noreset` probe.
3. **`-noreset` (`run.mjs:352-354`).**
   - **Live run:** the Xvfb command line was `…/Xvfb :200 -screen 0 1600x1200x24 -nolisten tcp -noreset`.
   - **Throwaway `:5391` with the same arguments** (`r5-noreset.log`):
     - The keeper is still created: `0x200001 1x1+0+0`, held, pointer window `2097153`.
     - The pointer stayed at 0,0 through 20 full-screen flips and 5 map/destroy cycles at Obsidian's geometry.
     - After `release()` the pointer **stays 0,0**, where r3 saw 800,600 without the flag. The same holds after a park process exits without calling release, as `run.mjs` does. The backstop works.
     - After SIGTERM, `/tmp/.X11-unix/X5391` and `/tmp/.X5391-lock` are both gone.
   - **After the churn run:** no `X200` socket, no `/tmp/.X200-lock`, no Xvfb on `:200`, and no process with the worktree in its command line.
4. **INFO 1 / INFO 2 parsing (`x11-pointer.mjs:87-99`; `r5-fakex.log`).**
   - **Failed (status 0):** the reason length comes from byte 1. If byte 1 claims 200 bytes but only one word of data arrives, the read stops at the buffer: `(failed: abc)`.
   - **Authenticate (status 2):** the reason is the additional data with trailing NULs trimmed: `(authenticate: Need cookie)`, `(authenticate: abcd)`, and an empty reason gives `(authenticate: )`.
   - **Unknown status 3:** reads the additional data, labelled `failed`.
   - **Short success replies all give `setup reply too short`:** 0 extra words (total 8), total 12, total exactly 40 (header only), truncated screen, a reply one word short of the screen, and a vendor length of 65535.
   - **A header advertising 65535 words, then silence:** `timed out after 2000 ms (setup)`.
   - **All r3 cases re-run unchanged:** ENOENT, ECONNREFUSED on a regular file, both timeouts, close during setup and during the requests, the X error, readbacks 5,5 and -1,0, an event before the reply, and a dribbled reply.
   - The request bytes are byte-identical to r3.
   - The client socket was closed in every case, and the fake socket path was removed afterwards.
5. **Proposal (`sc539-dse-verify-proposal.md`).**
   - §1 is accurate. It says windows open at 1024x800+288+200 and are then resized to 1440x1100+288+200 (matches r3's samples). It says the park holds a connection because Xvfb resets on last-client disconnect, that `-noreset` is the backstop, and it states the OK and WARN lines and where they print.
   - §2 (the ugrep note) is accurate.
   - §3 CURRENT matches SKILL.md CURRENT @ `ad018cd`: jest 6245/1 (fresh 6244/2), lifecycle 45/45 as 21+16+8, e2e 124/124 87/87, shots 592, freeze 280/280, parity 0/0/24. The r4 jest log shows the fresh-worktree shape, 6244 passed / 2 skipped / 249 of 250.
6. **Gates.**
   - **Churn-150 at head** (r2's instrumentation applied temporarily, then reverted; `--only=CHR-F02,CHR-F03,CHR-L01,INIT-DEF-E04 --shards=1`, `DISPLAY=:1` exported): rc 0, `4/4 ok`.
     - leave=0 for all four tests; churn ran with 6-9 flips per session.
     - 32/32 pointer samples read 0,0.
     - `:1`'s pointer read 2263,430 before and after, using a read-only query.
   - **Static:** `npm run tsc` rc 0, `npm run lint` rc 0 (only the known `.eslintignore` warning).
   - **Build at head:** `main.js a37fbb6f…3c24`, `styles.css ae45354b…d5b0`, the same as `sc539-r4-sha256.txt` (head = base `ad018cda`).
   - **r4 logs spot-checked:**

     | Log | Result |
     |---|---|
     | e2e-1, e2e-2 | `124/124 ok … 87/87 pairs` plus the parked line, RC=0 each |
     | jest | `Tests: 2 skipped, 6244 passed` |
     | lifecycle a / b / c | `21/21`, `16/16`, `8/8` ok, RC=0 |
     | tsc, lint | RC=0 |
     | churn150-head | 4/4, RC=0 |

## INFO
- **INFO 1 (wording only):** the module header (`x11-pointer.mjs:15-16`) still calls the window the "keeper", and the WHY paragraph (`:3-4`) gives only the 1440x1100 geometry. The new paragraph right below explains what the window really is, and the 1024x800 clause lives in the proposal as ruled. No change needed.

## Tree state
- The plugin worktree was clean before and after, HEAD `88cb7db9`. r2's churn instrumentation was applied temporarily and reverted with `git checkout -- e2e/driver/dse.ts e2e/driver/session.ts`.
- The superproject's ` M draw-steel-elements` was there at start and is unchanged.
- No X sockets of mine are left (`/tmp/.X11-unix` holds `X1` and `X160`, neither of which is mine).

## Artifacts

All of these are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r5-ab047c5be998a380b/`:

- **Churn run:** `r5-churn-run1.out`, `r5-churn150-1793614572-1031199.log`
- **Probes:** `r5-fakex.log`, `r5-noreset.log`
- **Static gates and build:** `r5-static.out`, `r5-tsc.log`, `r5-lint.log`, `r5-build-head.log`, `r5-sha256.txt`
- **Scripts:** `r5-churn.sh`, `r5-noreset.sh`, `r5-static.sh`, `r5-fakex.mjs`, `r5-keeper.mjs`
