/* Preview surface for the feature & treasure INDEX pages — renders the
   redesigned index-of-indexes (folder) cards, the trait/ability preview
   cards, and the live search/sort/filter browser, all on the production
   steel-indexes.css + steel-feature-browser.js. Sample data only. */
(function () {
  var S = window.scSvg;
  var CHEV = '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';

  /* ── folder (index-of-indexes) card ─────────────────────────────────────── */
  function folder(icon, name, count, unit, sub) {
    return '<a class="sc-folder" href="#">' +
      '<span class="sc-crest sc-folder__crest"><span>' + S(icon, 18) + '</span></span>' +
      '<div class="sc-folder__main"><h3 class="sc-folder__name">' + name + '</h3>' +
        (sub ? '<div class="sc-folder__sub">' + sub + '</div>' : '') + '</div>' +
      '<div class="sc-folder__meta">' +
        (count != null ? '<span class="sc-folder__count">' + count + (unit ? '<span class="u">' + unit + '</span>' : '') + '</span>' : '') +
        '<span class="sc-folder__chev">' + CHEV + '</span>' +
      '</div></a>';
  }

  /* ── sample content ─────────────────────────────────────────────────────── */
  var classes = [
    ["shield", "Censor",       "Exorcist · Oracle · Paragon"],
    ["sparkles", "Conduit",    "Domains of the divine"],
    ["zap", "Elementalist",    "Earth · Fire · Green · Heat · Void"],
    ["sword", "Fury",          "Berserker · Reaver · Stormwight"],
    ["star", "Null",           "Chronokinetic · Cryokinetic"],
    ["move", "Shadow",         "Black Ash · Caustic · Harlequin"],
    ["users", "Tactician",     "Insurgent · Mastermind · Vanguard"],
    ["wand", "Talent",         "Chronopathy · Telekinesis · Telepathy"],
    ["speech", "Troubadour",   "Duelist · Virtuoso"],
    ["crown", "Dragon Knight", "Draconic legacy"]
  ];
  // counts of features per Censor level (from the live tree)
  var censorLevels = [21, 9, 2, 17, 5, 3, 16, 6, 2, 6];
  var levelLead = {
    1: "Order, deity & domains, Wrath, your signature kit & abilities",
    2: "2nd-level order features, A Sense for Truth, Stalwart Icon",
    4: "Domain feature, characteristic increase, order epiphanies"
  };

  // Censor Level 1 — TRAIT previews (parent-of-leaf)
  var censorL1Traits = [
    { kind: "trait", name: "Censor Order", klass: "Censor", level: 1, benefits: 3, flavor: "Choose the Exorcist, Oracle, or Paragon order. Your choice shapes your Wrath abilities and grants a distinct benefit." },
    { kind: "trait", name: "Deity and Domains", klass: "Censor", level: 1, benefits: 2, flavor: "Choose a god or saint who you revere, then two domains that reflect their portfolio and your devotion." },
    { kind: "trait", name: "Judgment", klass: "Censor", level: 1, action: "maneuver", grants: "the Judgment maneuver", flavor: "As a maneuver, pass judgment on one enemy. While judged, your strikes against them build Wrath far faster." },
    { kind: "trait", name: "Sanctified Weapon", klass: "Censor", level: 1, action: "main", grants: "a signature strike", flavor: "Your faith arms you. A weapon you wield becomes a holy implement that deals extra damage to the judged." },
    { kind: "trait", name: "Wrath", klass: "Censor", level: 1, tag: "Resource", flavor: "Your Heroic Resource. You gain Wrath at the start of each combat and whenever a creature you've judged is defeated." },
    { kind: "trait", name: "Inner Light", klass: "Censor", level: 1, flavor: "The radiance of your conviction wards those near you, lending allies an edge against fear and despair." }
  ];

  // Censor — ABILITY previews (parent-of-leaf)
  var censorAbilities = [
    { kind: "ability", name: "Judgment", klass: "Censor", level: 1, action: "maneuver", cost: "Signature", keywords: ["Magic"], distance: "Ranged **10**", targets: "One enemy" },
    { kind: "ability", name: "Sanctified Strike", klass: "Censor", level: 1, action: "main", cost: "Signature", keywords: ["Melee", "Strike", "Weapon"], distance: "Melee **1**", targets: "One creature" },
    { kind: "ability", name: "Censure", klass: "Censor", level: 1, action: "triggered", cost: "3 Wrath", keywords: ["Magic"], distance: "Ranged **10**", targets: "One enemy" },
    { kind: "ability", name: "Stand Fast!", klass: "Censor", level: 5, action: "main", cost: "5 Wrath", keywords: ["Area", "Magic"], distance: "Burst **2**", targets: "Each ally" },
    { kind: "ability", name: "Word of Death Deferred", klass: "Censor", level: 7, action: "triggered", cost: "7 Wrath", keywords: ["Magic"], distance: "Ranged **10**", targets: "One ally" },
    { kind: "ability", name: "Look On My Work", klass: "Censor", level: 3, action: "main", cost: "7 Wrath", keywords: ["Magic", "Ranged"], distance: "Ranged **10**", targets: "Each enemy" }
  ];

  // wider browse dataset (multi-class, multi-level) for the filter demo
  var browseData = censorL1Traits.map(withHref).concat(censorAbilities.map(withHref)).concat([
    { kind: "trait", name: "Stalwart Icon", klass: "Censor", level: 2, flavor: "You become a beacon on the battlefield; enemies that target your allies must contend with you first." },
    { kind: "trait", name: "Domains of the Faithful", klass: "Conduit", level: 1, benefits: 2, flavor: "Choose two domains. Each grants a domain feature and an effect you can call upon during a respite." },
    { kind: "trait", name: "Piety", klass: "Conduit", level: 1, tag: "Resource", flavor: "Your Heroic Resource, granted by your god each turn and spent on prayers, blessings, and divine wrath." },
    { kind: "ability", name: "Bolt of Judgment", klass: "Conduit", level: 1, action: "main", cost: "Signature", keywords: ["Magic", "Ranged"], distance: "Ranged **10**", targets: "One creature" },
    { kind: "ability", name: "Healing Grace", klass: "Conduit", level: 1, action: "maneuver", cost: "3 Piety", keywords: ["Magic"], distance: "Ranged **5**", targets: "One ally" },
    { kind: "ability", name: "Wrath of the Gods", klass: "Conduit", level: 9, action: "main", cost: "9 Piety", keywords: ["Area", "Magic"], distance: "Burst **3**", targets: "Each enemy" },
    { kind: "trait", name: "Field Arsenal", klass: "Tactician", level: 1, benefits: 3, flavor: "Choose a tactical doctrine that defines how you mark targets and turn your allies into a single instrument." },
    { kind: "trait", name: "Focus", klass: "Tactician", level: 1, tag: "Resource", flavor: "Your Heroic Resource. You bank Focus by marking enemies and spend it to grant allies extra movement and strikes." },
    { kind: "ability", name: "Mark", klass: "Tactician", level: 1, action: "maneuver", cost: "Signature", keywords: ["Strike", "Weapon"], distance: "Ranged **10**", targets: "One enemy" },
    { kind: "ability", name: "Seize the Opening", klass: "Tactician", level: 2, action: "triggered", cost: "2 Focus", keywords: ["Strike"], distance: "Melee **1**", targets: "One creature" },
    { kind: "ability", name: "Strike Now!", klass: "Tactician", level: 4, action: "main", cost: "5 Focus", keywords: ["Area"], distance: "Burst **1**", targets: "Each ally" }
  ]);
  function withHref(it) { it.href = "#"; return it; }

  /* ── views ──────────────────────────────────────────────────────────────── */
  function crumb(t) { return '<div class="crumb">' + t + '</div>'; }
  function intro(h1, p) { return '<h1>' + h1 + '</h1><hr><p>' + p + '</p>'; }

  function vFeature() {
    return crumb("Browse / Feature") + intro("Features",
      "Class and ancestry features — split into <strong>traits</strong> (what your hero is) and <strong>abilities</strong> (what your hero does). Pick a branch, or use Search &amp; Filter to cut straight to a single feature.") +
      '<div class="sc-folders sc-folders--lg">' +
        folder("scroll", "Traits", 612, "", "Heroic resources, signature kit, order &amp; domain features — organized by class and level") +
        folder("sparkles", "Abilities", 438, "", "Every class ability, maneuver, and triggered action — by class and level") +
      '</div>';
  }
  function vTraitClasses() {
    var cards = classes.map(function (c) {
      return folder(c[0], c[1], 10, "lv", c[2]);
    }).join("");
    return crumb("Browse / Feature / Trait") + intro("Traits",
      "Choose a class or ancestry. Each holds ten levels of traits — from your 1st-level order and domains up to your 10th-level capstone.") +
      '<div class="sc-folders">' + cards + '</div>';
  }
  function vCensorLevels() {
    var cards = censorLevels.map(function (n, i) {
      var lv = i + 1;
      return folder("shield", "Level " + lv, n, "feat", levelLead[lv] || "Level " + lv + " features &amp; abilities");
    }).join("");
    return crumb("Browse / Feature / Trait / Censor") + intro("Censor",
      "Sentinels who hunt those who abuse divine power. Ten levels of traits and abilities — pick a level to see its cards.") +
      '<div class="sc-folders">' + cards + '</div>';
  }
  function vTraitIndex() {
    var cards = censorL1Traits.map(function (it) { return window.SCBrowse.card(it, { context: false }); }).join("");
    return crumb("Browse / Feature / Trait / Censor / Level 1") + intro("Censor — Level 1",
      "Your founding traits as a Censor. Each card previews a feature; open one for its full rules, nested abilities, and benefits.") +
      '<div class="sc-prevs">' + cards + '</div>';
  }
  function vAbilityIndex() {
    var cards = censorAbilities.map(function (it) { return window.SCBrowse.card(it, { context: false }); }).join("");
    return crumb("Browse / Feature / Ability / Censor") + intro("Censor — Abilities",
      "Every Censor ability as a scannable preview — action type, cost, keywords, distance and targets at a glance. Open one for its power roll and effects.") +
      '<div class="sc-prevs">' + cards + '</div>';
  }
  function vTreasure() {
    return crumb("Browse / Treasure") + intro("Treasures",
      "Rewards earned through adventure — organized by echelon, plus artifacts and leveled gear. Pick a branch to keep browsing.") +
      '<div class="sc-folders">' +
        folder("gem", "1st Echelon", 2, "sets", "Consumables &amp; trinkets for levels 1–3 heroes") +
        folder("gem", "2nd Echelon", 2, "sets", "Consumables &amp; trinkets for levels 4–6 heroes") +
        folder("gem", "3rd Echelon", 2, "sets", "Consumables &amp; trinkets for levels 7–9 heroes") +
        folder("gem", "4th Echelon", 2, "sets", "Consumables &amp; trinkets for the mightiest heroes") +
        folder("crown", "Artifacts", 3, "", "Blade of a Thousand Years, Encepter, Mortal Coil") +
        folder("package", "Leveled", 4, "kinds", "Armor, implements, weapons &amp; other gear that grows with you") +
      '</div>';
  }
  function vBrowse() {
    return crumb("Browse / Feature") + '<h1>Search &amp; Filter</h1><hr>' +
      '<p>The whole feature tree on one page. Search by name, filter by type, class, level, action or keyword, and sort — then jump straight to the card you need. No folder-by-folder drilling required.</p>' +
      '<div class="sc-browse-mount"><script type="application/json" class="sc-browse-data">' +
        JSON.stringify(browseData) + '<\/script></div>';
  }

  var views = {
    feature: vFeature, traitcls: vTraitClasses, levels: vCensorLevels,
    traitidx: vTraitIndex, abilidx: vAbilityIndex, treasure: vTreasure, browse: vBrowse
  };
  var content = document.getElementById("content");
  var buttons = {};
  ["feature", "traitcls", "levels", "traitidx", "abilidx", "treasure", "browse"].forEach(function (k) {
    buttons[k] = document.getElementById("b-" + k);
  });
  function show(which) {
    content.innerHTML = (views[which] || vFeature)();
    Object.keys(buttons).forEach(function (k) { if (buttons[k]) buttons[k].classList.toggle("on", k === which); });
    if (which === "browse") {
      content.querySelectorAll(".sc-browse-mount").forEach(window.SCBrowse.mount);
    }
  }
  Object.keys(buttons).forEach(function (k) { if (buttons[k]) buttons[k].onclick = function () { show(k); }; });
  show("feature");

  var themeBtn = document.getElementById("themeBtn"), dark = true;
  themeBtn.onclick = function () {
    dark = !dark;
    document.documentElement.setAttribute("data-md-color-scheme", dark ? "slate" : "default");
    themeBtn.textContent = dark ? "🌙" : "☀️";
  };
})();
