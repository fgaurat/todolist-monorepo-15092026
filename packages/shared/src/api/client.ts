import {
  NewTodoInputSchema,
  TodoListSchema,
  TodoSchema,
  type NewTodoInput,
  type Todo,
  type TodoPatch,
} from '../schemas/todo'

export interface TodoApiConfig {
  /** URL de base de l'API, ex. http://localhost:3000. Fournie par chaque plateforme. */
  baseUrl: string
  /** Injectable pour les tests ou un fetch spécifique (ex. avec auth). */
  fetch?: typeof fetch
  /** Identifiant utilisateur envoyé à la création. */
  userId?: number
}

export class TodoApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TodoApiError'
    this.status = status
  }
}

export interface TodoApi {
  list(): Promise<Todo[]>
  create(input: NewTodoInput): Promise<Todo>
  update(id: number, patch: TodoPatch): Promise<Todo>
  remove(id: number): Promise<void>
}

/**
 * Client HTTP pour /todos. Repose uniquement sur `fetch`, disponible
 * nativement dans le navigateur et dans React Native : il est donc
 * partageable tel quel. Seule l'URL de base change selon la plateforme.
 */
export function createTodoApi(config: TodoApiConfig): TodoApi {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')
  const doFetch = config.fetch ?? fetch
  const userId = config.userId ?? 1

  async function request<T>(
    path: string,
    init: RequestInit,
    parse: (json: unknown) => T,
  ): Promise<T> {
    let response: Response
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      })
    } catch (error) {
      throw new TodoApiError(
        `Impossible de joindre l'API (${baseUrl}) : ${(error as Error).message}`,
      )
    }
    if (!response.ok) {
      throw new TodoApiError(
        `Erreur HTTP ${response.status} sur ${init.method ?? 'GET'} ${path}`,
        response.status,
      )
    }
    if (response.status === 204) return parse(undefined)
    const json: unknown = await response.json()
    try {
      return parse(json)
    } catch (error) {
      // Une ValidationError yup arrive ici : on la reformule en TodoApiError
      // pour que l'UI affiche un message lisible plutôt qu'un objet brut.
      throw new TodoApiError(
        `Réponse inattendue de l'API sur ${init.method ?? 'GET'} ${path} : ${(error as Error).message}`,
        response.status,
      )
    }
  }

  // `strict: true` : yup vérifie la réponse telle quelle, sans la convertir
  // (sans ce flag, un id "42" renvoyé en string serait silencieusement casté en 42).
  const parseTodo = (json: unknown) => TodoSchema.validateSync(json, { strict: true })
  const parseTodoList = (json: unknown) => TodoListSchema.validateSync(json, { strict: true })

  return {
    list() {
      return request('/todos', { method: 'GET' }, parseTodoList)
    },
    create(input) {
      // Pas de strict ici : on veut la transformation (trim du titre).
      const body = NewTodoInputSchema.validateSync(input)
      return request(
        '/todos',
        {
          method: 'POST',
          body: JSON.stringify({ ...body, userId, completed: false }),
        },
        parseTodo,
      )
    },
    update(id, patch) {
      return request(
        `/todos/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        parseTodo,
      )
    },
    remove(id) {
      return request(`/todos/${id}`, { method: 'DELETE' }, () => undefined)
    },
  }
}
