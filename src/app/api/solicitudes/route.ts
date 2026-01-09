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
        fechaSolicitud: data.fechaSolicitud,
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
      sort: 'fechaSolicitud',
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

export async function DELETE(request: NextRequest) {
  // Solo admin puede eliminar solicitudes
  const auth = await checkAuth(request, ['admin'])
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const payload = await getPayload({ config })

    // Obtener IDs desde query params (formato: where[and][0][id][in][0]=id1&...)
    const idsToDelete: string[] = []
    
    // Parsear los query params para extraer los IDs
    searchParams.forEach((value, key) => {
      if (key.includes('[id][in]') || key.includes('[id][equals]')) {
        idsToDelete.push(value)
      }
    })

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'No se especificaron IDs para eliminar' }, { status: 400 })
    }

    // Eliminar cada solicitud
    const deletedIds: string[] = []
    for (const id of idsToDelete) {
      try {
        await payload.delete({
          collection: 'solicitudes',
          id,
        })
        deletedIds.push(id)
      } catch (err) {
        console.error(`Error al eliminar solicitud ${id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedIds.length} solicitud(es) eliminada(s)`,
      deletedIds,
    })
  } catch (error) {
    console.error('Error al eliminar solicitudes:', error)
    return NextResponse.json({ error: 'Error al eliminar las solicitudes' }, { status: 500 })
  }
}
