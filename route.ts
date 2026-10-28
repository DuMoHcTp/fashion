import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

// /tmp — единственная папка, доступная для записи на Vercel
const UPLOAD_DIR = path.join('/tmp', 'uploads')
const MAX_SIZE = 10 * 1024 * 1024 // 10 МБ

/**
 * POST /api/upload
 * Принимает { image: "data:image/jpeg;base64,..." }
 * Сжимает изображение через sharp и сохраняет в /tmp/uploads.
 * Возвращает { url: "/api/images/xxx.jpg" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const dataUrl: string = body?.image ?? ''

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif|heic|heif));base64,(.+)$/i)
    if (!match) {
      return NextResponse.json(
        { error: 'Некорректный формат изображения. Ожидается data URL с base64.' },
        { status: 400 },
      )
    }

    const base64 = match[2]
    const buffer = Buffer.from(base64, 'base64')

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Пустой файл изображения' }, { status: 400 })
    }
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой (максимум 10 МБ)' }, { status: 413 })
    }

    // Сжатие: максимум 900px по большей стороне, JPEG q82
    const resized = await sharp(buffer)
      .rotate() // авто-поворот по EXIF
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer()

    await mkdir(UPLOAD_DIR, { recursive: true })
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.jpg`
    const filePath = path.join(UPLOAD_DIR, fileName)
    await writeFile(filePath, resized)

    return NextResponse.json({ url: `/api/images/${fileName}` })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return NextResponse.json({ error: 'Не удалось сохранить изображение' }, { status: 500 })
  }
}
