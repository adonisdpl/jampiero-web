'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  date: string
  slot_time: string
  status: string
  client_name: string | null
  client_email: string | null
  cancel_token: string
  service: { name: string; price_chf: number }
  barber: { name: string }
}

function CancelContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [booking, setBooking]       = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!token) { setError('Lien invalide.'); setLoading(false); return }
    supabase.from('bookings')
      .select(`id, date, slot_time, status, client_name, client_email, cancel_token,
        service:services(name, price_chf), barber:barbers(name)`)
      .eq('cancel_token', token).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Rendez-vous introuvable.'); setLoading(false); return }
        setBooking(data as any); setLoading(false)
      })
  }, [token])

  async function cancelBooking() {
    if (!booking) return
    setCancelling(true)
    const { error: err } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('cancel_token', token)
    if (err) { setError(err.message); setCancelling(false); return }
    if (booking.client_email) {
      await fetch('/api/send-cancellation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: booking.client_name, clientEmail: booking.client_email,
          barberName: (booking.barber as any).name, serviceName: (booking.service as any).name,
          date: booking.date, slot: booking.slot_time.slice(0, 5),
        })
      })
    }
    setDone(true); setCancelling(false)
  }

  const dateLabel = (date: string) => new Date(date + 'T12:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-[#1A1500] border-2 border-[#D4AC0D] rounded-full flex items-center justify-center text-3xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-[#F0EDE8] mb-2">Lien invalide</h2>
      <p className="text-sm text-[#888] mb-6">{error}</p>
      <button onClick={() => router.push('/')}
        className="bg-[#D4AC0D] text-[#0D0D0D] rounded-xl px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  if (booking?.status === 'cancelled' || done) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#1A1500] border-2 border-[#D4AC0D] rounded-full flex items-center justify-center text-4xl mb-6">✓</div>
      <h2 className="text-2xl font-bold text-[#F0EDE8] mb-2">Rendez-vous annulé</h2>
      <p className="text-sm text-[#888] mb-6">
        Votre rendez-vous a bien été annulé.
        {booking?.client_email && ' Un email de confirmation vous a été envoyé.'}
      </p>
      <button onClick={() => router.push('/booking')}
        className="bg-[#D4AC0D] text-[#0D0D0D] rounded-xl px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors mb-3">
        Reprendre rendez-vous
      </button>
      <button onClick={() => router.push('/')} className="text-sm text-[#888] hover:text-[#D4AC0D] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  if (booking?.status === 'done') return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-[#0A2A1E] border-2 border-[#1D9E75] rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
      <h2 className="text-xl font-bold text-[#F0EDE8] mb-2">RDV déjà passé</h2>
      <p className="text-sm text-[#888] mb-6">Ce rendez-vous est déjà terminé et ne peut plus être annulé.</p>
      <button onClick={() => router.push('/')}
        className="bg-[#D4AC0D] text-[#0D0D0D] rounded-xl px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F0C93A] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-8 pb-10 text-center">
        <div className="w-16 h-16 bg-[#D4AC0D] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-[#0D0D0D]">✂</span>
        </div>
        <p className="text-[#F0EDE8] italic text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Jampiero</p>
        <p className="text-[#D4AC0D] text-xs tracking-[4px] uppercase mt-1">BarberShop</p>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6 pb-12">
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase mb-4">Annuler mon rendez-vous</p>
          <div className="space-y-3 mb-6">
            {[
              { label: 'Client',     value: booking?.client_name ?? '—' },
              { label: 'Coiffeur',   value: (booking?.barber as any)?.name },
              { label: 'Prestation', value: (booking?.service as any)?.name },
              { label: 'Date',       value: booking ? dateLabel(booking.date) : '—' },
              { label: 'Heure',      value: booking?.slot_time.slice(0, 5) },
              { label: 'Prix',       value: `${(booking?.service as any)?.price_chf} CHF` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-[#2E2E2E] pb-2 last:border-0">
                <span className="text-[#888]">{label}</span>
                <span className="font-semibold text-[#F0EDE8] capitalize">{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#1A1500] border border-[#D4AC0D]/20 rounded-xl p-3 mb-5">
            <p className="text-xs text-[#D4AC0D] text-center">
              ⚠️ Cette action est irréversible.
            </p>
          </div>
          <button onClick={cancelBooking} disabled={cancelling}
            className="w-full bg-[#C0392B] text-white rounded-xl py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60 mb-3">
            {cancelling ? 'Annulation...' : "Confirmer l'annulation"}
          </button>
          <button onClick={() => router.push('/')}
            className="w-full border border-[#2E2E2E] rounded-xl py-3 text-sm text-[#888] hover:border-[#D4AC0D] hover:text-[#D4AC0D] transition-colors">
            Garder mon rendez-vous
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}