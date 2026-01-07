'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  total: number
  pendientes: number
  enCamino: number
  realizadas: number
  noRealizadas: number
  subsidiados: number
  pagados: number
  mes: {
    total: number
    realizadas: number
  }
  tasaExito: number
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'driver') {
        // Si es chofer, redirigir a su panel
        router.replace('/servicio')
      } else {
        // Cargar estadísticas para dispatcher/admin
        fetchStats()
      }
    }
  }, [user, loading, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/solicitudes/stats', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (loading) {
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
              <h1 className="text-lg sm:text-2xl font-bold text-neutral truncate">Municipalidad de San Benito</h1>
              <p className="text-xs sm:text-sm text-gray-600">Sistema de Gestión Atmosférica</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-neutral">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold text-neutral mb-1 sm:mb-2">
            Bienvenido, {user.email.split('@')[0]}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">Selecciona una opción para continuar</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ver Solicitudes Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-primary">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-neutral mb-2">Ver Solicitudes</h3>
                <p className="text-gray-600 mb-4">
                  Consulta y gestiona todas las solicitudes de servicios atmosféricos registradas en
                  el sistema
                </p>
                <button
                  onClick={() => router.push('/solicitudes')}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-neutral transition-colors"
                >
                  Ver Solicitudes
                </button>
              </div>
            </div>
          </div>

          {/* Cargar Solicitud Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-accent">
            <div className="flex items-start gap-4">
              <div className="bg-accent/10 p-4 rounded-lg">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-neutral mb-2">Nueva Solicitud</h3>
                <p className="text-gray-600 mb-4">
                  Registra una nueva solicitud de servicio atmosférico en el sistema municipal
                </p>
                <button
                  onClick={() => router.push('/solicitudes/nueva')}
                  className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-neutral transition-colors"
                >
                  Crear Solicitud
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Solicitudes</p>
                <p className="text-3xl font-bold text-neutral">
                  {loadingStats ? '...' : (stats?.total ?? 0)}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-primary"
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {loadingStats ? '...' : (stats?.pendientes ?? 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
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

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Camino</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loadingStats ? '...' : (stats?.enCamino ?? 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
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

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Realizadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {loadingStats ? '...' : (stats?.realizadas ?? 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
            </div>
          </div>
        </div>

        {/* Stats Adicionales */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">No Realizadas</p>
                <p className="text-3xl font-bold text-red-600">
                  {loadingStats ? '...' : (stats?.noRealizadas ?? 0)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subsidiados</p>
                <p className="text-3xl font-bold text-accent">
                  {loadingStats ? '...' : (stats?.subsidiados ?? 0)}
                </p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pagados</p>
                <p className="text-3xl font-bold text-primary">
                  {loadingStats ? '...' : (stats?.pagados ?? 0)}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasa de Éxito</p>
                <p className="text-3xl font-bold text-neutral">
                  {loadingStats ? '...' : `${stats?.tasaExito ?? 0}%`}
                </p>
              </div>
              <div className="bg-neutral/10 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-neutral"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Este Mes */}
        {stats && (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-neutral mb-4">Resumen del Mes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-neutral">{stats.mes.total}</p>
                <p className="text-sm text-gray-600">Solicitudes este mes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{stats.mes.realizadas}</p>
                <p className="text-sm text-gray-600">Realizadas este mes</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
