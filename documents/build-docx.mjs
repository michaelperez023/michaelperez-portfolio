#!/usr/bin/env node
// Builds the Word version of a CV from its LaTeX source, so the Word file and the PDF
// always carry the same content.
//
//   node documents/build-docx.mjs <cv.tex> <out.docx> [--check cv.pdf]
//
// The source is read line by line, following \input{...} into the shared files. Only
// the commands handled below are understood; anything else stops the build and names
// the offending line, so content can never be dropped silently. `--check` compares
// every word in the finished .docx with the PDF built from the same source (needs
// `unzip` and `pdftotext`) and fails on any difference.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
  UnderlineType,
} from "docx";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const checkAt = argv.indexOf("--check");
const checkPdf = checkAt === -1 ? null : path.resolve(argv[checkAt + 1] ?? "");
const positional = argv.filter((a, i) => !a.startsWith("--") && (checkAt === -1 || i !== checkAt + 1));
const fail = (message) => {
  console.error(`build-docx: ${message}`);
  process.exit(1);
};
if (positional.length !== 2) fail("usage: node documents/build-docx.mjs <cv.tex> <out.docx> [--check cv.pdf]");
const source = path.resolve(positional[0]);
const outPath = path.resolve(positional[1]);

// Flatten the source: every line, with \input{file} replaced by that file's lines.
// Each line remembers where it came from for error messages.
function flatten(file, seen = []) {
  if (seen.includes(file)) fail(`\\input loop through ${file}`);
  if (!fs.existsSync(file)) fail(`cannot read ${file}`);
  const out = [];
  fs.readFileSync(file, "utf8").split("\n").forEach((text, i) => {
    const input = /^\s*\\input\{([^}]+)\}\s*$/.exec(text);
    if (!input) return out.push({ text, at: `${path.relative(here, file)} line ${i + 1}` });
    const target = path.resolve(path.dirname(file), input[1].endsWith(".tex") ? input[1] : `${input[1]}.tex`);
    out.push(...flatten(target, [...seen, file]));
  });
  return out;
}
const lines = flatten(source);
const tex = lines.map((l) => l.text).join("\n");

// ---------------------------------------------------------------- layout
// Page geometry and type size come straight from the LaTeX preamble; the spacing
// values below mirror the \cv... command definitions in shared/cv-preamble.tex.
const geometry = /\\usepackage\[left=([\d.]+)in,right=([\d.]+)in,top=([\d.]+)in,bottom=([\d.]+)in\]\{geometry\}/.exec(tex);
const basePt = Number(/\\documentclass\[(\d+)pt/.exec(tex)?.[1]);
const LEADING = { 10: 12, 11: 13.6, 12: 14.5 }[basePt]; // article-class baseline skip
if (!geometry || !LEADING) fail("could not read the page geometry or font size from the source");
const [marginL, marginR, marginT, marginB] = geometry.slice(1).map(Number);
const inch = (n) => Math.round(n * 1440); // twips
const pt = (n) => Math.round(n * 20); // twentieths of a point
const PAGE = { width: inch(8.5), height: inch(11) };
const TEXT_WIDTH = PAGE.width - inch(marginL) - inch(marginR);
const FONT = "Times New Roman";
const GAP = { title: 3, summary: 9, section: 11, afterRule: 5, subsection: 7, role: 5, service: 4, skill: 1.5, bulletFirst: 2, bullet: 1, number: 3 };
const LIST_INDENT = { bullets: { left: inch(0.3), hanging: inch(0.17) }, numbers: { left: inch(0.3), hanging: inch(0.22) } };

// ---------------------------------------------------------------- LaTeX reading
let current = "the source";
const where = () => current;

// src[i] must open a {group}; returns [contents, index after the closing brace].
function readGroup(src, i) {
  if (src[i] !== "{") fail(`${where()}: expected "{" at "${src.slice(i, i + 25)}"`);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "\\") j++;
    else if (src[j] === "{") depth++;
    else if (src[j] === "}" && --depth === 0) return [src.slice(i + 1, j), j + 1];
  }
  return fail(`${where()}: unbalanced braces`);
}

