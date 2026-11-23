// Prints the plugins the Claude marketplace lists, one per line, for CI and npm scripts.
import { pluginNames } from './release-version.mjs'

console.log(pluginNames().join('\n'))
