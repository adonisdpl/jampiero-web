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

  const [booking, setBooking]   = useState<Booking | null>(null)
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!token) { setError('Lien invalide.'); setLoading(false); return }
    supabase
      .from('bookings')
      .select(`id, date, slot_time, status, client_name, client_email, cancel_token,
        service:services(name, price_chf),
        barber:barbers(name)`)
      .eq('cancel_token', token)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Rendez-vous introuvable.'); setLoading(false); return }
        setBooking(data as any)
        setLoading(false)
      })
  }, [token])

  async function cancelBooking() {
    if (!booking) return
    setCancelling(true)
    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('cancel_token', token)

    if (err) { setError(err.message); setCancelling(false); return }

    // Email d'annulation
    if (booking.client_email) {
      await fetch('/api/send-cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:  booking.client_name,
          clientEmail: booking.client_email,
          barberName:  (booking.barber as any).name,
          serviceName: (booking.service as any).name,
          date:        booking.date,
          slot:        booking.slot_time.slice(0, 5),
        })
      })
    }

    setDone(true)
    setCancelling(false)
  }

  const dateLabel = (date: string) => new Date(date + 'T12:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) return (
    <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-[#FADBD8] rounded-full flex items-center justify-center text-3xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Lien invalide</h2>
      <p className="text-sm text-[#7B7B7B] mb-6">{error}</p>
      <button onClick={() => router.push('/')}
        className="bg-[#C0392B] text-white rounded-xl px-6 py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  if (booking?.status === 'cancelled' || done) return (
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#FADBD8] rounded-full flex items-center justify-center text-4xl mb-6">✓</div>
      <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">Rendez-vous annulé</h2>
      <p className="text-sm text-[#7B7B7B] mb-6">
        Votre rendez-vous a bien été annulé.
        {booking?.client_email && ' Un email de confirmation vous a été envoyé.'}
      </p>
      <button onClick={() => router.push('/booking')}
        className="bg-[#C0392B] text-white rounded-xl px-6 py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors mb-3">
        Reprendre rendez-vous
      </button>
      <button onClick={() => router.push('/')}
        className="text-sm text-[#7B7B7B] hover:text-[#C0392B] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  if (booking?.status === 'done') return (
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-[#E1F5EE] rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
      <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">RDV déjà passé</h2>
      <p className="text-sm text-[#7B7B7B] mb-6">Ce rendez-vous est déjà terminé et ne peut plus être annulé.</p>
      <button onClick={() => router.push('/')}
        className="bg-[#C0392B] text-white rounded-xl px-6 py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
        Retour à l'accueil
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <div className="bg-[#C0392B] px-6 pt-8 pb-10 text-center">
        <p className="text-white italic text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Jampiero</p>
        <p className="text-[#D4AC0D] text-xs tracking-[4px] uppercase mt-1">BarberoShop</p>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-4 pb-12">
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">
            Annuler mon rendez-vous
          </p>

          <div className="space-y-3 mb-6">
            {[
              { label: 'Client',     value: booking?.client_name ?? '—' },
              { label: 'Coiffeur',   value: (booking?.barber as any)?.name },
              { label: 'Prestation', value: (booking?.service as any)?.name },
              { label: 'Date',       value: booking ? dateLabel(booking.date) : '—' },
              { label: 'Heure',      value: booking?.slot_time.slice(0, 5) },
              { label: 'Prix',       value: `${(booking?.service as any)?.price_chf} CHF` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-[#F2E8DC] pb-2 last:border-0">
                <span className="text-[#7B7B7B]">{label}</span>
                <span className="font-semibold text-[#2C2C2C] capitalize">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#FCF3CF] border border-[#D4AC0D]/30 rounded-xl p-3 mb-5">
            <p className="text-xs text-[#9A7D0A] text-center">
              ⚠️ Cette action est irréversible. Vous pouvez reprendre rendez-vous après l'annulation.
            </p>
          </div>

          <button
            onClick={cancelBooking}
            disabled={cancelling}
            className="w-full bg-[#C0392B] text-white rounded-xl py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60 mb-3">
            {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full border border-[#E8D5C4] rounded-xl py-3 text-sm text-[#7B7B7B] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors">
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
      <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}