import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

export function parseVersion(version) {
  const match = versionPattern.exec(version)
  if (!match) throw new Error(`Invalid semantic version: ${version}`)
  return {
    core: match.slice(1, 4).map(BigInt),
    prerelease: match[4]?.split('.') ?? [],
  }
}

export function compareVersions(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i] ? 1 : -1
  }
  if (a.prerelease.length === 0) return b.prerelease.length === 0 ? 0 : 1
  if (b.prerelease.length === 0) return -1
  for (let i = 0; i < Math.min(a.prerelease.length, b.prerelease.length); i++) {
    const x = a.prerelease[i]
    const y = b.prerelease[i]
    if (x === y) continue
    const xNumeric = /^\d+$/.test(x)
    const yNumeric = /^\d+$/.test(y)
    if (xNumeric && yNumeric) return BigInt(x) > BigInt(y) ? 1 : -1
    if (xNumeric !== yNumeric) return xNumeric ? -1 : 1
    return x > y ? 1 : -1
  }
  return Math.sign(a.prerelease.length - b.prerelease.length)
}

export function pluginNames(marketplacePath = resolve(root, '.claude-plugin/marketplace.json')) {
  const names = JSON.parse(readFileSync(marketplacePath, 'utf8')).plugins.map((plugin) => plugin.name)
  if (names.length === 0) throw new Error('The marketplace lists no plugins')
  return names
}

export function pluginVersion(name, pluginsDir = resolve(root, 'plugins')) {
  const manifest = (host) => JSON.parse(readFileSync(resolve(pluginsDir, name, host, 'plugin.json'), 'utf8'))
  const claude = manifest('.claude-plugin')
  const codex = manifest('.codex-plugin')
  if (claude.name !== name || codex.name !== name) throw new Error(`Plugin manifest names must be ${name}`)
  if (claude.version !== codex.version) throw new Error(`${name}: Claude and Codex plugin versions differ`)
  parseVersion(claude.version)
  return claude.version
}

export function releaseStatus(name, version, tags) {
  const prefix = `${name}@`
  const versions = tags.filter((tag) => tag.startsWith(prefix)).map((tag) => tag.slice(prefix.length))
  for (const previous of versions) parseVersion(previous)
  const latest = versions.sort(compareVersions).at(-1)
  if (!latest) return 'new'
  const comparison = compareVersions(version, latest)
  if (comparison < 0) throw new Error(`Plugin version ${version} is older than released ${name}@${latest}`)
  return comparison === 0 ? 'existing' : 'new'
}

export function requireVersionBump(previous, current, pluginChanged) {
  if (pluginChanged && compareVersions(current, previous) <= 0) {
    throw new Error(`Plugin content changed without a version increase (${previous} → ${current})`)
  }
}

const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })

function previousVersion(base, name) {
  try {
    return JSON.parse(git(['show', `${base}:plugins/${name}/.claude-plugin/plugin.json`])).version
  } catch {
    return undefined // the plugin is new on this branch, so any valid version is acceptable
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const names = pluginNames()
    if (process.argv[2] === '--base') {
      const base = process.argv[3]
      if (!base) throw new Error('A base ref is required after --base')
      for (const name of names) {
        const version = pluginVersion(name)
        const previous = previousVersion(base, name)
        if (previous === undefined) {
          console.log(`${name}@${version} is new against ${base}`)
          continue
        }
        const changed = git(['diff', '--name-only', base, 'HEAD', '--', `plugins/${name}/`]).trim()
        requireVersionBump(previous, version, Boolean(changed))
        console.log(`${name}@${version} is valid against ${base}`)
      }
      process.exit(0)
    }
    const tags = git(['tag', '--list']).trim().split('\n').filter(Boolean)
    const releases = names.map((name) => {
      const version = pluginVersion(name)
      const status = releaseStatus(name, version, tags)
      console.log(`${name}@${version}: ${status === 'new' ? 'tag missing' : 'tag exists'}`)
      return { name, version, tag: `${name}@${version}`, status }
    })
    if (process.env.GITHUB_OUTPUT) {
      const { appendFileSync } = await import('node:fs')
      const tagsToRelease = releases.filter((release) => release.status === 'new').map((release) => release.tag)
      appendFileSync(process.env.GITHUB_OUTPUT, `tags=${tagsToRelease.join(' ')}\n`)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
