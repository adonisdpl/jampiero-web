import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { clientName, clientEmail, barberName, serviceName, date, slot } = await req.json()

  if (!clientEmail) return NextResponse.json({ ok: true })

  const dateLabel = new Date(date + 'T12:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D0D0D;border-radius:16px;overflow:hidden">
      <div style="background:#1A1A1A;padding:32px 24px;text-align:center;border-bottom:1px solid #2E2E2E">
        <p style="color:#D4AC0D;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Jampiero BarberoShop</p>
        <h1 style="color:#F0EDE8;font-size:24px;margin:0;font-style:italic;font-family:Georgia,serif">Rendez-vous annulé</h1>
      </div>
      <div style="padding:24px">
        <p style="color:#F0EDE8;font-size:15px">Bonjour <strong>${clientName}</strong>,</p>
        <p style="color:#888;font-size:14px;line-height:1.6">Votre rendez-vous a bien été annulé :</p>
        <div style="background:#1A1A1A;border:1px solid #2E2E2E;border-radius:12px;padding:20px;margin:20px 0">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #2E2E2E">Coiffeur</td><td style="font-weight:600;color:#F0EDE8;text-align:right;padding:8px 0;border-bottom:1px solid #2E2E2E">${barberName}</td></tr>
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #2E2E2E">Prestation</td><td style="font-weight:600;color:#F0EDE8;text-align:right;padding:8px 0;border-bottom:1px solid #2E2E2E">${serviceName}</td></tr>
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #2E2E2E">Date</td><td style="font-weight:600;color:#F0EDE8;text-align:right;padding:8px 0;border-bottom:1px solid #2E2E2E;text-transform:capitalize">${dateLabel}</td></tr>
            <tr><td style="color:#888;padding:8px 0">Heure</td><td style="font-weight:600;color:#F0EDE8;text-align:right;padding:8px 0">${slot}</td></tr>
          </table>
        </div>
        <p style="color:#888;font-size:14px;line-height:1.6">N'hésitez pas à reprendre rendez-vous en ligne ou à nous contacter :</p>
        <p style="color:#888;font-size:13px">📞 <a href="tel:0772132310" style="color:#D4AC0D">077 213 23 10</a></p>
        <a href="https://jampiero-web.vercel.app/booking"
          style="display:inline-block;margin-top:16px;background:#D4AC0D;color:#0D0D0D;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px">
          Reprendre rendez-vous →
        </a>
      </div>
      <div style="background:#1A1A1A;border-top:1px solid #2E2E2E;padding:16px;text-align:center">
        <p style="color:#555;font-size:11px;margin:0">República Dominicana 🇩🇴 · Genève</p>
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from:    'Jampiero BarberoShop <onboarding@resend.dev>',
    to:      clientEmail,
    subject: `RDV annulé — ${dateLabel} à ${slot}`,
    html,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}