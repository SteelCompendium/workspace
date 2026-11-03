// SC-552 r3 reviewer probe fixtures (scratch only)
Object.assign(FIXTURES, {
	'Probe552/twin-plain-4.md': `# twin plain 4\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nM1\n\n${COUNTER(5, 'Twin')}\n\nM2\n\n${COUNTER(5, 'Twin')}\n\nM3\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Probe552/twin-crlf.md': `# twin crlf\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nM1\n\n${COUNTER(5, 'Twin')}\n\nM2\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`.replace(/\n/g, '\r\n'),
	'Probe552/twin-callouts-crlf.md': `# twin callouts crlf\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\nM1\n\n${QUOTED(['[!note] Camp'])}\n\nM2\n\n${QUOTED(['[!note] Camp'])}\n\nBOTTOM\n`.replace(/\n/g, '\r\n'),
	'Probe552/single.md': `# single\n\nTOP\n\n${COUNTER(5, 'Solo')}\n\nBOTTOM\n`,
	'Probe552/tall-twins-3.md': `# tall twins 3\n\n${Array.from({ length: 50 }, (_, i) => `para P${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nM1\n\n${COUNTER(5, 'Twin')}\n\nANCHOR\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n\n${Array.from({ length: 50 }, (_, i) => `para Q${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n`,
	'Probe552/tall-twins-2.md': `# tall twins 2\n\n${Array.from({ length: 50 }, (_, i) => `para P${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nANCHOR\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n\n${Array.from({ length: 50 }, (_, i) => `para Q${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n`,
	'Probe552/tall-callouts-3.md': `# tall callouts 3\n\n${Array.from({ length: 50 }, (_, i) => `para P${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\nM1\n\n${QUOTED(['[!note] Camp'])}\n\nANCHOR\n\n${QUOTED(['[!note] Camp'])}\n\nBOTTOM\n\n${Array.from({ length: 50 }, (_, i) => `para Q${i} lorem ipsum dolor sit amet.`).join('\n\n')}\n`,
	'Probe552/twin-mid6.md': `# twin mid6\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nM1\n\n${COUNTER(6, 'Twin')}\n\nM2\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Probe552/twin-callouts-mid6.md': `# twin callouts mid6\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\nM1\n\n${QUOTED(['[!note] Camp'], 6)}\n\nM2\n\n${QUOTED(['[!note] Camp'])}\n\nBOTTOM\n`,
	'Probe552/mixed-kinds.md': `# mixed\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nM1\n\n${COUNTER(5, 'Twin')}\n\nM2\n\n${COUNTER(9, 'Other')}\n\nBOTTOM\n`,
});
