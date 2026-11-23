import { atom, read, update } from 'claude-code';
import type { Register } from 'claude-code';

import {
  isJiraCommand,
  openItem,
  openPane,
  refreshList,
  reportPaneOpened,
  showGuideOnFirstOpen,
} from './actions';
import { buildViewContext } from './chrome';
import { DEFAULT_THEME, isTheme } from './palette';
import {
  DEFAULT_VIEW,
  HIDE_DONE_KEY,
  ISSUE_KEY,
  PANE,
  SETTING_DEFAULTS,
  TAB_KEY,
  THEME_KEY,
  loadSettings,
} from './shared';
import type { Filter, Theme, View } from './types';
import { drawGraph } from './views/graph';
import { drawGuide } from './views/guide';
import { drawItem } from './views/item';
import { drawList } from './views/list';
import { drawRecent } from './views/recent';
import { drawSettings } from './views/settings';
import { markTurnRunning, sendHeld } from './workon';

const filter = atom({ plugin: 'jira', key: 'filter' } as const, 'codebase' as Filter);
const view = atom({ plugin: 'jira', key: 'view' } as const, DEFAULT_VIEW);
const scroll = atom(
  { plugin: 'jira', key: 'scroll' } as const,
  { view: 'list', offset: 0 } as { view: View; offset: number },
);
const theme = atom({ plugin: 'jira', key: 'theme' } as const, DEFAULT_THEME as Theme);
const tabPicked = atom({ plugin: 'jira', key: 'tabPicked' } as const, false);
const hideDone = atom({ plugin: 'jira', key: 'hideDone' } as const, false);
const ring = atom({ plugin: 'jira', key: 'ring' } as const, null as string | null);
const openAtStart = atom(
  { plugin: 'jira', key: 'openAtStart' } as const,
  SETTING_DEFAULTS.openAtStart,
);
const showEpicsTab = atom(
  { plugin: 'jira', key: 'showEpicsTab' } as const,
  SETTING_DEFAULTS.showEpicsTab,
);
const showRecentWorkTab = atom(
  { plugin: 'jira', key: 'showRecentWorkTab' } as const,
  SETTING_DEFAULTS.showRecentWorkTab,
);

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'jira-view',
      description:
        'Show the Jira work this repo has touched, in a pane; /jira-view KEY-1 shows one work item',
    });
    const stored = await $.store.get(THEME_KEY);
    if (isTheme(stored)) await update($, theme, () => stored);
    const tab = await $.store.get(TAB_KEY);
    if (tab === 'recent' || tab === 'list') {
      await update($, view, () => tab);
      await update($, tabPicked, () => true);
    }
    if ((await $.store.get(HIDE_DONE_KEY)) === true) await update($, hideDone, () => true);
    const settings = await loadSettings($);
    await update($, openAtStart, () => settings.openAtStart);
    await update($, showEpicsTab, () => settings.showEpicsTab);
    await update($, showRecentWorkTab, () => settings.showRecentWorkTab);
    // A closed pane has nothing to show a list or the Guide to; the first `/jira-view` does both.
    if (settings.openAtStart) {
      const firstOpen = await showGuideOnFirstOpen($);
      void refreshList($);
      void openPane($, false);
      void reportPaneOpened($, 'session-start', firstOpen);
    }
    return next(e);
  });

  on('command.run', { command: 'jira-view' }, async ($, e) => {
    const arg = e.args.trim();
    if (ISSUE_KEY.test(arg)) {
      const key = arg.toUpperCase();
      await openPane($, true);
      void reportPaneOpened($, 'command-with-key', false, 'item');
      void openItem($, key);
      return { text: `Reading ${key} into the Jira pane.` };
    }
    if (arg === 'all') await update($, filter, () => 'all');
    const firstOpen = await showGuideOnFirstOpen($);
    await openPane($, true);
    void reportPaneOpened($, 'command', firstOpen);
    void refreshList($);
    return { text: 'Jira pane opened.' };
  });

  // Only the main loop's turns count: a subagent's run does not make the session busy to a prompt.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await markTurnRunning($, true);
    return next(e);
  });

  on('turn.complete', async ($, e, next) => {
    const done = await next(e);
    if (e.agentId === undefined) void sendHeld($, e.isAborted);
    return done;
  });

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e);
    if (isJiraCommand(e.command)) void refreshList($);
    return ran;
  });

  // Kept so a change to the rows can put the ring back on the footer button it was on: see `keepRing`.
  on('ui.focus', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const moved = await next(e);
    if (moved.deny === undefined) await update($, ring, () => e.element ?? null);
    return moved;
  });

  // The pane's tree is as tall as its window, so the engine has nothing to scroll: the wheel and
  // the scroll keys arrive here, and the body is moved by the offset kept. Past the end is blank.
  on('ui.scroll', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const current = await read($, view);
    await update($, scroll, (held) => ({
      view: current,
      offset: Math.max(0, (held.view === current ? held.offset : 0) + e.by),
    }));
    return next(e);
  });

  // The one pane. Its views are tabs of our own drawing, switched by
  // the `view` value, not panes of the engine's: the engine shows a pane
  // opened from a press in another only under rules of its own, and places
  // one reopened below 110 columns not at all, so one pane it is.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ctx = await buildViewContext($, $.ui.resolve(e), e.surface, {
      bodyColumns: e.props.bodyColumns,
      viewportRows: e.viewport?.rows,
      bodyRows: e.props.scroll?.bodyRows,
    });
    // Recent work and Epics frame themselves: their own footer buttons must sit outside the
    // clipped, scrollable body, which only `frame`'s caller can arrange.
    if (ctx.current === 'recent') return drawRecent($, ctx);
    if (ctx.current === 'list') return drawList($, ctx);
    return ctx.frame(
      ctx.current === 'graph'
        ? await drawGraph($, ctx)
        : ctx.current === 'item'
          ? await drawItem($, ctx)
          : ctx.current === 'settings'
            ? await drawSettings($, ctx)
            : await drawGuide($, ctx),
    );
  });
};
