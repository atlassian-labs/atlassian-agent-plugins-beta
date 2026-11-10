import { atom, read } from 'claude-code';
import type { EngineInterface, RenderElement } from 'claude-code';

import { selectTab, toggleTheme } from './actions';
import { browseLink, childUrl, itemUrl } from './format';
import { blocksOf } from './markdown';
import type { Span } from './markdown';
import { DEFAULT_THEME, otherTheme, PALETTES } from './palette';
import type { Palette } from './palette';
import { DEFAULT_VIEW, NO_ITEM, SETTING_DEFAULTS } from './shared';
import type { Engine } from './shared';
import type { EpicRow, RecentGroup, Theme, View } from './types';

const view = atom({ plugin: 'jira', key: 'view' } as const, DEFAULT_VIEW);
const showEpicsTab = atom(
  { plugin: 'jira', key: 'showEpicsTab' } as const,
  SETTING_DEFAULTS.showEpicsTab,
);
const showRecentWorkTab = atom(
  { plugin: 'jira', key: 'showRecentWorkTab' } as const,
  SETTING_DEFAULTS.showRecentWorkTab,
);
/** The body's scroll: rows from the top, valid for the view named. The engine has nothing to scroll in a framed pane, so the pane keeps its own. */
const scroll = atom(
  { plugin: 'jira', key: 'scroll' } as const,
  { view: 'list', offset: 0 } as { view: View; offset: number },
);
const recent = atom({ plugin: 'jira', key: 'recent' } as const, [] as RecentGroup[]);
const theme = atom({ plugin: 'jira', key: 'theme' } as const, DEFAULT_THEME as Theme);
const graphEpic = atom({ plugin: 'jira', key: 'graphEpic' } as const, null as string | null);
const itemView = atom({ plugin: 'jira', key: 'item' } as const, NO_ITEM);
const epics = atom({ plugin: 'jira', key: 'epics' } as const, [] as EpicRow[]);
const expanded = atom({ plugin: 'jira', key: 'expanded' } as const, null as string | null);
const selected = atom({ plugin: 'jira', key: 'selected' } as const, null as string | null);
const openChild = atom({ plugin: 'jira', key: 'openChild' } as const, null as string | null);
const openRecent = atom({ plugin: 'jira', key: 'openRecent' } as const, null as string | null);
const collapsedProjects = atom(
  { plugin: 'jira', key: 'collapsedProjects' } as const,
  [] as string[],
);

/** The engine's elements for one render: Box, Button, Link, Text and the rest. */
type Ui = ReturnType<EngineInterface['ui']['resolve']>;

/** Text in the palette's colours; the views draw all their text with it. */
type TextComponent = (props: Parameters<Ui['Text']>[0]) => RenderElement;

/**
 * What a view needs to draw itself, built once per render by
 * `buildViewContext`: the engine's elements, the palette and the elements
 * drawn in it, and the sizes of the pane body. It holds no `$`: the engine's checker refuses a `$` put
 * in an object, so each view takes `$` as its own argument.
 */
export type ViewContext = {
  ui: Ui;
  P: Palette;
  Text: TextComponent;
  /** Wraps a view's body: the Settings, Guide and theme row above, the view tabs below, the body clipped between. */
  frame: (body: RenderElement) => RenderElement;
  /** A description or comment, block by block, in the palette. */
  drawMarkdown: (markdown: string) => RenderElement[];
  /** The view the tab row has chosen. */
  current: View;
  bodyColumns: number;
  viewportRows: number | undefined;
  bodyRows: number | undefined;
};

/** The sizes of the pane body, read off the render event. */
type BodySize = Pick<ViewContext, 'bodyColumns' | 'viewportRows' | 'bodyRows'>;

const themeName = (theme: Theme) => (theme === 'dark' ? 'Dark' : 'Light');

