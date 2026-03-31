/**
 * Wizard of Product — Question Generation Script
 *
 * Generates 15-20 quiz questions per boss using Claude API,
 * then loads them into Supabase.
 *
 * Usage:
 *   node scripts/generate-questions.mjs              (test with Lenny only)
 *   node scripts/generate-questions.mjs --all        (all 12 bosses)
 *   node scripts/generate-questions.mjs --boss lenny (specific boss)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Boss roster
const BOSSES = [
  // PM Tower
  {
    professor: 'gibson_biddle',
    displayName: 'Gibson Biddle',
    domain: 'pm',
    wizardTitle: 'The DHM Keeper',
    sourceSummary: `Gibson Biddle is a former VP of Product at Netflix and CPO at Chegg, now an advisor and speaker (from Lenny's Podcast).
    Key themes: the DHM model (Delight customers in Hard-to-copy, Margin-enhancing ways) as the foundation of product strategy,
    the GEM roadmap (Growth, Engagement, Monetisation) for prioritisation,
    how to test product strategy with proxy metrics,
    the difference between product strategy and product roadmap,
    how to build a product strategy that survives leadership changes,
    how Netflix used DHM to make product decisions,
    why delighting customers is not enough if it's easy to copy,
    how to think about margin when building consumer products,
    the role of experiments in validating strategy.`
  },
  {
    professor: 'jules_walter',
    displayName: 'Jules Walter',
    domain: 'pm',
    wizardTitle: 'The Influence Enchanter',
    sourceSummary: `Jules Walter is a product leader and guest author for Lenny's Newsletter, known for writing on product sense and influence.
    Key themes: how to develop product sense — four concrete practices (read broadly, use products obsessively, debrief product decisions, get feedback from trusted peers),
    the difference between product sense and product knowledge,
    why product sense is the hardest PM skill to develop and the most important,
    a PM's guide to influence — five tactics for influencing without authority,
    how to build trust with engineers and designers as a PM,
    the difference between influence and manipulation,
    how to get alignment without having positional power,
    how to navigate disagreement with senior stakeholders,
    the role of storytelling in PM influence.`
  },
  {
    professor: 'lenny_rachitsky',
    displayName: 'Lenny Rachitsky',
    domain: 'pm',
    wizardTitle: 'The Keeper of Product Lore',
    sourceSummary: `Lenny Rachitsky is a former Airbnb PM and growth lead, now running the most widely-read product newsletter and podcast.
    Key themes: product-market fit, growth loops, retention, building great product teams, career growth for PMs,
    how to run great 1:1s, roadmap prioritisation, how to say no, metrics that matter,
    the difference between output and outcome, working with engineers, the role of a PM vs. engineer vs. designer.`
  },
  {
    professor: 'shreyas_doshi',
    displayName: 'Shreyas Doshi',
    domain: 'pm',
    wizardTitle: 'Master of Strategic Spells',
    sourceSummary: `Shreyas Doshi is a former PM at Stripe, Twitter, Google, and Yahoo.
    Key themes: the LNO framework (leverage/neutral/overhead tasks), upstream thinking vs. downstream thinking,
    the three traps of experienced PMs, pre-mortem thinking, how great PMs think about strategy,
    product sense, the difference between output metrics and outcome metrics, how to influence without authority.`
  },
  {
    professor: 'julie_zhuo',
    displayName: 'Julie Zhuo',
    domain: 'pm',
    wizardTitle: 'Enchantress of Design & Leadership',
    sourceSummary: `Julie Zhuo is the former VP of Product Design at Facebook and author of The Making of a Manager.
    Key themes: what makes a great manager, giving feedback, hiring, the difference between a great manager and a mediocre one,
    design thinking, how to run great design reviews, building trust with your team,
    the role of design in product, how to develop product intuition.`
  },
  {
    professor: 'marty_cagan',
    displayName: 'Marty Cagan',
    domain: 'pm',
    wizardTitle: 'The Ancient Sage of Product',
    sourceSummary: `Marty Cagan is the founder of SVPG and author of Inspired, Empowered, and Transformed.
    Key themes: product discovery vs. delivery, outcome vs. output, empowered product teams,
    the difference between feature teams and product teams, continuous discovery,
    the four big risks (value, usability, feasibility, viability), OKRs for product teams,
    what great product management looks like.`
  },
  {
    professor: 'teresa_torres',
    displayName: 'Teresa Torres',
    domain: 'pm',
    wizardTitle: 'Oracle of Discovery',
    sourceSummary: `Teresa Torres is a product discovery coach and author of Continuous Discovery Habits.
    Key themes: opportunity solution trees, continuous discovery, weekly customer interviews,
    assumption testing, the difference between discovery and delivery,
    how to identify the right opportunities, how to run assumption tests quickly,
    story mapping, how to connect customer outcomes to business outcomes.`
  },
  {
    professor: 'april_dunford',
    displayName: 'April Dunford',
    domain: 'pm',
    wizardTitle: 'The Positioning Sage',
    sourceSummary: `April Dunford is a positioning expert and author of Obviously Awesome, interviewed on Lenny's Podcast and a newsletter contributor.
    Key themes: positioning as the foundation of all GTM decisions — what it is, why it matters, and why most companies do it wrong,
    the five components of positioning (competitive alternatives, unique attributes, value for customers, target customer profile, market category),
    how to run a positioning exercise with your team,
    the difference between positioning and messaging,
    how bad positioning kills good products,
    how to build a killer sales pitch from your positioning,
    why 'we have no competitors' is always wrong,
    how to choose the right market category,
    how positioning changes when you move upmarket or into enterprise,
    the link between positioning and pricing.`
  },
  // Strategy Tower
  {
    professor: 'chandra_janakiraman',
    displayName: 'Chandra Janakiraman',
    domain: 'strategy',
    wizardTitle: 'The Strategy Blocks Sage',
    sourceSummary: `Chandra Janakiraman is a product and strategy leader featured on Lenny's Podcast and newsletter, known for the Strategy Blocks framework.
    Key themes: the Strategy Blocks 5-step framework (market insight → strategic bets → must-win battles → initiatives → metrics),
    why most product strategies fail — they're lists of initiatives, not real strategies,
    the difference between strategy and a roadmap,
    how to sequence strategic bets — why order matters,
    how to identify must-win battles vs. nice-to-have initiatives,
    how to connect day-to-day product work to company strategy,
    how to run a strategy process with a cross-functional team,
    the role of market insight in strategy — starting from outside-in,
    how to know when your strategy is working.`
  },
  {
    professor: 'christopher_lochhead',
    displayName: 'Christopher Lochhead',
    domain: 'strategy',
    wizardTitle: 'The Category Pirate',
    sourceSummary: `Christopher Lochhead is a category design pioneer, co-author of Play Bigger, and host of the Follow Your Different podcast (from Lenny's Podcast).
    Key themes: category design — the idea that legendary companies don't compete in categories, they create them,
    the difference between playing to win vs. playing to compete,
    why competing in existing categories is a trap,
    how to design a new category and make yourself the obvious leader of it,
    the concept of 'category POV' — a point of view on how the world should be different,
    how to use language and framing to define a category,
    why most marketing is wasted because it competes rather than creates,
    how Salesforce, Uber, and Airbnb designed their categories,
    the role of the 'lightning strike' moment in category creation.`
  },
  {
    professor: 'ben_thompson',
    displayName: 'Ben Thompson',
    domain: 'strategy',
    wizardTitle: 'Oracle of Business Strategy',
    sourceSummary: `Ben Thompson writes Stratechery, the definitive tech business strategy newsletter.
    Key themes: aggregation theory (how internet companies aggregate demand and disintermediate suppliers),
    the difference between platforms and aggregators, bundling and unbundling,
    why Google/Facebook/Amazon won, network effects vs. scale economies,
    how to think about moats for digital businesses, the media business model,
    vertical integration vs. horizontal integration.`
  },
  {
    professor: 'benedict_evans',
    displayName: 'Benedict Evans',
    domain: 'strategy',
    wizardTitle: 'Seer of Big Picture Tech',
    sourceSummary: `Benedict Evans is a tech analyst known for big-picture frameworks about where technology is going.
    Key themes: technology adoption S-curves, how mobile changed everything,
    the end of the PC era, retail disruption, autonomous vehicles,
    how to think about where we are in a technology cycle,
    what questions to ask when evaluating a new technology trend, the future of TV and media.`
  },
  {
    professor: 'hamilton_helmer',
    displayName: 'Hamilton Helmer',
    domain: 'strategy',
    wizardTitle: 'Master of the 7 Powers',
    sourceSummary: `Hamilton Helmer is the author of 7 Powers: The Foundations of Business Strategy.
    Key themes: the 7 powers (scale economies, network economies, counter-positioning, switching costs,
    branding, cornered resource, process power), the difference between strategy and operational excellence,
    power vs. competitive advantage, how to evaluate whether a business has durable power,
    when to pursue which type of power, the role of invention in strategy.`
  },
  {
    professor: 'roger_martin',
    displayName: 'Roger Martin',
    domain: 'strategy',
    wizardTitle: 'Wizard of Winning Choices',
    sourceSummary: `Roger Martin is a strategy professor and author of Playing to Win.
    Key themes: strategy as a set of integrated choices (winning aspiration, where to play, how to win,
    capabilities, management systems), the difference between strategy and planning,
    why most strategies fail, how to make and test strategic choices,
    the role of logic in strategy, reverse engineering competitor strategy.`
  },
  {
    professor: 'marc_andreessen',
    displayName: 'Marc Andreessen',
    domain: 'strategy',
    wizardTitle: 'The Contrarian Archmage',
    sourceSummary: `Marc Andreessen is co-founder of a16z and one of the most influential voices in tech strategy.
    Key themes: software eating the world, the pmarca guide to startups, product-market fit,
    how to think about technology cycles, the role of contrarianism in investing,
    why most startups fail, the importance of timing, network effects,
    how to evaluate whether a market is big enough.`
  },
  // AI Tower
  {
    professor: 'aman_khan',
    displayName: 'Aman Khan',
    domain: 'ai',
    wizardTitle: 'The Eval Conjurer',
    sourceSummary: `Aman Khan is a product leader and author of 'Beyond vibe checks: A PM's complete guide to evals' for Lenny's Newsletter.
    Key themes: why 'vibe checks' (informal gut-feel testing) are not evals and why they fail at scale,
    what a real eval is — a repeatable, measurable test of AI output quality,
    the four types of evals PMs need to know (human evals, automated evals, LLM-as-judge, unit tests),
    how to design evals before building the AI feature — not after,
    what a good eval dataset looks like — coverage, edge cases, representative samples,
    how to measure hallucination, relevance, and task completion,
    the difference between offline evals (pre-launch) and online evals (production monitoring),
    how to use evals to make go/no-go decisions on AI features,
    why PMs who can write evals are more valuable than PMs who can only write PRDs,
    how to build an eval culture on an AI product team.`
  },
  {
    professor: 'claire_vo',
    displayName: 'Claire Vo',
    domain: 'ai',
    wizardTitle: 'Conjurer of Agentic Arts',
    sourceSummary: `Claire Vo is a product leader specialising in agentic AI and AI-native products.
    Key themes: what makes a product truly AI-native vs. AI-assisted,
    designing for agentic workflows, human-in-the-loop design patterns,
    how to evaluate AI product quality, the difference between automation and augmentation,
    when to use AI agents vs. simpler AI features, product management for AI teams.`
  },
  {
    professor: 'hamel_husain',
    displayName: 'Hamel Husain',
    domain: 'ai',
    wizardTitle: 'The Grand Evaluator',
    sourceSummary: `Hamel Husain is an AI engineer and educator known for his work on LLM evaluations (from Lenny's Podcast and newsletter).
    Key themes: what is an eval, why evals matter, how to design good evals,
    the difference between automated evals and human evals, how to evaluate when there's no ground truth,
    LLM-as-judge, how to detect hallucination, building eval pipelines,
    the difference between unit tests and evals, how to use evals to improve prompts.`
  },
  {
    professor: 'tal_raviv',
    displayName: 'Tal Raviv',
    domain: 'ai',
    wizardTitle: 'Wizard of Modern Product Tools',
    sourceSummary: `Tal Raviv is a product leader known for his thinking on AI tools and modern product work (from Lenny's Podcast and newsletter).
    Key themes: using AI tools for product work, how to write better PRDs with AI,
    the role of documentation in AI-era product teams, using Claude/LLMs for product thinking,
    async communication for product teams, how to use AI agents in your product workflow,
    the difference between AI-assisted and AI-native product work, prompting as a product skill.`
  },
  {
    professor: 'fei_fei_li',
    displayName: 'Dr. Fei-Fei Li',
    domain: 'ai',
    wizardTitle: 'The Godmother of Intelligence',
    sourceSummary: `Dr. Fei-Fei Li is a Stanford AI professor, co-director of the Stanford Human-Centered AI Institute, and pioneer of ImageNet (from Lenny's Podcast: "The Godmother of AI on jobs, robots & why world models are next").
    Key themes: what world models are and why they matter, AI's impact on jobs and the workforce,
    the difference between narrow AI and general intelligence, why spatial intelligence is the next frontier,
    how to think about AI as a product leader — augmentation vs. replacement,
    the importance of human-centred AI, AI safety and responsibility,
    how to evaluate whether AI is actually creating value vs. hype.`
  },
  {
    professor: 'chip_huyen',
    displayName: 'Chip Huyen',
    domain: 'ai',
    wizardTitle: 'The Architect of AI Systems',
    sourceSummary: `Chip Huyen is an AI engineer, author, and educator who has worked at Nvidia, Netflix, and Stanford (from Lenny's Podcast: "AI Engineering 101").
    Key themes: the difference between ML engineering and AI engineering,
    how to think about latency, cost, and quality trade-offs in AI systems,
    when to use RAG vs. fine-tuning vs. prompting, how to evaluate AI systems,
    the AI engineering stack (data, models, serving, monitoring),
    how product teams should think about building on top of foundation models,
    common failure modes of AI products in production, streaming vs. batch inference.`
  },
  {
    professor: 'nick_turley',
    displayName: 'Nick Turley',
    domain: 'ai',
    wizardTitle: 'Keeper of the Speaking Crystal',
    sourceSummary: `Nick Turley is the Head of Product at ChatGPT, OpenAI — responsible for the fastest-growing product in history (from Lenny's Podcast: "Inside ChatGPT").
    Key themes: how to build AI products at massive scale, the unique challenges of AI product management,
    how user trust is built and lost in AI products, designing for AI uncertainty and hallucination,
    how to think about AI product roadmaps when the underlying model keeps changing,
    the difference between building a feature and building an AI product,
    how ChatGPT decides what to build next, AI product metrics that matter,
    how to handle AI safety in a product context.`
  },
  // Final Boss — not a tower professor
  {
    professor: 'lenny_final_boss',
    displayName: 'Lenny Rachitsky',
    domain: 'final',
    wizardTitle: 'The Keeper of Product Lore',
    sourceSummary: `Lenny Rachitsky is the Keeper of Product Lore — the final boss of Wizard of Product. This duel is the hardest in the game. Questions synthesise across all three towers: PM, Strategy, and AI.
    PM domain: North Star metrics, RICE prioritisation, product-market fit, outcome vs. output, continuous discovery, empowered teams, product sense, roadmap prioritisation, how to say no.
    Strategy domain: aggregation theory, 7 Powers (scale economies, network effects, counter-positioning, switching costs, branding, cornered resource, process power), playing to win (where to play / how to win), technology S-curves, software eating the world, platform vs. aggregator, PMF, moats for digital businesses.
    AI domain: AI engineering fundamentals, evals and LLM-as-judge, agentic product design (human-in-the-loop, low-downside thinking), world models and spatial intelligence, AI product metrics, building on foundation models, when to use RAG vs. fine-tuning vs. prompting, AI safety in a product context.
    Cross-domain synthesis: the student must connect frameworks across all three towers — e.g., how a North Star metric shapes an AI eval strategy, when a 7 Powers moat applies to an AI product, how agentic thinking intersects with continuous discovery.`,
  },
];

const FINAL_BOSS_PROMPT = (sourceSummary) => `You are writing the final duel questions for "Wizard of Product" — a browser RPG set in a magic academy. The player has defeated all 15 professors across three towers and now faces Lenny Rachitsky, The Keeper of Product Lore. This is the hardest duel in the game.

The player stands before Lenny in the great hall. Lenny speaks directly to them — weary of easy answers and ready to test true mastery. These are not professor-class questions. These are the Keeper's questions.

Source material spanning all three domains:
${sourceSummary}

Generate exactly 10 questions. ALL 10 must be ADVANCED difficulty. Follow these rules:

TONE & VOICE:
- Lenny speaks directly to the student — measured, knowing, a little bit legendary
- Questions feel like the final exam of a lifetime — the student is being tested on synthesis, not recall
- Never say "Lenny" in the question text — he is the one asking
- The world is a magic academy — occasional wizard metaphors welcome but don't force it

QUESTION QUALITY:
- Every question must require synthesis across two or more domains (PM + Strategy, Strategy + AI, AI + PM, or all three)
- No single-domain questions — that was for the tower professors
- Scenarios are senior-level: you're the CPO, you're advising a Series B company, you're deciding roadmap for an AI product at scale
- Wrong answers must be genuinely tempting — things a smart PM would say without the full picture
- Explanations: 2 sentences that reveal something the student didn't quite see. Keeper's voice — warm but exacting.
- Questions should feel like they could only come from someone who has read and synthesised ALL of Lenny's archive

CRITICAL:
- Never write "According to Lenny..." or "Lenny believes..." — he IS asking
- No pure definition questions — always a real scenario, real stakes, real trade-off
- The student should feel the weight of this question. Each one should be the hardest question from its domain-combo

Return a JSON array only — no markdown, no explanation, just the raw JSON:

[
  {
    "professor": "lenny_final_boss",
    "domain": "final",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "advanced"
  }
]`;

const QUESTION_PROMPT = (boss, sourceSummary) => `You are writing quiz questions for "Wizard of Product" — a browser RPG set in a magic academy where product manager apprentices attend classes taught by Grand Wizard professors.

The player is sitting in ${boss.displayName}'s class (${boss.wizardTitle}). The professor is testing them. Questions should feel like a wise, demanding professor grilling a student — not a trivia quiz or a textbook.

The professor being portrayed: ${boss.displayName}
Their domain: ${boss.domain.toUpperCase()}
Their source material and core ideas:
${sourceSummary}

Generate exactly 18 questions. Follow these rules:

TONE & VOICE:
- Questions are spoken from the professor's chair to the student — direct, challenging, a little theatrical
- Never refer to the professor by name in the question text (they are the one asking)
- Avoid dry definitions ("What is X?") — prefer scenario challenges, trade-offs, and "what would you do?" situations
- Advanced questions should feel like the professor is genuinely trying to catch the student out
- The world is a magic academy — occasional wizard metaphors are welcome ("You're about to cast a growth spell...") but don't force it

QUESTION QUALITY:
- 9 BASIC: Test understanding of core concepts through scenarios, not definitions. A junior PM should be able to reason to the answer.
- 9 ADVANCED: Real trade-offs, uncomfortable choices, things senior PMs get wrong. No obvious correct answer — the student has to think.
- Draw from THIS professor's specific frameworks, mental models, and ideas — not generic PM advice that could come from anyone
- Wrong answers must be plausible — common mistakes or reasonable-sounding traps
- Explanations: 1-2 sentences that teach something, written in the professor's voice

CRITICAL:
- Never write "According to [name]..." or "[Name] believes..." — the professor IS asking
- No pure definition questions ("What does X mean?") — always put it in a situation

Return a JSON array only — no markdown, no explanation, just the raw JSON:

[
  {
    "professor": "${boss.professor}",
    "domain": "${boss.domain}",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "basic"
  }
]`;

async function generateQuestionsForBoss(boss) {
  console.log(`\n Generating questions for ${boss.displayName}${boss.professor === 'lenny_final_boss' ? ' (FINAL BOSS)' : ''}...`);

  const prompt = boss.professor === 'lenny_final_boss'
    ? FINAL_BOSS_PROMPT(boss.sourceSummary)
    : QUESTION_PROMPT(boss, boss.sourceSummary);

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const raw = message.content[0].text.trim();

  // Parse JSON — strip any accidental markdown fences
  const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  const questions = JSON.parse(jsonStr);

  console.log(`   Generated ${questions.length} questions for ${boss.displayName}`);
  return questions;
}

async function uploadToSupabase(questions) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questions);

  if (error) {
    console.error('Supabase upload error:', error);
    return false;
  }
  console.log(`   Uploaded ${questions.length} questions to Supabase`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes('--all');
  const bossArg = args.find((_, i) => args[i - 1] === '--boss');

  let bossesToRun;
  if (runAll) {
    bossesToRun = BOSSES;
    console.log('Running full question generation for all 13 bosses...');
  } else if (bossArg) {
    bossesToRun = BOSSES.filter(b => b.professor.includes(bossArg.toLowerCase()));
    if (bossesToRun.length === 0) {
      console.error(`No boss found matching: ${bossArg}`);
      process.exit(1);
    }
  } else {
    // Default: test with Lenny only
    bossesToRun = [BOSSES[0]];
    console.log('TEST MODE: generating for Lenny Rachitsky only. Use --all for all bosses.');
  }

  let totalQuestions = 0;

  for (const boss of bossesToRun) {
    try {
      const questions = await generateQuestionsForBoss(boss);
      await uploadToSupabase(questions);
      totalQuestions += questions.length;

      // Small delay between bosses to avoid rate limiting
      if (bossesToRun.indexOf(boss) < bossesToRun.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error(`Failed for ${boss.displayName}:`, err.message);
    }
  }

  console.log(`\nDone! Generated and uploaded ${totalQuestions} questions total.`);
}

main();
