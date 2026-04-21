import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { clientName, clientEmail, barberName, serviceName, date, slot, price, cancelToken } = await req.json()

  if (!clientEmail) return NextResponse.json({ ok: true })

  const dateLabel = new Date(date + 'T12:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const cancelUrl = `https://jampiero-web.vercel.app/cancel?token=${cancelToken}`

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#FDF6EC;border-radius:16px;overflow:hidden">
      <div style="background:#C0392B;padding:32px 24px;text-align:center">
        <p style="color:#D4AC0D;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Jampiero BarberoShop</p>
        <h1 style="color:white;font-size:24px;margin:0;font-style:italic">Rendez-vous confirmé ✓</h1>
      </div>
      <div style="padding:24px">
        <p style="color:#2C2C2C;font-size:15px">Bonjour <strong>${clientName}</strong>,</p>
        <p style="color:#7B7B7B;font-size:14px;line-height:1.6">Votre rendez-vous a bien été enregistré. Voici le récapitulatif :</p>
        <div style="background:white;border:1px solid #E8D5C4;border-radius:12px;padding:20px;margin:20px 0">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Coiffeur</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC">${barberName}</td></tr>
            <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Prestation</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC">${serviceName}</td></tr>
            <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Date</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC;text-transform:capitalize">${dateLabel}</td></tr>
            <tr><td style="color:#7B7B7B;padding:8px 0;border-bottom:1px solid #F2E8DC">Heure</td><td style="font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #F2E8DC">${slot}</td></tr>
            <tr><td style="color:#7B7B7B;padding:8px 0">Prix</td><td style="font-weight:700;color:#C0392B;text-align:right;padding:8px 0">${price} CHF</td></tr>
          </table>
        </div>
        <p style="color:#7B7B7B;font-size:13px;line-height:1.6">En cas d'empêchement, contactez-nous le plus tôt possible :</p>
        <p style="color:#7B7B7B;font-size:13px">📞 <a href="tel:077 213 23 10" style="color:#C0392B">077 213 23 10</a></p>
        <p style="color:#7B7B7B;font-size:13px">📍 Rue de Lyon 14, 1201 Genève</p>

        <div style="border-top:1px solid #E8D5C4;margin-top:20px;padding-top:20px;text-align:center">
          <p style="color:#7B7B7B;font-size:12px;margin-bottom:12px">Besoin d'annuler votre rendez-vous ?</p>
          <a href="${cancelUrl}"
            style="display:inline-block;background:#FDF6EC;color:#C0392B;border:1px solid #C0392B;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:1px">
            Annuler mon rendez-vous
          </a>
          <p style="color:#BDBDBD;font-size:11px;margin-top:8px">Ce lien est valable jusqu'à la date du rendez-vous</p>
        </div>
      </div>
      <div style="background:#922B21;padding:16px;text-align:center">
        <p style="color:white;font-size:11px;margin:0;opacity:0.8">República Dominicana 🇩🇴 · Genève</p>
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from:    'Jampiero BarberoShop <onboarding@resend.dev>',
    to:      clientEmail,
    subject: `✓ RDV confirmé — ${dateLabel} à ${slot}`,
    html,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}