export async function buildViewContext($: Engine, ui: Ui, size: BodySize): Promise<ViewContext> {
  const { Box, Button, Link, Text: Plain } = ui;
  const mode = await read($, theme);
  const P: Palette = PALETTES[mode];
  // Text in the palette's colours: plain text in `text`, a dim run in `dim`,
  // a hover that un-dims in `text`. The engine's own `dimColor` is left out:
  // it draws in the engine theme's dim colour, which the toggle is here to
  // replace.
  type TextArgs = Parameters<typeof Plain>[0];
  const Text = ({ color, dimColor, hover, children, ...rest }: TextArgs) => (
    <Plain
      {...rest}
      color={color ?? (dimColor ? P.dim : P.text)}
      hover={hover?.dimColor === false ? { ...hover, dimColor: undefined, color: P.text } : hover}
    >
      {children}
    </Plain>
  );
  // A button's string label in the palette's colours: the engine draws it in its own theme's text
  // colour, which is near-invisible on the light palette under a dark engine theme. A button given
  // elements (the tabs) already draws them with `Text`, so is left as it is.
  type ButtonArgs = Parameters<typeof ui.Button>[0];
  const PaletteButton = ({ children, label: labelProp, ...rest }: ButtonArgs) => {
    // A lone string child may arrive as a one-item array. A `label` prop stands in for the child.
    const given = Array.isArray(children) ? children : [children];
    const parts = given.every((part) => part === undefined || part === '') ? [labelProp] : given;
    const label = parts.every((part) => typeof part === 'string') ? parts.join('') : undefined;
    if (label === undefined)
      return (
        <Button {...rest} label={labelProp}>
          {children}
        </Button>
      );
    // Elements in place of the label need an explicit key, which a string label would have supplied.
    return (
      <Button key={rest.key ?? label} {...rest}>
        <Text dimColor={rest.dimColor}>{label}</Text>
      </Button>
    );
  };
  // A description or a comment, block by block in the palette, in place of
  // the engine's Markdown element, which draws in the engine theme's colours
  // and takes none. Items follow one another without a blank row; every
  // other block has one before it.
  const inline = (spans: Span[]) =>
    spans.map((span) =>
      span.style === undefined ? (
        span.text
      ) : (
        <Text
          color={span.style === 'code' || span.style === 'link' ? P.accent : undefined}
          bold={span.style === 'bold'}
          italic={span.style === 'italic'}
          underline={span.style === 'link'}
        >
          {span.text}
        </Text>
      ),
    );
  const drawMarkdown = (markdown: string): RenderElement[] =>
    blocksOf(markdown).map((block, i, all) => {
      const gap = i === 0 || (block.kind === 'item' && all[i - 1]?.kind === 'item') ? 0 : 1;
      switch (block.kind) {
        case 'heading':
          return (
            <Box marginTop={gap}>
              <Text bold wrap="wrap">
                {inline(block.spans)}
              </Text>
            </Box>
          );
        case 'item':
        case 'quote':
          return (
            <Box flexDirection="row" marginTop={gap}>
              <Box flexShrink={0}>
                <Text dimColor={block.kind === 'quote'}>
                  {block.kind === 'item' ? `${'  '.repeat(block.indent)}${block.marker} ` : '│ '}
                </Text>
              </Box>
              <Box flexGrow={1} flexShrink={1}>
                <Text wrap="wrap" dimColor={block.kind === 'quote'}>
                  {inline(block.spans)}
                </Text>
              </Box>
            </Box>
          );
        case 'code':
          return (
            <Box flexDirection="column" marginTop={gap}>
              {block.lines.map((line) => (
                <Text color={P.accent} wrap="truncate">{`  ${line}`}</Text>
              ))}
            </Box>
          );
        default:
          return (
            <Box marginTop={gap}>
              <Text wrap="wrap">{inline(block.spans)}</Text>
            </Box>
          );
      }
    });
  const epicsShown = await read($, showEpicsTab);
  const recentShown = await read($, showRecentWorkTab);
  // A list tab the settings hide is never the view drawn, whatever the view atom still holds.
  const chosen = await read($, view);
  const current: View =
    chosen === 'recent' && !recentShown
      ? 'list'
      : chosen === 'list' && !epicsShown
        ? 'recent'
        : chosen;
  const held = await read($, scroll);
  const offset = held.view === current ? held.offset : 0;
  const graphKey = await read($, graphEpic);
  const itemKey = (await read($, itemView)).key;
  const list = await read($, epics);
  const epicCount = list.length;
  const recentCount = (await read($, recent)).reduce((n, group) => n + group.items.length, 0);
  const tab = (which: View, text: string, hotkey: string) => {
    const isCurrent = current === which;
    return (
      <Button key={`tab:${which}`} hotkey={hotkey} plain onPress={() => void selectTab($, which)}>
        <Text bold={isCurrent} inverse={isCurrent} dimColor={!isCurrent}>{` ${text} `}</Text>
      </Button>
    );
  };
  // The work item the view is on: the open epic, the selected graph node (else its epic), the item shown.
  const open = await read($, expanded);
  const sel = await read($, selected);
  const shown = await read($, itemView);
  const openedChild = await read($, openChild);
  const openedRecent = await read($, openRecent);
  const collapsed = await read($, collapsedProjects);
  const groups = await read($, recent);
  const graphRow = list.find((row) => row.key === graphKey);
  let target: { key: string; url: string | undefined } | null = null;
  if (current === 'list' && open !== null) {
    const epicRow = list.find((row) => row.key === open);
    // An open child row's Open is the one the footer follows; it counts only under the open epic.
    if (epicRow !== undefined && epicRow.children.some((c) => c.key === openedChild)) {
      target = { key: openedChild as string, url: childUrl(epicRow, openedChild as string) };
    } else {
      target = { key: open, url: epicRow?.url ?? undefined };
    }
  } else if (current === 'recent' && openedRecent !== null) {
    // The row is drawn only while its project is expanded.
    const visible = groups.some(
      (g) => !collapsed.includes(g.projectKey) && g.items.some((i) => i.key === openedRecent),
    );
    if (visible) target = { key: openedRecent, url: browseLink(openedRecent, list) };
  } else if (current === 'graph' && graphRow !== undefined) {
    const node = sel !== null && graphRow.children.some((c) => c.key === sel) ? sel : null;
    target =
      node === null
        ? { key: graphRow.key, url: graphRow.url ?? undefined }
        : { key: node, url: childUrl(graphRow, node) };
  } else if (current === 'item' && shown.key !== null && shown.item) {
    target = { key: shown.key, url: itemUrl(shown.item, list) };
  }
  // The view tabs are the pane's primary triggers, so they sit at the bottom, nearest the prompt.
  const viewTabs: Array<[View, string]> = [];
  if (recentShown) viewTabs.push(['recent', `Recent work (${recentCount})`]);
  viewTabs.push(['item', itemKey ?? 'Item']);
  if (epicsShown) viewTabs.push(['list', `Epics (${epicCount})`]);
  viewTabs.push(['graph', graphKey === null ? 'Graph' : `${graphKey} graph`]);
  const tabs = (
    <Box flexDirection="row" width="100%" gap={1} flexShrink={0}>
      {viewTabs.map(([which, text], i) => tab(which, text, String(i + 1)))}
      <Box flexGrow={1} />
      {target?.url ? <Link href={target.url} label={`⧉ ${target.key}`} /> : null}
    </Box>
  );

  // Settings and the Guide are tabs in all but place, with the theme toggle: the top row, on every view.
  const header = (
    <Box flexDirection="row" width="100%" gap={1} marginBottom={1} flexShrink={0}>
      {tab('settings', 'Settings', String(viewTabs.length + 1))}
      {tab('guide', 'Guide', String(viewTabs.length + 2))}
      <Box flexGrow={1} />
      <Button key="theme" hotkey="m" plain onPress={() => void toggleTheme($)}>
        <Text
          dimColor
        >{`${otherTheme(mode) === 'dark' ? '☾' : '☀'} ${themeName(otherTheme(mode))} Theme`}</Text>
      </Button>
    </Box>
  );

  // The pane's tree is as tall as its window, so the engine never scrolls it: the header and the
  // view tabs stay put, and a body taller than what is left between them is clipped, not scrolled.
  const frame = (body: RenderElement) => (
    <Box flexDirection="column" width="100%" height={size.bodyRows} backgroundColor={P.background}>
      {header}
      <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        <Box flexDirection="column" flexShrink={0} marginTop={-offset}>
          {body}
        </Box>
      </Box>
      {tabs}
    </Box>
  );

  return { ui: { ...ui, Button: PaletteButton }, P, Text, frame, drawMarkdown, current, ...size };
}
