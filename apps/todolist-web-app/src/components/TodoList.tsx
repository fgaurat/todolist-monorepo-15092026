import type { Todo } from '@todolist/shared'
import { TodoItem } from './TodoItem'

interface Props {
  todos: Todo[]
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}

/** NON PARTAGÉ : <ul> sur le web, FlatList côté mobile. */
export function TodoList({ todos, onToggle, onRemove }: Props) {
  if (todos.length === 0) {
    return <p className="empty">Aucune tâche pour le moment.</p>
  }
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  )
}
