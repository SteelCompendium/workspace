// SC-563 r1 — option probes (CSS injected with Playwright addStyleTag; nothing is written to
// the branch). Every rule is screen-scoped per dse-verify's Steel scoping rule.
export const SC = `[data-dse-theme='steel']:not([data-dse-print="on"])`;

// The ACTION crest: the cardHead crest of a feature root that carries an action type
// (renderFeature.ts:592 stamps data-dse-act). Standalone ability/trait cards, kit
// signature abilities, hero-sheet ability cards, statblock sub-features. NOT the
// statblock/class/kit/montage/negotiation/display-family role crests (no data-dse-act on
// their head's parent) and NOT the stamina crest (.dse-stamina__crest-glyph).
export const ACT_CREST = `${SC} .dse-feature[data-dse-act] > .dse-head > .dse-crest`;
// villain keeps its outline skull under the fill option (eyes/nose would fill into a blob)
export const ACT_CREST_NOVILLAIN = `${SC} .dse-feature[data-dse-act]:not([data-dse-act='villain']) > .dse-head > .dse-crest`;

// site's DrawSteelGlyphs codepoints (steel-etl ability_cards.go:88-110, trait_cards.go:76)
export const SITE_GLYPH = { main: 'l', maneuver: 'f', triggered: ')', move: 'o', none: '*', trait: '*' };

export function fontFace(url) {
	return `@font-face { font-family: "DrawSteelGlyphs"; src: url("${url}") format("opentype"); font-display: block; }\n`;
}

export function iconOptions(fontUrl) {
	const perAct = Object.entries(SITE_GLYPH)
		.map(([act, g]) => `${SC} .dse-feature[data-dse-act='${act}'] > .dse-head > .dse-crest .dse-crest__glyph::before { content: "${g}"; }`)
		.join('\n');
	return {
		// I1 — adopt the site's glyphs (same font asset, same codepoints). Glyph size is a FRACTION
		// of the crest: site 25px glyph in a 60px-wide crest = 0.4167; plugin crest is 3em wide,
		// so 1.25em. villain has no site crest glyph -> keeps its Lucide skull.
		I1: {
			title: 'I1: site glyph font (DrawSteelGlyphs, filled)',
			css:
				fontFace(fontUrl) +
				`${SC} .dse-feature[data-dse-act]:not([data-dse-act='villain']) > .dse-head > .dse-crest .dse-crest__glyph svg { display: none; }
${SC} .dse-feature[data-dse-act]:not([data-dse-act='villain']) > .dse-head > .dse-crest .dse-crest__glyph::before {
	font-family: "DrawSteelGlyphs", sans-serif; font-size: 1.25em; line-height: 1; -webkit-font-smoothing: antialiased;
}
${perAct}`,
		},
		// I2 — fill the existing Lucide outline paths (stroke kept so line-only strokes survive)
		I2: {
			title: 'I2: fill the Lucide outline (fill: currentColor)',
			css: `${ACT_CREST_NOVILLAIN} .dse-crest__glyph svg { fill: currentColor; }`,
		},
		// I3 — heavier stroke only (harness/lucide default 2; real Obsidian svg.svg-icon 1.75px)
		I3: {
			title: 'I3: heavier stroke (stroke-width 3)',
			css: `${ACT_CREST} .dse-crest__glyph svg { stroke-width: 3px; }`,
		},
	};
}

// Trait-family eyebrow. Site: `.sc-trait > .sc-head .sc-head__left-eyebrow` (steel-traits.css:117-118)
// = trait cards + sub-traits nested in a trait card; NOT statblock/featureblock sub-features
// (the site draws no eyebrow there).
export const TRAIT_EYEBROW = `${SC} .dse-feature[data-dse-act='trait']:not(:is(.dse-sb, .dse-fb) .dse-feature) > .dse-head > .dse-head__eyebrow--left`;
export const EYEBROW_OPTIONS = {
	EA: {
		title: 'E-A: copy the site (word + diamond in the trait accent)',
		css: `${TRAIT_EYEBROW} { color: var(--dse-act); }\n${TRAIT_EYEBROW}::before { background: var(--dse-act); }`,
	},
	EC: {
		title: 'E-C: diamond only in the trait accent (word stays grey)',
		css: `${TRAIT_EYEBROW}::before { background: var(--dse-act); }`,
	},
};

// SC-368's options as name-ink probes, for the composition question (copied from
// sc368-r1-options.mjs: A = per family, trait name -> steel-lighter).
export const SC368_TOKEN = `
:is([data-dse-element], .dse-modal)[data-dse-theme="steel"] { --sc368-steel-lighter: #cdd1d4; }
.theme-light :is([data-dse-element], .dse-modal)[data-dse-theme="steel"] { --sc368-steel-lighter: #5f686d; }
`;
export const SC368_A = SC368_TOKEN + `${SC}[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-head__primary--left { color: var(--sc368-steel-lighter) !important; }`;

// Controls (never options): prove the print measurements CAN move.
export const CONTROL_UNSCOPED = `.dse-crest { display: grid !important; } .dse-crest__glyph svg { fill: currentColor !important; stroke-width: 3px !important; }
.dse-feature[data-dse-act] .dse-head__eyebrow--left { display: inline-flex !important; color: #7d3c98 !important; }`;
