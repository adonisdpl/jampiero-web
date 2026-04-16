'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Barber  { id: string; name: string }
interface Service { id: string; name: string; duration_min: number; price_chf: number }

const SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

type Step = 'barber' | 'service' | 'calendar' | 'info' | 'done'

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep]               = useState<Step>('barber')
  const [barber, setBarber]           = useState<Barber | null>(null)
  const [service, setService]         = useState<Service | null>(null)
  const [date, setDate]               = useState<string | null>(null)
  const [slot, setSlot]               = useState<string | null>(null)
  const [clientName, setClientName]   = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const steps: Step[] = ['barber','service','calendar','info']
  const stepIdx = steps.indexOf(step)

  async function confirm() {
    if (!clientName || !clientPhone) { setError('Veuillez remplir votre prénom et téléphone.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('bookings').insert({
        barber_id:    barber!.id,
        service_id:   service!.id,
        date,
        slot_time:    slot + ':00',
        status:       'pending',
        client_name:  clientName,
        client_phone: clientPhone,
        client_email: clientEmail || null,
        client_id:    null,
      })
      if (error) throw error
      setStep('done')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#C0392B] rounded-full flex items-center justify-center text-4xl text-white mb-6">✓</div>
      <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">Rendez-vous confirmé !</h2>
      <p className="text-[#7B7B7B] text-sm mb-6">Nous avons hâte de vous accueillir, {clientName} !</p>
      <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5 w-full max-w-sm mb-6 text-left space-y-3">
        {[
          { label: 'Coiffeur',   value: barber?.name },
          { label: 'Prestation', value: service?.name },
          { label: 'Date',       value: date ? new Date(date+'T12:00').toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'}) : '' },
          { label: 'Heure',      value: slot },
          { label: 'Prix',       value: `${service?.price_chf} CHF` },
          { label: 'Téléphone',  value: clientPhone },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm border-b border-[#F2E8DC] pb-2 last:border-0">
            <span className="text-[#7B7B7B]">{label}</span>
            <span className="font-semibold text-[#2C2C2C]">{value}</span>
          </div>
        ))}
      </div>
      {clientEmail && (
        <p className="text-sm text-[#7B7B7B] mb-6">
          Une confirmation a été envoyée à <span className="text-[#C0392B] font-medium">{clientEmail}</span>
        </p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button onClick={() => router.push('/')}
          className="w-full bg-[#C0392B] text-white rounded-xl py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
          Retour à l'accueil
        </button>
        <button onClick={() => { setStep('barber'); setBarber(null); setService(null); setDate(null); setSlot(null); setClientName(''); setClientPhone(''); setClientEmail('') }}
          className="w-full border border-[#E8D5C4] rounded-xl py-3 text-sm text-[#7B7B7B] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors">
          Nouvelle réservation
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <div className="bg-[#C0392B] px-6 pt-6 pb-10">
        <div className="max-w-lg mx-auto">
          <button onClick={() => step === 'barber' ? router.push('/') : setStep(steps[stepIdx-1])}
            className="text-white/80 text-sm mb-3 hover:text-white">← Retour</button>
          <p className="text-white italic text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Réservation</p>
          <p className="text-white/70 text-xs mt-1 mb-4">Sans compte · Sans mot de passe</p>
          <div className="flex gap-2">
            {steps.map((s,i) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= stepIdx ? 'bg-[#D4AC0D]' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'barber'   && <StepBarber   onSelect={b  => { setBarber(b);   setStep('service')  }} />}
        {step === 'service'  && <StepService  onSelect={sv => { setService(sv); setStep('calendar') }} />}
        {step === 'calendar' && barber && (
          <StepCalendar barberId={barber.id} onSelect={(d,sl) => { setDate(d); setSlot(sl); setStep('info') }} />
        )}
        {step === 'info' && (
          <div>
            <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">Vos coordonnées</p>
            <div className="bg-[#FADBD8] border border-[#C0392B]/20 rounded-2xl p-4 mb-5 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-[#7B7B7B]">Coiffeur</span><span className="font-medium">{barber?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#7B7B7B]">Prestation</span><span className="font-medium">{service?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#7B7B7B]">Date</span><span className="font-medium">{date && new Date(date+'T12:00').toLocaleDateString('fr-CH',{weekday:'short',day:'numeric',month:'short'})}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#7B7B7B]">Heure</span><span className="font-medium text-[#C0392B]">{slot}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#7B7B7B]">Prix</span><span className="font-bold text-[#C0392B]">{service?.price_chf} CHF</span></div>
            </div>
            <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5 mb-4 space-y-4">
              <div>
                <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">Prénom et nom <span className="text-[#C0392B]">*</span></label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Marie Dupont"
                  className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">Téléphone <span className="text-[#C0392B]">*</span></label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+41 79 000 00 00"
                  className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#7B7B7B] tracking-widest uppercase block mb-1.5">
                  Email <span className="text-[#BDBDBD] font-normal normal-case">(optionnel — pour recevoir la confirmation)</span>
                </label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="marie@email.com"
                  className="w-full border border-[#E8D5C4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#C0392B] bg-[#FDF6EC] transition-colors" />
              </div>
            </div>
            {error && <p className="text-sm text-[#C0392B] bg-[#FADBD8] rounded-xl px-4 py-2 mb-4">{error}</p>}
            <button onClick={confirm} disabled={loading}
              className="w-full bg-[#C0392B] text-white rounded-xl py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors disabled:opacity-60">
              {loading ? '...' : 'Confirmer le rendez-vous'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepBarber({ onSelect }: { onSelect: (b: Barber) => void }) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('barbers').select('*').eq('active', true)
      .then(({ data }) => { setBarbers(data ?? []); setLoading(false) })
  }, [])
  return (
    <div>
      <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">Choisissez votre coiffeur</p>
      {loading ? <Spinner /> : barbers.map(b => (
        <button key={b.id} onClick={() => onSelect(b)}
          className="w-full flex items-center gap-4 bg-white border border-[#E8D5C4] rounded-2xl p-4 mb-3 hover:border-[#C0392B] hover:bg-[#FADBD8] transition-all text-left">
          <div className="w-12 h-12 rounded-full bg-[#FADBD8] border-2 border-[#C0392B] flex items-center justify-center text-[#C0392B] font-bold text-lg flex-shrink-0">{b.name[0]}</div>
          <span className="font-medium text-[#2C2C2C] flex-1">{b.name}</span>
          <span className="text-[#BDBDBD]">→</span>
        </button>
      ))}
    </div>
  )
}

function StepService({ onSelect }: { onSelect: (s: Service) => void }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)
  useEffect(() => {
    supabase.from('services').select('*').eq('active', true)
      .then(({ data }) => { setServices(data ?? []); setLoading(false) })
  }, [])
  return (
    <div>
      <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">Choisissez une prestation</p>
      {loading ? <Spinner /> : services.map(sv => (
        <button key={sv.id} onClick={() => onSelect(sv)}
          className="w-full flex items-center gap-4 bg-white border border-[#E8D5C4] rounded-2xl p-4 mb-3 hover:border-[#C0392B] hover:bg-[#FADBD8] transition-all text-left">
          <div className="flex-1">
            <p className="font-medium text-[#2C2C2C]">{sv.name}</p>
            <p className="text-sm text-[#7B7B7B] mt-0.5">{sv.duration_min} min</p>
          </div>
          <span className="text-[#C0392B] font-bold">{sv.price_chf} CHF</span>
          <span className="text-[#BDBDBD]">→</span>
        </button>
      ))}
    </div>
  )
}

function StepCalendar({ barberId, onSelect }: { barberId: string; onSelect: (date: string, slot: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [taken, setTaken]     = useState<string[]>([])
  const [loadingSlots, setLS] = useState(false)
  const ds = (d: Date) => d.toISOString().split('T')[0]

  async function pickDate(d: Date) {
    const s = ds(d); setSelDate(s); setSelSlot(null); setLS(true)
    const [{ data: bl }, { data: bk }] = await Promise.all([
      supabase.from('availability').select('slot_time').eq('barber_id', barberId).eq('date', s).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time').eq('barber_id', barberId).eq('date', s).neq('status', 'cancelled'),
    ])
    setTaken([...(bl??[]).map((r:any)=>r.slot_time.slice(0,5)), ...(bk??[]).map((r:any)=>r.slot_time.slice(0,5))])
    setLS(false)
  }

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7

  return (
    <div>
      <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-4">Choisissez une date</p>
      <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1); setSelDate(null) }} className="text-[#C0392B] text-xl px-2 hover:bg-[#FADBD8] rounded-lg">←</button>
          <span className="font-semibold text-[#2C2C2C]">{MONTHS[month]} {year}</span>
          <button onClick={() => { month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1); setSelDate(null) }} className="text-[#C0392B] text-xl px-2 hover:bg-[#FADBD8] rounded-lg">→</button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs text-[#7B7B7B] py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array(firstDow).fill(null).map((_,i) => <div key={'e'+i} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d = new Date(year, month, i+1), s = ds(d)
            const past = d < today, sun = d.getDay()===0, sel = s===selDate, off = past||sun
            return (
              <button key={s} disabled={off} onClick={() => pickDate(d)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg m-0.5 transition-all
                  ${sel ? 'bg-[#C0392B] text-white font-bold' : off ? 'text-[#BDBDBD] cursor-not-allowed' : 'hover:bg-[#FADBD8] text-[#2C2C2C]'}`}>
                {i+1}
              </button>
            )
          })}
        </div>
      </div>
      {selDate && (
        <div>
          <p className="text-xs font-semibold text-[#C0392B] tracking-widest uppercase mb-3">Créneaux disponibles</p>
          {loadingSlots ? <Spinner /> : (
            <div className="flex flex-wrap gap-2 mb-4">
              {SLOTS.map(s => {
                const isTaken = taken.includes(s), isSel = s===selSlot
                return (
                  <button key={s} disabled={isTaken} onClick={() => setSelSlot(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
                      ${isSel ? 'bg-[#C0392B] text-white border-[#C0392B]' :
                        isTaken ? 'bg-[#F2E8DC] text-[#BDBDBD] border-[#E8D5C4] line-through cursor-not-allowed' :
                        'bg-white text-[#2C2C2C] border-[#E8D5C4] hover:border-[#C0392B]'}`}>
                    {s}
                  </button>
                )
              })}
            </div>
          )}
          {selSlot && (
            <button onClick={() => onSelect(selDate, selSlot)}
              className="w-full bg-[#C0392B] text-white rounded-xl py-3 text-sm font-semibold tracking-widest uppercase hover:bg-[#922B21] transition-colors">
              Continuer →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}