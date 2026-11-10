import { atom, read, update } from 'claude-code';
import type { RenderElement } from 'claude-code';

import { toggleReviewPreference } from '../actions';
import type { ViewContext } from '../chrome';
import { SETTING_DEFAULTS, SETTING_KEYS } from '../shared';
import type { Engine } from '../shared';

const openAtStart = atom(
  { plugin: 'jira', key: 'openAtStart' } as const,
  SETTING_DEFAULTS.openAtStart,
);
const showEpicsTab = atom(
  { plugin: 'jira', key: 'showEpicsTab' } as const,
  SETTING_DEFAULTS.showEpicsTab,
);
const showRecentWorkTab = atom(
  { plugin: 'jira', key: 'showRecentWorkTab' } as const,
  SETTING_DEFAULTS.showRecentWorkTab,
);
const reviewBeforePublishing = atom(
  { plugin: 'jira', key: 'reviewBeforePublishing' } as const,
  true,
);
const settingsNotice = atom(
  { plugin: 'jira', key: 'settingsNotice' } as const,
  null as string | null,
);

const LAST_LIST = 'At least one of the two list tabs has to stay on.';

/**
 * One toggle per setting: the engine's scan refuses `read` or `update` on an
 * atom passed as a parameter. Each flips from the value held now, not the one
 * drawn, so two presses before a redraw flip it twice.
 */
async function toggleOpenAtStart($: Engine): Promise<void> {
  await update($, settingsNotice, () => null);
  await update($, openAtStart, (current) => !current);
  await $.store.set(SETTING_KEYS.openAtStart, await read($, openAtStart));
}

/** Turning a list tab off is refused where it is the one left on: the pane never has zero lists. */
async function toggleShowEpicsTab($: Engine): Promise<void> {
  if ((await read($, showEpicsTab)) && !(await read($, showRecentWorkTab))) {
    await update($, settingsNotice, () => LAST_LIST);
    return;
  }
  await update($, settingsNotice, () => null);
  await update($, showEpicsTab, (current) => !current);
  await $.store.set(SETTING_KEYS.showEpicsTab, await read($, showEpicsTab));
}

async function toggleShowRecentWorkTab($: Engine): Promise<void> {
  if ((await read($, showRecentWorkTab)) && !(await read($, showEpicsTab))) {
    await update($, settingsNotice, () => LAST_LIST);
    return;
  }
  await update($, settingsNotice, () => null);
  await update($, showRecentWorkTab, (current) => !current);
  await $.store.set(SETTING_KEYS.showRecentWorkTab, await read($, showRecentWorkTab));
}

export async function drawSettings($: Engine, ctx: ViewContext): Promise<RenderElement> {
  const { P, Text, ui } = ctx;
  const { Box, Button } = ui;

  const atStart = await read($, openAtStart);
  const epicsTab = await read($, showEpicsTab);
  const recentTab = await read($, showRecentWorkTab);
  const reviewing = await read($, reviewBeforePublishing);
  const notice = await read($, settingsNotice);

  // The engine draws the hotkey in front of the button, as it does for the tabs.
  const row = (key: string, hotkey: string, isOn: boolean, label: string, onPress: () => void) => (
    <Button key={key} hotkey={hotkey} plain onPress={onPress}>
      <Text color={isOn ? P.success : P.dim} bold>{`[${isOn ? 'x' : ' '}] `}</Text>
      <Text>{label}</Text>
    </Button>
  );

  return (
    <Box flexDirection="column" width="100%" backgroundColor={P.background}>
      <Text bold>Settings</Text>
      <Text dimColor>Kept for you across sessions and repositories.</Text>
      <Box flexDirection="column" marginTop={1}>
        {row(
          'setting:openAtStart',
          'o',
          atStart,
          'Open at session start',
          () => void toggleOpenAtStart($),
        )}
        {row(
          'setting:showEpicsTab',
          'e',
          epicsTab,
          'Show the Epics tab',
          () => void toggleShowEpicsTab($),
        )}
        {row(
          'setting:showRecentWorkTab',
          'w',
          recentTab,
          'Show the Recent work tab',
          () => void toggleShowRecentWorkTab($),
        )}
        {row(
          'setting:reviewBeforePublishing',
          'r',
          reviewing,
          'Review before publishing',
          () => void toggleReviewPreference($),
        )}
        <Text dimColor>{'    Shows the PR description and Jira comment for approval first.'}</Text>
      </Box>
      {notice !== null && (
        <Box marginTop={1} flexDirection="row">
          <Text color={P.warning} bold>
            {'⚠ '}
          </Text>
          <Text color={P.warning}>{notice}</Text>
        </Box>
      )}
    </Box>
  );
}
