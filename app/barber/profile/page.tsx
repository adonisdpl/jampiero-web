'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  created_at: string
}

interface Barber {
  id: string
  name: string
  active: boolean
}

export default function BarberProfilePage() {
  const router = useRouter()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [barber, setBarber]     = useState<Barber | null>(null)
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
    if (!user) { router.replace('/'); return }
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
    if (!error) {
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchProfile()
    }
    setSaving(false)
  }

  async function signOut() {
    if (!confirm('Vous déconnecter ?')) return
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const initials    = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString('fr-CH', { month:'long', year:'numeric' }) : ''

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <div className="bg-[#C0392B] px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/barber/dashboard')} className="text-white/80 text-sm hover:text-white">← Dashboard</button>
          <p className="text-white italic text-lg" style={{ fontFamily: 'Georgia, serif' }}>Mon Profil</p>
          <div className="w-20" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-[#D4AC0D] flex items-center justify-center mb-3">
            <span className="text-[#C0392B] text-2xl font-bold">{initials || '?'}</span>
          </div>
          <h1 className="text-white text-xl font-bold">{fullName || 'Mon profil'}</h1>
          {barber && (
            <span className="mt-2 bg-[#D4AC0D] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
              ✂ {barber.name}
            </span>
          )}
          <p className="text-white/70 text-xs mt-2 tracking-widest">Coiffeur depuis {memberSince}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-12">

        {/* Message succès */}
        {success && (
          <div className="bg-green-100 text-green-700 rounded-xl px-4 py-3 text-sm font-medium mb-4 text-center">
            Profil mis à jour avec succès !
          </div>
        )}

        {/* Infos coiffeur */}
        {barber && (
          <div className="bg-[#FADBD8] border border-[#C0392B]/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">✂</span>
            <div>
              <p className="text-xs font-semibold text-[#922B21] tracking-widest uppercase">Nom dans le salon</p>
              <p className="text-[#2C2C2C] font-semibold mt-0.5">{barber.name}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${barber.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {barber.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        )}

        {/* Infos personnelles */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">Informations personnelles</p>

          <div className="mb-4">
            <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">Nom complet</label>
            {editing ? (
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border-b-2 border-[#C0392B] bg-transparent py-1.5 text-[#2C2C2C] text-sm outline-none"
                placeholder="Prénom Nom" />
            ) : (
              <p className="text-[#2C2C2C] text-sm font-medium">{fullName || '—'}</p>
            )}
          </div>

          <div className="border-t border-[#F2E8DC] mb-4" />

          <div className="mb-4">
            <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">Téléphone</label>
            {editing ? (
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border-b-2 border-[#C0392B] bg-transparent py-1.5 text-[#2C2C2C] text-sm outline-none"
                placeholder="+41 79 000 00 00" />
            ) : (
              <p className="text-[#2C2C2C] text-sm font-medium">{phone || '—'}</p>
            )}
          </div>

          <div className="border-t border-[#F2E8DC] mb-4" />

          <div>
            <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">Email</label>
            <p className="text-[#2C2C2C] text-sm font-medium">{email}</p>
          </div>
        </div>

        {/* Boutons */}
        {editing ? (
          <div className="flex gap-3 mb-4">
            <button onClick={() => { setEditing(false); fetchProfile() }}
              className="flex-1 border border-[#E8D5C4] rounded-xl py-3 text-sm text-[#7B7B7B] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors">
              Annuler
            </button>
            <button onClick={saveProfile} disabled={saving}
              className="flex-1 bg-[#C0392B] text-white rounded-xl py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60">
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="w-full bg-[#C0392B] text-white rounded-xl py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors mb-4">
            Modifier le profil
          </button>
        )}

        {/* Déconnexion */}
        <button onClick={signOut}
          className="w-full border border-[#E8D5C4] rounded-xl py-3 text-sm text-[#7B7B7B] hover:text-[#C0392B] hover:border-[#C0392B] transition-colors mb-4">
          Se déconnecter
        </button>

        <p className="text-center text-xs text-[#BDBDBD] tracking-widest">
          Jampiero BarberoShop · Genève 🇩🇴
        </p>
      </div>
    </div>
  )
}