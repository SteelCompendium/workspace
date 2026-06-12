/* ============================================================
   statblock-data.js — structured Draw Steel statblocks.
   Words & numbers are VERBATIM from data-bestiary-md (the live
   data source). Design may change; CONTENT MUST NOT.

   Feature shape (mirrors the site's ability-card data so a feature
   renders in the SAME steel grammar as a standalone ability):
     { kind:    'ability'|'passive'|'villain'|'malice'
       action:  'main'|'maneuver'|'triggered'|'passive'|'villain'|'malice'  → crest+accent
       name
       cost?    cost-badge text  ('Signature' | '2 Malice' | 'Villain Action 1' | '7 Malice')
       usage?   eyebrow text     ('Main Action' | 'Maneuver' | 'Triggered Action')
       keywords?: []
       distance?, target?
       powerRoll?: { formula:'+ 4'|null, tiers:{ low, mid, high } }   // formula null → a test result, no "Power Roll +" head
       sections?: [{ label, text }]        // Trigger / Effect panels
       enhancements?: [{ cost, text }]      // dashed "spend X" rows (e.g. 2 Malice)
       body?:    string                     // passive/malice plain paragraph
       trailing?: string                    // plain note after the power roll
     }
   ============================================================ */
(function (root) {
  "use strict";

  // Shared Devil Malice features — the same block is appended to every devil
  // statblock (Devil Malice (Malice Features)).
  var devilMalice = {
    name: "Malice Features",
    sourceName: "Devil Malice",
    intro: "At the start of any devil's turn, you can spend Malice to activate one of the following features.",
    features: [
      { kind: "malice", action: "malice", name: "Bureaucratic Tape", cost: "3 Malice",
        body: "One devil acting this turn uses a signature ability against an adjacent creature. On a tier 3 outcome, the target of the ability has a double bane on strikes (save ends)." },
      { kind: "malice", action: "malice", name: "Underhanded Tactics", cost: "5+ Malice",
        body: "One or two devils can teleport to a space adjacent to one or more creatures who aren't hidden and make a free strike. For each 2 additional Malice spent on this feature, one additional devil can teleport." },
      { kind: "malice", action: "malice", name: "Read the Small Print", cost: "7 Malice",
        body: "Each enemy in the encounter is subject to a bad deal proposed by the devils. An enemy must choose between having damage weakness 5 or taking a bane on power rolls. The bad deal lasts until the end of the encounter." }
    ]
  };

  var devilHighJudge = {
    id: "devil-high-judge",
    name: "Devil High Judge",
    ancestry: "Devil, Infernal",
    level: "6",
    role: "Leader",
    roleKey: "leader",
    ev: "32",
    isMinion: false,
    defenses: [
      { l: "Size", v: "1M" },
      { l: "Speed", v: "7" },
      { l: "Stamina", v: "181" },
      { l: "Stability", v: "2" },
      { l: "Free Strike", v: "6" }
    ],
    // fixed 2×2: immunity (TL) | weakness (TR) ; movement (BL) | captain (BR)
    meta: {
      immunity: "Fire 5",
      weakness: "—",
      movement: "Fly",
      captain: { label: "With Captain", value: "—" }
    },
    characteristics: [
      { l: "Might", k: "M", v: "+1" },
      { l: "Agility", k: "A", v: "+3" },
      { l: "Reason", k: "R", v: "+0" },
      { l: "Intuition", k: "I", v: "+1" },
      { l: "Presence", k: "P", v: "+2" }
    ],
    malice: devilMalice,
    features: [
      {
        kind: "ability", action: "main", name: "Infernal Decree",
        cost: "Signature", usage: "Main Action",
        keywords: ["Magic", "Ranged", "Strike"],
        distance: "Ranged 12", target: "Three creatures or objects",
        powerRoll: { formula: "+ 4", tiers: {
          low:  "10 damage; P < 2 the target can't hide (save ends)",
          mid:  "15 damage; P < 3 the target can't hide (save ends)",
          high: "19 damage; P < 4 the target can't hide (save ends)"
        } },
        enhancements: [
          { cost: "2 Malice", text: "While a target is unable to hide this way, any strike against them made by a devil gains an edge." }
        ]
      },
      {
        kind: "ability", action: "maneuver", name: "Compel the Jury",
        usage: "Maneuver",
        keywords: ["Magic", "Ranged", "Strike"],
        distance: "Ranged 12", target: "Two creatures",
        powerRoll: { formula: "+ 4", tiers: {
          low:  "I < 2 the target is charmed (save ends)",
          mid:  "I < 3 the target is charmed (save ends)",
          high: "I < 4 the target is charmed (save ends)"
        } },
        sections: [
          { label: "Effect", text: "While charmed this way, a creature treats the high judge as an ally, and the high judge can spend 1 Malice on their turn to make that creature move up to 3 squares." }
        ]
      },
      {
        kind: "ability", action: "triggered", name: "Devilish Suggestion",
        cost: "2 Malice", usage: "Triggered Action",
        keywords: ["Magic", "Ranged"],
        distance: "Ranged 5", target: "The triggering creature",
        sections: [
          { label: "Trigger", text: "A creature targets the high judge with a strike." },
          { label: "Effect", text: "The target makes a **Presence test**." }
        ],
        powerRoll: { formula: null, tiers: {
          low:  "The target is charmed (save ends).",
          mid:  "The high judge chooses a new target for the strike.",
          high: "The target takes a bane on the strike."
        } },
        trailing: "While charmed this way, a creature treats the high judge as an ally, and the high judge can spend 1 Malice on their turn to make that creature move up to 3 squares."
      },
      {
        kind: "passive", action: "passive", name: "End Effect",
        body: "At the end of each of their turns, the high judge can take 10 damage to end one effect on them that can be ended by a saving throw. This damage can't be reduced in any way."
      },
      {
        kind: "passive", action: "passive", name: "True Name",
        body: "If a creature within 10 squares speaks the high judge's true name, the high judge loses their damage immunities, any nondamaging effects of their signature ability, and their Devilish Suggestion triggered action until the end of the encounter."
      },
      {
        kind: "villain", action: "villain", name: "All Rise", cost: "Villain Action 1",
        keywords: ["Area", "Magic"],
        distance: "3 burst", target: "Each enemy in the area",
        sections: [
          { label: "Effect", text: "The target makes a **Presence test**." }
        ],
        powerRoll: { formula: null, tiers: {
          low:  "15 psychic damage; the target is charmed (save ends)",
          mid:  "12 psychic damage; the target is charmed (save ends)",
          high: "7 psychic damage"
        } },
        trailing: "While charmed this way, a creature treats the high judge as an ally, and the high judge can spend 1 Malice on their turn to make that creature move up to 3 squares."
      },
      {
        kind: "villain", action: "villain", name: "Heed My Decree", cost: "Villain Action 2",
        keywords: ["Area"],
        distance: "5 burst", target: "Self and each ally in the area",
        sections: [
          { label: "Effect", text: "Each target shifts up to their speed. The high judge can make each creature charmed by All Rise, Compel the Jury, or Devilish Suggestion move up to half that creature's speed." }
        ]
      },
      {
        kind: "villain", action: "villain", name: "Deceptive Stratagem", cost: "Villain Action 3",
        keywords: ["Magic", "Ranged"],
        distance: "Ranged 12", target: "One creature",
        sections: [
          { label: "Effect", text: "If the target is an ally or a creature charmed by All Rise, Compel the Jury, or Devilish Suggestion, the high judge and the target teleport to swap places. Each ally within 12 squares of the high judge can then make a free strike against a target of the high judge's choice. Each creature charmed by All Rise, Compel the Jury, or Devilish Suggestion makes a free strike against a target of the high judge's choice." }
        ]
      }
    ]
  };

  var devilClerk = {
    id: "devil-clerk",
    name: "Devil Clerk",
    ancestry: "Devil, Infernal",
    level: "5",
    role: "Minion Brute",
    roleKey: "brute",
    ev: "7 for four minions",
    isMinion: true,
    defenses: [
      { l: "Size", v: "1M" },
      { l: "Speed", v: "6" },
      { l: "Stamina", v: "10" },
      { l: "Stability", v: "0" },
      { l: "Free Strike", v: "3" }
    ],
    meta: {
      immunity: "Fire 5",
      weakness: "—",
      movement: "—",
      captain: { label: "With Captain", value: "+2 damage bonus to strikes" }
    },
    characteristics: [
      { l: "Might", k: "M", v: "+3" },
      { l: "Agility", k: "A", v: "+0" },
      { l: "Reason", k: "R", v: "+1" },
      { l: "Intuition", k: "I", v: "+1" },
      { l: "Presence", k: "P", v: "+2" }
    ],
    malice: devilMalice,
    features: [
      {
        kind: "ability", action: "main", name: "Quill Pushing",
        cost: "Signature", usage: "Main Action",
        keywords: ["Melee", "Strike", "Weapon"],
        distance: "Melee 1", target: "One creature or object per minion",
        powerRoll: { formula: "+ 3", tiers: {
          low:  "3 damage; push 1",
          mid:  "6 damage; push 2",
          high: "7 damage; push 3"
        } },
        sections: [
          { label: "Effect", text: "Any target adjacent to two or more clerks is taunted until the end of their next turn." }
        ]
      },
      {
        kind: "passive", action: "passive", name: "True Name",
        body: "If a creature within 10 squares speaks the clerk's true name, the clerk loses their fire immunity and any nondamaging effects of their signature ability until the end of the encounter."
      }
    ]
  };

  root.STATBLOCKS = { devilHighJudge: devilHighJudge, devilClerk: devilClerk };
})(window);
