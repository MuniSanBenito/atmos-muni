'use client'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icono offline */}
          <div className="mb-6">
            <svg
              className="w-24 h-24 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072 0m0 0l2.829-2.829M3 3l3.757 3.757m0 0a9 9 0 0110.486 0M5.636 5.636L21 21"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-neutral mb-3">Sin Conexión</h1>
          <p className="text-gray-600 mb-6">
            No hay conexión a internet. Verifica tu conexión e intenta nuevamente.
          </p>

          <button
            onClick={handleRetry}
            className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-neutral transition-colors"
          >
            Reintentar
          </button>

          <p className="text-xs text-gray-500 mt-6">Atmos San Benito - Modo Offline</p>
        </div>
      </div>
    </div>
  )
}
