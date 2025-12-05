const CACHE_NAME = 'atmos-v1'
const OFFLINE_URL = '/offline'

// Recursos que se cachean en la instalación
const PRECACHE_RESOURCES = ['/', '/login', '/servicio', '/offline', '/manifest.json']

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // Cache de recursos básicos
      await cache.addAll(PRECACHE_RESOURCES)
      // Forzar activación inmediata
      self.skipWaiting()
    })(),
  )
})

// Activación - limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      )
      // Tomar control de todas las páginas
      self.clients.claim()
    })(),
  )
})

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return

  // Para las APIs, usar network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Para navegación (HTML), usar network-first con fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Intentar red primero
          const networkResponse = await fetch(request)
          // Cachear la respuesta exitosa
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, networkResponse.clone())
          return networkResponse
        } catch (error) {
          // Si falla la red, buscar en cache
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Si no hay cache, mostrar página offline
          return caches.match(OFFLINE_URL)
        }
      })(),
    )
    return
  }

  // Para recursos estáticos, usar cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Default: network-first
  event.respondWith(networkFirst(request))
})

// Estrategia Cache-First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    // Si es una imagen, devolver placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } },
      )
    }
    throw error
  }
}

// Estrategia Network-First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    // Cachear respuesta exitosa (solo GET)
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Sincronización en background (cuando vuelve la conexión)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-solicitudes') {
    event.waitUntil(syncPendingRequests())
  }
})

// Función para sincronizar requests pendientes
async function syncPendingRequests() {
  // Implementar si se necesita sincronización offline
  console.log('Sincronizando solicitudes pendientes...')
}

// Push notifications (para futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
