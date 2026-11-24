import type { RenderElement } from 'claude-code';

import { openItem, refreshRecentItem } from '../actions';
import type { ViewContext } from '../chrome';
import { categoryOf, firstName, fit, isDone, listed, marker } from '../format';
import type { Engine } from '../shared';
import type { EpicChild } from '../types';

export type ChildRowOptions = {
  /** Draws the row dim, as an archived epic's rows are. */
  aside: boolean;
  /** `⊘` where an unfinished sibling blocks the child, else a space. */
  flag: string;
  /** Draws no assignee, not `none`, where the child has none: a sub-task row's payload often carries no assignee. */
  blankUnassigned?: boolean;
  /** Leaves the story's done sub-tasks out of the rows listed; its count still counts them. */
  hideDone?: boolean;
  /** Whether the story's sub-tasks are listed under it; default shut. */
  storyOpen?: boolean;
  /** Flips `storyOpen`, the atom that holds it being the calling view's; without it no toggle is drawn. */
  onToggleSubtasks?: () => void;
  /** Leading spaces of the child row; default 6, where a sub-task row under a Recent work item sits. */
  indent?: number;
  /** Leading spaces of a story's sub-task rows; default 10. */
  subtaskIndent?: number;
  /**
   * Makes the child row click to reveal its Open, Refresh and View row, as a Recent work row does;
   * without it the child's key opens the item pane, as a sub-task's does.
   */
  actions?: {
    isOpen: boolean;
    onToggle: () => void;
    /** The item's page in Jira; absent where no site is known. */
    url?: string;
    isBusy: boolean;
  };
};

/** The Open entry of an action row: an accent-coloured link to the item in Jira, or dim text where no site is known. */
export function openLink(ctx: ViewContext, key: string, url: string | undefined): RenderElement {
  const { ui, Text, P } = ctx;
  return url === undefined ? (
    <Text key={`open:${key}`} dimColor>
      Open
    </Text>
  ) : (
    <ui.Link key={`open:${key}`} href={url}>
      <Text color={P.accent}>Open</Text>
    </ui.Link>
  );
}

/** Columns a work item key is padded to, so what follows it lines up. */
const KEY_WIDTH = 11;

/** Columns the arrow, the status mark and the blocked flag each take off the terminal. */
const SLOT_WIDTH = 2;

export type PressRow = {
  /** The item's key: the Button's address and the start of its label. */
  key: string;
  onPress: () => void;
  /** Columns the row sits in from the left edge. */
  indent: number;
  /** Whether the row's detail is shown: the arrow points down and the key is bold. */
  isOpen: boolean;
  /** The status mark and its colour, which the arrow shares. */
  mark: { glyph: string; color: string };
  /** The blocked flag and its colour, where the row has the column: the glyph is a space on a row not blocked. */
  flag?: { glyph: string; color: string };
  dim: boolean;
  /** What follows the key and the flag: counts, an age, the summary. */
  cells: Array<RenderElement | false>;
};

/**
 * A row that a press opens or shuts. On the terminal the whole row is one Button, its indent
 * and columns made of spaces. Where the surface draws a native button, text inside one loses
 * its colour and the surface's face is proportional, so spaces line nothing up: there the
 * indent is a margin, the arrow, the mark and the flag each sit in a box of a fixed width
 * before the Button, and the rest of the row is its label, the key in the monospaced face.
 */
export function pressRow(ctx: ViewContext, row: PressRow): RenderElement {
  const { Text, ui } = ctx;
  const { Box, Button } = ui;
  const arrow = row.isOpen ? '▾' : '▸';
  const label = (
    <Text mono bold={row.isOpen} dimColor={row.dim}>
      {row.key.padEnd(KEY_WIDTH)}
    </Text>
  );
  // The flag's colour is for its mark alone: the Button inverts under the pointer or the focus,
  // where a space in that colour shows as a block.
  const isFlagged = row.flag !== undefined && row.flag.glyph.trim() !== '';
  if (!ctx.hasNativeButtons)
    return (
      <Button key={row.key} plain onPress={row.onPress}>
        <Text color={row.mark.color}>{`${' '.repeat(row.indent)}${arrow} ${row.mark.glyph} `}</Text>
        {label}
        {row.flag !== undefined && <Text> </Text>}
        {row.flag !== undefined && (
          <Text color={isFlagged ? row.flag.color : undefined}>{row.flag.glyph}</Text>
        )}
        {row.flag !== undefined && <Text> </Text>}
        {row.cells}
      </Button>
    );
  const slot = (glyph: string, color: string) => (
    <Box width={SLOT_WIDTH} flexShrink={0}>
      <Text color={color}>{glyph}</Text>
    </Box>
  );
  return (
    <Box key={`row:${row.key}`} flexDirection="row" flexShrink={0} marginLeft={row.indent}>
      {slot(arrow, row.mark.color)}
      {slot(row.mark.glyph, row.mark.color)}
      {row.flag !== undefined && slot(row.flag.glyph, row.flag.color)}
      <Button key={row.key} plain onPress={row.onPress}>
        {label}
        {row.flag !== undefined && <Text> </Text>}
        {row.cells}
      </Button>
    </Box>
  );
}

