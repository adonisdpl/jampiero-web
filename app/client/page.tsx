'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ClientPage() {
  const router  = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/'); return }
      setEmail(data.session.user.email ?? '')
      setLoading(false)
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6EC]">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <div className="bg-[#C0392B] px-6 pt-8 pb-10">
        <p className="text-white italic text-xl tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
          Jampiero BarberoShop
        </p>
        <p className="text-white/80 text-sm mt-1">Bonjour 👋 {email.split('@')[0]}</p>
      </div>

      <div className="px-4 -mt-4 max-w-lg mx-auto">
        {/* Menu */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => router.push('/client/booking')}
            className="bg-[#FADBD8] border-2 border-[#C0392B] rounded-2xl p-5 text-left hover:bg-[#f5c6c2] transition-colors"
          >
            <span className="text-3xl block mb-2">✂</span>
            <span className="text-xs font-semibold text-[#922B21] tracking-widest uppercase">Réserver</span>
          </button>

          <button
            onClick={() => router.push('/client/appointments')}
            className="bg-white border border-[#E8D5C4] rounded-2xl p-5 text-left hover:bg-[#FDF6EC] transition-colors"
          >
            <span className="text-3xl block mb-2">📅</span>
            <span className="text-xs font-semibold text-[#2C2C2C] tracking-widest uppercase">Mes RDV</span>
          </button>

          <button
            onClick={() => router.push('/client/profile')}
            className="bg-white border border-[#E8D5C4] rounded-2xl p-5 text-left hover:bg-[#FDF6EC] transition-colors"
          >
            <span className="text-3xl block mb-2">👤</span>
            <span className="text-xs font-semibold text-[#2C2C2C] tracking-widest uppercase">Profil</span>
          </button>

          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
            <span className="text-3xl block mb-2">📍</span>
            <span className="text-xs font-semibold text-[#2C2C2C] tracking-widest uppercase">Adresse</span>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-3">Nous trouver</p>
          <p className="text-sm text-[#7B7B7B] leading-relaxed">
            12 Rue de Rive, 1204 Genève<br />
            Lun–Ven 9h–19h · Sam 9h–18h
          </p>
        </div>

        {/* Déconnexion */}
        <button
          onClick={signOut}
          className="w-full border border-[#E8D5C4] rounded-xl py-3 text-sm text-[#7B7B7B] hover:text-[#C0392B] hover:border-[#C0392B] transition-colors"
        >
          Se déconnecter
        </button>

        <p className="text-center text-xs text-[#BDBDBD] mt-6 tracking-widest pb-8">
          República Dominicana 🇩🇴 · Genève
        </p>
      </div>
    </div>
  )
}