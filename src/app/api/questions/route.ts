import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const professor = req.nextUrl.searchParams.get('professor')
  if (!professor) {
    return NextResponse.json({ error: 'Missing professor param' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('questions')
    .select('id, professor, question, options, correct_answer, explanation, difficulty')
    .eq('professor', professor)
    .limit(60)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const arr = [...(data ?? [])]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return NextResponse.json(arr.slice(0, 5))
}
