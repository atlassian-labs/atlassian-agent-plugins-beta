import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import { openItem, refreshEpic } from '../actions';
import { age } from '../age';
import type { ViewContext } from '../chrome';
import { categoryOf, doneCount, fit, isBlocked, marker } from '../format';

import { DEFAULT_VIEW } from '../shared';
import type { Engine } from '../shared';
import { CELL_WIDTH, downstreamOf, spans, tree } from '../tree';
import type { Edge } from '../tree';
import type { EpicRow } from '../types';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const view = atom({ plugin: 'jira', key: 'view' } as const, DEFAULT_VIEW);
const busyKey = atom({ plugin: 'jira', key: 'busyKey' } as const, null as string | null);
const graphEpic = atom({ plugin: 'jira', key: 'graphEpic' } as const, null as string | null);
const selected = atom({ plugin: 'jira', key: 'selected' } as const, null as string | null);

export async function drawGraph($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui, bodyColumns } = ctx;
  const { Box, Button } = ui;
  const width = bodyColumns;
  const now = Date.now();

  const list = await read($, epics);
  const key = await read($, graphEpic);
  const sel = await read($, selected);
  const busy = await read($, busyKey);

  const showList = (
    <Button key="show-list" hotkey="l" plain onPress={() => void update($, view, () => 'list')}>
      <Text dimColor>List</Text>
    </Button>
  );

  const epic = list.find((row) => row.key === key);
  if (epic === undefined) {
    return (
      <Box flexDirection="column" width="100%" backgroundColor={P.background}>
        <Text dimColor>
          {key === null
            ? 'No epic chosen. Expand an epic in the Epics pane and press g.'
            : `${key} is no longer in the list. Re-list, or pick another epic.`}
        </Text>
        <Box marginTop={1}>{showList}</Box>
      </Box>
    );
  }

  const byKey = new Map(epic.children.map((child) => [child.key, child]));
  const lay = tree(epic.children);
  // How a node or an edge stands to the selected node: a blocker of it, or
  // one it blocks. Only its own links count, not the whole closure.
  type Relation = 'up' | 'down';
  const relationOf = (k: string): Relation | undefined =>
    sel === null || k === sel
      ? undefined
      : lay.edges.some(([f, t]) => f === k && t === sel)
        ? 'up'
        : lay.edges.some(([f, t]) => f === sel && t === k)
          ? 'down'
          : undefined;
  const edgeTone = (edge: Edge): Relation | undefined =>
    sel === null ? undefined : edge[1] === sel ? 'up' : edge[0] === sel ? 'down' : undefined;
  const toneColor = (tone: Relation | undefined) =>
    tone === 'up' ? P.upstream : tone === 'down' ? P.downstream : undefined;
  const isDoneKey = (k: string) => categoryOf(byKey.get(k)?.status) === 'done';
  const isUnlinked = lay.edges.length === 0;
  const hasRefs = lay.rows.some((row) => row.kind === 'ref');

  // The tree, one row per node: the connector prefix, the status glyph, the
  // key as a button, and the summary in what is left of the width. A row
  // listing a node again under another blocker is dim and points at its own.
  const graph = lay.rows.map((row) => {
    const child = byKey.get(row.key);
    const mark = marker(categoryOf(child?.status));
    const isSelected = sel === row.key;
    const isRef = row.kind === 'ref';
    const relation = relationOf(row.key);
    // A finished blocker is struck through rather than coloured.
    const struck = relation === 'up' && isDoneKey(row.key);
    const keyColor = struck ? undefined : toneColor(relation);
    const dimKey = isRef || (sel !== null && !isSelected && relation === undefined);
    const pointer = isRef ? ` ${row.points === 'above' ? '↑' : '↓'}` : '';
    const head = row.depth * CELL_WIDTH + 2 + row.key.length + pointer.length + 1;
    const summary = isRef ? '' : fit(child?.summary ?? '', width - head);
    return (
      <Box
        key={`row:${row.kind}:${row.key}:${row.parent ?? ''}`}
        flexDirection="row"
        flexShrink={0}
      >
        {spans(row.cells, edgeTone).map((s) => (
          <Text color={toneColor(s.tone)} dimColor={s.tone === undefined}>
            {s.text}
          </Text>
        ))}
        <Text color={P[mark.color]} dimColor={isRef}>
          {`${mark.glyph} `}
        </Text>
        <Button
          key={`${isRef ? 'ref' : 'node'}:${row.key}${isRef ? `:${row.parent ?? ''}` : ''}`}
          plain
          dimColor={dimKey}
          hover={{ dimColor: false }}
          onPress={() => void update($, selected, (cur) => (cur === row.key ? null : row.key))}
        >
          <Text color={keyColor} bold={isSelected} inverse={isSelected} strikethrough={struck}>
            {row.key}
          </Text>
        </Button>
        {isRef ? (
          <Text dimColor>{pointer}</Text>
        ) : (
          <Text dimColor wrap="truncate">{` ${summary}`}</Text>
        )}
      </Box>
    );
  });

  // Detail of the selected child.
  const child = sel !== null ? byKey.get(sel) : undefined;
  const detail: RenderElement[] = [];
  // A blocker or a blocked item of the selected child, as the tree colours it.
  const chip = (k: string, relation: Relation) => {
    const c = byKey.get(k);
    const mark = marker(categoryOf(c?.status));
    const struck = relation === 'up' && isDoneKey(k);
    return (
      <Box flexDirection="row">
        <Text color={c ? P[mark.color] : undefined}>{`${c ? mark.glyph : '?'} `}</Text>
        <Text color={struck ? undefined : toneColor(relation)} strikethrough={struck}>
          {k}
        </Text>
      </Box>
    );
  };
  if (child !== undefined) {
    const mark = marker(categoryOf(child.status));
    const blockers = (child.blockedBy ?? []).filter((b) => byKey.has(b));
    const outside = (child.blockedBy ?? []).filter((b) => !byKey.has(b));
    const blocks = epic.children.filter((c) => c.blockedBy?.includes(child.key)).map((c) => c.key);
    const downstream = downstreamOf(epic.children, child.key);
    detail.push(
      <Box flexDirection="row" gap={1}>
        <Text color={P[mark.color]}>{mark.glyph}</Text>
        <Text bold>{child.key}</Text>
        <Text wrap="truncate">{fit(child.summary, Math.max(0, width - child.key.length - 4))}</Text>
      </Box>,
      <Box flexDirection="row" gap={2}>
        <Text color={P[mark.color]}>{child.status.name}</Text>
        <Text dimColor>{child.issuetype.name}</Text>
        <Text dimColor>{child.assignee?.displayName ?? 'unassigned'}</Text>
        {isBlocked(child, byKey) && <Text color={P.error}>⊘ blocked</Text>}
      </Box>,
      <Box flexDirection="row" gap={1}>
        <Text dimColor>Blocked by:</Text>
        {blockers.length ? (
          blockers.map((k) => chip(k, 'up'))
        ) : (
          <Text dimColor>nothing in this epic</Text>
        )}
        {outside.length > 0 && (
          <Text dimColor>{`(+${outside.length} outside: ${outside.join(', ')})`}</Text>
        )}
      </Box>,
      <Box flexDirection="row" gap={1}>
        <Text dimColor>Blocks:</Text>
        {blocks.length ? blocks.map((k) => chip(k, 'down')) : <Text dimColor>nothing</Text>}
        {downstream.length > blocks.length && (
          <Text dimColor>{`(${downstream.length} downstream in all)`}</Text>
        )}
      </Box>,
    );
    detail.push(
      <Box flexDirection="row" gap={2} marginTop={1}>
        <Button
          key="refresh-graph"
          hotkey="r"
          dimColor={busy === epic.key}
          label={busy === epic.key ? 'Refreshing...' : 'Refresh'}
          onPress={() => {
            if (busy !== epic.key) void refreshEpic($, epic.key);
          }}
        />
        <Button key="view-selected" hotkey="v" onPress={() => void openItem($, child.key)}>
          View
        </Button>
        <Button
          key="clear-selection"
          hotkey="c"
          plain
          onPress={() => void update($, selected, () => null)}
        >
          <Text dimColor>Clear</Text>
        </Button>
        {showList}
      </Box>,
    );
  } else {
    detail.push(
      <Text dimColor>
        Click a node, or Tab to one and press Enter, to see its details and highlight its links.
      </Text>,
      <Box flexDirection="row" gap={2} marginTop={1}>
        <Button
          key="refresh-graph"
          hotkey="r"
          dimColor={busy === epic.key}
          label={busy === epic.key ? 'Refreshing...' : 'Refresh'}
          onPress={() => {
            if (busy !== epic.key) void refreshEpic($, epic.key);
          }}
        />
        {showList}
      </Box>,
    );
  }

  const total = epic.children.length;
  const refreshed = busy === epic.key ? '...' : age(epic.childrenRefreshedAt, now);
  return (
    <Box flexDirection="column" width="100%" backgroundColor={P.background}>
      <Box flexDirection="row" gap={1}>
        <Text bold>{epic.key}</Text>
        <Text wrap="truncate">{fit(epic.summary, Math.max(0, width - epic.key.length - 2))}</Text>
      </Box>
      <Box flexDirection="row" gap={2}>
        <Text
          dimColor
        >{`${doneCount(epic.children)}/${total} done · ${lay.edges.length} links · children refreshed ${refreshed}`}</Text>
      </Box>
      <Box flexDirection="row" gap={2}>
        {(
          [
            ['new', 'to do'],
            ['indeterminate', 'in progress'],
            ['done', 'done'],
          ] as const
        ).map(([category, text]) => (
          <Text color={P[marker(category).color]}>{`${marker(category).glyph} ${text}`}</Text>
        ))}
        {!isUnlinked && <Text dimColor>an item blocks those indented under it</Text>}
      </Box>
      {sel !== null && (
        <Box flexDirection="row" gap={2}>
          <Text inverse>{sel}</Text>
          <Text color={P.upstream}>blocks it</Text>
          <Text strikethrough>blocked it, done</Text>
          <Text color={P.downstream}>blocked by it</Text>
        </Box>
      )}
      {lay.hasCycle && (
        <Text color={P.error}>The links contain a cycle; one edge per cycle is hidden.</Text>
      )}
      {total === 0 && <Text dimColor>No children recorded. Refresh to read them from Jira.</Text>}
      {isUnlinked && total > 0 && (
        <Text dimColor>
          No Blocks links among the children, so the nodes are listed rather than ordered.
        </Text>
      )}
      {hasRefs && (
        <Text dimColor>
          An item with several blockers hangs under the deepest; ↑ ↓ list it again under the others.
        </Text>
      )}

      <Box marginTop={1} flexDirection="column" overflow="hidden">
        {graph}
      </Box>

      <Box marginTop={1} flexDirection="column">
        {detail}
      </Box>

      <Box marginTop={1}>
        <Text dimColor wrap="truncate">
          v view · r refresh · c clear · l list · Esc returns focus
        </Text>
      </Box>
    </Box>
  );
}
