import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const professor = process.argv[2];

if (!professor) {
  console.log('Usage: node scripts/delete-professor-questions.mjs <professor_key>');
  console.log('Example: node scripts/delete-professor-questions.mjs lenny_rachitsky');
  process.exit(1);
}

const { error, count } = await supabase
  .from('questions')
  .delete({ count: 'exact' })
  .eq('professor', professor);

if (error) console.error('Error:', error);
else console.log(`Deleted questions for ${professor}`);
