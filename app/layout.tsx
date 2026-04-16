import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jampiero BarberoShop',
  description: 'Réservez votre coupe en ligne — Barbershop à Genève',
  manifest: '/manifest.json',
  themeColor: '#C0392B',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#FDF6EC]">
        {children}
      </body>
    </html>
  )
}