'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

interface Solicitud {
  id: string
  nombre: string
  apellido: string
  telefono: string
  direccion: string
  barrio: string
  tipoPago: string
  estado: string
  notas: string
  motivoNoRealizacion: string
  fechaRealizacion: string
  createdAt: string
  updatedAt: string
}

interface Reporte {
  periodo: {
    nombre: string
    desde: string
    hasta: string
  }
  filtros: {
    tipoPago: string
  }
  estadisticas: {
    total: number
    realizadas: number
    noRealizadas: number
    pendientes: number
    enCamino: number
    subsidiados: number
    pagados: number
    tasaExito: number
  }
  solicitudes: Solicitud[]
}

export default function ReportesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [tipoPago, setTipoPago] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [usarFechasPersonalizadas, setUsarFechasPersonalizadas] = useState(false)

  const fetchReporte = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/solicitudes/reporte?tipoPago=${tipoPago}`
      
      if (usarFechasPersonalizadas && fechaDesde && fechaHasta) {
        url += `&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      } else {
        url += `&periodo=${periodo}`
      }

      const response = await fetch(url, { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setReporte(data.reporte)
      }
    } catch (error) {
      console.error('Error al cargar reporte:', error)
    } finally {
      setLoading(false)
    }
  }, [periodo, tipoPago, fechaDesde, fechaHasta, usarFechasPersonalizadas])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'driver') {
        router.replace('/servicio')
      } else {
        fetchReporte()
      }
    }
  }, [user, authLoading, router, fetchReporte])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_camino: 'En Camino',
      realizada: 'Realizada',
      no_realizada: 'No Realizada',
    }
    return labels[estado] || estado
  }

  const getTipoPagoLabel = (tipo: string) => {
    return tipo === 'pagado' ? 'Pagado' : 'Subsidiado'
  }

  const getPeriodoLabel = (periodo: string) => {
    const labels: Record<string, string> = {
      dia: 'Hoy',
      semana: 'Esta Semana',
      mes: 'Este Mes',
      año: 'Este Año',
    }
    return labels[periodo] || periodo
  }

  const exportToExcel = () => {
    if (!reporte) return

    const periodoTexto = usarFechasPersonalizadas ? 'Personalizado' : getPeriodoLabel(reporte.periodo.nombre)
    const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Generar HTML con estilos para Excel
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte Atmosférico</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          .header-title { 
            font-size: 18pt; 
            font-weight: bold; 
            color: #1e3a5f; 
            background-color: #e8f0f8;
            padding: 12px;
            text-align: center;
          }
          .header-subtitle {
            font-size: 11pt;
            color: #666666;
            background-color: #f5f5f5;
            padding: 8px;
            text-align: center;
          }
          .section-header {
            font-size: 12pt;
            font-weight: bold;
            color: #ffffff;
            background-color: #1e3a5f;
            padding: 8px;
          }
          .stat-label {
            font-weight: bold;
            background-color: #f0f4f8;
            padding: 6px 10px;
            border: 1px solid #d0d7de;
          }
          .stat-value {
            background-color: #ffffff;
            padding: 6px 10px;
            border: 1px solid #d0d7de;
            text-align: right;
            font-weight: bold;
          }
          .stat-realizadas { color: #15803d; }
          .stat-no-realizadas { color: #dc2626; }
          .stat-pendientes { color: #ca8a04; }
          .stat-en-camino { color: #2563eb; }
          .table-header {
            font-weight: bold;
            background-color: #1e3a5f;
            color: #ffffff;
            padding: 10px 8px;
            border: 1px solid #1e3a5f;
            text-align: left;
          }
          .table-row { background-color: #ffffff; }
          .table-row-alt { background-color: #f8fafc; }
          .table-cell {
            padding: 8px;
            border: 1px solid #e2e8f0;
          }
          .estado-realizada { 
            background-color: #dcfce7; 
            color: #15803d; 
            font-weight: bold;
            text-align: center;
          }
          .estado-no-realizada { 
            background-color: #fee2e2; 
            color: #dc2626; 
            font-weight: bold;
            text-align: center;
          }
          .estado-pendiente { 
            background-color: #fef3c7; 
            color: #ca8a04; 
            font-weight: bold;
            text-align: center;
          }
          .estado-en-camino { 
            background-color: #dbeafe; 
            color: #2563eb; 
            font-weight: bold;
            text-align: center;
          }
          .tipo-subsidiado { color: #059669; font-weight: bold; }
          .tipo-pagado { color: #1e3a5f; font-weight: bold; }
          .motivo-rechazo { color: #dc2626; font-style: italic; }
          .empty-row { height: 15px; }
        </style>
      </head>
      <body>
        <table>
          <!-- Título Principal -->
          <tr>
            <td colspan="7" class="header-title">
              📊 REPORTE DE SOLICITUDES ATMOSFÉRICAS
            </td>
          </tr>
          <tr>
            <td colspan="7" class="header-subtitle">
              Municipalidad de San Benito - Generado: ${fechaGeneracion}
            </td>
          </tr>
          <tr class="empty-row"><td colspan="7"></td></tr>
          
          <!-- Información del Período -->
          <tr>
            <td colspan="7" class="section-header">📅 INFORMACIÓN DEL PERÍODO</td>
          </tr>
          <tr>
            <td class="stat-label">Período</td>
            <td class="stat-value" colspan="2">${periodoTexto}</td>
            <td class="stat-label">Filtro Tipo Pago</td>
            <td class="stat-value" colspan="2">${tipoPago === 'todos' ? 'Todos' : getTipoPagoLabel(tipoPago)}</td>
            <td></td>
          </tr>
          <tr>
            <td class="stat-label">Desde</td>
            <td class="stat-value" colspan="2">${formatDateShort(reporte.periodo.desde)}</td>
            <td class="stat-label">Hasta</td>
            <td class="stat-value" colspan="2">${formatDateShort(reporte.periodo.hasta)}</td>
            <td></td>
          </tr>
          <tr class="empty-row"><td colspan="7"></td></tr>
          
          <!-- Estadísticas -->
          <tr>
            <td colspan="7" class="section-header">📈 ESTADÍSTICAS</td>
          </tr>
          <tr>
            <td class="stat-label">Total Solicitudes</td>
            <td class="stat-value">${reporte.estadisticas.total}</td>
            <td class="stat-label">Realizadas</td>
            <td class="stat-value stat-realizadas">${reporte.estadisticas.realizadas}</td>
            <td class="stat-label">No Realizadas</td>
            <td class="stat-value stat-no-realizadas">${reporte.estadisticas.noRealizadas}</td>
            <td></td>
          </tr>
          <tr>
            <td class="stat-label">Pendientes</td>
            <td class="stat-value stat-pendientes">${reporte.estadisticas.pendientes}</td>
            <td class="stat-label">En Camino</td>
            <td class="stat-value stat-en-camino">${reporte.estadisticas.enCamino}</td>
            <td class="stat-label">Tasa de Éxito</td>
            <td class="stat-value">${reporte.estadisticas.tasaExito}%</td>
            <td></td>
          </tr>
          <tr>
            <td class="stat-label">Subsidiados</td>
            <td class="stat-value tipo-subsidiado">${reporte.estadisticas.subsidiados}</td>
            <td class="stat-label">Pagados</td>
            <td class="stat-value tipo-pagado">${reporte.estadisticas.pagados}</td>
            <td colspan="3"></td>
          </tr>
          <tr class="empty-row"><td colspan="7"></td></tr>
          
          <!-- Tabla de Detalle -->
          <tr>
            <td colspan="7" class="section-header">📋 DETALLE DE SOLICITUDES (${reporte.solicitudes.length} registros)</td>
          </tr>
          <tr>
            <td class="table-header">Fecha</td>
            <td class="table-header">Nombre Completo</td>
            <td class="table-header">Teléfono</td>
            <td class="table-header">Dirección</td>
            <td class="table-header">Tipo Pago</td>
            <td class="table-header">Estado</td>
            <td class="table-header">Notas / Motivo</td>
          </tr>
          ${reporte.solicitudes.map((s, index) => {
            const rowClass = index % 2 === 0 ? 'table-row' : 'table-row-alt'
            const estadoClass = s.estado === 'realizada' ? 'estado-realizada' :
                               s.estado === 'no_realizada' ? 'estado-no-realizada' :
                               s.estado === 'pendiente' ? 'estado-pendiente' : 'estado-en-camino'
            const tipoClass = s.tipoPago === 'pagado' ? 'tipo-pagado' : 'tipo-subsidiado'
            const notasMotivo = s.motivoNoRealizacion || s.notas || '-'
            const notasClass = s.motivoNoRealizacion ? 'motivo-rechazo' : ''
            
            return `
              <tr class="${rowClass}">
                <td class="table-cell">${formatDateShort(s.createdAt)}</td>
                <td class="table-cell">${s.nombre} ${s.apellido}</td>
                <td class="table-cell">${s.telefono}</td>
                <td class="table-cell">${s.direccion}${s.barrio ? ' (' + s.barrio + ')' : ''}</td>
                <td class="table-cell ${tipoClass}">${getTipoPagoLabel(s.tipoPago)}</td>
                <td class="table-cell ${estadoClass}">${getEstadoLabel(s.estado)}</td>
                <td class="table-cell ${notasClass}">${notasMotivo}</td>
              </tr>
            `
          }).join('')}
        </table>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const nombreArchivo = `Reporte_Atmosferico_${usarFechasPersonalizadas ? 'Personalizado' : periodo}_${new Date().toISOString().split('T')[0]}.xls`
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-neutral">Reportes y Estadísticas</h1>
              <p className="text-xs sm:text-sm text-gray-600">Genera reportes detallados del servicio atmosférico</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-neutral border-2 border-neutral rounded-lg hover:bg-neutral hover:text-white transition-colors text-sm"
              >
                <span className="sm:hidden">Inicio</span>
                <span className="hidden sm:inline">Volver al Inicio</span>
              </button>
              <button
                onClick={exportToExcel}
                disabled={!reporte || reporte.solicitudes.length === 0}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exportar Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-neutral mb-4">Filtros del Reporte</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value)
                  setUsarFechasPersonalizadas(false)
                }}
                disabled={usarFechasPersonalizadas}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              >
                <option value="dia">Hoy</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mes</option>
                <option value="año">Este Año</option>
              </select>
            </div>

            {/* Tipo de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pago</label>
              <select
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="todos">Todos</option>
                <option value="subsidiado">Subsidiado</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value)
                  if (e.target.value && fechaHasta) {
                    setUsarFechasPersonalizadas(true)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value)
                  if (e.target.value && fechaDesde) {
                    setUsarFechasPersonalizadas(true)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchReporte}
              className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-neutral transition-colors"
            >
              Generar Reporte
            </button>
            {usarFechasPersonalizadas && (
              <button
                onClick={() => {
                  setUsarFechasPersonalizadas(false)
                  setFechaDesde('')
                  setFechaHasta('')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Limpiar Fechas
              </button>
            )}
          </div>

          {usarFechasPersonalizadas && (
            <p className="mt-3 text-sm text-primary font-medium">
              Usando rango de fechas personalizado
            </p>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-lg text-neutral">Cargando reporte...</div>
          </div>
        ) : reporte ? (
          <>
            {/* Info del Período */}
            <div className="bg-gradient-to-r from-primary to-neutral text-white rounded-xl shadow p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    {usarFechasPersonalizadas ? 'Período Personalizado' : getPeriodoLabel(reporte.periodo.nombre)}
                  </h3>
                  <p className="text-white/80">
                    {formatDateShort(reporte.periodo.desde)} - {formatDateShort(reporte.periodo.hasta)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{reporte.estadisticas.total}</p>
                  <p className="text-white/80">solicitudes en total</p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Realizadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{reporte.estadisticas.realizadas}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">No Realizadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">{reporte.estadisticas.noRealizadas}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Pendientes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{reporte.estadisticas.pendientes}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">En Camino</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{reporte.estadisticas.enCamino}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas por Tipo de Pago y Tasa de Éxito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Subsidiados</p>
                    <p className="text-3xl font-bold text-accent">{reporte.estadisticas.subsidiados}</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pagados</p>
                    <p className="text-3xl font-bold text-primary">{reporte.estadisticas.pagados}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tasa de Éxito</p>
                    <p className="text-3xl font-bold text-neutral">{reporte.estadisticas.tasaExito}%</p>
                  </div>
                  <div className="bg-neutral/10 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Solicitudes */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <h3 className="text-lg font-bold text-neutral">Detalle de Solicitudes</h3>
                <p className="text-sm text-gray-600">{reporte.solicitudes.length} solicitudes en el período</p>
              </div>
              
              {reporte.solicitudes.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-bold text-gray-700 mb-2">Sin solicitudes</h4>
                  <p className="text-gray-500">No hay solicitudes en el período seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reporte.solicitudes.map((solicitud) => (
                        <tr key={solicitud.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(solicitud.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {solicitud.nombre} {solicitud.apellido}
                            </div>
                            <div className="text-xs text-gray-500">{solicitud.telefono}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{solicitud.direccion}</div>
                            {solicitud.barrio && (
                              <div className="text-xs text-gray-500">{solicitud.barrio}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              solicitud.tipoPago === 'pagado' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-accent/10 text-accent'
                            }`}>
                              {getTipoPagoLabel(solicitud.tipoPago)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              solicitud.estado === 'realizada' ? 'bg-green-100 text-green-800' :
                              solicitud.estado === 'no_realizada' ? 'bg-red-100 text-red-800' :
                              solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {getEstadoLabel(solicitud.estado)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {solicitud.motivoNoRealizacion ? (
                              <span className="text-sm text-red-600">{solicitud.motivoNoRealizacion}</span>
                            ) : solicitud.notas ? (
                              <span className="text-sm text-gray-600">{solicitud.notas}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-lg text-neutral">No se pudo cargar el reporte</div>
          </div>
        )}
      </main>
    </div>
  )
}
