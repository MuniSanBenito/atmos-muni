'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

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
  createdAt: string
  updatedAt: string
  fechaRealizacion?: string
  motivoNoRealizacion?: string
}

export default function SolicitudesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'driver') {
        // Si es chofer, redirigir a su panel
        router.replace('/servicio')
      } else {
        fetchSolicitudes()
      }
    }
  }, [user, authLoading, router])

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch('/api/solicitudes', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setSolicitudes(data.solicitudes)
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_camino: 'bg-blue-100 text-blue-800 border-blue-300',
      realizada: 'bg-green-100 text-green-800 border-green-300',
      no_realizada: 'bg-red-100 text-red-800 border-red-300',
    }
    const labels = {
      pendiente: 'Pendiente',
      en_camino: 'En Camino',
      realizada: 'Realizada',
      no_realizada: 'No Realizada',
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[estado as keyof typeof badges]}`}
      >
        {labels[estado as keyof typeof labels]}
      </span>
    )
  }

  const getTipoPagoBadge = (tipo: string) => {
    return tipo === 'pagado' ? (
      <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        Pagado
      </span>
    ) : (
      <span className="px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
        Subsidiado
      </span>
    )
  }

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

  const solicitudesFiltradas =
    filtroEstado === 'todas' ? solicitudes : solicitudes.filter((s) => s.estado === filtroEstado)

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-neutral">Cargando solicitudes...</div>
      </div>
    )
  }

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
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-neutral mb-3 sm:mb-4">Filtrar por Estado</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setFiltroEstado('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'todas'
                  ? 'bg-neutral text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({solicitudes.length})
            </button>
            <button
              onClick={() => setFiltroEstado('pendiente')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'pendiente'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              Pendientes ({solicitudes.filter((s) => s.estado === 'pendiente').length})
            </button>
            <button
              onClick={() => setFiltroEstado('en_camino')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'en_camino'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              En Camino ({solicitudes.filter((s) => s.estado === 'en_camino').length})
            </button>
            <button
              onClick={() => setFiltroEstado('realizada')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'realizada'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              Realizadas ({solicitudes.filter((s) => s.estado === 'realizada').length})
            </button>
            <button
              onClick={() => setFiltroEstado('no_realizada')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'no_realizada'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              No Realizadas ({solicitudes.filter((s) => s.estado === 'no_realizada').length})
            </button>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay solicitudes</h3>
            <p className="text-gray-500">
              {filtroEstado === 'todas'
                ? 'Aún no se han registrado solicitudes en el sistema'
                : `No hay solicitudes con el estado "${filtroEstado}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudesFiltradas.map((solicitud) => (
              <div
                key={solicitud.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedSolicitud(solicitud)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-neutral">
                          {solicitud.nombre} {solicitud.apellido}
                        </h3>
                        {getEstadoBadge(solicitud.estado)}
                        {getTipoPagoBadge(solicitud.tipoPago)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {solicitud.telefono}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-accent"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {solicitud.barrio?.nombre && (
                            <span className="font-medium">{solicitud.barrio.nombre} - </span>
                          )}
                          {solicitud.direccion}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-secondary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(solicitud.createdAt)}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                      <p className="font-medium text-neutral font-mono text-sm">
                        {selectedSolicitud.coordenadas}
                      </p>
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
