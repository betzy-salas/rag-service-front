import { useEffect, useState } from 'react'
import { getHealth, type HealthStatus } from '../../api/health.ts'

const POLL_INTERVAL_MS = 30_000

/** Polls the service health so the sidebar can show whether the assistant is reachable. */
export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('unknown')

  useEffect(() => {
    const controller = new AbortController()
    const check = () => {
      void getHealth(controller.signal).then((result) => {
        if (!controller.signal.aborted) setStatus(result)
      })
    }
    check()
    const timer = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [])

  return status
}
