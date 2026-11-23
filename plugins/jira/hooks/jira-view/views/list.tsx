import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import {
  archiveItem,
  openGraph,
  openItem,
  refreshEpic,
  refreshList,
  toggleHideDone,
} from '../actions';
import { age } from '../age';
import type { ViewContext } from '../chrome';
import {
  archiveLabel,
  buttonRows,
  categoryOf,
  childUrl,
  doneCount,
  firstName,
  fit,
  isBlocked,
  latestTouch,
  listed,
  marker,
  shortCodebase,
} from '../format';
import {
  FOOTER_BUTTONS,
  HEADER_ROWS,
  SHOW_ARCHIVED_DEFAULT,
  TABS_ROWS,
  footerKey,
} from '../shared';
import { childRows, openLink, pressRow } from './rows';
import type { Engine } from '../shared';
import type { EpicRow, Filter, ListNotice } from '../types';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const codebase = atom({ plugin: 'jira', key: 'codebase' } as const, '');
const filter = atom({ plugin: 'jira', key: 'filter' } as const, 'codebase' as Filter);
const expanded = atom({ plugin: 'jira', key: 'expanded' } as const, null as string | null);
const showArchived = atom({ plugin: 'jira', key: 'showArchived' } as const, SHOW_ARCHIVED_DEFAULT);
const hideDone = atom({ plugin: 'jira', key: 'hideDone' } as const, false);
const rowsEpoch = atom({ plugin: 'jira', key: 'rowsEpoch' } as const, 0);
const listNotice = atom({ plugin: 'jira', key: 'listNotice' } as const, null as ListNotice | null);
const openChild = atom({ plugin: 'jira', key: 'openChild' } as const, null as string | null);
const expandedStories = atom({ plugin: 'jira', key: 'expandedStories' } as const, [] as string[]);
const isLoading = atom({ plugin: 'jira', key: 'isLoading' } as const, false);
const busyKey = atom({ plugin: 'jira', key: 'busyKey' } as const, null as string | null);
const archivingKey = atom({ plugin: 'jira', key: 'archivingKey' } as const, null as string | null);
const lastError = atom({ plugin: 'jira', key: 'lastError' } as const, null as string | null);
const lastListedAt = atom({ plugin: 'jira', key: 'lastListedAt' } as const, null as string | null);
// Same atom as register.tsx's: where the pane's focus ring last landed, by element key.
const ring = atom({ plugin: 'jira', key: 'ring' } as const, null as string | null);

/** Follows an archived epic's summary. */
const ARCHIVED_MARK = ' (archived)';

const RELIST_LABEL = 'Re-list';

