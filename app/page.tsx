'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0D0D0D]">

      {/* Hero */}
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-12 pb-16 text-center">
        <div className="w-20 h-20 bg-[#D4AC0D] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl text-[#0D0D0D]">✂</span>
        </div>
        <h1 className="text-4xl font-bold italic text-[#F0EDE8] tracking-wide mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Jampiero
        </h1>
        <p className="text-[#D4AC0D] text-xs tracking-[5px] uppercase mb-4">BarberShop</p>
        <p className="text-[#888] text-sm max-w-xs mx-auto leading-relaxed">
          Le barbier de confiance de Genève — coupes précises, style latino, ambiance chaleureuse.
        </p>
        <button
          onClick={() => router.push('/booking')}
          className="mt-8 bg-[#D4AC0D] text-[#0D0D0D] rounded-2xl px-10 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors">
          Réserver un rendez-vous
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Horaires */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase mb-4">🕐 Horaires d'ouverture</p>
          <div className="space-y-2.5">
            {[
              { jour: 'Lundi — Vendredi', heure: '10h00 — 20h00', ouvert: true },
              { jour: 'Samedi',           heure: '09h00 — 19h00', ouvert: true },
              { jour: 'Dimanche',         heure: 'Fermé',          ouvert: false },
            ].map(({ jour, heure, ouvert }) => (
              <div key={jour} className="flex justify-between items-center text-sm">
                <span className="text-[#888]">{jour}</span>
                <span className={`font-semibold ${ouvert ? 'text-[#F0EDE8]' : 'text-[#555]'}`}>{heure}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase mb-4">📍 Nous trouver</p>
          <p className="text-sm font-semibold text-[#F0EDE8] mb-1">Rue de Lyon 14</p>
          <p className="text-sm text-[#888] mb-4">1201 Genève, Suisse</p>
          <a
            href="https://maps.google.com/?q=Rue+de+Lyon+14+1201+Genève"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AC0D] border border-[#D4AC0D] rounded-xl px-4 py-2 hover:bg-[#1A1500] transition-colors">
            Ouvrir dans Google Maps →
          </a>
        </div>

        {/* Contact */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widests uppercase mb-4">📞 Contact</p>
          <div className="space-y-3">
            <a href="tel:+41772132310" className="flex items-center gap-3 text-sm hover:text-[#D4AC0D] transition-colors">
              <span className="w-8 h-8 bg-[#242424] border border-[#2E2E2E] rounded-full flex items-center justify-center text-base flex-shrink-0">📞</span>
              <span className="text-[#F0EDE8] font-medium">077 213 23 10</span>
            </a>
            <a href="mailto:info@jampiero.ch" className="flex items-center gap-3 text-sm hover:text-[#D4AC0D] transition-colors">
              <span className="w-8 h-8 bg-[#242424] border border-[#2E2E2E] rounded-full flex items-center justify-center text-base flex-shrink-0">✉️</span>
              <span className="text-[#F0EDE8] font-medium">info@jampiero.ch</span>
            </a>
            <a href="https://instagram.com/jampierobarbershop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-[#D4AC0D] transition-colors">
              <span className="w-8 h-8 bg-[#242424] border border-[#2E2E2E] rounded-full flex items-center justify-center text-base flex-shrink-0">📸</span>
              <span className="text-[#F0EDE8] font-medium">@jampierobarbershop</span>
            </a>
          </div>
        </div>

        {/* Services */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widests uppercase mb-4">✂ Nos prestations</p>
          <div className="space-y-2.5">
            {[
              { name: 'Coupe',            price: '30 CHF' },
              { name: 'Coupe + Barbe',    price: '40 CHF' },
              { name: 'Contours & Barbe', price: '20 CHF' },
            ].map(({ name, price }) => (
              <div key={name} className="flex justify-between items-center text-sm py-2 border-b border-[#2E2E2E] last:border-0">
                <span className="text-[#F0EDE8]">{name}</span>
                <span className="font-bold text-[#D4AC0D]">{price}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/booking')}
            className="w-full mt-4 bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors">
            Réserver maintenant
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-[#2E2E2E]">
        <p className="text-xs text-[#555] tracking-widests mb-1">República Dominicana 🇩🇴 · Genève</p>
        <a href="/barber/login" className="text-xs text-[#555] hover:text-[#D4AC0D] transition-colors">
          Espace coiffeur →
        </a>
      </div>
    </div>
  )
}