import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkAuth } from '../lib/auth'

export async function GET(request: NextRequest) {
  // Todos los usuarios autenticados pueden ver barrios
  const auth = await checkAuth(request)
  if (auth.error) return auth.error

  try {
    const payload = await getPayload({ config })

    const barrios = await payload.find({
      collection: 'barrios',
      sort: 'orden',
      limit: 100,
    })

    return NextResponse.json({
      success: true,
      barrios: barrios.docs,
    })
  } catch (error) {
    console.error('Error al obtener barrios:', error)
    return NextResponse.json({ error: 'Error al obtener los barrios' }, { status: 500 })
  }
}
