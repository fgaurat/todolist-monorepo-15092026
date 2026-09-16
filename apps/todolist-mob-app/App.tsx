import { getTodoStats, useTodos } from '@todolist/shared'
import { StatusBar } from 'expo-status-bar'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { TodoForm } from './src/components/TodoForm'
import { TodoList } from './src/components/TodoList'
import { API_BASE_URL, todoApi } from './src/config/api'
import { colors } from './src/theme'

export default function App() {
  // PARTAGÉ : même hook que dans l'app web.
  const { todos, status, error, add, toggle, remove, refresh } = useTodos(todoApi)
  const stats = getTodoStats(todos)

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Todolist</Text>
            <Text style={styles.stats}>
              {stats.remaining} à faire · {stats.done} terminée{stats.done > 1 ? 's' : ''} ·{' '}
              {stats.total} au total
            </Text>
            <Text style={styles.apiUrl}>API : {API_BASE_URL}</Text>
          </View>

          <TodoForm onSubmit={add} />

          {error && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{error}</Text>
              <Pressable onPress={() => void refresh()} style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Réessayer</Text>
              </Pressable>
            </View>
          )}

          <TodoList
            todos={todos}
            refreshing={status === 'loading'}
            onRefresh={() => void refresh()}
            onToggle={(id) => void toggle(id)}
            onRemove={(id) => void remove(id)}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  stats: { color: colors.muted },
  apiUrl: { color: colors.muted, fontSize: 12 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.dangerBg,
  },
  bannerText: { flex: 1, color: colors.danger },
  bannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
  },
  bannerButtonText: { color: colors.danger },
})
