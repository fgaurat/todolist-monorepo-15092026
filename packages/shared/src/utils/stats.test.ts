import { getTodoStats } from './stats'

describe('getTodoStats', () => {
  it('compte les todos faits et restants', () => {
    const stats = getTodoStats([
      { id: 1, userId: 1, title: 'a', completed: true },
      { id: 2, userId: 1, title: 'b', completed: false },
      { id: 3, userId: 1, title: 'c', completed: false },
    ])
    expect(stats).toEqual({ total: 3, done: 1, remaining: 2 })
  })

  it('gère une liste vide', () => {
    expect(getTodoStats([])).toEqual({ total: 0, done: 0, remaining: 0 })
  })
})