function readGroups(src, count) {
  const groups = [];
  let i = 0;
  for (let k = 0; k < count; k++) {
    const [group, next] = readGroup(src, i);
    groups.push(group);
    i = next;
  }
  if (src.slice(i).trim()) fail(`${where()}: unexpected text after the command: "${src.slice(i).trim()}"`);
  return groups;
}

const SYMBOLS = { "&": "&", "%": "%", "#": "#", _: "_", $: "$", " ": " " };
const INLINE = { textbf: 1, pubtitle: 1, textit: 1, underline: 1, mbox: 1, href: 2, me: 0 };

// Inline LaTeX -> [{text, bold?, italic?, underline?, link?}]
function inline(src, fmt = {}) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ ...fmt, text: buf });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const word = /^[a-zA-Z]+/.exec(src.slice(i + 1))?.[0];
      if (!word) {
        const symbol = src[i + 1];
        if (!(symbol in SYMBOLS)) fail(`${where()}: unsupported escape "\\${symbol}"`);
        buf += SYMBOLS[symbol];
        i += 2;
        continue;
      }
      if (!(word in INLINE)) fail(`${where()}: unsupported command "\\${word}"`);
      i += 1 + word.length;
      flush();
      if (word === "me") {
        while (src[i] === " ") i++; // TeX swallows spaces after a control word
        out.push({ ...fmt, underline: true, text: "M. F. Pérez" });
        continue;
      }
      const groups = [];
      for (let k = 0; k < INLINE[word]; k++) {
        const [group, next] = readGroup(src, i);
        groups.push(group);
        i = next;
      }
      if (word === "href") out.push(...inline(groups[1], { ...fmt, link: groups[0].replace(/\\([&%#_])/g, "$1") }));
      else if (word === "textbf" || word === "pubtitle") out.push(...inline(groups[0], { ...fmt, bold: true }));
      else if (word === "textit") out.push(...inline(groups[0], { ...fmt, italic: true }));
      else if (word === "underline") out.push(...inline(groups[0], { ...fmt, underline: true }));
      else out.push(...inline(groups[0], fmt));
      continue;
    }
    if (src.startsWith("``", i)) (buf += "“"), (i += 2);
    else if (src.startsWith("''", i)) (buf += "”"), (i += 2);
    else if (c === "`") (buf += "‘"), i++;
    else if (c === "'") (buf += "’"), i++;
    else if (c === "~") (buf += "\u00a0"), i++;
    else if (src.startsWith("---", i)) (buf += "—"), (i += 3);
    else if (src.startsWith("--", i)) (buf += "–"), (i += 2);
    else if ("{}$%".includes(c)) fail(`${where()}: unsupported character "${c}"`);
    else (buf += c), i++;
  }
  flush();
  return out;
}

// \command{..}{..} lines -> elements. ARITY doubles as the list of supported commands.
const ARITY = { cvname: 1, cvtitle: 1, cvcontact: 1, cvsummary: 1, cvsection: 1, cvsubsection: 1, cvrole: 4, cvaward: 2, cvservice: 3, cvskill: 2, cvref: 5 };

// One-line text macros defined before \begin{document}, e.g. \newcommand{\SkillML}{\cvskill{..}{..}}.
// A body line that is just such a macro is replaced by its definition.
const begin = lines.findIndex((l) => l.text.trim() === "\\begin{document}");
const finish = lines.findIndex((l) => l.text.trim() === "\\end{document}");
if (begin === -1 || finish === -1) fail("the source has no \\begin{document} ... \\end{document}");
const macros = new Map();
for (const { text } of lines.slice(0, begin)) {
  const def = /^\\newcommand\{\\([A-Za-z]+)\}\{(.*)\}\s*$/.exec(text);
  if (def && !(def[1] in ARITY) && !(def[1] in INLINE)) macros.set(def[1], def[2]);
}

const elements = [];
let list = null;
let numberedLists = 0;
for (const { text, at } of lines.slice(begin + 1, finish)) {
  current = at;
  let line = text.trim();
  if (!line || line.startsWith("%")) continue;
  const macro = /^\\([A-Za-z]+)$/.exec(line)?.[1];
  if (macro && macros.has(macro)) line = macros.get(macro);
  if (line === "\\begin{itemize}") list = { kind: "bullets", count: 0 };
  else if (line === "\\begin{enumerate}") list = { kind: "numbers", count: 0, instance: ++numberedLists };
  else if (line === "\\end{itemize}" || line === "\\end{enumerate}") list = null;
  else if (line.startsWith("\\item ")) {
    if (!list) fail(`${where()}: \\item outside a list`);
    elements.push({ type: "item", kind: list.kind, instance: list.instance, first: list.count++ === 0, segs: inline(line.slice(6).trim()) });
  } else {
    const name = /^\\([a-zA-Z]+)/.exec(line)?.[1];
    if (!name || !(name in ARITY)) fail(`${where()}: not a recognised CV command: "${line.slice(0, 60)}"`);
    if (list) fail(`${where()}: \\${name} inside a list`);
    elements.push({ type: name, args: readGroups(line.slice(name.length + 1), ARITY[name]) });
  }
}

// ---------------------------------------------------------------- Word writing
function runs(segs, extra = {}) {
  return segs.map((seg) => {
    const run = new TextRun({
      text: seg.text,
      bold: seg.bold || extra.bold || undefined,
      italics: seg.italic || undefined,
      underline: seg.underline ? { type: UnderlineType.SINGLE } : undefined,
      size: extra.size,
    });
    return seg.link ? new ExternalHyperlink({ link: seg.link, children: [run] }) : run;
  });
}
const bold = (latex) => runs(inline(latex), { bold: true });
const plain = (latex) => runs(inline(latex));

// "left text ............ right text" on one line, like \cvrow
function row(left, right, { before = 0, keepNext = false } = {}) {
  const children = [...left];
  if (right.length) children.push(new TextRun({ children: [new Tab()] }), ...right);
  return new Paragraph({
    children,
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
    spacing: { before: pt(before) },
    keepNext,
    keepLines: true,
  });
}

const paragraphs = [];
elements.forEach((el, index) => {
  const a = el.args;
  const nextIsItem = elements[index + 1]?.type === "item";
  switch (el.type) {
    case "cvname":
      paragraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: pt(2) }, children: runs(inline(a[0]), { bold: true, size: 36 }) }));
      break;
    case "cvtitle":
      paragraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: pt(GAP.title) }, children: runs(inline(a[0]), { size: 24 }) }));
      break;
    case "cvcontact":
      paragraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: plain(a[0]) }));
      break;
    case "cvsummary":
      paragraphs.push(new Paragraph({ spacing: { before: pt(GAP.summary) }, children: plain(a[0]) }));
      break;
    case "cvsection":
      paragraphs.push(
        new Paragraph({
          spacing: { before: pt(GAP.section), after: pt(GAP.afterRule) },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 2, color: "000000" } },
          keepNext: true,
          children: inline(a[0]).map((seg) => new TextRun({ text: seg.text.toUpperCase(), bold: true, size: 24 })),
        })
      );
      break;
    case "cvsubsection":
      paragraphs.push(new Paragraph({ spacing: { before: pt(GAP.subsection), after: pt(1) }, keepNext: true, children: bold(a[0]) }));
      break;
    case "cvrole":
      paragraphs.push(row(bold(a[0]), plain(a[1]), { before: GAP.role, keepNext: true }));
      paragraphs.push(row(plain(a[2]), plain(a[3]), { keepNext: nextIsItem }));
      break;
    case "cvaward":
      paragraphs.push(row(bold(a[0]), plain(a[1]), { before: GAP.role, keepNext: nextIsItem }));
      break;
    case "cvservice":
      paragraphs.push(row([...bold(a[0]), ...plain(`, ${a[1]}`)], plain(a[2]), { before: GAP.service }));
      break;
    case "cvskill":
      paragraphs.push(new Paragraph({ spacing: { after: pt(GAP.skill) }, children: [...bold(`${a[0]}:`), ...plain(` ${a[1]}`)] }));
      break;
    case "cvref":
      paragraphs.push(row([...bold(a[0]), ...plain(`, ${a[1]}`)], plain(`\\href{mailto:${a[2]}}{${a[2]}}`), { before: GAP.role, keepNext: true }));
      paragraphs.push(row(plain(a[3]), plain(a[4])));
      break;
    case "item":
      paragraphs.push(
        new Paragraph({
          numbering: { reference: el.kind, level: 0, instance: el.instance ?? 0 },
          spacing: { before: pt(el.kind === "numbers" ? GAP.number : el.first ? GAP.bulletFirst : GAP.bullet) },
          keepLines: el.kind === "numbers", // never split one publication entry across pages
          children: runs(el.segs),
        })
      );
      break;
    default:
      fail(`no Word layout for \\${el.type}`);
  }
});

