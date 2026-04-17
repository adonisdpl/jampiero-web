import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { barberEmail, barberName, clientName, clientPhone, clientEmail, serviceName, date, slot } = await req.json()

  const dateLabel = new Date(date + 'T12:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;overflow:hidden">
      <div style="background:#C0392B;padding:32px 24px;text-align:center">
        <p style="color:#D4AC0D;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Jampiero BarberoShop</p>
        <h1 style="color:white;font-size:22px;margin:0;font-style:italic">Nouvelle réservation 🔔</h1>
      </div>
      <div style="padding:24px;background:#222">
        <p style="color:#ccc;font-size:15px">Bonjour <strong style="color:white">${barberName}</strong>,</p>
        <p style="color:#888;font-size:14px;line-height:1.6">Un nouveau rendez-vous vient d'être réservé :</p>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #333">Client</td><td style="font-weight:600;color:white;text-align:right;padding:8px 0;border-bottom:1px solid #333">${clientName}</td></tr>
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #333">Téléphone</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #333"><a href="tel:${clientPhone}" style="color:#C0392B;font-weight:600">${clientPhone}</a></td></tr>
            ${clientEmail ? `<tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #333">Email</td><td style="color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid #333">${clientEmail}</td></tr>` : ''}
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #333">Prestation</td><td style="font-weight:600;color:white;text-align:right;padding:8px 0;border-bottom:1px solid #333">${serviceName}</td></tr>
            <tr><td style="color:#888;padding:8px 0;border-bottom:1px solid #333">Date</td><td style="font-weight:600;color:white;text-align:right;padding:8px 0;border-bottom:1px solid #333;text-transform:capitalize">${dateLabel}</td></tr>
            <tr><td style="color:#888;padding:8px 0">Heure</td><td style="font-weight:700;color:#D4AC0D;text-align:right;padding:8px 0;font-size:18px">${slot}</td></tr>
          </table>
        </div>

        <div style="text-align:center;margin-top:16px">
          <a href="https://jampiero-web.vercel.app/barber/dashboard"
            style="display:inline-block;background:#C0392B;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:1px">
            Voir le dashboard →
          </a>
        </div>
      </div>
      <div style="background:#111;padding:16px;text-align:center">
        <p style="color:#444;font-size:11px;margin:0">República Dominicana 🇩🇴 · Genève</p>
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from:    'Jampiero BarberoShop <onboarding@resend.dev>',
    to:      barberEmail,
    subject: `🔔 Nouveau RDV — ${clientName} · ${slot}`,
    html,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}