import { getTodoStats, useTodos } from '@todolist/shared'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { todoApi } from './config/api'

function App() {
  // PARTAGÉ : le hook fait tout le travail (chargement, ajout, toggle, suppression).
  const { todos, status, error, add, toggle, remove, refresh } = useTodos(todoApi)
  const stats = getTodoStats(todos)

  return (
    <main className="app">
      <header className="app__header">
        <h1>Todolist</h1>
        <p className="app__stats">
          {stats.remaining} à faire · {stats.done} terminée{stats.done > 1 ? 's' : ''} ·{' '}
          {stats.total} au total
        </p>
      </header>

      <TodoForm onSubmit={add} />

      {error && (
        <div className="banner banner--error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>
            Réessayer
          </button>
        </div>
      )}

      {status === 'loading' && todos.length === 0 ? (
        <p className="empty">Chargement…</p>
      ) : (
        <TodoList todos={todos} onToggle={(id) => void toggle(id)} onRemove={(id) => void remove(id)} />
      )}
    </main>
  )
}

export default App
