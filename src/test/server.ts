import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const QUESTIONS_URL = 'http://localhost:8081/questions'
export const HEALTH_URL = 'http://localhost:8081/actuator/health'

/** Mock of the assistant service. The health endpoint is always up; each test adds the question handler it needs. */
export const server = setupServer(http.get(HEALTH_URL, () => HttpResponse.json({ status: 'UP' })))
