import type { EpicChild, EpicRow, EpicTouch, Item } from './types';

/** The item's browse link: on the site that answered, else the listed epic's site. */
export function itemUrl(item: Item, list: readonly EpicRow[]): string | undefined {
  if (item.site) return `${item.site.replace(/\/$/, '')}/browse/${item.key}`;
  const epic = list.find(
    (row) => row.key === item.key || row.children.some((c) => c.key === item.key),
  );
  return epic ? childUrl(epic, item.key) : undefined;
}

export function latestTouch(
  epic: EpicTouch & { codebases: Record<string, EpicTouch> },
  scope: string | null,
): string | undefined {
  const touch = scope === null ? epic : (epic.codebases[scope] ?? epic);
  const times = [touch.lastWrittenAt, touch.lastAccessedAt].filter(
    (t): t is string => t !== undefined,
  );
  return times.sort().at(-1);
}

export function categoryOf(status: { statusCategory?: { key: string } } | undefined): string {
  return status?.statusCategory?.key ?? 'new';
}

type Marker = { glyph: string; color: 'subtle' | 'warning' | 'success' };
const NEW_MARKER: Marker = { glyph: '○', color: 'subtle' };
const MARKER: Record<string, Marker> = {
  new: NEW_MARKER,
  indeterminate: { glyph: '◐', color: 'warning' },
  done: { glyph: '●', color: 'success' },
};

export function marker(category: string): Marker {
  return MARKER[category] ?? NEW_MARKER;
}

export function doneCount(children: readonly EpicChild[]): number {
  return children.filter((child) => categoryOf(child.status) === 'done').length;
}

export function firstName(assignee: EpicChild['assignee']): string {
  const name = assignee?.displayName?.trim();
  return name ? (name.split(/\s+/)[0] ?? name) : 'none';
}

export function fit(text: string, width: number): string {
  if (width <= 0) return '';
  if (text.length <= width) return text;
  return width <= 3 ? text.slice(0, width) : `${text.slice(0, width - 3)}...`;
}

export function shortCodebase(id: string): string {
  const parts = id.split('/');
  return parts.length >= 3 ? parts.slice(-2).join('/') : id;
}

/** True when a blocker of the child inside the epic is not yet done. */
export function isBlocked(child: EpicChild, byKey: Map<string, EpicChild>): boolean {
  return (child.blockedBy ?? []).some((b) => {
    const blocker = byKey.get(b);
    return blocker !== undefined && categoryOf(blocker.status) !== 'done';
  });
}

/** The child's browse link, from the epic's: same site, its own key. */
export function childUrl(epic: EpicRow, key: string): string | undefined {
  return epic.url ? epic.url.replace(epic.key, key) : undefined;
}

/** The Archive button's label: its action, or the one in flight. */
export function archiveLabel(inFlight: boolean, archived: boolean): string {
  if (inFlight) return archived ? 'Unarchiving...' : 'Archiving...';
  return archived ? 'Unarchive' : 'Archive';
}

/**
 * A work item's page in Jira: from the listed epic that holds it, else on the site every listed epic
 * shares. Undefined where no epic is listed or the listed epics span more than one site, as a recent
 * item carries no site of its own and a guess could point at the wrong one.
 */
export function browseLink(key: string, list: readonly EpicRow[]): string | undefined {
  const holder = list.find((row) => row.key === key || row.children.some((c) => c.key === key));
  const held = holder ? childUrl(holder, key) : undefined;
  if (held !== undefined) return held;
  const origins = new Set(
    list.flatMap((row) => {
      const found = /^(https?:\/\/[^/]+)\//.exec(row.url ?? '')?.[1];
      return found === undefined ? [] : [found];
    }),
  );
  if (origins.size !== 1) return undefined;
  return `${[...origins][0]}/browse/${key}`;
}
