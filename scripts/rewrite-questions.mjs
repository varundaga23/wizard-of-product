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

const SYSTEM_PROMPT = `You are rewriting product management quiz questions for a game called Spellcraft. The goal is to make every question feel like a high-stakes real moment, not an exam or a form.

QUESTION STEM rules:
1. Never include the professor's name in the question stem.
2. Drop the "You're a PM at [company] and [situation]. What do you do?" template. Instead open with the situation directly — short, tense, present tense where possible.
3. Keep it tight. Two to three sentences max. Cut every word that doesn't add pressure or clarity.
4. Remove overused AI phrases: "connective tissue", "table stakes", "first principles", "move the needle", "north star", "upstream thinking".
5. No hedging qualifiers: "likely", "often", "typically", "generally" — these signal the correct answer before the player thinks.

ANSWER OPTION rules:
6. Options are just the answer. No em dash followed by an explanation of why. No "X — because Y" format.
7. Keep options short and direct — one sentence or a short phrase. The player should feel the choice, not read an essay.
8. Do NOT always make the correct answer the longest. Vary lengths. Sometimes the correct answer is the short punchy one.
9. Wrong options should sound genuinely tempting, not obviously wrong.
10. Keep the same A./B./C./D. prefix format.

ALWAYS:
11. Preserve meaning exactly. Do not change what the correct answer argues. Only change how it's written.
12. Keep the difficulty and PM domain intent intact.

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

  const text = response.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
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
