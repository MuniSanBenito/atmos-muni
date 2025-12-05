import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkAuth } from '../../lib/auth'

// Campos que el chofer puede actualizar
const DRIVER_ALLOWED_FIELDS = ['estado', 'coordenadas', 'fechaRealizacion', 'motivoNoRealizacion']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Todos los usuarios autenticados pueden actualizar (con restricciones)
  const auth = await checkAuth(request)
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const data = await request.json()
    const payload = await getPayload({ config })

    // Si es driver, solo permitir ciertos campos
    if (auth.user?.role === 'driver') {
      const filteredData: Record<string, any> = {}
      for (const field of DRIVER_ALLOWED_FIELDS) {
        if (data[field] !== undefined) {
          filteredData[field] = data[field]
        }
      }

      // Si intentó actualizar campos no permitidos, ignorarlos silenciosamente
      const solicitud = await payload.update({
        collection: 'solicitudes',
        id,
        data: filteredData,
      })

      return NextResponse.json({
        success: true,
        solicitud,
      })
    }

    // Admin y dispatcher pueden actualizar todo
    const solicitud = await payload.update({
      collection: 'solicitudes',
      id,
      data,
    })

    return NextResponse.json({
      success: true,
      solicitud,
    })
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAuth(request)
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await getPayload({ config })

    const solicitud = await payload.findByID({
      collection: 'solicitudes',
      id,
    })

    return NextResponse.json({
      success: true,
      solicitud,
    })
  } catch (error) {
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json({ error: 'Error al obtener la solicitud' }, { status: 500 })
  }
}
