import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// All expected professor keys (19 professors + lenny_oracle for final boss/blessing)
const EXPECTED_KEYS = [
  'gibson_biddle', 'julie_zhuo', 'teresa_torres', 'shreyas_doshi',
  'jules_walter', 'april_dunford', 'marty_cagan',
  'chandra_janakiraman', 'roger_martin', 'christopher_lochhead',
  'marc_andreessen', 'hamilton_helmer',
  'tal_raviv', 'aman_khan', 'claire_vo', 'nick_turley',
  'hamel_husain', 'chip_huyen', 'fei_fei_li',
  'lenny_oracle',
];

const MIN_QUESTIONS = 5;

console.log('Fetching all questions from Supabase...\n');

const { data, error } = await supabase
  .from('questions')
  .select('id, professor, question, options, correct_answer, difficulty');

if (error) {
  console.error('❌ Supabase fetch failed:', error.message);
  process.exit(1);
}

console.log(`✓ Fetched ${data.length} total questions\n`);

// Group by professor
const byProfessor = {};
for (const q of data) {
  if (!byProfessor[q.professor]) byProfessor[q.professor] = [];
  byProfessor[q.professor].push(q);
}

const keysInDB = Object.keys(byProfessor).sort();
let failures = 0;

// ── 1. Check for unexpected keys in DB (possible misattribution) ──
const unexpected = keysInDB.filter(k => !EXPECTED_KEYS.includes(k));
if (unexpected.length > 0) {
  console.log('❌ UNEXPECTED professor keys in DB (possible misattribution):');
  unexpected.forEach(k => console.log(`   - "${k}" (${byProfessor[k].length} questions)`));
  failures++;
} else {
  console.log('✓ No unexpected professor keys in DB');
}

// ── 2. Check every expected key exists and has enough questions ──
console.log('\n── Question counts per professor ──');
let countFail = false;
for (const key of EXPECTED_KEYS) {
  const qs = byProfessor[key] ?? [];
  const count = qs.length;
  const ok = count >= MIN_QUESTIONS;
  const icon = ok ? '✓' : '❌';
  console.log(`  ${icon}  ${key.padEnd(28)} ${count} questions${!ok ? ` — NEED AT LEAST ${MIN_QUESTIONS}` : ''}`);
  if (!ok) { countFail = true; failures++; }
}

// ── 3. Check correct_answer matches one of the options ──
// Options are stored as "A. text...", correct_answer is just the letter "A"
console.log('\n── Validating correct_answer vs options ──');
const answerErrors = [];
for (const q of data) {
  if (!Array.isArray(q.options)) {
    answerErrors.push({ id: q.id, professor: q.professor, issue: 'options is not an array' });
    continue;
  }
  // Check that one option starts with the correct_answer letter followed by ". " or "."
  const letter = q.correct_answer?.trim();
  const hasMatch = q.options.some(o => o.startsWith(`${letter}.`) || o.startsWith(`${letter} `));
  if (!hasMatch) {
    answerErrors.push({
      id: q.id,
      professor: q.professor,
      question: q.question.slice(0, 60),
      correct_answer: q.correct_answer,
      options: q.options,
    });
  }
}

if (answerErrors.length === 0) {
  console.log(`✓ All ${data.length} questions have a correct_answer that matches an option`);
} else {
  console.log(`❌ ${answerErrors.length} questions have a MISMATCHED correct_answer:\n`);
  answerErrors.forEach(e => {
    console.log(`  ID ${e.id} [${e.professor}]`);
    if (e.issue) { console.log(`    issue: ${e.issue}`); return; }
    console.log(`    Q: "${e.question}..."`);
    console.log(`    correct_answer: "${e.correct_answer}"`);
    console.log(`    options: ${JSON.stringify(e.options)}`);
    console.log();
  });
  failures++;
}

// ── 4. Check difficulty values are valid ──
console.log('\n── Validating difficulty values ──');
const validDifficulty = new Set(['basic', 'advanced']);
const badDifficulty = data.filter(q => !validDifficulty.has(q.difficulty));
if (badDifficulty.length === 0) {
  console.log('✓ All questions have valid difficulty (basic/advanced)');
} else {
  console.log(`❌ ${badDifficulty.length} questions have invalid difficulty:`);
  badDifficulty.forEach(q => console.log(`  ID ${q.id} [${q.professor}] difficulty="${q.difficulty}"`));
  failures++;
}

// ── Summary ──
console.log('\n' + '─'.repeat(50));
if (failures === 0) {
  console.log('✅ All checks passed — database looks clean');
} else {
  console.log(`❌ ${failures} check(s) failed — review issues above`);
  process.exit(1);
}
