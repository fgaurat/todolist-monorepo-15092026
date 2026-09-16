import { useTodoInput, type NewTodoInput } from '@todolist/shared'

interface Props {
  onSubmit: (input: NewTodoInput) => Promise<void>
}

/**
 * NON PARTAGÉ : composant DOM (<form>, <input>, <button>).
 * La logique de saisie/validation vient du hook partagé useTodoInput.
 */
export function TodoForm({ onSubmit }: Props) {
  const input = useTodoInput(onSubmit)

  return (
    <form
      className="todo-form"
      onSubmit={(event) => {
        event.preventDefault()
        void input.submit()
      }}
    >
      <div className="todo-form__row">
        <input
          className="todo-form__input"
          type="text"
          placeholder="Nouvelle tâche…"
          value={input.value}
          onChange={(event) => input.setValue(event.target.value)}
          aria-invalid={input.error !== null}
          aria-describedby={input.error ? 'todo-form-error' : undefined}
        />
        <button className="todo-form__button" type="submit">
          Ajouter
        </button>
      </div>
      {input.error && (
        <p id="todo-form-error" className="todo-form__error" role="alert">
          {input.error}
        </p>
      )}
    </form>
  )
}
