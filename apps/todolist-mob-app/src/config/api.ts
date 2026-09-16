import { createTodoApi } from '@todolist/shared'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * NON PARTAGÉ : sur mobile, "localhost" désigne le téléphone, pas la machine
 * de dev. Il faut donc trouver l'adresse de la machine qui héberge l'API.
 *
 * Ordre de résolution :
 *  1. EXPO_PUBLIC_API_URL (variable d'environnement Expo, injectée au bundle)
 *  2. l'hôte du serveur de dev Expo (fonctionne en émulateur, simulateur
 *     et appareil physique sur le même réseau)
 *  3. valeurs par défaut : 10.0.2.2 pour l'émulateur Android, localhost sinon
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv

  const devHost = Constants.expoConfig?.hostUri?.split(':')[0]
  if (devHost) return `http://${devHost}:3000`

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  return `http://${host}:3000`
}

export const API_BASE_URL = resolveBaseUrl()

export const todoApi = createTodoApi({ baseUrl: API_BASE_URL })
