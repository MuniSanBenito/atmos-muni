import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkAuth } from '../../lib/auth'

export async function GET(request: NextRequest) {
  // Solo dispatcher y admin pueden ver reportes
  const auth = await checkAuth(request, ['dispatcher', 'admin'])
  if (auth.error) return auth.error

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    // Parámetros de filtro
    const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, año
    const tipoPago = searchParams.get('tipoPago') || 'todos' // subsidiado, pagado, todos
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Calcular rango de fechas según el período
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    if (fechaDesde && fechaHasta) {
      // Usar fechas personalizadas
      startDate = new Date(fechaDesde)
      endDate = new Date(fechaHasta)
      endDate.setHours(23, 59, 59)
    } else {
      switch (periodo) {
        case 'dia':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
          break
        case 'semana':
          const dayOfWeek = now.getDay()
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
          startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
          break
        case 'mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
          break
        case 'año':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      }
    }

    // Construir where clause base
    const baseWhere: any = {
      createdAt: {
        greater_than_equal: startDate.toISOString(),
        less_than_equal: endDate.toISOString(),
      },
    }

    // Agregar filtro de tipo de pago si no es "todos"
    if (tipoPago !== 'todos') {
      baseWhere.tipoPago = { equals: tipoPago }
    }

    // Obtener todas las solicitudes del período
    const todasSolicitudes = await payload.find({
      collection: 'solicitudes',
      where: baseWhere,
      limit: 1000,
      sort: '-createdAt',
    })

    // Contar por estado
    const realizadas = todasSolicitudes.docs.filter((s: any) => s.estado === 'realizada')
    const noRealizadas = todasSolicitudes.docs.filter((s: any) => s.estado === 'no_realizada')
    const pendientes = todasSolicitudes.docs.filter((s: any) => s.estado === 'pendiente')
    const enCamino = todasSolicitudes.docs.filter((s: any) => s.estado === 'en_camino')

    // Contar por tipo de pago (dentro del período)
    const subsidiados = todasSolicitudes.docs.filter((s: any) => s.tipoPago === 'subsidiado')
    const pagados = todasSolicitudes.docs.filter((s: any) => s.tipoPago === 'pagado')

    // Calcular tasa de éxito
    const totalCompletadas = realizadas.length + noRealizadas.length
    const tasaExito = totalCompletadas > 0 
      ? Math.round((realizadas.length / totalCompletadas) * 100) 
      : 0

    return NextResponse.json({
      success: true,
      reporte: {
        periodo: {
          nombre: periodo,
          desde: startDate.toISOString(),
          hasta: endDate.toISOString(),
        },
        filtros: {
          tipoPago,
        },
        estadisticas: {
          total: todasSolicitudes.totalDocs,
          realizadas: realizadas.length,
          noRealizadas: noRealizadas.length,
          pendientes: pendientes.length,
          enCamino: enCamino.length,
          subsidiados: subsidiados.length,
          pagados: pagados.length,
          tasaExito,
        },
        solicitudes: todasSolicitudes.docs.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          apellido: s.apellido,
          telefono: s.telefono,
          direccion: s.direccion,
          barrio: s.barrio?.nombre || '',
          tipoPago: s.tipoPago,
          estado: s.estado,
          notas: s.notas || '',
          motivoNoRealizacion: s.motivoNoRealizacion || '',
          fechaRealizacion: s.fechaRealizacion || '',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error al obtener reporte:', error)
    return NextResponse.json({ error: 'Error al obtener el reporte' }, { status: 500 })
  }
}
