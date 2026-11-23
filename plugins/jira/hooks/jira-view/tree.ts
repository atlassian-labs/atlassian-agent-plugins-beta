// A folder-tree layout for a small dependency graph, for the terminal: one
// row per node, indented under the blocker it hangs from, with box-drawing
// connectors down the left as a file tree draws them. A node with several
// blockers hangs under the deepest and is listed again, as a reference, under
// each other one. Pure, so the hooks module stays thin and this is testable
// without an engine.

/** What the layout needs of a node: its key and the keys it is blocked by. */
export type Linked = { readonly key: string; readonly blockedBy?: readonly string[] };

/** An edge from a blocker to the node it blocks. */
export type Edge = readonly [from: string, to: string];

/** One two-column cell of a row's connector prefix, and the edges that run through it. */
export type Cell = { text: string; edges: Edge[] };

export type Row = {
  /** `node`: the key's own row; `ref`: the key listed again under another blocker. */
  kind: 'node' | 'ref';
  key: string;
  /** The blocker this row hangs under; null for a root. */
  parent: string | null;
  depth: number;
  /** The connector prefix, `depth` cells of two columns each. */
  cells: Cell[];
  /** For a `ref`, whether the key's own row is above or below this one. */
  points?: 'above' | 'below';
};

export type Tree = {
  rows: Row[];
  edges: Edge[];
  /** True when the links contain a cycle; the tree still draws, with the cycle broken. */
  hasCycle: boolean;
};

/** Columns one cell of the connector prefix takes. */
export const CELL_WIDTH = 2;

const BAR = '│ ';
const BLANK = '  ';
const TEE = '├─';
const ELBOW = '└─';

/** The edges among `nodes`, dropping links to keys outside the set. */
export const edgesOf = (nodes: readonly Linked[]): Edge[] => {
  const keys = new Set(nodes.map((n) => n.key));
  const edges: Edge[] = [];
  for (const n of nodes) {
    for (const b of n.blockedBy ?? []) {
      if (keys.has(b) && b !== n.key) edges.push([b, n.key]);
    }
  }
  return edges;
};

/** Longest-path layering. Returns the layer of each key and whether a cycle was found. */
const layerOf = (nodes: readonly Linked[], edges: readonly Edge[]) => {
  const layer = new Map<string, number>(nodes.map((n) => [n.key, 0]));
  let hasCycle = false;
  for (let pass = 0; ; pass++) {
    let changed = false;
    for (const [from, to] of edges) {
      const want = (layer.get(from) ?? 0) + 1;
      if (want > (layer.get(to) ?? 0)) {
        layer.set(to, want);
        changed = true;
      }
    }
    if (!changed) break;
    if (pass > nodes.length) {
      hasCycle = true;
      break;
    }
  }
  return { layer, hasCycle };
};

type Branch = { kind: 'node' | 'ref'; key: string; children: Branch[] };

export const tree = (nodes: readonly Linked[]): Tree => {
  const allEdges = edgesOf(nodes);
  const { layer, hasCycle } = layerOf(nodes, allEdges);
  // With a cycle the relaxation overshoots; keep only edges that point downward.
  const edges = allEdges.filter(([f, t]) => (layer.get(f) ?? 0) < (layer.get(t) ?? 0));

  // Each node hangs under its deepest blocker, so its depth is its layer and
  // every blocker sits above it; its other blockers list it as a reference.
  const home = new Map<string, string>();
  for (const [from, to] of edges) {
    const cur = home.get(to);
    if (cur === undefined || (layer.get(from) ?? 0) > (layer.get(cur) ?? 0)) home.set(to, from);
  }
  const branches = new Map<string, Branch>(
    nodes.map((n) => [n.key, { kind: 'node', key: n.key, children: [] }]),
  );
  // Children in the nodes' own order under each parent, own rows and references alike.
  for (const n of nodes) {
    for (const [from, to] of edges) {
      if (to !== n.key) continue;
      const parent = branches.get(from);
      const child = branches.get(to);
      if (!parent || !child) continue;
      parent.children.push(home.get(to) === from ? child : { kind: 'ref', key: to, children: [] });
    }
  }
  const roots = nodes.flatMap((n) => {
    const branch = branches.get(n.key);
    return branch && !home.has(n.key) ? [branch] : [];
  });

  const rows: Row[] = [];
  const walk = (branch: Branch, parent: string | null, prefix: Cell[], later: Branch[]) => {
    const cells =
      parent === null
        ? prefix
        : [
            ...prefix,
            {
              text: later.length ? TEE : ELBOW,
              edges: [[parent, branch.key] as Edge],
            },
          ];
    rows.push({ kind: branch.kind, key: branch.key, parent, depth: cells.length, cells });
    // Below this row, this column carries the edges from the parent on to the
    // later siblings, or nothing once this was the last.
    const bar: Cell =
      parent === null
        ? { text: BLANK, edges: [] }
        : later.length
          ? { text: BAR, edges: later.map((s) => [parent, s.key] as Edge) }
          : { text: BLANK, edges: [] };
    const below = parent === null ? prefix : [...prefix, bar];
    branch.children.forEach((child, i) =>
      walk(child, branch.key, below, branch.children.slice(i + 1)),
    );
  };
  for (const root of roots) walk(root, null, [], []);

  const rowOf = new Map(rows.flatMap((r, i) => (r.kind === 'node' ? [[r.key, i] as const] : [])));
  rows.forEach((r, i) => {
    if (r.kind === 'ref') r.points = (rowOf.get(r.key) ?? 0) < i ? 'above' : 'below';
  });

  return { rows, edges, hasCycle };
};

/**
 * Runs of consecutive cells sharing a tone, for drawing one prefix as a few
 * Text spans. A cell's tone is the first its edges are given; the edges of
 * one cell all leave the same node, so they agree on it.
 */
export const spans = <T>(cells: readonly Cell[], toneOf: (edge: Edge) => T | undefined) => {
  const out: { text: string; tone: T | undefined }[] = [];
  for (const cell of cells) {
    const tone = cell.edges.map(toneOf).find((t) => t !== undefined);
    const last = out[out.length - 1];
    if (last && last.tone === tone) last.text += cell.text;
    else out.push({ text: cell.text, tone });
  }
  return out;
};

/** Every node downstream of `key`: the transitive closure over the edges, in the nodes' own order. */
export const downstreamOf = (nodes: readonly Linked[], key: string): string[] => {
  const dependants = new Map<string, string[]>();
  for (const [from, to] of edgesOf(nodes)) {
    const list = dependants.get(from);
    if (list) list.push(to);
    else dependants.set(from, [to]);
  }
  const out: string[] = [];
  const seen = new Set<string>([key]);
  const queue = [key];
  for (let cur = queue.shift(); cur !== undefined; cur = queue.shift()) {
    for (const to of dependants.get(cur) ?? []) {
      if (seen.has(to)) continue;
      seen.add(to);
      out.push(to);
      queue.push(to);
    }
  }
  const order = new Map(nodes.map((n, i) => [n.key, i]));
  return out.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
};
