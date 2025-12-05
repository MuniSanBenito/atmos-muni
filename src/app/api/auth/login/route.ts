import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const payload = await getPayload({ config })

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    // Obtener la cookie de Payload
    const cookieStore = await cookies()
    const token = result.token

    if (token) {
      // Establecer la cookie manualmente
      cookieStore.set('payload-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name || result.user.email,
        role: result.user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }
}
