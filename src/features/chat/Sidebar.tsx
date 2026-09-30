import { Icon } from '../../components/Icon.tsx'
import type { HealthStatus } from '../../api/health.ts'
import type { Conversation } from './useConversations.ts'

interface SidebarProps {
  recent: Conversation[]
  activeId: string | null
  health: HealthStatus
  open: boolean
  onNew: () => void
  onSelect: (id: string) => void
  onClose: () => void
}

const HEALTH_LABEL: Record<HealthStatus, string> = {
  up: 'online',
  down: 'sin conexión',
  unknown: 'comprobando…',
}

/** Brand, new-conversation button, recent conversations and the service status. */
export function Sidebar({ recent, activeId, health, open, onNew, onSelect, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Conversaciones">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">A</span>
        <div>
          <strong>ASSISTANT</strong>
          <span>Consola RAG · Confluence</span>
        </div>
      </div>

      <button type="button" className="new-conversation" onClick={onNew}>
        <Icon name="plus" size={18} />
        Nueva conversación
      </button>

      <section className="sidebar-section">
        <h2>Conversaciones recientes</h2>
        {recent.length === 0 ? (
          <p className="sidebar-empty">Aquí aparecerán tus preguntas anteriores.</p>
        ) : (
          <ul className="recent">
            {recent.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={conversation.id === activeId ? 'active' : undefined}
                  onClick={() => {
                    onSelect(conversation.id)
                    onClose()
                  }}
                >
                  <Icon name="chat" size={16} />
                  <span>{conversation.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sidebar-footer">
        <span className={`status-dot ${health}`} aria-hidden="true" />
        <span>Assistant · {HEALTH_LABEL[health]}</span>
      </div>
    </aside>
  )
}
