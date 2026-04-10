/**
 * Wrapper de fetch que detecta respuestas 401 y dispara el evento
 * 'auth:session-expired' para que el AuthContext limpie la sesión.
 */
export async function fetchAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, { credentials: 'include', ...init })

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:session-expired'))
  }

  return response
}
