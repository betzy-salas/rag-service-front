import type { ProblemDetail } from './types.ts'

/** Error raised when the service answers with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetail | null

  constructor(status: number, problem: ProblemDetail | null) {
    super(describeProblem(status, problem))
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

/** Error raised when the request never reached the service (offline, CORS, refused connection). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('No se pudo conectar con el assistant. Comprueba que el servicio está arrancado.', { cause })
    this.name = 'NetworkError'
  }
}

/** Base URL of the service. Empty when the front is served from the same origin as the API. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export interface RequestOptions {
  signal?: AbortSignal
}

/** Sends a JSON body and parses the JSON response, translating failures into typed errors. */
export async function postJson<TBody, TResponse>(
  path: string,
  body: TBody,
  options: RequestOptions = {},
): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(API_BASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError(error)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, payload as ProblemDetail | null)
  }
  return payload as TResponse
}

function describeProblem(status: number, problem: ProblemDetail | null): string {
  const detail = problem?.detail || problem?.title
  return `Error ${status}${detail ? `: ${detail}` : ''}`
}
