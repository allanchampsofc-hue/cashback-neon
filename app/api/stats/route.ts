import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const adminPassword = req.nextUrl.searchParams.get('p')

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: config } = await supabase
    .from('cashback_config')
    .select('*')
    .eq('id', 1)
    .single()

  const { data: actions } = await supabase
    .from('cashback_actions')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = actions?.filter(a => a.status === 'pending').length ?? 0
  const paid = actions?.filter(a => a.status === 'paid').length ?? 0
  const used = actions?.filter(a => a.status === 'used').length ?? 0

  return NextResponse.json({
    config,
    actions: actions ?? [],
    stats: { pending, paid, used, total: (actions?.length ?? 0) }
  })
}
