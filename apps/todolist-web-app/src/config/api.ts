import { createTodoApi } from '@todolist/shared'

/**
 * NON PARTAGÉ : la configuration dépend de la plateforme.
 * Sur le web, on lit une variable Vite (VITE_*) injectée au build.
 * En mobile, on lira EXPO_PUBLIC_* et l'URL diffère selon émulateur/appareil.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const todoApi = createTodoApi({ baseUrl: API_BASE_URL })
