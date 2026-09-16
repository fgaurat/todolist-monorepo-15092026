import type { Todo } from '@todolist/shared'
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native'
import { colors } from '../theme'
import { TodoItem } from './TodoItem'

interface Props {
  todos: Todo[]
  refreshing: boolean
  onRefresh: () => void
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}

/**
 * NON PARTAGÉ : FlatList (liste virtualisée) + pull-to-refresh,
 * là où le web se contente d'un <ul>.
 */
export function TodoList({ todos, refreshing, onRefresh, onToggle, onRemove }: Props) {
  return (
    <FlatList
      data={todos}
      keyExtractor={(todo) => String(todo.id)}
      renderItem={({ item }) => <TodoItem todo={item} onToggle={onToggle} onRemove={onRemove} />}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucune tâche pour le moment.</Text>}
      keyboardShouldPersistTaps="handled"
    />
  )
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingBottom: 32 },
  empty: { marginTop: 24, textAlign: 'center', color: colors.muted },
})
