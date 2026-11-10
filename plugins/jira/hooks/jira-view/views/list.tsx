import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import { archiveItem, openGraph, openItem, refreshEpic, refreshList } from '../actions';
import { age } from '../age';
import type { ViewContext } from '../chrome';
import {
  archiveLabel,
  categoryOf,
  childUrl,
  doneCount,
  firstName,
  fit,
  isBlocked,
  latestTouch,
  marker,
  shortCodebase,
} from '../format';
import { HEADER_ROWS, SHOW_ARCHIVED_DEFAULT, TABS_ROWS } from '../shared';
import { childRows, openLink } from './rows';
import type { Engine } from '../shared';
import type { EpicRow, Filter, ListNotice } from '../types';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const codebase = atom({ plugin: 'jira', key: 'codebase' } as const, '');
const filter = atom({ plugin: 'jira', key: 'filter' } as const, 'codebase' as Filter);
const expanded = atom({ plugin: 'jira', key: 'expanded' } as const, null as string | null);
const showArchived = atom({ plugin: 'jira', key: 'showArchived' } as const, SHOW_ARCHIVED_DEFAULT);
const listNotice = atom({ plugin: 'jira', key: 'listNotice' } as const, null as ListNotice | null);
const openChild = atom({ plugin: 'jira', key: 'openChild' } as const, null as string | null);
const expandedStories = atom({ plugin: 'jira', key: 'expandedStories' } as const, [] as string[]);
const isLoading = atom({ plugin: 'jira', key: 'isLoading' } as const, false);
const busyKey = atom({ plugin: 'jira', key: 'busyKey' } as const, null as string | null);
const archivingKey = atom({ plugin: 'jira', key: 'archivingKey' } as const, null as string | null);
const lastError = atom({ plugin: 'jira', key: 'lastError' } as const, null as string | null);
const lastListedAt = atom({ plugin: 'jira', key: 'lastListedAt' } as const, null as string | null);

/** Follows an archived epic's summary. */
const ARCHIVED_MARK = ' (archived)';

export async function drawList($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui, bodyColumns, viewportRows } = ctx;
  const { Box, Button } = ui;
  const width = bodyColumns;
  const room = Math.max(3, (viewportRows ?? 24) - 5 - HEADER_ROWS - TABS_ROWS);
  const now = Date.now();

  const list = await read($, epics);
  const repo = await read($, codebase);
  const scope = await read($, filter);
  const open = await read($, expanded);
  const archivedShown = await read($, showArchived);
  const notice = await read($, listNotice);
  const openStories = await read($, expandedStories);
  const openedChild = await read($, openChild);
  const loading = await read($, isLoading);
  const busy = await read($, busyKey);
  const archiving = await read($, archivingKey);
  const error = await read($, lastError);
  const listed = await read($, lastListedAt);

  const scopeLabel = scope === 'all' ? 'All repos' : `This repo · ${shortCodebase(repo) || 'none'}`;
  const stamp = loading ? 'loading...' : listed ? `listed ${age(listed, now)} ago` : '';

  const rows: RenderElement[] = [];
  let openIndex = -1;
  for (const epic of list) {
    const total = epic.children.length;
    const done = doneCount(epic.children);
    const mark = marker(categoryOf(epic.status));
    const isOpen = open === epic.key;
    const aside = epic.archived === true;
    const toneOf = (color: (typeof P)['text']) => (aside ? P.dim : color);
    if (isOpen) openIndex = rows.length;
    const touched = age(latestTouch(epic, scope === 'all' ? null : repo), now);
    const refreshed = busy === epic.key ? '...' : age(epic.childrenRefreshedAt, now);
    const prefix = `${isOpen ? '▾' : '▸'} ${mark.glyph} ${epic.key.padEnd(11)} ${`${done}/${total}`.padEnd(6)} ${touched.padEnd(4)} `;
    rows.push(
      <Button
        key={epic.key}
        plain
        onPress={() => update($, expanded, (cur) => (cur === epic.key ? null : epic.key))}
      >
        <Text color={toneOf(P[mark.color])}>{`${isOpen ? '▾' : '▸'} ${mark.glyph} `}</Text>
        <Text bold={isOpen} dimColor={aside}>
          {epic.key.padEnd(11)}
        </Text>
        <Text dimColor>{` ${`${done}/${total}`.padEnd(6)} ${touched.padEnd(4)} `}</Text>
        <Text dimColor={aside}>
          {fit(epic.summary, width - prefix.length - (aside ? ARCHIVED_MARK.length : 0))}
        </Text>
        {aside && <Text dimColor>{ARCHIVED_MARK}</Text>}
      </Button>,
    );
    if (!isOpen) continue;
    rows.push(
      <Text dimColor>
        {`    ${epic.status?.name ?? 'unknown status'} · ${firstName(epic.assignee)} · children refreshed ${refreshed}${epic.childrenTruncated ? ' · capped' : ''}`}
      </Text>,
    );
    // Above the children, so they stay on screen however many children there are.
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
    for (const child of epic.children) {
      rows.push(
        ...childRows($, ctx, child, {
          aside,
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
  }

  const start = openIndex > room - 1 ? Math.max(0, openIndex - 1) : 0;
  const visible = rows.slice(start, start + room);
  const isEmpty = list.length === 0 && !loading;
  const below = rows.length - (start + visible.length);
  const hasMore = below > 0;

  return (
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
      {visible}
      {hasMore && <Text dimColor>{`${below} more rows; expand an epic to scroll to it`}</Text>}
      {notice !== null && (
        <Text color={notice.failed ? P.warning : P.success}>
          {fit(`${notice.failed ? '⚠' : '✓'} ${notice.text}`, width)}
        </Text>
      )}
      <Box gap={1}>
        <Button
          key="filter"
          hotkey="f"
          onPress={async () => {
            await update($, filter, (cur) => (cur === 'all' ? 'codebase' : 'all'));
            void refreshList($);
          }}
        >
          {scope === 'all' ? 'Filter: all repos' : 'Filter: this repo'}
        </Button>
        <Button
          key="archived"
          hotkey="h"
          onPress={async () => {
            await update($, showArchived, (cur) => !cur);
            void refreshList($);
          }}
        >
          {archivedShown ? 'Archived: shown' : 'Archived: hidden'}
        </Button>
        <Button key="relist" hotkey="l" onPress={() => void refreshList($)}>
          Re-list
        </Button>
      </Box>
    </Box>
  );
}