/** One child row, and its sub-task rows where the story is open. */
export function childRows(
  $: Engine,
  ctx: ViewContext,
  child: EpicChild,
  options: ChildRowOptions,
): RenderElement[] {
  const { P, Text, ui, bodyColumns: width } = ctx;
  const { Box, Button } = ui;
  const { aside, flag, onToggleSubtasks, storyOpen = false, actions } = options;
  const indent = options.indent ?? 6;
  const pad = ' '.repeat(indent);
  // A revealed row sits under the child's key, past the indent, arrow and glyph.
  const revealPad = indent + 4;
  const subPad = ' '.repeat(options.subtaskIndent ?? 10);
  const toneOf = (color: (typeof P)['text']) => (aside ? P.dim : color);
  const rows: RenderElement[] = [];
  const childMark = marker(categoryOf(child.status));
  const childAssignee =
    child.assignee === undefined && options.blankUnassigned === true
      ? ''
      : firstName(child.assignee);
  const lead = actions
    ? `${pad}${actions.isOpen ? '▾' : '▸'} ${childMark.glyph} `
    : `${pad}${childMark.glyph} `;
  // A row that reveals actions leaves its assignee to the detail line the reveal draws.
  const assigneeCell = actions ? '' : ` ${childAssignee.padEnd(8)} `;
  const head = `${lead}${child.key.padEnd(KEY_WIDTH)}${assigneeCell}${actions ? ' ' : ''}${flag} `;
  // A story's sub-tasks sit collapsed under it; its count is over its own sub-tasks, not the epic's.
  const subtasks = child.subtasks ?? [];
  const subtaskDone = subtasks.filter(isDone).length;
  const hasToggle = subtasks.length > 0 && onToggleSubtasks !== undefined;
  const toggle = `${storyOpen ? '▾' : '▸'} ${subtaskDone}/${subtasks.length} sub-tasks`;
  const summary = (
    <Text wrap="truncate" dimColor={aside}>
      {fit(child.summary, width - head.length - (hasToggle ? toggle.length + 1 : 0))}
    </Text>
  );
  const toggleButton = hasToggle && (
    <Button key={`subtasks:${child.key}`} plain onPress={onToggleSubtasks}>
      <Text dimColor>{` ${toggle}`}</Text>
    </Button>
  );
  rows.push(
    <Box key={`child:${child.key}`} flexDirection="row" flexShrink={0}>
      {actions ? (
        pressRow(ctx, {
          key: child.key,
          onPress: actions.onToggle,
          indent,
          isOpen: actions.isOpen,
          mark: { glyph: childMark.glyph, color: toneOf(P[childMark.color]) },
          flag: { glyph: flag, color: toneOf(P.error) },
          dim: aside,
          cells: [summary],
        })
      ) : (
        <>
          <Text color={toneOf(P[childMark.color])}>{lead}</Text>
          <Button
            key={`view:${child.key}`}
            plain
            hover={{ dimColor: false }}
            onPress={() => void openItem($, child.key)}
          >
            <Text underline dimColor={aside}>
              {child.key}
            </Text>
          </Button>
          <Text>{' '.repeat(Math.max(0, 11 - child.key.length))}</Text>
          <Text dimColor>{` ${childAssignee.padEnd(8)} `}</Text>
          <Text color={toneOf(P.error)}>{`${flag} `}</Text>
          {summary}
        </>
      )}
      {toggleButton}
    </Box>,
  );
  if (actions?.isOpen) {
    rows.push(
      <Text key={`detail:${child.key}`} dimColor>
        {`${' '.repeat(revealPad)}${child.status.name} · ${firstName(child.assignee)} · ${child.issuetype.name}`}
      </Text>,
    );
    rows.push(
      <Box key={`actions:${child.key}`} gap={1} marginLeft={revealPad}>
        {openLink(ctx, child.key, actions.url)}
        <Button
          key={`refresh:${child.key}`}
          dimColor={actions.isBusy}
          onPress={() => {
            if (!actions.isBusy) void refreshRecentItem($, child.key);
          }}
        >
          {actions.isBusy ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button key={`view:${child.key}`} onPress={() => void openItem($, child.key)}>
          View
        </Button>
      </Box>,
    );
  }
  if (subtasks.length > 0 && storyOpen) {
    for (const sub of listed(subtasks, options.hideDone === true)) {
      const subMark = marker(categoryOf(sub.status));
      const assignee = sub.assignee === undefined ? '' : firstName(sub.assignee);
      const subHead = `${subPad}${subMark.glyph} ${sub.key.padEnd(11)} ${assignee.padEnd(8)} `;
      rows.push(
        <Box key={`subtask:${child.key}:${sub.key}`} flexDirection="row" flexShrink={0}>
          <Text color={toneOf(P[subMark.color])}>{`${subPad}${subMark.glyph} `}</Text>
          <Button
            key={`view:${sub.key}`}
            plain
            hover={{ dimColor: false }}
            onPress={() => void openItem($, sub.key)}
          >
            <Text underline dimColor={aside}>
              {sub.key}
            </Text>
          </Button>
          <Text>{' '.repeat(Math.max(0, 11 - sub.key.length))}</Text>
          <Text dimColor>{` ${assignee.padEnd(8)} `}</Text>
          <Text wrap="truncate" dimColor={aside}>
            {fit(sub.summary, width - subHead.length)}
          </Text>
        </Box>,
      );
    }
  }
  return rows;
}

/**
 * A list's rows. On the terminal all are drawn, so arrow-key focus can reach every one, behind a
 * window of `room` rows that starts at `start`. Elsewhere the surface scrolls the whole view, so
 * they are drawn as they are.
 */
export function rowWindow(
  ctx: ViewContext,
  rows: RenderElement[],
  room: number,
  start: number,
): RenderElement {
  const { Box } = ctx.ui;
  if (!ctx.listsFollowFocus) return <Box flexDirection="column">{rows}</Box>;
  return (
    <Box flexDirection="column" height={room} overflow="hidden" flexShrink={0}>
      <Box flexDirection="column" marginTop={-start} flexShrink={0}>
        {rows}
      </Box>
    </Box>
  );
}
