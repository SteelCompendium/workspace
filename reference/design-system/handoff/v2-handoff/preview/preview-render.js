/* Renders the redesigned Browse landing + category indexes using the SAME markup
   the v2 site / steel-etl (cards.go) emits, styled by steel-redesign.css.
   This is the review surface for the index-card revisions. */
(function () {
  var S = window.scSvg;
  function crest(name, lg) {
    return '<span class="sc-crest' + (lg ? ' lg' : '') + '"><span>' + S(name, lg ? 24 : 19) + '</span></span>';
  }

  /* ── Browse landing (count badges removed) ─────────────────────────────── */
  var cats = [
    { icon: "shield",   title: "Classes",       blurb: "Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent, Troubadour", link: "View Classes" },
    { icon: "users",    title: "Ancestries",    blurb: "Devil, Dwarf, Hakaan, High Elf, Human, Memonek, Orc, Polder, Revenant, Wode Elf", link: "View Ancestries" },
    { icon: "sparkles", title: "Abilities",     blurb: "Every class & kit ability, organized by class and level", link: "View Abilities" },
    { icon: "package",  title: "Kits",          blurb: "Martial, caster & hybrid loadouts — Battlemind, Mountain, Panther, Spellsword and more", link: "View Kits" },
    { icon: "briefcase",title: "Careers",       blurb: "Agent, Aristocrat, Artisan, Criminal, Gladiator, Sage, Soldier and more", link: "View Careers" },
    { icon: "alert",    title: "Complications", blurb: "Backstory hooks that add depth — and a benefit and a drawback — to your hero", link: "View Complications" }
  ];

  function landing() {
    var lis = cats.map(function (c) {
      // mirrors Material's output for:  ### :material-x:{ .sc-crest } Title
      // (browse-enhancements.js still appends .browse-card-count; CSS now hides it)
      return '<li>' +
        '<h3><span class="twemoji sc-crest">' + S(c.icon, 19) + '</span> ' + c.title + '</h3>' +
        '<hr>' +
        '<p>' + c.blurb + '</p>' +
        '<p><a href="#">' + S("arrow", 15) + ' ' + c.link + '</a></p>' +
      '</li>';
    }).join("");
    return '<h1>Browse Rules</h1>' +
      '<p>Look up specific rules, abilities, and character options. Use <strong>search</strong> or pick a category below.</p>' +
      '<div class="grid cards"><ul>' + lis + '</ul></div>';
  }

  /* ── Kit index — full stat set (defense row + offense row) ─────────────── */
  // Cloak & Dagger shows melee + ranged + distance all populated; Arcane Archer
  // shows the weapon fix ("Bow", not "— weapon") and a ranged-only loadout.
  var kits = [
    { klass:"caster",  type:"Psionic", name:"Battlemind",      equip:"Light armor · Medium weapon", stam:"+3", spd:"+2", stab:"+1", dis:"0",  melee:"+2/+2/+2", ranged:"—",       dist:"—",  sig:"Unmooring",       sigType:"strike" },
    { klass:"martial", type:"Martial", name:"Mountain",        equip:"Heavy armor · Heavy weapon",  stam:"+9", spd:"0",  stab:"+2", dis:"0",  melee:"+0/+0/+4", ranged:"—",       dist:"—",  sig:"Pain for Pain",   sigType:"strike" },
    { klass:"martial", type:"Martial", name:"Cloak and Dagger",equip:"Light armor · Light weapon",  stam:"+3", spd:"+2", stab:"0",  dis:"+1", melee:"+1/+1/+1", ranged:"+1/+1/+1",dist:"+1", sig:"Twin Fangs",      sigType:"ranged" },
    { klass:"caster",  type:"Magic",   name:"Arcane Archer",   equip:"Medium armor · Bow",          stam:"+6", spd:"+1", stab:"+1", dis:"0",  melee:"—",        ranged:"+1/+1/+1",dist:"+2", sig:"Enchanted Arrow", sigType:"ranged" },
    { klass:"martial", type:"Martial", name:"Sword and Board", equip:"Heavy armor · Medium weapon", stam:"+6", spd:"0",  stab:"+1", dis:"0",  melee:"+2/+2/+2", ranged:"—",       dist:"—",  sig:"Shield Bash",     sigType:"strike" },
    { klass:"martial", type:"Martial", name:"Panther",         equip:"Light armor · Light weapon",  stam:"+3", spd:"+3", stab:"0",  dis:"+2", melee:"+1/+1/+1", ranged:"—",       dist:"—",  sig:"Pouncing Strike", sigType:"strike" }
  ];

  function statCell(v, l, dmg) {
    var style = (v && v.length > 4) ? ' style="font-size:.72rem"' : '';
    return '<div class="sc-card__stat' + (dmg ? ' is-dmg' : '') + '"><div class="v"' + style + '>' + v + '</div><div class="l">' + l + '</div></div>';
  }
  function statsRow(arr) {
    return '<div class="sc-card__stats" style="grid-template-columns:repeat(' + arr.length + ',1fr)">' +
      arr.map(function (s) { return statCell(s[0], s[1], s[2]); }).join("") + '</div>';
  }

  function kitIndex() {
    var cards = kits.map(function (k) {
      return '<a class="sc-card sc-fil" href="#">' +
        '<div class="sc-card__head">' + crest(k.klass === "caster" ? "wand" : "shield") +
          '<div><div class="sc-card__type">' + k.type + ' Kit</div>' +
          '<div class="sc-card__name">' + k.name + '</div></div></div>' +
        '<div class="sc-card__equip">' + k.equip + '</div>' +
        statsRow([[k.stam, "Stamina"], [k.spd, "Speed"], [k.stab, "Stability"], [k.dis, "Disengage"]]) +
        statsRow([[k.melee, "Melee Dmg", true], [k.ranged, "Ranged Dmg", true], [k.dist, "Distance"]]) +
        '<div class="sc-card__sig">' +
          '<span class="sc-card__dot" data-type="' + k.sigType + '"></span>' +
          '<span class="sc-card__sig-label">Signature</span>' +
          '<span class="sc-card__sig-name">' + k.sig + '</span>' +
        '</div>' +
      '</a>';
    }).join("");
    return '<div class="crumb">Browse / Kits</div>' +
      '<h1>Kits</h1><hr>' +
      '<p>Equipment loadouts that shape how your hero fights. Every kit now shows its full stat line — Stamina, Speed, Stability, Disengage, plus melee &amp; ranged damage and distance.</p>' +
      '<div class="sc-cards">' + cards + '</div>';
  }

  /* ── Grid index gallery (one new card per non-wide type) ───────────────── */
  function headHTML(icon, type, name) {
    return '<div class="sc-card__head">' + crest(icon) +
      '<div><div class="sc-card__type">' + type + '</div>' +
      '<div class="sc-card__name">' + name + '</div></div></div>';
  }
  function tagsHTML(arr) { return '<div class="sc-card__tags">' + arr.map(function (t) { return '<span class="sc-tag">' + t + '</span>'; }).join("") + '</div>'; }
  function lineHTML(label, val) { return '<div class="sc-card__line"><b>' + label + '</b> ' + val + '</div>'; }
  function lineHL(label, val) { return lineHTML(label, '<span class="hl">' + val + '</span>'); }
  function flavorHTML(t) { return '<div class="sc-card__flavor">' + t + '</div>'; }
  function primerHTML(t) { return '<div class="sc-card__primer">' + t + '</div>'; }
  function blurbHTML(t) { return '<div class="sc-card__blurb">' + t + '</div>'; }
  function card(icon, type, name, inner) { return '<a class="sc-card sc-fil" href="#">' + headHTML(icon, type, name) + inner + '</a>'; }

  function gridIndexes() {
    var c = [
      // class — now carries a clamped primer
      card("shield", "Class", "Conduit", lineHL("Heroic Resource", "Piety") + tagsHTML(["Intuition", "Presence"]) +
        primerHTML("Conduits are the chosen of the gods, channeling divine power to heal allies and smite foes. You petition your deity for Piety each turn, spending it on prayers that mend wounds, shield the faithful, and call down judgment. Where the Censor enforces, the Conduit sustains — the steadfast heart of any party of heroes.")),
      card("shield", "Class", "Tactician", lineHL("Heroic Resource", "Focus") + tagsHTML(["Might", "Reason"]) +
        primerHTML("The Tactician reads the battlefield like a board, turning allies into a coordinated machine. You bank Focus by marking targets and issuing orders, then spend it to grant extra moves, strikes, and positioning that win fights before they start.")),
      // ancestry — now includes first-paragraph flavor
      card("users", "Ancestry", "Human", lineHL("Signature Trait", "Resourceful") +
        flavorHTML("Ambitious and adaptable, humans throw themselves into every cause with a fervor the older peoples find equal parts inspiring and reckless.")),
      card("users", "Ancestry", "Dwarf", lineHL("Signature Trait", "Stand Strong") +
        flavorHTML("Carved from the bones of the mountains, dwarves endure where others falter — patient, unyielding, and slow to forget a debt or a slight.")),
      // career — flavor + 4 stat cards + Skills/Perk text
      card("briefcase", "Career", "Soldier",
        flavorHTML("You served in an army, a militia, or a mercenary company, and you carry its discipline still.") +
        statsRow([["1", "Languages"], ["240", "Project Pts"], ["+1", "Renown"], ["+1", "Wealth"]]) +
        lineHTML("Skills", "Two skills from the intrigue or interpersonal skill groups, plus one from the exploration group") +
        lineHTML("Perk", "Tough as Nails — you gain an edge on tests to resist being weakened")),
      card("briefcase", "Career", "Sage",
        flavorHTML("You devoted years to study, and the world's hidden workings are an open book to you.") +
        statsRow([["2", "Languages"], ["360", "Project Pts"], ["0", "Renown"], ["+1", "Wealth"]]) +
        lineHTML("Skills", "Four skills from the lore skill group") +
        lineHTML("Perk", "Quick Study — once per respite, gain a skill you don't have until your next respite")),
      // culture — now shows Skill Options
      card("map", "Culture", "Nomadic", tagsHTML(["Nomadic", "Communal", "Traditional"]) +
        lineHTML("Skill Options", "Any one skill from the exploration skill group, plus Ride or Navigate")),
      card("map", "Culture", "Urban", tagsHTML(["Urban", "Bureaucratic", "Creative"]) +
        lineHTML("Skill Options", "Any one skill from the interpersonal or intrigue groups")),
      // title — full flavor (no truncation) + prerequisite
      card("crown", "Echelon 1", "Hero of the People",
        flavorHTML("Word of your deeds has spread through the common folk, who name you their champion. When the powerful look down on the helpless, they find you standing in the way — and the people remember it.") +
        lineHL("Prerequisite", "5 Renown, and you have aided a settlement in need")),
      // simple types — condition / skill (no ellipsis) / movement / negotiation
      card("zap", "Condition", "Frightened", blurbHTML("You can't willingly move closer to the source, and abilities you use against it take a bane.")),
      card("star", "Skill", "Eavesdrop", blurbHTML("You can listen in on a conversation through a door, wall, or other barrier, or pick a single voice out of a noisy crowd.")),
      card("move", "Movement", "Climb", blurbHTML("Move up, down, or across a vertical surface at half speed unless you have a climb speed.")),
      card("speech", "Negotiation", "Persuade", blurbHTML("Appeal to an NPC's interests or ideals to shift their patience and improve your standing in a negotiation."))
    ];
    return '<div class="crumb">Browse</div><h1>Index Cards</h1><hr>' +
      '<p>One card design per content type — the grid (multi-column) types. Class carries a clamped primer; ancestry, career, and title now lead with flavor; culture shows its skill options.</p>' +
      '<div class="sc-cards">' + c.join("") + '</div>';
  }

  /* ── Wide editorial cards — complications & perks (high-count, text-led) ── */
  function wideCard(icon, type, name, bodyHTML) {
    return '<a class="sc-card sc-card--wide sc-fil" href="#">' +
      crest(icon, true) +
      '<div class="sc-card__namecol"><div class="sc-card__type">' + type + '</div>' +
      '<div class="sc-card__name">' + name + '</div></div>' +
      '<div class="sc-card__body">' + bodyHTML + '</div></a>';
  }
  function wideIndexes() {
    var comps = [
      wideCard("alert", "Complication", "Haunted", flavorHTML("A restless spirit has attached itself to you, whispering at the edge of hearing and chilling every room you enter.")),
      wideCard("alert", "Complication", "Marked for Death", flavorHTML("A powerful enemy has put a price on your head, and the bounty hunters who come for it are rarely subtle.")),
      wideCard("alert", "Complication", "Sworn Enemy", flavorHTML("You and another creature share a hatred so old and so total that neither of you can let the other live in peace.")),
      wideCard("alert", "Complication", "Touched by Fate", flavorHTML("Luck bends around you in equal and opposite measure — fortune and ruin arrive together, and never on your schedule."))
    ].join("");
    var perks = [
      wideCard("sparkles", "Crafting Perk", "Alchemist", lineHL("Prerequisite", "the Lore skill") + flavorHTML("You can craft alchemical concoctions during a respite, brewing tinctures and bombs from gathered reagents.")),
      wideCard("sparkles", "Exploration Perk", "Pathfinder", flavorHTML("You always know which way is north, and your party ignores difficult terrain costs while you lead the march.")),
      wideCard("sparkles", "Interpersonal Perk", "Trustworthy Face", lineHL("Prerequisite", "the Persuade skill") + flavorHTML("Strangers are inclined to believe you. You gain an edge on tests made to convince an NPC you mean no harm.")),
      wideCard("sparkles", "Intrigue Perk", "Shadowmeld", flavorHTML("In dim light or darkness you can hide even while observed, slipping from one patch of shadow to the next."))
    ].join("");
    return '<div class="crumb">Browse</div><h1>Wide Cards</h1><hr>' +
      '<p>Complications and perks number in the hundreds and read better as full-width editorial rows. Complications lead with the description/flavor above the benefit &amp; drawback; perks show their prerequisite inline.</p>' +
      '<h2 style="font-family:var(--md-large-header-font);text-transform:uppercase;font-size:1.6rem;color:var(--sc-steel-lighter);margin:1.4rem 0 .2rem">Complications</h2>' +
      '<div class="sc-cards sc-cards--wide">' + comps + '</div>' +
      '<h2 style="font-family:var(--md-large-header-font);text-transform:uppercase;font-size:1.6rem;color:var(--sc-steel-lighter);margin:1.8rem 0 .2rem">Perks</h2>' +
      '<div class="sc-cards sc-cards--wide">' + perks + '</div>';
  }

  /* ── Rules & quotes — the ◆ rule + filigree blockquote demo ─────────────── */
  function typeDemo() {
    var lic =
      '<blockquote><p>The Draw Steel Compendium is an independent product published under the ' +
      'DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. ' +
      'DRAW STEEL &copy; 2025 MCDM Productions, LLC.</p></blockquote>';
    var flavor =
      '<blockquote><p><em>"The power of the gods flows through you. Where you walk, the faithful ' +
      'stand a little taller, and the wicked feel the weight of judgment at their backs."</em></p></blockquote>';
    return '' +
      '<div class="crumb">Browse / Classes / Conduit</div>' +
      '<h1>The Conduit</h1>' +
      '<p>Conduits petition a deity for power each turn, banking <strong>Piety</strong> they spend on prayers ' +
      'that heal, shield, and punish. The ◆ rule below and the framed quotes are the shipped shared ornament — ' +
      'the page-title treatment is parked for now (the plain title above is the current default).</p>' +
      '<hr>' +
      flavor +
      '<p>Flavor text reads as an aside — set in a filigree frame (a raised steel plate with corner brackets ' +
      'and diamonds) rather than a colored left bar. The same frame carries notes, callouts, and the license line.</p>' +
      lic;
  }

  /* ── view switching ─────────────────────────────────────────────────────── */
  var content = document.getElementById("content");
  var views = {
    landing: landing, index: kitIndex, grid: gridIndexes, wide: wideIndexes, type: typeDemo
  };
  var buttons = {
    landing: document.getElementById("bLanding"),
    index:   document.getElementById("bIndex"),
    grid:    document.getElementById("bGrid"),
    wide:    document.getElementById("bWide"),
    type:    document.getElementById("bType")
  };
  function show(which) {
    content.innerHTML = (views[which] || landing)();
    Object.keys(buttons).forEach(function (k) { if (buttons[k]) buttons[k].classList.toggle("on", k === which); });
  }
  Object.keys(buttons).forEach(function (k) { if (buttons[k]) buttons[k].onclick = function () { show(k); }; });
  show("landing");

  var themeBtn = document.getElementById("themeBtn"), dark = true;
  themeBtn.onclick = function () {
    dark = !dark;
    document.documentElement.setAttribute("data-md-color-scheme", dark ? "slate" : "default");
    themeBtn.textContent = dark ? "🌙" : "☀️";
  };
})();
