import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { HEALTH_URL, QUESTIONS_URL, server } from '../../test/server.ts'
import { ChatPanel } from './ChatPanel.tsx'

const ANSWER = {
  answer: 'El despliegue se hace con Jenkins.',
  sources: [
    { title: 'Guía de despliegue', url: 'https://wiki.example/wiki/spaces/DS/pages/1' },
    { title: '', url: 'https://wiki.example/wiki/pages/2' },
  ],
}

function answerWith(body: Record<string, unknown>, onRequest?: (request: Request) => void) {
  server.use(
    http.post(QUESTIONS_URL, async ({ request }) => {
      onRequest?.(request.clone())
      return HttpResponse.json(body)
    }),
  )
}

describe('ChatPanel', () => {
  beforeEach(() => localStorage.clear())

  it('sends the question and shows the answer with its sources', async () => {
    const user = userEvent.setup()
    let received: unknown
    server.use(
      http.post(QUESTIONS_URL, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(ANSWER)
      }),
    )
    render(<ChatPanel />)

    await user.type(screen.getByLabelText('Consulta'), '¿Cómo se despliega?{Enter}')

    expect(await screen.findByText('El despliegue se hace con Jenkins.')).toBeInTheDocument()
    expect(received).toEqual({ question: '¿Cómo se despliega?' })
    const sources = screen.getAllByRole('link')
    expect(sources.map((link) => link.getAttribute('href'))).toEqual([
      'https://wiki.example/wiki/spaces/DS/pages/1',
      'https://wiki.example/wiki/pages/2',
    ])
    expect(within(sources[0]).getByText('Guía de despliegue')).toBeInTheDocument()
    expect(within(sources[0]).getByText('DS')).toBeInTheDocument()
    expect(within(sources[1]).getByText('https://wiki.example/wiki/pages/2')).toBeInTheDocument()
    expect(within(sources[1]).getByText('#2')).toBeInTheDocument()
    expect(screen.getByLabelText('Consulta')).toHaveValue('')
  })

  it('submits a suggestion and lists the conversation in the sidebar', async () => {
    const user = userEvent.setup()
    answerWith({ answer: 'Respuesta', sources: [] })
    render(<ChatPanel />)

    await user.click(screen.getByRole('button', { name: '¿Qué es el motor KV v2 de Vault?' }))

    expect(await screen.findByText('Respuesta')).toBeInTheDocument()
    expect(screen.getByText(/no hay fuentes/)).toBeInTheDocument()
    const sidebar = screen.getByRole('complementary', { name: 'Conversaciones' })
    expect(within(sidebar).getByRole('button', { name: '¿Qué es el motor KV v2 de Vault?' })).toHaveClass('active')
    expect(screen.queryByRole('button', { name: '¿Cómo solicito acceso a un secreto de producción?' })).not.toBeInTheDocument()
  })

  it('starts a new conversation and lets the user return to the previous one', async () => {
    const user = userEvent.setup()
    answerWith({ answer: 'Respuesta uno', sources: [] })
    render(<ChatPanel />)
    await user.type(screen.getByLabelText('Consulta'), 'Primera pregunta{Enter}')
    await screen.findByText('Respuesta uno')

    await user.click(screen.getByRole('button', { name: 'Nueva conversación' }))

    expect(screen.queryByText('Respuesta uno')).not.toBeInTheDocument()
    expect(screen.getByText('¿Qué quieres saber de la documentación?')).toBeInTheDocument()

    const sidebar = screen.getByRole('complementary', { name: 'Conversaciones' })
    await user.click(within(sidebar).getByRole('button', { name: 'Primera pregunta' }))

    expect(screen.getByText('Respuesta uno')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('assistant.conversations') ?? '[]')).toHaveLength(1)
  })

  it('disables sending while a question is pending', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(QUESTIONS_URL, async () => {
        await delay(200)
        return HttpResponse.json({ answer: 'Respuesta', sources: [] })
      }),
    )
    render(<ChatPanel />)

    await user.type(screen.getByLabelText('Consulta'), 'pregunta{Enter}')

    expect(screen.getByRole('status')).toHaveTextContent('Buscando en la documentación…')
    expect(screen.getByRole('button', { name: 'Preguntando…' })).toBeDisabled()
    expect(await screen.findByText('Respuesta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('shows the problem detail when the service fails and can retry', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        QUESTIONS_URL,
        () =>
          HttpResponse.json(
            { title: 'Bad Gateway', status: 502, detail: 'Could not generate the answer with OpenAI' },
            { status: 502 },
          ),
        { once: true },
      ),
      http.post(QUESTIONS_URL, () => HttpResponse.json({ answer: 'Ahora sí', sources: [] })),
    )
    render(<ChatPanel />)

    await user.type(screen.getByLabelText('Consulta'), 'pregunta{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Error 502: Could not generate the answer with OpenAI')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Ahora sí')).toBeInTheDocument()
  })

  it('does not send an empty question', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)

    await user.type(screen.getByLabelText('Consulta'), '   {Enter}')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  it('shows the service status from the health endpoint', async () => {
    render(<ChatPanel />)

    expect(await screen.findByText('Assistant · online')).toBeInTheDocument()
  })

  it('reports the service as unreachable when health fails', async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.error()))
    render(<ChatPanel />)

    expect(await screen.findByText('Assistant · sin conexión')).toBeInTheDocument()
  })
})
