import { useCallback, useEffect, useState } from 'react'
import type { TodoApi } from '../api/client'
import type { NewTodoInput, Todo } from '../schemas/todo'

export type TodosStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseTodosResult {
  todos: Todo[]
  status: TodosStatus
  error: string | null
  refresh(): Promise<void>
  add(input: NewTodoInput): Promise<void>
  toggle(id: number): Promise<void>
  remove(id: number): Promise<void>
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue'
}

/**
 * Hook de gestion de la liste de todos.
 * Partagé : il n'utilise que l'API React (useState/useEffect/useCallback),
 * disponible à l'identique dans react-dom et react-native.
 * Le composant qui l'appelle reste spécifique à la plateforme.
 */
export function useTodos(api: TodoApi): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<TodosStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const list = await api.list()
      setTodos(list.slice().sort((a, b) => b.id - a.id))
      setStatus('ready')
    } catch (err) {
      setError(toMessage(err))
      setStatus('error')
    }
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const add = useCallback(
    async (input: NewTodoInput) => {
      setError(null)
      try {
        const created = await api.create(input)
        setTodos((current) => [created, ...current])
      } catch (err) {
        setError(toMessage(err))
      }
    },
    [api],
  )

  const toggle = useCallback(
    async (id: number) => {
      const target = todos.find((todo) => todo.id === id)
      if (!target) return
      const nextCompleted = !target.completed
      // Mise à jour optimiste, puis rollback en cas d'échec.
      setTodos((current) =>
        current.map((todo) => (todo.id === id ? { ...todo, completed: nextCompleted } : todo)),
      )
      try {
        const updated = await api.update(id, { completed: nextCompleted })
        setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
      } catch (err) {
        setError(toMessage(err))
        setTodos((current) =>
          current.map((todo) => (todo.id === id ? { ...todo, completed: !nextCompleted } : todo)),
        )
      }
    },
    [api, todos],
  )

  const remove = useCallback(
    async (id: number) => {
      const snapshot = todos
      setTodos((current) => current.filter((todo) => todo.id !== id))
      try {
        await api.remove(id)
      } catch (err) {
        setError(toMessage(err))
        setTodos(snapshot)
      }
    },
    [api, todos],
  )

  return { todos, status, error, refresh, add, toggle, remove }
}
