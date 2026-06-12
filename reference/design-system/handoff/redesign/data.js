/* Redesign exploration — sample data for rich cards.
   Battlemind stats are real (from data-rules-md); others are illustrative
   placeholders to demonstrate the "stat-at-a-glance" card pattern. */
window.RD = {
  categories: [
    { id: "class",        icon: "shield",   title: "Classes",       count: 10,  blurb: "Censor · Conduit · Elementalist · Fury · Null · Shadow · Tactician · Talent · Troubadour", top: ["Conduit","Fury","Shadow","Tactician"] },
    { id: "ancestry",     icon: "users",    title: "Ancestries",    count: 12,  blurb: "Devil · Dwarf · Hakaan · High Elf · Human · Memonek · Orc · Polder · Revenant · Wode Elf", top: ["Human","Dwarf","Orc","Revenant"] },
    { id: "ability",      icon: "sparkles", title: "Abilities",     count: 480, blurb: "Every class & kit ability, by class and level", top: ["Signature","Heroic","Triggered"] },
    { id: "kit",          icon: "package",  title: "Kits",          count: 25,  blurb: "Martial, caster & hybrid loadouts — Battlemind, Mountain, Panther, Spellsword…", top: ["Mountain","Panther","Spellsword","Battlemind"] },
    { id: "career",       icon: "briefcase",title: "Careers",       count: 12,  blurb: "Agent · Aristocrat · Artisan · Criminal · Gladiator · Sage · Soldier", top: ["Soldier","Sage","Criminal"] },
    { id: "complication", icon: "alert",    title: "Complications", count: 100, blurb: "100 hooks to deepen your hero's backstory", top: [] },
    { id: "feature",      icon: "star",     title: "Features",      count: 80,  blurb: "Class & ancestry features, traits and more — by source", top: [] },
    { id: "perk",         icon: "gem",      title: "Perks",         count: 48,  blurb: "Crafting · exploration · interpersonal · intrigue · lore · supernatural", top: [] },
    { id: "title",        icon: "crown",    title: "Titles",        count: 36,  blurb: "Earned across all four echelons of play", top: [] },
    { id: "treasure",     icon: "coins",    title: "Treasures",     count: 64,  blurb: "Artifacts · consumables · leveled treasures · trinkets", top: [] }
  ],
  kits: [
    { name: "Battlemind",      type: "Hybrid",  klass: "caster", armor: "Light", weapon: "Medium", stamina: "+3", speed: "+2", stability: "+1", melee: "+2/+2/+2", ranged: "—", dist: "Reason", sig: "Unmooring", sigType: "strike", keywords: "Melee · Psionic · Strike", real: true },
    { name: "Mountain",        type: "Martial", klass: "martial", armor: "Heavy", weapon: "Medium", stamina: "+9", speed: "0",  stability: "+2", melee: "+2/+2/+2", ranged: "—", dist: "Might",  sig: "Mountain Resilience", sigType: "passive", keywords: "Melee · Weapon · Stance" },
    { name: "Panther",         type: "Martial", klass: "martial", armor: "Light", weapon: "Light",  stamina: "+3", speed: "+3", stability: "0",  melee: "+1/+1/+1", ranged: "—", dist: "Agility",dist2: true, sig: "Pouncing Strike", sigType: "strike", keywords: "Melee · Weapon · Charge" },
    { name: "Sword and Board", type: "Martial", klass: "martial", armor: "Heavy", weapon: "Medium", stamina: "+6", speed: "0",  stability: "+1", melee: "+2/+2/+2", ranged: "—", dist: "Might",  sig: "Shield Bash", sigType: "strike", keywords: "Melee · Weapon · Shield" },
    { name: "Spellsword",      type: "Hybrid",  klass: "caster", armor: "Medium",weapon: "Medium", stamina: "+6", speed: "+1", stability: "+1", melee: "+1/+1/+1", ranged: "—", dist: "Reason", sig: "Imbued Strike", sigType: "area", keywords: "Melee · Magic · Strike" },
    { name: "Cloak and Dagger",type: "Martial", klass: "martial", armor: "Light", weapon: "Light",  stamina: "+3", speed: "+2", stability: "0",  melee: "+1/+1/+1", ranged: "+1/+1/+1", dist: "Agility", sig: "Twin Fangs", sigType: "ranged", keywords: "Ranged · Weapon · Strike" }
  ],
  // sample hierarchy content (a class excerpt) showing 8 levels + trait→ability nesting
  tierGlyph: { low: "!", mid: "@", high: "#" }
};
