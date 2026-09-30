import { API_BASE_URL } from './client.ts'

export const HEALTH_PATH = '/actuator/health'

export type HealthStatus = 'up' | 'down' | 'unknown'

/** Reads the service health. Never throws: an unreachable service is reported as {@code down}. */
export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  try {
    const response = await fetch(API_BASE_URL + HEALTH_PATH, { signal, headers: { Accept: 'application/json' } })
    const body = (await response.json().catch(() => null)) as { status?: string } | null
    return body?.status === 'UP' ? 'up' : 'down'
  } catch {
    return 'down'
  }
}
