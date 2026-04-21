'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FDF6EC]">

      {/* Hero */}
      <div className="bg-[#C0392B] px-6 pt-12 pb-16 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl text-[#C0392B]">✂</span>
        </div>
        <h1 className="text-4xl font-bold italic text-white tracking-wide mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Jampiero
        </h1>
        <p className="text-[#D4AC0D] text-xs tracking-[5px] uppercase mb-4">BarberoShop</p>
        <p className="text-white/80 text-sm max-w-xs mx-auto leading-relaxed">
          Le barbier de confiance de Genève — coupes précises, style latino, ambiance chaleureuse.
        </p>
        <button
          onClick={() => router.push('/booking')}
          className="mt-8 bg-[#D4AC0D] text-white rounded-2xl px-10 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#9A7D0A] transition-colors shadow-sm">
          Réserver un rendez-vous
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Horaires */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">🕐 Horaires d'ouverture</p>
          <div className="space-y-2.5">
            {[
              { jour: 'Lundi — Vendredi', heure: '10h00 — 20h00', ouvert: true },
              { jour: 'Samedi',           heure: '09h00 — 19h00', ouvert: true },
              { jour: 'Dimanche',         heure: 'Fermé',          ouvert: false },
            ].map(({ jour, heure, ouvert }) => (
              <div key={jour} className="flex justify-between items-center text-sm">
                <span className="text-[#7B7B7B]">{jour}</span>
                <span className={`font-semibold ${ouvert ? 'text-[#2C2C2C]' : 'text-[#BDBDBD]'}`}>{heure}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">📍 Nous trouver</p>
          <p className="text-sm font-semibold text-[#2C2C2C] mb-1">Rue de Lyon 14</p>
          <p className="text-sm text-[#7B7B7B] mb-4">1201 Genève, Suisse</p>
          <a
            href="https://maps.google.com/?q=Rue+de+Lyon+14+1201+Genève"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#C0392B] border border-[#C0392B] rounded-xl px-4 py-2 hover:bg-[#FADBD8] transition-colors">
            Ouvrir dans Google Maps →
          </a>
        </div>

        {/* Contact */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">📞 Contact</p>
          <div className="space-y-3">
            <a href="tel:+41772132310" className="flex items-center gap-3 text-sm hover:text-[#C0392B] transition-colors">
              <span className="w-8 h-8 bg-[#FADBD8] rounded-full flex items-center justify-center text-base flex-shrink-0">📞</span>
              <span className="text-[#2C2C2C] font-medium">077 213 23 10</span>
            </a>
            <a href="mailto:info@jampiero.ch" className="flex items-center gap-3 text-sm hover:text-[#C0392B] transition-colors">
              <span className="w-8 h-8 bg-[#FADBD8] rounded-full flex items-center justify-center text-base flex-shrink-0">✉️</span>
              <span className="text-[#2C2C2C] font-medium">info@jampiero.ch</span>
            </a>
            <a href="https://instagram.com/jampierobarbershop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-[#C0392B] transition-colors">
              <span className="w-8 h-8 bg-[#FADBD8] rounded-full flex items-center justify-center text-base flex-shrink-0">📸</span>
              <span className="text-[#2C2C2C] font-medium">@jampierobarbershop</span>
            </a>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">✂ Nos prestations</p>
          <div className="space-y-2.5">
            {[
              { name: 'Coupe homme',   price: '30 CHF' },
              { name: 'Barbe',         price: '25 CHF' },
              { name: 'Coupe + Barbe', price: '50 CHF' },
              { name: 'Coupe femme',   price: '45 CHF' },
              { name: 'Coloration',    price: 'dès 70 CHF' },
              { name: 'Soin',          price: '35 CHF' },
            ].map(({ name, price }) => (
              <div key={name} className="flex justify-between items-center text-sm py-1 border-b border-[#F2E8DC] last:border-0">
                <span className="text-[#2C2C2C]">{name}</span>
                <span className="font-semibold text-[#C0392B]">{price}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/booking')}
            className="w-full mt-4 bg-[#C0392B] text-white rounded-xl py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
            Réserver maintenant
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-[#E8D5C4]">
        <p className="text-xs text-[#BDBDBD] tracking-widest mb-1">República Dominicana 🇩🇴 · Genève</p>
        <a href="/barber/login" className="text-xs text-[#BDBDBD] hover:text-[#C0392B] transition-colors">
          Espace coiffeur →
        </a>
      </div>
    </div>
  )
}