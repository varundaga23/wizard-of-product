'use client'

import { useState, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import posthog from 'posthog-js'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'oracle' | 'archetype' | 'duel' | 'spellwin' | 'tower_cleared' | 'game_over' | 'lenny_loss' | 'playbook' | 'summons' | 'final' | 'grand'
type SummonsVariant = 'easter_egg' | 'prefinal'

type BlessingState = {
  phase: 'loading' | 'question' | 'result'
  q: DuelQuestion | null
  answeredIndex: number | null
  isCorrect: boolean | null
}
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
      { key: 'teresa_torres',  name: 'Teresa Torres',  title: 'Oracle of Discovery',        tower: 'pm' },
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
  teresa_torres:         'Opportunities, Solutions, Assumptions',
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
}

const SPELL_NAMES: Record<string, string> = {
  gibson_biddle:         'DHM Principle',
  julie_zhuo:            'The Design Mirror',
  teresa_torres:         'Continuous Discovery',
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
}

const PROFESSOR_WIN_LINES: Record<string, string> = {
  gibson_biddle:         "DHM is not a framework. It's a discipline. You're starting to understand the difference.",
  julie_zhuo:            "Great design is not about aesthetics. It's about showing you understand the human. You do.",
  teresa_torres:         "You asked the right questions before reaching for solutions. That is the whole game.",
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
}

const PROFESSOR_LOSS_LINES: Record<string, string> = {
  gibson_biddle:         "The DHM model only works if you apply it — not memorise it. Come back when you've sat with it.",
  julie_zhuo:            "Great teams come from clear thinking. Yours wasn't clear enough today.",
  teresa_torres:         "You're still thinking in solutions. Come back when you're thinking in opportunities.",
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
    tagline: "You see what others don't — yet.",
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
    tagline: "Done is better than perfect — until it isn't.",
    tower: 'ai',
    towerName: 'AI Tower',
  },
}

const LANDING_PROFESSORS = [
  { name: 'Gibson Biddle',  title: 'Former VP Product, Netflix',  img: '/assets/Gibson_Biddle_nobg.avif' },
  { name: 'Shreyas Doshi',  title: 'Strategy & Execution',        img: null },
  { name: 'April Dunford',  title: 'Positioning Powerhouse',      img: null },
  { name: 'Marc Andreessen',title: 'Software Eats the World',     img: null },
]


const LENNY_PROF: ProfessorDef = {
  key: 'lenny_oracle',
  name: 'Lenny Rachitsky',
  title: 'The Keeper of Product Lore',
  tower: 'pm',
  isBoss: true,
}

const SPELL_EMOJIS: Record<string, string> = {
  gibson_biddle:         '📐',
  julie_zhuo:            '🪞',
  teresa_torres:         '🔍',
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
}

const RANKS = [
  { label: 'Muggle', min: 0 },
  { label: 'Apprentice', min: 100 },
  { label: 'Scholar', min: 500 },
  { label: 'Wizard', min: 1000 },
  { label: 'Archmage', min: 2000 },
  { label: 'Grand Wizard', min: 5000 },
]

const LETTERS = ['A', 'B']

