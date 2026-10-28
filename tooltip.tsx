'use client'

 

import { Flower2, Sun, Leaf, Snowflake, CloudSun, Shirt, Footprints, Heart, ShoppingBag } from 'lucide-react'
import type { WardrobeItem } from '@/lib/wardrobe-client'
import { colorHex } from '@/lib/wardrobe-client'

// Кастомные SVG-иконки (в lucide нет брюк и платья)

export function PantsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 3h10l1.2 18h-5.4L12 12l-.8 9H5.8L7 3z" />
    </svg>
  )
}

export function DressIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 2.5l3 3 3-3" />
      <path d="M9 2.5L7.5 7l2.5 3.5L6 21.5h12L14 10.5 16.5 7 15 2.5" />
    </svg>
  )
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Верх': Shirt,
  'Низ': PantsIcon,
  'Платье': DressIcon,
  'Верхняя одежда': Shirt,
  'Обувь': Footprints,
  'Нижнее бельё': Heart,
  'Аксессуар': ShoppingBag,
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Shirt
  return <Icon className={className} />
}

const SEASON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Весна': Flower2,
  'Лето': Sun,
  'Осень': Leaf,
  'Зима': Snowflake,
  'Демисезон': CloudSun,
}

export function SeasonIcon({ season, className }: { season: string; className?: string }) {
  const Icon = SEASON_ICONS[season] ?? CloudSun
  return <Icon className={className} />
}

// Цветные точки цветов вещи
export function ColorDots({ colors, max = 4 }: { colors: string[]; max?: number }) {
  const shown = colors.slice(0, max)
  return (
    <div className="flex items-center gap-1" title={colors.join(', ')}>
      {shown.map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="h-3.5 w-3.5 rounded-full border border-stone-300 shadow-sm"
          style={{ backgroundColor: colorHex(c) }}
        />
      ))}
      {colors.length > max && <span className="text-[10px] text-stone-400">+{colors.length - max}</span>}
    </div>
  )
}

// Превью изображения вещи с фолбэком
export function ItemImage({
  item,
  className = '',
  sizesClass = 'h-24 w-24',
}: {
  item: Pick<WardrobeItem, 'imageUrl' | 'name' | 'category'>
  className?: string
  sizesClass?: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-stone-100 ${sizesClass} ${className}`}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-stone-300">
          <CategoryIcon category={item.category} className="h-8 w-8" />
        </div>
      )}
    </div>
  )
}
