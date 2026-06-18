import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: config } = await supabase
    .from('cashback_config')
    .select('*')
    .eq('id', 1)
    .single()

  return NextResponse.json({ config: config ?? { current_slots: 0, max_slots: 10, is_active: false } })
}
