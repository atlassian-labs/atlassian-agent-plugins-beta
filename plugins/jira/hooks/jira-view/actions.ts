import { atom, read, update } from 'claude-code';
import type { EngineInterface } from 'claude-code';

import { firstLine, isVerdict, refreshFailure, reportPane, runCli } from './cli';
import type { Verdict } from './cli';
import { DEFAULT_THEME, otherTheme } from './palette';
import { isDone, latestTouch } from './format';
import {
  DEFAULT_VIEW,
  GUIDE_SEEN_KEY,
  FOOTER_BUTTONS,
  HIDE_DONE_KEY,
  LIST_LIMIT,
  NO_ITEM,
  PANE,
  SETTING_DEFAULTS,
  SHOW_ARCHIVED_DEFAULT,
  TAB_KEY,
  THEME_KEY,
  footerKey,
} from './shared';
import type { Engine } from './shared';
import type {
  EpicRow,
  Filter,
  Item,
  ItemView,
  ListNotice,
  Listing,
  RecentGroup,
  RecentListing,
  Theme,
  View,
} from './types';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const codebase = atom({ plugin: 'jira', key: 'codebase' } as const, '');
const filter = atom({ plugin: 'jira', key: 'filter' } as const, 'codebase' as Filter);
const view = atom({ plugin: 'jira', key: 'view' } as const, DEFAULT_VIEW);
const recent = atom({ plugin: 'jira', key: 'recent' } as const, [] as RecentGroup[]);
const tabPicked = atom({ plugin: 'jira', key: 'tabPicked' } as const, false);
const showArchived = atom({ plugin: 'jira', key: 'showArchived' } as const, SHOW_ARCHIVED_DEFAULT);
const hideDone = atom({ plugin: 'jira', key: 'hideDone' } as const, false);
const ring = atom({ plugin: 'jira', key: 'ring' } as const, null as string | null);
const rowsEpoch = atom({ plugin: 'jira', key: 'rowsEpoch' } as const, 0);
const listNotice = atom({ plugin: 'jira', key: 'listNotice' } as const, null as ListNotice | null);
const theme = atom({ plugin: 'jira', key: 'theme' } as const, DEFAULT_THEME as Theme);
const showEpicsTab = atom(
  { plugin: 'jira', key: 'showEpicsTab' } as const,
  SETTING_DEFAULTS.showEpicsTab,
);
const showRecentWorkTab = atom(
  { plugin: 'jira', key: 'showRecentWorkTab' } as const,
  SETTING_DEFAULTS.showRecentWorkTab,
);
const reviewBeforePublishing = atom(
  { plugin: 'jira', key: 'reviewBeforePublishing' } as const,
  true,
);
const settingsNotice = atom(
  { plugin: 'jira', key: 'settingsNotice' } as const,
  null as string | null,
);
const isLoading = atom({ plugin: 'jira', key: 'isLoading' } as const, false);
const busyKey = atom({ plugin: 'jira', key: 'busyKey' } as const, null as string | null);
const archivingKey = atom({ plugin: 'jira', key: 'archivingKey' } as const, null as string | null);
const lastError = atom({ plugin: 'jira', key: 'lastError' } as const, null as string | null);
const lastListedAt = atom({ plugin: 'jira', key: 'lastListedAt' } as const, null as string | null);
const graphEpic = atom({ plugin: 'jira', key: 'graphEpic' } as const, null as string | null);
const selected = atom({ plugin: 'jira', key: 'selected' } as const, null as string | null);
const itemView = atom({ plugin: 'jira', key: 'item' } as const, NO_ITEM);
const itemComments = atom({ plugin: 'jira', key: 'itemComments' } as const, false);

