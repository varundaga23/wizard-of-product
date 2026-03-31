/**
 * Wizard of Product — Oracle's Rite Dilemma Generation Script
 *
 * Generates 5 archetype-sorting dilemmas for the Oracle's Rite.
 * These have NO correct answer — only a pattern that reveals the player's PM archetype:
 *   - Visionary (🔮): Big picture, intuition-driven, strong on strategy
 *   - Mastermind (🧠): Data-driven, rigorous, framework-first
 *   - Builder (🔨): Execution-focused, scrappy, ships first
 *
 * Usage:
 *   node scripts/generate-oracle-dilemmas.mjs
 *
 * The oracle_dilemmas table must exist in Supabase:
 *   CREATE TABLE oracle_dilemmas (
 *     id serial PRIMARY KEY,
 *     position integer NOT NULL,    -- 1-5, display order
 *     question text NOT NULL,
 *     options jsonb NOT NULL,       -- array of {letter, text, archetype}
 *     codex_flavour text            -- optional flavour text from the Codex Oracle
 *   );
 *   ALTER TABLE oracle_dilemmas ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Public read oracle_dilemmas" ON oracle_dilemmas FOR SELECT USING (true);
 *   CREATE POLICY "Service insert oracle_dilemmas" ON oracle_dilemmas FOR INSERT WITH CHECK (true);
 *   CREATE POLICY "Service delete oracle_dilemmas" ON oracle_dilemmas FOR DELETE USING (true);
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const ORACLE_PROMPT = `You are writing the Oracle's Rite for "Wizard of Product" — a browser RPG set in a magic academy. When a new student arrives at The Arcane Institute, the Codex Oracle — an ancient animated tome — poses five real product dilemmas to sort them into one of three archetypes.

The Codex Oracle does not ask you to choose. It watches how you think. There is no right answer. There is only the pattern.

The three archetypes:
- 🔮 VISIONARY: Big picture, intuition-driven. Asks about the long horizon, the why, the market forces. Sees the forest not the trees. Strong on strategy and vision.
- 🧠 MASTERMIND: Data-driven, rigorous, framework-first. Reaches for evidence, metrics, structured analysis before deciding. Wants the numbers before the narrative.
- 🔨 BUILDER: Execution-focused, scrappy. Asks what can ship this week. Thinks in prototypes, MVPs, tests. Learns by doing, not by deliberating.

Generate exactly 5 dilemmas. Follow these rules:

TONE & VOICE:
- The Codex Oracle speaks in an ancient, slightly theatrical voice — gravitas, not pomposity
- Scenarios are real product situations that PMs at all levels recognise instantly
- The dilemma is written as a scenario + a direct question: "What do you do first?" / "Which do you reach for?" / "What is your instinct?"
- Each dilemma should feel genuinely hard — no obviously correct answer

DILEMMA QUALITY:
- Cover a range of PM situations: a metric drop, a strategy decision, a team disagreement, a build vs. buy choice, a launch decision
- Each scenario must be concrete and specific — not abstract
- The four options must feel genuinely different and equally valid on the surface
- Each option maps clearly to one archetype: one Visionary, one Mastermind, one Builder, plus one distractor/decoy that the Oracle uses but does not sort on
- The decoy should be the "safe but not revealing" answer — the kind of thing you say in an interview but doesn't reveal how you actually think

OPTIONS FORMAT:
- Exactly 4 options per dilemma (A, B, C, D)
- One option maps to VISIONARY, one to MASTERMIND, one to BUILDER, one is DECOY
- Option text is concrete action: "Pull up the cohort breakdown and identify where the drop is steepest" not "investigate the data"
- Options should be 10-20 words each — crisp, direct, first-person instinct
- Do not use the archetype words anywhere in the options — the mapping must be subtle

CODEX FLAVOUR:
- Each dilemma has a one-line Codex Oracle flavour text — spoken before the question, sets the scene
- Ancient, slightly ominous. E.g.: "The ancient tome stirs. A student has made a decision. Let us see what it reveals."

Return a JSON array only — no markdown, no explanation, just the raw JSON:

[
  {
    "position": 1,
    "question": "...",
    "codex_flavour": "...",
    "options": [
      { "letter": "A", "text": "...", "archetype": "VISIONARY" },
      { "letter": "B", "text": "...", "archetype": "MASTERMIND" },
      { "letter": "C", "text": "...", "archetype": "BUILDER" },
      { "letter": "D", "text": "...", "archetype": "DECOY" }
    ]
  }
]`;

async function generateOracleDilemmas() {
  console.log('\n Generating Oracle\'s Rite dilemmas...');

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: ORACLE_PROMPT
      }
    ]
  });

  const raw = message.content[0].text.trim();
  const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  const dilemmas = JSON.parse(jsonStr);

  console.log(`   Generated ${dilemmas.length} Oracle dilemmas`);
  return dilemmas;
}

async function uploadToSupabase(dilemmas) {
  const { error } = await supabase
    .from('oracle_dilemmas')
    .insert(dilemmas);

  if (error) {
    console.error('Supabase upload error:', error);
    return false;
  }
  console.log(`   Uploaded ${dilemmas.length} dilemmas to Supabase`);
  return true;
}

async function main() {
  try {
    const dilemmas = await generateOracleDilemmas();

    // Print for review
    console.log('\n--- ORACLE DILEMMAS PREVIEW ---\n');
    dilemmas.forEach(d => {
      console.log(`[${d.position}] ${d.codex_flavour}`);
      console.log(`    ${d.question}`);
      d.options.forEach(o => {
        console.log(`    ${o.letter}. [${o.archetype}] ${o.text}`);
      });
      console.log('');
    });

    await uploadToSupabase(dilemmas);
    console.log('\nDone! Oracle\'s Rite dilemmas generated and uploaded.');
    console.log('\nReminder: Create oracle_dilemmas table in Supabase first if it doesn\'t exist.');
    console.log('SQL in script header comments above.');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

main();
