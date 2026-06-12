/* Line icons (Material/Lucide geometry) for the preview crests.
   In the real repo these are Material icons (:material-…:) — same shapes. */
window.SCICON = {
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkles: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/>',
  package:  '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.27 9 5.15"/>',
  briefcase:'<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  alert:    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  sword:    '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
  wand:     '<path d="m3 21 9-9"/><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="M12.2 6.2 11 5"/>',
  scroll:   '<path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  gem:      '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  crown:    '<path d="M11.6 3.3a.5.5 0 0 1 .9 0l2.3 4.6a.5.5 0 0 0 .7.2l4.2-2.4a.5.5 0 0 1 .7.6l-2.3 9a1 1 0 0 1-1 .8H6.9a1 1 0 0 1-1-.8l-2.3-9a.5.5 0 0 1 .7-.6l4.2 2.4a.5.5 0 0 0 .7-.2Z"/><path d="M5 21h14"/>',
  map:      '<path d="M14.1 4.2a2 2 0 0 0-1.3 0L8.4 5.6a2 2 0 0 1-1.3 0L4 4.5A1 1 0 0 0 3 5.4v12.8a1 1 0 0 0 .7.9l3.4 1.1a2 2 0 0 0 1.3 0l4.4-1.4a2 2 0 0 1 1.3 0l3.1 1.1a1 1 0 0 0 1.3-.9V6.4a1 1 0 0 0-.7-.9Z"/><path d="M9 5v15"/><path d="M15 4v15"/>',
  star:     '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  zap:      '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  move:     '<path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/>',
  speech:   '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  briefcase:'<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  arrow:    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
};
window.scSvg = function (name, size) {
  return '<svg viewBox="0 0 24 24" width="' + (size||19) + '" height="' + (size||19) +
    '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    (window.SCICON[name] || '') + '</svg>';
};