/** Re-reads the store through `epic list`. The only way the pane's list changes. */
export async function refreshList($: Engine): Promise<void> {
  await update($, isLoading, () => true);
  const current = await read($, filter);
  const withArchived = await read($, showArchived);
  const withoutDone = await read($, hideDone);
  const args = [
    'epic',
    'list',
    '--limit',
    LIST_LIMIT,
    ...(current === 'all' ? ['--all'] : []),
    ...(withArchived ? ['--show-archived'] : []),
    // Left out by the CLI, ahead of its limit, so a hidden row never takes a place in the list.
    ...(withoutDone ? ['--hide-done'] : []),
  ];
  try {
    // The two stores are independent: each listing that succeeds is applied, and only a failure is reported.
    const [epicRan, recentRan] = await Promise.all([
      runCli($, args),
      runCli($, ['recent', 'list', ...args.slice(2)]),
    ]);
    const failures: string[] = [];
    let listing: Listing | undefined;
    let recentListing: RecentListing | undefined;
    if (epicRan.exitCode !== 0) {
      failures.push(firstLine(epicRan.stderr || epicRan.stdout || `exit ${epicRan.exitCode}`));
    } else {
      listing = JSON.parse(epicRan.stdout) as Listing;
    }
    if (recentRan.exitCode !== 0) {
      failures.push(
        firstLine(recentRan.stderr || recentRan.stdout || `exit ${recentRan.exitCode}`),
      );
    } else {
      recentListing = JSON.parse(recentRan.stdout) as RecentListing;
    }
    if (listing !== undefined) {
      await update($, epics, () => listing.epics ?? []);
      await update($, codebase, () => listing.codebase ?? '');
    }
    if (recentListing !== undefined) await update($, recent, () => recentListing.groups ?? []);
    if (listing !== undefined || recentListing !== undefined) {
      await update($, lastListedAt, () => new Date().toISOString());
    }
    await update($, lastError, () => failures[0] ?? null);
    // A first-ever open starts on the list tab holding the latest touch, once; only when both listings read.
    if (listing !== undefined && recentListing !== undefined && !(await read($, tabPicked))) {
      const scope = current === 'all' ? null : listing.codebase;
      const newest = (touches: Array<string | undefined>) => touches.filter(Boolean).sort().at(-1);
      const epicTouch = newest((listing.epics ?? []).map((e) => latestTouch(e, scope)));
      const recentTouch = newest(
        (recentListing.groups ?? []).flatMap((g) => g.items.map((i) => latestTouch(i, scope))),
      );
      if (epicTouch !== undefined || recentTouch !== undefined) {
        await update($, tabPicked, () => true);
        const epicsShown = await read($, showEpicsTab);
        const recentShown = await read($, showRecentWorkTab);
        const epicsNewest =
          epicTouch !== undefined && (recentTouch === undefined || epicTouch >= recentTouch);
        await update($, view, () =>
          epicsShown && (epicsNewest || !recentShown) ? 'list' : 'recent',
        );
      }
    }
  } catch (error) {
    await update($, lastError, () =>
      firstLine(error instanceof Error ? error.message : String(error)),
    );
  } finally {
    await update($, isLoading, () => false);
  }
  // Not waited on: on a view with no footer the key is never drawn, and the focus takes seconds to answer `{ deny }`.
  void keepRing($);
}

/** `epic refresh --key` then a re-list. The only path that reaches Jira. */
export async function refreshEpic($: Engine, key: string): Promise<void> {
  await update($, busyKey, () => key);
  try {
    const ran = await runCli($, ['epic', 'refresh', '--key', key]);
    const failure = refreshFailure(ran, true);
    $.ui.toast(failure !== undefined ? `Refresh of ${key} failed: ${failure}` : `Refreshed ${key}`);
  } finally {
    await update($, busyKey, () => null);
  }
  await refreshList($);
}

/** `refresh --key` of a recent item: `work-item get --refresh` into the plugin scope, then a re-list. */
export async function refreshRecentItem($: Engine, key: string): Promise<void> {
  await update($, busyKey, () => key);
  try {
    const ran = await runCli($, [
      'work-item',
      'get',
      '--key',
      key,
      '--scope',
      'plugin',
      '--refresh',
    ]);
    const failure = refreshFailure(ran, false);
    $.ui.toast(failure !== undefined ? `Refresh of ${key} failed: ${failure}` : `Refreshed ${key}`);
  } finally {
    await update($, busyKey, () => null);
  }
  await refreshList($);
}

/** `<noun> archive --key` (with `--undo` to restore), then a re-list; the outcome is the list's notice. */
export async function archiveItem(
  $: Engine,
  noun: 'epic' | 'recent',
  key: string,
  undo: boolean,
): Promise<void> {
  await update($, listNotice, () => null);
  await update($, archivingKey, () => key);
  try {
    const ran = await runCli($, [noun, 'archive', '--key', key, ...(undo ? ['--undo'] : [])]);
    const failed = ran.exitCode !== 0;
    await update($, listNotice, () => ({
      failed,
      text: failed
        ? `${undo ? 'Unarchive' : 'Archive'} of ${key} failed: ${firstLine(ran.stderr || ran.stdout)}`
        : `${undo ? 'Unarchived' : 'Archived'} ${key}.`,
    }));
  } finally {
    await update($, archivingKey, () => null);
  }
  await refreshList($);
}

/**
 * Puts the focus ring back on the footer button it was on before rows above it came or went:
 * the engine keeps the ring's place in the tab order, not its element, so a change to the rows
 * leaves the ring that many stops along. Call it once the rows are written. It moves the epoch
 * the footer buttons are keyed by, which a drawing reads before it reads the rows, so the key
 * asked for is one only a drawing of the new rows brings, and the engine holds the focus until
 * that drawing. A focus on the key already drawn would be undone by the redraw to come.
 */
