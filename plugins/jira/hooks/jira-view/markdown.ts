/**
 * A small markdown reader for a work item's description and comments, so the
 * pane draws them in its own palette. The engine's Markdown element draws in
 * the engine theme's colours and takes none, so over the pane's backdrop in
 * the other mode it is unreadable. What Jira's agent view writes is covered:
 * headings, paragraphs, bullet and numbered lists with continuation lines,
 * quotes, fenced code, and inline code, bold, italic and links. Anything
 * else is drawn as the text it is.
 */

/** One run of a line, styled as the markdown marks it. */
export type Span = {
  text: string;
  style?: 'code' | 'bold' | 'italic' | 'link';
  /** The link's target, for a `link` span. */
  href?: string;
};

export type Block =
  | { kind: 'heading'; level: number; spans: Span[] }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'item'; marker: string; indent: number; spans: Span[] }
  | { kind: 'quote'; spans: Span[] }
  | { kind: 'code'; lines: string[] };

const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(\*[^*\s][^*]*\*)|(\b_[^_\s][^_]*_\b)/g;

/** The runs of one line: code, bold, italic and links picked out of the text. */
export function spansOf(text: string): Span[] {
  const spans: Span[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > at) spans.push({ text: text.slice(at, start) });
    const [whole, code, bold, link, star, under] = m;
    if (code !== undefined) spans.push({ text: code.slice(1, -1), style: 'code' });
    else if (bold !== undefined) spans.push({ text: bold.slice(2, -2), style: 'bold' });
    else if (link !== undefined) {
      const close = link.indexOf('](');
      spans.push({ text: link.slice(1, close), style: 'link', href: link.slice(close + 2, -1) });
    } else if (star !== undefined || under !== undefined)
      spans.push({ text: whole.slice(1, -1), style: 'italic' });
    at = start + whole.length;
  }
  if (at < text.length) spans.push({ text: text.slice(at) });
  return spans;
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const FENCE = /^\s*(```|~~~)/;

/** The blocks of a markdown text, in order. */
export function blocksOf(markdown: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let code: string[] | null = null;
  const flush = () => {
    if (paragraph.length > 0)
      blocks.push({ kind: 'paragraph', spans: spansOf(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\t/g, '    ');
    if (code !== null) {
      if (FENCE.test(line)) {
        blocks.push({ kind: 'code', lines: code });
        code = null;
      } else code.push(line);
      continue;
    }
    if (FENCE.test(line)) {
      flush();
      code = [];
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading !== null) {
      flush();
      blocks.push({
        kind: 'heading',
        level: heading[1]?.length ?? 1,
        spans: spansOf(heading[2] ?? ''),
      });
      continue;
    }
    const item = ITEM.exec(line);
    if (item !== null) {
      flush();
      blocks.push({
        kind: 'item',
        marker: /^\d/.test(item[2] ?? '') ? (item[2] ?? '') : '-',
        indent: Math.floor((item[1]?.length ?? 0) / 2),
        spans: spansOf(item[3] ?? ''),
      });
      continue;
    }
    const quote = QUOTE.exec(line);
    if (quote !== null) {
      flush();
      blocks.push({ kind: 'quote', spans: spansOf(quote[1] ?? '') });
      continue;
    }
    // An indented line after an item continues it, as the item's own text.
    const last = blocks.at(-1);
    if (paragraph.length === 0 && last?.kind === 'item' && /^\s/.test(line)) {
      last.spans.push({ text: ' ' }, ...spansOf(line.trim()));
      continue;
    }
    paragraph.push(line.trim());
  }
  if (code !== null) blocks.push({ kind: 'code', lines: code });
  flush();
  return blocks;
}
