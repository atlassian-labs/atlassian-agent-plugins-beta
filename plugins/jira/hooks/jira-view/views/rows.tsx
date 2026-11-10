import type { RenderElement } from 'claude-code';

import { openItem, refreshRecentItem } from '../actions';
import type { ViewContext } from '../chrome';
import { categoryOf, firstName, fit, marker } from '../format';
import type { Engine } from '../shared';
import type { EpicChild } from '../types';

export type ChildRowOptions = {
  /** Draws the row dim, as an archived epic's rows are. */
  aside: boolean;
  /** `⊘` where an unfinished sibling blocks the child, else a space. */
  flag: string;
  /** Draws no assignee, not `none`, where the child has none: a sub-task row's payload often carries no assignee. */
  blankUnassigned?: boolean;
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
  const head = `${lead}${child.key.padEnd(11)}${assigneeCell}${actions ? ' ' : ''}${flag} `;
  // A story's sub-tasks sit collapsed under it; its count is over its own sub-tasks, not the epic's.
  const subtasks = child.subtasks ?? [];
  const subtaskDone = subtasks.filter((sub) => categoryOf(sub.status) === 'done').length;
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
        <Button key={child.key} plain onPress={actions.onToggle}>
          <Text color={toneOf(P[childMark.color])}>{lead}</Text>
          <Text bold={actions.isOpen} dimColor={aside}>
            {child.key.padEnd(11)}
          </Text>
          <Text> </Text>
          <Text color={toneOf(P.error)}>{`${flag} `}</Text>
          {summary}
        </Button>
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
    for (const sub of subtasks) {
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
