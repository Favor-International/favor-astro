// Pull comments out of a .docx along with the text each one is anchored to.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2];
const out = process.argv[3];

const commentsXml = readFileSync(`${dir}/word/comments.xml`, 'utf8');
const docXml = readFileSync(`${dir}/word/document.xml`, 'utf8');

const decode = (s) =>
  s
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

// --- comments themselves ---
const comments = new Map();
for (const m of commentsXml.matchAll(/<w:comment\b([^>]*)>([\s\S]*?)<\/w:comment>/g)) {
  const attrs = m[1];
  const id = /w:id="([^"]+)"/.exec(attrs)?.[1];
  const author = /w:author="([^"]*)"/.exec(attrs)?.[1] ?? '';
  const date = /w:date="([^"]*)"/.exec(attrs)?.[1] ?? '';
  comments.set(id, { id, author, date, text: decode(m[2]).trim() });
}

// --- anchors: walk document.xml tracking open comment ranges ---
const anchors = new Map(); // id -> accumulated text
const open = new Set();
const tokenRe =
  /<w:commentRangeStart w:id="([^"]+)"\/>|<w:commentRangeEnd w:id="([^"]+)"\/>|<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:p\b[^>]*\/?>|<w:commentReference w:id="([^"]+)"\/>/g;

// track document order so we can report comments in reading order
const order = [];
let m;
while ((m = tokenRe.exec(docXml)) !== null) {
  if (m[1] !== undefined) {
    open.add(m[1]);
    if (!anchors.has(m[1])) anchors.set(m[1], '');
    order.push(m[1]);
  } else if (m[2] !== undefined) {
    open.delete(m[2]);
  } else if (m[3] !== undefined) {
    const t = decode(m[3]);
    for (const id of open) anchors.set(id, anchors.get(id) + t);
  } else if (m[4] !== undefined) {
    if (!anchors.has(m[4])) {
      anchors.set(m[4], '');
      order.push(m[4]);
    }
  } else {
    for (const id of open) anchors.set(id, anchors.get(id) + ' ');
  }
}

const seen = new Set();
const lines = [];
let n = 0;
for (const id of order) {
  if (seen.has(id)) continue;
  seen.add(id);
  const c = comments.get(id);
  if (!c) continue;
  n++;
  const anchor = (anchors.get(id) ?? '').replace(/\s+/g, ' ').trim();
  lines.push(
    `### COMMENT ${n} (id=${id}) — ${c.author} — ${c.date}\n` +
      `HIGHLIGHTED: ${anchor || '(no anchored text)'}\n` +
      `COMMENT: ${c.text}\n`
  );
}

// any comments never referenced in document order
for (const [id, c] of comments) {
  if (seen.has(id)) continue;
  n++;
  lines.push(
    `### COMMENT ${n} (id=${id}, orphan) — ${c.author} — ${c.date}\n` +
      `HIGHLIGHTED: (unanchored)\nCOMMENT: ${c.text}\n`
  );
}

writeFileSync(out, `TOTAL COMMENTS: ${comments.size}\n\n` + lines.join('\n'), 'utf8');
console.log(`comments: ${comments.size}, written to ${out}`);
