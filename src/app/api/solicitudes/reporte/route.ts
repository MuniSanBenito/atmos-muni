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
    const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, año, todo
    const tipoPago = searchParams.get('tipoPago') || 'todos'
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Paginación
    const isExport = searchParams.get('export') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = isExport ? 10000 : Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))

    // Sorting
    const sortField = searchParams.get('sort') || 'createdAt'
    const sortDir = searchParams.get('sortDir') || 'desc'
    const sortParam = sortDir === 'desc' ? `-${sortField}` : sortField

    // Búsqueda
    const busqueda = searchParams.get('q')?.trim()

    // Calcular rango de fechas según el período
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    if (fechaDesde && fechaHasta) {
      startDate = new Date(fechaDesde)
      endDate = new Date(fechaHasta)
      endDate.setHours(23, 59, 59)
    } else if (periodo !== 'todo') {
      switch (periodo) {
        case 'dia':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
          break
        case 'semana': {
          const dayOfWeek = now.getDay()
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
          startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
          break
        }
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
    // periodo === 'todo': startDate permanece null → sin filtro de fecha

    // Where base (sin búsqueda de texto, para estadísticas)
    const baseWhere: any = {}
    if (startDate) {
      baseWhere.createdAt = {
        greater_than_equal: startDate.toISOString(),
        less_than_equal: endDate.toISOString(),
      }
    }
    if (tipoPago !== 'todos') {
      baseWhere.tipoPago = { equals: tipoPago }
    }

    // Filtro de estado (solo afecta el detalle/tabla, no las estadísticas del período)
    const estadoFiltro = searchParams.get('estado')

    // Where para el detalle (agrega búsqueda de texto y estado)
    const detailWhere: any = { ...baseWhere }
    if (estadoFiltro && estadoFiltro !== 'todos') {
      detailWhere.estado = { equals: estadoFiltro }
    }
    if (busqueda) {
      detailWhere.or = [
        { nombre: { contains: busqueda } },
        { apellido: { contains: busqueda } },
        { telefono: { contains: busqueda } },
        { direccion: { contains: busqueda } },
      ]
    }

    // Estadísticas con count en paralelo (sin traer docs, muy eficiente)
    const [
      countTotal,
      countRealizadas,
      countNoRealizadas,
      countPendientes,
      countEnCamino,
      countSubsidiados,
      countPagados,
      solicitudesResult,
    ] = await Promise.all([
      payload.count({ collection: 'solicitudes', where: baseWhere }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, estado: { equals: 'realizada' } } }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, estado: { equals: 'no_realizada' } } }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, estado: { equals: 'pendiente' } } }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, estado: { equals: 'en_camino' } } }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, tipoPago: { equals: 'subsidiado' } } }),
      payload.count({ collection: 'solicitudes', where: { ...baseWhere, tipoPago: { equals: 'pagado' } } }),
      payload.find({
        collection: 'solicitudes',
        where: detailWhere,
        sort: sortParam,
        page: isExport ? 1 : page,
        limit,
      }),
    ])

    const totalRealizadas = countRealizadas.totalDocs
    const totalNoRealizadas = countNoRealizadas.totalDocs
    const totalCompletadas = totalRealizadas + totalNoRealizadas
    const tasaExito = totalCompletadas > 0
      ? Math.round((totalRealizadas / totalCompletadas) * 100)
      : 0

    return NextResponse.json({
      success: true,
      reporte: {
        periodo: {
          nombre: periodo,
          desde: startDate?.toISOString() ?? null,
          hasta: startDate ? endDate.toISOString() : null,
        },
        filtros: { tipoPago },
        estadisticas: {
          total: countTotal.totalDocs,
          realizadas: totalRealizadas,
          noRealizadas: totalNoRealizadas,
          pendientes: countPendientes.totalDocs,
          enCamino: countEnCamino.totalDocs,
          subsidiados: countSubsidiados.totalDocs,
          pagados: countPagados.totalDocs,
          tasaExito,
        },
        solicitudes: solicitudesResult.docs.map((s: any) => ({
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
          fechaSolicitud: s.fechaSolicitud || '',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        totalDocs: solicitudesResult.totalDocs,
        totalPages: solicitudesResult.totalPages,
        page: solicitudesResult.page,
        limit,
        hasPrevPage: solicitudesResult.hasPrevPage,
        hasNextPage: solicitudesResult.hasNextPage,
      },
    })
  } catch (error) {
    console.error('Error al obtener reporte:', error)
    return NextResponse.json({ error: 'Error al obtener el reporte' }, { status: 500 })
  }
}
