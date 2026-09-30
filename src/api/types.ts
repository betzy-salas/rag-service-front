/** Request and response contracts of the assistant service (`POST /questions`). */

export interface QuestionRequest {
  question: string
  spaceKey?: string
}

export interface SourceResponse {
  title: string
  url: string
}

export interface AnswerResponse {
  answer: string
  sources: SourceResponse[]
}

/** Error body returned by the service (RFC 9457 problem details). */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
}
