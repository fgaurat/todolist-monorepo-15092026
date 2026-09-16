import { useTodoInput, type NewTodoInput } from '@todolist/shared'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme'

interface Props {
  onSubmit: (input: NewTodoInput) => Promise<void>
}

/**
 * NON PARTAGÉ : composant natif (TextInput, Pressable).
 * La logique de saisie/validation vient du hook partagé useTodoInput,
 * exactement le même que sur le web.
 */
export function TodoForm({ onSubmit }: Props) {
  const input = useTodoInput(onSubmit)

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, input.error ? styles.inputError : null]}
          placeholder="Nouvelle tâche…"
          placeholderTextColor={colors.muted}
          value={input.value}
          onChangeText={input.setValue}
          onSubmitEditing={() => void input.submit()}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => void input.submit()}
        >
          <Text style={styles.buttonText}>Ajouter</Text>
        </Pressable>
      </View>
      {input.error && <Text style={styles.error}>{input.error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  button: {
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
  error: { color: colors.danger, fontSize: 14 },
})
