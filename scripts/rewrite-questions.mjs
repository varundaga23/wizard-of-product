/**
 * One-time migration script.
 * Rewrites question text and answer options to fix AI-writing tells:
 *   1. Replace em dash overuse with varied punctuation
 *   2. Vary answer option lengths (correct isn't always the longest)
 *   3. Break uniform "You're X and Y. What do you do?" scenario structure
 *   4. Remove repeated AI phrases: "connective tissue", "table stakes", etc.
 *   5. Remove hedging qualifiers that signal the correct answer
 *
 * Run dry-run first (prints 5 samples, no DB writes):
 *   node --env-file=.env scripts/rewrite-questions.mjs --dry-run
 *
 * Full migration:
 *   node --env-file=.env scripts/rewrite-questions.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 5;
const DELAY_MS = 500;
const DRY_RUN_LIMIT = 5;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are rewriting product management quiz questions to sound like they were written by a sharp human editor, not AI.

Rules:
1. Em dashes: Replace "X — Y" constructions with varied alternatives (period, colon, comma, or restructure the sentence). Use em dashes sparingly — at most once per question or option, only when genuinely the best choice.
2. Answer length: Do NOT always make the correct answer the longest. Vary lengths naturally. Sometimes the correct answer should be short and direct. Sometimes a wrong answer should be long and plausible-sounding.
3. Scenario structure: Vary the opening. Not every question needs "You're [role] and [situation]. What do you do?" Try direct situations, past tense, team perspectives, or just the scenario itself.
4. Overused phrases to replace or remove: "connective tissue", "table stakes", "upstream thinking", "first principles", "move the needle", "north star". Use alternatives or restructure.
5. Remove hedging qualifiers at the start of options: "likely", "often", "typically", "generally" — these signal the nuanced correct answer before the player thinks. Cut them or restructure.
6. Preserve meaning exactly. Do not change what the correct answer IS or what each option argues. Only change how it's written.
7. Keep the same A./B./C./D. prefix format on each option.
8. Keep the difficulty and PM domain intent intact.

Return ONLY valid JSON in this exact shape — no explanation, no markdown:
{
  "question": "rewritten question text",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "best_distractor": "full text of the best wrong option (no letter prefix)"
}`;

async function rewriteQuestion(q) {
  const prompt = `Rewrite this quiz question following the rules.

Original question: ${q.question}

Options:
${q.options.join('\n')}

Correct answer letter: ${q.correct_answer}
Current best distractor: ${q.best_distractor ?? '(none)'}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no writes to Supabase\n' : '🚀 FULL MIGRATION — writing to Supabase\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, professor, question, options, correct_answer, best_distractor')
    .order('id');

  if (error) { console.error('Supabase fetch error:', error); process.exit(1); }
  console.log(`Fetched ${questions.length} questions\n`);

  const toProcess = DRY_RUN ? questions.slice(0, DRY_RUN_LIMIT) : questions;
  let updated = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    for (const q of batch) {
      try {
        const rewritten = await rewriteQuestion(q);

        if (DRY_RUN) {
          console.log(`─── Question ${q.id} (${q.professor}) ───`);
          console.log('BEFORE:', q.question);
          console.log('AFTER: ', rewritten.question);
          console.log('\nBEFORE options:');
          q.options.forEach(o => console.log(' ', o));
          console.log('AFTER options:');
          rewritten.options.forEach(o => console.log(' ', o));
          console.log('\nBEFORE distractor:', q.best_distractor);
          console.log('AFTER distractor: ', rewritten.best_distractor);
          console.log();
        } else {
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question: rewritten.question,
              options: rewritten.options,
              best_distractor: rewritten.best_distractor,
            })
            .eq('id', q.id);

          if (updateError) {
            console.error(`  ✗ Failed ${q.id}:`, updateError.message);
            failed++;
          } else {
            updated++;
            if (updated % 25 === 0) console.log(`  ✓ ${updated}/${toProcess.length} updated...`);
          }
        }

        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ✗ Error on question ${q.id}:`, err.message);
        failed++;
      }
    }
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete. Reviewed ${toProcess.length} questions.`);
    console.log('If the rewrites look good, run without --dry-run to migrate all questions.');
  } else {
    console.log(`\nMigration complete. Updated: ${updated}, Failed: ${failed}`);
  }
}

main();
