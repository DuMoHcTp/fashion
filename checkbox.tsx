'use client'

 

import { useMemo, useState } from 'react'
import { Search, Trash2, Sparkles, ShoppingBag, Layers, Palette, CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { CategoryIcon, ColorDots, SeasonIcon } from '@/components/wardrobe/clothing-icons'
import { CATEGORY_LIST, STYLE_LIST, SEASON_LIST, type WardrobeItem } from '@/lib/wardrobe-client'

interface WardrobeTabProps {
  items: WardrobeItem[]
  loading: boolean
  onDeleted: () => void
  onCheckOutfit: (itemId: string) => void
  onGoAdd: () => void
}

export function WardrobeTab({ items, loading, onDeleted, onCheckOutfit, onGoAdd }: WardrobeTabProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [style, setStyle] = useState('all')
  const [season, setSeason] = useState('all')
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<WardrobeItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (style !== 'all' && item.style !== style) return false
      if (season !== 'all' && !item.seasons.includes(season)) return false
      if (q) {
        const haystack = `${item.name} ${item.subtype} ${item.colors.join(' ')} ${item.style} ${item.description}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, search, category, style, season])

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1)
    }
    return map
  }, [items])

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${deletingItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Ошибка удаления')
      }
      toast({ title: 'Вещь удалена', description: `«${deletingItem.name}» убрана из гардероба.` })
      setDetailItem(null)
      onDeleted()
    } catch (error) {
      toast({
        title: 'Не удалось удалить',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeletingItem(null)
    }
  }

  const hasFilters = search || category !== 'all' || style !== 'all' || season !== 'all'

  return (
    <div className="space-y-5">
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900/5">
              <Layers className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-none text-stone-900">{items.length}</p>
              <p className="mt-1 text-xs text-stone-500">всего вещей</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900/5">
              <ShoppingBag className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-none text-stone-900">{categoryStats.size}</p>
              <p className="mt-1 text-xs text-stone-500">категорий</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900/5">
              <Palette className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-none text-stone-900">
                {new Set(items.flatMap((i) => i.colors)).size}
              </p>
              <p className="mt-1 text-xs text-stone-500">цветов</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900/5">
              <Sparkles className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-none text-stone-900">
                {items.filter((i) => i.match).length}
              </p>
              <p className="mt-1 text-xs text-stone-500">проанализировано</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-white/70 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск: название, цвет, фасон…"
            className="border-0 bg-stone-100/70 pl-9 focus-visible:ring-1"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-auto sm:grid-cols-none sm:flex">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Категория" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Стиль" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все стили</SelectItem>
              {STYLE_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Сезон" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сезоны</SelectItem>
              {SEASON_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Сетка вещей */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/60 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900/5">
            <ShoppingBag className="h-8 w-8 text-stone-400" />
          </div>
          <div>
            <p className="font-medium text-stone-800">Гардероб пока пуст</p>
            <p className="mt-1 max-w-sm text-sm text-stone-500">
              Добавьте первую вещь — сфотографируйте или загрузите фото, и AI распознает её автоматически.
            </p>
          </div>
          <Button onClick={onGoAdd} className="bg-stone-900 text-white hover:bg-stone-800">
            Добавить вещь
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 py-12 text-center text-sm text-stone-500">
          {hasFilters ? 'Ничего не найдено по текущим фильтрам' : 'Гардероб пуст'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden border-stone-200/80 p-0 transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => setDetailItem(item)}
            >
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <CategoryIcon category={item.category} className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                  <CategoryIcon category={item.category} className="h-3 w-3" />
                  {item.category}
                </div>
                {item.match && (
                  <div className="absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    {item.match.score}%
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-3">
                <p className="line-clamp-1 text-sm font-medium text-stone-900">{item.name}</p>
                <p className="line-clamp-1 text-xs text-stone-400">{item.subtype}</p>
                <div className="flex items-center justify-between">
                  <ColorDots colors={item.colors} />
                  <div className="flex items-center gap-0.5 text-stone-400">
                    {item.seasons.slice(0, 3).map((s) => (
                      <SeasonIcon key={s} season={s} className="h-3.5 w-3.5" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог деталей */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto nice-scroll sm:max-w-lg">
          {detailItem && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl bg-stone-100">
                {detailItem.imageUrl ? (
                  <img src={detailItem.imageUrl} alt={detailItem.name} className="mx-auto max-h-[320px] w-full object-contain" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-stone-300">
                    <CategoryIcon category={detailItem.category} className="h-12 w-12" />
                  </div>
                )}
              </div>

              <DialogHeader className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CategoryIcon category={detailItem.category} className="h-3 w-3" />
                    {detailItem.category}
                  </Badge>
                  <Badge variant="outline">{detailItem.style}</Badge>
                </div>
                <DialogTitle className="text-left text-xl">{detailItem.name}</DialogTitle>
                <DialogDescription>{detailItem.subtype}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-stone-400">Цвета</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ColorDots colors={detailItem.colors} max={6} />
                    <span className="text-stone-700">{detailItem.colors.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-stone-400">Сезоны</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailItem.seasons.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        <SeasonIcon season={s} className="h-3 w-3" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                {detailItem.material && (
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-stone-400">Материал</span>
                    <span className="text-stone-700">{detailItem.material}</span>
                  </div>
                )}
                {detailItem.description && (
                  <p className="rounded-xl bg-stone-50 p-3 text-stone-600">{detailItem.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Добавлено {new Date(detailItem.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="flex gap-2 border-t border-stone-100 pt-4">
                <Button
                  className="flex-1 bg-stone-900 text-white hover:bg-stone-800"
                  onClick={() => {
                    onCheckOutfit(detailItem.id)
                    setDetailItem(null)
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Подобрать образы
                </Button>
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeletingItem(detailItem)}>
                  <Trash2 className="h-4 w-4" /> Удалить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вещь?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deletingItem?.name}» будет удалена из гардероба вместе с фото и результатами анализа. Действие
              необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
