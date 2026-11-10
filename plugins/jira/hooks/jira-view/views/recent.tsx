import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import { archiveItem, openItem, refreshList, refreshRecentItem } from '../actions';
import { age } from '../age';
import type { ViewContext } from '../chrome';
import {
  archiveLabel,
  browseLink,
  categoryOf,
  firstName,
  fit,
  latestTouch,
  marker,
  shortCodebase,
} from '../format';
import { HEADER_ROWS, SHOW_ARCHIVED_DEFAULT, TABS_ROWS } from '../shared';
import type { Engine } from '../shared';
import type { EpicRow, Filter, ListNotice, RecentGroup } from '../types';
import { childRows, openLink } from './rows';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const recent = atom({ plugin: 'jira', key: 'recent' } as const, [] as RecentGroup[]);
const collapsedProjects = atom(
  { plugin: 'jira', key: 'collapsedProjects' } as const,
  [] as string[],
);
const openRecent = atom({ plugin: 'jira', key: 'openRecent' } as const, null as string | null);
const codebase = atom({ plugin: 'jira', key: 'codebase' } as const, '');
const filter = atom({ plugin: 'jira', key: 'filter' } as const, 'codebase' as Filter);
const showArchived = atom({ plugin: 'jira', key: 'showArchived' } as const, SHOW_ARCHIVED_DEFAULT);
const listNotice = atom({ plugin: 'jira', key: 'listNotice' } as const, null as ListNotice | null);
const isLoading = atom({ plugin: 'jira', key: 'isLoading' } as const, false);
const busyKey = atom({ plugin: 'jira', key: 'busyKey' } as const, null as string | null);
const archivingKey = atom({ plugin: 'jira', key: 'archivingKey' } as const, null as string | null);
const lastError = atom({ plugin: 'jira', key: 'lastError' } as const, null as string | null);
const lastListedAt = atom({ plugin: 'jira', key: 'lastListedAt' } as const, null as string | null);

/** Follows an archived item's summary. */
const ARCHIVED_MARK = ' (archived)';

const NAME_WIDTH = 24;

const shorten = (text: string, width: number): string =>
  text.length <= width ? text : `${text.slice(0, width - 1)}…`;

export async function drawRecent($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui, bodyColumns, viewportRows } = ctx;
  const { Box, Button } = ui;
  const width = bodyColumns;
  const room = Math.max(3, (viewportRows ?? 24) - 5 - HEADER_ROWS - TABS_ROWS);
  const now = Date.now();

  const groups = await read($, recent);
  const epicList = await read($, epics);
  const collapsed = await read($, collapsedProjects);
  const open = await read($, openRecent);
  const repo = await read($, codebase);
  const scope = await read($, filter);
  const archivedShown = await read($, showArchived);
  const notice = await read($, listNotice);
  const loading = await read($, isLoading);
  const busy = await read($, busyKey);
  const archiving = await read($, archivingKey);
  const error = await read($, lastError);
  const listed = await read($, lastListedAt);

  const scopeLabel = scope === 'all' ? 'All repos' : `This repo · ${shortCodebase(repo) || 'none'}`;
  const stamp = loading ? 'loading...' : listed ? `listed ${age(listed, now)} ago` : '';

  const rows: RenderElement[] = [];
  let openIndex = -1;
  for (const group of groups) {
    const isCollapsed = collapsed.includes(group.projectKey);
    rows.push(
      <Button
        key={`project:${group.projectKey}`}
        plain
        onPress={() =>
          update($, collapsedProjects, (cur) =>
            cur.includes(group.projectKey)
              ? cur.filter((k) => k !== group.projectKey)
              : [...cur, group.projectKey],
          )
        }
      >
        <Text bold>{`${isCollapsed ? '▸' : '▾'} ${group.projectKey}`}</Text>
        {group.name !== undefined && <Text dimColor>{` ${shorten(group.name, NAME_WIDTH)}`}</Text>}
        <Text dimColor>{` (${group.items.length})`}</Text>
      </Button>,
    );
    if (isCollapsed) continue;
    for (const item of group.items) {
      const isOpen = open === item.key;
      if (isOpen) openIndex = rows.length;
      const aside = item.archived === true;
      const mark = marker(categoryOf(item.status));
      const touched = age(latestTouch(item, scope === 'all' ? null : repo), now);
      const prefix = `  ${isOpen ? '▾' : '▸'} ${mark.glyph} ${item.key.padEnd(11)} ${touched.padEnd(4)} `;
      rows.push(
        <Button
          key={item.key}
          plain
          onPress={() => update($, openRecent, (cur) => (cur === item.key ? null : item.key))}
        >
          <Text
            color={aside ? P.dim : P[mark.color]}
          >{`  ${isOpen ? '▾' : '▸'} ${mark.glyph} `}</Text>
          <Text bold={isOpen} dimColor={aside}>
            {item.key.padEnd(11)}
          </Text>
          <Text dimColor>{` ${touched.padEnd(4)} `}</Text>
          <Text dimColor={aside}>
            {fit(item.summary, width - prefix.length - (aside ? ARCHIVED_MARK.length : 0))}
          </Text>
          {aside && <Text dimColor>{ARCHIVED_MARK}</Text>}
        </Button>,
      );
      if (!isOpen) continue;
      rows.push(
        <Text
          dimColor
        >{`      ${item.status.name} · ${firstName(item.assignee)} · ${item.issuetype.name}`}</Text>,
      );
      rows.push(
        <Box gap={1} marginLeft={6}>
          {openLink(ctx, item.key, browseLink(item.key, epicList))}
          <Button
            key={`refresh:${item.key}`}
            hotkey="r"
            dimColor={busy === item.key}
            onPress={() => {
              if (busy !== item.key) void refreshRecentItem($, item.key);
            }}
          >
            Refresh
          </Button>
          <Button key={`view:${item.key}`} hotkey="v" onPress={() => void openItem($, item.key)}>
            View
          </Button>
          <Button
            key={`archive:${item.key}`}
            hotkey="x"
            dimColor={archiving === item.key}
            onPress={() => {
              if (archiving !== item.key) void archiveItem($, 'recent', item.key, aside);
            }}
          >
            {archiveLabel(archiving === item.key, aside)}
          </Button>
        </Box>,
      );
      for (const sub of item.subtasks ?? []) {
        rows.push(
          ...childRows($, ctx, sub, {
            aside,
            flag: ' ',
            blankUnassigned: true,
          }),
        );
      }
    }
  }

  // Starts the window at the open item, so its buttons and sub-tasks are not cut off below the fold.
  const start = openIndex > room - 1 ? Math.max(0, openIndex - 1) : 0;
  const visible = rows.slice(start, start + room);
  const isEmpty = groups.length === 0 && !loading;
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
            ? 'No recent work recorded yet. Read an item with "show me CROCS-123".'
            : 'No recent work recorded for this repo yet. Read an item with "show me CROCS-123".'}
        </Text>
      )}
      {visible}
      {hasMore && <Text dimColor>{`${below} more rows; collapse a project`}</Text>}
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
