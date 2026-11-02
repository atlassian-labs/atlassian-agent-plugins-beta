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

export function pluginVersion() {
  const manifest = (host) => JSON.parse(readFileSync(resolve(root, 'plugins/jira', host, 'plugin.json'), 'utf8'))
  const claude = manifest('.claude-plugin')
  const codex = manifest('.codex-plugin')
  if (claude.name !== 'jira' || codex.name !== 'jira') throw new Error('Plugin manifest names must be jira')
  if (claude.version !== codex.version) throw new Error('Claude and Codex plugin versions differ')
  parseVersion(claude.version)
  return claude.version
}

export function releaseStatus(version, tags) {
  const versions = tags.filter((tag) => tag.startsWith('jira@')).map((tag) => tag.slice(5))
  for (const previous of versions) parseVersion(previous)
  const latest = versions.sort(compareVersions).at(-1)
  if (!latest) return 'new'
  const comparison = compareVersions(version, latest)
  if (comparison < 0) throw new Error(`Plugin version ${version} is older than released jira@${latest}`)
  return comparison === 0 ? 'existing' : 'new'
}

export function requireVersionBump(previous, current, pluginChanged) {
  if (pluginChanged && compareVersions(current, previous) <= 0) {
    throw new Error(`Plugin content changed without a version increase (${previous} → ${current})`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const version = pluginVersion()
    if (process.argv[2] === '--base') {
      const base = process.argv[3]
      if (!base) throw new Error('A base ref is required after --base')
      const changed = execFileSync('git', ['diff', '--name-only', base, 'HEAD', '--', 'plugins/jira/'], {
        cwd: root,
        encoding: 'utf8',
      }).trim()
      const previous = JSON.parse(
        execFileSync('git', ['show', `${base}:plugins/jira/.claude-plugin/plugin.json`], {
          cwd: root,
          encoding: 'utf8',
        }),
      ).version
      requireVersionBump(previous, version, Boolean(changed))
      console.log(`Plugin version ${version} is valid against ${base}`)
      process.exit(0)
    }
    const tags = execFileSync('git', ['tag', '--list', 'jira@*'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    const status = releaseStatus(version, tags)
    if (process.env.GITHUB_OUTPUT) {
      const { appendFileSync } = await import('node:fs')
      appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=jira@${version}\nstatus=${status}\n`)
    }
    console.log(`jira@${version}: ${status === 'new' ? 'ready to release' : 'already released'}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
