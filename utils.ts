import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/items — список всех вещей гардероба
 */
export async function GET() {
  try {
    const items = await db.clothingItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { match: true },
    })
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Ошибка получения гардероба:', error)
    return NextResponse.json({ error: 'Не удалось загрузить гардероб' }, { status: 500 })
  }
}

/**
 * POST /api/items — добавить вещь в гардероб
 * Тело: { imageUrl, name, category, subtype, colors, style, seasons, material, description }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const required = ['imageUrl', 'name', 'category', 'subtype', 'style']
    for (const field of required) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        return NextResponse.json({ error: `Поле «${field}» обязательно` }, { status: 400 })
      }
    }

    const item = await db.clothingItem.create({
      data: {
        imageUrl: body.imageUrl,
        name: String(body.name).trim(),
        category: String(body.category).trim(),
        subtype: String(body.subtype).trim(),
        colors: JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
        style: String(body.style).trim(),
        seasons: JSON.stringify(Array.isArray(body.seasons) ? body.seasons : []),
        material: body.material ? String(body.material).trim() : null,
        description: body.description ? String(body.description).trim() : '',
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Ошибка создания вещи:', error)
    return NextResponse.json({ error: 'Не удалось добавить вещь' }, { status: 500 })
  }
}
