#!/usr/bin/env node
/**
 * cv-pdfkit — Build a tight, single-page A4 CV as a PDF.
 *
 * Run with:
 *   node build.js                  # uses cv.example.json, writes cv.pdf
 *   node build.js my-cv.json out.pdf
 *
 * Why PDFKit and not Word / a Markdown converter?
 *   - You get pixel-level control over the layout. Recruiters complain that
 *     two-column .docx CVs reformat unpredictably in different versions of
 *     Word, lose accents, or fail an ATS parse. PDF-from-code never moves.
 *   - The template is a function of your data, in version control.
 *     Tailor a CV per company by branching the JSON, not retyping in Word.
 *   - Single page A4, monochrome, system-font. Looks neutral and prints
 *     cleanly. Letter-spaced section heads + hairline rules keep it tidy
 *     without being designer-y.
 *
 * The layout: header (name + contact) → summary → experience → education
 * → competency table (3 cols) → tools. Roughly 800pt of usable A4 height
 * (829pt total minus 30pt top margin); the template aims for ~800.
 */

'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────

const inputArg = process.argv[2] || 'cv.example.json';
const outputArg = process.argv[3] || 'cv.pdf';

const cvPath = path.resolve(inputArg);
const outPath = path.resolve(outputArg);

if (!fs.existsSync(cvPath)) {
  console.error(`Input file not found: ${cvPath}`);
  console.error(`Copy cv.example.json to cv.json and edit it, or pass a path.`);
  process.exit(1);
}

const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));

// ── PDF setup ─────────────────────────────────────────────────────────────

const doc = new PDFDocument({
  size: 'A4',
  autoFirstPage: false,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
});
doc.pipe(fs.createWriteStream(outPath));
doc.addPage();

// A4 = 595.28 × 841.89 pt; usable height after 30pt top = 812
const PW = 595.28;
const ML = 40,
  MR = 40;
const CW = PW - ML - MR;

const BLACK = '#111111';
const DIM = '#555555';
const RULE = '#BBBBBB';
const ACCENT = '#111111';

let cy = 30;

// ── Primitives ────────────────────────────────────────────────────────────

function gap(n) {
  cy += n;
}

function drawRule(color, lineW) {
  doc
    .moveTo(ML, cy)
    .lineTo(ML + CW, cy)
    .strokeColor(color || RULE)
    .lineWidth(lineW || 0.6)
    .stroke();
}

function sectionHead(title) {
  gap(4);
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(ACCENT)
    .text(title, ML, cy, { characterSpacing: 1.2, width: CW });
  cy = doc.y + 1;
  drawRule();
  gap(3);
}

function entryRow(title, date) {
  const savedY = cy;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(DIM)
    .text(date, ML, savedY, { width: CW, align: 'right' });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(BLACK)
    .text(title, ML, savedY, { width: CW - 100 });
  cy = doc.y;
}

function subLine(text) {
  doc
    .font('Helvetica-Oblique')
    .fontSize(8.5)
    .fillColor(DIM)
    .text(text, ML, cy, { width: CW });
  cy = doc.y;
}

