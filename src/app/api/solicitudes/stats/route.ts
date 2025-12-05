import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkAuth } from '../../lib/auth'

export async function GET(request: NextRequest) {
  // Solo dispatcher y admin pueden ver estadísticas completas
  const auth = await checkAuth(request, ['dispatcher', 'admin'])
  if (auth.error) return auth.error

  try {
    const payload = await getPayload({ config })

    // Obtener todas las solicitudes para calcular estadísticas
    const allSolicitudes = await payload.find({
      collection: 'solicitudes',
      limit: 0, // Solo queremos el count
    })

    // Contar por estado
    const pendientes = await payload.find({
      collection: 'solicitudes',
      where: { estado: { equals: 'pendiente' } },
      limit: 0,
    })

    const enCamino = await payload.find({
      collection: 'solicitudes',
      where: { estado: { equals: 'en_camino' } },
      limit: 0,
    })

    const realizadas = await payload.find({
      collection: 'solicitudes',
      where: { estado: { equals: 'realizada' } },
      limit: 0,
    })

    const noRealizadas = await payload.find({
      collection: 'solicitudes',
      where: { estado: { equals: 'no_realizada' } },
      limit: 0,
    })

    // Contar por tipo de pago
    const subsidiados = await payload.find({
      collection: 'solicitudes',
      where: { tipoPago: { equals: 'subsidiado' } },
      limit: 0,
    })

    const pagados = await payload.find({
      collection: 'solicitudes',
      where: { tipoPago: { equals: 'pagado' } },
      limit: 0,
    })

    // Estadísticas del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const solicitudesMes = await payload.find({
      collection: 'solicitudes',
      where: {
        createdAt: { greater_than_equal: inicioMes.toISOString() },
      },
      limit: 0,
    })

    const realizadasMes = await payload.find({
      collection: 'solicitudes',
      where: {
        and: [
          { estado: { equals: 'realizada' } },
          { createdAt: { greater_than_equal: inicioMes.toISOString() } },
        ],
      },
      limit: 0,
    })

    // Calcular tasa de éxito (realizadas vs total completadas)
    const totalCompletadas = realizadas.totalDocs + noRealizadas.totalDocs
    const tasaExito =
      totalCompletadas > 0 ? Math.round((realizadas.totalDocs / totalCompletadas) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        total: allSolicitudes.totalDocs,
        pendientes: pendientes.totalDocs,
        enCamino: enCamino.totalDocs,
        realizadas: realizadas.totalDocs,
        noRealizadas: noRealizadas.totalDocs,
        subsidiados: subsidiados.totalDocs,
        pagados: pagados.totalDocs,
        mes: {
          total: solicitudesMes.totalDocs,
          realizadas: realizadasMes.totalDocs,
        },
        tasaExito,
      },
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json({ error: 'Error al obtener las estadísticas' }, { status: 500 })
  }
}
