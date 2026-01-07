'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

interface Barrio {
  id: string
  nombre: string
  orden: number
}

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
}

export default function ServicioPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [updatingState, setUpdatingState] = useState(false)
  const [showFinalizarModal, setShowFinalizarModal] = useState(false)
  const [estadoFinal, setEstadoFinal] = useState<'realizada' | 'no_realizada'>('realizada')
  const [notaFinal, setNotaFinal] = useState('')
  const [coordenadasCapturadas, setCoordenadasCapturadas] = useState('')
  const [capturandoGPS, setCapturandoGPS] = useState(false)
  const [barrios, setBarrios] = useState<Barrio[]>([])
  const [filtroBarrio, setFiltroBarrio] = useState<string>('')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role !== 'driver') {
        // Si no es chofer, redirigir al home del dispatcher
        router.replace('/')
      } else {
        fetchBarrios()
        fetchSolicitudes()
      }
    }
  }, [user, loading, router])

  // Re-fetch when barrio filter changes
  useEffect(() => {
    if (user && user.role === 'driver') {
      fetchSolicitudes()
    }
  }, [filtroBarrio])

  const fetchBarrios = async () => {
    try {
      const response = await fetch('/api/get-barrios', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setBarrios(data.barrios)
      }
    } catch (error) {
      console.error('Error al cargar barrios:', error)
    }
  }

  const fetchSolicitudes = async () => {
    try {
      // Usar el filtro de activas para solo traer pendientes y en_camino
      let url = '/api/solicitudes?activas=true'
      if (filtroBarrio) {
        url += `&barrio=${filtroBarrio}`
      }
      const response = await fetch(url, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setSolicitudes(data.solicitudes)
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
    } finally {
      setLoadingSolicitudes(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
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

  const getEstadoBadge = (estado: string) => {
    if (estado === 'pendiente') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
          Pendiente
        </span>
      )
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
        En Camino
      </span>
    )
  }

  const cambiarEstado = async (solicitudId: string, nuevoEstado: string) => {
    setUpdatingState(true)
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
        credentials: 'include',
      })

      if (response.ok) {
        await fetchSolicitudes()
        setSelectedSolicitud(null)
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado')
    } finally {
      setUpdatingState(false)
    }
  }

  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    setCapturandoGPS(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        setCoordenadasCapturadas(coords)
        setCapturandoGPS(false)
      },
      (error) => {
        console.error('Error al obtener ubicación:', error)
        alert('No se pudo obtener la ubicación. Verifica los permisos.')
        setCapturandoGPS(false)
      },
    )
  }

  const finalizarServicio = async () => {
    if (!selectedSolicitud) return

    setUpdatingState(true)
    try {
      const dataToUpdate: any = {
        estado: estadoFinal,
      }

      // Si hay coordenadas capturadas y no había antes, agregarlas
      if (coordenadasCapturadas && !selectedSolicitud.coordenadas) {
        dataToUpdate.coordenadas = coordenadasCapturadas
      }

      // Si es realizada, agregar fecha
      if (estadoFinal === 'realizada') {
        dataToUpdate.fechaRealizacion = new Date().toISOString()
      }

      // Si es no realizada, agregar motivo
      if (estadoFinal === 'no_realizada' && notaFinal) {
        dataToUpdate.motivoNoRealizacion = notaFinal
      }

      const response = await fetch(`/api/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
        credentials: 'include',
      })

      if (response.ok) {
        await fetchSolicitudes()
        setShowFinalizarModal(false)
        setSelectedSolicitud(null)
        setNotaFinal('')
        setCoordenadasCapturadas('')
        setEstadoFinal('realizada')
      }
    } catch (error) {
      console.error('Error al finalizar servicio:', error)
      alert('Error al finalizar el servicio')
    } finally {
      setUpdatingState(false)
    }
  }

  const abrirModalFinalizar = (estado: 'realizada' | 'no_realizada') => {
    setEstadoFinal(estado)
    setShowFinalizarModal(true)
    setNotaFinal('')
    setCoordenadasCapturadas('')
  }

  if (loading || (user && user.role !== 'driver')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-neutral">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-neutral truncate">Panel del Chofer</h1>
              <p className="text-xs sm:text-sm text-gray-600">Servicios Atmosféricos Asignados</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-neutral">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">Chofer</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-neutral text-white rounded-lg hover:bg-primary transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <span className="sm:hidden">Salir</span>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total</p>
                <p className="text-xl sm:text-3xl font-bold text-neutral">{solicitudes.length}</p>
              </div>
              <div className="bg-primary/10 p-2 sm:p-3 rounded-lg hidden sm:block">
                <svg
                  className="w-6 sm:w-8 h-6 sm:h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Pendientes</p>
                <p className="text-xl sm:text-3xl font-bold text-secondary">
                  {solicitudes.filter((s) => s.estado === 'pendiente').length}
                </p>
              </div>
              <div className="bg-secondary/10 p-2 sm:p-3 rounded-lg hidden sm:block">
                <svg
                  className="w-6 sm:w-8 h-6 sm:h-8 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">En Camino</p>
                <p className="text-xl sm:text-3xl font-bold text-accent">
                  {solicitudes.filter((s) => s.estado === 'en_camino').length}
                </p>
              </div>
              <div className="bg-accent/10 p-2 sm:p-3 rounded-lg hidden sm:block">
                <svg
                  className="w-6 sm:w-8 h-6 sm:h-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Servicios */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral">Servicios Activos</h2>
                <p className="text-sm text-gray-600 mt-1">Servicios pendientes y en progreso</p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="filtroBarrio" className="text-sm font-medium text-gray-700">
                  Filtrar por barrio:
                </label>
                <select
                  id="filtroBarrio"
                  value={filtroBarrio}
                  onChange={(e) => setFiltroBarrio(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
                >
                  <option value="">Todos los barrios</option>
                  {barrios.map((barrio) => (
                    <option key={barrio.id} value={barrio.id}>
                      {barrio.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingSolicitudes ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">Cargando servicios...</div>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="p-12 text-center">
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
              <h3 className="text-xl font-bold text-gray-700 mb-2">No hay servicios activos</h3>
              <p className="text-gray-500">Todos los servicios están completados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSolicitud(solicitud)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-neutral">
                          {solicitud.nombre} {solicitud.apellido}
                        </h3>
                        {getEstadoBadge(solicitud.estado)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
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
                        <div className="flex items-center gap-2 text-gray-600">
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
                      </div>
                      {solicitud.coordenadas && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          GPS: {solicitud.coordenadas}
                        </div>
                      )}
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
              ))}
            </div>
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
            <div className="bg-primary text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedSolicitud.nombre} {selectedSolicitud.apellido}
                  </h2>
                  <p className="text-white/90">Detalles del Servicio</p>
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

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Estado</h3>
                {getEstadoBadge(selectedSolicitud.estado)}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Contacto</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-neutral text-lg">{selectedSolicitud.telefono}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Ubicación</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedSolicitud.barrio && (
                    <p className="text-sm text-gray-500 mb-1">
                      <span className="font-medium text-neutral">{selectedSolicitud.barrio.nombre}</span>
                    </p>
                  )}
                  <p className="font-medium text-neutral">{selectedSolicitud.direccion}</p>
                  {selectedSolicitud.coordenadas && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 font-mono">
                          📍 {selectedSolicitud.coordenadas}
                        </p>
                      </div>

                      {/* Mapa embebido */}
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps?q=${selectedSolicitud.coordenadas.replace(/\s/g, '')}&output=embed`}
                          allowFullScreen
                        />
                      </div>

                      {/* Botones de navegación */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedSolicitud.coordenadas.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-neutral transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Ver en Maps
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSolicitud.coordenadas.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          Navegar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedSolicitud.notas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Notas</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedSolicitud.notas}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Fecha de Solicitud</h3>
                <p className="text-neutral">{formatDate(selectedSolicitud.createdAt)}</p>
              </div>

              {/* Acciones de Cambio de Estado */}
              <div className="pt-4 border-t space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Cambiar Estado</h3>

                {selectedSolicitud.estado === 'pendiente' && (
                  <button
                    onClick={() => cambiarEstado(selectedSolicitud.id, 'en_camino')}
                    disabled={updatingState}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    {updatingState ? 'Actualizando...' : 'Marcar En Camino'}
                  </button>
                )}

                {selectedSolicitud.estado === 'en_camino' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => abrirModalFinalizar('realizada')}
                      disabled={updatingState}
                      className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Realizada
                    </button>
                    <button
                      onClick={() => abrirModalFinalizar('no_realizada')}
                      disabled={updatingState}
                      className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      No Realizada
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalizar Servicio */}
      {showFinalizarModal && selectedSolicitud && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowFinalizarModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-6 rounded-t-2xl text-white ${estadoFinal === 'realizada' ? 'bg-green-600' : 'bg-red-600'}`}
            >
              <h2 className="text-2xl font-bold">
                {estadoFinal === 'realizada' ? 'Marcar como Realizada' : 'Marcar como No Realizada'}
              </h2>
              <p className="text-white/90 mt-1">
                {selectedSolicitud.nombre} {selectedSolicitud.apellido}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Capturar Coordenadas si no existen */}
              {!selectedSolicitud.coordenadas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Ubicación GPS</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coordenadasCapturadas}
                      onChange={(e) => setCoordenadasCapturadas(e.target.value)}
                      placeholder="Latitud, Longitud"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={capturarUbicacion}
                      disabled={capturandoGPS}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {capturandoGPS ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          ...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
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
                          GPS
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Las coordenadas se guardarán si no fueron registradas antes
                  </p>
                </div>
              )}

              {/* Nota para No Realizada */}
              {estadoFinal === 'no_realizada' && (
                <div>
                  <label
                    htmlFor="notaFinal"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Motivo de No Realización
                  </label>
                  <textarea
                    id="notaFinal"
                    value={notaFinal}
                    onChange={(e) => setNotaFinal(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="Describe el motivo por el cual no se pudo realizar el servicio..."
                  />
                </div>
              )}

              {/* Nota opcional para Realizada */}
              {estadoFinal === 'realizada' && (
                <div>
                  <label
                    htmlFor="notaFinal"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Observaciones <span className="text-gray-500 text-xs">(Opcional)</span>
                  </label>
                  <textarea
                    id="notaFinal"
                    value={notaFinal}
                    onChange={(e) => setNotaFinal(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Agrega observaciones sobre el servicio realizado..."
                  />
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowFinalizarModal(false)}
                  disabled={updatingState}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={finalizarServicio}
                  disabled={updatingState || (estadoFinal === 'no_realizada' && !notaFinal.trim())}
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                    estadoFinal === 'realizada'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {updatingState ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
