'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [checking, setChecking] = useState(true)

  // Redirige si déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await redirectByRole(data.session.user.id)
      }
      setChecking(false)
    })
  }, [])

  async function redirectByRole(userId: string) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', userId).single()
    if (profile?.role === 'barber') router.replace('/barber/dashboard')
    else router.replace('/client')
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await redirectByRole(data.user.id)
      } else {
        if (!fullName) { setError('Entrez votre prénom et nom.'); return }
        const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName },
    emailRedirectTo: 'https://jampiero-web.vercel.app/auth/callback'
  }
})
if (error) throw error
// Afficher un message au lieu de connecter directement
setError('')
alert('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6EC]">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#C0392B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-4xl text-white">✂</span>
          </div>
          <h1 className="text-3xl font-bold italic text-[#922B21] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Jampiero
          </h1>
          <p className="text-xs tracking-[4px] text-[#D4AC0D] uppercase mt-1">BarberoShop</p>
          <div className="w-12 h-0.5 bg-[#D4AC0D] mx-auto mt-3" />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleAuth} className="bg-white rounded-2xl border border-[#E8D5C4] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#C0392B] tracking-widest uppercase mb-5">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>

          {!isLogin && (
            <input
              type="text"
              placeholder="Prénom et nom"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 mb-3 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 mb-3 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 mb-4 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors"
          />

          {error && (
            <p className="text-sm text-[#C0392B] bg-[#FADBD8] rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C0392B] text-white rounded-lg py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60"
          >
            {loading ? '...' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>

          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="w-full mt-4 text-sm text-[#7B7B7B] hover:text-[#C0392B] transition-colors"
          >
            {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <span className="text-[#C0392B] font-semibold">
              {isLogin ? "S'inscrire" : "Se connecter"}
            </span>
          </button>
        </form>

        <p className="text-center text-xs text-[#BDBDBD] mt-6 tracking-widest">
          República Dominicana 🇩🇴 · Genève
        </p>
      </div>
    </div>
  )
}