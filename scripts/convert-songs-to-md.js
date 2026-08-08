#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(__filename);
const INPUT = path.join(SCRIPTS_DIR, 'songs.csv');
const OUT_DIR = path.join(SCRIPTS_DIR, 'songs');

if (!fs.existsSync(INPUT)) {
  console.error('Input file not found:', INPUT);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const raw = fs.readFileSync(INPUT, 'utf8').replace(/\r\n?/g, '\n');
const lines = raw.split('\n');

function parseCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols.map(s => s.trim());
}

function yamlSafe(val) {
  if (!val) return '';
  const needsQuotes = /[:\n\"]/.test(val) || /^\s|\s$/.test(val);
  if (!needsQuotes) return val;
  return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function slugify(s) {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-]+|[-]+$/g, '')
    .toLowerCase()
    .slice(0, 100);
}

// find header (first non-empty line) and skip it
let i = 0;
while (i < lines.length && lines[i].trim() === '') i++;
if (i >= lines.length) {
  console.error('No data in', INPUT);
  process.exit(1);
}
const headerIndex = i;
const dataStart = headerIndex + 1;

const used = new Map();
let created = 0;

for (let j = dataStart; j < lines.length; j++) {
  const line = lines[j];
  if (!line || !line.trim()) continue;
  const cols = parseCSVLine(line);
  const title = (cols[0] || '').trim();
  const artist = (cols[1] || '').trim();
  if (!title && !artist) continue;

  let base = slugify(title || artist || `song-${j}`) || `song-${j}`;
  let name = base;
  let suffix = 1;
  while (used.has(name)) {
    suffix += 1;
    name = `${base}-${suffix}`;
  }
  used.set(name, true);

  const filename = path.join(OUT_DIR, `${name}.md`);
  const content = `---\ntitle: ${yamlSafe(title)}\nartist: ${yamlSafe(artist)}\n---\n`;
  fs.writeFileSync(filename, content, 'utf8');
  created += 1;
}

console.log(`Created ${created} markdown files in ${OUT_DIR}`);
