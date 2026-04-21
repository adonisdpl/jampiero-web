'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Barber {
  id: string
  name: string
  email: string
  profile_id: string
  active: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [userId, setUserId]     = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [barbers, setBarbers]   = useState<Barber[]>([])
  const [loading, setLoading]   = useState(true)

  // Form création
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  // Edition
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editError, setEditError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/barber/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'super_admin') { router.replace('/barber/dashboard'); return }
      setUserId(user.id)
      setChecking(false)
      loadBarbers()
    })
  }, [])

  async function loadBarbers() {
    setLoading(true)
    const { data } = await supabase.from('barbers').select('*').order('name')
    setBarbers((data as any) ?? [])
    setLoading(false)
  }

  async function createBarber(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/admin/create-barber', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, requesterId: userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setName(''); setEmail(''); setPassword(''); setShowForm(false)
      loadBarbers()
    } catch (e: any) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  async function toggleActive(b: Barber) {
    await fetch('/api/admin/manage-barber', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: b.id, active: !b.active, requesterId: userId })
    })
    loadBarbers()
  }

  function startEdit(b: Barber) {
    setEditingId(b.id)
    setEditName(b.name)
    setEditEmail(b.email)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function saveEdit(b: Barber) {
    setEditError('')
    try {
      const res = await fetch('/api/admin/manage-barber', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: b.id, profileId: b.profile_id,
          name: editName, email: editEmail,
          requesterId: userId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditingId(null)
      loadBarbers()
    } catch (e: any) { setEditError(e.message) }
  }

  async function deleteBarber(b: Barber) {
    if (!confirm(`Supprimer définitivement ${b.name} ? Cette action est irréversible.`)) return
    await fetch('/api/admin/manage-barber', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: b.id, profileId: b.profile_id, requesterId: userId })
    })
    loadBarbers()
  }

  if (checking) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-6 pb-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#D4AC0D] text-xs tracking-widest uppercase">Admin</p>
            <p className="text-[#F0EDE8] italic text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Gestion des coiffeurs</p>
          </div>
          <button onClick={() => router.push('/barber/dashboard')}
            className="text-[#888] text-sm hover:text-[#D4AC0D] border border-[#2E2E2E] rounded-lg px-3 py-1.5 hover:border-[#D4AC0D] transition-colors">
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors mb-6">
            + Ajouter un coiffeur
          </button>
        )}

        {showForm && (
          <form onSubmit={createBarber} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase">Nouveau coiffeur</p>
            <div>
              <label className="text-xs text-[#888] tracking-widest uppercase block mb-1.5">Nom</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Marco"
                className="w-full border border-[#2E2E2E] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#D4AC0D] bg-[#0D0D0D] text-[#F0EDE8] placeholder-[#555]" />
            </div>
            <div>
              <label className="text-xs text-[#888] tracking-widest uppercase block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="marco@jampiero.ch"
                className="w-full border border-[#2E2E2E] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#D4AC0D] bg-[#0D0D0D] text-[#F0EDE8] placeholder-[#555]" />
            </div>
            <div>
              <label className="text-xs text-[#888] tracking-widest uppercase block mb-1.5">Mot de passe initial</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 caractères"
                className="w-full border border-[#2E2E2E] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#D4AC0D] bg-[#0D0D0D] text-[#F0EDE8] placeholder-[#555]" />
            </div>
            {error && <p className="text-sm text-[#D4AC0D] bg-[#1A1500] border border-[#D4AC0D]/30 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors disabled:opacity-60">
                {submitting ? '...' : 'Créer'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }}
                className="flex-1 border border-[#2E2E2E] text-[#888] rounded-xl py-3 text-sm hover:border-[#D4AC0D] hover:text-[#D4AC0D] transition-colors">
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {barbers.map(b => (
              <div key={b.id} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1500] border-2 border-[#D4AC0D] flex items-center justify-center text-[#D4AC0D] font-bold flex-shrink-0">{b.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    {editingId === b.id ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-[#888] tracking-widest uppercase block mb-1">Nom</label>
                          <input value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full border border-[#D4AC0D] rounded px-2 py-1.5 text-sm bg-[#0D0D0D] text-[#F0EDE8] outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-[#888] tracking-widest uppercase block mb-1">Email</label>
                          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                            className="w-full border border-[#D4AC0D] rounded px-2 py-1.5 text-sm bg-[#0D0D0D] text-[#F0EDE8] outline-none" />
                        </div>
                        {editError && <p className="text-xs text-[#D4AC0D] bg-[#1A1500] border border-[#D4AC0D]/30 rounded px-2 py-1">{editError}</p>}
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-[#F0EDE8] truncate">{b.name}</p>
                        <p className="text-xs text-[#888] truncate">{b.email}</p>
                      </>
                    )}
                  </div>
                  {editingId !== b.id && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${b.active ? 'bg-[#0A2A1E] text-[#1D9E75]' : 'bg-[#2A0A08] text-[#C0392B]'}`}>
                      {b.active ? 'Actif' : 'Inactif'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingId === b.id ? (
                    <>
                      <button onClick={() => saveEdit(b)}
                        className="flex-1 bg-[#1D9E75] text-white rounded-lg py-2 text-xs font-semibold hover:bg-[#0F6E56] transition-colors">Enregistrer</button>
                      <button onClick={cancelEdit}
                        className="flex-1 border border-[#2E2E2E] text-[#888] rounded-lg py-2 text-xs hover:border-[#D4AC0D] transition-colors">Annuler</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(b)}
                        className="flex-1 border border-[#2E2E2E] text-[#888] rounded-lg py-2 text-xs hover:border-[#D4AC0D] hover:text-[#D4AC0D] transition-colors">Modifier</button>
                      <button onClick={() => toggleActive(b)}
                        className="flex-1 border border-[#D4AC0D] text-[#D4AC0D] rounded-lg py-2 text-xs hover:bg-[#1A1500] transition-colors">
                        {b.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteBarber(b)}
                        className="border border-[#C0392B] text-[#C0392B] rounded-lg px-3 py-2 text-xs hover:bg-[#2A0A08] transition-colors">🗑</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}