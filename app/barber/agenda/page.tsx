'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function getSlotsForDate(dateStr: string): string[] {
  const day = new Date(dateStr + 'T12:00').getDay()
  if (day === 6) return [
    '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
    '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'
  ]
  return [
    '10:00','10:30','11:00','11:30','12:00','12:30',
    '14:00','14:30','15:00','15:30','16:00','16:30',
    '17:00','17:30','18:00','18:30','19:00','19:30'
  ]
}

function ds(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface SlotState { time: string; isBlocked: boolean; isBooked: boolean }
interface BarberOption { id: string; name: string }

export default function BarberAgendaPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [barberId, setBarberId] = useState<string | null>(null)
  const [allBarbers, setAllBarbers] = useState<BarberOption[]>([])

  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [slots, setSlots]     = useState<SlotState[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/barber/login'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role === 'super_admin') {
        setIsAdmin(true)
        const { data: bs } = await supabase.from('barbers').select('id, name').order('name')
        const list = (bs as any) ?? []
        setAllBarbers(list)
        if (list.length > 0) setBarberId(list[0].id)
      } else {
        const { data: barber } = await supabase.from('barbers').select('id').eq('profile_id', user.id).single()
        if (barber) setBarberId(barber.id)
      }
    })
  }, [])

  const fetchSlots = useCallback(async (date: string) => {
    if (!barberId) return
    setLoading(true)
    const [{ data: blocked }, { data: booked }] = await Promise.all([
      supabase.from('availability').select('slot_time').eq('barber_id', barberId).eq('date', date).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time').eq('barber_id', barberId).eq('date', date).neq('status', 'cancelled'),
    ])
    const blockedSet = new Set((blocked ?? []).map((r: any) => r.slot_time.slice(0,5)))
    const bookedSet  = new Set((booked  ?? []).map((r: any) => r.slot_time.slice(0,5)))
    setSlots(getSlotsForDate(date).map(t => ({ time:t, isBlocked: blockedSet.has(t), isBooked: bookedSet.has(t) })))
    setLoading(false)
  }, [barberId])

  useEffect(() => { if (selDate && barberId) fetchSlots(selDate) }, [selDate, barberId, fetchSlots])

  async function blockSlot(slotTime: string) {
    if (!barberId || !selDate) return
    await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate).eq('slot_time', slotTime)
    await supabase.from('availability').insert({ barber_id: barberId, date: selDate, slot_time: slotTime, is_blocked: true })
  }

  async function unblockSlot(slotTime: string) {
    if (!barberId || !selDate) return
    await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate).eq('slot_time', slotTime)
  }

  async function toggleSlot(slot: SlotState) {
    if (slot.isBooked) { alert('Ce créneau est déjà réservé.'); return }
    setSaving(slot.time)
    if (slot.isBlocked) await unblockSlot(slot.time + ':00')
    else await blockSlot(slot.time + ':00')
    setSaving(null)
    if (selDate) fetchSlots(selDate)
  }

  async function blockFullDay() {
    if (!selDate || !confirm('Bloquer tous les créneaux libres ?')) return
    setLoading(true)
    for (const slot of slots.filter(s => !s.isBooked && !s.isBlocked)) await blockSlot(slot.time + ':00')
    fetchSlots(selDate)
  }

  async function unblockFullDay() {
    if (!selDate || !confirm('Débloquer tous les créneaux ?')) return
    setLoading(true)
    await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate).eq('is_blocked', true)
    fetchSlots(selDate)
  }

  function prevMonth() { month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1); setSelDate(null) }
  function nextMonth() { month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1); setSelDate(null) }

  const daysInMonth  = new Date(year, month+1, 0).getDate()
  const firstDow     = (new Date(year, month, 1).getDay() + 6) % 7
  const selDateLabel = selDate ? new Date(selDate+'T12:00').toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' }) : null
  const freeCount    = slots.filter(s => !s.isBlocked && !s.isBooked).length
  const bookedCount  = slots.filter(s => s.isBooked).length
  const blockedCount = slots.filter(s => s.isBlocked).length

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/barber/dashboard')} className="text-[#888] text-sm hover:text-[#D4AC0D] transition-colors">
            ← Dashboard
          </button>
          <p className="text-[#F0EDE8] italic text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Agenda</p>
          {isAdmin ? (
            <button onClick={() => router.push('/barber/admin')}
              className="text-[#D4AC0D] text-sm border border-[#D4AC0D] rounded-lg px-3 py-1.5 hover:bg-[#1A1500] transition-colors">
              ⚙ Admin
            </button>
          ) : <div className="w-16" />}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Sélecteur coiffeur (admin only) */}
        {isAdmin && (
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-4 mb-4">
            <label className="text-xs text-[#D4AC0D] tracking-widest uppercase block mb-2">Coiffeur</label>
            <select value={barberId ?? ''} onChange={e => { setBarberId(e.target.value); setSelDate(null) }}
              className="w-full border border-[#2E2E2E] rounded-lg px-4 py-3 text-sm bg-[#0D0D0D] text-[#F0EDE8] outline-none focus:border-[#D4AC0D]">
              {allBarbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

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
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDow).fill(null).map((_,i) => <div key={'e'+i} />)}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const d    = new Date(year, month, i+1)
              const date = ds(d)
              const isSelected = date === selDate
              const isSunday   = d.getDay() === 0
              const isPast     = d < today
              return (
                <button key={date} disabled={isSunday || isPast} onClick={() => setSelDate(date === selDate ? null : date)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                    ${isSelected ? 'bg-[#D4AC0D] text-[#0D0D0D] font-bold' :
                      isPast || isSunday ? 'text-[#333] cursor-not-allowed' :
                      'hover:bg-[#1A1500] text-[#F0EDE8] hover:text-[#D4AC0D]'}`}>
                  {i+1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Détail jour */}
        {selDate && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#D4AC0D] tracking-widest uppercase capitalize">{selDateLabel}</p>
              <div className="flex gap-2">
                <button onClick={blockFullDay} className="text-xs text-[#C0392B] border border-[#C0392B] rounded-lg px-2 py-1 hover:bg-[#2A0A08] transition-colors">Tout bloquer</button>
                <button onClick={unblockFullDay} className="text-xs text-[#1D9E75] border border-[#1D9E75] rounded-lg px-2 py-1 hover:bg-[#0A2A1E] transition-colors">Tout débloquer</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#1D9E75]">{freeCount}</p>
                <p className="text-xs text-[#555]">Libres</p>
              </div>
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#D4AC0D]">{bookedCount}</p>
                <p className="text-xs text-[#555]">Réservés</p>
              </div>
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#C0392B]">{blockedCount}</p>
                <p className="text-xs text-[#555]">Bloqués</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#D4AC0D] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pb-8">
                {slots.map(slot => {
                  const isLoading = saving === slot.time
                  return (
                    <button key={slot.time} onClick={() => toggleSlot(slot)} disabled={slot.isBooked || isLoading}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all
                        ${slot.isBooked ? 'bg-[#1A1500] text-[#D4AC0D] border-[#D4AC0D]/30 cursor-not-allowed' :
                          slot.isBlocked ? 'bg-[#2A0A08] text-[#C0392B] border-[#C0392B]/40' :
                          'bg-[#1A1A1A] text-[#F0EDE8] border-[#2E2E2E] hover:border-[#D4AC0D]'}`}>
                      {isLoading ? '...' : slot.time}
                      <span className="block text-[10px] font-normal mt-0.5 opacity-70">
                        {slot.isBooked ? 'Réservé' : slot.isBlocked ? 'Bloqué' : 'Libre'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}