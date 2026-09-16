import type { Todo } from '@todolist/shared'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { colors } from '../theme'

interface Props {
  todo: Todo
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}

/** NON PARTAGÉ : rendu natif d'un todo (Switch au lieu de checkbox). */
export function TodoItem({ todo, onToggle, onRemove }: Props) {
  return (
    <View style={styles.item}>
      <Switch
        value={todo.completed}
        onValueChange={() => onToggle(todo.id)}
        trackColor={{ true: colors.accent }}
      />
      <Text
        style={[styles.title, todo.completed && styles.titleDone]}
        numberOfLines={2}
      >
        {todo.title}
      </Text>
      <Pressable
        onPress={() => onRemove(todo.id)}
        hitSlop={8}
        accessibilityLabel={`Supprimer « ${todo.title} »`}
        style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  title: { flex: 1, fontSize: 16, color: colors.text },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  delete: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deletePressed: { backgroundColor: colors.dangerBg },
  deleteText: { color: colors.muted, fontSize: 16 },
})
