import type { Todo } from '../schemas/todo'

export interface TodoStats {
  total: number
  done: number
  remaining: number
}

/** Logique métier pure : aucune dépendance à la plateforme. */
export function getTodoStats(todos: readonly Todo[]): TodoStats {
  const done = todos.filter((todo) => todo.completed).length
  return { total: todos.length, done, remaining: todos.length - done }
}
