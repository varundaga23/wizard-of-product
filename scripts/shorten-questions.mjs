/**
 * One-time migration script.
 * Shortens question text and answer options while preserving full meaning.
 * Target: questions ≤ 180 chars, options ≤ 120 chars each.
 * Questions already short enough (≤ 180 chars) are skipped.
 *
 * Dry-run (prints 8 samples, no DB writes):
 *   node --env-file=.env scripts/shorten-questions.mjs --dry-run
 *
 * Full migration:
 *   node --env-file=.env scripts/shorten-questions.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 5;
const DELAY_MS = 400;
const DRY_RUN_LIMIT = 8;
const Q_TARGET = 240;   // max question chars
const OPT_TARGET = 120; // max option chars

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are editing product management quiz questions to be shorter and punchier — like a sharp human editor cutting filler without losing meaning.

Rules:
1. SHORTEN. Target: question ≤ 240 characters, each answer option ≤ 130 characters.
2. Cut setup fluff. "You're a PM at a growth-stage startup and your team has just discovered that..." → just get to the situation.
3. Cut redundant context. If the scenario can be understood without a detail, remove it. BUT: never remove context that frames how to think about the question or what angle to apply — only cut scene-setting that doesn't affect the answer.
4. Keep the core dilemma intact. The question must still make sense and be answerable.
5. Never misrepresent numbers or facts from the original. If the original says "five battles", do not write "two battles".
6. Keep options distinct. Each option must still argue a genuinely different position.
6. Do NOT change what the correct answer IS. Do not change the meaning of any option.
7. Do NOT add new content — only cut and tighten existing content.
8. Keep the same A./B./C./D. prefix format on each option.
9. Preserve the best_distractor as the full text of the best wrong option (no letter prefix).

Return ONLY valid JSON — no explanation, no markdown:
{
  "question": "shortened question text",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "best_distractor": "full text of the best wrong option (no letter prefix)"
}`;

async function shortenQuestion(q) {
  const prompt = `Shorten this quiz question following the rules. Current length: ${q.question.length} chars.

Question: ${q.question}

Options:
${q.options.join('\n')}

Correct answer letter: ${q.correct_answer}
Current best distractor: ${q.best_distractor ?? '(none)'}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim().replace(/^```json\s*/,'').replace(/```\s*$/,'');
  return JSON.parse(raw);
}

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no writes to Supabase\n' : '🚀 FULL MIGRATION — writing to Supabase\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, professor, question, options, correct_answer, best_distractor')
    .order('id');

  if (error) { console.error('Supabase fetch error:', error); process.exit(1); }

  // Only process questions that are too long
  const toShorten = questions.filter(q => q.question.length > Q_TARGET);
  console.log(`Total questions: ${questions.length}`);
  console.log(`Need shortening (> ${Q_TARGET} chars): ${toShorten.length}`);
  console.log(`Already short enough: ${questions.length - toShorten.length}\n`);

  const toProcess = DRY_RUN ? toShorten.slice(0, DRY_RUN_LIMIT) : toShorten;
  let updated = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    for (const q of batch) {
      try {
        const shortened = await shortenQuestion(q);

        if (DRY_RUN) {
          console.log(`─── Q ${q.id} (${q.professor}) — ${q.question.length} → ${shortened.question.length} chars ───`);
          console.log('BEFORE:', q.question);
          console.log('AFTER: ', shortened.question);
          const maxOptBefore = Math.max(...q.options.map(o => o.length));
          const maxOptAfter = Math.max(...shortened.options.map(o => o.length));
          console.log(`Option lengths: ${maxOptBefore} → ${maxOptAfter} chars (max)`);
          console.log();
        } else {
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question: shortened.question,
              options: shortened.options,
              best_distractor: shortened.best_distractor,
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
    console.log(`Dry run complete. Reviewed ${toProcess.length} questions.`);
    console.log('If the rewrites look good, run without --dry-run to migrate all questions.');
  } else {
    console.log(`\nMigration complete. Updated: ${updated}, Failed: ${failed}`);
  }
}

main();
