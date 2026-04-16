'use client'

import { useRouter } from 'next/navigation'

export default function PlaceholderPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 bg-[#C0392B] rounded-2xl flex items-center justify-center">
        <span className="text-3xl text-white">✂</span>
      </div>
      <p className="text-[#C0392B] font-bold text-lg italic" style={{ fontFamily: 'Georgia, serif' }}>
        Jampiero BarberoShop
      </p>
      <p className="text-[#7B7B7B] text-sm">Page en cours de construction...</p>
      <button
        onClick={() => router.back()}
        className="mt-4 border border-[#E8D5C4] rounded-xl px-6 py-2 text-sm text-[#7B7B7B] hover:text-[#C0392B] hover:border-[#C0392B] transition-colors"
      >
        ← Retour
      </button>
    </div>
  )
}