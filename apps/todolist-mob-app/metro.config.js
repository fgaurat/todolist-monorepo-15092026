// Depuis Expo SDK 52, expo/metro-config détecte automatiquement les
// workspaces npm/yarn/pnpm : il ajoute la racine du monorepo aux dossiers
// surveillés et résout node_modules à la racine.
// On l'explicite ici pour montrer ce que Metro doit savoir — c'est de la
// configuration propre au mobile, sans équivalent côté Vite.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Surveiller tout le monorepo pour que packages/shared soit rechargé à chaud.
config.watchFolders = [workspaceRoot]

// 2. Résoudre les modules d'abord dans l'app, puis à la racine (hoisting npm).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
