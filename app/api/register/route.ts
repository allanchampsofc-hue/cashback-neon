import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'NCB-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json()

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verificar vagas disponíveis
    const { data: config, error: configError } = await supabase
      .from('cashback_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'Erro ao verificar disponibilidade' }, { status: 500 })
    }

    if (!config.is_active || config.current_slots <= 0) {
      return NextResponse.json({ error: 'Ação esgotada' }, { status: 400 })
    }

    // Verificar se e-mail já cadastrado
    const { data: existing } = await supabase
      .from('cashback_actions')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado nesta ação' }, { status: 400 })
    }

    // Gerar código único
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: codeExists } = await supabase
        .from('cashback_actions')
        .select('id')
        .eq('code', code)
        .single()
      if (!codeExists) break
      code = generateCode()
      attempts++
    }

    // Inserir registro
    const { data, error } = await supabase
      .from('cashback_actions')
      .insert([{ code, name, phone, email: email.toLowerCase(), status: 'pending' }])
      .select()
      .single()

    if (error) throw error

    // Decrementar vaga
    await supabase
      .from('cashback_config')
      .update({ current_slots: config.current_slots - 1 })
      .eq('id', 1)

    return NextResponse.json({ success: true, code: data.code, name: data.name, phone: data.phone })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
