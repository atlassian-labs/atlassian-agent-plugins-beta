import type { EngineInterface } from 'claude-code';

import type { ItemView, View } from './types';

export const PANE = 'jira-view';
/** Rows the header takes: the Settings, Guide and theme row, and its margin. */
export const HEADER_ROWS = 2;
/** Rows the view tabs take: the one row, with no margin. */
export const TABS_ROWS = 1;
export const LIST_LIMIT = '50';
/** A Jira issue key, as `/jira-view KEY-1` takes one. */
export const ISSUE_KEY = /^[A-Z][A-Z0-9_]*-\d+$/i;

/** The store key the last list tab chosen is kept under, across sessions. */
export const TAB_KEY = 'tab';

/** The store key the chosen colour mode is kept under, across sessions. */
export const THEME_KEY = 'theme';

/** Set once the pane has opened for the first time: from then on it opens on the list, not the Guide. */
export const GUIDE_SEEN_KEY = 'guideSeen';

/** One store key per setting, kept across sessions as the theme is. */
export const SETTING_KEYS = {
  openAtStart: 'openAtStart',
  showEpicsTab: 'showEpicsTab',
  showRecentWorkTab: 'showRecentWorkTab',
} as const;

/** What a setting reads as where the store holds nothing, or not a boolean. */
export const SETTING_DEFAULTS = {
  openAtStart: false,
  showEpicsTab: true,
  showRecentWorkTab: true,
} as const;

/** Every setting from the store, defaults filled in: the one place a setting is read back. */
export async function loadSettings($: Engine) {
  const stored = async (name: keyof typeof SETTING_KEYS): Promise<boolean> => {
    const value = await $.store.get(SETTING_KEYS[name]);
    return typeof value === 'boolean' ? value : SETTING_DEFAULTS[name];
  };
  const openAtStart = await stored('openAtStart');
  const epicsShown = await stored('showEpicsTab');
  const recent = await stored('showRecentWorkTab');
  // Both hidden reads as both shown: the pane never has zero lists.
  const anyList = epicsShown || recent;
  return {
    openAtStart,
    showEpicsTab: anyList ? epicsShown : true,
    showRecentWorkTab: anyList ? recent : true,
  };
}

/** The view the pane opens on, until a first-ever open or a kept tab picks another. */
export const DEFAULT_VIEW: View = 'recent';

/** Whether the list includes the archived epics before the user asks for them. */
export const SHOW_ARCHIVED_DEFAULT = false;

/** The item view before any item is asked for. */
export const NO_ITEM: ItemView = {
  key: null,
  item: null,
  loadedAt: null,
  error: null,
  isLoading: false,
};

export type Engine = EngineInterface;
