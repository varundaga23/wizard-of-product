'use client'

import { useState, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import posthog from 'posthog-js'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'oracle' | 'archetype' | 'duel' | 'spellwin' | 'game_over' | 'playbook' | 'grand'
type SummonsVariant = 'easter_egg' | 'prefinal'

type ArchetypeKey = 'V' | 'M' | 'B'
type TowerKey = 'pm' | 'strategy' | 'ai'

type DuelQuestion = {
  id: string
  professor: string
  question: string
  options: string[]        // ["A. text", "B. text", "C. text", "D. text"]
  correct_answer: string   // "A" | "B" | "C" | "D"
  explanation: string
  difficulty: 'basic' | 'advanced'
  best_distractor: string
  displayOptions: { text: string; isCorrect: boolean }[]
}

type OracleQuestion = {
  scenario: string
  text: string
  options: { text: string; archetype: ArchetypeKey }[]
}

type ProfessorDef = {
  key: string
  name: string
  title: string
  tower: TowerKey
  isBoss?: boolean
}

// ─── Game Data ────────────────────────────────────────────────────────────────

const TOWER_ORDER_BY_ARCHETYPE: Record<ArchetypeKey, TowerKey[]> = {
  V: ['pm', 'strategy', 'ai'],
  M: ['strategy', 'pm', 'ai'],
  B: ['ai', 'pm', 'strategy'],
}

const TOWERS: Record<TowerKey, { name: string; professors: ProfessorDef[] }> = {
  pm: {
    name: 'PM Tower',
    professors: [
      { key: 'gibson_biddle',  name: 'Gibson Biddle',  title: 'The DHM Keeper',             tower: 'pm' },
      { key: 'julie_zhuo',     name: 'Julie Zhuo',     title: 'Enchantress of Design',      tower: 'pm' },
      { key: 'shreyas_doshi',  name: 'Shreyas Doshi',  title: 'Master of Strategic Spells', tower: 'pm' },
      { key: 'jules_walter',   name: 'Jules Walter',   title: 'The Influence Enchanter',    tower: 'pm' },
      { key: 'april_dunford',  name: 'April Dunford',  title: 'The Positioning Sage',       tower: 'pm' },
      { key: 'marty_cagan',    name: 'Marty Cagan',    title: 'The Ancient Sage',           tower: 'pm', isBoss: true },
    ],
  },
  strategy: {
    name: 'Strategy Tower',
    professors: [
      { key: 'chandra_janakiraman', name: 'Chandra Janakiraman', title: 'The Strategy Blocks Sage', tower: 'strategy' },
      { key: 'roger_martin',        name: 'Roger Martin',        title: 'Wizard of Winning Choices', tower: 'strategy' },
      { key: 'christopher_lochhead',name: 'Christopher Lochhead',title: 'The Category Pirate',      tower: 'strategy' },
      { key: 'marc_andreessen',     name: 'Marc Andreessen',     title: 'The Contrarian Archmage',  tower: 'strategy' },
      { key: 'hamilton_helmer',     name: 'Hamilton Helmer',     title: 'Master of the 7 Powers',   tower: 'strategy', isBoss: true },
    ],
  },
  ai: {
    name: 'AI Tower',
    professors: [
      { key: 'tal_raviv',   name: 'Tal Raviv',     title: 'Wizard of Modern Tools',         tower: 'ai' },
      { key: 'aman_khan',   name: 'Aman Khan',     title: 'The Eval Conjurer',              tower: 'ai' },
      { key: 'claire_vo',   name: 'Claire Vo',     title: 'Conjurer of Agentic Arts',       tower: 'ai' },
      { key: 'nick_turley', name: 'Nick Turley',   title: 'Keeper of the Crystal',          tower: 'ai' },
      { key: 'hamel_husain',name: 'Hamel Husain',  title: 'The Grand Evaluator',            tower: 'ai' },
      { key: 'chip_huyen',  name: 'Chip Huyen',    title: 'Architect of AI Systems',        tower: 'ai' },
      { key: 'fei_fei_li',  name: 'Dr. Fei-Fei Li',title: 'The Godmother of Intelligence', tower: 'ai', isBoss: true },
    ],
  },
}

const SPELL_SUBTITLES: Record<string, string> = {
  gibson_biddle:         'Delight, Hard-to-copy, Margin-enhancing',
  julie_zhuo:            'Outcomes, Growth, People',
  shreyas_doshi:         'Upstream, Northstar, Execution',
  jules_walter:          'Vision, Coalition, Execution',
  april_dunford:         'Market, Category, Positioning',
  marty_cagan:           'Vision, Mission, Empowerment',
  chandra_janakiraman:   'Diagnose, Design, Execute',
  roger_martin:          'Choice, Logic, Wager',
  christopher_lochhead:  'Create, Market, Dominate',
  marc_andreessen:       'Contrarian, Bold, Prescient',
  hamilton_helmer:       'Power, Moat, Dominance',
  tal_raviv:             'AI, Automation, Leverage',
  aman_khan:             'Evals, Metrics, Rigor',
  claire_vo:             'Agents, Rethink, AI-Native',
  nick_turley:           'Trust, Safety, Scale',
  hamel_husain:          'Measure, Improve, Ship',
  chip_huyen:            'Systems, Trade-offs, Reliability',
  fei_fei_li:            'Vision, Cognition, Intelligence',
  lenny_rachitsky:       'Consistency, Craft, Community',
}

const SPELL_CARD_IMAGES: Record<string, string> = {
  gibson_biddle:         '/assets/spell-cards/DHM_Principle_Gibson_Biddle_SpellCard.avif',
  julie_zhuo:            '/assets/spell-cards/The_Design_Mirror_Julie_Zhuo_SpellCard.avif',
  shreyas_doshi:         '/assets/spell-cards/Upstream_Thinking_Shreyas_Doshi_SpellCard.avif',
  jules_walter:          '/assets/spell-cards/The_Influence_Pact_Jules_Walter_SpellCard.avif',
  april_dunford:         '/assets/spell-cards/The_Positioning_Code_April_Dunford_SpellCard.avif',
  marty_cagan:           '/assets/spell-cards/The_Empowered_Team_Marty_Cagan_SpellCard.avif',
  chandra_janakiraman:   '/assets/spell-cards/The_Strategy_Block_Chandra_Janakiraman_SpellCard.avif',
  roger_martin:          '/assets/spell-cards/The_Winning_Wager_Roger_Martin_SpellCard.avif',
  christopher_lochhead:  '/assets/spell-cards/Category_Design_Christopher_Lochhead_SpellCard.avif',
  marc_andreessen:       '/assets/spell-cards/The_Contrarian_Lens_Marc_Andreessen_SpellCard.avif',
  hamilton_helmer:       '/assets/spell-cards/The_7_Powers_Hamilton_Helmer_SpellCard.avif',
  tal_raviv:             '/assets/spell-cards/The_Modern_Toolkit_Tal_Raviv_SpellCard.avif',
  aman_khan:             '/assets/spell-cards/The_Eval_Rite_Aman_Khan_SpellCard.avif',
  claire_vo:             '/assets/spell-cards/The_Agentic_Art_Claire_Vo_SpellCard.avif',
  nick_turley:           '/assets/spell-cards/The_Trust_Protocol_Nick_Turley_SpellCard.avif',
  hamel_husain:          '/assets/spell-cards/The_Eval_Stack_Hamel_Husain_SpellCard.avif',
  chip_huyen:            '/assets/spell-cards/Systems_Sight_Chip_Huyen_SpellCard.avif',
  fei_fei_li:            '/assets/spell-cards/The_Intelligence_Arc_Fei_Fei_Li_SpellCard.avif',
  lenny_rachitsky:       '/assets/spell-cards/The_Product_Lore_Lenny_Rachitsky_SpellCard.avif',
}

const SPELL_NAMES: Record<string, string> = {
  gibson_biddle:         'DHM Principle',
  julie_zhuo:            'The Design Mirror',
  shreyas_doshi:         'Upstream Thinking',
  jules_walter:          'The Influence Pact',
  april_dunford:         'The Positioning Code',
  marty_cagan:           'The Empowered Team',
  chandra_janakiraman:   'The Strategy Block',
  roger_martin:          'The Winning Wager',
  christopher_lochhead:  'Category Design',
  marc_andreessen:       'The Contrarian Lens',
  hamilton_helmer:       'The 7 Powers',
  tal_raviv:             'The Modern Toolkit',
  aman_khan:             'The Eval Rite',
  claire_vo:             'The Agentic Art',
  nick_turley:           'The Trust Protocol',
  hamel_husain:          'The Eval Stack',
  chip_huyen:            'Systems Sight',
  fei_fei_li:            'The Intelligence Arc',
  lenny_rachitsky:       'The Product Lore',
}

const PROFESSOR_WIN_LINES: Record<string, string> = {
  gibson_biddle:         "DHM is not a framework. It's a discipline. You're starting to understand the difference.",
  julie_zhuo:            "Great design is not about aesthetics. It's about showing you understand the human. You do.",
  shreyas_doshi:         "Upstream thinking is the rarest skill in product. You're already using it.",
  jules_walter:          "Influence without authority is the true PM superpower. You've found yours.",
  april_dunford:         "Bad positioning is invisible — until a competitor eats your lunch. You can see it now.",
  marty_cagan:           "Empowered teams need empowered PMs. You might be ready to lead one.",
  chandra_janakiraman:   "A roadmap without a strategy is just a list of wishes. You know the difference now.",
  roger_martin:          "Every strategy is a bet. You now know which bets are worth making.",
  christopher_lochhead:  "Category designers don't compete — they define the game. Go define yours.",
  marc_andreessen:       "The contrarian question is always: what does everyone else believe that is wrong? Now ask it.",
  hamilton_helmer:       "Power without strategy is fragile. Strategy without power is irrelevant. You understand both.",
  tal_raviv:             "AI doesn't replace great PMs. It makes them terrifying. You're becoming terrifying.",
  aman_khan:             "Vibes aren't evals. You know the difference now. That's more than most.",
  claire_vo:             "AI-native is not a feature — it's a different way of thinking about what's possible.",
  nick_turley:           "At scale, trust is your product. You've started building it.",
  hamel_husain:          "Evals are product discovery for AI. You've just unlocked the whole stack.",
  chip_huyen:            "The engineering trade-off is also a product trade-off. You can see the whole board now.",
  fei_fei_li:            "The future belongs to those who augment human judgment — not replace it.",
  lenny_rachitsky:       "You've read the archive. Now go write your own chapter.",
}

const PROFESSOR_LOSS_LINES: Record<string, string> = {
  gibson_biddle:         "The DHM model only works if you apply it — not memorise it. Come back when you've sat with it.",
  julie_zhuo:            "Great teams come from clear thinking. Yours wasn't clear enough today.",
  shreyas_doshi:         "That's an output answer. I was looking for an outcome answer. There's a difference.",
  jules_walter:          "Knowing a framework and using it to influence are two different things. Think about it.",
  april_dunford:         "Wrong positioning kills good products. What makes this the best at something specific?",
  marty_cagan:           "That's feature team thinking. Come back when you're thinking like an empowered team.",
  chandra_janakiraman:   "Strategy without sequence is a list of wishes. Think about the order.",
  roger_martin:          "A strategy that doesn't say no to things isn't a strategy. Think again.",
  christopher_lochhead:  "You're competing. I asked you to create. That's a completely different question.",
  marc_andreessen:       "That answer was conventional wisdom. I'm looking for something a contrarian would say.",
  hamilton_helmer:       "That's operational excellence. It can be copied. Come back when you've found a real moat.",
  tal_raviv:             "You're still doing this manually. Think about what an agent could handle for you.",
  aman_khan:             "A vibe check isn't an eval. Come back with an actual measurement framework.",
  claire_vo:             "That's a feature. I'm looking for a product rethink. What changes with AI at the core?",
  nick_turley:           "You're optimising for the wrong constraint. What's actually blocking speed here?",
  hamel_husain:          "You shipped without measuring. That's how you lose trust in AI systems permanently.",
  chip_huyen:            "You understand the model. You don't understand the system. Come back.",
  fei_fei_li:            "Intelligence is a human question as much as a technical one. Keep thinking.",
}

// Real Oracle's Rite questions from PRD
const ORACLE_QUESTIONS: OracleQuestion[] = [
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
      { text: "Reframe the vision — if a competitor can do it, it's table stakes now. What's the bigger opportunity?", archetype: 'V' },
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
]

const ARCHETYPES: Record<ArchetypeKey, { name: string; desc: string; tagline: string; tower: TowerKey; towerName: string }> = {
  V: {
    name: 'Visionary',
    desc: 'You think in systems, futures, and possibilities before anyone else has caught up. Your superpower is the vision. Your challenge is bringing others with you.',
    tagline: "You see what others don't. Yet.",
    tower: 'pm',
    towerName: 'PM Tower',
  },
  M: {
    name: 'Mastermind',
    desc: "You think in frameworks, data, and structured reasoning. Your superpower is making the complex clear. Your challenge is knowing when good enough is good enough.",
    tagline: "You build the map before anyone knows they're lost.",
    tower: 'strategy',
    towerName: 'Strategy Tower',
  },
  B: {
    name: 'Builder',
    desc: "You ship. While others deliberate, you're already iterating. Your superpower is momentum. Your challenge is stopping long enough to ask if you're building the right thing.",
    tagline: "Done is better than perfect. Until it isn't.",
    tower: 'ai',
    towerName: 'AI Tower',
  },
}

const LANDING_PROFESSORS = [
  { key: 'julie_zhuo',      name: 'Julie Zhuo',      title: 'Enchantress of Design'      },
  { key: 'shreyas_doshi',   name: 'Shreyas Doshi',   title: 'Master of Strategic Spells' },
  { key: 'nick_turley',     name: 'Nick Turley',     title: 'Keeper of the Crystal'      },
  { key: 'marc_andreessen', name: 'Marc Andreessen', title: 'The Contrarian Archmage'    },
]


// Professor image maps — add new professors here as images arrive
const PROF_CARD_IMG: Record<string, string> = {
  gibson_biddle:         '/assets/professors/gibson_biddle_card.avif',
  julie_zhuo:            '/assets/professors/julie_zhuo_card.avif',
  shreyas_doshi:         '/assets/professors/shreyas_doshi_card.avif',
  jules_walter:          '/assets/professors/jules_walter_card.avif',
  april_dunford:         '/assets/professors/april_dunford_card.avif',
  marty_cagan:           '/assets/professors/marty_cagan_card.avif',
  chandra_janakiraman:   '/assets/professors/chandra_janakiraman_card.avif',
  roger_martin:          '/assets/professors/roger_martin_card.avif',
  christopher_lochhead:  '/assets/professors/christopher_lochhead_card.avif',
  marc_andreessen:       '/assets/professors/marc_andreessen_card.avif',
  hamilton_helmer:       '/assets/professors/hamilton_helmer_card.avif',
  tal_raviv:             '/assets/professors/tal_raviv_card.avif',
  aman_khan:             '/assets/professors/aman_khan_card.avif',
  claire_vo:             '/assets/professors/claire_vo_card.avif',
  nick_turley:           '/assets/professors/nick_turley_card.avif',
  hamel_husain:          '/assets/professors/hamel_husain_card.avif',
  chip_huyen:            '/assets/professors/chip_huyen_card.avif',
  fei_fei_li:            '/assets/professors/fei_fei_li_card.avif',
  lenny_rachitsky:       '/assets/professors/lenny_rachitsky_card.avif',
}
const PROF_DUEL_IMG: Record<string, string> = {
  gibson_biddle:         '/assets/professors/gibson_biddle_duel.avif',
  julie_zhuo:            '/assets/professors/julie_zhuo_duel.avif',
  shreyas_doshi:         '/assets/professors/shreyas_doshi_duel.avif',
  jules_walter:          '/assets/professors/jules_walter_duel.avif',
  april_dunford:         '/assets/professors/april_dunford_duel.avif',
  marty_cagan:           '/assets/professors/marty_cagan_duel.avif',
  chandra_janakiraman:   '/assets/professors/chandra_janakiraman_duel.avif',
  roger_martin:          '/assets/professors/roger_martin_duel.avif',
  christopher_lochhead:  '/assets/professors/christopher_lochhead_duel.avif',
  marc_andreessen:       '/assets/professors/marc_andreessen_duel.avif',
  hamilton_helmer:       '/assets/professors/hamilton_helmer_duel.avif',
  tal_raviv:             '/assets/professors/tal_raviv_duel.avif',
  aman_khan:             '/assets/professors/aman_khan_duel.avif',
  claire_vo:             '/assets/professors/claire_vo_duel.avif',
  nick_turley:           '/assets/professors/nick_turley_duel.avif',
  hamel_husain:          '/assets/professors/hamel_husain_duel.avif',
  chip_huyen:            '/assets/professors/chip_huyen_duel.avif',
  fei_fei_li:            '/assets/professors/fei_fei_li_duel.avif',
  lenny_rachitsky:       '/assets/professors/lenny_rachitsky_duel.avif',
}
function getProfCardImg(key: string): string {
  return PROF_CARD_IMG[key] ?? `/assets/professors/${key}.jpg`
}
function getProfDuelImg(key: string): string {
  return PROF_DUEL_IMG[key] ?? `/assets/professors/${key === 'lenny_oracle' ? 'lenny_rachitsky' : key}_nobg.avif`
}

const LENNY_PROF: ProfessorDef = {
  key: 'lenny_rachitsky',
  name: 'Lenny Rachitsky',
  title: 'The Keeper of Product Lore',
  tower: 'pm',
  isBoss: false,
}

const TOWER_ICON: Record<string, string> = {
  pm:       '/assets/pm_tower_icon.avif',
  strategy: '/assets/strategy_tower_icon.avif',
  ai:       '/assets/ai_tower_icon.avif',
}

const SPELL_EMOJIS: Record<string, string> = {
  gibson_biddle:         '📐',
  julie_zhuo:            '🪞',
  shreyas_doshi:         '⚡',
  jules_walter:          '🎭',
  april_dunford:         '🎯',
  marty_cagan:           '⚔️',
  chandra_janakiraman:   '🧱',
  roger_martin:          '♟️',
  christopher_lochhead:  '🗺️',
  marc_andreessen:       '🔮',
  hamilton_helmer:       '⭐',
  tal_raviv:             '🛠️',
  aman_khan:             '📊',
  claire_vo:             '🤖',
  nick_turley:           '🏰',
  hamel_husain:          '🔬',
  chip_huyen:            '⚙️',
  fei_fei_li:            '🧠',
  lenny_rachitsky:       '📖',
}

const LETTERS = ['A', 'B']

// Scale font size down for long text so it always fits in its box
function questionFontSize(len: number): string {
  if (len < 120) return '18px'
  if (len < 200) return '15px'
  if (len < 300) return '13px'
  return '11.5px'
}
function answerFontSize(len: number): string {
  if (len < 80)  return '20px'
  if (len < 130) return '17px'
  if (len < 180) return '15px'
  return '13px'
}

function buildDisplayOptions(q: Omit<DuelQuestion, 'displayOptions'>): { text: string; isCorrect: boolean }[] {
  const correctText = q.options.find(o => o.startsWith(q.correct_answer + '.'))?.replace(/^[A-D]\.\s*/, '') ?? ''
  const rawDistractor = (q.best_distractor ?? '').replace(/^[A-D]\.\s*/, '').trim()
  const distractorText = rawDistractor || q.options.find(o => !o.startsWith(q.correct_answer + '.'))?.replace(/^[A-D]\.\s*/, '') || ''
  const opts = [
    { text: correctText, isCorrect: true },
    { text: distractorText, isCorrect: false },
  ]
  return Math.random() < 0.5 ? opts : [opts[1], opts[0]]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  // Navigation
  // Scale game to fit any screen size
  useEffect(() => {
    function updateScale() {
      const scale = Math.min(window.innerWidth / 960, window.innerHeight / 540)
      document.documentElement.style.setProperty('--game-scale', String(scale))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])


  const [screen, setScreen] = useState<Screen>('landing')

  // Player identity
  const [playerName, setPlayerName] = useState('')
  const [archetype, setArchetype] = useState<ArchetypeKey>('V')

  // Oracle state — 1 question per session, answer = archetype
  const [oracleQ, setOracleQ] = useState<OracleQuestion | null>(null)
  const [oracleSelected, setOracleSelected] = useState<ArchetypeKey | null>(null)

  // Global game state
  const [hearts, setHearts] = useState(5)
  const [defeatedProfessors, setDefeatedProfessors] = useState<Set<string>>(new Set())

  // Open progression state
  const [activeTowerKey, setActiveTowerKey] = useState<TowerKey>('pm')  // controls right panel tower
  const [activeProfKey, setActiveProfKey] = useState<string>('gibson_biddle') // current/last duel prof
  const [duelPhase, setDuelPhase] = useState<'selecting' | 'active'>('selecting') // selecting = choose next, active = mid-duel

  // Duel state
  const [duelQs, setDuelQs] = useState<DuelQuestion[]>([])
  const [duelLoading, setDuelLoading] = useState(false)
  const [duelError, setDuelError] = useState(false)
  const [qIndex, setQIndex] = useState(0)
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)
  const [showSparkle, setShowSparkle] = useState(false)

  // Spell win state
  const [wonSpell, setWonSpell] = useState('')
  const [wonProfKey, setWonProfKey] = useState('')
  const [wonProfIsBoss, setWonProfIsBoss] = useState(false)
  const [correctInDuel, setCorrectInDuel] = useState(0)

  // Playbook state — tracks which screen to return to
  const [playbookReturn, setPlaybookReturn] = useState<Screen>('duel')
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false)

  // Tower select modal
  const [towerModalOpen, setTowerModalOpen] = useState(false)
  const pendingScrollTowerRef = useRef<TowerKey | null>(null)
  const towerModalBodyRef = useRef<HTMLDivElement>(null)

  // Rules of the Academy modal
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const hasShownRulesRef = useRef(false)
  const [showHints, setShowHints] = useState(false)
  const hintsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingAdvanceRef = useRef<(() => void) | null>(null)

  // Scroll modal to the right section on open
  useEffect(() => {
    if (!towerModalOpen || !towerModalBodyRef.current) return
    const tower = pendingScrollTowerRef.current
    pendingScrollTowerRef.current = null
    if (tower) {
      // Use setTimeout to allow card images to load before measuring positions.
      // Targeting the section header (text-only, no images) avoids layout-shift errors.
      setTimeout(() => {
        const body = towerModalBodyRef.current
        const section = document.getElementById(`tm-section-${tower}`)
        if (!body || !section) return
        const hdr = section.querySelector<HTMLElement>('.tm-section-hdr') ?? section
        const bodyRect = body.getBoundingClientRect()
        const hdrRect = hdr.getBoundingClientRect()
        // getBoundingClientRect returns physical (scaled) px; scrollTop is layout px — divide by game scale
        const scale = parseFloat(document.documentElement.style.getPropertyValue('--game-scale') || '1') || 1
        body.scrollTop += (hdrRect.top - bodyRect.top - 6) / scale
      }, 120)
    } else {
      towerModalBodyRef.current.scrollTop = 0
    }
  }, [towerModalOpen])

  // Summons letter state
  const [summonsVariant, setSummonsVariant] = useState<SummonsVariant>('easter_egg')
  const [summonsOpen, setSummonsOpen] = useState(false)

  // Lenny duel state (v1: accessible anytime, no heart cost, +3 hearts on win)
  const [isLennyDuel, setIsLennyDuel] = useState(false)

  const [gameOverProfKey, setGameOverProfKey] = useState('')


  // ── Audio ─────────────────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(false)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const mutedRef = useRef(false)

  const SCREEN_MUSIC: Partial<Record<Screen, string>> = {
    landing:       '/assets/sounds/ambient_landing.mp3',
    oracle:        '/assets/sounds/ambient_oracle.mp3',
    archetype:     '/assets/sounds/ambient_archetype.mp3',
    duel:          '/assets/sounds/ambient_duel.mp3',
    spellwin:      '/assets/sounds/ambient_spellwin.mp3',
    grand:         '/assets/sounds/ambient_spellwin.mp3',
    game_over:     '/assets/sounds/ambient_landing.mp3',
  }

  useEffect(() => { mutedRef.current = muted }, [muted])

  // Auto-show Rules of the Academy on first duel screen visit
  useEffect(() => {
    if (screen === 'duel' && !hasShownRulesRef.current) {
      hasShownRulesRef.current = true
      setRulesModalOpen(true)
    }
  }, [screen])

  function closeRules(wasAutoShow: boolean) {
    setRulesModalOpen(false)
    if (wasAutoShow) {
      setShowHints(true)
      if (hintsTimerRef.current) clearTimeout(hintsTimerRef.current)
      hintsTimerRef.current = setTimeout(() => setShowHints(false), 4000)
    }
  }
  function dismissHints() {
    setShowHints(false)
    if (hintsTimerRef.current) clearTimeout(hintsTimerRef.current)
  }

  useEffect(() => {
    const src = SCREEN_MUSIC[screen]
    if (!src) return
    const current = bgAudioRef.current
    if (current && current.getAttribute('data-src') === src) return // same track, keep playing
    if (current) { current.pause(); current.src = '' }
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = 0.35
    audio.setAttribute('data-src', src)
    bgAudioRef.current = audio
    if (!mutedRef.current) audio.play().catch(() => {})
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = bgAudioRef.current
    if (!audio) return
    if (muted) { audio.pause() } else { audio.play().catch(() => {}) }
  }, [muted])

  function playSfx(path: string) {
    if (mutedRef.current) return
    const sfx = new Audio(path)
    sfx.volume = 0.7
    sfx.play().catch(() => {})
  }

  // Share / download
  const gwCardRef = useRef<HTMLDivElement>(null)
  const goCardRef = useRef<HTMLDivElement>(null)
  const pbCardRef = useRef<HTMLDivElement>(null)
  const [copyLabel, setCopyLabel] = useState('✦ SHARE YOUR JOURNEY ✦')
  const [pbCopyLabel, setPbCopyLabel] = useState('COPY LINK')

  function handleCopyLink() {
    const archetypeNames = { V: 'Visionary', M: 'Mastermind', B: 'Builder' }
    const text = `${displayName} just became a Grand Wizard of Product as a ${archetypeNames[archetype]}! 🧙 I defeated 19 professors across 3 towers in Spellcraft. Can you beat my score?`
    const url = window.location.href.split('?')[0]
    navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
      posthog.capture('link_copied', { screen: 'grand_wizard' })
      setCopyLabel('✓ COPIED!')
      setTimeout(() => setCopyLabel('✦ SHARE YOUR JOURNEY ✦'), 2500)
    })
  }

  async function handleDownloadPlaybook() {
    if (!gwCardRef.current) return
    posthog.capture('playbook_downloaded', { screen: 'grand_wizard' })
    try {
      const dataUrl = await toPng(gwCardRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = 'spellcraft-playbook.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  async function handleDownloadGameOver() {
    const collected = Array.from(defeatedProfessors)

    const CARD_W = 90, CARD_H = 135, GAP = 10, COLS = 4, PAD = 28, SCALE = 2
    const rows = Math.max(1, Math.ceil(collected.length / COLS))
    const gridW = Math.min(collected.length, COLS) * (CARD_W + GAP) - GAP
    const CW = Math.max(360, gridW + PAD * 2)
    const CH = PAD + 72 + (collected.length > 0 ? rows * (CARD_H + GAP) - GAP + GAP : 32) + 28 + PAD

    const canvas = document.createElement('canvas')
    canvas.width = CW * SCALE; canvas.height = CH * SCALE
    const ctx = canvas.getContext('2d')!
    ctx.scale(SCALE, SCALE)

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CH)
    bg.addColorStop(0, '#1a1008'); bg.addColorStop(1, '#0d0804')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH)

    // Border
    ctx.strokeStyle = '#7a5515'; ctx.lineWidth = 2
    ctx.strokeRect(1, 1, CW - 2, CH - 2)

    // Load HarryP font (already in page CSS, should be cached)
    await document.fonts.load('32px HarryP').catch(() => {})

    // Title
    ctx.fillStyle = '#f0c060'; ctx.textAlign = 'center'
    ctx.font = '32px HarryP, cursive'
    ctx.fillText('Spellcraft', CW / 2, PAD + 34)

    // Subtitle
    ctx.fillStyle = '#c8922a'; ctx.font = '600 15px "EB Garamond", Georgia, serif'
    ctx.fillText(
      collected.length === 0 ? 'No spells collected yet' : `${collected.length} Spell${collected.length !== 1 ? 's' : ''} Collected`,
      CW / 2, PAD + 58
    )

    // Load and draw spell card images
    if (collected.length > 0) {
      const startX = (CW - (Math.min(collected.length, COLS) * (CARD_W + GAP) - GAP)) / 2
      const startY = PAD + 72 + GAP

      const imgs = await Promise.allSettled(collected.map(key => new Promise<{ img: HTMLImageElement; key: string }>((resolve, reject) => {
        const src = SPELL_CARD_IMAGES[key]
        if (!src) { reject(new Error('no src')); return }
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => resolve({ img, key })
        img.onerror = reject
        img.src = src
      })))

      imgs.forEach((result, i) => {
        const col = i % COLS, row = Math.floor(i / COLS)
        const x = startX + col * (CARD_W + GAP), y = startY + row * (CARD_H + GAP)
        ctx.strokeStyle = 'rgba(200,160,60,.6)'; ctx.lineWidth = 1
        ctx.strokeRect(x, y, CARD_W, CARD_H)
        if (result.status === 'fulfilled') ctx.drawImage(result.value.img, x, y, CARD_W, CARD_H)
      })
    }

    // Footer
    ctx.fillStyle = 'rgba(200,160,80,.45)'; ctx.font = '11px "EB Garamond", Georgia, serif'
    ctx.fillText('wizardofproduct.com', CW / 2, CH - PAD / 2)

    const link = document.createElement('a')
    link.download = 'spellcraft-run.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handleCopyPlaybookLink() {
    const archetypeNames = { V: 'Visionary', M: 'Mastermind', B: 'Builder' }
    const text = `${displayName} has collected ${defeatedProfessors.size} spell${defeatedProfessors.size !== 1 ? 's' : ''} so far in Spellcraft as a ${archetypeNames[archetype]}. Still duelling. Can you keep up?`
    const url = window.location.href.split('?')[0]
    navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
      posthog.capture('link_copied', { screen: 'playbook', spells_collected: defeatedProfessors.size })
      setPbCopyLabel('✓ COPIED!')
      setTimeout(() => setPbCopyLabel('COPY LINK'), 2500)
    })
  }

  async function handleDownloadPlaybookCard() {
    if (!pbCardRef.current) return
    posthog.capture('playbook_downloaded', { screen: 'playbook', spells_collected: defeatedProfessors.size })
    try {
      const dataUrl = await toPng(pbCardRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = 'spellcraft-playbook.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const ARCHETYPE_FALLBACK_NAMES: Record<ArchetypeKey, string> = { V: 'The Dreamer', M: 'The Tactician', B: 'The Maker' }
  const displayName = playerName.trim() || ARCHETYPE_FALLBACK_NAMES[archetype]

  const arc = ARCHETYPES[archetype]
  const currentQ = duelQs[qIndex]
  const allProfessors = Object.values(TOWERS).flatMap(t => t.professors)
  const currentProf: ProfessorDef | null = isLennyDuel ? LENNY_PROF : (allProfessors.find(p => p.key === activeProfKey) ?? null)
  const currentTower = (isLennyDuel || !currentProf) ? null : TOWERS[currentProf.tower]
  const panelTower = TOWERS[activeTowerKey]
  const panelNonBossProfs = panelTower?.professors.filter(p => !p.isBoss) ?? []
  const panelDefeatedNonBoss = panelNonBossProfs.filter(p => defeatedProfessors.has(p.key)).length
  const panelBossUnlocked = panelDefeatedNonBoss >= 3

  // ── Oracle handlers ───────────────────────────────────────────────────────────
  function beginOracle() {
    posthog.capture('game_started')
    const q = shuffle([...ORACLE_QUESTIONS])[0]
    setOracleQ(q)
    setOracleSelected(null)
    setScreen('oracle')
  }

  function submitOracleAnswer() {
    if (!oracleSelected) return
    posthog.capture('archetype_assigned', { archetype: oracleSelected })
    setArchetype(oracleSelected)
    setScreen('archetype')
  }

  // ── Duel handlers ─────────────────────────────────────────────────────────────
  async function launchDuel(towerKey: TowerKey, profKey: string) {
    const prof = TOWERS[towerKey]?.professors.find(p => p.key === profKey)
    if (!prof) return

    setIsLennyDuel(false)
    setActiveTowerKey(towerKey)
    setActiveProfKey(profKey)
    setDuelPhase('active')
    posthog.capture('duel_started', { professor: profKey, tower: towerKey })
    setDuelQs([])
    setQIndex(0)
    setAnsweredIndex(null)
    setLastResult(null)
    setCorrectInDuel(0)
    setDuelLoading(true)
    setDuelError(false)
    setScreen('duel')

    try {
      const res = await fetch(`/api/questions?professor=${prof.key}`)
      const data = await res.json()
      const qs = Array.isArray(data) ? data : []
      if (qs.length === 0) setDuelError(true)
      setDuelQs(qs.map((q: Omit<DuelQuestion, 'displayOptions'>) => ({ ...q, displayOptions: buildDisplayOptions(q) })))
    } catch {
      setDuelError(true)
      setDuelQs([])
    } finally {
      setDuelLoading(false)
    }
  }

  async function launchLennyDuel() {
    setIsLennyDuel(true)
    setActiveProfKey('lenny_rachitsky')
    setDuelPhase('active')
    posthog.capture('duel_started', { professor: 'lenny_rachitsky', tower: 'final' })
    setDuelQs([])
    setQIndex(0)
    setAnsweredIndex(null)
    setLastResult(null)
    setCorrectInDuel(0)
    setDuelLoading(true)
    setDuelError(false)
    setScreen('duel')
    try {
      const res = await fetch('/api/questions?professor=lenny_rachitsky')
      const data = await res.json()
      const qs = Array.isArray(data) ? data : []
      if (qs.length === 0) setDuelError(true)
      setDuelQs(qs.map((q: Omit<DuelQuestion, 'displayOptions'>) => ({ ...q, displayOptions: buildDisplayOptions(q) })))
    } catch {
      setDuelError(true)
      setDuelQs([])
    } finally {
      setDuelLoading(false)
    }
  }

  function startFirstDuel() {
    const primaryTowerKey = TOWER_ORDER_BY_ARCHETYPE[archetype][0]
    const tower = TOWERS[primaryTowerKey]
    const firstProf = tower.professors.find(p => !p.isBoss)!
    setActiveTowerKey(primaryTowerKey)
    launchDuel(primaryTowerKey, firstProf.key)
  }

  function handleAnswer(optionIndex: number) {
    if (answeredIndex !== null || !currentQ || !currentProf) return

    const isCorrect = currentQ.displayOptions[optionIndex].isCorrect
    setAnsweredIndex(optionIndex)

    let newHearts = hearts

    if (isCorrect) {
      setCorrectInDuel(prev => prev + 1)
      setLastResult('correct')
      setShowSparkle(true)
      setTimeout(() => setShowSparkle(false), 1100)
      playSfx('/assets/sounds/sfx/correct.ogg')
    } else {
      if (!isLennyDuel) {
        newHearts = hearts - 1
        setHearts(newHearts)
        posthog.capture('heart_lost', { professor: currentProf.key, hearts_remaining: newHearts, difficulty: currentQ.difficulty })
      }
      setLastResult('wrong')
      playSfx('/assets/sounds/sfx/wrong.ogg')
    }
    posthog.capture('answer_submitted', { professor: currentProf.key, correct: isCorrect, difficulty: currentQ.difficulty })

    // Fade out the feedback label after 4s — Continue button stays
    setTimeout(() => setLastResult(null), 4000)

    // Snapshot values to avoid stale closures in the continue handler
    const nextQIndex = qIndex + 1
    const profKey = currentProf.key
    const isBoss = currentProf.isBoss ?? false

    pendingAdvanceRef.current = () => {
      pendingAdvanceRef.current = null
      if (!isLennyDuel && newHearts <= 0) {
        posthog.capture('game_over', { professor: profKey, spells_collected: defeatedProfessors.size })
        setGameOverProfKey(profKey)
        setScreen('game_over')
        return
      }
      if (nextQIndex < duelQs.length) {
        setQIndex(nextQIndex)
        setAnsweredIndex(null)
        setLastResult(null)
        return
      }
      // All 5 answered
      posthog.capture('spell_won', { professor: profKey, is_boss: isBoss, is_lenny: isLennyDuel })
      setDefeatedProfessors(prev => new Set([...prev, profKey]))
      setWonSpell(SPELL_NAMES[profKey] ?? 'The Product Lore')
      setWonProfKey(profKey)
      setWonProfIsBoss(isBoss)
      playSfx('/assets/sounds/sfx/spell_win.wav')
      setScreen('spellwin')
    }
  }

  function handleContinue() {
    pendingAdvanceRef.current?.()
  }

  // ── Lenny's Blessing ──────────────────────────────────────────────────────────

  // ── Tower progression ─────────────────────────────────────────────────────────
  function advanceAfterSpellWin() {
    // Lenny win: +3 hearts (cap 8), add to playbook, check completion
    if (wonProfKey === 'lenny_rachitsky') {
      setIsLennyDuel(false)
      setHearts(prev => Math.min(prev + 3, 8))
      if (defeatedProfessors.size >= 19) {
        posthog.capture('grand_wizard', { archetype })
        setScreen('grand')
      } else {
        setDuelPhase('selecting')
        setScreen('duel')
      }
      return
    }

    // All 19 collected (18 profs already in defeatedProfessors + Lenny already added above)
    if (defeatedProfessors.size >= 19) {
      posthog.capture('grand_wizard', { archetype })
      setScreen('grand')
      return
    }

    const wonProf = allProfessors.find(p => p.key === wonProfKey)
    const towerKey = wonProf?.tower ?? activeTowerKey

    setDuelPhase('selecting')
    setScreen('duel')
  }

  // ── Summons handlers ──────────────────────────────────────────────────────────
  function openSummonsEasterEgg() {
    setSummonsVariant('easter_egg')
    setSummonsOpen(true)
  }

  function dismissSummons() {
    setSummonsOpen(false)
  }

  // ── Playbook handlers ─────────────────────────────────────────────────────────
  function openPlaybook(from: Screen) {
    setPlaybookReturn(from)
    setScreen('playbook')
  }

  function closePlaybook() {
    setScreen(playbookReturn)
  }


  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="game-container">

      {/* ══════════════════════════════════
          S1 — LANDING
      ══════════════════════════════════ */}
      <div id="s-landing" className={`screen${screen === 'landing' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src="/assets/Landing_Page_Background.avif" alt="" />
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 40%, rgba(0,0,0,.22) 100%)' }} />

        <div className="landing-top-banner">Lorethorn Academy of Product Spellcraft</div>

        <div className="landing-logo-block">
          <div className="landing-logo-title">Spellcraft</div>
          <div className="landing-logo-sub">Wizard of Product</div>
        </div>

        <div className="prof-grid">
          {LANDING_PROFESSORS.map((p) => (
            <div key={p.name} className="prof-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="prof-card-img" src={getProfCardImg(p.key)} alt={p.name} />
              <div className="prof-card-overlay">
                <div className="pname">{p.name}</div>
                <div className="ptitle">{p.title}</div>
              </div>
            </div>
          ))}
          <div className="prof-card final" onClick={openSummonsEasterEgg} style={{ cursor: 'pointer' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="prof-card-img" src="/assets/professors/lenny_rachitsky_card.avif" alt="Lenny Rachitsky" />
            <div className="prof-card-overlay">
              <div className="pname">Lenny Rachitsky</div>
              <div className="keeper-badge">⚜ The Keeper ⚜</div>
            </div>
          </div>
          <div className="prof-card more">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="prof-card-img" src="/assets/professor_placeholder.avif" alt="" style={{ opacity:.8, objectFit:'contain', objectPosition:'center center' }} />
            <div className="prof-card-overlay" />
          </div>
        </div>

        {/* Scroll: image and text are siblings so filter on img never touches text */}
        <div className="scroll-shadow-wrap">
          <div className="scroll-body">
            <div className="scroll-text">Three towers.<br />Eighteen professors.</div>
            <div className="scroll-text">One Keeper.</div>
            <div className="scroll-divider"><div className="scroll-divider-gem" /></div>
            <div className="scroll-text lower">Duel masters.<br />Build your playbook.<br />Rule the product realm.</div>
          </div>
        </div>

        <div className="orb-wrap">
          <div className="orb-assembly" onClick={beginOracle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="orb-btn-img" src="/assets/orb_button_transparent.avif" alt="Begin" />
          </div>
        </div>

        <div className="curator-bar">
          <div className="curator-bar-text">
            Curated from <span style={{ fontWeight: 700 }}>Lenny&apos;s</span>{' '}Newsletter &amp; Podcast
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════
          S2 — ORACLE'S RITE
          Multi-question: 3 of 5 shown, archetype tallied
      ══════════════════════════════════ */}
      <div id="s-oracle" className={`screen${screen === 'oracle' ? ' active' : ''}`}>
        <div className="oracle-bg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="oracle-hat" src="/assets/sorting_hat_transparent.avif" alt="" />
        <div className="oracle-title-block">
          <div className="oracle-title-main">The Codex Oracle</div>
        </div>
        <div className="oracle-wrap">
          <div className="oracle-qcard-outer">
            <div className="oracle-qcard">
              {oracleQ && (
                <>
                  <div className="oracle-q-box">
                    <div className="oracle-q">{oracleQ.text}</div>
                  </div>
                  <div className="oracle-eyebrow"><span>CHOOSE YOUR PATH</span></div>
                  <div className="oracle-opts">
                    {oracleQ.options.map((opt, i) => {
                      const [before, after] = opt.text.split(' — ')
                      const title = before.trim().split(/\s+/).slice(0, 5).join(' ').replace(/[.,;]$/, '')
                      const rawDesc = after ? after.trim() : opt.text
                      const desc = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1)
                      return (
                        <div
                          key={opt.archetype}
                          className={`oracle-opt${oracleSelected === opt.archetype ? ' selected' : ''}`}
                          onClick={() => setOracleSelected(opt.archetype)}
                        >
                          <div className="oracle-opt-letter">{['A', 'B', 'C'][i]}</div>
                          <div className="oracle-opt-title">{title}</div>
                          <div className="oracle-opt-dot">◆</div>
                          <div className="oracle-opt-desc">{desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <button
              className={`oracle-submit${oracleSelected ? ' visible' : ''}`}
              onClick={submitOracleAnswer}
            >
              Reveal what the Oracle has decided
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          S3 — ARCHETYPE REVEAL
      ══════════════════════════════════ */}
      <div id="s-archetype" className={`screen${screen === 'archetype' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Landing_Page_Background_1774611504383.avif" alt="" />
        <div className="ar-swirl" />
        <div className="ar-col">
          <div className="ar-scroll">
            <div className="ar-scroll-bg" />
            <div className="ar-content">
              <div className="ar-herald">The Oracle Has Spoken</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ar-name">{arc.name}</div>
              <div className="ar-rule" />
              <div className="ar-desc">{arc.desc}</div>
              <div className="ar-tagline">{arc.tagline}</div>
            </div>
          </div>
          <button className="ar-cta" onClick={startFirstDuel}>
            ✦ Enter {arc.towerName} ✦
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          S4 — DUEL SCREEN
      ══════════════════════════════════ */}
      <div id="s-duel" className={`screen${screen === 'duel' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Landing_Page_Background_1774611504383.avif" alt="" />
        <div className="du-overlay" />

        {/* Rules of the Academy button */}
        <button className="rules-btn" onClick={() => setRulesModalOpen(true)} aria-label="Rules of the Academy">ℹ</button>

        {/* Top status bar */}
        <div className="du-topbar">
          {/* Professor side */}
          <div className="du-hud-side">
            <div className="du-hud-info">
              <div className="du-hud-name">{currentProf?.name}</div>
              <div className="du-hud-sub">{currentProf?.title}</div>
              {(() => {
                const totalQs = duelQs.length || 5
                const profHp = duelPhase === 'active'
                  ? Math.max(0, Math.round((1 - correctInDuel / totalQs) * 100))
                  : 100
                return (
                  <div className="du-hp-wrap">
                    <div className="du-hp-track"><div className="du-hp-fill red" style={{ width: `${profHp}%` }} /></div>
                    <span className="du-hp-label">{profHp} / 100</span>
                  </div>
                )
              })()}
            </div>
          </div>
          {/* Center title */}
          <div className="du-title-center">
            <div className="du-duel-title">Spellcraft</div>
            <div className="du-round-tag">
              {duelPhase === 'selecting' ? 'Select your opponent' : `Question ${qIndex + 1} of ${duelQs.length || 5}`}
            </div>
          </div>
          {/* Player side */}
          <div className="du-hud-side du-hud-right">
            <div className="du-hud-info" style={{ textAlign: 'right' }}>
              <div className="du-hud-name">{arc.name}</div>
              {(() => {
                const displayMax = Math.max(5, hearts)
                const playerHp = Math.round((hearts / displayMax) * 100)
                return (
                  <>
                    <div className="du-hud-sub" style={{ textAlign: 'right' }}>
                      {Array.from({ length: displayMax }).map((_, i) => (
                        <span key={i} style={{ fontSize: '14px', color: i < hearts ? (i >= 5 ? '#f0c060' : '#e83030') : 'rgba(100,60,60,.4)' }}>♥</span>
                      ))}
                    </div>
                    <div className="du-hp-wrap" style={{ justifyContent: 'flex-end' }}>
                      <div className="du-hp-track"><div className="du-hp-fill blue" style={{ width: `${playerHp}%` }} /></div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="du-main">
          {/* LEFT: Switch towers + Professor figure + Possible Rewards */}
          <div className="du-left-col">
            <div className={`du-tower-panel${showHints ? ' hint-glow' : ''}`} onClick={showHints ? dismissHints : undefined}>
              {showHints && <div className="hint-label hint-label-left">Choose your opponent</div>}
              <div className="du-panel-title" onClick={() => setTowerModalOpen(true)} style={{cursor:'pointer'}}>Select professors</div>
              <div className="du-left-tower-btns">
                {(['pm', 'strategy', 'ai'] as TowerKey[]).map(tk => (
                  <button
                    key={tk}
                    className={`du-left-tower-btn${activeTowerKey === tk ? ' active' : ''}`}
                    onClick={() => { setActiveTowerKey(tk); pendingScrollTowerRef.current = tk; setTowerModalOpen(true); }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={TOWER_ICON[tk]} alt="" />
                    {tk === 'pm' ? 'PM' : tk === 'strategy' ? 'Strategy' : 'AI'}
                  </button>
                ))}
              </div>
            </div>
            <div className="du-prof-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentProf?.key}
                className="du-prof-img"
                src={getProfDuelImg(currentProf?.key ?? '')}
                alt={currentProf?.name}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (img.src.includes('_nobg.avif')) {
                    img.src = `/assets/professors/${currentProf?.key === 'lenny_oracle' ? 'lenny_rachitsky' : currentProf?.key}_duel.avif`
                  } else {
                    img.style.display = 'none'
                  }
                }}
              />
            </div>
          </div>

          {/* CENTER: Question + Answers */}
          <div className="du-center-col">
            {/* Question — compact header at top */}
            <div className="du-question-box">
              {duelPhase === 'selecting' ? (
                <div className="du-selecting">
                  <div className="du-selecting-title">Choose Your Opponent</div>
                  <div className="du-selecting-desc">Click a professor in the tower panel →<br />or switch towers using the tabs on the left.</div>
                  <button className="du-browse-all-btn" onClick={() => setTowerModalOpen(true)}>✦ Browse All Professors ✦</button>
                </div>
              ) : duelError ? (
                <div className="duel-q-loading" style={{ color: 'var(--red-wrong)' }}>
                  The archive is unreachable. Please check your connection and refresh.
                </div>
              ) : duelLoading || !currentQ ? (
                <div className="duel-q-loading">Summoning questions…</div>
              ) : (
                <>
                  <div className="du-question-text" style={{ fontSize: questionFontSize(currentQ.question.length) }}>{currentQ.question}</div>
                  {answeredIndex !== null && currentQ.explanation && (
                    <div className="duel-q-explanation">{currentQ.explanation}</div>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="du-category-tag">
              <span className="du-cat-label">{currentTower?.name ?? 'Product'}</span>
            </div>

            {/* Answer cards — fill remaining space */}
            {currentQ && !duelLoading && duelPhase === 'active' && (
              <div className="du-ans-row">
                {(() => {
                  const sharedSize = answerFontSize(Math.max(...currentQ.displayOptions.map(o => o.text.length)))
                  return currentQ.displayOptions.map((opt, i) => {
                    let cls = 'du-ans-card'
                    if (answeredIndex !== null) {
                      if (i === answeredIndex) cls += opt.isCorrect ? ' correct' : ' wrong'
                      else if (opt.isCorrect) cls += ' reveal-correct'
                      else cls += ' answered'
                    }
                    return (
                      <div key={i} className={cls} onClick={() => handleAnswer(i)}>
                        <div className="du-ans-letter">{LETTERS[i]}</div>
                        <div className="du-ans-desc" style={{ fontSize: sharedSize }}>{opt.text}</div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}

          </div>

          {/* RIGHT: Spellbook + Player */}
          <div className="du-right-col">
            {/* Playbook panel — click opens modal like Switch Towers */}
            <div className={`du-spellbook-panel${showHints ? ' hint-glow' : ''}`} style={{ position: 'relative', zIndex: 5 }} onClick={showHints ? dismissHints : undefined}>
              {showHints && <div className="hint-label hint-label-right">Your spell collection</div>}
              <div className="du-sb-header" onClick={() => { dismissHints(); setPlaybookModalOpen(true) }}>
                <div className="du-sb-header-label">Playbook</div>
                <div className="du-sb-header-icon">📜</div>
                <div className="du-sb-header-bottom">
                  <span className="du-sb-header-count">{defeatedProfessors.size}<span className="du-sb-header-total"> / 19 spells</span></span>
                </div>
                <div className="du-sb-header-bottom" style={{ fontFamily: "'EB Garamond', serif", fontSize: 11, color: 'rgba(200,165,90,.85)', fontStyle: 'italic', marginTop: 1 }}>
                  18 professors · The Keeper
                </div>
              </div>
            </div>

            <div className="du-player-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="du-player-img" src="/assets/player_apprentice_nobg.avif" alt="Apprentice"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          </div>
        </div>

        {/* Feedback toast — top of screen, auto-fades */}
        {lastResult && (
          <div className={`duel-feedback visible ${lastResult}`}>
            {lastResult === 'correct' ? '✓ Correct!' : isLennyDuel ? '✗ Incorrect — no heart lost' : '✗ Wrong 💔'}
          </div>
        )}

        {/* Continue button — centered at bottom */}
        {answeredIndex !== null && (
          <button className="duel-continue-btn" onClick={handleContinue}>✦ Continue ✦</button>
        )}

        {/* Sparkle burst on correct answer */}
        {showSparkle && (
          <div className="sparkle-container" aria-hidden="true">
            <div className="sparkle-flash" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <div key={angle} className="sparkle-particle" style={{ '--angle': `${angle}deg`, fontSize: i % 2 === 0 ? 20 : 14 } as React.CSSProperties}>✦</div>
            ))}
          </div>
        )}


        {/* Playbook modal — bottom sheet (same style as tower select) */}
        {playbookModalOpen && (
          <div className="pbm-overlay" onClick={() => setPlaybookModalOpen(false)}>
            <div className="pbm-sheet" onClick={e => e.stopPropagation()}>
              <div className="pbm-header">
                <span className="pbm-title">✦ Your Playbook ✦</span>
                <button className="pbm-close-btn" onClick={() => setPlaybookModalOpen(false)}>✕ CLOSE</button>
              </div>
              <div className="pbm-body">
                <div className="pb-wrap">
                    <div className="pb-header">
                      <div className="pb-title">Your Playbook</div>
                      <div className="pb-subtitle">✦ Max spells: 19 · 1 per professor ✦</div>
                    </div>

                    {/* Lenny's spell card */}
                    <div style={{ marginBottom: 12 }}>
                      <div className="pb-tower-head" style={{ background: 'linear-gradient(90deg,rgba(240,192,96,.15),transparent)', borderLeft: '3px solid #f0c060', color: '#f0c060' }}>
                        📖 Keeper of Product Lore
                      </div>
                      <div className="pb-cards">
                        {(() => {
                          const collected = defeatedProfessors.has('lenny_rachitsky')
                          return (
                            <div className={`pb-card${collected ? '' : ' locked'} boss-collected`} style={collected ? { borderColor: 'rgba(240,192,96,.65)' } : { borderColor: 'rgba(180,30,20,.4)' }}>
                              {collected && <div className="pb-ribbon">Collected</div>}
                              <div className="pb-card-emoji">📖</div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img className="pb-card-img" src={SPELL_CARD_IMAGES['lenny_rachitsky']} alt="Lenny Rachitsky" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              <div className="pb-card-footer">
                                <div className="pb-spell" style={collected ? { color: 'var(--gold)' } : { color: '#e08070' }}>The Product Lore</div>
                                <div className="pb-prof">Lenny Rachitsky</div>
                              </div>
                              {!collected && (
                                <div className="pb-lock">
                                  <div className="pb-lock-icon">🔒</div>
                                  <div className="pb-lock-text">Duel Lenny to unlock</div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="pb-towers">
                      {(['pm', 'strategy', 'ai'] as TowerKey[]).map((towerKey) => {
                        const tower = TOWERS[towerKey]
                        return (
                          <div key={towerKey}>
                            <div className={`pb-tower-head ${towerKey}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={TOWER_ICON[towerKey]} alt="" style={{width:'16px',height:'16px',objectFit:'contain',verticalAlign:'middle',marginRight:'6px'}} />
                              {towerKey === 'pm' ? 'PM Tower' : towerKey === 'strategy' ? 'Strategy Tower' : 'AI Tower'}
                            </div>
                            <div className="pb-cards">
                              {tower.professors.map((prof) => {
                                const collected = defeatedProfessors.has(prof.key)
                                return (
                                  <div
                                    key={prof.key}
                                    className={`pb-card${collected ? '' : ' locked'}${prof.isBoss ? (collected ? ' boss-collected' : ' boss') : ''}`}
                                  >
                                    {collected && <div className="pb-ribbon">Collected</div>}
                                    <div className="pb-card-emoji">{SPELL_EMOJIS[prof.key]}</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img className="pb-card-img" src={SPELL_CARD_IMAGES[prof.key]} alt={prof.name} loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    <div className="pb-card-footer">
                                      <div className="pb-spell" style={prof.isBoss ? (collected ? { color: 'var(--gold)' } : { color: '#e08070' }) : undefined}>
                                        {SPELL_NAMES[prof.key]}
                                      </div>
                                      <div className="pb-prof">{prof.name}</div>
                                    </div>
                                    {!collected && (
                                      <div className="pb-lock">
                                        <div className="pb-lock-icon">🔒</div>
                                        <div className="pb-lock-text">
                                          {prof.isBoss ? 'Defeat Tower Boss' : `Defeat ${prof.name.split(' ')[0]}`}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Tower select modal — bottom sheet */}
        {towerModalOpen && (
          <div className="tm-overlay" onClick={() => setTowerModalOpen(false)}>
            <div className="tm-sheet" onClick={e => e.stopPropagation()}>
              <div className="tm-header">
                <span className="tm-title">✦ Select your opponent ✦</span>
                <button className="tm-close" onClick={() => setTowerModalOpen(false)}>✕ CLOSE</button>
              </div>
              <div className="tm-body" ref={towerModalBodyRef}>

                {/* Keeper of Product Lore — Lenny */}
                <div className="tm-section" style={{ borderBottom: '1px solid rgba(240,192,96,.2)', marginBottom: 12, paddingBottom: 12 }}>
                  <div className="tm-section-hdr">
                    <span className="tm-section-name" style={{ color: '#f0c060' }}>📖 Keeper of Product Lore</span>
                    <span className="tm-section-prog" style={{ color: '#f0c060' }}>♥♥♥ Win to earn +3 hearts</span>
                  </div>
                  <div className="tm-prof-grid">
                    <div
                      className={`tm-prof-card${defeatedProfessors.has('lenny_rachitsky') ? ' defeated' : ''}`}
                      style={{ cursor: 'pointer', borderColor: 'rgba(240,192,96,.4)' }}
                      onClick={() => { launchLennyDuel(); setTowerModalOpen(false) }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="tm-prof-card-img"
                        src="/assets/professors/lenny_rachitsky_card.avif"
                        alt="Lenny Rachitsky"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="tm-prof-card-overlay">
                        <div className="tm-prof-name">Lenny Rachitsky</div>
                        <div className="tm-prof-title">The Keeper of Product Lore</div>
                      </div>
                      {defeatedProfessors.has('lenny_rachitsky') && <div className="tm-prof-ov" style={{ color: '#50c880' }}>✓</div>}
                    </div>
                  </div>
                </div>

                {(['pm', 'strategy', 'ai'] as TowerKey[]).map(tk => {
                  const tower = TOWERS[tk]
                  const nonBossProfs = tower.professors.filter(p => !p.isBoss)
                  const defeatedNonBoss = nonBossProfs.filter(p => defeatedProfessors.has(p.key)).length
                  const defeatedInTower = tower.professors.filter(p => defeatedProfessors.has(p.key)).length
                  const bossUnlocked = defeatedNonBoss >= 3
                  return (
                    <div key={tk} id={`tm-section-${tk}`} className="tm-section">
                      <div className="tm-section-hdr">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={TOWER_ICON[tk]} alt="" className="tm-section-icon" />
                        <span className="tm-section-name" style={{color: tk === 'pm' ? '#6090f0' : tk === 'strategy' ? '#e08030' : '#a070e0'}}>{tower.name}</span>
                        <span className="tm-section-prog">{defeatedInTower} / {tower.professors.length} Defeated</span>
                      </div>
                      <div className="tm-prof-grid">
                        {tower.professors.map(prof => {
                          const isDefeated = defeatedProfessors.has(prof.key)
                          const isLocked = prof.isBoss && !bossUnlocked && !isDefeated
                          const remaining = Math.max(0, 3 - defeatedInTower)
                          const isActive = prof.key === activeProfKey && duelPhase === 'active'
                          return (
                            <div
                              key={prof.key}
                              className={`tm-prof-card${isDefeated ? ' defeated' : isLocked ? ' locked' : ''}${isActive ? ' active-duel' : ''}`}
                              onClick={!isDefeated && !isLocked ? () => { launchDuel(tk, prof.key); setTowerModalOpen(false) } : undefined}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                className="tm-prof-card-img"
                                src={getProfCardImg(prof.key)}
                                alt={prof.name}
                                loading="lazy"
                                onError={e => { (e.target as HTMLImageElement).style.display='none' }}
                              />
                              <div className="tm-prof-card-overlay">
                                <div className="tm-prof-name">{prof.name}</div>
                                <div className="tm-prof-title">{prof.title}</div>
                                {isLocked && <div className="tm-boss-hint">{remaining} to go</div>}
                              </div>
                              {isDefeated && <div className="tm-prof-ov" style={{color:'#50c880'}}>✓</div>}
                              {isLocked && <div className="tm-prof-ov">🔒</div>}
                              {isActive && <div className="tm-prof-ov" style={{color:'#f0c060'}}>⚔️</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rules of the Academy modal */}
        {rulesModalOpen && (
          <div className="rules-overlay" onClick={() => closeRules(hasShownRulesRef.current && screen === 'duel')}>
            <div className="rules-modal" onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rules-bg" src="/assets/Summo_letter_background.avif" alt="" />
              <div className="rules-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rules-crest" src="/assets/Lorethron_crest_transparent.avif" alt="" />
                <div className="rules-title">Rules of the Academy</div>
                <div className="rules-scroll">
                  <div className="rules-sections">
                    <div className="rules-section">
                      <div className="rules-section-title">♥ Hearts</div>
                      <div className="rules-section-body">5 hearts. Lose one per wrong answer. Zero = Game Over, but retry is free.</div>
                    </div>
                    <div className="rules-section">
                      <div className="rules-section-title">⚔ Duels</div>
                      <div className="rules-section-body">5 questions, 2 choices. Survive with 1 heart left and earn a Spell Card.</div>
                    </div>
                    <div className="rules-section">
                      <div className="rules-section-title">🏰 Towers</div>
                      <div className="rules-section-body">Three towers: PM, Strategy, AI. Beat 3 professors to unlock the Boss.</div>
                    </div>
                    <div className="rules-section">
                      <div className="rules-section-title">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/professors/lenny_rachitsky_card.avif" alt="" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', objectPosition:'center top', verticalAlign:'middle', marginRight:6, display:'inline-block' }} />
                        Lenny Rachitsky
                      </div>
                      <div className="rules-section-body">Always available. No heart cost. Win = +3 gold hearts.</div>
                    </div>
                    <div className="rules-section">
                      <div className="rules-section-title">📜 Your Playbook</div>
                      <div className="rules-section-body">Tap the scroll to see every Spell Card you&apos;ve earned.</div>
                    </div>
                    <div className="rules-section">
                      <div className="rules-section-title">★ Grand Wizard</div>
                      <div className="rules-section-body">Collect all 19 Spell Cards to become Grand Wizard.</div>
                    </div>
                  </div>
                  <div className="rules-sig-wrap">
                    <div className="rules-sig">— Lenny Rachitsky</div>
                    <div className="rules-sig-byline">Keeper of Product Lore · Lorethorn Academy</div>
                  </div>
                </div>
                <button className="rules-close" onClick={() => closeRules(true)}>✦ Begin your duel ✦</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          S5 — SPELL WIN
      ══════════════════════════════════ */}
      <div id="s-spellwin" className={`screen${screen === 'spellwin' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sw-bg" src="/assets/Landing_Page_Background_1774611504383.avif" alt="" />
        <div className="sw-overlay" />
        <div className="sw-layout">

          {/* LEFT scroll: Defeated Professor */}
          <div className="sw-side">
            <div className="sw-card-tag">DEFEATED</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sw-prof-card-img" src={PROF_CARD_IMG[wonProfKey] ?? ''} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="sw-prof-name">
              {(wonProfKey === 'lenny_rachitsky' ? LENNY_PROF : Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey))?.name ?? wonProfKey}
            </div>
            <div className="sw-prof-title">
              {(wonProfKey === 'lenny_rachitsky' ? LENNY_PROF : Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey))?.title ?? ''}
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 9, color: wonProfKey === 'lenny_rachitsky' ? '#2a6e1a' : '#2a601a', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
              {wonProfKey === 'lenny_rachitsky' ? '♥♥♥ +3 Hearts awarded — The Keeper rewards you' : 'Spell added to your Playbook'}
            </div>
          </div>

          {/* CENTER: Spell unlock */}
          <div className="sw-center">
            <div className="sw-header">SPELL UNLOCKED</div>
            <div className="sw-glow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sw-spell-card-img" src={SPELL_CARD_IMAGES[wonProfKey] ?? ''} alt={wonSpell} />
            </div>
            <div className="sw-spell-name">{wonSpell}</div>
            <div className="sw-spell-sub">{SPELL_SUBTITLES[wonProfKey] ?? ''}</div>
            <div className="sw-quote-row">
              <div className="sw-quote">&ldquo;{PROFESSOR_WIN_LINES[wonProfKey] ?? ''}&rdquo;</div>
              <div className="sw-by">— {(wonProfKey === 'lenny_rachitsky' ? LENNY_PROF : Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey))?.name ?? ''}</div>
            </div>
          </div>

          {/* RIGHT scroll: Playbook Progress */}
          <div className="sw-side">
            <div className="sw-card-tag">PLAYBOOK PROGRESS</div>
            <div className="sw-pb-count">{defeatedProfessors.size} / 19</div>
            <div className="sw-pb-sub">Spells Collected</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 11, color: '#5a3010', fontStyle: 'italic', textAlign: 'center', marginTop: -2 }}>18 Professors + The Keeper</div>
            <div style={{ borderTop: '1px solid rgba(160,120,50,.35)', width: '100%', margin: '4px 0' }} />
            <div className="sw-towers-wrap">
              {Object.entries(TOWERS).map(([key, tower]) => {
                const count = tower.professors.filter(p => defeatedProfessors.has(p.key)).length
                return (
                  <div key={key} className="sw-tower-row">
                    <span className="sw-tower-name">{tower.name}</span>
                    <span className="sw-tower-count">{count} / {tower.professors.length}</span>
                  </div>
                )
              })}
              <div className="sw-tower-row" style={{ borderColor: 'rgba(200,165,60,.45)', background: 'rgba(220,180,80,.12)' }}>
                <span className="sw-tower-name">The Keeper</span>
                <span className="sw-tower-count">{defeatedProfessors.has('lenny_rachitsky') ? '1 / 1' : '0 / 1'}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 12, color: '#4a2810', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
              Collect all 19 to become Grand Wizard
            </div>
          </div>

          {/* FOOTER: buttons */}
          <div className="sw-footer">
            <button className="sw-btn-cont" onClick={advanceAfterSpellWin}>
              {wonProfKey === 'lenny_rachitsky' ? '✦ Return to the Academy ✦' : '✦ Continue Duel ✦'}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          S6 — TOWER CLEARED
      ══════════════════════════════════ */}
      {(() => {
        const clearedProf = allProfessors.find(p => p.key === wonProfKey)
        const clearedTowerKey = clearedProf?.tower ?? activeTowerKey
        const clearedTower = TOWERS[clearedTowerKey]
        const nextTowerEntry = Object.entries(TOWERS).find(([k, t]) =>
          k !== clearedTowerKey && !t.professors.filter(p => p.isBoss).every(p => defeatedProfessors.has(p.key))
        )
        const nextTowerName = nextTowerEntry ? nextTowerEntry[1].name : null
        const nextTowerKey = nextTowerEntry ? nextTowerEntry[0] as TowerKey : clearedTowerKey as TowerKey
        const towerDisplayName = clearedTower?.name ?? 'Tower'
        return (
          <div id="s-tower-cleared" className="screen" style={{ display: 'none' }}>
            <div className="tc-bg-overlay" />
            <div className="tc-stars" />
            <div className="tc-wrap">
              <div className="tc-badge">{towerDisplayName} Cleared</div>
              <div className="tc-title">The {towerDisplayName} Falls.</div>
              <div className="tc-next">
                You&apos;ve bested the masters of this tower. Your knowledge grows.
                {nextTowerName && <> The {nextTowerName} has opened its gates.</>}
              </div>
              {nextTowerName && <div className="tc-next-badge">Next: {nextTowerName}</div>}
              <button className="tc-cta" onClick={() => { setActiveTowerKey(nextTowerKey); setDuelPhase('selecting'); setScreen('duel') }}>
                {nextTowerName ? `Enter ${nextTowerName} →` : 'Continue →'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ══════════════════════════════════
          S7 — PLAYBOOK
      ══════════════════════════════════ */}
      <div id="s-playbook" className={`screen${screen === 'playbook' ? ' active' : ''}`}>
        <div className="playbook-bg" />

        <button className="playbook-back" onClick={closePlaybook}>← Back</button>

        <div className="pb-scroll-inner" ref={pbCardRef}>
          <div className="pb-wrap">
            <div className="pb-header">
              <div className="pb-title">Your Playbook</div>
              <div className="pb-subtitle">✦ {defeatedProfessors.size} / 19 spells collected ✦</div>
            </div>

            {/* Lenny — always at top */}
            <div style={{ borderBottom: '1px solid rgba(240,192,96,.2)', marginBottom: 4, paddingBottom: 14 }}>
              <div className="pb-tower-head" style={{ color: '#f0c060', borderColor: 'rgba(240,192,96,.35)' }}>
                📖 Keeper of Product Lore
                <span className="pb-tower-head-prog">{defeatedProfessors.has('lenny_rachitsky') ? '1 / 1 Collected' : '0 / 1 Collected'}</span>
              </div>
              <div className="pb-cards">
                {(() => {
                  const collected = defeatedProfessors.has('lenny_rachitsky')
                  return (
                    <div className={`pb-card${collected ? '' : ' locked'}`} style={collected ? { borderColor: 'rgba(240,192,96,.65)' } : { borderColor: 'rgba(180,30,20,.4)' }}>
                      {collected && <div className="pb-ribbon">Collected</div>}
                      <div className="pb-card-emoji">📖</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="pb-card-img" src={SPELL_CARD_IMAGES['lenny_rachitsky']} alt="Lenny Rachitsky" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="pb-card-footer">
                        <div className="pb-spell" style={collected ? { color: 'var(--gold)' } : { color: '#e08070' }}>The Product Lore</div>
                        <div className="pb-prof">Lenny Rachitsky</div>
                      </div>
                      {!collected && (
                        <div className="pb-lock">
                          <div className="pb-lock-icon">🔒</div>
                          <div className="pb-lock-text">Duel Lenny to unlock</div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="pb-towers">
              {(['pm', 'strategy', 'ai'] as TowerKey[]).map((towerKey) => {
                const tower = TOWERS[towerKey]
                const collectedInTower = tower.professors.filter(p => defeatedProfessors.has(p.key)).length
                return (
                  <div key={towerKey}>
                    <div className={`pb-tower-head ${towerKey}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={TOWER_ICON[towerKey]} alt="" style={{ width: 22, height: 22, objectFit: 'contain', mixBlendMode: 'screen', opacity: .95 }} />
                      {towerKey === 'pm' ? 'PM Tower' : towerKey === 'strategy' ? 'Strategy Tower' : 'AI Tower'}
                      <span className="pb-tower-head-prog">{collectedInTower} / {tower.professors.length} Collected</span>
                    </div>
                    <div className="pb-cards">
                      {tower.professors.map((prof) => {
                        const collected = defeatedProfessors.has(prof.key)
                        return (
                          <div
                            key={prof.key}
                            className={`pb-card${collected ? '' : ' locked'}${prof.isBoss ? (collected ? ' boss-collected' : ' boss') : ''}`}
                          >
                            {collected && <div className="pb-ribbon">Collected</div>}
                            <div className="pb-card-emoji">{SPELL_EMOJIS[prof.key]}</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className="pb-card-img" src={SPELL_CARD_IMAGES[prof.key]} alt={prof.name} loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <div className="pb-card-footer">
                              <div className="pb-spell" style={prof.isBoss ? (collected ? { color: 'var(--gold)' } : { color: '#e08070' }) : undefined}>
                                {SPELL_NAMES[prof.key]}
                              </div>
                              <div className="pb-prof">{prof.name}</div>
                            </div>
                            {!collected && (
                              <div className="pb-lock">
                                <div className="pb-lock-icon">🔒</div>
                                <div className="pb-lock-text">
                                  {prof.isBoss ? 'Defeat Tower Boss' : `Defeat ${prof.name.split(' ')[0]}`}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="playbook-footer">
          <button className="gw-btn-secondary" onClick={handleDownloadPlaybookCard}>DOWNLOAD YOUR PLAYBOOK</button>
          <button className="gw-btn-text" onClick={handleCopyPlaybookLink}>{pbCopyLabel}</button>
        </div>
      </div>

      {/* ══════════════════════════════════
          S8 — SUMMONS LETTER (modal overlay)
      ══════════════════════════════════ */}
      {summonsOpen && (
        <div className="sl-overlay" onClick={dismissSummons}>
          <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bg" src="/assets/Summo_letter_background.avif" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:'4px' }} />
            <div className="sl-tint" />

            <div className="sl-modal-inner">
              <button className="sl-close-btn" onClick={dismissSummons}>✕ Close</button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sl-crest" src="/assets/Lorethron_crest_transparent.avif" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="sl-school">Lorethorn Academy</div>
              <div className="sl-school-sub">of Product Spellcraft</div>
              <div className="sl-rule" />

              {summonsVariant === 'easter_egg' ? (
                <div className="sl-body">
                  <p>You weren&apos;t supposed to find this.</p>
                  <p>Most mages pass through Lorethorn without ever looking for me. You did.</p>
                  <p>That&apos;s either curiosity or ambition. I haven&apos;t decided which yet.</p>
                  <p>Finish what you started. Then we&apos;ll talk.</p>
                </div>
              ) : (
                <div className="sl-body">
                  <p>You&apos;ve done it.</p>
                  <p>Nineteen professors. Three towers. Every framework, every model, every hard question the Academy could throw at you.</p>
                  <p>I&apos;ve been watching. They all told me you were different.</p>
                  <p>There is one duel left. Not a test of what you know — a test of what you believe.</p>
                  <p>Come find me.</p>
                </div>
              )}

              <div className="sl-sig-wrap">
                <div className="sl-sig">
                  {summonsVariant === 'easter_egg' ? '— L.R.' : '— Lenny Rachitsky'}
                </div>
              </div>
              <div className="sl-footer">
                Author, Lenny&apos;s Newsletter · Host, Lenny&apos;s Podcast · Keeper of Product Lore
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Revelation — removed in v1 (Lenny is always available, not an endgame unlock) */}
      <div id="s-final" style={{ display: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Landing_Page_Background_1774611504383.avif" alt="" />
        <div className="fr-vignette" />
        <div className="fr-title-bar">✦ &nbsp; THE FINAL REVELATION &nbsp; ✦</div>

        {/* Scene — left / center / right */}
        <div className="fr-scene">

          {/* Left — player silhouette */}
          <div className="fr-left">
            <div className="fr-player-glow" />
            <div className="fr-rune" style={{ top:'18%', left:'8%', animationDelay:'0s' }}>📋</div>
            <div className="fr-rune" style={{ top:'14%', right:'10%', animationDelay:'1.3s' }}>⚡</div>
            <div className="fr-rune" style={{ bottom:'22%', left:'12%', animationDelay:'2.1s' }}>🎯</div>
            <div className="fr-silhouette" />
            <div className="fr-player-label">{arc.name}</div>
          </div>

          {/* Center — energy orb + beams */}
          <div className="fr-center">
            <div className="fr-beam-wrap">
              <div className="fr-beam-l" />
              <div className="fr-beam-r" />
            </div>
            <div className="fr-orb" />
          </div>

          {/* Right — Lenny */}
          <div className="fr-right">
            <div className="fr-lenny-glow" />
            <div className="fr-rune" style={{ top:'16%', right:'9%', animationDelay:'.6s' }}>📊</div>
            <div className="fr-rune" style={{ top:'12%', left:'8%', animationDelay:'1.9s' }}>🧠</div>
            <div className="fr-rune" style={{ bottom:'20%', right:'11%', animationDelay:'2.7s' }}>💡</div>
            <div className="fr-ring">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fr-portrait"
                src="/assets/professors/lenny_rachitsky_duel.avif"
                alt="Lenny Rachitsky"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '.3' }}
              />
            </div>
            <div className="fr-lenny-name">Lenny Rachitsky</div>
            <div className="fr-lenny-title">THE KEEPER OF PRODUCT LORE</div>
          </div>
        </div>

        {/* Bottom — quote + CTA */}
        <div className="fr-bottom">
          <div className="fr-quote">
            &ldquo;You&apos;ve read the frameworks. Learned the models. Bested nineteen masters.<br />
            Now I need to know what you actually believe.&rdquo;
          </div>
          <button
            className="fr-cta"
            onClick={async () => {
              setDuelPhase('active')
              setDuelQs([])
              setQIndex(0)
              setAnsweredIndex(null)
              setLastResult(null)
              setCorrectInDuel(0)
              setDuelLoading(true)
              setDuelError(false)
              setScreen('duel')
              try {
                const res = await fetch('/api/questions?professor=lenny_oracle')
                const data = await res.json()
                const qs = Array.isArray(data) ? data : []
                setDuelQs(qs.map((q: Omit<DuelQuestion, 'displayOptions'>) => ({ ...q, displayOptions: buildDisplayOptions(q) })))
              } catch {
                setDuelQs([])
              } finally {
                setDuelLoading(false)
              }
            }}
          >
            ✦ BEGIN THE FINAL REVELATION ✦
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          S10 — GRAND WIZARD COMPLETION
      ══════════════════════════════════ */}
      <div id="s-grand" className={`screen${screen === 'grand' ? ' active' : ''}`}>
        <div className="gw-bg" />
        <div className="gw-shimmer" />

        <div className="gw-inner" ref={gwCardRef}>
          <div className="gw-grand-title">Grand Wizard of Product</div>
          <div className="gw-grand-sub">✦ {displayName}&apos;s Playbook &nbsp;·&nbsp; 19 / 19 Spells Collected ✦</div>

          {/* 3-column spell roster */}
          <div className="gw-columns">
            {(['pm', 'strategy', 'ai'] as TowerKey[]).map((key) => (
              <div key={key} className="gw-col">
                <div className="gw-col-label">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={TOWER_ICON[key]} alt="" style={{width:'16px',height:'16px',objectFit:'contain',verticalAlign:'middle',marginRight:'6px'}} />
                  {key === 'pm' ? 'PM Tower' : key === 'strategy' ? 'Strategy Tower' : 'AI Tower'}
                </div>
                {TOWERS[key].professors.map((prof) => (
                  <div key={prof.key} className={`gw-card${prof.isBoss ? ' boss' : ''}`}>
                    <div className="gw-card-ribbon">Collected</div>
                    <div className={`gw-card-icon ${prof.isBoss ? 'boss' : key}`}>{SPELL_EMOJIS[prof.key]}</div>
                    <div className="gw-card-body">
                      <div className={`gw-card-spell${prof.isBoss ? ' boss' : ''}`}>{SPELL_NAMES[prof.key]}</div>
                      <div className="gw-card-prof">— {prof.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="gw-footer">
            <div className="gw-stats-line">
              19 Professors Defeated &nbsp;·&nbsp; 3 Towers Cleared
            </div>
            <div className="gw-lenny-quote">
              &ldquo;Most PMs read one framework and call it wisdom. You read nineteen.<br />
              You didn&apos;t just learn the game — you earned the right to change it.&rdquo;
            </div>
            <div className="gw-share-row">
              <button className="gw-btn-primary" onClick={handleCopyLink}>{copyLabel}</button>
              <button className="gw-btn-secondary" onClick={handleDownloadPlaybook}>DOWNLOAD YOUR PLAYBOOK</button>
              <button className="gw-btn-text" onClick={() => {
                setHearts(5)
                setDefeatedProfessors(new Set())
                setActiveTowerKey('pm')
                setActiveProfKey('gibson_biddle')
                setDuelPhase('selecting')
                setArchetype('V')
                setScreen('landing')
              }}>
                Return to the Academy
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════
          GAME OVER
      ══════════════════════════════════ */}
      <div id="s-game-over" className={`screen${screen === 'game_over' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Landing_Page_Background_1774611504383.avif" alt="" />
        <div className="spellwin-center" ref={goCardRef}>
          <div className="spellwin-eyebrow" style={{ color:'#e84030' }}>Defeated</div>
          <div className="spellwin-spell">Your Hearts Run Out</div>
          {gameOverProfKey && PROFESSOR_LOSS_LINES[gameOverProfKey] && (
            <div className="spellwin-sub" style={{ fontStyle:'italic', color:'rgba(240,192,96,.7)', marginBottom: 4 }}>
              &ldquo;{PROFESSOR_LOSS_LINES[gameOverProfKey]}&rdquo;
            </div>
          )}
          <div className="spellwin-sub">
            You collected <strong style={{ color:'var(--gold)' }}>{defeatedProfessors.size}</strong> spell
            {defeatedProfessors.size !== 1 ? 's' : ''}.<br />
            The Academy awaits your return.
          </div>
          <button
            className="go-refill-btn"
            onClick={() => {
              setHearts(5)
              const prof = allProfessors.find(p => p.key === activeProfKey)
              if (prof) launchDuel(prof.tower, prof.key)
            }}
          >
            ✦ Try Again ✦
          </button>
          <div className="go-divider" />
          <button className="sw-btn-cont" style={{ width: '100%' }} onClick={handleDownloadGameOver}>Download your progress</button>
        </div>
      </div>


    </div>
  )
}
