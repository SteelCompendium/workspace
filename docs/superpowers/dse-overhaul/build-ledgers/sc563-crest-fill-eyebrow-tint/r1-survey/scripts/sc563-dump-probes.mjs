// Writes each SC-563 probe as a standalone CSS file under ../probes/ (fontUrl = the v2 worktree OTF;
// a real implementation embeds the font as a data: URI the way styles-source.css embeds Source Serif 4).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { iconOptions, EYEBROW_OPTIONS, SC368_A, CONTROL_UNSCOPED } from './sc563-probes.mjs';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'probes');
fs.mkdirSync(OUT, { recursive: true });
const FONT_URL = 'file:///home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/v2/docs/fonts/DrawSteelGlyphs-Regular.otf';
const I = iconOptions(FONT_URL);
const files = {
	'probe-I1-site-glyph-font.css': I.I1.css,
	'probe-I2-fill-outline.css': I.I2.css,
	'probe-I3-heavier-stroke.css': I.I3.css,
	'probe-EA-copy-site-tint.css': EYEBROW_OPTIONS.EA.css,
	'probe-EC-diamond-only.css': EYEBROW_OPTIONS.EC.css,
	'probe-sc368-A-name-ink.css': SC368_A,
	'probe-UNION-all-options.css': [I.I1.css, I.I2.css, I.I3.css, EYEBROW_OPTIONS.EA.css, EYEBROW_OPTIONS.EC.css].join('\n'),
	'control-UNSCOPED-not-an-option.css': CONTROL_UNSCOPED,
};
for (const [f, css] of Object.entries(files)) fs.writeFileSync(path.join(OUT, f), `/* SC-563 r1 probe (addStyleTag only; never in source) */\n${css}\n`);
console.log(Object.keys(files).join('\n'));
