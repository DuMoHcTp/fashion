'use client'

 

import { useCallback, useRef, useState } from 'react'
import {
  Upload,
  Camera,
  Wand2,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  X,
  CircleCheck,
  ArrowRight,
  Shirt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { SeasonIcon } from '@/components/wardrobe/clothing-icons'
import { CATEGORY_LIST, STYLE_LIST, SEASON_LIST } from '@/lib/wardrobe-client'

interface AnalyzedItem {
  name: string
  category: string
  subtype: string
  colors: string[]
  style: string
  seasons: string[]
  material: string | null
  description: string
}

interface AddTabProps {
  onSaved: () => void
  onCheckOutfit: (itemId: string) => void
}

const ANALYSIS_STEPS = [
  'Сканируем фотографию…',
  'Распознаём тип одежды…',
  'Определяем цвета и фасон…',
  'Подбираем характеристику…',
]

export function AddTab({ onSaved, onCheckOutfit }: AddTabProps) {
  const { toast } = useToast()

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState<AnalyzedItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)
  const [colorDraft, setColorDraft] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setDataUrl(null)
    setFileName('')
    setResult(null)
    setSavedItemId(null)
    setColorDraft('')
  }

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Это не изображение', description: 'Выберите файл в формате фото: JPG, PNG, WEBP.', variant: 'destructive' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 10 МБ.', variant: 'destructive' })
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        reset()
        setDataUrl(String(reader.result))
        setFileName(file.name)
      }
      reader.readAsDataURL(file)
    },
    [toast],
  )

  const handleAnalyze = async () => {
    if (!dataUrl) return
    setAnalyzing(true)
    setResult(null)
    setSavedItemId(null)
    setAnalysisStep(0)
    const timer = setInterval(() => setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 3500)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Ошибка анализа')
      setResult({
        name: json.name ?? 'Новая вещь',
        category: json.category ?? 'Верх',
        subtype: json.subtype ?? '',
        colors: Array.isArray(json.colors) ? json.colors : [],
        style: json.style ?? 'Повседневный',
        seasons: Array.isArray(json.seasons) ? json.seasons : [],
        material: json.material ?? null,
        description: json.description ?? '',
      })
    } catch (error) {
      toast({
        title: 'Не удалось распознать вещь',
        description: error instanceof Error ? error.message : 'Попробуйте другое фото.',
        variant: 'destructive',
      })
    } finally {
      clearInterval(timer)
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!dataUrl || !result) return
    setSaving(true)
    try {
      // 1. Загружаем изображение
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadJson.error || 'Ошибка загрузки фото')

      // 2. Сохраняем вещь
      const itemRes = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadJson.url,
          name: result.name,
          category: result.category,
          subtype: result.subtype,
          colors: result.colors,
          style: result.style,
          seasons: result.seasons,
          material: result.material,
          description: result.description,
        }),
      })
      const itemJson = await itemRes.json()
      if (!itemRes.ok) throw new Error(itemJson.error || 'Ошибка сохранения')

      setSavedItemId(itemJson.item.id)
      onSaved()
      toast({ title: 'Вещь добавлена в гардероб', description: `«${result.name}» сохранена.` })
    } catch (error) {
      toast({
        title: 'Не удалось сохранить',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const addColor = () => {
    if (!result) return
    const v = colorDraft.trim()
    if (v && !result.colors.includes(v) && result.colors.length < 4) {
      setResult({ ...result, colors: [...result.colors, v] })
    }
    setColorDraft('')
  }

  const toggleSeason = (season: string) => {
    if (!result) return
    const has = result.seasons.includes(season)
    setResult({
      ...result,
      seasons: has ? result.seasons.filter((s) => s !== season) : [...result.seasons, season],
    })
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Левая колонка: фото */}
      <div className="min-w-0 space-y-4">
        <div
          className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/70 p-6 text-center transition-colors hover:border-stone-400"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          {dataUrl ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-h-[380px] w-full max-w-[320px] overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <img src={dataUrl} alt="Загруженное фото одежды" className="mx-auto max-h-[380px] w-auto object-contain" />
              </div>
              <p className="truncate text-xs text-stone-400">{fileName}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  <RotateCcw className="h-4 w-4" /> Заменить фото
                </Button>
                {!analyzing && !result && (
                  <Button size="sm" onClick={handleAnalyze} className="bg-stone-900 text-white hover:bg-stone-800">
                    <Wand2 className="h-4 w-4" /> Распознать вещь
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900/5">
                <Shirt className="h-8 w-8 text-stone-500" />
              </div>
              <div>
                <p className="font-medium text-stone-800">Добавьте фото одежды</p>
                <p className="mt-1 text-sm text-stone-500">Перетащите файл сюда или выберите способ ниже</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()} className="bg-stone-900 text-white hover:bg-stone-800">
                  <Upload className="h-4 w-4" /> Загрузить фото
                </Button>
                <Button variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Сделать снимок
                </Button>
              </div>
              <p className="text-xs text-stone-400">JPG, PNG, WEBP · до 10 МБ</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {analyzing && (
          <div className="animate-fade-up rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
              <div>
                <p className="text-sm font-medium text-stone-800">{ANALYSIS_STEPS[analysisStep]}</p>
                <p className="text-xs text-stone-400">AI распознаёт вещь, это займёт несколько секунд</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-1000"
                style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Правая колонка: результат анализа */}
      <div className="min-w-0 space-y-4">
        {!result && !analyzing && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/60 p-8 text-center">
            <Sparkles className="h-8 w-8 text-stone-300" />
            <p className="mt-3 font-medium text-stone-700">Здесь появится распознанная вещь</p>
            <p className="mt-1 max-w-sm text-sm text-stone-400">
              Загрузите фото слева и нажмите «Распознать вещь». AI определит категорию, цвета, стиль и сезонность —
              вы сможете отредактировать данные перед сохранением.
            </p>
          </div>
        )}

        {result && (
          <div className="animate-fade-up space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
            {savedItemId ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CircleCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-stone-900">Вещь в гардеробе!</p>
                  <p className="mt-1 text-sm text-stone-500">
                    «{result.name}» успешно сохранена. Теперь можно проверить, с чем она сочетается.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    className="bg-stone-900 text-white hover:bg-stone-800"
                    onClick={() => {
                      onCheckOutfit(savedItemId)
                      reset()
                    }}
                  >
                    Проверить совместимость <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Добавить ещё одну вещь
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                      <Sparkles className="h-3 w-3" /> Результат AI
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400" onClick={reset} aria-label="Отменить">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Название */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-stone-700">Название</label>
                    <Input value={result.name} onChange={(e) => setResult({ ...result, name: e.target.value })} />
                  </div>

                  {/* Категория */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">Категория</label>
                    <Select value={result.category} onValueChange={(v) => setResult({ ...result, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_LIST.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Тип */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">Тип / фасон</label>
                    <Input value={result.subtype} onChange={(e) => setResult({ ...result, subtype: e.target.value })} />
                  </div>

                  {/* Цвета */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-stone-700">Цвета</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {result.colors.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 pr-1">
                          {c}
                          <button
                            onClick={() => setResult({ ...result, colors: result.colors.filter((x) => x !== c) })}
                            className="rounded-full p-0.5 hover:bg-stone-300/60"
                            aria-label={`Убрать цвет ${c}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        value={colorDraft}
                        onChange={(e) => setColorDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        placeholder="Добавить цвет…"
                        className="h-8 w-36 text-sm"
                      />
                    </div>
                  </div>

                  {/* Стиль */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">Стиль</label>
                    <Select value={result.style} onValueChange={(v) => setResult({ ...result, style: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLE_LIST.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Материал */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">Материал</label>
                    <Input
                      value={result.material ?? ''}
                      onChange={(e) => setResult({ ...result, material: e.target.value || null })}
                      placeholder="напр. хлопок"
                    />
                  </div>

                  {/* Сезоны */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-stone-700">Сезоны</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASON_LIST.map((season) => {
                        const active = result.seasons.includes(season)
                        return (
                          <button
                            key={season}
                            onClick={() => toggleSeason(season)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              active
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                            }`}
                          >
                            <SeasonIcon season={season} className="h-3.5 w-3.5" />
                            {season}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Описание */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-stone-700">Описание</label>
                    <Textarea
                      value={result.description}
                      onChange={(e) => setResult({ ...result, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !result.name.trim()}
                    className="bg-stone-900 text-white hover:bg-stone-800"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Сохраняем…' : 'Сохранить в гардероб'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
