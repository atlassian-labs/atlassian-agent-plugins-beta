import type { Theme } from './types';

/**
 * The pane's colours, one set per mode, chosen by the toggle in the tab row
 * and kept in the plugin store. Raw hex, not the engine's theme keys: those
 * follow the engine's theme setting, which under `auto` is its own guess at
 * the terminal's background, a guess the pane can neither read nor correct.
 * The engine's chrome (a button's brackets, a hotkey's accent, Markdown and
 * links) still follows its theme; the pane's own text and backdrop do not.
 */
export type Palette = {
  /** The body's backdrop; the root Box fills the pane with it. */
  background: string;
  /** Plain text. */
  text: string;
  /** Secondary text: stamps, hints, labels, summaries beside a key. */
  dim: string;
  /** The status mark of an item not yet started. */
  subtle: string;
  /** The status mark of an item in progress. */
  warning: string;
  /** The status mark of a done item. */
  success: string;
  /** A blocked item, a failure, a cycle. */
  error: string;
  /** The selected node's unfinished blockers and the edges from them. */
  upstream: string;
  /** The items the selected node blocks and the edges to them. */
  downstream: string;
  /** Inline code, code blocks and links in a description or comment. */
  accent: string;
};

export const PALETTES: Record<Theme, Palette> = {
  dark: {
    background: '#1c1c1e',
    text: '#e6e6e6',
    dim: '#8f8f94',
    subtle: '#6e6e73',
    warning: '#e3b341',
    success: '#5fc27e',
    error: '#f0716f',
    upstream: '#f0883e',
    downstream: '#d26ad6',
    accent: '#6cb6ff',
  },
  light: {
    background: '#f4f4f5',
    text: '#1f1f23',
    dim: '#6b6b70',
    subtle: '#9a9aa0',
    warning: '#b26a00',
    success: '#2e7d32',
    error: '#c62828',
    upstream: '#c2410c',
    downstream: '#a21caf',
    accent: '#0b5cad',
  },
};

/** The mode before the person has chosen one. */
export const DEFAULT_THEME: Theme = 'dark';

/** The other mode: what the toggle switches to. */
export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** True for a stored value that names a mode; an older or foreign value reads as none. */
export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}
