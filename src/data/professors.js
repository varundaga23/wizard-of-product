export const TOWERS = {
  pm: {
    name: 'PM Tower',
    color: 0x4a90d9,
    hex: '#4a90d9',
    professors: [
      { key: 'gibson_biddle', name: 'Gibson Biddle', title: 'The DHM Keeper' },
      { key: 'julie_zhuo', name: 'Julie Zhuo', title: 'Enchantress of Design' },
      { key: 'shreyas_doshi', name: 'Shreyas Doshi', title: 'Master of Strategic Spells' },
      { key: 'jules_walter', name: 'Jules Walter', title: 'The Influence Enchanter' },
      { key: 'april_dunford', name: 'April Dunford', title: 'The Positioning Sage' },
      { key: 'marty_cagan', name: 'Marty Cagan', title: 'The Ancient Sage', isBoss: true },
    ],
  },
  strategy: {
    name: 'Strategy Tower',
    color: 0xe67e22,
    hex: '#e67e22',
    professors: [
      { key: 'chandra_janakiraman', name: 'Chandra Janakiraman', title: 'The Strategy Blocks Sage' },
      { key: 'roger_martin', name: 'Roger Martin', title: 'Wizard of Winning Choices' },
      { key: 'christopher_lochhead', name: 'Christopher Lochhead', title: 'The Category Pirate' },
      { key: 'marc_andreessen', name: 'Marc Andreessen', title: 'The Contrarian Archmage' },
      { key: 'hamilton_helmer', name: 'Hamilton Helmer', title: 'Master of the 7 Powers', isBoss: true },
    ],
  },
  ai: {
    name: 'AI Tower',
    color: 0x9b59b6,
    hex: '#9b59b6',
    professors: [
      { key: 'tal_raviv', name: 'Tal Raviv', title: 'Wizard of Modern Tools' },
      { key: 'aman_khan', name: 'Aman Khan', title: 'The Eval Conjurer' },
      { key: 'claire_vo', name: 'Claire Vo', title: 'Conjurer of Agentic Arts' },
      { key: 'nick_turley', name: 'Nick Turley', title: 'Keeper of the Crystal' },
      { key: 'hamel_husain', name: 'Hamel Husain', title: 'The Grand Evaluator' },
      { key: 'chip_huyen', name: 'Chip Huyen', title: 'Architect of AI Systems' },
      { key: 'fei_fei_li', name: 'Dr. Fei-Fei Li', title: 'The Godmother of Intelligence', isBoss: true },
    ],
  },
};

export const LENNY_FINAL_BOSS = {
  key: 'lenny_final_boss',
  name: 'Lenny Rachitsky',
  title: 'The Keeper of Product Lore',
  domain: 'final',
  color: 0xffd700,
  hex: '#ffd700',
  isFinalBoss: true,
};

// PRD §5A — Oracle's Rite questions (exact content, hard-coded)
export const ORACLE_QUESTIONS = [
  {
    scenario: 'The DAU Drop',
    text: "Your product's daily active users dropped 15% overnight. No deployment happened. What's your first move?",
    options: [
      { text: "Talk to users immediately — find five who churned and understand what happened", archetype: 'V' },
      { text: "Pull the data — segment by cohort, feature usage, and acquisition source before drawing conclusions", archetype: 'M' },
      { text: "Ship a fix — you've seen this pattern before and you know what causes it. Move fast.", archetype: 'B' },
    ],
  },
  {
    scenario: 'The Competitor',
    text: "A direct competitor just shipped the feature you've been building for three months. What do you do?",
    options: [
      { text: "Reframe the vision — if a competitor can do it, it's table stakes now. What's the bigger opportunity we should be building toward?", archetype: 'V' },
      { text: "Scope the tradeoffs — what's the minimum version that gets 80% of the value? Map it out before deciding.", archetype: 'M' },
      { text: "Find a way to ship something in two weeks — imperfect and fast beats perfect and late", archetype: 'B' },
    ],
  },
  {
    scenario: 'The New Segment',
    text: "You're building for small teams, but 20% of your signups are unexpectedly enterprise. What's your next step?",
    options: [
      { text: "Follow the new segment — unexpected traction is the universe telling you something about the real opportunity", archetype: 'V' },
      { text: "Analyse both segments deeply before doing anything — understand whether this is signal or noise", archetype: 'M' },
      { text: "Keep shipping for your core users — don't get distracted by early noise, stay focused on what's working", archetype: 'B' },
    ],
  },
  {
    scenario: 'The CEO Request',
    text: "Your CEO asks you to add a feature 'by end of quarter' that isn't on the roadmap. What do you do?",
    options: [
      { text: "Ask why — there's something they're seeing that you're not. Understanding their vision might change yours.", archetype: 'V' },
      { text: "Bring the data — show the strategic context, opportunity cost, and what you'd deprioritise. Make it a structured decision.", archetype: 'M' },
      { text: "Negotiate scope — find the smallest version that satisfies the intent and slot it in without derailing the team", archetype: 'B' },
    ],
  },
  {
    scenario: 'The Launch Decision',
    text: "Your product is 80% done. The team wants two more months. Marketing wants to launch now. What do you decide?",
    options: [
      { text: "Ask what story you want to tell — a product that launches too early can define itself wrongly before it's found its real form", archetype: 'V' },
      { text: "Define what done actually means — is the missing 20% table stakes or nice to have? That determines everything.", archetype: 'M' },
      { text: "Launch — you'll learn more from real users in two weeks than from two more months of internal debate", archetype: 'B' },
    ],
  },
];

