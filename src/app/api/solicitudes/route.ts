import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkAuth } from '../lib/auth'

export async function POST(request: NextRequest) {
  // Solo dispatcher y admin pueden crear solicitudes
  const auth = await checkAuth(request, ['dispatcher', 'admin'])
  if (auth.error) return auth.error

  try {
    const data = await request.json()
    const payload = await getPayload({ config })

    const solicitud = await payload.create({
      collection: 'solicitudes',
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        direccion: data.direccion,
        barrio: data.barrio,
        tipoPago: data.tipoPago,
        coordenadas: data.coordenadas || '',
        notas: data.notas || '',
        estado: 'pendiente',
      },
    })

    return NextResponse.json({
      success: true,
      solicitud,
    })
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Todos los usuarios autenticados pueden ver solicitudes
  const auth = await checkAuth(request)
  if (auth.error) return auth.error

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    // Filtros opcionales
    const estado = searchParams.get('estado')
    const soloActivas = searchParams.get('activas') === 'true'
    const barrioId = searchParams.get('barrio')

    // Construir query
    let where: any = {}

    if (estado) {
      where.estado = { equals: estado }
    } else if (soloActivas) {
      // Solo pendientes y en_camino para el chofer
      where.estado = { in: ['pendiente', 'en_camino'] }
    }

    // Filtrar por barrio si se especifica
    if (barrioId) {
      where.barrio = { equals: barrioId }
    }

    const solicitudes = await payload.find({
      collection: 'solicitudes',
      sort: '-createdAt',
      where,
      limit: 100, // Limitar resultados
    })

    return NextResponse.json({
      success: true,
      solicitudes: solicitudes.docs,
      totalDocs: solicitudes.totalDocs,
    })
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 })
  }
}
