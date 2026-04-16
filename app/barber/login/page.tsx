'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BarberLoginPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [checking, setChecking] = useState(true)

  // Redirige si déjà connecté en tant que coiffeur
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', data.session.user.id).single()
        if (profile?.role === 'barber') router.replace('/barber/dashboard')
      }
      setChecking(false)
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Vérifie que c'est bien un coiffeur
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()

      if (profile?.role !== 'barber') {
        await supabase.auth.signOut()
        throw new Error('Accès réservé aux coiffeurs.')
      }

      router.replace('/barber/dashboard')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#C0392B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-white">✂</span>
          </div>
          <h1 className="text-3xl font-bold italic text-white tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Jampiero
          </h1>
          <p className="text-xs tracking-[4px] text-[#D4AC0D] uppercase mt-1">BarberoShop</p>
          <div className="w-12 h-0.5 bg-[#D4AC0D] mx-auto mt-3" />
          <p className="text-[#7B7B7B] text-xs tracking-widest uppercase mt-3">Espace coiffeur</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="bg-[#222] rounded-2xl border border-[#333] p-6">
          <h2 className="text-sm font-semibold text-[#C0392B] tracking-widest uppercase mb-5">
            Connexion
          </h2>

          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-[#333] rounded-lg px-4 py-3 mb-3 text-sm outline-none focus:border-[#C0392B] bg-[#1a1a1a] text-white placeholder-[#555] transition-colors"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-[#333] rounded-lg px-4 py-3 mb-4 text-sm outline-none focus:border-[#C0392B] bg-[#1a1a1a] text-white placeholder-[#555] transition-colors"
          />

          {error && (
            <p className="text-sm text-[#C0392B] bg-[#FADBD8]/10 border border-[#C0392B]/30 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C0392B] text-white rounded-lg py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60">
            {loading ? '...' : 'Se connecter'}
          </button>
        </form>

        {/* Retour accueil */}
        <div className="text-center mt-6">
          <a href="/" className="text-xs text-[#555] hover:text-[#C0392B] transition-colors tracking-widest">
            ← Retour à l'accueil
          </a>
        </div>

        <p className="text-center text-xs text-[#333] mt-4 tracking-widest">
          República Dominicana 🇩🇴 · Genève
        </p>
      </div>
    </div>
  )
}