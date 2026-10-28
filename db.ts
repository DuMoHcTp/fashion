import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/items/[id] — получить одну вещь
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await db.clothingItem.findUnique({ where: { id }, include: { match: true } })
    if (!item) {
      return NextResponse.json({ error: 'Вещь не найдена' }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Ошибка получения вещи:', error)
    return NextResponse.json({ error: 'Не удалось загрузить вещь' }, { status: 500 })
  }
}

/**
 * DELETE /api/items/[id] — удалить вещь (вместе с файлом фото и анализом)
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await db.clothingItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Вещь не найдена' }, { status: 404 })
    }

    await db.clothingItem.delete({ where: { id } })

    // Удаляем файл изображения
    if (item.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', item.imageUrl)
      try {
        await unlink(filePath)
      } catch {
        // файл мог уже отсутствовать — игнорируем
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Ошибка удаления вещи:', error)
    return NextResponse.json({ error: 'Не удалось удалить вещь' }, { status: 500 })
  }
}
