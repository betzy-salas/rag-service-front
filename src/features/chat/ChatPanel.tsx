import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { useHealth } from '../status/useHealth.ts'
import { Composer } from './Composer.tsx'
import { Message } from './Message.tsx'
import { Sidebar } from './Sidebar.tsx'
import { useConversations, type Turn } from './useConversations.ts'

const NO_TURNS: Turn[] = []

const SUGGESTIONS = [
  '¿Cómo se gestionan los secretos en producción?',
  '¿Qué es el motor KV v2 de Vault?',
  '¿Cómo solicito acceso a un secreto de producción?',
]

/** Whole page: sidebar with conversations, the active conversation and the composer. */
export function ChatPanel() {
  const { active, recent, busy, ask, startNew, select } = useConversations()
  const health = useHealth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const turns = active?.turns ?? NO_TURNS

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [turns])

  const submit = (question: string) => {
    void ask(question)
  }

  return (
    <div className="shell">
      <Sidebar
        recent={recent}
        activeId={active?.id ?? null}
        health={health}
        open={sidebarOpen}
        onNew={() => {
          startNew()
          setSidebarOpen(false)
        }}
        onSelect={select}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <section className="main">
        <header className="main-header">
          <button
            type="button"
            className="menu-button"
            aria-label="Abrir conversaciones"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="main-title">
            <h1>ASSISTANT</h1>
            <span>{active ? active.title : 'Documentación de Confluence'}</span>
          </div>
          <span className="pill">
            <Icon name="spark" size={14} />
            modo RAG
          </span>
        </header>

        <div className="messages" ref={scrollRef} aria-live="polite">
          {turns.length === 0 ? (
            <div className="empty">
              <span className="avatar large" aria-hidden="true">AS</span>
              <h2>¿Qué quieres saber de la documentación?</h2>
              <p>
                Busco en las páginas indexadas de Confluence y cito las que uso. Si ninguna se parece
                lo suficiente a tu pregunta, te lo diré en lugar de inventar.
              </p>
            </div>
          ) : (
            turns.map((turn) => <Message key={turn.id} turn={turn} onRetry={submit} />)
          )}
        </div>

        {turns.length === 0 && (
          <div className="chips" aria-label="Sugerencias">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => submit(suggestion)} disabled={busy}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <Composer busy={busy} onSubmit={submit} />
      </section>
    </div>
  )
}
