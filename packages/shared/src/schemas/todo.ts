import { array, boolean, number, object, string, type InferType } from 'yup'

/**
 * Schéma d'un todo tel que renvoyé par l'API (GET /todos).
 * Partagé : la forme des données est la même sur web et mobile.
 *
 * Rappel yup : un champ est optionnel par défaut. Il faut le dire
 * explicitement quand on l'exige :
 *   - `required()` refuse undefined, null ET la chaîne vide ;
 *   - `defined()` refuse seulement undefined (la chaîne vide passe).
 */
export const TodoSchema = object({
  id: number().integer().required(),
  /** Absent sur certains enregistrements créés à la main dans json-server. */
  userId: number().integer().optional(),
  title: string().defined(),
  completed: boolean().required(),
})

export const TodoListSchema = array().of(TodoSchema).required()

/**
 * Données saisies par l'utilisateur pour créer un todo.
 * Les règles de validation (titre obligatoire, longueur max) sont
 * les mêmes quel que soit l'écran qui les applique.
 */
export const NewTodoInputSchema = object({
  title: string()
    .trim()
    .required('Le titre est obligatoire')
    .max(120, 'Le titre ne doit pas dépasser 120 caractères'),
})

export const TodoPatchSchema = TodoSchema.omit(['id']).partial()

export type Todo = InferType<typeof TodoSchema>
export type NewTodoInput = InferType<typeof NewTodoInputSchema>
export type TodoPatch = InferType<typeof TodoPatchSchema>
