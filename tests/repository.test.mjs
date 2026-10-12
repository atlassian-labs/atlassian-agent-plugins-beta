// Guards the repository invariants an OSS reviewer would otherwise check by hand:
// manifest consistency, the required governance files, and the absence of
// internal-only references in a repository that is intended to become public.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const readJson = (...parts) => JSON.parse(readFileSync(join(repoRoot, ...parts), 'utf8'))
const marketplace = readJson('.claude-plugin', 'marketplace.json')
const codexMarketplace = readJson('.agents', 'plugins', 'marketplace.json')

const pluginDirs = readdirSync(join(repoRoot, 'plugins'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe('marketplace manifest', () => {
  test('lists every plugin directory, and only those', () => {
    assert.deepEqual(
      marketplace.plugins.map((plugin) => plugin.name).sort(),
      [...pluginDirs].sort(),
      'plugins/ and marketplace.json have drifted — an unlisted plugin is not installable',
    )
  })

  test('points each entry at its own directory', () => {
    for (const plugin of marketplace.plugins) {
      assert.equal(plugin.source, `./plugins/${plugin.name}`, `${plugin.name}: source does not match its name`)
    }
  })

  test('declares an owner and a description', () => {
    assert.ok(marketplace.owner?.name, 'marketplace.owner.name is required')
    assert.ok(marketplace.description?.length > 20, 'marketplace.description is too thin to be useful')
  })

  test('Codex manifest shares the marketplace name and lists the same plugins', () => {
    // `<plugin>@<marketplace>` has to be the same string on both hosts.
    assert.equal(codexMarketplace.name, marketplace.name, 'Codex and Claude marketplace names have drifted')
    assert.deepEqual(
      codexMarketplace.plugins.map((plugin) => plugin.name).sort(),
      marketplace.plugins.map((plugin) => plugin.name).sort(),
      '.agents/plugins/marketplace.json and .claude-plugin/marketplace.json list different plugins',
    )
    for (const plugin of codexMarketplace.plugins) {
      assert.deepEqual(
        plugin.source,
        { source: 'local', path: `./plugins/${plugin.name}` },
        `${plugin.name}: Codex source does not match its name`,
      )
      assert.ok(
        plugin.policy?.installation && plugin.policy?.authentication && plugin.category,
        `${plugin.name}: a Codex entry needs policy.installation, policy.authentication, and category`,
      )
    }
  })
})

describe('plugin manifests', () => {
  for (const name of pluginDirs) {
    describe(name, () => {
      const manifest = readJson('plugins', name, '.claude-plugin', 'plugin.json')

      test('manifest name matches its directory', () => {
        assert.equal(manifest.name, name)
      })

      test('version is semver', () => {
        assert.match(manifest.version ?? '', /^\d+\.\d+\.\d+(-[\w.]+)?$/, 'version must be semver')
      })
    })
  }
})

describe('open source governance files', () => {
  // Required by the Atlassian OSS (Credo) checklist for a Labs project.
  for (const file of ['LICENSE', 'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'README.md', 'SECURITY.md', '.atlassian/OWNER']) {
    test(`${file} exists and is not empty`, () => {
      const path = join(repoRoot, file)
      assert.ok(existsSync(path), `${file} is required`)
      assert.ok(readFileSync(path, 'utf8').trim().length > 0, `${file} is empty`)
    })
  }

  // LICENSE, CODE_OF_CONDUCT.md and CONTRIBUTING.md are kept byte-identical to
  // bitbucket.org/atlassian/oss-templates. Assert the shape of the licence text rather
  // than any Atlassian-specific header: the template ships the unmodified Apache 2.0
  // text, and editing a legal file to satisfy a test is the wrong way round.
  test('LICENSE is the unmodified Apache 2.0 text', () => {
    const license = readFileSync(join(repoRoot, 'LICENSE'), 'utf8')
    assert.match(license, /^\s+Apache License\n\s+Version 2\.0, January 2004/, 'LICENSE must be the Apache 2.0 template text')
    assert.match(license, /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/)
  })

  test('README has no unreplaced template placeholders', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
    assert.doesNotMatch(readme, /\[YYYY\]|\[Project name\]|\[<something>\]/, 'replace the OSS template placeholders')
    assert.doesNotMatch(readme, /^> (Provide|Please remove|Pick one|Other recommended)/m, 'replace the OSS template guidance quote blocks')
    assert.match(readme, /Copyright \(c\) \d{4} Atlassian US\., Inc\./, 'README needs the template copyright line with a real year')
  })

  test('CONTRIBUTING.md names this project', () => {
    const contributing = readFileSync(join(repoRoot, 'CONTRIBUTING.md'), 'utf8')
    assert.match(contributing, /# Contributing to atlassian-agent-plugins-beta/)
  })

  test('.atlassian/OWNER names a staff ID, not the template placeholder', () => {
    const owner = readFileSync(join(repoRoot, '.atlassian', 'OWNER'), 'utf8').trim()
    assert.doesNotMatch(owner, /\[Staff ID/, 'replace the OWNER placeholder')
    assert.match(owner, /^[a-z0-9][a-z0-9._-]*$/, 'OWNER should be a bare staff ID on one line')
  })

  test('CODEOWNERS assigns a default owner for every path', () => {
    const codeowners = readFileSync(join(repoRoot, '.github', 'CODEOWNERS'), 'utf8')
    const rules = codeowners
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
    assert.ok(
      rules.some((rule) => rule.startsWith('* ')),
      'CODEOWNERS needs a `*` catch-all rule, or unmatched paths have no reviewer',
    )
    for (const rule of rules) {
      assert.match(rule, /@[\w-]+/, `CODEOWNERS rule has no owner: ${rule}`)
    }
  })
})

describe('no internal-only references', () => {
  // Credo: a public repository must not depend on, or point at, internal Atlassian
  // resources. Checked here because it is far cheaper than catching it after publication.
  const FORBIDDEN = [
    /hello\.atlassian\.net/i,
    /\bgo\/[a-z0-9-]/i,
    /\.internal\.atlassian\.com/i,
    /enterprise\.slack\.com/i,
    /\.stg\.atlassian\.com/i,
    /jplat\.atlassian\.net/i,
  ]

  // The cheers banner is part of the sanctioned Atlassian OSS README template and is
  // served publicly, despite the organisation name.
  const ALLOWED = [/atlassian-internal\/oss-assets/]

  const SKIP_DIRS = new Set(['node_modules', '.git'])
  const SCANNED = /\.(md|json|ya?ml|mjs|js|ts)$/

  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(path)
      return SCANNED.test(entry.name) ? [path] : []
    })

  for (const path of walk(repoRoot)) {
    const relativePath = relative(repoRoot, path)
    if (relativePath === 'package-lock.json') continue

    test(relativePath, () => {
      const lines = readFileSync(path, 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (ALLOWED.some((allowed) => allowed.test(line))) return
        for (const pattern of FORBIDDEN) {
          assert.doesNotMatch(line, pattern, `${relativePath}:${index + 1} references an internal-only resource`)
        }
      })
    })
  }
})
