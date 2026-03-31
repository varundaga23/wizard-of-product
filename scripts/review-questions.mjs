import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('professor', 'lenny_rachitsky')
  .order('difficulty');

data.forEach((q, i) => {
  console.log(`--- Q${i+1} [${q.difficulty.toUpperCase()}] ---`);
  console.log(`Q: ${q.question}`);
  q.options.forEach(o => console.log(`   ${o}`));
  console.log(`✓ ${q.correct_answer} | ${q.explanation}`);
  console.log();
});
