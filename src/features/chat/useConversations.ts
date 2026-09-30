import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { askQuestion } from '../../api/questions.ts'
import type { AnswerResponse } from '../../api/types.ts'

export type TurnStatus = 'pending' | 'answered' | 'error'

/** One question with its answer, or the error that replaced it. */
export interface Turn {
  id: string
  question: string
  status: TurnStatus
  answer?: AnswerResponse
  errorMessage?: string
  seconds?: number
}

/** A list of turns kept in the browser. The service answers each question on its own. */
export interface Conversation {
  id: string
  title: string
  turns: Turn[]
  updatedAt: number
}

const STORAGE_KEY = 'assistant.conversations'
const TITLE_MAX_LENGTH = 60

interface State {
  conversations: Conversation[]
  /** Null while the user has not asked anything in the new conversation yet. */
  activeId: string | null
  busy: boolean
}

/** Holds every conversation of this browser, the active one, and sends questions to the service one at a time. */
export function useConversations() {
  const [state, setState] = useState<State>(() => ({
    conversations: load(),
    activeId: null,
    busy: false,
  }))
  // Handlers read the latest committed state through the ref instead of re-creating themselves on every change.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => save(state.conversations), [state.conversations])

  const active = useMemo(
    () => state.conversations.find((conversation) => conversation.id === state.activeId) ?? null,
    [state.conversations, state.activeId],
  )

  const recent = useMemo(
    () => [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [state.conversations],
  )

  const patchTurn = useCallback((conversationId: string, turnId: string, patch: Partial<Turn>) => {
    setState((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              updatedAt: Date.now(),
              turns: conversation.turns.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
            }
          : conversation,
      ),
    }))
  }, [])

  const ask = useCallback(
    async (question: string) => {
      if (stateRef.current.busy) return
      const turn: Turn = { id: newId(), question, status: 'pending' }
      const conversationId = stateRef.current.activeId ?? newId()

      setState((current) => {
        const exists = current.conversations.some((conversation) => conversation.id === conversationId)
        const conversations = exists
          ? current.conversations.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, updatedAt: Date.now(), turns: [...conversation.turns, turn] }
                : conversation,
            )
          : [
              ...current.conversations,
              { id: conversationId, title: titleFor(question), turns: [turn], updatedAt: Date.now() },
            ]
        return { conversations, activeId: conversationId, busy: true }
      })

      const startedAt = performance.now()
      const elapsed = () => Math.round((performance.now() - startedAt) / 100) / 10
      try {
        const answer = await askQuestion(question, undefined)
        patchTurn(conversationId, turn.id, { status: 'answered', answer, seconds: elapsed() })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        patchTurn(conversationId, turn.id, { status: 'error', errorMessage: message, seconds: elapsed() })
      } finally {
        setState((current) => ({ ...current, busy: false }))
      }
    },
    [patchTurn],
  )

  const startNew = useCallback(() => {
    setState((current) => ({ ...current, activeId: null }))
  }, [])

  const select = useCallback((id: string) => {
    setState((current) => ({ ...current, activeId: id }))
  }, [])

  const remove = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      conversations: current.conversations.filter((conversation) => conversation.id !== id),
      activeId: current.activeId === id ? null : current.activeId,
    }))
  }, [])

  return { active, recent, busy: state.busy, ask, startNew, select, remove }
}

function titleFor(question: string): string {
  const oneLine = question.replace(/\s+/g, ' ').trim()
  return oneLine.length > TITLE_MAX_LENGTH ? oneLine.slice(0, TITLE_MAX_LENGTH - 1) + '…' : oneLine
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Storage can be unavailable (private windows, blocked site data); the page then works in memory only.
function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    if (!Array.isArray(parsed)) return []
    // A reload while waiting for an answer leaves the turn pending forever; report it instead.
    return parsed.map((conversation) => ({
      ...conversation,
      turns: conversation.turns.map((turn) =>
        turn.status === 'pending'
          ? { ...turn, status: 'error', errorMessage: 'La respuesta se interrumpió al recargar la página.' }
          : turn,
      ),
    }))
  } catch {
    return []
  }
}

function save(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // ignored
  }
}
