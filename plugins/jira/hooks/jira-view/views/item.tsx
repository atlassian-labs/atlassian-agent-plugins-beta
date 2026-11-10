import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import { openGraph, openItem, readItem } from '../actions';
import { age } from '../age';
import type { ViewContext } from '../chrome';
import { categoryOf, marker } from '../format';
import { DEFAULT_VIEW, NO_ITEM } from '../shared';
import type { Engine } from '../shared';
import type { EpicRow, Item } from '../types';

const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const view = atom({ plugin: 'jira', key: 'view' } as const, DEFAULT_VIEW);
const itemView = atom({ plugin: 'jira', key: 'item' } as const, NO_ITEM);
const itemComments = atom({ plugin: 'jira', key: 'itemComments' } as const, false);

export async function drawItem($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, drawMarkdown, ui } = ctx;
  const { Box, Button } = ui;
  const now = Date.now();

  const list = await read($, epics);
  const shown = await read($, itemView);
  const withComments = await read($, itemComments);
  const { key, item } = shown;

  const showList = (
    <Button key="show-list" hotkey="l" plain onPress={() => void update($, view, () => 'list')}>
      <Text dimColor>List</Text>
    </Button>
  );

  if (key === null) {
    return (
      <Box flexDirection="column" width="100%" backgroundColor={P.background}>
        <Text dimColor>
          No work item chosen. Select a node in the graph and press v, or run /jira-view KEY-1.
        </Text>
        <Box marginTop={1}>{showList}</Box>
      </Box>
    );
  }

  // The epic the item belongs to among those listed, for the Graph button:
  // the item itself, or the epic it is a child of.
  const epic = list.find((row) => row.key === key || row.children.some((c) => c.key === key));
  const stamp = shown.isLoading
    ? 'reading from Jira...'
    : shown.loadedAt
      ? `read ${age(shown.loadedAt, now)} ago`
      : '';
  const refresh = (
    <Button
      key="refresh-item"
      hotkey="r"
      dimColor={shown.isLoading}
      label={shown.isLoading ? 'Reading...' : 'Refresh'}
      onPress={() => {
        if (!shown.isLoading) void readItem($, key);
      }}
    />
  );
  const graph =
    epic === undefined ? null : (
      <Button
        key="graph-item"
        hotkey="g"
        onPress={() => void openGraph($, epic.key, epic.key === key ? undefined : key)}
      >
        Graph
      </Button>
    );

  if (item === null) {
    return (
      <Box flexDirection="column" width="100%" backgroundColor={P.background}>
        <Box justifyContent="space-between">
          <Text bold>{key}</Text>
          <Text dimColor>{stamp}</Text>
        </Box>
        {shown.error !== null && (
          <Text color={P.error} wrap="wrap">{`Read failed: ${shown.error}`}</Text>
        )}
        <Box gap={2} marginTop={1}>
          {refresh}
          {graph}
          {showList}
        </Box>
      </Box>
    );
  }

  const mark = marker(categoryOf(item.status));
  const comments = item.comments ?? [];
  const truncated = new Set((item._truncated ?? '').split(',').filter((f) => f !== ''));
  const description = item.description?.trim() ?? '';
  const name = (user: Item['assignee']) => user?.displayName?.trim() || 'unassigned';
  // Facts the item may or may not carry, one row each, only where it does.
  const facts: [string, string][] = [];
  if (item.labels?.length) facts.push(['Labels', item.labels.join(', ')]);
  if (item.components?.length)
    facts.push(['Components', item.components.map((c) => c.name).join(', ')]);
  if (item.fixVersions?.length)
    facts.push(['Fix versions', item.fixVersions.map((v) => v.name).join(', ')]);
  if (item.duedate) facts.push(['Due', item.duedate]);
  const label = (text: string) => <Text dimColor>{text.padEnd(13)}</Text>;

  return (
    <Box flexDirection="column" width="100%" backgroundColor={P.background}>
      <Box justifyContent="space-between">
        <Text bold>{item.key}</Text>
        <Text dimColor>{stamp}</Text>
      </Box>
      <Text bold wrap="wrap">
        {item.summary}
      </Text>
      {shown.error !== null && (
        <Text color={P.error} wrap="wrap">{`Read failed: ${shown.error}`}</Text>
      )}

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Text color={P[mark.color]}>{`${mark.glyph} ${item.status.name}`}</Text>
        <Text dimColor>{item.issuetype.name}</Text>
        {item.priority && <Text dimColor>{`priority ${item.priority.name}`}</Text>}
        {item.resolution && <Text dimColor>{`resolved ${item.resolution.name}`}</Text>}
      </Box>
      <Box flexDirection="row">
        {label('Assignee')}
        <Text>{name(item.assignee)}</Text>
        {item.reporter && <Text dimColor>{`   reported by ${name(item.reporter)}`}</Text>}
      </Box>
      {item.parent && (
        <Box flexDirection="row">
          {label('Parent')}
          <Button
            key={`parent:${item.parent.key}`}
            plain
            onPress={() => void openItem($, item.parent?.key ?? key)}
          >
            <Text underline>{item.parent.key}</Text>
          </Button>
          <Text dimColor wrap="truncate">
            {item.parent.summary ? ` ${item.parent.summary}` : ''}
          </Text>
        </Box>
      )}
      {facts.map(([what, value]) => (
        <Box flexDirection="row">
          {label(what)}
          <Text wrap="truncate">{value}</Text>
        </Box>
      ))}
      <Box flexDirection="row">
        {label('Timeline')}
        <Text dimColor>
          {`created ${age(item.created, now)} ago · updated ${age(item.updated, now)} ago`}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {description ? (
          <Box key="description" flexDirection="column">
            {drawMarkdown(description)}
          </Box>
        ) : (
          <Text dimColor>No description.</Text>
        )}
        {truncated.has('description') && (
          <Text dimColor>
            The description was cut short in the store; open it in Jira for the rest.
          </Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Button
            key="comments"
            hotkey="c"
            plain
            onPress={() => {
              if (comments.length > 0) void update($, itemComments, (cur) => !cur);
            }}
          >
            <Text bold dimColor={comments.length === 0}>
              {`${withComments ? '▾' : '▸'} Comments (${comments.length})`}
            </Text>
          </Button>
          {truncated.has('comments') && <Text dimColor>some cut short in the store</Text>}
        </Box>
        {withComments &&
          comments.map((comment, i) => (
            <Box key={`comment:${i}`} flexDirection="column" marginTop={1}>
              <Text dimColor>
                {`${comment.author?.displayName ?? 'unknown'} · ${age(comment.created, now)} ago`}
              </Text>
              {comment.body?.trim() ? drawMarkdown(comment.body) : <Text dimColor>(empty)</Text>}
            </Box>
          ))}
      </Box>

      <Box gap={2} marginTop={1}>
        {refresh}
        {graph}
        {showList}
      </Box>
      <Text dimColor wrap="truncate">
        r refresh · c comments · g graph · l list · Esc returns focus
      </Text>
    </Box>
  );
}