async function keepRing($: Engine): Promise<void> {
  const held = (await read($, ring))?.split(':')[0];
  const name = FOOTER_BUTTONS.find((button) => button === held);
  if (name === undefined) return;
  await update($, rowsEpoch, (cur) => cur + 1);
  // Read back, not taken from the bump: where two changes overlap, both ask for the newest key, the only one a drawing is sure to bring.
  try {
    await $.ui.focus({ requestId: PANE, key: footerKey(name, await read($, rowsEpoch)) });
  } catch {
    // Best effort: the wait for the key is bounded, and a shut pane or a view with no footer never draws it.
  }
}

/**
 * Flips whether Done rows are listed, keeps the choice for the next session, and re-lists.
 * Hiding drops the done rows held at once, so the press shows before the CLI answers; showing
 * waits for the re-list, since the pane no longer holds the rows to bring back.
 */
export async function toggleHideDone($: Engine): Promise<void> {
  await update($, hideDone, (cur) => !cur);
  const hidden = await read($, hideDone);
  if (hidden) {
    await update($, epics, (cur) => cur.filter((epic) => !isDone(epic)));
    await update($, recent, (cur) =>
      cur
        .map((group) => ({ ...group, items: group.items.filter((item) => !isDone(item)) }))
        .filter((group) => group.items.length > 0),
    );
  }
  await $.store.set(HIDE_DONE_KEY, hidden);
  // Rows go or come twice: with the press, and again when the re-list answers and keeps the ring itself.
  void refreshList($);
  await keepRing($);
}

/**
 * Reads the stored review choices through the CLI, the one place they live. The
 * toggle is on only where both bodies are still reviewed, so a mix set by
 * command reads as off.
 */
export async function loadReviewPreference($: Engine): Promise<void> {
  try {
    const ran = await runCli($, ['changes', 'review-preference']);
    if (ran.exitCode !== 0) {
      await update(
        $,
        settingsNotice,
        () => `Could not read the review setting: ${firstLine(ran.stderr || ran.stdout)}`,
      );
      return;
    }
    const { preferences } = JSON.parse(ran.stdout) as {
      preferences?: { comment?: string; pullRequest?: string };
    };
    const reviewed = preferences?.comment === 'ask' && preferences?.pullRequest === 'ask';
    await update($, reviewBeforePublishing, () => reviewed);
  } catch (error) {
    // Both callers drop the promise, so a throw would be an unhandled rejection with no word to the user.
    await update(
      $,
      settingsNotice,
      () =>
        `Could not read the review setting: ${firstLine(error instanceof Error ? error.message : String(error))}`,
    );
  }
}

/** From on both bodies go to skip, from off both go to ask; a failure says so and shows what is stored. */
export async function toggleReviewPreference($: Engine): Promise<void> {
  await update($, settingsNotice, () => null);
  const next = (await read($, reviewBeforePublishing)) ? 'skip' : 'ask';
  let failure: string | undefined;
  try {
    for (const body of ['comment', 'pull-request']) {
      const ran = await runCli($, ['changes', 'review-preference', body, next]);
      if (ran.exitCode !== 0) {
        failure = firstLine(ran.stderr || ran.stdout);
        break;
      }
    }
  } catch (error) {
    failure = firstLine(error instanceof Error ? error.message : String(error));
  }
  if (failure === undefined) {
    await update($, reviewBeforePublishing, () => next === 'ask');
    reportPaneSetting($, 'reviewBeforePublishing', next === 'ask' ? 'on' : 'off');
    return;
  }
  await loadReviewPreference($);
  await update($, settingsNotice, () => `Could not change the review setting: ${failure}`);
}

/** Switches the tab and counts it as the person's choice; the two list tabs are kept for the next session. */
export async function selectTab($: Engine, which: View): Promise<void> {
  await update($, tabPicked, () => true);
  await update($, view, () => which);
  // The notice speaks of the list it was raised on, and the two lists share it.
  await update($, listNotice, () => null);
  if (which === 'recent' || which === 'list') await $.store.set(TAB_KEY, which);
  if (which === 'settings') void loadReviewPreference($);
  reportPane($, ['tab-selected', '--pane-tab', paneTabOf(which)]);
}

/** The tab's name in analytics: the Epics tab's view is called `list`. */
function paneTabOf(which: View): string {
  return which === 'list' ? 'epics' : which;
}

/**
 * Reports that the pane was opened, and on which tab; call it once the first-open rule has chosen the view.
 * `paneTab` names the tab where the caller is about to switch to it, as opening a work item does: the view
 * is read now, before that switch has run.
 */
