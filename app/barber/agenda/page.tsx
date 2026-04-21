'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Créneaux selon le jour (lun-ven vs sam)
function getSlotsForDate(dateStr: string): string[] {
  const day = new Date(dateStr + 'T12:00').getDay() // 0=dim, 6=sam
  if (day === 6) {
    // Samedi : 09h00 - 19h00
    return [
      '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
      '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
      '18:00','18:30'
    ]
  }
  // Lundi - Vendredi : 10h00 - 20h00
  return [
    '10:00','10:30','11:00','11:30','12:00','12:30',
    '14:00','14:30','15:00','15:30','16:00','16:30',
    '17:00','17:30','18:00','18:30','19:00','19:30'
  ]
}
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

interface SlotState { time: string; isBlocked: boolean; isBooked: boolean }

export default function BarberAgendaPage() {
  const router = useRouter()
  const [barberId, setBarberId] = useState<string | null>(null)
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [slots, setSlots]     = useState<SlotState[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState<string | null>(null)

  const ds = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
if (!user) { router.replace('/barber/login'); return }      const { data: barber } = await supabase
        .from('barbers').select('id').eq('profile_id', user.id).single()
      if (barber) setBarberId(barber.id)
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
    setSlots(getSlotsForDate(selDate!).map(t => ({ time:t, isBlocked: blockedSet.has(t), isBooked: bookedSet.has(t) })))
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
    if (slot.isBooked) { alert('Ce créneau est déjà réservé par un client.'); return }
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
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <div className="bg-[#C0392B] px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.push('/barber/dashboard')} className="text-white/80 text-sm hover:text-white">← Dashboard</button>
          <p className="text-white italic text-lg" style={{ fontFamily: 'Georgia, serif' }}>Agenda</p>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 pb-12">
        {/* Calendrier */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 mb-4">
          {/* Nav mois */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-[#C0392B] text-xl px-2 hover:bg-[#FADBD8] rounded-lg transition-colors">←</button>
            <span className="font-semibold text-[#2C2C2C]">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} className="text-[#C0392B] text-xl px-2 hover:bg-[#FADBD8] rounded-lg transition-colors">→</button>
          </div>

          {/* Légende */}
          <div className="flex gap-4 mb-3 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-400" /><span className="text-xs text-[#7B7B7B]">Libre</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-[#7B7B7B]">Bloqué</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-xs text-[#7B7B7B]">Réservé</span></div>
          </div>

          {/* Jours */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs text-[#7B7B7B] tracking-wider py-1">{d}</div>)}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7">
            {Array(firstDow).fill(null).map((_,i) => <div key={'e'+i} />)}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const d    = new Date(year, month, i+1)
              const date = ds(d)
              const past   = d < today
              const sunday = d.getDay() === 0
              const sel    = date === selDate
              const off    = past || sunday
              return (
                <button key={date} disabled={off} onClick={() => setSelDate(date)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg m-0.5 transition-all font-medium
                    ${sel  ? 'bg-[#C0392B] text-white' :
                      off  ? 'text-[#BDBDBD] cursor-not-allowed' :
                      'hover:bg-[#FADBD8] text-[#2C2C2C]'}`}>
                  {i+1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Gestion créneaux */}
        {selDate && (
          <div>
            <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-3 capitalize">{selDateLabel}</p>

            {/* Stats */}
            <div className="flex gap-2 mb-3">
              <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">{freeCount} libre{freeCount>1?'s':''}</span>
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">{bookedCount} réservé{bookedCount>1?'s':''}</span>
              <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">{blockedCount} bloqué{blockedCount>1?'s':''}</span>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 mb-4">
              <button onClick={blockFullDay}
                className="flex-1 bg-[#C0392B] text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide hover:bg-[#922B21] transition-colors">
                Bloquer la journée
              </button>
              <button onClick={unblockFullDay}
                className="flex-1 border border-[#1D9E75] text-[#1D9E75] rounded-xl py-2.5 text-xs font-semibold hover:bg-[#E1F5EE] transition-colors">
                Débloquer tout
              </button>
            </div>

            {/* Créneaux */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map(slot => (
                  <button key={slot.time}
                    onClick={() => toggleSlot(slot)}
                    disabled={saving === slot.time}
                    className={`rounded-xl p-3 text-center border-2 transition-all
                      ${slot.isBooked  ? 'bg-amber-50 border-amber-300 cursor-not-allowed' :
                        slot.isBlocked ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                        'bg-green-50 border-green-300 hover:bg-green-100'}`}>
                    {saving === slot.time ? (
                      <div className="w-4 h-4 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <p className={`font-bold text-sm ${slot.isBooked ? 'text-amber-700' : slot.isBlocked ? 'text-red-700' : 'text-green-700'}`}>
                          {slot.time}
                        </p>
                        <p className={`text-xs mt-0.5 ${slot.isBooked ? 'text-amber-600' : slot.isBlocked ? 'text-red-500' : 'text-green-600'}`}>
                          {slot.isBooked ? 'Réservé' : slot.isBlocked ? 'Bloqué' : 'Libre'}
                        </p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-center text-xs text-[#BDBDBD] mt-4">Appuyez sur un créneau pour le bloquer ou débloquer</p>
          </div>
        )}
      </div>
    </div>
  )
}