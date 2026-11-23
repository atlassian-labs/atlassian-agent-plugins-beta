import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  compareVersions,
  parseVersion,
  pluginNames,
  pluginVersion,
  releaseStatus,
  requireVersionBump,
} from '../scripts/release-version.mjs'

test('accepts semantic versions and rejects malformed versions', () => {
  for (const version of ['0.19.1', '1.2.3-beta.2', '1.2.3+build.5']) {
    assert.doesNotThrow(() => parseVersion(version))
  }
  for (const version of ['01.2.3', '1.2', '1.2.3-beta.01', '1.2.3-', 'v1.2.3']) {
    assert.throws(() => parseVersion(version))
  }
})

test('compares prereleases and numeric segments by semantic version precedence', () => {
  assert.equal(compareVersions('0.19.1', '0.19.0'), 1)
  assert.equal(compareVersions('0.19.1-beta.10', '0.19.1-beta.2'), 1)
  assert.equal(compareVersions('0.19.1', '0.19.1-beta.10'), 1)
  assert.equal(compareVersions('0.19.1+build.2', '0.19.1+build.1'), 0)
})

test('releases a new version once and rejects a downgrade', () => {
  assert.equal(releaseStatus('jira', '0.19.1', []), 'new')
  assert.equal(releaseStatus('jira', '0.19.1', ['jira@0.19.0']), 'new')
  assert.equal(releaseStatus('jira', '0.19.1', ['jira@0.19.1']), 'existing')
  assert.throws(() => releaseStatus('jira', '0.19.0', ['jira@0.19.1']), /older than released/)
})

test('requires a higher version when plugin content changes', () => {
  assert.doesNotThrow(() => requireVersionBump('0.19.0', '0.19.1', true))
  assert.doesNotThrow(() => requireVersionBump('0.19.1', '0.19.1', false))
  assert.throws(() => requireVersionBump('0.19.1', '0.19.1', true), /without a version increase/)
  assert.throws(() => requireVersionBump('0.19.1', '0.19.0', true), /without a version increase/)
})

test('tracks each plugin by its own tags', () => {
  const tags = ['jira@0.20.0', 'memory@0.1.0']
  assert.equal(releaseStatus('memory', '0.1.1', tags), 'new')
  assert.equal(releaseStatus('jira', '0.20.0', tags), 'existing')
  assert.equal(releaseStatus('other', '0.0.1', tags), 'new')
  assert.throws(() => releaseStatus('memory', '0.0.9', tags), /older than released memory@0.1.0/)
})

test('reads plugin names from the marketplace and versions from each plugin', () => {
  const dir = mkdtempSync(join(tmpdir(), 'release-version-'))
  writeFileSync(join(dir, 'marketplace.json'), JSON.stringify({ plugins: [{ name: 'jira' }, { name: 'memory' }] }))
  const write = (name, host, version) => {
    mkdirSync(join(dir, name, host), { recursive: true })
    writeFileSync(join(dir, name, host, 'plugin.json'), JSON.stringify({ name, version }))
  }
  write('memory', '.claude-plugin', '0.1.0')
  write('memory', '.codex-plugin', '0.1.0')
  assert.deepEqual(pluginNames(join(dir, 'marketplace.json')), ['jira', 'memory'])
  assert.equal(pluginVersion('memory', dir), '0.1.0')
  write('memory', '.codex-plugin', '0.1.1')
  assert.throws(() => pluginVersion('memory', dir), /versions differ/)
})