export const ARCHETYPE_INFO = {
  V: {
    name: 'Visionary',
    sigil: '✦',
    tagline: "You see what others don't — yet.",
    description: "You think in systems, futures, and possibilities before anyone else has caught up. Your superpower is the vision. Your challenge is bringing others with you.",
    tower: 'pm',
    towerName: 'PM Tower',
    color: '#ffd700',
    hex: 0xffd700,
  },
  M: {
    name: 'Mastermind',
    sigil: '◈',
    tagline: "You build the map before anyone knows they're lost.",
    description: "You think in frameworks, data, and structured reasoning. Your superpower is making the complex clear. Your challenge is knowing when good enough is good enough.",
    tower: 'strategy',
    towerName: 'Strategy Tower',
    color: '#e0e0e0',
    hex: 0xe0e0e0,
  },
  B: {
    name: 'Builder',
    sigil: '⬡',
    tagline: 'You make it real.',
    description: "You think in momentum, constraints, and what ships next. Your superpower is getting things done when others are still debating. Your challenge is knowing when to stop and rethink.",
    tower: 'ai',
    towerName: 'AI Tower',
    color: '#c084fc',
    hex: 0xc084fc,
  },
};

// Win one-liners per professor (PRD §13B)
export const PROFESSOR_WIN_LINES = {
  gibson_biddle: "DHM is not a framework. It's a discipline. You're starting to understand the difference.",
  julie_zhuo: "Great design is not about aesthetics. It's about showing you understand the human. You do.",
  teresa_torres: "You asked the right questions before reaching for solutions. That is the whole game.",
  shreyas_doshi: "Upstream thinking is the rarest skill in product. You're already using it.",
  jules_walter: "Influence without authority is the true PM superpower. You've found yours.",
  april_dunford: "Bad positioning is invisible — until a competitor eats your lunch. You can see it now.",
  marty_cagan: "Empowered teams need empowered PMs. You might be ready to lead one.",
  chandra_janakiraman: "A roadmap without a strategy is just a list of wishes. You know the difference now.",
  roger_martin: "Every strategy is a bet. You now know which bets are worth making.",
  christopher_lochhead: "Category designers don't compete — they define the game. Go define yours.",
  marc_andreessen: "The contrarian question is always: what does everyone else believe that is wrong? Now ask it.",
  hamilton_helmer: "Power without strategy is fragile. Strategy without power is irrelevant. You understand both.",
  tal_raviv: "AI doesn't replace great PMs. It makes them terrifying. You're becoming terrifying.",
  aman_khan: "Vibes aren't evals. You know the difference now. That's more than most.",
  claire_vo: "AI-native is not a feature — it's a different way of thinking about what's possible.",
  nick_turley: "At scale, trust is your product. You've started building it.",
  hamel_husain: "Evals are product discovery for AI. You've just unlocked the whole stack.",
  chip_huyen: "The engineering trade-off is also a product trade-off. You can see the whole board now.",
  fei_fei_li: "The future belongs to those who augment human judgment — not replace it.",
  lenny_final_boss: "You've read the archive. Now go write your own chapter.",
};
