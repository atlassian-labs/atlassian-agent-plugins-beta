export type Filter = 'codebase' | 'all';

/** Which view the pane draws: the recent work, the epics list (the Epics tab), one epic's graph, one work item, the settings, or the guide. */
export type View = 'recent' | 'list' | 'graph' | 'item' | 'settings' | 'guide';

/** The colour mode the pane draws in, chosen by its toggle; kept in the plugin store. */
export type Theme = 'light' | 'dark';

export type ListNotice = { text: string; failed: boolean };

export type EpicTouch = {
  lastWrittenAt?: string;
  lastAccessedAt?: string;
};

/** A sub-task row: a child row without `blockedBy` or sub-tasks of its own. */
export type EpicSubtask = {
  key: string;
  summary: string;
  status: { name: string; statusCategory?: { key: string } };
  issuetype: { name: string };
  /** Absent until the sub-task itself has been read; the story's payload names none. */
  assignee?: { displayName?: string } | null;
};

export type EpicChild = EpicSubtask & {
  /** Keys of the items a `Blocks` link says this child is blocked by; absent where none. */
  blockedBy?: string[];
  /** The child's sub-tasks, one level down; absent where it has none. */
  subtasks?: EpicSubtask[];
};

/** One record as `jira-cli.mjs epic list` prints it. */
export type EpicRow = EpicTouch & {
  key: string;
  summary: string;
  status?: { name: string; statusCategory?: { key: string } };
  assignee?: { displayName?: string } | null;
  url?: string | null;
  codebases: Record<string, EpicTouch>;
  children: EpicChild[];
  childrenRefreshedAt?: string;
  childrenTruncated?: boolean;
  /** True once the user archived the epic; the list leaves it out unless asked. */
  archived?: boolean;
};

/** One item as `jira-cli.mjs recent list` prints it: a child row with the touch times of its own. */
export type RecentRow = EpicChild &
  EpicTouch & {
    codebases: Record<string, EpicTouch>;
    /** True once the user archived the item; the list leaves it out unless asked. */
    archived?: boolean;
  };

export type RecentGroup = {
  projectKey: string;
  name?: string;
  items: RecentRow[];
};

export type RecentListing = {
  codebase: string;
  filter: Filter;
  groups: RecentGroup[];
};

export type Listing = {
  codebase: string;
  filter: Filter;
  epics: EpicRow[];
};

export type ItemUser = { displayName?: string } | null;

export type ItemComment = {
  author?: { displayName?: string } | null;
  created?: string;
  updated?: string;
  /** Markdown. */
  body?: string;
};

/**
 * One work item as `jira-cli.mjs work-item get` prints it: the agent view,
 * the fields the item pane draws. Absent fields are absent, not null; an
 * `assignee` of null is an unassigned item.
 */
export type Item = {
  key: string;
  summary: string;
  status: { name: string; statusCategory?: { key: string } };
  issuetype: { name: string };
  priority?: { name: string };
  /** Null while the item is open. */
  resolution?: { name: string } | null;
  assignee?: ItemUser;
  reporter?: ItemUser;
  parent?: { key: string; summary?: string };
  labels?: string[];
  components?: { name: string }[];
  fixVersions?: { name: string }[];
  /** Date only, `YYYY-MM-DD`. */
  duedate?: string | null;
  created?: string;
  updated?: string;
  /** Markdown; null where the item has none. */
  description?: string | null;
  comments?: ItemComment[];
  /** The URL of the site that answered, `https://x.atlassian.net`. */
  site?: string | null;
  /** Comma-separated names of the fields the store cut short. */
  _truncated?: string;
};

/** The one work item the item pane shows, and how its read stands. */
export type ItemView = {
  /** The key asked for; null until a View press or `/jira-view KEY-1`. */
  key: string | null;
  /** The item last read for `key`; kept through a refresh, null until a first read lands. */
  item: Item | null;
  /** When `item` was read from Jira. */
  loadedAt: string | null;
  /** Why the last read failed; null once one succeeds. */
  error: string | null;
  isLoading: boolean;
};

declare module 'claude-code' {
  interface PluginState {
    // The quoted name is rewritten when a release renames the plugin (`assemble`); keep it quoted, and the only one here.
    // prettier-ignore
    'jira': {
      epics: EpicRow[];
      /** The recent work, by project, as `recent list` printed it. */
      recent: RecentGroup[];
      /** Keys of the projects whose items the Recent work tab hides. */
      collapsedProjects: string[];
      /** The key of the recent item whose actions the tab shows. */
      openRecent: string | null;
      /** Whether the tab shown is the person's choice, kept or pressed, and not the pane's first pick. */
      tabPicked: boolean;
      codebase: string;
      filter: Filter;
      /** The view the pane shows; the tab row switches it. */
      view: View;
      /** How far the body is scrolled, and for which view: the offset counts only while `view` is the one showing. */
      scroll: { view: View; offset: number };
      /** The colour mode; the toggle in the tab row switches it. */
      theme: Theme;
      /** Whether the pane opens by itself at session start. Off by default. */
      openAtStart: boolean;
      /** Whether the Epics tab (the epics list) is shown. On by default. */
      showEpicsTab: boolean;
      /** Whether the Recent work tab is shown. On by default. */
      showRecentWorkTab: boolean;
      /** Why the last change to a setting was refused; null once one goes through. */
      /** Whether `changes publish` previews the PR description and the comment: the stored review choices read as on. */
      reviewBeforePublishing: boolean;
      settingsNotice: string | null;
      expanded: string | null;
      /** Whether the list includes the archived epics. Off until asked. */
      showArchived: boolean;
      /** What the last Archive or Unarchive did or why it failed; null until one runs, replaced by the next. */
      listNotice: ListNotice | null;
      /** Keys of the stories whose sub-tasks the list shows. */
      expandedStories: string[];
      /** The key of the child row whose Open and action rows the Epics tab shows; null when none. */
      openChild: string | null;
      isLoading: boolean;
      busyKey: string | null;
      /** Key of the epic an archive or unarchive is running for; null otherwise. */
      archivingKey: string | null;
      lastError: string | null;
      lastListedAt: string | null;
      /** The epic the graph pane draws; null until a Graph press. */
      graphEpic: string | null;
      /** The node selected in the graph pane. */
      selected: string | null;
      /** The work item the item pane shows. */
      item: ItemView;
      /** Whether the item pane shows the comment thread. */
      itemComments: boolean;
    };
  }
}