function bullet(text, fsize) {
  const sz = fsize || 8.5;
  const bulletX = ML + 8;
  const textX = ML + 17;
  const savedY = cy;
  doc
    .font('Helvetica')
    .fontSize(6)
    .fillColor(DIM)
    .text('•', bulletX, savedY + 1.5, { lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(sz)
    .fillColor(BLACK)
    .text(text, textX, savedY, { width: CW - 17, lineGap: 0.2 });
  cy = doc.y + 1.2;
}

function competencyTable(headers, columns) {
  const colW = CW / columns.length;
  const fsz = 8;
  const headerY = cy;
  headers.forEach((h, i) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(fsz)
      .fillColor(ACCENT)
      .text(h, ML + i * colW, headerY, { width: colW - 5 });
  });
  cy =
    headerY +
    doc
      .font('Helvetica-Bold')
      .fontSize(fsz)
      .heightOfString(headers[0], { width: colW - 5 }) +
    2;
  const maxRows = Math.max(...columns.map((c) => c.length));
  for (let r = 0; r < maxRows; r++) {
    const rowY = cy;
    let maxH = 0;
    columns.forEach((col) => {
      if (col[r]) {
        const h = doc
          .font('Helvetica')
          .fontSize(fsz)
          .heightOfString(col[r], { width: colW - 8 });
        if (h > maxH) maxH = h;
      }
    });
    columns.forEach((col, i) => {
      if (col[r]) {
        doc
          .font('Helvetica')
          .fontSize(fsz)
          .fillColor(BLACK)
          .text(col[r], ML + i * colW, rowY, { width: colW - 8 });
      }
    });
    cy = rowY + maxH + 1.5;
  }
}

// ── HEADER ────────────────────────────────────────────────────────────────

doc
  .font('Helvetica-Bold')
  .fontSize(23)
  .fillColor(BLACK)
  .text(cv.name, ML, cy, { width: CW, characterSpacing: 0.5 });
cy = doc.y;

if (cv.title) {
  gap(2);
  doc.font('Helvetica').fontSize(10).fillColor(DIM).text(cv.title, ML, cy, { width: CW });
  cy = doc.y;
}

gap(4);
const contactParts = [cv.email, cv.phone, cv.location, cv.website, cv.linkedin].filter(Boolean);
doc
  .font('Helvetica')
  .fontSize(8.5)
  .fillColor(BLACK)
  .text(contactParts.join('  ·  '), ML, cy, { width: CW });
cy = doc.y + 4;
drawRule(BLACK, 0.8);

// ── SUMMARY ───────────────────────────────────────────────────────────────

if (cv.summary) {
  sectionHead('SUMMARY');
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(BLACK)
    .text(cv.summary, ML, cy, { width: CW, lineGap: 0.5 });
  cy = doc.y + 2;
}

// ── EXPERIENCE ────────────────────────────────────────────────────────────

if (cv.experience && cv.experience.length) {
  sectionHead('EXPERIENCE');
  for (const role of cv.experience) {
    entryRow(`${role.position} — ${role.company}`, role.dates);
    if (role.context) subLine(role.context);
    gap(1);
    for (const b of role.bullets || []) bullet(b);
    gap(3);
  }
}

// ── EDUCATION ─────────────────────────────────────────────────────────────

if (cv.education && cv.education.length) {
  sectionHead('EDUCATION');
  for (const ed of cv.education) {
    entryRow(`${ed.qualification} — ${ed.institution}`, ed.dates);
    if (ed.grade) subLine(ed.grade);
    gap(2);
  }
}

// ── COMPETENCIES ──────────────────────────────────────────────────────────

if (cv.competencies && cv.competencies.headers) {
  sectionHead('KEY COMPETENCIES');
  competencyTable(cv.competencies.headers, cv.competencies.columns);
  gap(3);
}

// ── CERTIFICATIONS ────────────────────────────────────────────────────────

if (cv.certifications && cv.certifications.length) {
  sectionHead('CERTIFICATIONS');
  for (const c of cv.certifications) bullet(c);
  gap(2);
}

// ── TOOLS / TECH ──────────────────────────────────────────────────────────

if (cv.tools && cv.tools.length) {
  sectionHead('TOOLS');
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(BLACK)
    .text(cv.tools.join(' · '), ML, cy, { width: CW, lineGap: 0.5 });
  cy = doc.y + 2;
}

// ── NOTE / AUTHORISATION (e.g. "Right to work in UK") ─────────────────────

if (cv.footer) {
  gap(4);
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .fillColor(DIM)
    .text(cv.footer, ML, cy, { width: CW });
}

doc.end();

console.log(`Wrote ${outPath} (used ${Math.round(cy)}pt of 812pt usable height)`);
