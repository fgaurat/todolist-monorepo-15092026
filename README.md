# Todolist monorepo : une app web React et une app React Native qui partagent leur code

> Support de formation React Native.
> Objectif : montrer concrètement **ce qui se partage** entre une app web React et une app mobile
> React Native (hooks, schémas yup, client API), **ce qui ne se partage pas** (UI, style, config
> plateforme), et **les pièges d'un monorepo** JavaScript.

---

## Sommaire

1. [L'idée en une image](#1-lidée-en-une-image)
2. [Démarrer](#2-démarrer)
3. [Comment fonctionne le monorepo](#3-comment-fonctionne-le-monorepo)
4. [Le package partagé, fichier par fichier](#4-le-package-partagé-fichier-par-fichier)
5. [Les deux apps côte à côte](#5-les-deux-apps-côte-à-côte)
6. [Ce qui ne se partage pas, et pourquoi](#6-ce-qui-ne-se-partage-pas-et-pourquoi)
7. [Les pièges rencontrés (à raconter en formation)](#7-les-pièges-rencontrés-à-raconter-en-formation)
8. [Partager ou pas ? L'arbre de décision](#8-partager-ou-pas--larbre-de-décision)
9. [Exercice guidé : ajouter un filtre](#9-exercice-guidé--ajouter-un-filtre)
10. [Pour aller plus loin](#10-pour-aller-plus-loin)
11. [Commandes de référence](#11-commandes-de-référence)
12. [Glossaire](#12-glossaire)

---

## 1. L'idée en une image

Une même todolist, branchée sur une API REST (`json-server` sur `http://localhost:3000/todos`),
déclinée deux fois : une app web (React + Vite) et une app mobile (React Native + Expo).

```
                        ┌──────────────────────────────┐
                        │   packages/shared            │
                        │   @todolist/shared           │
                        │                              │
                        │   schemas/   ← yup           │
                        │   api/       ← fetch         │
                        │   hooks/     ← useState…     │
                        │   utils/     ← TS pur        │
                        └──────────────┬───────────────┘
                                       │ import { useTodos } from '@todolist/shared'
                     ┌─────────────────┴──────────────────┐
                     ▼                                    ▼
      ┌──────────────────────────┐          ┌──────────────────────────┐
      │ apps/todolist-web-app    │          │ apps/todolist-mob-app    │
      │ React + Vite             │          │ React Native + Expo      │
      │                          │          │                          │
      │ <form> <input> <ul>      │          │ TextInput Switch FlatList│
      │ CSS                      │          │ StyleSheet               │
      │ VITE_API_URL             │          │ EXPO_PUBLIC_API_URL      │
      └────────────┬─────────────┘          └────────────┬─────────────┘
                   │                                     │
                   └───────────────┬─────────────────────┘
                                   ▼
                        http://<machine>:3000/todos
                              (json-server)
```

**La phrase à retenir** : React est une bibliothèque de *logique d'interface* (état, effets, hooks).
`react-dom` et `react-native` sont deux *moteurs de rendu* différents. Tout ce qui ne touche pas au
rendu peut être écrit une seule fois.

---

## 2. Démarrer

### Prérequis

- Node 20+ et npm 10+ (npm est utilisé pour ses *workspaces*, voir section 3).
- L'API : un `json-server` qui répond sur le port 3000 avec une ressource `todos`.
- Pour le mobile : l'app **Expo Go** sur un téléphone, ou un simulateur iOS / émulateur Android.

### Lancer

```bash
npm install          # une seule fois, À LA RACINE (pas dans chaque app)
npm test             # tests du package partagé (vitest, ~200 ms)
npm run typecheck    # tsc sur les trois workspaces
npm run web          # app web sur http://localhost:5173
npm run mobile       # serveur Expo : scanner le QR code, ou taper i (iOS) / a (Android)
```

### Arborescence

```
monorepo_example/
├── package.json                 # déclare les workspaces + force une seule version de React
├── package-lock.json            # un seul lockfile pour tout le monorepo
├── node_modules/                # un seul node_modules, partagé (hoisting)
│   └── @todolist/shared → ../../packages/shared   (lien symbolique !)
│
├── apps/
│   ├── todolist-web-app/        # créée avec : npm create vite@latest todolist-web-app -- --template react-ts
│   │   ├── src/App.tsx
│   │   ├── src/components/      # TodoForm, TodoItem, TodoList  (version DOM)
│   │   ├── src/config/api.ts    # URL de l'API côté web
│   │   ├── src/index.css
│   │   └── vite.config.ts
│   │
│   └── todolist-mob-app/        # créée avec : npx create-expo-app@latest todolist-mob-app --template blank-typescript
│       ├── App.tsx
│       ├── src/components/      # TodoForm, TodoItem, TodoList  (version native)
│       ├── src/config/api.ts    # URL de l'API côté mobile
│       ├── src/theme.ts
│       └── metro.config.js
│
└── packages/
    └── shared/                  # @todolist/shared
        ├── package.json         # "main": "./src/index.ts"  → consommé en source, sans build
        └── src/
            ├── schemas/todo.ts
            ├── api/client.ts
            ├── hooks/useTodos.ts
            ├── hooks/useTodoInput.ts
            ├── utils/stats.ts
            └── index.ts
```

---

## 3. Comment fonctionne le monorepo

### 3.1 Les workspaces npm

Le `package.json` racine déclare :

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Conséquences, à faire observer aux stagiaires :

1. **Un seul `npm install`** à la racine installe les dépendances des trois projets.
2. **Un seul `node_modules`** à la racine (c'est le *hoisting*). Chaque app cherche ses modules en
   remontant l'arborescence, comme Node le fait toujours.
3. **Le package partagé est un lien symbolique** :
   `node_modules/@todolist/shared → packages/shared`.
   Modifier `packages/shared/src/hooks/useTodos.ts` se répercute *immédiatement* dans les deux apps,
   avec rechargement à chaud. Il n'y a rien à publier, rien à builder.

Vérifiez-le en live :

```bash
ls -la node_modules/@todolist/
# shared -> ../../packages/shared
```

### 3.2 Comment une app « voit » le package partagé

Dans `apps/todolist-web-app/package.json` et `apps/todolist-mob-app/package.json` :

```json
"dependencies": {
  "@todolist/shared": "*"
}
```

Le `*` signifie « n'importe quelle version » : npm comprend qu'il s'agit d'un workspace local et
crée le lien symbolique au lieu de télécharger quoi que ce soit.

Ensuite, dans le code des deux apps, l'import est identique :

```ts
import { useTodos, getTodoStats } from '@todolist/shared'
```

### 3.3 Package en source, sans build

Le `package.json` de `packages/shared` pointe directement sur le TypeScript :

```json
{
  "name": "@todolist/shared",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

Pas de `dist/`, pas de `tsc` à relancer, pas de `tsconfig` compliqué. Vite et Metro savent tous les
deux compiler du TypeScript à la volée, donc on les laisse faire.

| Approche | Avantages | Inconvénients |
| --- | --- | --- |
| **En source** (ce projet) | Zéro config, rechargement à chaud, une seule source de vérité | Chaque app recompile le package ; contraintes sur la syntaxe TS (voir 7.2) ; ne fonctionne que dans un monorepo |
| **Buildé** (`dist/` + `tsc`) | Publiable sur npm, consommable par n'importe quel outil | Il faut relancer le build à chaque modification (ou un watcher), plus de config |

Pour une formation ou une équipe unique : en source. Pour publier une lib : buildé.

---

## 4. Le package partagé, fichier par fichier

Chaque fichier répond à la question : **pourquoi est-ce partageable ?**

### 4.1 `schemas/todo.ts` : la forme des données

```ts
import { array, boolean, number, object, string, type InferType } from 'yup'

export const TodoSchema = object({
  id: number().integer().required(),
  userId: number().integer().optional(),
  title: string().defined(),
  completed: boolean().required(),
})

export const TodoListSchema = array().of(TodoSchema).required()

export const NewTodoInputSchema = object({
  title: string().trim().required('Le titre est obligatoire').max(120, '…'),
})

export type Todo = InferType<typeof TodoSchema>
export type NewTodoInput = InferType<typeof NewTodoInputSchema>
```

**Pourquoi partageable ?** Yup est du TypeScript pur, sans dépendance à une plateforme.
Un todo a la même forme que l'écran soit un navigateur ou un téléphone. Et la règle « le titre est
obligatoire » doit être la même partout : si on la duplique, elle finira par diverger.

**Bonus pédagogique** : `InferType` génère le type TypeScript à partir du schéma. On écrit la
structure une fois, on obtient à la fois la validation à l'exécution *et* le typage statique.

**Deux pièges yup à signaler** :

- Un champ est **optionnel par défaut**. Il faut écrire `required()` (ou `defined()`) pour l'exiger.
  Différence : `required()` refuse aussi la chaîne vide, `defined()` refuse seulement `undefined`.
  C'est pour ça que `title` utilise `defined()` : un todo au titre vide existe peut-être en base,
  le schéma décrit la réalité.
- Par défaut, yup **convertit** les valeurs avant de valider (`"42"` devient `42`). Pour une
  saisie utilisateur c'est ce qu'on veut (le `trim()` en dépend). Pour une réponse d'API, non :
  le client passe `{ strict: true }` afin qu'un écart de format soit détecté, pas masqué.

### 4.2 `api/client.ts` : parler à l'API

```ts
export function createTodoApi(config: { baseUrl: string; fetch?: typeof fetch }): TodoApi {
  // ...
  return {
    list()            { /* GET    /todos      → TodoListSchema.validateSync(json, { strict: true }) */ },
    create(input)     { /* POST   /todos      → TodoSchema.validateSync(json, { strict: true })     */ },
    update(id, patch) { /* PATCH  /todos/:id  → TodoSchema.validateSync(json, { strict: true })     */ },
    remove(id)        { /* DELETE /todos/:id                                                        */ },
  }
}
```

**Pourquoi partageable ?** Le client repose uniquement sur `fetch`, qui existe nativement dans le
navigateur **et** dans React Native (c'est l'un des rares points où les deux environnements sont
vraiment identiques). Pas d'axios, pas de dépendance.

Deux choix de conception à commenter :

- **`baseUrl` est injectée** au lieu d'être codée en dur. C'est *la* raison pour laquelle le client est
  partageable : l'URL diffère selon la plateforme (section 6.3), mais le client n'a pas à le savoir.
  On appelle ça l'*inversion de dépendance* : le code générique reçoit sa configuration de l'extérieur.
- **`fetch` est injectable** aussi. Ça sert aux tests (`client.test.ts` passe un faux `fetch`) et
  permettrait d'ajouter un token d'authentification sans toucher au client.

Toute réponse de l'API passe par `Schema.validateSync()`. Si le serveur renvoie n'importe quoi, l'erreur
est claire et immédiate, au lieu d'un `undefined is not a function` trois composants plus loin.

### 4.3 `hooks/useTodos.ts` : la logique de la liste

```ts
export function useTodos(api: TodoApi) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => { /* api.list() */ }, [api])
  useEffect(() => { void refresh() }, [refresh])

  const add    = useCallback(async (input) => { /* api.create puis setTodos */ }, [api])
  const toggle = useCallback(async (id)    => { /* optimiste + rollback     */ }, [api, todos])
  const remove = useCallback(async (id)    => { /* optimiste + rollback     */ }, [api, todos])

  return { todos, status, error, refresh, add, toggle, remove }
}
```

**Pourquoi partageable ?** C'est le point clé de la formation. Ce hook n'utilise que `useState`,
`useEffect` et `useCallback`. Ces fonctions viennent du package `react`, pas de `react-dom` ni de
`react-native`. Le « moteur » des hooks est le même partout ; seul le rendu final change.

À faire remarquer :

- Le hook **ne rend rien**. Il ne retourne que des données et des fonctions. C'est ce qui le rend
  agnostique de la plateforme.
- Il reçoit `api` en paramètre (encore l'inversion de dépendance). Chaque app lui passe son propre
  client, configuré avec la bonne URL.
- `toggle` et `remove` font une **mise à jour optimiste** : l'UI change tout de suite, et on revient
  en arrière si l'API échoue. Cette logique subtile est écrite une seule fois et bénéficie aux deux apps.

### 4.4 `hooks/useTodoInput.ts` : la logique du formulaire

```ts
export function useTodoInput(onSubmit: (input: NewTodoInput) => Promise<void>) {
  const [value, setValueState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    let input: NewTodoInput
    try {
      input = NewTodoInputSchema.validateSync({ title: value })
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : 'Saisie invalide')
      return
    }
    await onSubmit(input)
    setValueState('')
  }, [value, onSubmit])

  return { value, error, setValue, submit }
}
```

**Pourquoi partageable ?** Un formulaire, c'est un état (la valeur tapée), une validation et une
action de soumission. Rien de tout ça ne dépend du fait que le champ soit un `<input>` HTML ou un
`<TextInput>` natif. Le hook fait le lien entre le schéma yup (4.1) et le composant (section 5).

### 4.5 `utils/stats.ts` : la logique métier

```ts
export function getTodoStats(todos: readonly Todo[]) {
  const done = todos.filter((t) => t.completed).length
  return { total: todos.length, done, remaining: todos.length - done }
}
```

**Pourquoi partageable ?** C'est une fonction pure : des données en entrée, des données en sortie.
Le cas le plus évident, et souvent le plus négligé (on voit trop de calculs métier faits dans les
composants).

### 4.6 Les tests : `*.test.ts`

```bash
npm test
#  Test Files  3 passed (3)
#       Tests  15 passed (15)
```

**L'argument massue du partage** : le code partagé se teste **une seule fois**, en Node, en
200 millisecondes, sans navigateur ni simulateur. Les tests du client API utilisent un faux `fetch` ;
les tests des schémas vérifient les messages d'erreur. Aucun test n'a besoin de React.

### 4.7 La règle qui résume tout

> **Un fichier qui n'importe ni `react-dom`, ni `react-native`, ni une API du navigateur
> (`document`, `window`, `localStorage`) est candidat au partage.**

Vérifiez : `packages/shared` ne contient **aucun fichier `.tsx`**. Pas de JSX, donc pas de rendu,
donc partageable.

---

## 5. Les deux apps côte à côte

Le meilleur moyen de faire comprendre le partage : ouvrir les deux `TodoForm.tsx` sur deux écrans.

### 5.1 Le formulaire

<table>
<tr>
<th>Web : <code>apps/todolist-web-app/src/components/TodoForm.tsx</code></th>
<th>Mobile : <code>apps/todolist-mob-app/src/components/TodoForm.tsx</code></th>
</tr>
<tr>
<td>

```tsx
import { useTodoInput } from '@todolist/shared'

export function TodoForm({ onSubmit }) {
  const input = useTodoInput(onSubmit)

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      void input.submit()
    }}>
      <input
        type="text"
        value={input.value}
        onChange={(e) => input.setValue(e.target.value)}
      />
      <button type="submit">Ajouter</button>
      {input.error && <p role="alert">{input.error}</p>}
    </form>
  )
}
```

</td>
<td>

```tsx
import { useTodoInput } from '@todolist/shared'

export function TodoForm({ onSubmit }) {
  const input = useTodoInput(onSubmit)

  return (
    <View>
      <TextInput
        value={input.value}
        onChangeText={input.setValue}
        onSubmitEditing={() => void input.submit()}
      />
      <Pressable onPress={() => void input.submit()}>
        <Text>Ajouter</Text>
      </Pressable>
      {input.error && <Text>{input.error}</Text>}
    </View>
  )
}
```

</td>
</tr>
</table>

Points à faire remarquer :

- La **première ligne est la même** : le hook partagé.
- La **deuxième ligne est la même** : `const input = useTodoInput(onSubmit)`.
- Tout le reste diffère, et c'est normal : c'est du rendu.
- Détails plateforme : sur le web, `onChange` reçoit un événement (`e.target.value`) ; sur mobile,
  `onChangeText` reçoit directement la chaîne. Sur le web, on soumet avec `<form onSubmit>` ; sur
  mobile, il n'y a pas de formulaire, on écoute `onSubmitEditing` (la touche « OK » du clavier).

### 5.2 Le composant racine

<table>
<tr>
<th>Web : <code>src/App.tsx</code></th>
<th>Mobile : <code>App.tsx</code></th>
</tr>
<tr>
<td>

```tsx
const { todos, status, error, add, toggle, remove, refresh }
  = useTodos(todoApi)
const stats = getTodoStats(todos)

return (
  <main className="app">
    <h1>Todolist</h1>
    <p>{stats.remaining} à faire</p>
    <TodoForm onSubmit={add} />
    {error && <div role="alert">{error}</div>}
    <TodoList todos={todos} onToggle={toggle} onRemove={remove} />
  </main>
)
```

</td>
<td>

```tsx
const { todos, status, error, add, toggle, remove, refresh }
  = useTodos(todoApi)
const stats = getTodoStats(todos)

return (
  <SafeAreaView style={styles.safe}>
    <Text style={styles.title}>Todolist</Text>
    <Text>{stats.remaining} à faire</Text>
    <TodoForm onSubmit={add} />
    {error && <View style={styles.banner}>…</View>}
    <TodoList todos={todos} refreshing={status === 'loading'}
              onRefresh={refresh} onToggle={toggle} onRemove={remove} />
  </SafeAreaView>
)
```

</td>
</tr>
</table>

Les deux premières lignes sont **identiques au caractère près**. Toute l'intelligence de l'app
(chargement, erreurs, ajout, toggle, suppression, statistiques) est partagée. Le reste est de la
présentation.

### 5.3 Correspondance des primitives

| Concept | Web (DOM) | Mobile (React Native) |
| --- | --- | --- |
| Conteneur | `<div>`, `<main>`, `<section>` | `<View>` |
| Texte | `<p>`, `<span>`, `<h1>` (texte libre autorisé) | `<Text>` (**obligatoire** : du texte hors `<Text>` plante) |
| Champ de saisie | `<input type="text">` + `onChange(e)` | `<TextInput>` + `onChangeText(str)` |
| Case à cocher | `<input type="checkbox">` | `<Switch>` (pas de checkbox native) |
| Bouton | `<button>` | `<Pressable>` (ou `<Button>`, peu stylable) |
| Liste | `<ul>` + `.map()` | `<FlatList>` (virtualisée : ne rend que les éléments visibles) |
| Rafraîchir | Bouton « Réessayer » | `RefreshControl` (tirer vers le bas) |
| Formulaire | `<form onSubmit>` | N'existe pas : `onSubmitEditing` sur le champ |
| Style | CSS, classes, `prefers-color-scheme` | `StyleSheet.create({})`, objets JS, sous-ensemble de CSS (flexbox par défaut en colonne) |
| Zones sûres | Rien | `SafeAreaView` (encoche, barre d'accueil) |
| Clavier | Géré par le navigateur | `keyboardShouldPersistTaps`, `KeyboardAvoidingView` |

---

## 6. Ce qui ne se partage pas, et pourquoi

### 6.1 Les composants UI

Vu en section 5. Les primitives sont différentes (`div` contre `View`), les événements sont
différents, les contraintes sont différentes (texte obligatoirement dans `<Text>`).

Il existe des solutions pour partager aussi l'UI (`react-native-web`, Tamagui, NativeWind…), mais
elles ont un coût : on écrit du React Native partout, y compris sur le web, et on perd l'accès direct
au HTML/CSS. Ce n'est pas le sujet de cette formation, mais c'est bien de le mentionner.

### 6.2 Le style

- Web : `src/index.css`, avec variables CSS et `@media (prefers-color-scheme: dark)`.
- Mobile : `src/theme.ts` (des constantes JS) + `StyleSheet.create` dans chaque composant.

React Native n'a pas de CSS. Il a un sous-ensemble des propriétés CSS, en camelCase, avec flexbox
comme unique modèle de layout, et `flexDirection: 'column'` par défaut (le contraire du web).

### 6.3 L'URL de l'API : le piège classique du mobile

C'est **le** point qui surprend tout le monde la première fois.

Sur le web, `http://localhost:3000` fonctionne : le navigateur et l'API tournent sur la même machine.

Sur mobile, **`localhost` désigne le téléphone (ou l'émulateur) lui-même**, pas votre ordinateur.
L'app doit donc connaître l'adresse de la machine qui héberge l'API.

| Contexte | Adresse pour joindre votre machine |
| --- | --- |
| Navigateur web | `localhost` |
| Simulateur iOS | `localhost` (le simulateur partage le réseau du Mac) |
| Émulateur Android | `10.0.2.2` (alias spécial vers la machine hôte) |
| Téléphone physique | L'IP LAN de votre machine, ex. `192.168.1.42` |

Le fichier `apps/todolist-mob-app/src/config/api.ts` résout ça dans l'ordre :

```ts
function resolveBaseUrl(): string {
  // 1. Variable d'environnement explicite (EXPO_PUBLIC_* est injectée dans le bundle)
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv

  // 2. Astuce : le serveur de dev Expo connaît l'IP de votre machine (hostUri).
  //    Le téléphone a bien réussi à charger le bundle depuis cette IP,
  //    donc il pourra aussi joindre l'API dessus.
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0]
  if (devHost) return `http://${devHost}:3000`

  // 3. Repli selon la plateforme
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  return `http://${host}:3000`
}
```

L'app mobile affiche l'URL résolue sous le titre, pour qu'on voie tout de suite laquelle a été
choisie.

Côté web, c'est bien plus simple (`apps/todolist-web-app/src/config/api.ts`) :

```ts
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
```

Notez la différence de mécanisme pour les variables d'environnement : `import.meta.env.VITE_*` côté
Vite, `process.env.EXPO_PUBLIC_*` côté Expo. Encore une raison pour que ce fichier reste dans chaque
app.

**Et le client API dans tout ça ?** Il reçoit `baseUrl` et n'a aucune idée de ce qui précède. C'est
exactement la frontière : la *résolution* de l'URL est spécifique à la plateforme, l'*utilisation* de
l'URL est partagée.

### 6.4 Le bundler : Vite contre Metro

| | Web : Vite | Mobile : Metro |
| --- | --- | --- |
| Fichier | `vite.config.ts` | `metro.config.js` |
| Support monorepo | Natif (suit les liens symboliques) | Auto-détecté depuis Expo SDK 52 ; on l'explicite ici |
| Compilation TS | esbuild / oxc | Babel (`babel-preset-expo`) |
| Sortie | HTML + JS + CSS pour navigateur | Bytecode Hermes (`.hbc`) pour l'app native |
| Vérifier | `npm run build` | `npx expo export --platform android` |

Le `metro.config.js` fourni montre les deux réglages dont Metro a besoin dans un monorepo :

```js
config.watchFolders = [workspaceRoot]                 // surveiller packages/shared
config.resolver.nodeModulesPaths = [                  // chercher les modules dans l'app,
  path.resolve(projectRoot, 'node_modules'),          // puis à la racine (hoisting)
  path.resolve(workspaceRoot, 'node_modules'),
]
```

### 6.5 Le point d'entrée

- Web : `index.html` → `src/main.tsx` → `createRoot(document.getElementById('root'))`.
- Mobile : `index.ts` → `registerRootComponent(App)` (fourni par Expo, qui appelle `AppRegistry`).

Il n'y a pas de HTML sur mobile. Pas de `document`, pas de `window`. Une bibliothèque qui touche au
DOM ne fonctionnera pas.

---

## 7. Les pièges rencontrés (à raconter en formation)

Ces trois problèmes sont **réellement survenus** en construisant ce projet. Ils valent mieux qu'une
liste théorique.

### 7.1 « Invalid hook call » : trois copies de React

**Symptôme.** Après avoir créé les deux apps, `npm ls react` montrait :

```
node_modules/react                          → 19.3.0
apps/todolist-web-app/node_modules/react    → 19.2.3
apps/todolist-mob-app/node_modules/react    → 19.2.3
```

**Cause.** Expo fixe React à une version exacte (`19.2.3`), Vite demandait `^19.2.8`, et le package
partagé déclarait `react: ">=18"` en `peerDependency`. npm a résolu chacun de son côté : la dernière
version à la racine, et une copie nichée dans chaque app.

**Pourquoi c'est grave.** Le hook partagé, situé dans `packages/shared`, remonte l'arborescence et
trouve le React de la racine (19.3.0). Le composant de l'app, lui, trouve celui de son propre
`node_modules` (19.2.3). Deux instances de React dans le même arbre : les hooks explosent avec le
fameux `Invalid hook call. Hooks can only be called inside of the body of a function component`.

**Solution.** Une seule version, imposée à tout le monde dans le `package.json` racine :

```json
"overrides": {
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

Plus `resolve.dedupe: ['react', 'react-dom']` dans `vite.config.ts` par sécurité. Et il a fallu
supprimer `package-lock.json` et `node_modules` pour que npm recalcule l'arbre. Vérification :

```bash
find . -path '*node_modules/react/package.json'
# node_modules/react/package.json     ← une seule ligne = OK
```

**Leçon.** Dans un monorepo React, **la version de React est une décision d'équipe**, pas de projet.
Expo est le plus contraignant (version exacte liée au SDK), donc c'est lui qui la dicte.

### 7.2 Syntaxe TypeScript « non effaçable »

**Symptôme.** Le build web a échoué sur un fichier du package partagé :

```
packages/shared/src/api/client.ts(22,5): error TS1294:
This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

**Cause.** Le code utilisait un *paramètre de propriété* dans un constructeur :

```ts
class TodoApiError extends Error {
  constructor(message: string, public readonly status?: number) { … }
}
```

C'est du TypeScript qui **génère du code** (il faut ajouter `this.status = status`). Or les outils
modernes (esbuild, oxc, Node avec `--strip-types`) veulent du TypeScript dont on peut simplement
*effacer* les annotations. Le template Vite active donc `erasableSyntaxOnly`.

**Solution.** Écrire le code explicitement :

```ts
class TodoApiError extends Error {
  readonly status: number | undefined
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}
```

**Leçon.** Un package en source est compilé par **chaque** consommateur. Il doit donc respecter le
plus strict d'entre eux. À éviter dans le code partagé : paramètres de propriété, `enum` (préférer
des unions de littéraux), `namespace`.

### 7.3 Les données réelles ne respectent pas le schéma

**Symptôme.** Au premier chargement de l'app web, une erreur yup :

```
path: [200].userId, message: "[200].userId is a required field"
```

**Cause.** Deux todos avaient été créés à la main dans json-server, sans `userId`. Le schéma le
déclarait obligatoire.

**Solution.** Deux choses :

1. `userId: number().integer().optional()` : le schéma décrit la réalité, pas l'idéal.
2. Le client API attrape les `ValidationError` yup et les reformule en `TodoApiError` lisible
   (« Réponse inattendue de l'API sur GET /todos : … ») au lieu d'afficher le JSON brut.

**Leçon.** C'est exactement pour ça qu'on valide les réponses : l'erreur est apparue immédiatement,
au bon endroit, avec le bon message. Sans yup, on aurait eu `undefined` qui se promène dans l'UI.

---

## 8. Partager ou pas ? L'arbre de décision

À projeter, puis à appliquer sur des exemples proposés par les stagiaires.

```
Le code importe-t-il react-dom, react-native, ou une API navigateur
(document, window, localStorage, navigator) ?
│
├── OUI → NE SE PARTAGE PAS. Il vit dans apps/<plateforme>/.
│         (composants, styles, navigation, stockage local, permissions, caméra…)
│
└── NON → Le code rend-il quelque chose (JSX) ?
          │
          ├── OUI → NE SE PARTAGE PAS (sauf si vous adoptez react-native-web).
          │
          └── NON → Dépend-il d'une configuration qui varie selon la plateforme
                    (URL, clés, variables d'environnement) ?
                    │
                    ├── OUI → SÉPARER : la logique va dans packages/shared et reçoit
                    │         la config en paramètre ; la config reste dans chaque app.
                    │         (exemple : createTodoApi({ baseUrl }))
                    │
                    └── NON → SE PARTAGE. packages/shared.
                              (schémas, types, clients API, hooks de logique,
                               calculs métier, formatage, i18n, tests)
```

Quelques cas à faire classer :

| Exemple | Verdict | Pourquoi |
| --- | --- | --- |
| Formater une date en français | Partagé | Fonction pure |
| Un hook `useDebounce` | Partagé | Seulement `useState` / `useEffect` |
| Un hook `useLocalStorage` | Non partagé | `localStorage` n'existe pas sur mobile (c'est `AsyncStorage`) |
| Un hook `useTodos` qui persiste en local | Séparer | Le hook prend un `storage` en paramètre ; chaque app fournit le sien |
| Le schéma de validation d'un formulaire de login | Partagé | Zod |
| Le composant `<LoginForm>` | Non partagé | JSX + primitives différentes |
| La navigation entre écrans | Non partagé | React Router contre React Navigation / Expo Router |
| Un store Zustand / Redux | Partagé | Pas de dépendance au rendu |
| Un client API avec token d'auth | Séparer | Le client est partagé ; la lecture du token (cookie contre SecureStore) est par plateforme |

---

## 9. Exercice guidé : ajouter un filtre

But : ajouter un filtre « toutes / à faire / terminées » dans les deux apps, en plaçant chaque
morceau au bon endroit.

**Étape 1 : la logique (partagée).** Dans `packages/shared/src/utils/filter.ts` :

```ts
import type { Todo } from '../schemas/todo'

export type TodoFilter = 'all' | 'active' | 'done'

export function filterTodos(todos: readonly Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'active': return todos.filter((t) => !t.completed)
    case 'done':   return todos.filter((t) => t.completed)
    default:       return [...todos]
  }
}
```

Ajouter l'export dans `src/index.ts`, et un test dans `filter.test.ts`. Lancer `npm test`.

**Étape 2 : l'état (partagé).** Toujours dans `packages/shared`, un hook `useTodoFilter` qui
retourne `{ filter, setFilter }` avec `useState<TodoFilter>('all')`. On pourrait le fusionner dans
`useTodos`, mais le garder séparé montre qu'un hook peut être petit.

**Étape 3 : l'UI web (non partagée).** Trois `<button>` dans `App.tsx`, ou un `<select>`. La classe
`active` sur le bouton courant, en CSS.

**Étape 4 : l'UI mobile (non partagée).** Trois `<Pressable>` dans une `<View style={{ flexDirection:
'row' }}>`, ou un `SegmentedControl`. Style via `StyleSheet`.

**Question à poser au groupe** : que se passe-t-il si on décide plus tard que le filtre doit aussi
masquer les todos de plus de 30 jours ? Réponse : on modifie `filterTodos` une seule fois et les deux
apps suivent. C'est tout l'intérêt.

**Variante plus difficile** : persister le filtre choisi. Sur le web, `localStorage` ; sur mobile,
`AsyncStorage`. Le hook partagé doit alors recevoir un objet `storage` avec `get`/`set` en paramètre.
On retrouve le motif de `createTodoApi({ baseUrl })`.

---

## 10. Pour aller plus loin

- **Gestion de données serveur** : remplacer `useTodos` par TanStack Query (`useQuery`, `useMutation`).
  Le hook reste partageable (TanStack Query fonctionne sur React Native) et on gagne cache, retry et
  invalidation. Le projet reste volontairement en hooks React « nus » pour que la mécanique soit visible.
- **Partager aussi l'UI** : `react-native-web` permet d'écrire des composants React Native et de les
  rendre dans un navigateur. Expo le supporte nativement (`npx expo start --web`). Compromis : on
  perd le HTML sémantique et le CSS classique.
- **Outils de monorepo** : pnpm (plus strict sur le hoisting, évite les dépendances fantômes), Turborepo
  ou Nx (cache des builds, orchestration). Utile au-delà de trois packages.
- **Publier le package** : ajouter un build (`tsup` ou `tsc`) et un champ `exports` pointant sur
  `dist/`, si le package doit être consommé hors du monorepo.
- **Une seule version de tout** : le problème de la section 7.1 existe pour toute bibliothèque qui
  utilise un contexte React (react-query, react-redux, react-i18next…). Même remède : `overrides`.

---

## 11. Commandes de référence

```bash
# Installation et vérifications (à la racine)
npm install
npm test                                     # vitest sur packages/shared
npm run test:watch --workspace @todolist/shared
npm run typecheck                            # tsc sur les 3 workspaces

# Web
npm run web                                  # dev server http://localhost:5173
npm run build --workspace todolist-web-app   # tsc -b && vite build → apps/todolist-web-app/dist

# Mobile
npm run mobile                               # expo start (QR code, i = iOS, a = Android)
npm run ios     --workspace todolist-mob-app
npm run android --workspace todolist-mob-app
cd apps/todolist-mob-app && npx expo export --platform android   # vérifie que Metro bundle tout

# Diagnostic monorepo
ls -la node_modules/@todolist/               # le lien symbolique vers packages/shared
npm ls react                                 # doit afficher UNE version, sans "invalid"
find . -path '*node_modules/react/package.json'   # doit afficher UNE ligne

# Variables d'environnement
cp apps/todolist-web-app/.env.example apps/todolist-web-app/.env.local     # VITE_API_URL
cp apps/todolist-mob-app/.env.example apps/todolist-mob-app/.env.local     # EXPO_PUBLIC_API_URL
```

---

## 12. Glossaire

- **Monorepo** : un seul dépôt git qui contient plusieurs projets (ici deux apps et un package).
- **Workspace** : un sous-projet du monorepo, déclaré dans le `package.json` racine. npm, yarn et pnpm
  ont tous cette notion.
- **Hoisting** : npm remonte les dépendances communes dans le `node_modules` de la racine pour ne les
  installer qu'une fois.
- **Lien symbolique (symlink)** : `node_modules/@todolist/shared` n'est pas une copie mais un raccourci
  vers `packages/shared`. Toute modification est visible instantanément.
- **peerDependency** : « je fonctionne avec React, mais c'est à celui qui m'utilise de le fournir ».
  C'est ce que déclare `packages/shared` pour `react`.
- **overrides** : dans le `package.json` racine, force une version précise d'un paquet pour tout
  l'arbre de dépendances, quoi qu'en disent les sous-projets.
- **Bundler** : l'outil qui assemble tous les fichiers source (TS, CSS, images) en un bundle
  exécutable. Vite pour le web, Metro pour React Native.
- **Hermes** : le moteur JavaScript de React Native. Metro produit du bytecode Hermes (`.hbc`).
- **Expo** : un framework et un ensemble d'outils au-dessus de React Native (CLI, SDK, Expo Go).
- **Expo Go** : l'app mobile qui charge votre bundle JS sans compiler de code natif. Parfait pour
  démarrer, limité dès qu'on ajoute un module natif non inclus.
- **Zod** : bibliothèque de validation de schémas. Décrit une structure de données, la valide à
  l'exécution et en déduit le type TypeScript.
- **Mise à jour optimiste** : modifier l'UI avant la réponse du serveur, puis annuler si le serveur
  refuse. Donne une impression d'instantanéité.
- **Inversion de dépendance** : le code générique reçoit ce dont il a besoin en paramètre
  (`createTodoApi({ baseUrl })`, `useTodos(api)`) au lieu d'aller le chercher lui-même. C'est le
  mécanisme qui rend un morceau de code partageable.
- **Syntaxe effaçable** : du TypeScript dont on peut retirer les types sans changer le JavaScript
  produit. Les paramètres de propriété et les `enum` ne le sont pas.