export async function reportPaneOpened(
  $: Engine,
  source: 'command' | 'command-with-key' | 'session-start',
  firstOpen: boolean,
  paneTab?: string,
): Promise<void> {
  reportPane($, [
    'opened',
    '--open-source',
    source,
    ...(firstOpen ? ['--first-open'] : []),
    '--pane-tab',
    paneTab ?? paneTabOf(await read($, view)),
  ]);
}

/** Reports a Settings row changed to `value`. */
export function reportPaneSetting($: Engine, name: string, value: 'on' | 'off' | Theme): void {
  reportPane($, ['setting-changed', '--setting-name', name, '--setting-value', value]);
}

/**
 * Points the graph view at `key` and switches to it, with `select` the
 * selected node; absent, a selection in another epic is cleared.
 */
export async function openGraph($: Engine, key: string, select?: string): Promise<void> {
  const current = await read($, graphEpic);
  if (select !== undefined) await update($, selected, () => select);
  else if (current !== key) await update($, selected, () => null);
  await update($, graphEpic, () => key);
  await update($, view, () => 'graph');
}

/**
 * Reads `key` from Jira into the item pane: `work-item get --refresh` into
 * the plugin scope, so the record is live, and so the read is not the
 * session's link to the item as a session-scope read would be. The view
 * keeps the item it had while the read runs. With `show`, the pane switches
 * to the item view first, so the person watches the read.
 */
export async function readItem($: Engine, key: string, show = false): Promise<void> {
  await update($, itemView, (cur) => {
    const same = cur.key === key;
    return {
      key,
      item: same ? cur.item : null,
      loadedAt: same ? cur.loadedAt : null,
      error: null,
      isLoading: true,
    };
  });
  if (show) await update($, view, () => 'item');

  let read: Partial<ItemView>;
  try {
    const ran = await runCli($, [
      'work-item',
      'get',
      '--key',
      key,
      '--scope',
      'plugin',
      '--refresh',
    ]);
    if (ran.exitCode !== 0) {
      read = { error: firstLine(ran.stderr || ran.stdout || `exit ${ran.exitCode}`) };
    } else {
      const printed = JSON.parse(ran.stdout) as Item | Verdict;
      // A `warn` verdict carries the item it read beside its reasons.
      const item = !isVerdict(printed)
        ? printed
        : printed.status === 'fail'
          ? null
          : (printed.item ?? null);
      read =
        item === null
          ? {
              error:
                (isVerdict(printed) ? printed.reasons.map((r) => r.detail).join(' ') : '') ||
                'The read printed no item.',
            }
          : { item, loadedAt: new Date().toISOString(), error: null };
    }
  } catch (error) {
    read = { error: firstLine(error instanceof Error ? error.message : String(error)) };
  }
  // A later read of another key owns the pane by now.
  await update($, itemView, (cur) =>
    cur.key === key ? { ...cur, ...read, isLoading: false } : cur,
  );
  // A read that landed has rewritten the item's rows in the epic and recent stores; the lists hold the old ones.
  if (read.error === null) void refreshList($);
}

/** Points the item view at `key`, switches to it, and reads the item from Jira. */
export async function openItem($: Engine, key: string): Promise<void> {
  const current = await read($, itemView);
  if (current.key !== key) await update($, itemComments, () => false);
  await readItem($, key, true);
}

export function isJiraCommand(command: unknown): boolean {
  return (
    typeof command === 'string' &&
    (command.includes('jira-cli.mjs') || command.includes('twg jira'))
  );
}

/** Switches the pane to the other colour mode and keeps the choice. */
export async function toggleTheme($: EngineInterface): Promise<void> {
  const next = otherTheme(await read($, theme));
  await update($, theme, () => next);
  await $.store.set(THEME_KEY, next);
  reportPaneSetting($, 'theme', next);
}

/**
 * Opens the pane with the surface's own fill dropped: the engine's backdrop around the body
 * follows the engine's theme, not the pane's colour toggle, so the terminal shows through.
 */
export async function openPane($: EngineInterface, focus: boolean): Promise<void> {
  const backgroundColor = 'transparent';
  await $.ui.open(
    focus
      ? { id: PANE, title: 'Jira', focus, backgroundColor }
      : { id: PANE, title: 'Jira', backgroundColor },
  );
}

/** On the first open the pane has ever had, points it at the Guide and records that it has been shown; true where it did. */
export async function showGuideOnFirstOpen($: Engine): Promise<boolean> {
  if ((await $.store.get(GUIDE_SEEN_KEY)) === true) return false;
  // The Guide is the pane's first pick, so the first list tab is not chosen over it.
  await update($, tabPicked, () => true);
  await update($, view, () => 'guide');
  await $.store.set(GUIDE_SEEN_KEY, true);
  return true;
}
