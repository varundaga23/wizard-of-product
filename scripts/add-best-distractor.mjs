/**
 * One-time migration script.
 * Reads all questions from Supabase, uses Claude to pick the best distractor
 * (most plausible wrong answer for an experienced PM), and writes it back
 * to the best_distractor column.
 *
 * Run: node --env-file=.env scripts/add-best-distractor.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY);

// How many ms to wait between API calls (avoid rate limits)
const DELAY_MS = 300;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pickBestDistractor(question) {
  const { question: q, options, correct_answer } = question;

  // Separate correct option and wrong options
  const correctLetter = correct_answer.trim();
  const wrongOptions = options.filter(o => !o.startsWith(correctLetter + '.') && !o.startsWith(correctLetter + ' '));

  if (wrongOptions.length === 0) {
    console.warn(`  ⚠ No wrong options found for question ${question.id}`);
    return null;
  }

  const prompt = `You are helping design a product management quiz game.

Question: "${q}"

Correct answer: "${options.find(o => o.startsWith(correctLetter))}"

Wrong options (pick the BEST one):
${wrongOptions.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Which wrong option would a smart, experienced product manager be MOST likely to mistakenly choose? Pick the one that sounds most credible and defensible — the best distractor.

Reply with ONLY the full text of the best wrong option, exactly as written above. No explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

async function main() {
  console.log('Fetching all questions...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, professor, question, options, correct_answer, best_distractor')
    .is('best_distractor', null) // Only process rows not yet filled
    .order('professor');

  if (error) {
    console.error('Supabase fetch failed:', error.message);
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions needing best_distractor\n`);

  let done = 0;
  let failed = 0;

  for (const q of questions) {
    try {
      const distractor = await pickBestDistractor(q);

      if (!distractor) {
        failed++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('questions')
        .update({ best_distractor: distractor })
        .eq('id', q.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${q.id}: ${updateError.message}`);
        failed++;
      } else {
        done++;
        process.stdout.write(`\r  ✓ ${done}/${questions.length} done  (${q.professor})`);
      }
    } catch (err) {
      console.error(`\n  ❌ Error on ${q.id}: ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nDone. ${done} updated, ${failed} failed.`);

  if (failed > 0) {
    console.log('Re-run the script to retry failed rows (it skips already-filled ones).');
  }
}

main();
