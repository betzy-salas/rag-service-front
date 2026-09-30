import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { QUESTION_MAX_LENGTH } from '../../api/questions.ts'

interface ComposerProps {
  busy: boolean
  onSubmit: (question: string) => void
}

/** Question box. Enter sends, Shift+Enter adds a line; the box grows with the text. */
export function Composer({ busy, onSubmit }: ComposerProps) {
  const [question, setQuestion] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!busy) textareaRef.current?.focus()
  }, [busy])

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`
  }, [question])

  const canSend = question.trim().length > 0 && !busy

  function submit() {
    const trimmed = question.trim()
    if (!trimmed || busy) {
      textareaRef.current?.focus()
      return
    }
    onSubmit(trimmed)
    setQuestion('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate>
      <label className="composer-field">
        <span className="visually-hidden">Consulta</span>
        <textarea
          ref={textareaRef}
          name="question"
          rows={1}
          value={question}
          maxLength={QUESTION_MAX_LENGTH}
          placeholder="Escribe tu consulta…"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>
      <button type="submit" className="send" disabled={!canSend} aria-label={busy ? 'Preguntando…' : 'Enviar'}>
        <Icon name="arrow-up" size={20} />
      </button>
      <span className="composer-hint">
        Intro envía · Mayús + Intro añade una línea · {question.length} / {QUESTION_MAX_LENGTH}
      </span>
    </form>
  )
}
