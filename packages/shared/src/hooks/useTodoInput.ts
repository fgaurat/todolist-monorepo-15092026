import { useCallback, useState } from 'react'
import { ValidationError } from 'yup'
import { NewTodoInputSchema, type NewTodoInput } from '../schemas/todo'

export interface UseTodoInputResult {
  value: string
  error: string | null
  setValue(value: string): void
  /** Valide avec le schéma yup puis appelle onSubmit si OK. */
  submit(): Promise<void>
}

/**
 * Gère la saisie d'un nouveau todo et sa validation yup.
 * Partagé : la logique de formulaire ne dépend pas du type de champ
 * (<input> sur le web, <TextInput> sur mobile).
 */
export function useTodoInput(onSubmit: (input: NewTodoInput) => Promise<void>): UseTodoInputResult {
  const [value, setValueState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const setValue = useCallback((next: string) => {
    setValueState(next)
    setError(null)
  }, [])

  const submit = useCallback(async () => {
    let input: NewTodoInput
    try {
      // validateSync retourne la valeur transformée (titre trimé)
      // ou lève une ValidationError portant le message du schéma.
      input = NewTodoInputSchema.validateSync({ title: value })
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : 'Saisie invalide')
      return
    }
    await onSubmit(input)
    setValueState('')
  }, [value, onSubmit])

  return { value, error, setValue, submit }
}
