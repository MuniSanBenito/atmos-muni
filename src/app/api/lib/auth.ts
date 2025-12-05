import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export type UserRole = 'admin' | 'dispatcher' | 'driver'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
}

export interface AuthResult {
  user: AuthUser | null
  error?: NextResponse
}

/**
 * Verifica la autenticación del usuario y opcionalmente valida roles permitidos
 */
export async function checkAuth(
  request: NextRequest,
  allowedRoles?: UserRole[],
): Promise<AuthResult> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 }),
      }
    }

    // Si se especifican roles permitidos, verificar
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role as UserRole)) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Sin permisos para realizar esta acción.' },
            { status: 403 },
          ),
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role as UserRole,
      },
    }
  } catch (error) {
    console.error('Error de autenticación:', error)
    return {
      user: null,
      error: NextResponse.json({ error: 'Error al verificar autenticación.' }, { status: 500 }),
    }
  }
}
