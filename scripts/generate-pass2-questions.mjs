/**
 * Wizard of Product — Pass 2 Question Generation Script
 *
 * Generates 9 ADVANCED quiz questions per professor.
 * Pass 2 questions are asked in the professor's voice but draw on themes
 * from Lenny's newsletter archive — connecting the professor's framework
 * to real-world product scenarios Lenny has written about.
 *
 * Usage:
 *   node scripts/generate-pass2-questions.mjs                    (test: gibson_biddle only)
 *   node scripts/generate-pass2-questions.mjs --all              (all 19 professors + lenny_oracle)
 *   node scripts/generate-pass2-questions.mjs --prof tal_raviv   (specific professor)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Shared Lenny newsletter content blocks (embedded per-professor below)
// ─────────────────────────────────────────────────────────────────────────────

const LENNY_HOW_AI_IMPACTS_PM = `
Lenny Rachitsky's newsletter "How AI will impact product management" (2024):
- Lenny argues AI will have the MOST impact on historically HIGH-level PM skills: strategy, vision, discovery, goal-setting
- The skills that will REMAIN valuable: soft skills (communication, influence, product sense, empathy) and being the "glue"
- AI impact ratings: Strategy/Vision: 4/5 robots | Discovery: 3/5 | Roadmap: 2/5 | Stakeholder alignment: 2/5 | Team morale: 1/5
- Jensen Huang: "programming language is human" — everyone will be a programmer via AI
- Sam Altman: once AGI exists, it will generate its own investment returns — high-level strategic thinking at risk
- Lenny's take: PM role won't go away, it becomes the conductor/quarterback who ties together people AND AI
`;

const LENNY_COUNTERINTUITIVE_AI = `
Lenny Rachitsky's newsletter "Counterintuitive advice for building AI products" (2024) — 20+ top builders:
- "First-pass AI product is often a bolt-on or chat experience. The high-value experience requires a deeper rethink." — Elad Gil
- "Demo value isn't user value. Building a cool AI demo doesn't mean customers love it." — Joshua Xu (HeyGen)
- AI products need AI embracers vs. AI skeptics segmentation — novelty drives acquisition but skeptics need different onboarding
- "Branding your product as AI-powered increases engagement AND helps users understand what to expect." — CommandBar
- Scott Belsky (Adobe): data and interfaces will matter MORE than models. Proprietary data + superior UX = durable advantage
- Claire Vo (LaunchDarkly): "Smallest, almost invisible AI features are fan favorites — pre-filling names, tiny data transforms"
- "Look less at 'what cool AI could do' and more at 'what do users do 100 times a day that AI could improve.'" — Incident.io
- Speed wins: pre-computing AI outputs vs. generating on demand = massive UX difference (Superhuman)
- AI products have a "phantom PMF" problem: novelty-driven acquisition leads to steep churn cliff
`;

const LENNY_AI_AGENTS_PM = `
Tal Raviv's guest post "Make product management fun again with AI agents" (Lenny's Newsletter, 2025):
- AI agent agentic spectrum: acts proactively, makes a plan, leverages context, draws on live data, takes real-world action, creates feedback loop
- Most practical category for PMs today: "AI automations" (Zapier, Lindy AI, Relay, Cassidy AI, Gumloop)
- Design principles: (1) Do I understand the task? (2) Can I start even smaller? (3) Can I keep downside low? (4) Am I giving enough context? (5) Stay close to raw customer signals
- "DMs are the devil" — move to public channels; build self-reliant teams
- Danger zone: "If I use AI to summarize everything, I'll quickly degrade my customer intuition"
- Cost reduction: pick cheaper model OR feed it less data — start with quality, optimize later
- Trust is gained in drops: increase AI agent scope gradually after verifying output quality
`;

const LENNY_BEYOND_VIBE_CHECKS = `
Aman Khan's guest post "Beyond vibe checks: A PM's complete guide to evals" (Lenny's Newsletter, 2025):
- Evals are like driving tests for AI — measuring awareness, decision-making, and safety
- Three eval types: (1) Human evals (sparse, costly), (2) Code-based evals (fast, cheap, weak for open-ended), (3) LLM-as-judge (scalable, probabilistic)
- The 4-part eval formula: (1) Set the role, (2) Provide context, (3) Provide the goal, (4) Define terminology & labels
- Standard eval criteria: hallucination, toxicity/tone, overall correctness, summarization quality, retrieval relevance
- Eval workflow phases: Collection → First-pass evaluation → Iteration loop → Production monitoring
- Common mistakes: (1) too complex too quickly, (2) not testing edge cases, (3) forgetting to validate against real user feedback
- "Prompts may make headlines, but evals quietly decide whether your product thrives or dies"
- Start simple: 10–100 labeled examples, then iterate. Spreadsheets are fine initially.
`;

const LENNY_PM_INFLUENCE = `
Jules Walter's guest post "A PM's guide to influence" (Lenny's Newsletter, 2024) — 5 tactics:
1. Seek intel on how each stakeholder makes decisions (goals, OKRs, decision process, key decision makers, anticipated concerns)
2. Frame your message from THEIR POV — "Negotiation is the art of letting the other side have your way" (Chris Voss)
3. Prime detractors AND champions in the "meeting before the meeting" — walk in with a coalition
4. Make people feel heard and validated — play back statements in your own words; people won't listen until they feel heard
5. Manage the clock — state desired outcome upfront; be the conductor, not one voice among many
- Jules led Slack's controversial monetization shift by framing everything through user-centric lens (CEO's POV), not revenue
- Result: 20% increase in teams paying for Slack
`;

const LENNY_WORK_UNFAIRLY = `
Tal Raviv's guest post "Product manager is an unfair role. So work unfairly." (Lenny's Newsletter, 2024) — 7 tactics:
1. Get out of tasks in the meeting itself — screenshare and do action items LIVE with everyone watching
2. Use 59-second Looms to replace 30-minute meetings
3. Hide, ignore, and automate Slack — don't go into Slack for first half of day; use Slack sections; hide read channels
4. Cultivate a team that operates without you — "turn everyone into a mini-PM"
5. Get a head start on discovery with product scrapbooking — Notion database of raw customer signals by swim lane
6. Let AI write for you (but don't let it read for you) — use speech-to-text + LLMs for docs; protect your intuition from AI summaries
7. PM your own brain's freshness — full disconnects, uninstall Slack mobile app, physical transitions
- "Tech orgs are flattening" — PMs who thrive build their own systems and redefine work norms
`;

const LENNY_STRATEGY_BLOCKS = `
Chandra Janakiraman's guest post "Strategy Blocks: An operator's guide to product strategy" (Lenny's Newsletter, 2024) — 5-step framework:
1. Market insight: outside-in view of where the market is going, not where it is
2. Strategic bets: the 2–3 big choices that will define whether you win or lose
3. Must-win battles: initiatives where you CANNOT afford to lose — different from nice-to-haves
4. Initiatives: specific projects/roadmap items that support must-win battles
5. Metrics: how you'll know your strategy is working — leading AND lagging indicators
- "Most product strategies are just lists of initiatives — that's not a strategy, that's a roadmap"
- Order of strategic bets matters: sequencing is a strategic decision
- Must-win battles must be connected to the strategic bets — if an initiative doesn't support a must-win battle, it's a distraction
`;

// ─────────────────────────────────────────────────────────────────────────────
// Professor roster with Pass 2 source summaries
// ─────────────────────────────────────────────────────────────────────────────

const PROFESSORS = [
  // PM Tower
  {
    professor: 'gibson_biddle',
    displayName: 'Gibson Biddle',
    domain: 'pm',
    wizardTitle: 'The DHM Keeper',
    pass2Source: `
Gibson Biddle's core framework: DHM model (Delight customers in Hard-to-copy, Margin-enhancing ways).
Core ideas: GEM roadmap (Growth, Engagement, Monetisation), proxy metrics for strategy, the role of experiments.

Lenny's newsletter themes Gibson would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_COUNTERINTUITIVE_AI}

Pass 2 question angle: Ask how Gibson's DHM model applies in an AI product context — which Lenny newsletter ideas would Gibson validate, challenge, or extend through the DHM lens? Scenarios should involve strategy, prioritisation trade-offs, and whether AI features are truly hard-to-copy or just table stakes.
    `.trim()
  },
  {
    professor: 'jules_walter',
    displayName: 'Jules Walter',
    domain: 'pm',
    wizardTitle: 'The Influence Enchanter',
    pass2Source: `
Jules Walter's core expertise: product sense (four practices) and influence (five tactics from his Lenny's Newsletter posts).
Core ideas: seeking intel, framing from stakeholder POV, meeting before the meeting, making people feel heard, managing the clock.

Lenny's newsletter post Jules authored:
${LENNY_PM_INFLUENCE}

Additional Lenny context Jules would draw on:
${LENNY_WORK_UNFAIRLY}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: Deepen Jules' influence frameworks — push on edge cases, failure modes, and how these tactics apply at different seniority levels or company stages. Also connect to how AI tools (like in Tal's posts) change the influence dynamic.
    `.trim()
  },
  {
    professor: 'teresa_torres',
    displayName: 'Teresa Torres',
    domain: 'pm',
    wizardTitle: 'Oracle of Discovery',
    pass2Source: `
Teresa Torres' core framework: continuous discovery, opportunity solution trees, weekly customer interviews, assumption testing.
Core ideas: OST, connecting customer outcomes to business outcomes, story mapping, the difference between discovery and delivery.

Lenny's newsletter themes Teresa would engage with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_BEYOND_VIBE_CHECKS}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: How does continuous discovery change when you're building AI products? How do evals relate to assumption testing? When does AI-assisted discovery help vs. hurt (staying close to raw signals)? Teresa would be concerned about AI summaries replacing direct customer signals.
    `.trim()
  },
  {
    professor: 'shreyas_doshi',
    displayName: 'Shreyas Doshi',
    domain: 'pm',
    wizardTitle: 'Master of Strategic Spells',
    pass2Source: `
Shreyas Doshi's core frameworks: LNO (Leverage/Neutral/Overhead tasks), upstream vs downstream thinking, three traps of experienced PMs, pre-mortem thinking.
Core ideas: outcome vs. output metrics, influence without authority, the difference between great PMs and average PMs.

Lenny's newsletter themes Shreyas would engage with:
${LENNY_PM_INFLUENCE}
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_WORK_UNFAIRLY}

Pass 2 question angle: Shreyas would challenge the surface-level versions of these tactics. He'd push on: what's the real leverage here? Are you solving upstream or downstream? Are these productivity hacks overhead tasks dressed up as leverage? Connect LNO framework to AI agent adoption and influence tactics.
    `.trim()
  },
  {
    professor: 'julie_zhuo',
    displayName: 'Julie Zhuo',
    domain: 'pm',
    wizardTitle: 'Enchantress of Design & Leadership',
    pass2Source: `
Julie Zhuo's core expertise: management, giving feedback, design thinking, building teams, making great managers.
Core ideas: What makes a great manager, designing for humans, building trust, product intuition through design.

Lenny's newsletter themes Julie would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_WORK_UNFAIRLY}
${LENNY_PM_INFLUENCE}

Pass 2 question angle: Julie cares deeply about human connection and judgment. How does AI change management and feedback? Which PM skills does she most worry about atrophying in an AI-first world? How does "giving feedback on AI outputs" compare to "giving feedback on human work"? Connect to team-building and the soft skills Lenny argues become MORE valuable.
    `.trim()
  },
  {
    professor: 'april_dunford',
    displayName: 'April Dunford',
    domain: 'pm',
    wizardTitle: 'The Positioning Sage',
    pass2Source: `
April Dunford's core expertise: positioning (the five components), the difference between positioning and messaging, how bad positioning kills good products.
Core ideas: competitive alternatives, unique attributes, target customer, market category choice, the link between positioning and pricing.

Lenny's newsletter themes April would engage with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: AI products have a positioning crisis — most are "AI-powered X" which is not a category, it's a feature. April would want to push on: what IS the competitive alternative for an AI product? How do you position when the underlying model is commoditized? When "AI" branding helps (Lenny article: calling it AI increases engagement) vs. when positioning should go deeper.
    `.trim()
  },
  {
    professor: 'marty_cagan',
    displayName: 'Marty Cagan',
    domain: 'pm',
    wizardTitle: 'The Ancient Sage of Product',
    pass2Source: `
Marty Cagan's core frameworks: product discovery vs. delivery, empowered teams, four big risks (value/usability/feasibility/viability), outcome vs. output.
Core ideas: feature teams vs. product teams, continuous discovery, OKRs for product teams.

Lenny's newsletter themes Marty would engage with:
${LENNY_AI_AGENTS_PM}
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_WORK_UNFAIRLY}

Pass 2 question angle: Marty is deeply concerned about teams becoming feature factories. Do AI agents risk making PMs into even MORE of a feature factory — automating the wrong things? When does AI assistance undermine the discovery work that empowered teams are supposed to do? How should empowered teams evaluate AI features using the four risks?
    `.trim()
  },
  // Strategy Tower
  {
    professor: 'chandra_janakiraman',
    displayName: 'Chandra Janakiraman',
    domain: 'strategy',
    wizardTitle: 'The Strategy Blocks Sage',
    pass2Source: `
Chandra Janakiraman's core framework: Strategy Blocks 5-step (market insight → strategic bets → must-win battles → initiatives → metrics).
Core ideas: strategy ≠ roadmap, sequencing bets, must-win battles, outside-in market insight.

Lenny's newsletter post Chandra authored:
${LENNY_STRATEGY_BLOCKS}

Additional Lenny context Chandra would draw on:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: Extend Strategy Blocks into harder scenarios — how do you apply it to AI product strategy? How do you identify must-win battles in a fast-moving AI market? When does your market insight tell you to bet on AI as a strategic bet vs. a tactical initiative? What metrics prove your AI strategy is working?
    `.trim()
  },
  {
    professor: 'roger_martin',
    displayName: 'Roger Martin',
    domain: 'strategy',
    wizardTitle: 'Wizard of Winning Choices',
    pass2Source: `
Roger Martin's core framework: strategy as integrated choices — winning aspiration, where to play, how to win, capabilities, management systems.
Core ideas: strategy ≠ planning, why most strategies fail, making and testing strategic choices, reverse engineering competitors.

Lenny's newsletter themes Roger would engage with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_STRATEGY_BLOCKS}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: Roger's "Playing to Win" framework is fundamentally about choices and trade-offs. Apply it to AI product strategy: where does an AI startup choose to play? How does Roger's logic apply when Lenny's article says "start with a wedge workflow"? When does Roger's integrated choice cascade break down in fast-moving AI markets?
    `.trim()
  },
  {
    professor: 'christopher_lochhead',
    displayName: 'Christopher Lochhead',
    domain: 'strategy',
    wizardTitle: 'The Category Pirate',
    pass2Source: `
Christopher Lochhead's core ideas: category design — legendary companies create categories, not compete in them. Category POV, lightning strike moments, "Play Bigger" framework.
Core ideas: competing vs. creating, language and framing as category tools, why most marketing is wasted.

Lenny's newsletter themes Lochhead would engage with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_STRATEGY_BLOCKS}

Pass 2 question angle: The AI wave is a once-in-a-generation category design opportunity — but most AI companies are COMPETING ("we're AI-powered X") instead of CREATING. Lochhead would ask: what IS the new category here? Lenny's article on counterintuitive AI product advice shows why "bolt-on AI" fails. Connect category design to the AI product moment.
    `.trim()
  },
  {
    professor: 'marc_andreessen',
    displayName: 'Marc Andreessen',
    domain: 'strategy',
    wizardTitle: 'The Contrarian Archmage',
    pass2Source: `
Marc Andreessen's core ideas: software eating the world, product-market fit, contrarian thinking, timing in tech, network effects, why most startups fail.
Core ideas: PMF as the only thing that matters early on, the pmarca guide to startups, how to think about technology cycles.

Lenny's newsletter themes Marc would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_STRATEGY_BLOCKS}

Pass 2 question angle: Marc is contrarian by nature. He'd challenge the consensus narrative in Lenny's AI articles. Where does the "AI will replace high-level PM skills" thesis get the timing wrong? What's the contrarian take on AI PMF — what does "phantom PMF" tell you about the market? When is being early to AI the same as being wrong?
    `.trim()
  },
  {
    professor: 'hamilton_helmer',
    displayName: 'Hamilton Helmer',
    domain: 'strategy',
    wizardTitle: 'Master of the 7 Powers',
    pass2Source: `
Hamilton Helmer's core framework: 7 Powers — scale economies, network economies, counter-positioning, switching costs, branding, cornered resource, process power.
Core ideas: power vs. competitive advantage, when each power applies, the role of invention in strategy.

Lenny's newsletter themes Helmer would engage with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_STRATEGY_BLOCKS}
${LENNY_HOW_AI_IMPACTS_PM}

Pass 2 question angle: Scott Belsky in Lenny's counterintuitive AI article says "proprietary data + superior interface = durable advantage" — which of Helmer's 7 Powers is that? Apply the 7 Powers lens to AI companies: when do models become commoditized (counter-positioning fails), when does data create cornered resource power, when is AI branding actually branding power vs. hype?
    `.trim()
  },
  // AI Tower
  {
    professor: 'tal_raviv',
    displayName: 'Tal Raviv',
    domain: 'ai',
    wizardTitle: 'Wizard of Modern Product Tools',
    pass2Source: `
Tal Raviv's core expertise: AI agents for product managers, the "super-IC PM", productivity systems, prompting as a product skill.
Core ideas: agentic spectrum (proactive/plans/context/live data/action/feedback loop), design principles for agents, working unfairly as a PM.

Lenny's newsletter posts Tal authored:
${LENNY_AI_AGENTS_PM}
${LENNY_WORK_UNFAIRLY}

Pass 2 question angle: Push deeper on Tal's frameworks — when do his design principles fail? What are the hardest edge cases when deploying AI agents for PM work? How does "low downside design" conflict with driving real business impact? When does staying close to raw signals become an excuse NOT to use AI? These should be the hardest possible extensions of Tal's frameworks.
    `.trim()
  },
  {
    professor: 'aman_khan',
    displayName: 'Aman Khan',
    domain: 'ai',
    wizardTitle: 'The Eval Conjurer',
    pass2Source: `
Aman Khan's core expertise: AI product evaluations, moving from vibe checks to rigorous evals.
Core ideas: 3 eval types (human/code-based/LLM-as-judge), 4-part eval formula, 4-phase eval workflow (collection/eval/iteration/monitoring), common eval mistakes.

Lenny's newsletter post Aman authored:
${LENNY_BEYOND_VIBE_CHECKS}

Pass 2 question angle: Push beyond Aman's intro content into advanced eval scenarios. How do you design evals when you don't have ground truth? When does LLM-as-judge introduce the same biases you're trying to catch? How do you translate eval scores into product decisions (go/no-go, feature kill, model swap)? How does an eval strategy change at different company stages (prototype vs. scale vs. regulated industry)?
    `.trim()
  },
  {
    professor: 'claire_vo',
    displayName: 'Claire Vo',
    domain: 'ai',
    wizardTitle: 'Conjurer of Agentic Arts',
    pass2Source: `
Claire Vo's core expertise: AI-native product design, agentic workflows, human-in-the-loop patterns, AI product management.
Core ideas: AI-native vs. AI-assisted products, when to use agents vs. simpler AI features, designing for AI uncertainty.

Lenny's newsletter themes Claire contributed to and engages with:
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_AI_AGENTS_PM}
${LENNY_HOW_AI_IMPACTS_PM}

Additional context — Lenny's newsletter on what people are building with AI:
- "Vibe coding" trend: people building real products with AI coding tools, often without engineering backgrounds
- Claude Code, Cursor, v0 are changing who can build products
- AI-native products see best PMF when they find a workflow with "high promise-to-payoff ratio and repeat use"
- "Smallest, almost invisible AI features are fan favorites" — Claire Vo (from counterintuitive advice article)

Pass 2 question angle: Claire sits at the intersection of AI product design and agentic systems. Hard scenarios: when does an AI-native redesign HURT retention (phantom PMF cliff)? How do you design the right human-in-the-loop for an autonomous agent? What's the right moment to move from "AI-assisted" to "AI-native" as a product strategy?
    `.trim()
  },
  {
    professor: 'nick_turley',
    displayName: 'Nick Turley',
    domain: 'ai',
    wizardTitle: 'Keeper of the Speaking Crystal',
    pass2Source: `
Nick Turley's core expertise: product at ChatGPT/OpenAI, building AI products at massive scale, user trust in AI, AI product roadmaps.
Core ideas: AI product metrics that matter, designing for hallucination and uncertainty, how the underlying model changing affects roadmap.

Lenny's newsletter themes Nick would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_AI_AGENTS_PM}

Additional Lenny context on AI adoption at scale:
25 proven tactics to accelerate AI adoption (from Lenny's newsletter):
- Executive sponsorship is the #1 predictor of company-wide AI adoption
- Pilot programs need to show ROI in 4–6 weeks or momentum dies
- "AI champions" within teams drive adoption better than top-down mandates
- Common failure mode: deploying AI to the wrong workflow first — choose high-frequency, low-stakes tasks
- Training matters: people who understand HOW the AI works trust it more and use it better

Pass 2 question angle: Nick operates at the extreme end of AI product scale. He'd push on: what happens to your AI product roadmap when you hit 100M users? How does trust at scale differ from trust in beta? How do you measure AI product quality when 1% of a huge user base is still millions of people? What's the AI PM playbook for when your underlying model provider (OpenAI, Anthropic) is also your biggest competitor?
    `.trim()
  },
  {
    professor: 'hamel_husain',
    displayName: 'Hamel Husain',
    domain: 'ai',
    wizardTitle: 'The Grand Evaluator',
    pass2Source: `
Hamel Husain's core expertise: rigorous LLM eval systems, building production AI, LLM-as-judge methodology.
Core ideas: what a real eval is, how to detect hallucination, building eval pipelines, the difference between unit tests and evals.

Lenny's newsletter themes Hamel would engage with (as a domain expert):
${LENNY_BEYOND_VIBE_CHECKS}
${LENNY_COUNTERINTUITIVE_AI}

Additional eval context from Hamel's work (building-eval-systems-that-improve-your-ai-product):
- Hamel's key insight: evals are a form of product discovery — they reveal what "good" actually means for your use case
- "Consistent model responses" are achievable through a combination of: better prompts, fine-tuning, eval-driven iteration
- The best eval systems align automated evals with human judgment — if they diverge, fix the eval, not the AI
- Data collection strategy matters: capture real failures FIRST, then build evals that would have caught them
- Hamel's field guide: measure alignment between automated evals and human judgment as your eval "meta-eval"
- Don't build eval infrastructure before you have eval clarity — most teams build before they know what "good" means

Pass 2 question angle: Hamel goes deeper on eval rigor than Aman's intro post. Hard scenarios: when do automated evals give you false confidence? How do you design evals when the correct answer is subjective? What's the right eval coverage threshold before shipping a model update? How do evals change when you fine-tune vs. prompt-engineer vs. switch models?
    `.trim()
  },
  {
    professor: 'chip_huyen',
    displayName: 'Chip Huyen',
    domain: 'ai',
    wizardTitle: 'The Architect of AI Systems',
    pass2Source: `
Chip Huyen's core expertise: ML/AI engineering, the AI engineering stack (data/models/serving/monitoring), latency/cost/quality trade-offs.
Core ideas: when to use RAG vs. fine-tuning vs. prompting, common production failure modes, streaming vs. batch inference.

Lenny's newsletter themes Chip would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_BEYOND_VIBE_CHECKS}
${LENNY_COUNTERINTUITIVE_AI}

Additional context — Lenny's AI glossary (key terms PMs need):
- Hallucination: model generates plausible-sounding but incorrect information
- RAG (Retrieval Augmented Generation): grounding model responses in retrieved documents
- Fine-tuning: updating model weights on domain-specific data
- Embeddings: vector representations of text for semantic search
- Context window: how much text the model can process at once
- Temperature: controls randomness of model output
- Latency: time-to-first-token matters more than total generation time for user experience
- Cost: both tokens consumed AND infrastructure cost matter at scale

Pass 2 question angle: Chip bridges ML engineering and product thinking. Hard scenarios: when does a PM's choice of RAG vs. fine-tuning create a strategic moat (vs. just a technical decision)? How does latency affect product design decisions in real-time AI features? What engineering trade-offs should a PM understand when making AI product roadmap choices? When does "the model improving" make your product better automatically vs. when do you need to re-architect?
    `.trim()
  },
  {
    professor: 'fei_fei_li',
    displayName: 'Dr. Fei-Fei Li',
    domain: 'ai',
    wizardTitle: 'The Godmother of Intelligence',
    pass2Source: `
Dr. Fei-Fei Li's core expertise: foundational AI research (ImageNet), world models, spatial intelligence, human-centered AI, AI and jobs.
Core ideas: what world models are, why spatial intelligence is the next frontier, AI safety and responsibility, augmentation vs. replacement.

Lenny's newsletter themes Fei-Fei would engage with:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_COUNTERINTUITIVE_AI}

Additional context:
- Fei-Fei's "Godmother of AI" perspective: she saw deep learning before the world did — she has a long-arc view others lack
- World models: AI systems that build an internal model of physical/causal reality, not just pattern matching on tokens
- Spatial intelligence: understanding 3D space, physics, causality — what robotics and embodied AI need
- Her concern: narrow AI adoption metrics (downloads, engagement) miss the deeper question of whether AI creates human flourishing
- Human-centered AI: designing systems that augment human capability rather than degrade human judgment and agency
- She'd challenge: Lenny's article says AI replaces "strategy" — Fei-Fei would say: replacing strategy is not the same as augmenting strategists

Pass 2 question angle: Fei-Fei operates at the 10–20 year horizon. She'd ask: are today's AI products building toward world models and spatial intelligence, or creating brittle narrow AI dependence? How does her "human-centered AI" lens challenge product decisions that optimize for engagement metrics? What does it mean to build AI products responsibly when you're a PM at a company that isn't Fei-Fei's lab?
    `.trim()
  },
  // Bonus oracle
  {
    professor: 'lenny_oracle',
    displayName: 'Lenny Rachitsky',
    domain: 'pm',
    wizardTitle: 'The Keeper of Product Lore',
    pass2Source: `
Lenny Rachitsky is the Keeper of Product Lore — the rare oracle encounter. These questions synthesise his newsletter's deepest cross-cutting wisdom.

Key Lenny frameworks and ideas:
- Product-market fit: the feeling it gives you, the signs (retention curves flatten, NPS spikes, word of mouth), how to know when you have it
- Growth loops vs. funnels: loops are self-reinforcing (virality, content, UX loops); funnels are linear
- Retention as the foundation: "Nail retention before growth or you're filling a leaky bucket"
- The PM job: "deliver business impact by marshaling the resources of your team to identify and solve the most impactful customer problems"
- North Star metric: the single metric that captures most of your product's value creation for users
- RICE prioritisation: Reach × Impact × Confidence ÷ Effort
- How to say no as a PM: say no to the request, yes to the underlying need; use data; give a reason
- Lenny's guides on 1:1s, hiring, onboarding, metrics

Synthesis from key newsletters:
${LENNY_HOW_AI_IMPACTS_PM}
${LENNY_COUNTERINTUITIVE_AI}
${LENNY_PM_INFLUENCE}
${LENNY_AI_AGENTS_PM}

Pass 2 question angle: Lenny as oracle asks the questions that span his entire archive. These should feel like the questions only someone who has read hundreds of Lenny posts could ask — synthesising across PM fundamentals, growth, AI, and strategy. Senior scenarios. Things that sound right but are subtly wrong at scale. The oracle wants to know if you've been paying attention.
    `.trim()
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Prompt template
// ─────────────────────────────────────────────────────────────────────────────

const PASS2_PROMPT = (prof) => `You are writing PASS 2 quiz questions for "Wizard of Product" — a browser RPG set in a magic academy. These are questions spoken by ${prof.displayName} (${prof.wizardTitle}), drawing on themes from Lenny Rachitsky's newsletter that intersect with their domain expertise.

The professor being portrayed: ${prof.displayName}
Their domain: ${prof.domain.toUpperCase()}

Source material — professor's frameworks COMBINED with Lenny newsletter themes:
${prof.pass2Source}

Generate exactly 9 questions. ALL 9 must be ADVANCED difficulty. Follow these rules:

TONE & VOICE:
- Questions are spoken from the professor's chair to the student — direct, challenging, a little theatrical
- The professor is connecting THEIR framework to something Lenny wrote about — this should feel natural, not forced
- Never refer to the professor by name in the question text (they are the one asking)
- Never say "According to Lenny..." — these are the professor's questions, they've read his work and are grilling you on how it connects
- Avoid dry definitions — prefer scenario challenges, trade-offs, and "what would you do?" situations
- The world is a magic academy — occasional wizard metaphors welcome but don't force it

QUESTION QUALITY:
- ALL 9: Real trade-offs, uncomfortable choices, things senior PMs get wrong. The student has to think.
- Questions must draw on BOTH the professor's framework AND at least one Lenny newsletter theme
- Wrong answers must be plausible — common mistakes or reasonable-sounding traps
- No two questions should test the same concept
- Scenarios are senior-level: you're the CPO, you're advising a Series B company, you're deciding product strategy
- Explanations: 1-2 sentences that teach something, written in the professor's voice — should reveal the insight the student missed

CRITICAL:
- Never write "According to [name]..." or "[Name] believes..." — the professor IS asking
- No pure definition questions — always put it in a situation
- These are the HARDEST questions in their tower — Pass 1 was warm-up, Pass 2 is the real exam

Return a JSON array only — no markdown, no explanation, just the raw JSON:

[
  {
    "professor": "${prof.professor}",
    "domain": "${prof.domain}",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "advanced"
  }
]`;

// ─────────────────────────────────────────────────────────────────────────────
// Generation + upload functions
// ─────────────────────────────────────────────────────────────────────────────

async function generatePass2ForProfessor(prof) {
  console.log(`\n Generating Pass 2 questions for ${prof.displayName}...`);

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: PASS2_PROMPT(prof) }]
  });

  const raw = message.content[0].text.trim();
  const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  const questions = JSON.parse(jsonStr);

  console.log(`   Generated ${questions.length} questions for ${prof.displayName}`);
  return questions;
}

async function uploadToSupabase(questions) {
  const { error } = await supabase.from('questions').insert(questions);
  if (error) {
    console.error('Supabase upload error:', error);
    return false;
  }
  console.log(`   Uploaded ${questions.length} questions to Supabase`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes('--all');
  const profArg = args.find((_, i) => args[i - 1] === '--prof');

  let toRun;
  if (runAll) {
    toRun = PROFESSORS;
    console.log(`Running Pass 2 generation for all ${PROFESSORS.length} professors...`);
  } else if (profArg) {
    toRun = PROFESSORS.filter(p => p.professor.includes(profArg.toLowerCase()));
    if (toRun.length === 0) {
      console.error(`No professor found matching: ${profArg}`);
      process.exit(1);
    }
  } else {
    // Default: test with gibson_biddle only
    toRun = [PROFESSORS.find(p => p.professor === 'gibson_biddle')];
    console.log('TEST MODE: generating for Gibson Biddle only. Use --all for all professors.');
  }

  let totalQuestions = 0;

  for (const prof of toRun) {
    try {
      const questions = await generatePass2ForProfessor(prof);
      await uploadToSupabase(questions);
      totalQuestions += questions.length;

      // Small delay between professors to avoid rate limiting
      if (toRun.indexOf(prof) < toRun.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`Failed for ${prof.displayName}:`, err.message);
    }
  }

  console.log(`\nDone! Generated and uploaded ${totalQuestions} Pass 2 questions total.`);
  console.log(`Target: ${toRun.length * 9} questions (${toRun.length} professors × 9 questions)`);
}

main();
