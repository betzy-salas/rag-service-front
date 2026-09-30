import { Icon } from '../../components/Icon.tsx'
import type { SourceResponse } from '../../api/types.ts'
import type { Turn } from './useConversations.ts'

interface MessageProps {
  turn: Turn
  onRetry: (question: string) => void
}

const PIPELINE_STEPS = [
  'Reescritura de la pregunta',
  'Búsqueda semántica en Confluence',
  'Redacción de la respuesta con el contexto',
]

/** A user message followed by the assistant reply: pending, answered with sources, or failed. */
export function Message({ turn, onRetry }: MessageProps) {
  return (
    <div className="exchange">
      <div className="user-message">{turn.question}</div>
      <div className="assistant-message">
        <span className="avatar" aria-hidden="true">AS</span>
        <div className="assistant-body">
          <AssistantContent turn={turn} onRetry={onRetry} />
        </div>
      </div>
    </div>
  )
}

function AssistantContent({ turn, onRetry }: MessageProps) {
  if (turn.status === 'pending') {
    return (
      <div className="card pending" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Buscando en la documentación…
      </div>
    )
  }

  if (turn.status === 'error') {
    return (
      <div className="card error" role="alert">
        <Icon name="alert" size={18} />
        <div>
          <p>{turn.errorMessage}</p>
          <button type="button" className="retry" onClick={() => onRetry(turn.question)}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const sources = turn.answer?.sources ?? []
  return (
    <>
      <div className="card answer">{turn.answer?.answer ?? ''}</div>

      <div className="steps">
        <div className="steps-header">
          <Icon name="list" size={16} />
          Pasos ejecutados
          {turn.seconds !== undefined && <span className="elapsed">{turn.seconds.toFixed(1)} s</span>}
        </div>
        {PIPELINE_STEPS.map((step) => (
          <div key={step} className="step">
            <Icon name="check" size={16} />
            {step}
          </div>
        ))}
      </div>

      {sources.length > 0 ? (
        <ul className="sources">
          {sources.map((source, index) => (
            <li key={source.url}>
              <SourceCard source={source} rank={index + 1} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-sources">Ninguna página superó el umbral de similitud, así que no hay fuentes.</p>
      )}
    </>
  )
}

function SourceCard({ source, rank }: { source: SourceResponse; rank: number }) {
  const space = spaceOf(source.url)
  return (
    <a className="source" href={source.url} target="_blank" rel="noopener noreferrer">
      <Icon name="doc" size={18} />
      <span className="source-text">
        <span className="source-title">{source.title || source.url}</span>
        <span className="source-url">{hostOf(source.url)}</span>
      </span>
      <span className={`badge ${rank === 1 ? 'top' : ''}`}>{space ?? (rank === 1 ? 'más similar' : `#${rank}`)}</span>
    </a>
  )
}

/** Confluence page URLs carry the space key in the path; it is a useful label when present. */
function spaceOf(url: string): string | null {
  const match = /\/spaces\/([^/]+)\//.exec(url)
  return match ? match[1] : null
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
