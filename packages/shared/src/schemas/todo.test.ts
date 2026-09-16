import { ValidationError } from 'yup'
import { NewTodoInputSchema, TodoListSchema, TodoSchema } from './todo'

describe('TodoSchema', () => {
  it('accepte un todo au format de l’API', () => {
    const todo = { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
    expect(TodoSchema.validateSync(todo)).toEqual(todo)
  })

  it('rejette un todo sans champ completed', () => {
    expect(() => TodoSchema.validateSync({ userId: 1, id: 1, title: 'x' })).toThrow(ValidationError)
  })

  it('tolère un todo sans userId', () => {
    expect(TodoSchema.validateSync({ id: 201, title: 'x', completed: false }).userId).toBeUndefined()
  })

  it('valide une liste', () => {
    expect(TodoListSchema.validateSync([])).toEqual([])
  })

  it('en mode strict, ne convertit pas une chaîne en nombre', () => {
    const todo = { id: '1', title: 'x', completed: false }
    // Sans strict, yup transforme '1' en 1 (cast). Pour une réponse d'API,
    // on veut détecter l'écart de format, pas le masquer.
    expect(TodoSchema.validateSync(todo).id).toBe(1)
    expect(() => TodoSchema.validateSync(todo, { strict: true })).toThrow(ValidationError)
  })
})

describe('NewTodoInputSchema', () => {
  it('trim le titre', () => {
    expect(NewTodoInputSchema.validateSync({ title: '  acheter du pain  ' })).toEqual({
      title: 'acheter du pain',
    })
  })

  it('refuse un titre vide avec un message lisible', () => {
    expect(() => NewTodoInputSchema.validateSync({ title: '   ' })).toThrow(
      'Le titre est obligatoire',
    )
  })

  it('refuse un titre trop long', () => {
    expect(() => NewTodoInputSchema.validateSync({ title: 'a'.repeat(121) })).toThrow(
      'Le titre ne doit pas dépasser 120 caractères',
    )
  })
})
