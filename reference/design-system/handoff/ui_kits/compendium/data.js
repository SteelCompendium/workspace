/* Steel Compendium UI Kit — sample content data (subset of the real parsed data) */
window.SC_DATA = {
  categories: [
    { id: "class", title: "Classes", count: 10, items: "Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent, Troubadour", link: "View Classes" },
    { id: "ancestry", title: "Ancestries", count: 12, items: "Devil, Dragon Knight, Dwarf, Hakaan, High Elf, Human, Memonek, Orc, Polder, Revenant, Time Raider, Wode Elf", link: "View Ancestries" },
    { id: "ability", title: "Abilities", count: 21, items: "All class abilities organized by class and level, plus kit abilities", link: "View Abilities" },
    { id: "kit", title: "Kits", count: 25, items: "Martial, caster, and hybrid kits — Arcane Archer, Battlemind, Cloak and Dagger, Mountain, Panther, Spellsword, and more", link: "View Kits" },
    { id: "career", title: "Careers", count: 12, items: "Agent, Aristocrat, Artisan, Criminal, Gladiator, Sage, Soldier, and more", link: "View Careers" },
    { id: "complication", title: "Complications", count: 100, items: "100 complications to add depth to your hero's backstory", link: "View Complications" },
    { id: "feature", title: "Features", count: 80, items: "Class features, ancestry features, traits, and more — organized by source", link: "View Features" },
    { id: "perk", title: "Perks", count: 48, items: "Crafting, exploration, interpersonal, intrigue, lore, and supernatural perks", link: "View Perks" },
    { id: "title", title: "Titles", count: 36, items: "Titles earned across all four echelons of play", link: "View Titles" },
    { id: "treasure", title: "Treasures", count: 64, items: "Artifacts, consumables, leveled treasures, and trinkets", link: "View Treasures" }
  ],
  sidebar: ["Ancestry","Career","Class","Complication","Condition","Culture","Feature","Kit","Movement","Negotiation","Perk","Skill","Title","Treasure"],
  // index lists per category
  index: {
    kit: ["Arcane Archer","Battlemind","Cloak and Dagger","Dual Wielder","Martial Artist","Mountain","Panther","Pugilist","Raider","Ranger","Rapid Fire","Retiarius","Shining Armor","Sniper","Spellsword","Stick and Robe","Swashbuckler","Sword and Board","Warrior Priest","Whirlwind"],
    class: ["Beastheart","Censor","Conduit","Elementalist","Fury","Null","Shadow","Tactician","Talent","Troubadour"]
  },
  // a fully-detailed content page (Battlemind kit)
  page: {
    cat: "Kits", title: "Battlemind", scc: "mcdm.heroes.v1/kit/battlemind",
    intro: "Who says lightly armored heroes can't also be hard to move? You just need to employ some psionics! The Battlemind kit harnesses the power of your mind to make you harder to move—and to make your foes easier to push around.",
    equipment: "You wear light armor and wield a medium weapon.",
    bonuses: [["Stamina Bonus","+3 per echelon"],["Speed Bonus","+2"],["Stability Bonus","+1"],["Melee Damage Bonus","+2/+2/+2"]],
    ability: {
      name: "Unmooring", type: "strike",
      flavor: "Your weapon unleashes psionic energy that reduces your target's weight.",
      keywords: "Melee, Psionic, Strike, Weapon", action: "Main action",
      distance: "📏 Melee 1", target: "🎯 One creature",
      roll: "Power Roll + Might, Reason, Intuition, or Presence",
      tiers: [["low","5 + M, R, I, or P damage"],["mid","8 + M, R, I, or P damage"],["high","11 + M, R, I, or P damage"]],
      effect: "Until the end of the target's next turn, any forced movement that affects the target has its distance increased by 2."
    },
    toc: ["Equipment","Kit Bonuses","Signature Ability"]
  },
  tabs: ["Browse","Rulebook Chapters","Full Rulebook","Bestiary","Preferences"],
  tierGlyph: { low: "!", mid: "@", high: "#" }
};