export async function drawList($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui, bodyColumns, bodyRows } = ctx;
  const { Box, Button } = ui;
  const width = bodyColumns;
  const now = Date.now();

  // Read ahead of the rows: a drawing that has the new epoch has the rows written before it.
  const epoch = await read($, rowsEpoch);
  const list = await read($, epics);
  const repo = await read($, codebase);
  const scope = await read($, filter);
  const open = await read($, expanded);
  const archivedShown = await read($, showArchived);
  const doneHidden = await read($, hideDone);
  const notice = await read($, listNotice);
  const openStories = await read($, expandedStories);
  const openedChild = await read($, openChild);
  const loading = await read($, isLoading);
  const busy = await read($, busyKey);
  const archiving = await read($, archivingKey);
  const error = await read($, lastError);
  const listedAt = await read($, lastListedAt);
  const ringKey = await read($, ring);

  const scopeLabel = scope === 'all' ? 'All repos' : `This repo · ${shortCodebase(repo) || 'none'}`;
  const stamp = loading ? 'loading...' : listedAt ? `listed ${age(listedAt, now)} ago` : '';
  const filterLabel = scope === 'all' ? 'Filter: all repos' : 'Filter: this repo';
  const archivedLabel = archivedShown ? 'Archived: shown' : 'Archived: hidden';
  const doneLabel = doneHidden ? 'Done: hidden' : 'Done: shown';
  // The footer wraps where the pane is too narrow for its buttons, and the rows it takes come off the list's.
  const footerRows = buttonRows([filterLabel, archivedLabel, doneLabel, RELIST_LABEL], width);
  // Rows this view's own body spends besides the row window: its scope/stamp row always, the
  // error/notice row when shown, and one more reserved for the "N more rows" hint, which a
  // window this size might make true.
  const ownRows = 1 + (error !== null ? 1 : 0) + (notice !== null ? 1 : 0) + 1;
  // `bodyRows` is what `frame()` sizes the whole pane to; `viewportRows` is the terminal's own row
  // count and runs well ahead of it once other chrome (the composer, banners) shares the screen.
  const room = Math.max(3, (bodyRows ?? 24) - ownRows - footerRows - HEADER_ROWS - TABS_ROWS);

  const rows: RenderElement[] = [];
  // Where each row-opening key sits in `rows`, so the window below can follow whichever one
  // the focus ring last landed on, not only the row a press opened.
  const focusIndex = new Map<string, number>();
  let openIndex = -1;
  for (const epic of list) {
    const total = epic.children.length;
    const done = doneCount(epic.children);
    const mark = marker(categoryOf(epic.status));
    const isOpen = open === epic.key;
    const aside = epic.archived === true;
    const toneOf = (color: (typeof P)['text']) => (aside ? P.dim : color);
    if (isOpen) openIndex = rows.length;
    focusIndex.set(epic.key, rows.length);
    const touched = age(latestTouch(epic, scope === 'all' ? null : repo), now);
    const refreshed = busy === epic.key ? '...' : age(epic.childrenRefreshedAt, now);
    const prefix = `${isOpen ? '▾' : '▸'} ${mark.glyph} ${epic.key.padEnd(11)} ${`${done}/${total}`.padEnd(6)} ${touched.padEnd(4)} `;
    rows.push(
      pressRow(ctx, {
        key: epic.key,
        onPress: () => void update($, expanded, (cur) => (cur === epic.key ? null : epic.key)),
        indent: 0,
        isOpen,
        mark: { glyph: mark.glyph, color: toneOf(P[mark.color]) },
        dim: aside,
        cells: [
          <Text dimColor mono>{` ${`${done}/${total}`.padEnd(6)} ${touched.padEnd(4)} `}</Text>,
          <Text dimColor={aside}>
            {fit(epic.summary, width - prefix.length - (aside ? ARCHIVED_MARK.length : 0))}
          </Text>,
          aside && <Text dimColor>{ARCHIVED_MARK}</Text>,
        ],
      }),
    );
    if (!isOpen) continue;
    rows.push(
      <Text dimColor>
        {`    ${epic.status?.name ?? 'unknown status'} · ${firstName(epic.assignee)} · children refreshed ${refreshed}${epic.childrenTruncated ? ' · capped' : ''}`}
      </Text>,
    );
    // Above the children, so they stay on screen however many children there are.
    // Open, Refresh, Graph, View and Archive sit on one row below the epic: a focus landing on
    // any of them should keep that same row in the window.
    for (const k of [
      `open:${epic.key}`,
      `refresh:${epic.key}`,
      `graph:${epic.key}`,
      `view:${epic.key}`,
      `archive:${epic.key}`,
    ]) {
      focusIndex.set(k, rows.length);
    }
    rows.push(
      <Box gap={1} marginLeft={4}>
        {openLink(ctx, epic.key, epic.url ?? undefined)}
        <Button
          key={`refresh:${epic.key}`}
          hotkey="r"
          dimColor={busy === epic.key}
          onPress={() => {
            if (busy !== epic.key) void refreshEpic($, epic.key);
          }}
        >
          {busy === epic.key ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button key={`graph:${epic.key}`} hotkey="g" onPress={() => void openGraph($, epic.key)}>
          Graph
        </Button>
        <Button key={`view:${epic.key}`} hotkey="v" onPress={() => void openItem($, epic.key)}>
          View
        </Button>
        <Button
          key={`archive:${epic.key}`}
          hotkey="x"
          dimColor={archiving === epic.key}
          onPress={() => {
            if (archiving !== epic.key) {
              void archiveItem($, 'epic', epic.key, epic.archived === true);
            }
          }}
        >
          {archiveLabel(archiving === epic.key, epic.archived === true)}
        </Button>
      </Box>,
    );
    const byKey = new Map(epic.children.map((child) => [child.key, child]));
    const shownChildren = listed(epic.children, doneHidden);
    for (const child of shownChildren) {
      rows.push(
        ...childRows($, ctx, child, {
          aside,
          hideDone: doneHidden,
          flag: isBlocked(child, byKey) ? '⊘' : ' ',
          indent: 2,
          subtaskIndent: 6,
          actions: {
            isOpen: openedChild === child.key,
            onToggle: () =>
              void update($, openChild, (cur) => (cur === child.key ? null : child.key)),
            url: childUrl(epic, child.key),
            isBusy: busy === child.key,
          },
          storyOpen: openStories.includes(child.key),
          onToggleSubtasks: () =>
            void update($, expandedStories, (cur) =>
              cur.includes(child.key) ? cur.filter((k) => k !== child.key) : [...cur, child.key],
            ),
        }),
      );
    }
    if (epic.children.length === 0) rows.push(<Text dimColor>{'  no children recorded'}</Text>);
    const hiddenChildren = epic.children.length - shownChildren.length;
    if (hiddenChildren > 0) rows.push(<Text dimColor>{`  ${hiddenChildren} Done hidden`}</Text>);
  }

  // The pinned Filter/Archived/Done/Re-list buttons sit right below the last row: a focus landing
  // on one of them keeps the window on the list's tail, not a reset to its top.
  for (const name of FOOTER_BUTTONS) focusIndex.set(footerKey(name, epoch), rows.length);
  focusIndex.set('relist', rows.length);

  // Anchors the window on whichever row the focus ring last landed on; a press that opened a row
  // without moving the ring (or no focus yet) falls back to that row instead.
  const focusedIndex = ringKey !== null ? (focusIndex.get(ringKey) ?? -1) : -1;
  const anchorIndex = focusedIndex !== -1 ? focusedIndex : openIndex;
  // Scrolls by the least needed to keep the anchor in view, at the window's far edge once it's
  // past the fold: anchorIndex - 1 would jump the window so the anchor lands a row below the top,
  // revealing several rows at once the first time the list needs to scroll.
  const start = Math.max(0, anchorIndex - room + 1);
  const isEmpty = list.length === 0 && !loading;
  const below = Math.max(0, rows.length - (start + room));
  const hasMore = below > 0;

  return ctx.frame(
    <Box flexDirection="column" width="100%" backgroundColor={P.background}>
      <Box justifyContent="space-between">
        <Text bold>{fit(scopeLabel, Math.max(0, width - stamp.length - 1))}</Text>
        <Text dimColor>{stamp}</Text>
      </Box>
      {error !== null && <Text color={P.error}>{fit(error, width)}</Text>}
      {isEmpty && (
        <Text dimColor>
          {scope === 'all'
            ? 'No epics recorded yet. Read one with "show me CROCS-123 and its children".'
            : 'No epics recorded for this repo yet. Read one with "show me CROCS-123 and its children".'}
        </Text>
      )}
      {/* All rows are rendered, not only the visible ones, so arrow-key focus can reach every
          row; this box clips to `room` and the inner one shifts to keep the anchor in view. */}
      <Box flexDirection="column" height={room} overflow="hidden" flexShrink={0}>
        <Box flexDirection="column" marginTop={-start} flexShrink={0}>
          {rows}
        </Box>
      </Box>
      {hasMore && <Text dimColor>{`${below} more rows; expand an epic to scroll to it`}</Text>}
      {notice !== null && (
        <Text color={notice.failed ? P.warning : P.success}>
          {fit(`${notice.failed ? '⚠' : '✓'} ${notice.text}`, width)}
        </Text>
      )}
    </Box>,
    <Box gap={1} flexWrap="wrap">
      <Button
        key={footerKey('filter', epoch)}
        hotkey="f"
        onPress={async () => {
          await update($, filter, (cur) => (cur === 'all' ? 'codebase' : 'all'));
          void refreshList($);
        }}
      >
        {filterLabel}
      </Button>
      <Button
        key={footerKey('archived', epoch)}
        hotkey="h"
        onPress={async () => {
          await update($, showArchived, (cur) => !cur);
          void refreshList($);
        }}
      >
        {archivedLabel}
      </Button>
      <Button key={footerKey('done', epoch)} hotkey="d" onPress={() => void toggleHideDone($)}>
        {doneLabel}
      </Button>
      <Button key="relist" hotkey="l" onPress={() => void refreshList($)}>
        {RELIST_LABEL}
      </Button>
    </Box>,
  );
}