const level = (format, text, indent) => ({
  level: 0,
  format,
  text,
  alignment: AlignmentType.LEFT,
  style: { paragraph: { indent }, run: { font: FONT } },
});
const title = /pdftitle=\{([^}]*)\}/.exec(tex)?.[1] ?? "Curriculum Vitae";
const author = /pdfauthor=\{([^}]*)\}/.exec(tex)?.[1] ?? "";
const doc = new Document({
  creator: author,
  title,
  description: `Generated from ${path.relative(path.dirname(here), source)} by build-docx.mjs`,
  styles: {
    default: {
      document: {
        run: { font: FONT, size: basePt * 2 },
        paragraph: { spacing: { line: pt(LEADING), lineRule: LineRuleType.AT_LEAST } },
      },
    },
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [level(LevelFormat.BULLET, "•", LIST_INDENT.bullets)] },
      { reference: "numbers", levels: [level(LevelFormat.DECIMAL, "%1.", LIST_INDENT.numbers)] },
    ],
  },
  sections: [
    {
      properties: { page: { size: PAGE, margin: { top: inch(marginT), bottom: inch(marginB), left: inch(marginL), right: inch(marginR) } } },
      children: paragraphs,
    },
  ],
});

fs.writeFileSync(outPath, await Packer.toBuffer(doc));
console.log(`Built ${path.relative(process.cwd(), outPath)} (${paragraphs.length} paragraphs)`);

