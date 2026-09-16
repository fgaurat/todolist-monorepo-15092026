import type { Todo } from '@todolist/shared'

interface Props {
  todo: Todo
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}

/** NON PARTAGÉ : rendu DOM d'un todo. */
export function TodoItem({ todo, onToggle, onRemove }: Props) {
  return (
    <li className={`todo-item${todo.completed ? ' todo-item--done' : ''}`}>
      <label className="todo-item__label">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className="todo-item__title">{todo.title}</span>
      </label>
      <button
        className="todo-item__delete"
        type="button"
        onClick={() => onRemove(todo.id)}
        aria-label={`Supprimer « ${todo.title} »`}
      >
        ✕
      </button>
    </li>
  )
}
