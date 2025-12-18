'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../context/AuthContext'

interface Barrio {
  id: string
  nombre: string
  orden: number
}

export default function NuevaSolicitudPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [barrios, setBarrios] = useState<Barrio[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    barrio: '',
    direccion: '',
    tipoPago: 'subsidiado',
    coordenadas: '',
    notas: '',
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'driver') {
        // Si es chofer, redirigir a su panel
        router.replace('/servicio')
      } else {
        // Cargar barrios
        fetchBarrios()
      }
    }
  }, [user, authLoading, router])

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al crear la solicitud')
      }

      // Redirigir a la lista de solicitudes o al home
      router.push('/solicitudes')
    } catch (err) {
      setError('Hubo un error al crear la solicitud. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral">Nueva Solicitud Atmosférica</h1>
            <p className="text-sm text-gray-600">
              Complete el formulario para registrar la solicitud
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-neutral border-2 border-neutral rounded-lg hover:bg-neutral hover:text-white transition-colors"
          >
            Volver
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div>
              <h2 className="text-xl font-bold text-neutral mb-4 pb-2 border-b-2 border-primary">
                Información del Solicitante
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-semibold text-neutral mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Ingrese el nombre"
                  />
                </div>

                <div>
                  <label
                    htmlFor="apellido"
                    className="block text-sm font-semibold text-neutral mb-2"
                  >
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Ingrese el apellido"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-semibold text-neutral mb-2"
                  >
                    N° de Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Ej: 3765-123456"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tipoPago"
                    className="block text-sm font-semibold text-neutral mb-2"
                  >
                    Tipo de Servicio <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipoPago"
                    name="tipoPago"
                    value={formData.tipoPago}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                  >
                    <option value="subsidiado">Subsidiado</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Información de Ubicación */}
            <div>
              <h2 className="text-xl font-bold text-neutral mb-4 pb-2 border-b-2 border-accent">
                Información de Ubicación
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="barrio"
                      className="block text-sm font-semibold text-neutral mb-2"
                    >
                      Barrio <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="barrio"
                      name="barrio"
                      value={formData.barrio}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-white"
                    >
                      <option value="">Seleccione un barrio</option>
                      {barrios.map((barrio) => (
                        <option key={barrio.id} value={barrio.id}>
                          {barrio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="direccion"
                      className="block text-sm font-semibold text-neutral mb-2"
                    >
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="direccion"
                      name="direccion"
                      type="text"
                      value={formData.direccion}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="Ej: Calle 25 de Mayo 123"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="coordenadas"
                    className="block text-sm font-semibold text-neutral mb-2"
                  >
                    Coordenadas GPS <span className="text-gray-500 text-xs">(Opcional)</span>
                  </label>
                  <input
                    id="coordenadas"
                    name="coordenadas"
                    type="text"
                    value={formData.coordenadas}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Ej: -26.123456, -54.654321"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: Latitud, Longitud</p>
                </div>
              </div>
            </div>

            {/* Notas Adicionales */}
            <div>
              <h2 className="text-xl font-bold text-neutral mb-4 pb-2 border-b-2 border-secondary">
                Información Adicional
              </h2>
              <div>
                <label htmlFor="notas" className="block text-sm font-semibold text-neutral mb-2">
                  Notas Adicionales <span className="text-gray-500 text-xs">(Opcional)</span>
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all resize-none"
                  placeholder="Ingrese cualquier información adicional relevante sobre la solicitud..."
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg">
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-neutral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Guardando...
                  </span>
                ) : (
                  'Guardar Solicitud'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
