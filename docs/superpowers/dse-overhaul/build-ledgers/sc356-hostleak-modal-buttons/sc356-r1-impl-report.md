# SC-356 r1 implementer report

STATUS: NEEDS_CONTEXT (leaks surfaced; every available fix visibly changes a control)
- dse branch sc356-hostleak-modal-buttons @ 73758ab (2 commits on ba20072; origin/develop still ba20072, no rebase). Superproject doc commit: NONE (held until the fix decision).
- Delivered: tagButtons aria-pressed key + scope/prefix opts; shared helpers extracted from assertBtnHostLeak; assertModalBtnHostLeak (9 scenarios / 8 Modal classes); assertModalRegistry (src/ scan, fails on an unswept/undeclared Modal subclass or a declared-unreachable one that grows its own <button>).
- The new pass is LIVE and RED at HEAD: it reports real leaks on .dse-optchip, .dse-cond-icons__choice, .dse-mt__sheet-resultchip, .dse-swatch (table below). All 6 other modal scenarios (kit footers, steppers, Stamina/Minion/Reset/AddHero/SetLimits/Form) are clean.
- Fixing the chips with plugin tokens (prototype A, patch saved) greens every chip kind but is a VISIBLE change (30px -> 21.7/26.4px, fill #333/#fff -> --dse-surface, unpressed ink #dadada -> --dse-fg-muted). A zero-pixel pin is not possible with plugin tokens (none carries those values) and cannot satisfy the bare-vs-host invariance without Obsidian-token + per-scheme literal fallbacks. Swatch leaks overlap SC-361 (parked, swatch focus design).
- Freeze 276/276 is NOT a guard here: it covers print PNGs only; chips are screen-only, so freeze passes with the prototype applied (measured). Screen-shot md5 compare / obsidian-shots would be needed to prove "zero pixel".
- Not run (pending decision, CSS unchanged): lifecycle, e2e, full shots/freeze/parity at HEAD. Run: tsc clean, lint clean, jest 5260 passed / 1 skipped / 230 of 231 suites.

## Modals (survey of src/: 12 Modal subclasses + DseModal base)
Opened & swept (dark+light, rest/hover/focus-visible): ConditionsModal (editor open: duration/effect chips, icon choices, swatches incl. a primed pressed one, act buttons, add), LogActionModal new + edit, MontageAddHeroModal, MontageSetLimitsModal, StaminaEditModal (stamina-bar), MinionStaminaPoolModal (initiative:fight dblclick Goblin #1), ResetEncounterModal (initiative chrome item), FormModal (feature edit pencil, DOM click: hover-revealed, pointer-events none).
Not openable in harness (declared, with reasons, re-checked by assertModalRegistry): CompendiumSearchModal (SuggestModal via command palette; renders divs+input, no <button>), LegacyCompendiumModal (main.ts onload first-sync flow), CompendiumMigrationModal (main.ts 7.0.0 migration flow). Both of the latter use only footer() kit buttons whose variants are swept elsewhere. Opening them would need an entry.ts hook (follow-up).
A scenario that fails to open / wrong title / missing expected controls => "the check would be blind" failure (demonstrated: FormModal pre-fix of my own selector failed loudly).

## Gallery sweep
Unchanged: 112 button kinds / 672 comparisons, 10 exempt (8 focus-visible disabled, 2 hover no-hit-point). aria-pressed key did not move the count: the gallery mounts 29 aria-pressed=false toggles and ZERO aria-pressed=true, so no pressed/idle pair shares a signature there (the key matters for the modal pass, where chips come pressed+idle). Existing SKILL.md says "12-record exemption boundary"; measured is 10 (stale doc, not touched yet).

## Pre-fix leaks (modal pass, base CSS; full log evidence-r1/modal-pass-prefix-leaks-base-css.log, 269 lines)
kind | property: bare -> with host
- .dse-optchip (plain, pressed+idle; ConditionsModal duration/effect): height 22.97px -> 30px; backgroundColor rgb(26,30,33) -> rgb(51,51,51) (dark; light #f6f8f8 -> #fff); display block -> flex; alignItems normal -> center; justifyContent normal -> center; idle only: color rgba(220,226,230,.62) -> rgb(218,218,218) (light #555960 -> #222)
- .dse-cond-icons__choice.dse-optchip (pressed+idle): height 28.16 -> 30; backgroundColor same as above; justifyContent normal -> center; idle color as above
- .dse-mt__sheet-resultchip.dse-optchip (LogActionModal new+edit, pressed+idle): height 22.97 -> 30; backgroundColor; justifyContent; idle color
- .dse-swatch (idle): w/h 20 -> 19.5 (font-size 13.33 -> 13px, 1.5em); boxShadow none -> Obsidian plate (dark 5-layer, light inset ring + drop); color white -> #dadada; fontSize; fontFamily Arial -> Obsidian stack; whiteSpace normal -> nowrap; focus-visible: outlineStyle auto -> none, outlineWidth 1px -> 3px, boxShadow none -> 3px grey ring
- .dse-swatch pressed: same minus the outline pair
Host values (Obsidian tokens) have no plugin-token twin: --input-height 30px, --interactive-normal #333/#fff vs --dse-surface #1a1e21/#f6f8f8 (--dse-surface-raised #22272b/#edf0f0), --text-normal #dadada/#222 vs --dse-fg-muted.

## Injected-regression proof
With prototype A applied (chips green), removing `height: auto` from the new `:where(.dse-optchip)` rule turns the pass red: 48 lines like
`dark|ConditionsModal|rest|modal:(none)|dse-cond-icons__choice.dse-optchip|pressed|aria-pressed:true: Obsidian's \`button\` rules change height — "28.1562px" without the host, "30px" with it` (log: evidence-r1/modal-pass-injected-regression.log). Restored; CSS reverted to base afterward.

## Prototype A (NOT committed; evidence-r1/sc356-protoA-optchip-plugin-tokens.patch, +18 lines before the SC-202 r1 banner in styles-source.css)
height:auto, background-color var(--dse-surface) (:not(:hover)), unpressed color var(--dse-fg-muted), display/align/justify restated to the bare values, all in the SC-203 anchor/:where() shape. Result: every chip kind green; swatch only remains. Chip metrics A vs base: height 30 -> 26.39 (icon choice+duration/effect in ConditionsModal) / 21.67 (LogAction result chips); fill rgb(51,51,51)->rgb(26,30,33) dark, #fff->rgb(246,248,248) light; idle ink rgb(218,218,218)->rgba(220,226,230,.62). Crops: evidence-r1/{conditions-editor,logaction}--{dark,light}--{base,protoA}.png. shots with A: 572, freeze OK (276/276), (log in scratch).

## Decision needed (Scott)
1. Chips (+icon choices, result chips): accept plugin-token look (prototype A, matches the `.dse-nt__chip` precedent; visible shrink/darken, freeze unaffected, would need real-Obsidian camera/screen-shot sign-off) — OR keep today's Obsidian look via Obsidian-token pins with literal fallbacks (var(--input-height,30px), var(--interactive-normal,#333/#fff per scheme), var(--text-normal,...)), which is zero-pixel but puts harness-only literals in product CSS.
2. Swatch: needs its own design (size/plate shadow/font + focus ring) which overlaps SC-361; options: fold into this ticket under the same A/B choice, or declare swatch a known leak owned by SC-361 (needs an explicit allowlist in the pass).
After the decision: finish fix + jsdom pin (extend test/dom/theme/hostRegrounding.test.ts), SKILL.md "Button host-leak sweep" bullet, then lifecycle/e2e/shots/parity.

Drive-by fixes: none.
Follow-ups: (1) gallery never mounts a pressed aria-pressed toggle (0 true of 29) — pressed-state host-leak only covered in modals; (2) Legacy/Migration modals not openable in harness (entry.ts hook); (3) SKILL.md exemption count 12 vs measured 10; (4) freeze covers print PNGs only, so "zero pixel change" for screen controls needs a screen-shot md5 or camera check; (5) shots exit code: run.sh must use devbox's propagated rc (devbox sh eats $? inside bash -c).

Artifacts: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/evidence-r1/ (patch, logs, 8 crops). Scratch logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r1-impl-1066586/ (modal-prefix.log, modal-protoA3.log, shots-protoA.log, freeze-protoA.log, jest.log).

## Round 1b
STATUS: DONE (evidence + swatch allowlist). dse branch head 9f1cf8e (3 commits on ba20072); working tree clean; no superproject commit.
- Real-Obsidian camera (private Xvfb :281, CDP port 9381, scratch udd; Xvfb killed by PID afterwards) captured Conditions editor-open and Log-action (new mode) modals, dark+light, for TODAY / A / A30. Camera edit (4 extra MODAL_SHOTS + chip metrics) was an uncommitted temp change, saved as evidence-r1/sc356-camera-temp-evidence.patch and reverted.
- Real Obsidian confirms the harness numbers: TODAY chips are 30px, fill rgb(51,51,51) dark / #fff light, idle ink rgb(218,218,218) dark / rgb(34,34,34) light.
- A: icon choices 26.39px, duration/effect + Result chips 21.67px (correction: my r1 summary said Conditions chips 26.39; only the icon choices are). A30: all 30px. A and A30 share fill/ink: dark fill rgb(26,30,33), idle ink rgba(220,226,230,.62); light fill rgb(246,248,248), idle ink rgb(85,89,96); pressed ink unchanged in all variants.
- A30 (evidence-r1/sc356-protoA30.patch: height:30px + display:flex/center + plugin fill + plugin idle ink) makes the Playwright modal pass GREEN for every chip kind; swatch only was left, now allowlisted: pass prints `modal button host-leak OK (9 modal scenarios over 8 modal classes, 36 button kinds x 3 states x dark/light = 216 comparisons ...)` + `100 property difference(s) ALLOWLISTED ... (SC-361: .dse-swatch, 10 properties)`. At base CSS it stays red for the chips only (216 chip lines, 0 swatch lines).
- Allowlist (commit 9f1cf8e): HOSTLEAK_KNOWN_LEAKS, one entry (SC-361, ConditionsModal, class list exactly `dse-swatch`, 10 properties w/h/height/boxShadow/color/fontSize/fontFamily/whiteSpace/outlineStyle/outlineWidth, idle and pressed); fails if any listed property stops leaking (forces removal); count printed. Note: 30px pin is a literal, so on mobile (--input-height 40px) A30 chips would be 30 where today they are 40.
- Composites (native resolution, <=1084px wide): evidence-r1b/sc356-{conditions,logaction}-{dark,light}-variants.png. Logs: evidence-r1b/cam-{today,A,A30}.log, modal-A30-allow.log.
