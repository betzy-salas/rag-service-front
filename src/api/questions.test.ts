import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { QUESTIONS_URL, server } from '../test/server.ts'
import { ApiError, NetworkError } from './client.ts'
import { askQuestion } from './questions.ts'
import type { AnswerResponse, QuestionRequest } from './types.ts'

const ANSWER: AnswerResponse = {
  answer: 'El despliegue se hace con Jenkins.',
  sources: [{ title: 'Guía de despliegue', url: 'https://wiki/DS/1' }],
}

describe('askQuestion', () => {
  it('posts the question and returns the answer with its sources', async () => {
    let received: QuestionRequest | undefined
    server.use(
      http.post(QUESTIONS_URL, async ({ request }) => {
        received = (await request.json()) as QuestionRequest
        return HttpResponse.json(ANSWER)
      }),
    )

    const result = await askQuestion('¿Cómo se despliega?', 'DS')

    expect(received).toEqual({ question: '¿Cómo se despliega?', spaceKey: 'DS' })
    expect(result).toEqual(ANSWER)
  })

  it('omits the space key when it is empty', async () => {
    let received: QuestionRequest | undefined
    server.use(
      http.post(QUESTIONS_URL, async ({ request }) => {
        received = (await request.json()) as QuestionRequest
        return HttpResponse.json(ANSWER)
      }),
    )

    await askQuestion('¿Qué es KV v2?', '  ')

    expect(received).toEqual({ question: '¿Qué es KV v2?' })
  })

  it('raises an ApiError with the problem detail on a service error', async () => {
    server.use(
      http.post(QUESTIONS_URL, () =>
        HttpResponse.json(
          { title: 'Bad Gateway', status: 502, detail: 'Could not generate the answer with OpenAI' },
          { status: 502, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = await askQuestion('pregunta', undefined).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).message).toBe('Error 502: Could not generate the answer with OpenAI')
  })

  it('falls back to the status code when the error body is not JSON', async () => {
    server.use(http.post(QUESTIONS_URL, () => new HttpResponse('boom', { status: 500 })))

    const error = await askQuestion('pregunta', undefined).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('Error 500')
  })

  it('raises a NetworkError when the service is unreachable', async () => {
    server.use(http.post(QUESTIONS_URL, () => HttpResponse.error()))

    const error = await askQuestion('pregunta', undefined).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(NetworkError)
  })
})
