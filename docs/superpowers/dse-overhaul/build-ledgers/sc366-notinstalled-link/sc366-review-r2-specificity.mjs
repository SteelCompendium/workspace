import { chromium } from '/home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements/node_modules/playwright/index.mjs';
const pageUrl = 'file:///home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements/visual-harness/index.html';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const probes = [
  ['(0,3,0) later-loaded', '.markdown-rendered .block-language-ds-scc .external-link'],
  ['(0,3,1) later-loaded', '.markdown-rendered .block-language-ds-scc a.external-link'],
  ['(0,3,0) earlier-loaded', '.markdown-rendered .block-language-ds-scc .external-link', true],
];
for (const [label, sel, early] of probes) {
  const page = await browser.newPage();
  await page.goto(`${pageUrl}?element=perk&fixture=default&theme=steel&bg=dark&sheet=1`);
  await page.waitForFunction(() => window.__dseHarnessDone !== undefined);
  const r = await page.evaluate(({ sel, early }) => {
    const root = document.querySelector('[data-dse-element]');
    const mount = document.getElementById('mount');
    const host = mount.createDiv({ cls: 'markdown-preview-view markdown-rendered' }).createDiv({ cls: 'block-language-ds-scc' });
    host.appendChild(root); root.empty();
    const card = root.createDiv({ cls: 'dse-ref-notice dse-ref-web-card' });
    card.createEl('a', { cls: 'dse-ref-web-card__link external-link', text: 'x', href: 'https://e/' });
    root.createDiv({ cls: 'dse-card' }).createEl('a', { cls: 'external-link', text: 'fam', href: 'https://e/', attr: { id: 'fam' } });
    const st = document.createElement('style'); st.textContent = `${sel} { color: rgb(255, 0, 0); }`;
    if (early) document.head.prepend(st); else document.head.append(st);
    return { link: getComputedStyle(document.querySelector('.dse-ref-web-card__link')).color, fam: getComputedStyle(document.getElementById('fam')).color };
  }, { sel, early: !!early });
  console.log(label.padEnd(24), 'link', r.link, '| family', r.fam, '| same:', r.link === r.fam);
  await page.close();
}
await browser.close();
