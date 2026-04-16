'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  date: string
  slot_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  note: string | null
  client_name:  string | null
  client_phone: string | null
  client_email: string | null
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

export default function BarberDashboardPage() {
  const router    = useRouter()
  const [barberId, setBarberId]   = useState<string | null>(null)
  const [barberName, setBarberName] = useState('Jampiero')
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(true)
  const [selDate, setSelDate]     = useState(new Date())

  const ds = (d: Date) => d.toISOString().split('T')[0]
  const dateLabel = (d: Date) => d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' })
  const isToday   = ds(selDate) === ds(new Date())

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      const { data: barber } = await supabase
        .from('barbers').select('id, name').eq('profile_id', user.id).single()
      if (barber) { setBarberId(barber.id); setBarberName(barber.name) }
    })
  }, [])

  const fetchBookings = useCallback(async () => {
    if (!barberId) return
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`id, date, slot_time, status, note,
        client_name, client_phone, client_email,
        service:services(name, price_chf, duration_min)`)
      .eq('barber_id', barberId)
      .eq('date', ds(selDate))
      .neq('status', 'cancelled')
      .order('slot_time')
    setBookings((data as any) ?? [])
    setLoading(false)
  }, [barberId, selDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    if (!barberId) return
    const ch = supabase.channel(`dashboard:${barberId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'bookings', filter:`barber_id=eq.${barberId}` }, fetchBookings)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [barberId, fetchBookings])

  async function updateStatus(id: string, status: 'confirmed' | 'done' | 'cancelled') {
    const labels = { confirmed:'Confirmer', done:'Marquer terminé', cancelled:'Annuler' }
    if (!confirm(`${labels[status]} ce RDV ?`)) return

    await supabase.from('bookings').update({ status }).eq('id', id)

    // Email d'annulation si le client a fourni un email
    if (status === 'cancelled') {
      const booking = bookings.find(b => b.id === id)
      if (booking?.client_email) {
        await fetch('/api/send-cancellation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName:  booking.client_name,
            clientEmail: booking.client_email,
            barberName,
            serviceName: booking.service.name,
            date:        booking.date,
            slot:        booking.slot_time.slice(0, 5),
          })
        })
      }
    }

    fetchBookings()
  }

  function prevDay() { const d = new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d) }
  function nextDay() { const d = new Date(selDate); d.setDate(d.getDate()+1); setSelDate(d) }

  const total     = bookings.reduce((sum, b) => sum + b.service.price_chf, 0)
  const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'done').length

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <div className="bg-[#C0392B] px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white italic text-lg" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/barber/agenda')}
              className="text-white/80 text-sm hover:text-white border border-white/30 rounded-lg px-3 py-1.5">
              🗓 Agenda
            </button>
            <button onClick={() => router.push('/barber/profile')}
              className="text-white/80 text-sm hover:text-white border border-white/30 rounded-lg px-3 py-1.5">
              👤 Profil
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
          <button onClick={prevDay} className="text-white text-xl hover:text-[#D4AC0D] transition-colors">←</button>
          <div className="text-center">
            <button onClick={() => setSelDate(new Date())}>
              <p className="text-white font-medium capitalize">{dateLabel(selDate)}</p>
              {isToday && <p className="text-[#D4AC0D] text-xs tracking-widest mt-0.5">Aujourd'hui</p>}
            </button>
          </div>
          <button onClick={nextDay} className="text-white text-xl hover:text-[#D4AC0D] transition-colors">→</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[#C0392B]">{bookings.length}</p>
            <p className="text-xs text-[#7B7B7B] tracking-wide mt-1">RDV total</p>
          </div>
          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[#C0392B]">{confirmed}</p>
            <p className="text-xs text-[#7B7B7B] tracking-wide mt-1">Confirmés</p>
          </div>
          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[#C0392B]">{total}</p>
            <p className="text-xs text-[#7B7B7B] tracking-wide mt-1">CHF</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📅</span>
            <p className="text-[#2C2C2C] font-semibold">Aucun rendez-vous ce jour</p>
            <p className="text-sm text-[#7B7B7B]">Profitez de votre journée !</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {bookings.map(b => (
              <div key={b.id} className="bg-white border border-[#E8D5C4] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-3xl font-bold text-[#C0392B]">{b.slot_time.slice(0,5)}</p>
                    <p className="font-semibold text-[#2C2C2C] mt-1">{b.client_name ?? 'Client'}</p>
                    {b.client_phone && <p className="text-sm text-[#7B7B7B]">📞 {b.client_phone}</p>}
                    {b.client_email && <p className="text-sm text-[#7B7B7B]">✉ {b.client_email}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CLASS[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>

                <div className="flex justify-between text-sm border-t border-[#F2E8DC] pt-3 mb-3">
                  <span className="text-[#7B7B7B]">{b.service.name}</span>
                  <span className="font-semibold">{b.service.duration_min} min · {b.service.price_chf} CHF</span>
                </div>

                {b.note && <p className="text-sm text-[#7B7B7B] italic mb-3">📝 {b.note}</p>}

                <div className="flex gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(b.id, 'confirmed')}
                        className="flex-1 bg-[#1D9E75] text-white rounded-xl py-2 text-xs font-semibold hover:bg-[#0F6E56] transition-colors">
                        Confirmer
                      </button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')}
                        className="flex-1 border border-[#C0392B] text-[#C0392B] rounded-xl py-2 text-xs font-semibold hover:bg-[#FADBD8] transition-colors">
                        Annuler
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <button onClick={() => updateStatus(b.id, 'done')}
                        className="flex-1 bg-[#D4AC0D] text-white rounded-xl py-2 text-xs font-semibold hover:bg-[#9A7D0A] transition-colors">
                        Marquer terminé
                      </button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')}
                        className="flex-1 border border-[#C0392B] text-[#C0392B] rounded-xl py-2 text-xs font-semibold hover:bg-[#FADBD8] transition-colors">
                        Annuler
                      </button>
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