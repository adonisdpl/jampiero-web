import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const { email, password, name, requesterId } = await req.json()

  // Vérifier que celui qui appelle est super_admin
  const { data: requester } = await supabaseAdmin
    .from('profiles').select('role').eq('id', requesterId).single()
  if (requester?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // 1. Créer l'utilisateur auth
  const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: name }
  })
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })

  // 2. Mettre à jour le profil avec role 'barber'
  await supabaseAdmin.from('profiles')
    .update({ role: 'barber', full_name: name })
    .eq('id', userData.user.id)

  // 3. Créer l'entrée dans la table barbers
  const { error: barberErr } = await supabaseAdmin.from('barbers').insert({
    name, email, profile_id: userData.user.id, active: true
  })
  if (barberErr) return NextResponse.json({ error: barberErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, userId: userData.user.id })
}