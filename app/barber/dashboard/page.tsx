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
  pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé', done: 'Terminé',
}
const STATUS_CLASS: Record<string, string> = {
  pending:   'bg-[#1A1500] text-[#D4AC0D]',
  confirmed: 'bg-[#0A2A1E] text-[#1D9E75]',
  cancelled: 'bg-[#2A0A08] text-[#C0392B]',
  done:      'bg-[#1A1A1A] text-[#555]',
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function ds(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function BarberDashboardPage() {
  const router = useRouter()
  const [barberId, setBarberId]     = useState<string | null>(null)
  const [barberName, setBarberName] = useState('Jampiero')
  const [year, setYear]             = useState(new Date().getFullYear())
  const [month, setMonth]           = useState(new Date().getMonth())
  const [selDate, setSelDate]       = useState<string | null>(null)
  const [monthBookings, setMonthBookings] = useState<Booking[]>([])
  const [loadingMonth, setLoadingMonth]   = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/barber/login'); return }
      const { data: barber } = await supabase.from('barbers').select('id, name').eq('profile_id', user.id).single()
      if (barber) { setBarberId(barber.id); setBarberName(barber.name) }
    })
  }, [])

  const fetchMonthBookings = useCallback(async () => {
    if (!barberId) return
    setLoadingMonth(true)
    const firstDay = `${year}-${String(month+1).padStart(2,'0')}-01`
    const lastDay  = `${year}-${String(month+1).padStart(2,'0')}-${new Date(year,month+1,0).getDate()}`
    const { data } = await supabase.from('bookings')
      .select(`id, date, slot_time, status, note, client_name, client_phone, client_email,
        service:services(name, price_chf, duration_min)`)
      .eq('barber_id', barberId).gte('date', firstDay).lte('date', lastDay)
      .neq('status', 'cancelled').order('slot_time')
    setMonthBookings((data as any) ?? [])
    setLoadingMonth(false)
  }, [barberId, year, month])

  useEffect(() => { fetchMonthBookings() }, [fetchMonthBookings])

  useEffect(() => {
    if (!barberId) return
    const ch = supabase.channel(`dashboard:${barberId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'bookings', filter:`barber_id=eq.${barberId}` }, fetchMonthBookings)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [barberId, fetchMonthBookings])

  async function updateStatus(id: string, status: 'confirmed' | 'done' | 'cancelled') {
    const labels = { confirmed:'Confirmer', done:'Marquer terminé', cancelled:'Annuler' }
    if (!confirm(`${labels[status]} ce RDV ?`)) return
    await supabase.from('bookings').update({ status }).eq('id', id)
    if (status === 'cancelled') {
      const booking = dayBookings.find(b => b.id === id)
      if (booking?.client_email) {
        await fetch('/api/send-cancellation', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientName: booking.client_name, clientEmail: booking.client_email,
            barberName, serviceName: booking.service.name, date: booking.date, slot: booking.slot_time.slice(0,5) })
        })
      }
    }
    fetchMonthBookings()
  }

  function prevMonth() { month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1); setSelDate(null) }
  function nextMonth() { month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1); setSelDate(null) }

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7
  const today       = ds(new Date())

  const bookingsByDate: Record<string, Booking[]> = {}
  monthBookings.forEach(b => { if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []; bookingsByDate[b.date].push(b) })

  const dayBookings = selDate ? (bookingsByDate[selDate] ?? []) : []
  const totalMonth    = monthBookings.length
  const confirmedMonth = monthBookings.filter(b => b.status==='confirmed'||b.status==='done').length
  const revenueMonth  = monthBookings.filter(b => b.status==='confirmed'||b.status==='done').reduce((s,b)=>s+b.service.price_chf,0)
  const selDateLabel  = selDate ? new Date(selDate+'T12:00').toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'}) : null

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <p className="text-[#F0EDE8] italic text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/barber/agenda')}
              className="text-[#888] text-sm hover:text-[#D4AC0D] border border-[#2E2E2E] rounded-lg px-3 py-1.5 hover:border-[#D4AC0D] transition-colors">
              🗓 Agenda
            </button>
            <button onClick={() => router.push('/barber/profile')}
              className="text-[#888] text-sm hover:text-[#D4AC0D] border border-[#2E2E2E] rounded-lg px-3 py-1.5 hover:border-[#D4AC0D] transition-colors">
              👤 Profil
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { val: totalMonth,    lbl: 'RDV ce mois' },
            { val: confirmedMonth, lbl: 'Confirmés' },
            { val: `${revenueMonth} CHF`, lbl: 'Revenus' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-[#D4AC0D]">{val}</p>
              <p className="text-xs text-[#555] tracking-wide mt-1">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Calendrier */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-[#D4AC0D] text-xl px-2 hover:bg-[#1A1500] rounded-lg transition-colors">←</button>
            <p className="font-semibold text-[#F0EDE8]">{MONTHS[month]} {year}</p>
            <button onClick={nextMonth} className="text-[#D4AC0D] text-xl px-2 hover:bg-[#1A1500] rounded-lg transition-colors">→</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs text-[#555] tracking-wider py-1">{d}</div>)}
          </div>
          {loadingMonth ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDow).fill(null).map((_,i) => <div key={'e'+i} />)}
              {Array(daysInMonth).fill(null).map((_,i) => {
                const d    = new Date(year, month, i+1)
                const date = ds(d)
                const rdvs = bookingsByDate[date] ?? []
                const isToday    = date === today
                const isSelected = date === selDate
                const isSunday   = d.getDay() === 0
                const hasPending = rdvs.some(b => b.status === 'pending')
                const hasRdv     = rdvs.length > 0
                return (
                  <button key={date} onClick={() => setSelDate(date === selDate ? null : date)}
                    className={`relative flex flex-col items-center justify-center rounded-xl p-1 min-h-[44px] transition-all
                      ${isSelected ? 'bg-[#D4AC0D] text-[#0D0D0D]' :
                        isToday    ? 'bg-[#1A1500] border border-[#D4AC0D] text-[#D4AC0D]' :
                        isSunday   ? 'text-[#333]' :
                        hasRdv     ? 'hover:bg-[#1A1500]' : 'hover:bg-[#242424]'}`}>
                    <span className={`text-sm ${isSelected ? 'text-[#0D0D0D] font-bold' : isToday ? 'text-[#D4AC0D] font-bold' : isSunday ? 'text-[#333]' : 'text-[#F0EDE8]'}`}>
                      {i+1}
                    </span>
                    {hasRdv && (
                      <div className="flex gap-0.5 mt-0.5">
                        {rdvs.slice(0,3).map((b,idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#0D0D0D]' : b.status==='pending' ? 'bg-[#D4AC0D]' : b.status==='confirmed' ? 'bg-[#1D9E75]' : 'bg-[#555]'}`} />
                        ))}
                      </div>
                    )}
                    {hasPending && !isSelected && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#D4AC0D] rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D4AC0D]" /><span className="text-xs text-[#555]">En attente</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1D9E75]" /><span className="text-xs text-[#555]">Confirmé</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#555]" /><span className="text-xs text-[#555]">Terminé</span></div>
          </div>
        </div>

        {/* Détail jour */}
        {selDate && (
          <div>
            <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase mb-3 capitalize">{selDateLabel}</p>
            {dayBookings.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-[#F0EDE8] font-semibold">Aucun rendez-vous</p>
                <p className="text-sm text-[#555] mt-1">Ce jour est libre</p>
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {dayBookings.map(b => (
                  <div key={b.id} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-3xl font-bold text-[#D4AC0D]">{b.slot_time.slice(0,5)}</p>
                        <p className="font-semibold text-[#F0EDE8] mt-1">{b.client_name ?? 'Client'}</p>
                        {b.client_phone && <p className="text-sm text-[#888]">📞 {b.client_phone}</p>}
                        {b.client_email && <p className="text-sm text-[#888]">✉ {b.client_email}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CLASS[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-[#2E2E2E] pt-3 mb-3">
                      <span className="text-[#888]">{b.service.name}</span>
                      <span className="font-semibold text-[#F0EDE8]">{b.service.duration_min} min · {b.service.price_chf} CHF</span>
                    </div>
                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'confirmed')}
                            className="flex-1 bg-[#1D9E75] text-white rounded-xl py-2 text-xs font-semibold hover:bg-[#0F6E56] transition-colors">Confirmer</button>
                          <button onClick={() => updateStatus(b.id, 'cancelled')}
                            className="flex-1 border border-[#C0392B] text-[#C0392B] rounded-xl py-2 text-xs font-semibold hover:bg-[#2A0A08] transition-colors">Annuler</button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'done')}
                            className="flex-1 bg-[#D4AC0D] text-[#0D0D0D] rounded-xl py-2 text-xs font-semibold hover:bg-[#F0C93A] transition-colors">Marquer terminé</button>
                          <button onClick={() => updateStatus(b.id, 'cancelled')}
                            className="flex-1 border border-[#C0392B] text-[#C0392B] rounded-xl py-2 text-xs font-semibold hover:bg-[#2A0A08] transition-colors">Annuler</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}