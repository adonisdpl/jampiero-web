export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: 'client' | 'barber'
  created_at: string
}

export interface Barber {
  id: string
  name: string
  active: boolean
  profile_id: string | null
}

export interface Service {
  id: string
  name: string
  duration_min: number
  price_chf: number
  active: boolean
}

export interface Availability {
  id: string
  barber_id: string
  date: string
  slot_time: string
  is_blocked: boolean
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'done'

export interface Booking {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  date: string
  slot_time: string
  status: BookingStatus
  note: string | null
  created_at: string
  barber?: { name: string }
  service?: { name: string; price_chf: number; duration_min: number }
  client?: { full_name: string; phone: string | null }
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  done:      'Terminé',
}

export const STATUS_COLOR: Record<BookingStatus, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  done:      'bg-gray-100 text-gray-500',
}

export const SLOTS = [
  '09:00','10:00','11:00','12:00',
  '14:00','15:00','16:00','17:00','18:00'
]

export const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

export const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']