// ---------------------------------------------------------------- check against the PDF
if (checkPdf) {
  const words = (text) => text.normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
  const xml = execFileSync("unzip", ["-p", outPath, "word/document.xml"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const docxText = xml
    .split("</w:p>")
    .map((p) => [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map((m) => (m[1] === undefined ? " " : unescape(m[1]))).join(""))
    .join("\n");
  // In the PDF, list bullets and item numbers are printed text; in Word they are automatic.
  const pdfText = execFileSync("pdftotext", ["-layout", checkPdf, "-"], { encoding: "utf8", maxBuffer: 1 << 26 })
    .split("\n")
    .map((l) => l.replace(/^\s*(?:•|\d{1,2}\.)\s+/, " "))
    .join("\n");
  const [fromDocx, fromPdf] = [words(docxText), words(pdfText)];
  let at = 0;
  while (at < fromDocx.length && fromDocx[at] === fromPdf[at]) at++;
  if (at !== fromDocx.length || at !== fromPdf.length) {
    const show = (list) => list.slice(Math.max(0, at - 6), at + 6).join(" ");
    fail(`the Word file and the PDF differ at word ${at + 1}:\n  Word: … ${show(fromDocx)} …\n  PDF : … ${show(fromPdf)} …`);
  }
  console.log(`Checked: the Word file and the PDF contain the same ${fromDocx.length} words in the same order.`);
}
