/**
 * Catalogo centralizzato delle categorie prodotto.
 * Usare SEMPRE questi ID per matchare i dati di Supabase.
 * Ogni categoria ha:
 *  - label + emoji per la UI
 *  - palette Tailwind predefinita (pill, icon, badge)
 *  - gradiente card opzionale per gamification leggera
 */

export type CategoryId =
  | 'vegetables'
  | 'fruit'
  | 'cheese'
  | 'meat'
  | 'eggs'
  | 'honey'
  | 'wine'
  | 'farm'

export interface CategoryMeta {
  id: CategoryId
  label: string
  emoji: string
  /** Classi Tailwind pronte all'uso per pill e badge */
  classes: {
    pill: string // bg + text
    bubble: string // bg soft + text
    border: string // border colore tematico
    gradient: string // bg-gradient per card/hero
  }
}

export const CATEGORY_LIST: CategoryMeta[] = [
  {
    id: 'vegetables',
    label: 'Ortaggi & Verdure',
    emoji: '🥬',
    classes: {
      pill: 'bg-emerald-100 text-emerald-800',
      bubble: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40',
    },
  },
  {
    id: 'fruit',
    label: 'Frutta',
    emoji: '🍎',
    classes: {
      pill: 'bg-rose-100 text-rose-800',
      bubble: 'bg-rose-50 text-rose-700',
      border: 'border-rose-200',
      gradient: 'bg-gradient-to-br from-rose-50 to-rose-100/40',
    },
  },
  {
    id: 'cheese',
    label: 'Formaggi & Latticini',
    emoji: '🧀',
    classes: {
      pill: 'bg-amber-100 text-amber-800',
      bubble: 'bg-amber-50 text-amber-700',
      border: 'border-amber-200',
      gradient: 'bg-gradient-to-br from-amber-50 to-amber-100/40',
    },
  },
  {
    id: 'meat',
    label: 'Carne & Salumi',
    emoji: '🥩',
    classes: {
      pill: 'bg-red-100 text-red-800',
      bubble: 'bg-red-50 text-red-700',
      border: 'border-red-200',
      gradient: 'bg-gradient-to-br from-red-50 to-red-100/40',
    },
  },
  {
    id: 'eggs',
    label: 'Uova',
    emoji: '🥚',
    classes: {
      pill: 'bg-yellow-100 text-yellow-800',
      bubble: 'bg-yellow-50 text-yellow-700',
      border: 'border-yellow-200',
      gradient: 'bg-gradient-to-br from-yellow-50 to-yellow-100/40',
    },
  },
  {
    id: 'honey',
    label: 'Miele & Confetture',
    emoji: '🍯',
    classes: {
      pill: 'bg-orange-100 text-orange-800',
      bubble: 'bg-orange-50 text-orange-700',
      border: 'border-orange-200',
      gradient: 'bg-gradient-to-br from-orange-50 to-orange-100/40',
    },
  },
  {
    id: 'wine',
    label: 'Vino & Olio',
    emoji: '🍷',
    classes: {
      pill: 'bg-purple-100 text-purple-800',
      bubble: 'bg-purple-50 text-purple-700',
      border: 'border-purple-200',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100/40',
    },
  },
  {
    id: 'farm',
    label: 'Altro (Generico)',
    emoji: '🌾',
    classes: {
      pill: 'bg-lime-100 text-lime-800',
      bubble: 'bg-lime-50 text-lime-700',
      border: 'border-lime-200',
      gradient: 'bg-gradient-to-br from-lime-50 to-lime-100/40',
    },
  },
]

const FALLBACK: CategoryMeta = CATEGORY_LIST[CATEGORY_LIST.length - 1]

/** Ritorna il meta della categoria, fallback su `farm` se sconosciuta. */
export function getCategory(id?: string | null): CategoryMeta {
  if (!id) return FALLBACK
  return CATEGORY_LIST.find(c => c.id === id) || FALLBACK
}
