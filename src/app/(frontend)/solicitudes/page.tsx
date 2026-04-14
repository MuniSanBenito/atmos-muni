'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { fetchAuth } from '../../../lib/fetchAuth'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState,
} from '@tanstack/react-table'

interface Solicitud {
  id: string
  nombre: string
  apellido: string
  telefono: string
  direccion: string
  barrio?: { id: string; nombre: string } | null
  tipoPago: 'subsidiado' | 'pagado'
  coordenadas?: string
  notas?: string
  estado: 'pendiente' | 'en_camino' | 'realizada' | 'no_realizada'
  fechaSolicitud?: string
  createdAt: string
  updatedAt: string
  fechaRealizacion?: string
  motivoNoRealizacion?: string
}

const columnHelper = createColumnHelper<Solicitud>()

export default function SolicitudesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroFecha, setFiltroFecha] = useState<string>('')
  const [filtroTipoPago, setFiltroTipoPago] = useState<string>('todos')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const busquedaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [busquedaDebounced, setBusquedaDebounced] = useState<string>('')

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.pageIndex + 1))
      params.set('limit', String(pagination.pageSize))
      if (sorting[0]) {
        params.set('sort', sorting[0].id)
        params.set('sortDir', sorting[0].desc ? 'desc' : 'asc')
      }
      if (filtroEstado !== 'todas') params.set('estado', filtroEstado)
      if (filtroTipoPago !== 'todos') params.set('tipoPago', filtroTipoPago)
      if (busquedaDebounced) params.set('q', busquedaDebounced)

      const response = await fetchAuth(`/api/solicitudes?${params}`)
      const data = await response.json()
      if (data.success) {
        setSolicitudes(data.solicitudes)
        setTotalDocs(data.totalDocs)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, sorting, filtroEstado, filtroTipoPago, busquedaDebounced])

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.replace('/login')
      else if (user.role === 'driver') router.replace('/servicio')
      else fetchSolicitudes()
    }
  }, [user, authLoading, router, fetchSolicitudes])

  // Debounce búsqueda
  useEffect(() => {
    if (busquedaRef.current) clearTimeout(busquedaRef.current)
    busquedaRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    }, 400)
    return () => {
      if (busquedaRef.current) clearTimeout(busquedaRef.current)
    }
  }, [busqueda])

  // Reset página al cambiar filtros
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [filtroEstado, filtroFecha, filtroTipoPago])

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_camino: 'bg-blue-100 text-blue-800 border-blue-300',
      realizada: 'bg-green-100 text-green-800 border-green-300',
      no_realizada: 'bg-red-100 text-red-800 border-red-300',
    }
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_camino: 'En Camino',
      realizada: 'Realizada',
      no_realizada: 'No Realizada',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badges[estado] ?? ''}`}>
        {labels[estado] ?? estado}
      </span>
    )
  }

  const getTipoPagoBadge = (tipo: string) => {
    return tipo === 'pagado' ? (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        Pagado
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
        Subsidiado
      </span>
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return <span className="text-gray-400 italic text-xs">—</span>
    return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Filtro local por fecha (sobre los docs de la página actual)
  const solicitudesFiltradas = useMemo(() => {
    if (!filtroFecha) return solicitudes
    return solicitudes.filter((s) => {
      const fechaCreacion = new Date(s.createdAt).toISOString().split('T')[0]
      const fechaSol = s.fechaSolicitud ? new Date(s.fechaSolicitud).toISOString().split('T')[0] : null
      return fechaCreacion === filtroFecha || fechaSol === filtroFecha
    })
  }, [solicitudes, filtroFecha])

  const columns = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        header: 'Creación',
        cell: (info) => <span className="text-xs text-gray-600">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('fechaSolicitud', {
        header: 'F. Solicitud',
        enableSorting: true,
        cell: (info) => <span className="text-xs">{formatDateShort(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="font-semibold text-neutral">
            {row.original.nombre} {row.original.apellido}
          </span>
        ),
      }),
      columnHelper.accessor('telefono', {
        header: 'Teléfono',
        enableSorting: false,
        cell: (info) => <span className="text-sm">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'ubicacion',
        header: 'Dirección',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.barrio?.nombre ? (
              <span className="font-medium text-primary">{row.original.barrio.nombre} — </span>
            ) : null}
            {row.original.direccion}
          </span>
        ),
      }),
      columnHelper.accessor('tipoPago', {
        header: 'Tipo',
        enableSorting: false,
        cell: (info) => getTipoPagoBadge(info.getValue()),
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        enableSorting: false,
        cell: (info) => getEstadoBadge(info.getValue()),
      }),
      columnHelper.accessor('fechaRealizacion', {
        header: 'F. Realización',
        enableSorting: false,
        cell: (info) => formatDateShort(info.getValue()),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: solicitudesFiltradas,
    columns,
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    onSortingChange: (updater) => {
      setSorting(updater)
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  })

  const limpiarFiltros = () => {
    setFiltroEstado('todas')
    setFiltroTipoPago('todos')
    setBusqueda('')
    setFiltroFecha('')
    setSorting([{ id: 'createdAt', desc: true }])
    setPagination({ pageIndex: 0, pageSize: 25 })
  }

  const hayFiltros = busqueda || filtroFecha || filtroEstado !== 'todas' || filtroTipoPago !== 'todos'

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-neutral">Solicitudes Atmosféricas</h1>
              <p className="text-xs sm:text-sm text-gray-600">Gestiona todas las solicitudes del sistema</p>
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
                onClick={() => router.push('/solicitudes/nueva')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-neutral transition-colors font-semibold text-sm"
              >
                + Nueva
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
          {/* Buscador + Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-neutral block mb-2">🔍 Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre, apellido, dirección, teléfono..."
                  className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm"
                />
                {busqueda ? (
                  <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-neutral block mb-2">📅 Filtrar por Día</label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm"
                />
                {filtroFecha && (
                  <button onClick={() => setFiltroFecha('')} className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">✕</button>
                )}
              </div>
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="text-sm font-bold text-neutral block mb-2">📋 Estado</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todas', label: 'Todas', active: 'bg-neutral text-white', idle: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                { key: 'pendiente', label: 'Pendientes', active: 'bg-yellow-500 text-white', idle: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
                { key: 'en_camino', label: 'En Camino', active: 'bg-blue-500 text-white', idle: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
                { key: 'realizada', label: 'Realizadas', active: 'bg-green-500 text-white', idle: 'bg-green-100 text-green-800 hover:bg-green-200' },
                { key: 'no_realizada', label: 'No Realizadas', active: 'bg-red-500 text-white', idle: 'bg-red-100 text-red-800 hover:bg-red-200' },
              ].map(({ key, label, active, idle }) => (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${filtroEstado === key ? active : idle}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Tipo de Pago */}
          <div>
            <label className="text-sm font-bold text-neutral block mb-2">💳 Tipo de Pago</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: 'Todos', active: 'bg-neutral text-white', idle: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                { key: 'subsidiado', label: 'Subsidiado', active: 'bg-emerald-600 text-white', idle: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
                { key: 'pagado', label: 'Pagado', active: 'bg-primary text-white', idle: 'bg-primary/10 text-primary hover:bg-primary/20' },
              ].map(({ key, label, active, idle }) => (
                <button
                  key={key}
                  onClick={() => setFiltroTipoPago(key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${filtroTipoPago === key ? active : idle}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros activos + limpiar */}
          {hayFiltros && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                <span className="font-medium">Filtros activos:</span>
                {busqueda && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Búsqueda: "{busqueda}"</span>}
                {filtroFecha && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">Fecha: {new Date(filtroFecha + 'T12:00:00').toLocaleDateString('es-AR')}</span>}
                {filtroEstado !== 'todas' && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">{filtroEstado.replace('_', ' ')}</span>}
                {filtroTipoPago !== 'todos' && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs capitalize">{filtroTipoPago}</span>}
              </div>
              <button onClick={limpiarFiltros} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm">
                🗑️ Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-600">
              {loading ? 'Cargando...' : (
                <>
                  <span className="font-bold text-neutral">{totalDocs}</span> solicitudes en total
                  {filtroFecha && solicitudesFiltradas.length !== solicitudes.length && (
                    <span className="ml-2 text-gray-400">(mostrando {solicitudesFiltradas.length} con ese día)</span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filas por página:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Cargando solicitudes...</div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No hay solicitudes</h3>
              <p className="text-gray-500">
                {filtroEstado === 'todas' ? 'Aún no se han registrado solicitudes en el sistema' : `No hay solicitudes con el estado "${filtroEstado}"`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide select-none ${header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="text-gray-400">
                                  {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                                </span>
                              )}
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-8" />
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSolicitud(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
                <span>
                  Página <span className="font-bold text-neutral">{pagination.pageIndex + 1}</span> de{' '}
                  <span className="font-bold text-neutral">{totalPages}</span>
                  {' '}&middot; {totalDocs} solicitudes
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Primera página"
                  >
                    «
                  </button>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹ Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(pagination.pageIndex - 2, totalPages - 5))
                    const pageNum = start + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => table.setPageIndex(pageNum)}
                        className={`px-3 py-1.5 rounded-lg border transition-colors ${
                          pageNum === pagination.pageIndex
                            ? 'bg-primary text-white border-primary font-bold'
                            : 'border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente ›
                  </button>
                  <button
                    onClick={() => table.setPageIndex(totalPages - 1)}
                    disabled={!table.getCanNextPage()}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Detalles */}
      {selectedSolicitud && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSolicitud(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-primary text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedSolicitud.nombre} {selectedSolicitud.apellido}
                  </h2>
                  <p className="text-white/90">Detalles de la Solicitud</p>
                </div>
                <button
                  onClick={() => setSelectedSolicitud(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Estado */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Estado Actual</h3>
                <div>{getEstadoBadge(selectedSolicitud.estado)}</div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="font-medium text-neutral">{selectedSolicitud.telefono}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tipo de Servicio</p>
                    <div>{getTipoPagoBadge(selectedSolicitud.tipoPago)}</div>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Ubicación</h3>
                <div className="space-y-3">
                  {selectedSolicitud.barrio && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Barrio</p>
                      <p className="font-medium text-neutral">{selectedSolicitud.barrio.nombre}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dirección</p>
                    <p className="font-medium text-neutral">{selectedSolicitud.direccion}</p>
                  </div>
                  {selectedSolicitud.coordenadas && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Coordenadas GPS</p>
                      <p className="font-medium text-neutral font-mono text-sm mb-3">
                        📍 {selectedSolicitud.coordenadas}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedSolicitud.coordenadas.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-neutral transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Ver en Maps
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSolicitud.coordenadas.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Navegar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {selectedSolicitud.notas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Notas Adicionales</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedSolicitud.notas}</p>
                  </div>
                </div>
              )}

              {/* Fecha de Solicitud */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Fecha de Solicitud</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-blue-700 font-medium">
                      {selectedSolicitud.fechaSolicitud 
                        ? new Date(selectedSolicitud.fechaSolicitud).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha de Realización */}
              {selectedSolicitud.fechaRealizacion && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Fecha de Realización</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-700 font-medium">{formatDate(selectedSolicitud.fechaRealizacion)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivo de No Realización */}
              {selectedSolicitud.estado === 'no_realizada' && selectedSolicitud.motivoNoRealizacion && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Motivo de No Realización</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-red-700">{selectedSolicitud.motivoNoRealizacion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">
                  Información de Registro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de Creación</p>
                    <p className="font-medium text-neutral">
                      {formatDate(selectedSolicitud.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Última Actualización</p>
                    <p className="font-medium text-neutral">
                      {formatDate(selectedSolicitud.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Editar en Admin */}
              <div className="pt-4 border-t">
                <a
                  href={`/admin/collections/solicitudes/${selectedSolicitud.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 bg-neutral text-white font-semibold rounded-lg hover:bg-primary transition-colors"
                >
                  Editar en Panel de Administración
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
