import type { RenderElement } from 'claude-code';

import { selectTab } from '../actions';
import type { ViewContext } from '../chrome';

import type { Engine } from '../shared';

// One string per line, each at most 56 columns so a 60-column pane never wraps one: the height drawn is the height counted.
const ABOUT = [
  'Pick up where you left off. This pane keeps the Jira',
  'work items your Claude Code sessions have touched,',
  'saved locally so you can find them again.',
  '',
  'Nothing here yet? Ask Claude to "show me KEY-1".',
];
const TABS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['Recent work', ['The latest 50 work items Claude touched, by project.']],
  ['Item', ['A work item in full, with its comments and Jira link.']],
  ['Epics', ['Epics with their work items and a progress count.']],
  [
    'Graph',
    [
      "See how an epic's work items block each other. Press",
      'Graph on an epic, then select a work item to see what',
      'blocks it and what it blocks.',
    ],
  ],
  ['Settings', ['Configure how the mod and plugin behave.']],
];
const COMMANDS: ReadonlyArray<readonly [string, string]> = [
  ['/jira-view', 'open the pane'],
  ['/jira-view KEY-1', 'open a work item, fresh from Jira'],
  ['/jira-view all', 'show work items from every repo'],
];
const GOOD_TO_KNOW: ReadonlyArray<readonly string[]> = [
  ['Lists start on this repo. Filter widens to all repos.'],
  [
    'Archive hides a work item on one tab. Jira itself',
    'is untouched. Set Archived to shown to see it, then',
    'press Unarchive to bring it back.',
  ],
];
export async function drawGuide($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui } = ctx;
  const { Box, Button } = ui;
  return (
    <Box flexDirection="column" width="100%" backgroundColor={P.background}>
      <Text bold>Guide</Text>
      <Text> </Text>
      {ABOUT.map((line) => (
        <Text>{line === '' ? ' ' : line}</Text>
      ))}
      <Text> </Text>
      <Text bold>Tabs</Text>
      {TABS.map(([name, lines], i) => (
        <Box flexDirection="column" marginTop={i === 0 ? 0 : 1}>
          <Text color={P.accent}>{name}</Text>
          {lines.map((line) => (
            <Text>{`  ${line}`}</Text>
          ))}
        </Box>
      ))}
      <Text> </Text>
      <Text bold>Commands</Text>
      {COMMANDS.map(([command, text]) => (
        <Box flexDirection="row">
          <Box width={19} flexShrink={0}>
            <Text color={P.accent}>{command}</Text>
          </Box>
          <Text>{text}</Text>
        </Box>
      ))}
      <Text> </Text>
      <Text bold>Good to know</Text>
      {GOOD_TO_KNOW.map((group, i) => (
        <Box flexDirection="column" marginTop={i === 0 ? 0 : 1}>
          {group.map((line) => (
            <Text>{line}</Text>
          ))}
        </Box>
      ))}
      <Text> </Text>
      <Button key="guide:settings" plain onPress={() => void selectTab($, 'settings')}>
        <Text color={P.accent} bold>
          {'[ Open Settings ]'}
        </Text>
      </Button>
    </Box>
  );
}
