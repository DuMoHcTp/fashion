'use client'

 

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Loader2,
  Wand2,
  RefreshCw,
  Info,
  ArrowRight,
  CalendarClock,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CategoryIcon, ColorDots, ItemImage } from '@/components/wardrobe/clothing-icons'
import { scoreColor, formatDate, type WardrobeItem, type ParsedMatchAnalysis } from '@/lib/wardrobe-client'

interface OutfitsTabProps {
  items: WardrobeItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onRefresh: () => void
}

// Круговой индикатор совместимости
function ScoreCircle({ score }: { score: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const { stroke, text, label } = scoreColor(score)
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 84 84" className="h-24 w-24 -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" stroke="#eceae6" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${text}`}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-400">Совместимость с гардеробом</p>
        <p className={`mt-0.5 font-semibold ${text}`}>{label}</p>
      </div>
    </div>
  )
}

export function OutfitsTab({ items, selectedId, onSelect, onRefresh }: OutfitsTabProps) {
  const { toast } = useToast()
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ParsedMatchAnalysis | null>(null)
  const selectedRef = useRef<string | null>(null)

  const selectedItem = items.find((i) => i.id === selectedId) ?? null

  // При смене выбранной вещи подгружаем кэшированный анализ
  useEffect(() => {
    if (selectedRef.current === selectedId) return
    selectedRef.current = selectedId
    if (selectedItem?.match) {
      setAnalysis(selectedItem.match)
    } else {
      setAnalysis(null)
    }
     
  }, [selectedId])

  const itemsById = useMemo(() => {
    const map = new Map<string, WardrobeItem>()
    for (const i of items) map.set(i.id, i)
    return map
  }, [items])

  const itemsByName = useMemo(() => {
    const map = new Map<string, WardrobeItem>()
    for (const i of items) map.set(i.name.toLowerCase(), i)
    return map
  }, [items])

  const handleAnalyze = async () => {
    if (!selectedItem) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Ошибка анализа')
      setAnalysis(json.analysis)
      onRefresh()
      toast({ title: 'Анализ готов', description: 'Проверьте результаты подбора образов.' })
    } catch (error) {
      toast({
        title: 'Не удалось выполнить анализ',
        description: error instanceof Error ? error.message : 'Попробуйте позже.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const findOutfitThumb = (name: string) => itemsByName.get(name.toLowerCase()) ?? null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/60 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900/5">
          <Sparkles className="h-8 w-8 text-stone-400" />
        </div>
        <div>
          <p className="font-medium text-stone-800">Гардероб пуст</p>
          <p className="mt-1 max-w-sm text-sm text-stone-500">
            Добавьте вещи в библиотеку — и AI покажет, что с чем носить и чего не хватает.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      {/* Выбор вещи */}
      <div className="min-w-0 space-y-3">
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-4">
          <p className="text-sm font-medium text-stone-800">Выберите вещь для анализа</p>
          <p className="mt-1 text-xs text-stone-400">
            AI оценит, как она сочетается с остальным гардеробом, и предложит готовые образы.
          </p>
          <div className="mt-3 max-h-[340px] space-y-1.5 overflow-y-auto pr-1 nice-scroll">
            {items.map((item) => {
              const active = item.id === selectedId
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                    active ? 'border-stone-900 bg-stone-900/5' : 'border-transparent hover:bg-stone-100'
                  }`}
                >
                  <ItemImage item={item} sizesClass="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800">{item.name}</p>
                    <p className="truncate text-xs text-stone-400">{item.subtype}</p>
                  </div>
                  {item.match && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {item.match.score}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {selectedItem && (
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || items.length < 2}
            className="w-full bg-stone-900 text-white hover:bg-stone-800"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {analyzing
              ? 'Анализируем гардероб…'
              : analysis
                ? 'Обновить анализ'
                : 'Анализировать совместимость'}
          </Button>
        )}

        {items.length < 2 && (
          <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Для анализа совместимости нужно минимум 2 вещи в гардеробе. Добавьте ещё одну на вкладке «Добавить вещь».
          </div>
        )}
      </div>

      {/* Результаты */}
      <div className="min-w-0 space-y-4">
        {!selectedItem && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/60 p-8 text-center">
            <ShoppingBag className="h-8 w-8 text-stone-300" />
            <p className="mt-3 font-medium text-stone-700">Выберите вещь слева</p>
            <p className="mt-1 max-w-sm text-sm text-stone-400">
              Например, новую — чтобы понять, с чем её носить, или любую старую, чтобы освежить комбинации.
            </p>
          </div>
        )}

        {selectedItem && !analysis && !analyzing && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/60 p-8 text-center">
            <Sparkles className="h-8 w-8 text-stone-300" />
            <p className="mt-3 font-medium text-stone-700">«{selectedItem.name}» выбрана</p>
            <p className="mt-1 max-w-sm text-sm text-stone-400">
              Нажмите «Анализировать совместимость», и AI подберёт лучшие сочетания и готовые образы с этой вещью.
            </p>
          </div>
        )}

        {selectedItem && analyzing && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/60 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            <p className="mt-3 font-medium text-stone-700">Стилист изучает ваш гардероб…</p>
            <p className="mt-1 max-w-sm text-sm text-stone-400">
              Сопоставляем цвета, стили и сезонность {items.length - 1} вещей с «{selectedItem.name}»
            </p>
          </div>
        )}

        {selectedItem && analysis && !analyzing && (
          <div className="animate-fade-up space-y-4">
            {/* Итог */}
            <Card className="border-stone-200/80 shadow-none">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <ScoreCircle score={analysis.score} />
                  <div className="flex flex-col items-end gap-1.5">
                    <ItemImage item={selectedItem} sizesClass="h-14 w-14" />
                    {analysis.updatedAt && (
                      <span className="flex items-center gap-1 text-[11px] text-stone-400">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(analysis.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-stone-600">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Лучшие сочетания */}
            {analysis.matches.length > 0 && (
              <Card className="border-stone-200/80 shadow-none">
                <CardContent className="p-5">
                  <p className="font-semibold text-stone-900">Лучшие сочетания</p>
                  <p className="mt-0.5 text-xs text-stone-400">Вещи из вашего гардероба, которые дружат с новинкой</p>
                  <div className="mt-4 space-y-2">
                    {analysis.matches.map((m) => {
                      const matchItem = itemsById.get(m.id)
                      const c = scoreColor(m.score)
                      return (
                        <div key={m.id} className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                          {matchItem ? (
                            <ItemImage item={matchItem} sizesClass="h-14 w-14 shrink-0 rounded-lg" />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
                              <CategoryIcon category="" className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-stone-800">{m.name || matchItem?.name}</p>
                              <span className={`shrink-0 text-sm font-semibold ${c.text}`}>{m.score}%</span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{m.reason}</p>
                            <div className="mt-1.5">
                              <ColorDots colors={matchItem?.colors ?? []} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Готовые образы */}
            {analysis.outfits.length > 0 && (
              <Card className="border-stone-200/80 shadow-none">
                <CardContent className="p-5">
                  <p className="font-semibold text-stone-900">Готовые образы</p>
                  <p className="mt-0.5 text-xs text-stone-400">Комбинации с выбранной вещью — на разные поводы</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {analysis.outfits.map((o, idx) => (
                      <div key={idx} className="flex flex-col rounded-xl border border-stone-100 bg-gradient-to-b from-white to-stone-50/80 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-stone-900">{o.title}</p>
                          {o.occasion && (
                            <Badge className="shrink-0 bg-rose-100 text-rose-700 hover:bg-rose-100">{o.occasion}</Badge>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {o.items.map((name, i) => {
                            const it = findOutfitThumb(name)
                            return (
                              <span key={i} className="flex items-center gap-1.5">
                                {i > 0 && <ArrowRight className="h-3 w-3 text-stone-300" />}
                                <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-white py-0.5 pl-0.5 pr-2 text-xs text-stone-700">
                                  {it ? (
                                    <ItemImage item={it} sizesClass="h-5 w-5 rounded-full" />
                                  ) : (
                                    <span className="mx-0.5 h-5 w-5 rounded-full bg-stone-100" />
                                  )}
                                  <span className="max-w-[120px] truncate">{name}</span>
                                </span>
                              </span>
                            )
                          })}
                        </div>
                        {o.description && <p className="mt-3 text-xs leading-relaxed text-stone-500">{o.description}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Чего не хватает */}
            {analysis.gaps.length > 0 && (
              <Card className="border-stone-200/80 shadow-none">
                <CardContent className="p-5">
                  <p className="font-semibold text-stone-900">Чего не хватает</p>
                  <p className="mt-0.5 text-xs text-stone-400">Добавьте это — и образов станет больше</p>
                  <ul className="mt-3 space-y-2">
                    {analysis.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                <RefreshCw className="h-4 w-4" /> Пересобрать анализ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
