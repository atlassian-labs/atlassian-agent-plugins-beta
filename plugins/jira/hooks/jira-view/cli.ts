import type { Engine } from './shared';
import type { Item } from './types';

export async function runCli($: Engine, args: readonly string[]) {
  return $.process.run(['node', `${$.plugin.root}/bin/jira-cli.mjs`, ...args], {
    timeoutMs: 120_000,
  });
}

export function firstLine(text: string): string {
  const line = text.trim().split('\n')[0] ?? '';
  return line.length > 160 ? `${line.slice(0, 157)}...` : line;
}

/** A verdict as the CLI prints one on stdout; a `fail` exits 0 with its reasons here. */
export type Verdict = {
  status: 'pass' | 'warn' | 'fail';
  reasons: { code: string; detail: string }[];
  item?: Item | null;
};

/**
 * Why a refresh the CLI ran did not read: its non-zero exit, or its printed
 * verdict where that is `fail`, or `warn` too when `warnFails` (an epic
 * refresh names one key, so its `warn` is that key failing). `undefined`
 * where it read. A verdict exits 0, so the exit code alone says nothing.
 */
export function refreshFailure(
  ran: { exitCode: number; stdout: string; stderr: string },
  warnFails: boolean,
): string | undefined {
  if (ran.exitCode !== 0) return firstLine(ran.stderr || ran.stdout || `exit ${ran.exitCode}`);
  let printed: Item | Verdict;
  try {
    printed = JSON.parse(ran.stdout) as Item | Verdict;
  } catch {
    return undefined;
  }
  if (!isVerdict(printed) || printed.status === 'pass') return undefined;
  if (printed.status === 'warn' && !warnFails) return undefined;
  return firstLine(printed.reasons.map((reason) => reason.detail).join(' ') || printed.status);
}

/** An item's `status` is an object; a verdict's is a string. */
export function isVerdict(printed: Item | Verdict): printed is Verdict {
  return typeof printed.status === 'string';
}
