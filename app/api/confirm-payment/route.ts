import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { code, adminPassword } = await req.json()

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cashback_actions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('code', code)
      .eq('status', 'pending')
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Registro não encontrado ou já confirmado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
