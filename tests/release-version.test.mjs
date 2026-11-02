import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareVersions, parseVersion, releaseStatus, requireVersionBump } from '../scripts/release-version.mjs'

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
  assert.equal(releaseStatus('0.19.1', []), 'new')
  assert.equal(releaseStatus('0.19.1', ['jira@0.19.0']), 'new')
  assert.equal(releaseStatus('0.19.1', ['jira@0.19.1']), 'existing')
  assert.throws(() => releaseStatus('0.19.0', ['jira@0.19.1']), /older than released/)
})

test('requires a higher version when plugin content changes', () => {
  assert.doesNotThrow(() => requireVersionBump('0.19.0', '0.19.1', true))
  assert.doesNotThrow(() => requireVersionBump('0.19.1', '0.19.1', false))
  assert.throws(() => requireVersionBump('0.19.1', '0.19.1', true), /without a version increase/)
  assert.throws(() => requireVersionBump('0.19.1', '0.19.0', true), /without a version increase/)
})
