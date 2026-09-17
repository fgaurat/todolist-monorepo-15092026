import { useTodoForm, type NewTodoInput } from '@todolist/shared'

interface Props {
  onSubmit: (input: NewTodoInput) => Promise<void>
}

/**
 * NON PARTAGÉ : composant DOM (<form>, <input>, <button>).
 * La configuration de React Hook Form (schéma yup, reset) vient du hook
 * partagé useTodoForm. Ici on branche le champ avec `register` : sur le
 * web, React Hook Form pilote l'<input> en mode non contrôlé (via une ref).
 */
export function TodoForm({ onSubmit }: Props) {
  const { form, submit, error } = useTodoForm(onSubmit)

  return (
    <form className="todo-form" onSubmit={submit}>
      <div className="todo-form__row">
        <input
          className="todo-form__input"
          type="text"
          placeholder="Nouvelle tâche…"
          aria-invalid={error !== null}
          aria-describedby={error ? 'todo-form-error' : undefined}
          {...form.register('title')}
        />
        <button className="todo-form__button" type="submit" disabled={form.formState.isSubmitting}>
          Ajouter
        </button>
      </div>
      {error && (
        <p id="todo-form-error" className="todo-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
