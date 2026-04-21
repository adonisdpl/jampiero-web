'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BarberProfilePage() {
  const router = useRouter()
  const [profile, setProfile]   = useState<any>(null)
  const [barber, setBarber]     = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [editing, setEditing]   = useState(false)
  const [success, setSuccess]   = useState(false)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/barber/login'); return }
    setEmail(user.email ?? '')
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) { setProfile(prof); setFullName(prof.full_name ?? ''); setPhone(prof.phone ?? '') }
    const { data: barb } = await supabase.from('barbers').select('*').eq('profile_id', user.id).single()
    if (barb) setBarber(barb)
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
    if (!error) { setEditing(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); fetchProfile() }
    setSaving(false)
  }

  async function signOut() {
    if (!confirm('Vous déconnecter ?')) return
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const initials    = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString('fr-CH', { month:'long', year:'numeric' }) : ''

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/barber/dashboard')} className="text-[#888] text-sm hover:text-[#D4AC0D] transition-colors">← Dashboard</button>
          <p className="text-[#F0EDE8] italic text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Mon Profil</p>
          <div className="w-20" />
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#1A1500] border-4 border-[#D4AC0D] flex items-center justify-center mb-3">
            <span className="text-[#D4AC0D] text-2xl font-bold">{initials || '?'}</span>
          </div>
          <h1 className="text-[#F0EDE8] text-xl font-bold">{fullName || 'Mon profil'}</h1>
          {barber && (
            <span className="mt-2 bg-[#D4AC0D] text-[#0D0D0D] text-xs font-bold px-3 py-1 rounded-full tracking-wide">
              ✂ {barber.name}
            </span>
          )}
          <p className="text-[#555] text-xs mt-2 tracking-widest">Coiffeur depuis {memberSince}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-12">
        {success && (
          <div className="bg-[#0A2A1E] border border-[#1D9E75]/30 text-[#1D9E75] rounded-xl px-4 py-3 text-sm font-medium mb-4 text-center">
            Profil mis à jour !
          </div>
        )}

        {barber && (
          <div className="bg-[#1A1500] border border-[#D4AC0D]/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">✂</span>
            <div>
              <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase">Nom dans le salon</p>
              <p className="text-[#F0EDE8] font-semibold mt-0.5">{barber.name}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${barber.active ? 'bg-[#0A2A1E] text-[#1D9E75]' : 'bg-[#1A1A1A] text-[#555]'}`}>
              {barber.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        )}

        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase mb-4">Informations personnelles</p>
          <div className="mb-4">
            <label className="text-xs text-[#555] tracking-widest uppercase block mb-1.5">Nom complet</label>
            {editing ? (
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border-b-2 border-[#D4AC0D] bg-transparent py-1.5 text-[#F0EDE8] text-sm outline-none" placeholder="Prénom Nom" />
            ) : <p className="text-[#F0EDE8] text-sm font-medium">{fullName || '—'}</p>}
          </div>
          <div className="border-t border-[#2E2E2E] mb-4" />
          <div className="mb-4">
            <label className="text-xs text-[#555] tracking-widest uppercase block mb-1.5">Téléphone</label>
            {editing ? (
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border-b-2 border-[#D4AC0D] bg-transparent py-1.5 text-[#F0EDE8] text-sm outline-none" placeholder="+41 79 000 00 00" />
            ) : <p className="text-[#F0EDE8] text-sm font-medium">{phone || '—'}</p>}
          </div>
          <div className="border-t border-[#2E2E2E] mb-4" />
          <div>
            <label className="text-xs text-[#555] tracking-widests uppercase block mb-1.5">Email</label>
            <p className="text-[#F0EDE8] text-sm font-medium">{email}</p>
          </div>
        </div>

        {editing ? (
          <div className="flex gap-3 mb-4">
            <button onClick={() => { setEditing(false); fetchProfile() }}
              className="flex-1 border border-[#2E2E2E] rounded-xl py-3 text-sm text-[#888] hover:border-[#D4AC0D] hover:text-[#D4AC0D] transition-colors">
              Annuler
            </button>
            <button onClick={saveProfile} disabled={saving}
              className="flex-1 bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors disabled:opacity-60">
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="w-full bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors mb-4">
            Modifier le profil
          </button>
        )}

        <button onClick={signOut}
          className="w-full border border-[#2E2E2E] rounded-xl py-3 text-sm text-[#888] hover:text-[#D4AC0D] hover:border-[#D4AC0D] transition-colors mb-4">
          Se déconnecter
        </button>

        <p className="text-center text-xs text-[#333] tracking-widest">Jampiero BarberShop · Genève 🇩🇴</p>
      </div>
    </div>
  )
}