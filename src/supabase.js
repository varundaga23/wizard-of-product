import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch questions for a professor — shuffled, capped at `count`
export async function getQuestionsForProfessor(professor, count = 10) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('professor', professor)
    .limit(60);

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  // Shuffle in JS and return requested count
  const shuffled = (data || []).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Submit a score to the leaderboard
export async function submitScore(playerName, character, score, domainBreakdown) {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ player_name: playerName, character, score, domain_breakdown: domainBreakdown }]);

  if (error) {
    console.error('Error submitting score:', error);
    return null;
  }
  return data;
}

// Fetch top 10 leaderboard entries
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  return data;
}
