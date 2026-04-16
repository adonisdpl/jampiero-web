import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

// Cette route est appelée chaque jour par un cron Vercel
export async function GET() {
  const supabase = createClient()

  // Trouve tous les RDV confirmés pour demain
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, date, slot_time, client_name, client_email,
      service:services(name, price_chf),
      barber:barbers(name)
    `)
    .eq('date', tomorrowStr)
    .eq('status', 'confirmed')
    .not('client_email', 'is', null)

  if (error) return NextResponse.json({ error }, { status: 400 })

  const dateLabel = tomorrow.toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  let sent = 0
  for (const b of (bookings ?? [])) {
    const slot = (b.slot_time as string).slice(0, 5)
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#FDF6EC;border-radius:16px;overflow:hidden">
        <div style="background:#D4AC0D;padding:32px 24px;text-align:center">
          <p style="color:white;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Jampiero BarberoShop</p>
          <h1 style="color:white;font-size:24px;margin:0;font-style:italic">Rappel — Demain à ${slot} ⏰</h1>
        </div>
        <div style="padding:24px">
          <p style="color:#2C2C2C;font-size:15px">Bonjour <strong>${b.client_name}</strong>,</p>
          <p style="color:#7B7B7B;font-size:14px;line-height:1.6">Nous vous rappelons votre rendez-vous de demain :</p>
          <div style="background:white;border:1px solid #E8D5C4;border-radius:12px;padding:20px;margin:20px 0">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Coiffeur</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC">${(b.barber as any)?.name}</td></tr>
              <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Prestation</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC">${(b.service as any)?.name}</td></tr>
              <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Date</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC;text-transform:capitalize">${dateLabel}</td></tr>
              <tr><td style="color:#7B7B7B;padding:8px 0">Heure</td><td style="font-weight:700;color:#C0392B;text-align:right;padding:8px 0">${slot}</td></tr>
            </table>
          </div>
          <p style="color:#7B7B7B;font-size:13px;line-height:1.6">En cas d'empêchement, contactez-nous le plus tôt possible :</p>
          <p style="color:#7B7B7B;font-size:13px">📞 <a href="tel:+41220000000" style="color:#C0392B">+41 22 000 00 00</a></p>
          <p style="color:#7B7B7B;font-size:13px">📍 12 Rue de Rive, 1204 Genève</p>
        </div>
        <div style="background:#922B21;padding:16px;text-align:center">
          <p style="color:white;font-size:11px;margin:0;opacity:0.8">República Dominicana 🇩🇴 · Genève</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from:    'Jampiero BarberoShop <onboarding@resend.dev>',
      to:      b.client_email as string,
      subject: `⏰ Rappel — Demain à ${slot} chez Jampiero`,
      html,
    })
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}