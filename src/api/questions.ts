import { postJson, type RequestOptions } from './client.ts'
import type { AnswerResponse, QuestionRequest } from './types.ts'

export const QUESTIONS_PATH = '/questions'
export const QUESTION_MAX_LENGTH = 2000
export const SPACE_KEY_MAX_LENGTH = 255

/** Asks the assistant a question. An empty {@code spaceKey} is omitted so the service searches every space. */
export function askQuestion(
  question: string,
  spaceKey: string | undefined,
  options?: RequestOptions,
): Promise<AnswerResponse> {
  const trimmedSpace = spaceKey?.trim()
  const body: QuestionRequest = trimmedSpace ? { question, spaceKey: trimmedSpace } : { question }
  return postJson<QuestionRequest, AnswerResponse>(QUESTIONS_PATH, body, options)
}
