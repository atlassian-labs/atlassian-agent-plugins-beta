#!/usr/bin/env node
// Runs every *.test.mjs under the plugin, and exits 0 when there are none.
//
// The scaffold ships no tests yet, and `node --test <glob>` fails on a glob that matches
// nothing — which would make CI red for a repository that is simply empty rather than
// broken. Discover first, then delegate to the real test runner.

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_DIRS = new Set(['node_modules', '.git'])

function findTests(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      found.push(...findTests(join(dir, entry.name)))
    } else if (entry.name.endsWith('.test.mjs')) {
      found.push(join(dir, entry.name))
    }
  }
  return found
}

const tests = findTests(pluginRoot)
  .map((file) => relative(pluginRoot, file))
  .sort()

if (tests.length === 0) {
  console.log('No *.test.mjs files found under plugins/jira — nothing to run.')
  process.exit(0)
}

const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: pluginRoot, stdio: 'inherit' })
process.exit(result.status ?? 1)
