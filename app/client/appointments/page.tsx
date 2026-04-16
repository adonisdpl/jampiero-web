'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  date: string
  slot_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  barber: { name: string }
  service: { name: string; price_chf: number; duration_min: number }
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  done:      'Terminé',
}
const STATUS_CLASS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  done:      'bg-gray-100 text-gray-500',
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'upcoming' | 'past'>('upcoming')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }
    const { data } = await supabase
      .from('bookings')
      .select(`id, date, slot_time, status,
        barber:barbers(name),
        service:services(name, price_chf, duration_min)`)
      .eq('client_id', user.id)
      .order('date', { ascending: false })
    setBookings((data as any) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function cancelBooking(id: string) {
    if (!confirm('Annuler ce rendez-vous ?')) return
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    fetchBookings()
  }

  const today    = new Date(); today.setHours(0,0,0,0)
  const upcoming = bookings.filter(b => new Date(b.date+'T12:00') >= today && b.status !== 'cancelled')
  const past     = bookings.filter(b => new Date(b.date+'T12:00') < today  || b.status === 'cancelled' || b.status === 'done')
  const list     = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <div className="bg-[#C0392B] px-6 pt-6 pb-8">
        <button onClick={() => router.push('/client')} className="text-white/80 text-sm mb-3 hover:text-white">← Retour</button>
        <p className="text-white italic text-lg" style={{ fontFamily: 'Georgia, serif' }}>Mes Rendez-vous</p>
      </div>

      <div className="max-w-lg mx-auto -mt-2">
        {/* Tabs */}
        <div className="flex bg-white border-b border-[#E8D5C4]">
          <button
            onClick={() => setTab('upcoming')}
            className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${tab === 'upcoming' ? 'border-[#C0392B] text-[#C0392B]' : 'border-transparent text-[#7B7B7B]'}`}>
            À venir ({upcoming.length})
          </button>
          <button
            onClick={() => setTab('past')}
            className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${tab === 'past' ? 'border-[#C0392B] text-[#C0392B]' : 'border-transparent text-[#7B7B7B]'}`}>
            Historique ({past.length})
          </button>
        </div>

        <div className="px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">📅</span>
              <p className="text-[#2C2C2C] font-semibold">
                {tab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun historique'}
              </p>
              <p className="text-sm text-[#7B7B7B]">
                {tab === 'upcoming' ? 'Réservez votre prochain RDV !' : 'Vos anciens RDV apparaîtront ici.'}
              </p>
              {tab === 'upcoming' && (
                <button
                  onClick={() => router.push('/client/booking')}
                  className="mt-2 bg-[#C0392B] text-white rounded-xl px-6 py-2.5 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
                  Réserver
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {list.map(b => {
                const d = new Date(b.date+'T12:00')
                const dateLabel = d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
                const isPast    = d < new Date()
                const canCancel = (b.status === 'pending' || b.status === 'confirmed') && !isPast

                return (
                  <div key={b.id} className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
                    {/* Header carte */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-[#2C2C2C] capitalize">{dateLabel}</p>
                        <p className="text-sm text-[#7B7B7B] mt-0.5">{b.slot_time.slice(0,5)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CLASS[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>

                    <div className="border-t border-[#F2E8DC] pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7B7B7B]">Coiffeur</span>
                        <span className="font-medium text-[#2C2C2C]">{b.barber.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7B7B7B]">Prestation</span>
                        <span className="font-medium text-[#2C2C2C]">{b.service.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7B7B7B]">Durée</span>
                        <span className="font-medium text-[#2C2C2C]">{b.service.duration_min} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7B7B7B]">Prix</span>
                        <span className="font-semibold text-[#C0392B]">{b.service.price_chf} CHF</span>
                      </div>
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="w-full mt-4 border border-[#C0392B] text-[#C0392B] rounded-xl py-2 text-sm font-medium hover:bg-[#FADBD8] transition-colors">
                        Annuler ce rendez-vous
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}