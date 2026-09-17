import { yupResolver } from '@hookform/resolvers/yup'
import type { BaseSyntheticEvent } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { NewTodoInputSchema, type NewTodoInput } from '../schemas/todo'

export interface UseTodoFormResult {
  /** L'instance React Hook Form : register (web), control (mobile), formState… */
  form: UseFormReturn<NewTodoInput>
  /**
   * Handler de soumission prêt à brancher. Sur le web : `<form onSubmit={submit}>`
   * (React Hook Form appelle preventDefault sur l'événement reçu, il faut donc
   * bien le lui transmettre). Sur mobile : `onPress={() => submit()}`, sans événement.
   * Valide avec le schéma yup, appelle onSubmit si OK, puis vide le champ.
   */
  submit(event?: BaseSyntheticEvent): Promise<void>
  /** Premier message d'erreur du champ titre, ou null. */
  error: string | null
}

/**
 * Configure React Hook Form pour le formulaire « nouveau todo ».
 * Partagé : React Hook Form n'a aucune dépendance au DOM. Le schéma yup,
 * le résolveur et la remise à zéro après envoi sont identiques sur les
 * deux plateformes. Seule la façon de brancher le champ change :
 * `register` sur un <input> web, `Controller` sur un <TextInput> natif.
 */
export function useTodoForm(onSubmit: (input: NewTodoInput) => Promise<void>): UseTodoFormResult {
  const form = useForm<NewTodoInput>({
    resolver: yupResolver(NewTodoInputSchema),
    defaultValues: { title: '' },
    // Valide à la soumission ; ensuite revalide à chaque frappe
    // pour effacer l'erreur dès que la saisie redevient correcte.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const submit = form.handleSubmit(async (input) => {
    // `input` est la valeur validée ET transformée par yup (titre trimé).
    await onSubmit(input)
    form.reset()
  })

  return {
    form,
    submit,
    error: form.formState.errors.title?.message ?? null,
  }
}
