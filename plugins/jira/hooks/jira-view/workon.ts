import { atom, read, update } from 'claude-code';

import type { Engine } from './shared';
import type { WorkOn } from './types';

const workOn = atom({ plugin: 'jira', key: 'workOn' } as const, null as WorkOn | null);
const isTurnRunning = atom({ plugin: 'jira', key: 'isTurnRunning' } as const, false);

export function readWorkOn($: Engine) {
  return read($, workOn);
}

/** True while a press is being decided, so a second one is ignored, not raced. */
let isPressing = false;

const instruction = (key: string) => `Work on ${key}`;

/** Submit a key whose slot is already marked `sending`, and clear the slot once the call settles. */
async function submitKey($: Engine, key: string): Promise<void> {
  try {
    await $.prompt.submit({ text: instruction(key), asUser: true });
  } catch {
    $.ui.toast(`Could not send "${instruction(key)}" to the agent.`);
  } finally {
    // `submit` resolves as the turn starts; whether it started or failed, nothing is pending.
    await update($, workOn, (held) => (held?.key === key ? null : held));
  }
}

/**
 * The Work on press. An idle session takes the instruction at once. A running turn would
 * not fold a plugin's prompt in, so the key is held here and sent when that turn completes;
 * pressing again before then cancels it. A press while one is being sent does nothing.
 */
export async function pressWorkOn($: Engine, key: string): Promise<void> {
  // Set before the first await, so two quick presses cannot both read an empty slot.
  if (isPressing) return;
  isPressing = true;
  try {
    const held = await read($, workOn);
    if (held?.stage === 'sending') return;
    if (held !== null) {
      await update($, workOn, () => null);
    } else if (await read($, isTurnRunning)) {
      await update($, workOn, () => ({ key, stage: 'queued' }));
    } else {
      await update($, workOn, () => ({ key, stage: 'sending' }));
      await submitKey($, key);
    }
  } finally {
    isPressing = false;
  }
}

export function markTurnRunning($: Engine, running: boolean) {
  return update($, isTurnRunning, () => running);
}

/**
 * The main loop's turn ended: send what was held for it, unless it was cancelled meanwhile.
 * A turn the person stopped drops the held key, since they have just asked the agent to stop.
 */
export async function sendHeld($: Engine, isAborted: boolean): Promise<void> {
  await markTurnRunning($, false);
  // The slot is claimed inside one update: a cancel pressed since the key was queued has
  // already emptied it, and must not be overwritten by a read taken before that.
  const claim = { key: null as string | null };
  await update($, workOn, (held) => {
    if (held?.stage !== 'queued') return held;
    claim.key = held.key;
    return isAborted ? null : { key: held.key, stage: 'sending' as const };
  });
  if (claim.key !== null && !isAborted) await submitKey($, claim.key);
}