function buildDisplayOptions(q: Omit<DuelQuestion, 'displayOptions'>): { text: string; isCorrect: boolean }[] {
  const correctText = q.options.find(o => o.startsWith(q.correct_answer + '.'))?.replace(/^[A-D]\.\s*/, '') ?? ''
  const distractorText = (q.best_distractor ?? '').replace(/^[A-D]\.\s*/, '')
  const opts = [
    { text: correctText, isCorrect: true },
    { text: distractorText, isCorrect: false },
  ]
  return Math.random() < 0.5 ? opts : [opts[1], opts[0]]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function getRank(sp: number): string {
  return [...RANKS].reverse().find(r => sp >= r.min)?.label ?? 'Muggle'
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  // Navigation
  // Scale game to fit any screen size
  useEffect(() => {
    function updateScale() {
      const scale = Math.min(window.innerWidth / 960, window.innerHeight / 540)
      document.documentElement.style.setProperty('--game-scale', String(Math.min(scale, 1)))
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
  const [sp, setSp] = useState(0)
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
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null)
  const [lastSpGained, setLastSpGained] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(15)

  // Spell win state
  const [wonSpell, setWonSpell] = useState('')
  const [wonProfKey, setWonProfKey] = useState('')
  const [wonProfIsBoss, setWonProfIsBoss] = useState(false)
  const [duelTotalSp, setDuelTotalSp] = useState(0)
  const [correctInDuel, setCorrectInDuel] = useState(0)

  // Playbook state — tracks which screen to return to
  const [playbookReturn, setPlaybookReturn] = useState<Screen>('duel')
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false)

  // Summons letter state
  const [summonsVariant, setSummonsVariant] = useState<SummonsVariant>('easter_egg')
  const [summonsClosing, setSummonsClosing] = useState(false)

  // Final boss state
  const [finalBossActive, setFinalBossActive] = useState(false)
  const [lennyHearts, setLennyHearts] = useState(3)
  const [gameOverProfKey, setGameOverProfKey] = useState('')

  // Heart hint — shown once on first heart lost
  const [heartHintVisible, setHeartHintVisible] = useState(false)
  const [hasShownHeartHint, setHasShownHeartHint] = useState(false)

  // Lenny's Blessing
  const [blessing, setBlessing] = useState<BlessingState | null>(null)

  // Rank up ceremony
  const [rankUpInfo, setRankUpInfo] = useState<{ label: string; color: string } | null>(null)

  const RANK_COLORS: Record<string, string> = {
    Apprentice: '#c8922a',
    Scholar: '#4080c0',
    Wizard: '#8040c0',
    Archmage: '#c03040',
  }
  const RANK_ACHIEVEMENTS: Record<string, string> = {
    Apprentice: 'The Oracle has sorted you.',
    Scholar: 'Your primary tower stands defeated.',
    Wizard: 'Two towers. Two domains mastered.',
    Archmage: 'Three towers cleared. One duel remains.',
  }

  // Share / download
  const gwCardRef = useRef<HTMLDivElement>(null)
  const goCardRef = useRef<HTMLDivElement>(null)
  const pbCardRef = useRef<HTMLDivElement>(null)
  const timeoutCallbackRef = useRef<() => void>(() => {})
  const [copyLabel, setCopyLabel] = useState('✦ SHARE YOUR JOURNEY ✦')
  const [pbCopyLabel, setPbCopyLabel] = useState('COPY LINK')

  function handleCopyLink() {
    const archetypeNames = { V: 'Visionary', M: 'Mastermind', B: 'Builder' }
    const text = `${displayName} just became a Grand Wizard of Product as a ${archetypeNames[archetype]}! 🧙 I defeated 19 professors across 3 towers and earned ${sp.toLocaleString()} SP in Spellcraft. Can you beat my score?`
    const url = window.location.href.split('?')[0]
    navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
      posthog.capture('link_copied', { screen: 'grand_wizard', sp_total: sp })
      setCopyLabel('✓ COPIED!')
      setTimeout(() => setCopyLabel('✦ SHARE YOUR JOURNEY ✦'), 2500)
    })
  }

  async function handleDownloadPlaybook() {
    if (!gwCardRef.current) return
    posthog.capture('playbook_downloaded', { screen: 'grand_wizard', sp_total: sp })
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
    if (!goCardRef.current) return
    try {
      const dataUrl = await toPng(goCardRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = 'spellcraft-run.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  function handleCopyPlaybookLink() {
    const archetypeNames = { V: 'Visionary', M: 'Mastermind', B: 'Builder' }
    const text = `${displayName} has collected ${defeatedProfessors.size} spell${defeatedProfessors.size !== 1 ? 's' : ''} so far in Spellcraft as a ${archetypeNames[archetype]} — earning ${sp.toLocaleString()} SP. Still duelling. Can you keep up?`
    const url = window.location.href.split('?')[0]
    navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
      posthog.capture('link_copied', { screen: 'playbook', sp_total: sp, spells_collected: defeatedProfessors.size })
      setPbCopyLabel('✓ COPIED!')
      setTimeout(() => setPbCopyLabel('COPY LINK'), 2500)
    })
  }

  async function handleDownloadPlaybookCard() {
    if (!pbCardRef.current) return
    posthog.capture('playbook_downloaded', { screen: 'playbook', sp_total: sp, spells_collected: defeatedProfessors.size })
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
  const rank = getRank(sp)
  const currentQ = duelQs[qIndex]
  const allProfessors = Object.values(TOWERS).flatMap(t => t.professors)
  const currentProf: ProfessorDef | null = finalBossActive ? LENNY_PROF : (allProfessors.find(p => p.key === activeProfKey) ?? null)
  const currentTower = (finalBossActive || !currentProf) ? null : TOWERS[currentProf.tower]
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

    setActiveTowerKey(towerKey)
    setActiveProfKey(profKey)
    setDuelPhase('active')
    setDuelQs([])
    setQIndex(0)
    setAnsweredIndex(null)
    setLastResult(null)
    setLastSpGained(0)
    setDuelTotalSp(0)
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
    let newLennyHearts = lennyHearts
    let newSp = sp
    let gained = 0

    if (isCorrect) {
      gained = currentQ.difficulty === 'advanced' ? 200 : 100
      newSp = sp + gained
      const oldRank = getRank(sp)
      const newRank = getRank(newSp)
      setSp(newSp)
      setDuelTotalSp(prev => prev + gained)
      setCorrectInDuel(prev => prev + 1)
      setLastResult('correct')
      if (newRank !== oldRank && newRank !== 'Grand Wizard') {
        setRankUpInfo({ label: newRank, color: RANK_COLORS[newRank] ?? '#f0c060' })
        setTimeout(() => setRankUpInfo(null), 5000)
      }
    } else {
      if (finalBossActive) {
        newLennyHearts = lennyHearts - 1
        setLennyHearts(newLennyHearts)
      } else {
        newHearts = hearts - 1
        setHearts(newHearts)
        if (!hasShownHeartHint) {
          setHasShownHeartHint(true)
          setHeartHintVisible(true)
          setTimeout(() => setHeartHintVisible(false), 4000)
        }
      }
      setLastResult('wrong')
      posthog.capture('heart_lost', { professor: currentProf.key, hearts_remaining: finalBossActive ? newLennyHearts : newHearts, difficulty: currentQ.difficulty })
    }
    posthog.capture('answer_submitted', { professor: currentProf.key, correct: isCorrect, difficulty: currentQ.difficulty, sp_total: newSp })
    setLastSpGained(gained)

    // Snapshot values used inside timeout to avoid stale closures
    const nextQIndex = qIndex + 1
    const profKey = currentProf.key
    const isBoss = currentProf.isBoss ?? false

    setTimeout(() => {
      if (finalBossActive && newLennyHearts <= 0) {
        setScreen('lenny_loss')
        return
      }
      if (!finalBossActive && newHearts <= 0) {
        posthog.capture('game_over', { professor: profKey, sp_total: newSp, spells_collected: defeatedProfessors.size })
        setGameOverProfKey(profKey)
        setScreen('game_over')
        return
      }
      if (nextQIndex < duelQs.length) {
        // Next question in same duel
        setQIndex(nextQIndex)
        setAnsweredIndex(null)
        setLastResult(null)
        setLastSpGained(0)
        return
      }
      // All 5 answered — professor defeated
      if (finalBossActive) {
        posthog.capture('grand_wizard', { archetype, sp_total: newSp })
        setScreen('grand')
        return
      }
      posthog.capture('spell_won', { professor: profKey, is_boss: isBoss, sp_total: newSp })
      setDefeatedProfessors(prev => new Set([...prev, profKey]))
      setWonSpell(SPELL_NAMES[profKey] ?? 'Unknown Spell')
      setWonProfKey(profKey)
      setWonProfIsBoss(isBoss)
      setScreen('spellwin')
    }, 1500)
  }

  // ── Lenny's Blessing ──────────────────────────────────────────────────────────
  function triggerBlessing() {
    setBlessing({ phase: 'loading', q: null, answeredIndex: null, isCorrect: null })
    fetch('/api/questions?professor=lenny_oracle')
      .then(r => r.json())
      .then((data: DuelQuestion[]) => {
        const qs = Array.isArray(data) ? data : []
        if (qs.length === 0) {
          setBlessing(null)
          setDuelPhase('selecting')
          setScreen('duel')
          return
        }
        const q = { ...qs[0], displayOptions: buildDisplayOptions(qs[0]) }
        setBlessing(prev => prev ? { ...prev, phase: 'question', q } : null)
      })
      .catch(() => {
        setBlessing(null)
        setDuelPhase('selecting')
        setScreen('duel')
      })
  }

  function handleBlessingAnswer(optionIndex: number) {
    if (!blessing || blessing.answeredIndex !== null || !blessing.q) return
    const isCorrect = blessing.q.displayOptions[optionIndex].isCorrect
    setBlessing(prev => prev ? { ...prev, phase: 'result', answeredIndex: optionIndex, isCorrect } : null)
    if (isCorrect) {
      setSp(prev => prev + 500)
      posthog.capture('lenny_blessing_correct', { sp_gained: 500 })
    } else {
      posthog.capture('lenny_blessing_wrong', {})
    }
    setTimeout(() => {
      setBlessing(null)
      setDuelPhase('selecting')
      setScreen('duel')
    }, isCorrect ? 2500 : 1200)
  }

  // ── Tower progression ─────────────────────────────────────────────────────────
  function advanceAfterSpellWin() {
    const wonProf = allProfessors.find(p => p.key === wonProfKey)
    const towerKey = wonProf?.tower ?? activeTowerKey

    if (wonProfIsBoss) {
      // Check if all 3 bosses are now defeated (include wonProfKey explicitly to guard against batching edge cases)
      const allBossKeys = Object.values(TOWERS).flatMap(t => t.professors.filter(p => p.isBoss).map(p => p.key))
      const allBossesDefeated = allBossKeys.every(k => defeatedProfessors.has(k) || k === wonProfKey)
      if (allBossesDefeated) {
        openSummonsPrefinal()
        return
      }
      // Just this tower's boss — show tower cleared (user clicks CTA to continue)
      posthog.capture('tower_cleared', { tower: towerKey, sp_total: sp })
      setScreen('tower_cleared')
    } else {
      // Non-boss defeated — maybe Lenny's Blessing, then return to duel in selecting mode
      if (Math.random() < 0.1) {
        triggerBlessing()
      } else {
        setDuelPhase('selecting')
        setScreen('duel')
      }
    }
  }

  // ── Summons handlers ──────────────────────────────────────────────────────────
  function openSummonsEasterEgg() {
    setSummonsVariant('easter_egg')
    setScreen('summons')
  }

  function openSummonsPrefinal() {
    setSummonsVariant('prefinal')
    setScreen('summons')
  }

  function dismissSummons() {
    setSummonsClosing(true)
    setTimeout(() => {
      setSummonsClosing(false)
      if (summonsVariant === 'easter_egg') {
        setScreen('landing')
      } else {
        setScreen('final')
      }
    }, 480)
  }

  // ── Playbook handlers ─────────────────────────────────────────────────────────
  function openPlaybook(from: Screen) {
    setPlaybookReturn(from)
    setScreen('playbook')
  }

  function closePlaybook() {
    setScreen(playbookReturn)
  }

  // ── Timer effects ─────────────────────────────────────────────────────────────
  // Reset to 15s on each new question
  useEffect(() => { setTimeLeft(15) }, [qIndex])

  // Countdown tick + fire timeout at 0
  useEffect(() => {
    if (duelPhase !== 'active' || answeredIndex !== null || duelLoading || !currentQ) return
    if (timeLeft === 0) { timeoutCallbackRef.current(); return }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, duelPhase, answeredIndex, duelLoading, currentQ?.id])

  // ── Timeout callback (updated every render — always has fresh state) ─────────
  timeoutCallbackRef.current = () => {
    if (answeredIndex !== null || !currentQ || !currentProf) return
    setAnsweredIndex(-1)
    setLastResult('timeout')

    let newH = hearts
    let newLH = lennyHearts
    if (finalBossActive) {
      newLH = lennyHearts - 1
      setLennyHearts(newLH)
    } else {
      newH = hearts - 1
      setHearts(newH)
      if (!hasShownHeartHint) {
        setHasShownHeartHint(true)
        setHeartHintVisible(true)
        setTimeout(() => setHeartHintVisible(false), 4000)
      }
    }
    posthog.capture('answer_timeout', { professor: currentProf.key, hearts_remaining: finalBossActive ? newLH : newH })

    const nextQIdx = qIndex + 1
    const profKey = currentProf.key
    const isBoss = currentProf.isBoss ?? false
    const curSp = sp
    const qsLen = duelQs.length

    setTimeout(() => {
      if (finalBossActive && newLH <= 0) { setScreen('lenny_loss'); return }
      if (!finalBossActive && newH <= 0) {
        posthog.capture('game_over', { professor: profKey, sp_total: curSp, spells_collected: defeatedProfessors.size })
        setGameOverProfKey(profKey)
        setScreen('game_over')
        return
      }
      if (nextQIdx < qsLen) {
        setQIndex(nextQIdx)
        setAnsweredIndex(null)
        setLastResult(null)
        setLastSpGained(0)
        return
      }
      if (finalBossActive) { posthog.capture('grand_wizard', { archetype, sp_total: curSp }); setScreen('grand'); return }
      posthog.capture('spell_won', { professor: profKey, is_boss: isBoss, sp_total: curSp })
      setDefeatedProfessors(prev => new Set([...prev, profKey]))
      setWonSpell(SPELL_NAMES[profKey] ?? 'Unknown Spell')
      setWonProfKey(profKey)
      setWonProfIsBoss(isBoss)
      setScreen('spellwin')
    }, 1500)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="game-container">

      {/* ══════════════════════════════════
          S1 — LANDING
      ══════════════════════════════════ */}
      <div id="s-landing" className={`screen${screen === 'landing' || screen === 'summons' ? ' active' : ''}${screen === 'summons' ? ' landing-under' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src="/assets/Landing_Page_Background.avif" alt="" />
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 40%, rgba(0,0,0,.22) 100%)' }} />

        <div className="landing-top-banner">Welcome to Lorethorn — the Academy of Product Spellcraft.</div>

        <div className="landing-logo-block">
          <div className="landing-logo-title">Spellcraft</div>
          <div className="landing-logo-sub">Wizard of Product</div>
          <div className="landing-logo-tagline">Three towers. Nineteen professors. One Keeper.</div>
        </div>

        <div className="prof-grid">
          {LANDING_PROFESSORS.map((p) => (
            <div key={p.name} className="prof-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="prof-card-img" src={p.img ?? '/assets/professor_placeholder.png'} alt={p.name} />
              <div className="prof-card-overlay">
                <div className="pname">{p.name.toUpperCase()}</div>
                <div className="ptitle">{p.title.toUpperCase()}</div>
              </div>
            </div>
          ))}
          <div className="prof-card final" onClick={openSummonsEasterEgg} style={{ cursor: 'pointer' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="prof-card-img" src="/assets/professors/lenny_rachitsky.jpg" alt="Lenny Rachitsky" />
            <div className="prof-card-overlay">
              <div className="pname">LENNY RACHITSKY</div>
              <div className="ptitle">KEEPER OF THE PRODUCT LORE</div>
              <div className="final-badge">FINAL DUEL</div>
            </div>
          </div>
          <div className="prof-card more">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="prof-card-img" src="/assets/professor_placeholder.png" alt="" style={{ opacity:.8 }} />
            <div className="prof-card-overlay">
              <div className="pname" style={{ color:'#a08040', letterSpacing:'.8px' }}>MORE LEGENDS AWAIT...</div>
            </div>
          </div>
        </div>

        {/* Scroll: image and text are siblings so filter on img never touches text */}
        <div className="scroll-shadow-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/scroll_transparent.png" alt="" className="scroll-img-only" />
          <div className="scroll-body">
            <div className="scroll-text">For Every<br />Product Mage.</div>
            <div className="scroll-text">Learn The Lore.<br />Claim Your Title.</div>
            <div className="scroll-divider"><div className="scroll-divider-gem" /></div>
            <div className="scroll-text lower">Duel Masters.<br />Build Your Playbook.<br />Rule The Product Realm.</div>
          </div>
        </div>

        <div className="orb-wrap">
          <input
            className="orb-name-input"
            type="text"
            placeholder="What shall we call you, mage?"
            maxLength={30}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') beginOracle() }}
          />
          <div className="orb-assembly" onClick={beginOracle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="orb-btn-img" src="/assets/orb_button_transparent.avif" alt="Begin" />
          </div>
        </div>

        <div className="curator-bar">
          <div className="curator-bar-text">
            Curated from <strong>LENNY&apos;S</strong>&nbsp; Newsletter &amp; Podcast
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
                      const title = toTitleCase(before.trim().split(/\s+/).slice(0, 5).join(' ')).replace(/[.,;]$/, '')
                      const desc = after ? after.trim() : opt.text
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
              Reveal What the Oracle Has Decided
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
            <div className="ar-content">
              <div className="ar-herald">The Oracle Has Spoken</div>
              <div className="ar-name">{arc.name}</div>
              <div className="ar-rule" />
              <div className="ar-desc">{arc.desc}</div>
              <div className="ar-tagline">{arc.tagline}</div>
            </div>
          </div>
          <div className="ar-tower-label">✦ Your Tower: {arc.towerName} ✦</div>
          <button className="ar-cta" onClick={startFirstDuel}>
            Enter {arc.towerName} ✦
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

        {/* Top status bar */}
        <div className="du-topbar">
          {/* Professor side */}
          <div className="du-hud-side">
            <div className="du-crest">{currentProf?.isBoss ? '👑' : '🏰'}</div>
            <div className="du-hud-info">
              <div className="du-hud-label">PROFESSOR</div>
              <div className="du-hud-name">{currentProf?.name.toUpperCase()}</div>
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
            <div className="du-duel-title">DUEL OF KNOWLEDGE</div>
            <div className="du-round-tag">
              {duelPhase === 'selecting' ? 'SELECT YOUR OPPONENT' : `QUESTION ${qIndex + 1} OF ${duelQs.length || 5}`}
            </div>
          </div>
          {/* Player side */}
          <div className="du-hud-side du-hud-right">
            <div className="du-hud-info" style={{ textAlign: 'right' }}>
              <div className="du-hud-label">YOU</div>
              <div className="du-hud-name">{rank.toUpperCase()}</div>
              <div className="du-hud-sub">{sp.toLocaleString()} SP · {currentTower?.name ?? 'Final Duel'}</div>
              {(() => {
                const maxH = finalBossActive ? 3 : 5
                const curH = finalBossActive ? lennyHearts : hearts
                const playerHp = Math.round((curH / maxH) * 100)
                return (
                  <div className="du-hp-wrap" style={{ justifyContent: 'flex-end' }}>
                    <span className="du-hp-label">
                      {Array.from({ length: maxH }).map((_, i) => (
                        <span key={i} style={{ color: i < curH ? '#e83030' : 'rgba(100,60,60,.4)' }}>♥</span>
                      ))}
                    </span>
                    <div className="du-hp-track"><div className="du-hp-fill blue" style={{ width: `${playerHp}%` }} /></div>
                  </div>
                )
              })()}
            </div>
            <div className="du-crest blue" onClick={() => setPlaybookModalOpen(true)} title="Open Playbook">📜</div>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="du-main">
          {/* LEFT: Switch towers + Professor figure + Possible Rewards */}
          <div className="du-left-col">
            <div className="du-tower-panel">
              <div className="du-panel-title">SWITCH TOWERS</div>
              <div className="du-left-tower-btns">
                {(['pm', 'strategy', 'ai'] as TowerKey[]).map(tk => (
                  <button
                    key={tk}
                    className={`du-left-tower-btn${activeTowerKey === tk ? ' active' : ''}`}
                    onClick={() => setActiveTowerKey(tk)}
                  >
                    {tk === 'pm' ? '🏛️ PM' : tk === 'strategy' ? '♟️ STRATEGY' : '🤖 AI'}
                  </button>
                ))}
              </div>
            </div>
            <div className="du-prof-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="du-prof-img"
                src={`/assets/professors/${currentProf?.key === 'lenny_oracle' ? 'lenny_rachitsky' : currentProf?.key}_nobg.avif`}
                alt={currentProf?.name}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (img.src.includes('_nobg.avif')) {
                    img.src = `/assets/professors/${currentProf?.key === 'lenny_oracle' ? 'lenny_rachitsky' : currentProf?.key}.jpg`
                  } else {
                    img.src = '/assets/professor_placeholder.png'
                  }
                }}
              />
            </div>
            <div className="du-bottom-panel">
              <div className="du-panel-title">POSSIBLE REWARDS</div>
              <div className="du-orbs-row du-orbs-single">
                <div className="du-orb">
                  <div className="du-orb-gem gold du-orb-gem-lg" />
                  <div className="du-orb-name">{currentProf && SPELL_NAMES[currentProf.key] ? SPELL_NAMES[currentProf.key].split(' ').slice(0, 2).join(' ').toUpperCase() : 'SPELL'}</div>
                  <div className="du-orb-desc">{currentTower?.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Question + Answers */}
          <div className="du-center-col">
            <div className="du-answer-hdr">ANSWER THE QUESTION</div>
            <div className="du-question-box">
              {duelPhase === 'selecting' ? (
                <div className="du-selecting">
                  <div className="du-selecting-title">Choose Your Opponent</div>
                  <div className="du-selecting-desc">Click a professor in the tower panel →<br />or switch towers using the tabs above.</div>
                </div>
              ) : duelError ? (
                <div className="duel-q-loading" style={{ color: 'var(--red-wrong)' }}>
                  The archive is unreachable. Please check your connection and refresh.
                </div>
              ) : duelLoading || !currentQ ? (
                <div className="duel-q-loading">Summoning questions…</div>
              ) : (
                <>
                  <div className="du-question-text">{currentQ.question}</div>
                  {answeredIndex !== null && currentQ.explanation && (
                    <div className="duel-q-explanation">{currentQ.explanation}</div>
                  )}
                </>
              )}
            </div>
            <div className="du-category-tag">
              <span className="du-cat-label">{currentTower?.name.toUpperCase() ?? 'PRODUCT'}</span>
            </div>
            {currentQ && !duelLoading && duelPhase === 'active' && (
              <div className="du-ans-row">
                {currentQ.displayOptions.map((opt, i) => {
                  let cls = 'du-ans-card'
                  if (answeredIndex !== null) {
                    if (i === answeredIndex) cls += opt.isCorrect ? ' correct' : ' wrong'
                    else if (opt.isCorrect) cls += ' reveal-correct'
                    else cls += ' answered'
                  }
                  const orbColor = i === 0 ? 'blue' : 'gold'
                  const title = opt.text.split(/[—\-–]/)[0].trim().split(/\s+/).slice(0, 3).join(' ').toUpperCase().replace(/[.,;:]$/, '')
                  return (
                    <div key={i} className={cls} onClick={() => handleAnswer(i)}>
                      <div className="du-ans-letter">{LETTERS[i]}</div>
                      <div className="du-ans-title">{title}</div>
                      <div className="du-ans-diamond">◆</div>
                      <div className="du-ans-desc">{opt.text}</div>
                      <div className="du-ans-glyph"><div className={`du-orb-art ${orbColor}`} /></div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="du-choose-row">
              <div className="du-choose-label">
                {duelPhase === 'selecting' ? 'AWAITING CHALLENGER'
                  : answeredIndex === -1 ? 'TIME EXPIRED'
                  : answeredIndex !== null ? 'SPELL CAST'
                  : 'CHOOSE YOUR ANSWER'}
              </div>
              <div className="du-timer-wrap">
                <div className="du-timer-line" />
                <div className={`du-timer${duelPhase === 'active' && answeredIndex === null && timeLeft <= 5 ? ' urgent' : ''}`}>
                  {duelPhase === 'active' && answeredIndex === null ? timeLeft : qIndex + 1}
                </div>
                <div className="du-timer-line" />
              </div>
            </div>
          </div>

          {/* RIGHT: Tower progress + Player */}
          <div className="du-right-col">
            <div className="du-tower-panel">
              <div className="du-panel-title">{panelTower?.name.toUpperCase() ?? 'TOWER'}</div>
              <div className="du-tower-progress">
                {panelDefeatedNonBoss} / {(panelTower?.professors.length ?? 1) - 1} PROFESSORS DEFEATED
              </div>
              <div className="du-tower-avatars">
                {panelTower?.professors.map((prof) => {
                  const isDefeated = defeatedProfessors.has(prof.key)
                  const isCurrent = prof.key === activeProfKey && duelPhase === 'active'
                  const isLocked = prof.isBoss && !panelBossUnlocked && !isDefeated
                  return (
                    <div
                      key={prof.key}
                      className={`du-avatar${isCurrent ? ' current' : isDefeated ? ' defeated' : isLocked ? ' locked' : ' available'}`}
                      onClick={!isLocked && !isDefeated ? () => launchDuel(activeTowerKey, prof.key) : undefined}
                      style={{ cursor: !isLocked && !isDefeated ? 'pointer' : 'default' }}
                      title={isLocked ? `Defeat ${3 - panelDefeatedNonBoss} more to unlock boss` : prof.name}
                    >
                      {isCurrent ? '⚔️' : isDefeated ? '✓' : isLocked ? '🔒' : (SPELL_EMOJIS[prof.key] ?? '🧙')}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="du-player-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="du-player-img" src="/assets/player_apprentice_nobg.avif" alt="Apprentice"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="du-bottom-panel">
              <div className="du-panel-title">YOUR SPELLS</div>
              <div className="du-orbs-row">
                {(() => {
                  const collected = panelTower?.professors.filter(p => defeatedProfessors.has(p.key)) ?? []
                  if (collected.length === 0) return (
                    <div className="du-orb">
                      <div className="du-orb-gem purple" style={{ opacity: .4 }} />
                      <div className="du-orb-name" style={{ opacity: .5 }}>NONE YET</div>
                    </div>
                  )
                  return collected.slice(0, 3).map((prof, i) => (
                    <div key={prof.key} className="du-orb">
                      <div className={`du-orb-gem ${['blue', 'red', 'gold'][i % 3]}`} />
                      <div className="du-orb-name">{(SPELL_NAMES[prof.key] ?? '').split(' ').slice(0, 2).join(' ').toUpperCase()}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback toast */}
        {lastResult && (
          <div className={`duel-feedback visible ${lastResult === 'timeout' ? 'wrong' : lastResult}`}>
            {lastResult === 'correct' ? `✓ Correct! +${lastSpGained} SP`
              : lastResult === 'timeout' ? `⏱ Time's Up! −1 Heart`
              : `✗ Wrong! −1 Heart`}
          </div>
        )}

        {/* First heart lost hint */}
        {heartHintVisible && (
          <div className="heart-hint-toast">
            💡 Lose all 5 hearts? Spend 500 SP to refill and keep going.
          </div>
        )}

        {/* Playbook modal overlay */}
        {playbookModalOpen && (
          <div className="pbm-wrap" onClick={() => setPlaybookModalOpen(false)}>
            <div className="pbm-overlay" />
            <div className="pbm-panel" onClick={e => e.stopPropagation()}>
              <button className="pbm-close" onClick={() => setPlaybookModalOpen(false)}>✕</button>
              <div className="pbm-inner">
                <div className="pb-scroll-inner">
                  <div className="pb-wrap">
                    <div className="pb-header">
                      <div className="pb-title">Spell Card Collection Playbook</div>
                      <div className="pb-subtitle">✦ MAX SPELLS: 19 &nbsp;·&nbsp; 1 PER PROFESSOR ✦</div>
                    </div>
                    <div className="pb-towers">
                      {(['pm', 'strategy', 'ai'] as TowerKey[]).map((towerKey) => {
                        const tower = TOWERS[towerKey]
                        const towerLabel = towerKey === 'pm' ? '🏰 PM TOWER' : towerKey === 'strategy' ? '⚔️ STRATEGY TOWER' : '🤖 AI TOWER'
                        return (
                          <div key={towerKey}>
                            <div className={`pb-tower-head ${towerKey}`}>{towerLabel}</div>
                            <div className="pb-cards">
                              {tower.professors.map((prof) => {
                                const collected = defeatedProfessors.has(prof.key)
                                return (
                                  <div
                                    key={prof.key}
                                    className={`pb-card${collected ? '' : ' locked'}${prof.isBoss ? (collected ? ' boss-collected' : ' boss') : ''}`}
                                  >
                                    {collected && <div className="pb-ribbon">COLLECTED</div>}
                                    <div
                                      className={`pb-icon ${towerKey}`}
                                      style={prof.isBoss ? (collected
                                        ? { background: 'linear-gradient(180deg,rgba(240,192,96,.22),rgba(240,192,96,.06))' }
                                        : { background: 'linear-gradient(180deg,rgba(180,30,20,.18),rgba(180,30,20,.05))' }
                                      ) : undefined}
                                    >
                                      {SPELL_EMOJIS[prof.key]}
                                    </div>
                                    <div className="pb-body">
                                      <div
                                        className="pb-spell"
                                        style={prof.isBoss ? (collected ? { color: 'var(--gold)' } : { color: '#e08070' }) : undefined}
                                      >
                                        {SPELL_NAMES[prof.key]}
                                      </div>
                                      <div className="pb-prof">— {prof.name}</div>
                                    </div>
                                    {!collected && (
                                      <div className="pb-lock">
                                        <div className="pb-lock-icon">🔒</div>
                                        <div className="pb-lock-text">
                                          {prof.isBoss ? 'Defeat the Tower Boss to unlock' : `Defeat ${prof.name} to unlock`}
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
            <div className="sw-prof-icon">{SPELL_EMOJIS[wonProfKey] ?? '🧙'}</div>
            <div className="sw-prof-name">
              {Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey)?.name.toUpperCase() ?? wonProfKey.toUpperCase()}
            </div>
            <div className="sw-prof-title">
              {Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey)?.title ?? ''}
            </div>
            <div style={{ borderTop: '1px solid rgba(160,120,50,.35)', width: '100%', margin: '4px 0' }} />
            <div className="sw-xp">+{duelTotalSp > 0 ? duelTotalSp : lastSpGained || 100} SP</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 9, color: 'rgba(180,150,90,.7)', fontStyle: 'italic', textAlign: 'center' }}>
              Earned this duel · Spell added to your Playbook
            </div>
          </div>

          {/* CENTER: Spell unlock */}
          <div className="sw-center">
            <div className="sw-header">SPELL UNLOCKED</div>
            <div className="sw-glow">
              <div className="sw-scroll-circle">
                <div className="sw-spell-icon">{SPELL_EMOJIS[wonProfKey] ?? '✦'}</div>
                <div className="sw-spell-name">{wonSpell}</div>
                <div className="sw-spell-sub">{SPELL_SUBTITLES[wonProfKey] ?? ''}</div>
              </div>
            </div>
            <div className="sw-quote-row">
              <div className="sw-quote">&ldquo;{PROFESSOR_WIN_LINES[wonProfKey] ?? ''}&rdquo;</div>
              <div className="sw-by">— {Object.values(TOWERS).flatMap(t => t.professors).find(p => p.key === wonProfKey)?.name ?? ''}</div>
            </div>
          </div>

          {/* RIGHT scroll: Playbook Progress */}
          <div className="sw-side">
            <div className="sw-card-tag">PLAYBOOK PROGRESS</div>
            <div className="sw-pb-count">{defeatedProfessors.size} / 19</div>
            <div className="sw-pb-sub">Spells Collected</div>
            <div style={{ borderTop: '1px solid rgba(160,120,50,.35)', width: '100%', margin: '4px 0' }} />
            <div className="sw-towers-wrap">
              {Object.entries(TOWERS).map(([key, tower]) => {
                const count = tower.professors.filter(p => defeatedProfessors.has(p.key)).length
                return (
                  <div key={key} className="sw-tower-row">
                    <span className="sw-tower-name">{tower.name.toUpperCase()}</span>
                    <span className="sw-tower-count">{count} / {tower.professors.length}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 9, color: 'rgba(180,150,90,.7)', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
              19 total spells (1 per professor)
            </div>
          </div>

          {/* FOOTER: buttons */}
          <div className="sw-footer">
            <div className="sw-btn-sp">+ {sp.toLocaleString()} SP</div>
            <button className="sw-btn-cont" onClick={advanceAfterSpellWin}>
              {wonProfIsBoss ? 'TOWER CLEARED — ONWARD ✦' : 'CONTINUE DUEL →'}
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
          <div id="s-tower-cleared" className={`screen${screen === 'tower_cleared' ? ' active' : ''}`}>
            <div className="tc-bg-overlay" />
            <div className="tc-stars" />
            <div className="tc-wrap">
              <div className="tc-badge">{towerDisplayName.toUpperCase()} CLEARED</div>
              <div className="tc-title">The {towerDisplayName} Falls.</div>
              <div className="tc-next">
                You&apos;ve bested the masters of this tower. Your knowledge grows.
                {nextTowerName && <> The {nextTowerName} has opened its gates.</>}
              </div>
              {nextTowerName && <div className="tc-next-badge">NEXT: {nextTowerName.toUpperCase()}</div>}
              <button className="tc-cta" onClick={() => { setActiveTowerKey(nextTowerKey); setDuelPhase('selecting'); setScreen('duel') }}>
                {nextTowerName ? `ENTER ${nextTowerName.toUpperCase()} →` : 'CONTINUE →'}
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
              <div className="pb-title">Spell Card Collection Playbook</div>
              <div className="pb-subtitle">✦ MAX SPELLS: 19 &nbsp;·&nbsp; 1 PER PROFESSOR ✦</div>
            </div>
            <div className="pb-towers">
              {(['pm', 'strategy', 'ai'] as TowerKey[]).map((towerKey) => {
                const tower = TOWERS[towerKey]
                const towerLabel = towerKey === 'pm' ? '🏰 PM TOWER' : towerKey === 'strategy' ? '⚔️ STRATEGY TOWER' : '🤖 AI TOWER'
                return (
                  <div key={towerKey}>
                    <div className={`pb-tower-head ${towerKey}`}>{towerLabel}</div>
                    <div className="pb-cards">
                      {tower.professors.map((prof) => {
                        const collected = defeatedProfessors.has(prof.key)
                        return (
                          <div
                            key={prof.key}
                            className={`pb-card${collected ? '' : ' locked'}${prof.isBoss ? (collected ? ' boss-collected' : ' boss') : ''}`}
                          >
                            {collected && <div className="pb-ribbon">COLLECTED</div>}
                            <div
                              className={`pb-icon ${towerKey}`}
                              style={prof.isBoss ? (collected
                                ? { background: 'linear-gradient(180deg,rgba(240,192,96,.22),rgba(240,192,96,.06))' }
                                : { background: 'linear-gradient(180deg,rgba(180,30,20,.18),rgba(180,30,20,.05))' }
                              ) : undefined}
                            >
                              {SPELL_EMOJIS[prof.key]}
                            </div>
                            <div className="pb-body">
                              <div
                                className="pb-spell"
                                style={prof.isBoss ? (collected ? { color: 'var(--gold)' } : { color: '#e08070' }) : undefined}
                              >
                                {SPELL_NAMES[prof.key]}
                              </div>
                              <div className="pb-prof">— {prof.name}</div>
                            </div>
                            {!collected && (
                              <div className="pb-lock">
                                <div className="pb-lock-icon">🔒</div>
                                <div className="pb-lock-text">
                                  {prof.isBoss ? 'Defeat the Tower Boss to unlock' : `Defeat ${prof.name} to unlock`}
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
          S8 — SUMMONS LETTER
          Tap anywhere to dismiss
      ══════════════════════════════════ */}
      <div
        id="s-summons"
        className={`screen${screen === 'summons' ? ' active' : ''} ${screen === 'summons' ? (summonsClosing ? 'sl-slide-down' : 'sl-slide-up') : ''}`}
        onClick={dismissSummons}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Summo_letter_background_1775007534371.jpg" alt="" />
        <div className="sl-tint" />

        <div className="sl-scroll-inner">
          <div className="sl-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sl-crest" src="/assets/Lorethron_crest_transparent.avif" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="sl-school">LORETHORN SCHOOL</div>
            <div className="sl-school-sub">OF PRODUCT SPELLCRAFT</div>
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
              AUTHOR, LENNY&apos;S NEWSLETTER · HOST, LENNY&apos;S PODCAST · KEEPER OF PRODUCT LORE
            </div>
            <div className="sl-tap-hint">TAP ANYWHERE TO {summonsVariant === 'easter_egg' ? 'DISMISS' : 'PROCEED'}</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          S9 — FINAL REVELATION
          No HUD — pure cinematic
      ══════════════════════════════════ */}
      <div id="s-final" className={`screen${screen === 'final' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Game_Background.avif" alt="" />
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
            <div className="fr-player-label">{rank.toUpperCase()}</div>
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
                src="/assets/professors/lenny_rachitsky.jpg"
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
              setFinalBossActive(true)
              setLennyHearts(3)
              setDuelPhase('active')
              setDuelQs([])
              setQIndex(0)
              setAnsweredIndex(null)
              setLastResult(null)
              setLastSpGained(0)
              setDuelTotalSp(0)
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
          <div className="gw-grand-sub">✦ {displayName.toUpperCase()}&apos;S PLAYBOOK &nbsp;·&nbsp; 19 / 19 SPELLS COLLECTED ✦</div>

          {/* 3-column spell roster */}
          <div className="gw-columns">
            {([
              { key: 'pm' as TowerKey,       label: '🏰 PM TOWER' },
              { key: 'strategy' as TowerKey, label: '⚔️ STRATEGY TOWER' },
              { key: 'ai' as TowerKey,       label: '🤖 AI TOWER' },
            ]).map(({ key, label }) => (
              <div key={key} className="gw-col">
                <div className="gw-col-label">{label}</div>
                {TOWERS[key].professors.map((prof) => (
                  <div key={prof.key} className={`gw-card${prof.isBoss ? ' boss' : ''}`}>
                    <div className="gw-card-ribbon">COLLECTED</div>
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
              {sp.toLocaleString()} SP &nbsp;·&nbsp; 19 Professors Defeated &nbsp;·&nbsp; 3 Towers Cleared
            </div>
            <div className="gw-lenny-quote">
              &ldquo;Most PMs read one framework and call it wisdom. You read nineteen.<br />
              You didn&apos;t just learn the game — you earned the right to change it.&rdquo;
            </div>
            <div className="gw-share-row">
              <button className="gw-btn-primary" onClick={handleCopyLink}>{copyLabel}</button>
              <button className="gw-btn-secondary" onClick={handleDownloadPlaybook}>DOWNLOAD YOUR PLAYBOOK</button>
              <button className="gw-btn-text" onClick={() => {
                setFinalBossActive(false)
                setHearts(5)
                setSp(0)
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
          LENNY LOSS
      ══════════════════════════════════ */}
      <div id="s-lenny-loss" className={`screen${screen === 'lenny_loss' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Game_Background.avif" alt="" />
        <div className="spellwin-center">
          <div className="spellwin-eyebrow" style={{ color: '#c8922a' }}>✦ THE KEEPER PREVAILS ✦</div>
          <div className="spellwin-spell" style={{ fontSize: 28 }}>The archive remembers.</div>
          <div className="spellwin-sub" style={{ fontStyle: 'italic', color: 'rgba(240,192,96,.75)' }}>
            &ldquo;Come back when you&apos;re ready — I&apos;ll have different questions.&rdquo;
          </div>
          <div className="spellwin-sub" style={{ fontSize: 12, marginTop: 4 }}>
            {sp.toLocaleString()} SP &nbsp;·&nbsp; {defeatedProfessors.size} Spells earned
          </div>
          <button
            className="ar-cta"
            onClick={async () => {
              setLennyHearts(3)
              setDuelPhase('active')
              setDuelQs([])
              setQIndex(0)
              setAnsweredIndex(null)
              setLastResult(null)
              setLastSpGained(0)
              setDuelTotalSp(0)
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
            ✦ Face the Keeper Again ✦
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          GAME OVER
      ══════════════════════════════════ */}
      <div id="s-game-over" className={`screen${screen === 'game_over' ? ' active' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" loading="lazy" src="/assets/Game_Background.avif" alt="" />
        <div className="spellwin-center" ref={goCardRef}>
          <div className="spellwin-eyebrow" style={{ color:'#e84030' }}>✦ DEFEATED ✦</div>
          <div className="spellwin-spell" style={{ fontSize: 36 }}>Your Hearts Run Out</div>
          {gameOverProfKey && PROFESSOR_LOSS_LINES[gameOverProfKey] && (
            <div className="spellwin-sub" style={{ fontStyle:'italic', color:'rgba(240,192,96,.7)', marginBottom: 4 }}>
              &ldquo;{PROFESSOR_LOSS_LINES[gameOverProfKey]}&rdquo;
            </div>
          )}
          <div className="spellwin-sub">
            You earned <strong style={{ color:'var(--gold)' }}>{sp.toLocaleString()} SP</strong> and
            collected <strong style={{ color:'var(--gold)' }}>{defeatedProfessors.size}</strong> spell
            {defeatedProfessors.size !== 1 ? 's' : ''}.<br />
            The Academy awaits your return.
          </div>
          <button
            className={`go-refill-btn${sp < 500 ? ' go-refill-disabled' : ''}`}
            disabled={sp < 500}
            onClick={() => {
              if (sp < 500) return
              setSp(prev => prev - 500)
              setHearts(5)
              const prof = allProfessors.find(p => p.key === activeProfKey)
              if (prof) launchDuel(prof.tower, prof.key)
            }}
          >
            ✦ Continue Your Journey — 500 SP ✦
          </button>
          {sp < 500 && (
            <div className="go-refill-hint">
              Earn {(500 - sp).toLocaleString()} more SP to unlock this
            </div>
          )}
          <div className="go-divider" />
          <div className="go-actions">
            <button className="gw-btn-secondary" onClick={handleDownloadGameOver}>DOWNLOAD YOUR PROGRESS</button>
            <button className="gw-btn-text" onClick={() => {
              setFinalBossActive(false)
              setHearts(5)
              setSp(0)
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

      {/* ── Lenny's Blessing Overlay ── */}
      {blessing && (
        <div className={`blessing-overlay${blessing.phase === 'result' && !blessing.isCorrect ? ' blessing-dismiss' : ''}`}>
          <div className="blessing-burst" />
          <div className="blessing-content">

            <div className={`blessing-portrait-ring${blessing.phase === 'result' && blessing.isCorrect ? ' blessing-nod' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/professors/lenny_rachitsky.jpg"
                alt="Lenny Rachitsky"
                className="blessing-portrait-img"
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/professor_placeholder.png' }}
              />
            </div>

            {blessing.phase === 'loading' && (
              <div className="blessing-loading-text">A message from the Keeper…</div>
            )}

            {(blessing.phase === 'question' || blessing.phase === 'result') && blessing.q && (
              <>
                <div className="blessing-opening">
                  &ldquo;I have one question. From the archive. No one else gets this — just you, right now.&rdquo;
                </div>
                <div className="blessing-question-panel">
                  <div className="blessing-eyebrow">✦ THE KEEPER&apos;S QUESTION ✦</div>
                  <div className="blessing-question-text">{blessing.q.question}</div>
                </div>
                <div className="blessing-answers">
                  {blessing.q.displayOptions.map((opt, i) => {
                    let cls = 'blessing-ans'
                    if (blessing.answeredIndex !== null) {
                      if (i === blessing.answeredIndex) cls += opt.isCorrect ? ' b-correct' : ' b-wrong'
                      else if (opt.isCorrect) cls += ' b-reveal'
                      else cls += ' b-answered'
                    }
                    return (
                      <div key={i} className={cls} onClick={() => handleBlessingAnswer(i)}>
                        <div className="blessing-ans-letter">{LETTERS[i]}</div>
                        <div className="blessing-ans-text">{opt.text}</div>
                      </div>
                    )
                  })}
                </div>
                {blessing.phase === 'result' && blessing.isCorrect && (
                  <div className="blessing-sp-reward">+500 SP</div>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Rank Up Ceremony Overlay ── */}
      {rankUpInfo && (
        <div className="rank-up-overlay" style={{ '--rank-color': rankUpInfo.color } as React.CSSProperties}>
          <div className="rank-up-rays" />
          <div className="rank-up-content">
            <div className="rank-up-eyebrow">✦ RANK ACHIEVED ✦</div>
            <div className="rank-up-name" style={{ color: rankUpInfo.color }}>{rankUpInfo.label.toUpperCase()}</div>
            <div className="rank-up-divider" style={{ background: rankUpInfo.color }} />
            <div className="rank-up-achievement">{RANK_ACHIEVEMENTS[rankUpInfo.label]}</div>
          </div>
        </div>
      )}

    </div>
  )
}
