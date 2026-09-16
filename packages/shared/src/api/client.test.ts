import { createTodoApi, TodoApiError } from './client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createTodoApi', () => {
  it('liste et valide les todos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ userId: 1, id: 1, title: 'a', completed: false }]),
    )
    const api = createTodoApi({ baseUrl: 'http://api.test/', fetch: fetchMock })

    const todos = await api.list()

    expect(todos).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/todos',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('rejette une réponse qui ne respecte pas le schéma', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'oops' }]))
    const api = createTodoApi({ baseUrl: 'http://api.test', fetch: fetchMock })

    await expect(api.list()).rejects.toMatchObject({
      name: 'TodoApiError',
      message: expect.stringContaining('Réponse inattendue'),
    })
  })

  it('crée un todo avec userId et completed=false', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ userId: 7, id: 42, title: 'nouveau', completed: false }))
    const api = createTodoApi({ baseUrl: 'http://api.test', fetch: fetchMock, userId: 7 })

    const created = await api.create({ title: 'nouveau' })

    expect(created.id).toBe(42)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ title: 'nouveau', userId: 7, completed: false })
  })

  it('remonte une TodoApiError avec le statut HTTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500))
    const api = createTodoApi({ baseUrl: 'http://api.test', fetch: fetchMock })

    await expect(api.remove(1)).rejects.toMatchObject({
      name: 'TodoApiError',
      status: 500,
    })
  })

  it('transforme une panne réseau en TodoApiError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const api = createTodoApi({ baseUrl: 'http://api.test', fetch: fetchMock })

    await expect(api.list()).rejects.toBeInstanceOf(TodoApiError)
  })
})
