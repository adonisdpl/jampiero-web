import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkAdmin(requesterId: string) {
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', requesterId).single()
  return data?.role === 'super_admin'
}

// Modifier (PATCH)
export async function PATCH(req: Request) {
  const { barberId, profileId, name, active, requesterId } = await req.json()
  if (!await checkAdmin(requesterId)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (active !== undefined) updates.active = active

  const { error } = await supabaseAdmin.from('barbers').update(updates).eq('id', barberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (name && profileId) {
    await supabaseAdmin.from('profiles').update({ full_name: name }).eq('id', profileId)
  }
  return NextResponse.json({ ok: true })
}

// Supprimer (DELETE)
export async function DELETE(req: Request) {
  const { barberId, profileId, requesterId } = await req.json()
  if (!await checkAdmin(requesterId)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // 1. Supprimer le barber (les bookings restent en historique)
  await supabaseAdmin.from('barbers').delete().eq('id', barberId)
  // 2. Supprimer l'utilisateur auth (cascade sur profiles)
  if (profileId) await supabaseAdmin.auth.admin.deleteUser(profileId)

  return NextResponse.json({ ok: true })
}