/* Clean line icons (Lucide geometry) for navigation + page operations.
   Game mechanics keep the DrawSteelGlyphs font; these are UI icons only. */
const RD_ICON_PATHS = {
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkles: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/>',
  package:  '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.27 9 5.15"/>',
  briefcase:'<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  alert:    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  star:     '<path d="M11.5 2.6a.55.55 0 0 1 1 0l2.6 5.27 5.8.84a.55.55 0 0 1 .3.94l-4.2 4.1 1 5.78a.55.55 0 0 1-.8.58L12 17.5l-5.2 2.73a.55.55 0 0 1-.8-.58l1-5.78-4.2-4.1a.55.55 0 0 1 .3-.94l5.8-.84Z"/>',
  gem:      '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  crown:    '<path d="M11.6 3.3a.5.5 0 0 1 .9 0l2.3 4.6a.5.5 0 0 0 .7.2l4.2-2.4a.5.5 0 0 1 .7.6l-2.3 9a1 1 0 0 1-1 .8H6.9a1 1 0 0 1-1-.8l-2.3-9a.5.5 0 0 1 .7-.6l4.2 2.4a.5.5 0 0 0 .7-.2Z"/><path d="M5 21h14"/>',
  coins:    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  search:   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  copy:     '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
  link:     '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  chevron:  '<path d="m9 18 6-6-6-6"/>',
  chevronD: '<path d="m6 9 6 6 6-6"/>',
  arrow:    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  sword:    '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
  wand:     '<path d="m3 21 9-9"/><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
  map:      '<path d="M14.1 4.2a2 2 0 0 0-1.3 0L8.4 5.6a2 2 0 0 1-1.3 0L4 4.5A1 1 0 0 0 3 5.4v12.8a1 1 0 0 0 .7.9l3.4 1.1a2 2 0 0 0 1.3 0l4.4-1.4a2 2 0 0 1 1.3 0l3.1 1.1a1 1 0 0 0 1.3-.9V6.4a1 1 0 0 0-.7-.9Z"/><path d="M9 5v15"/><path d="M15 4v15"/>',
  filter:   '<path d="M3 4h18l-7 8v6l-4 2v-8Z"/>',
  scroll:   '<path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>'
};

function Icon({ name, size = 24, stroke = 1.6, style, className }) {
  const p = RD_ICON_PATHS[name] || "";
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={style}
      dangerouslySetInnerHTML={{ __html: p }} />
  );
}
window.Icon = Icon;
