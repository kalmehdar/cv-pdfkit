# cv-pdfkit

A tight, single-page A4 CV generator built with [PDFKit](https://pdfkit.org/).
Your data lives in one JSON file. The layout is ~250 lines of Node.

## Why

Most people generate their CV in Microsoft Word and end up with:

- A two-column layout that breaks on a recruiter's older Office install
- Accent characters that mangle when an ATS parses the PDF
- A "tracked changes" panel they forgot to clean before sending
- No version history, no diff between the Google variant and the Amazon variant

A CV-as-code skips all of that. The output is identical on every machine.
You version-control your CV with the rest of your career artefacts.
You can branch a tailored CV per company by editing JSON, not retyping in Word.

## Output

A single-page A4 PDF with this structure:

```
NAME (23pt bold)
title line · contact line
─────────────────────────────────────
SUMMARY        (8.5pt heading, letter-spaced, hairline rule)
short paragraph...
─────────────────────────────────────
EXPERIENCE
Role — Company                                Jun 2025 – Sep 2025
italic context line
  • bullet
  • bullet
─────────────────────────────────────
EDUCATION
─────────────────────────────────────
KEY COMPETENCIES    (3-column table)
─────────────────────────────────────
CERTIFICATIONS
─────────────────────────────────────
TOOLS
─────────────────────────────────────
italic footer line
```

Monochrome on purpose. No icons, no logos, no fancy fonts. Looks
neutral to an ATS, looks intentional to a human.

## Quick start

```bash
git clone https://github.com/kalmehdar/cv-pdfkit.git
cd cv-pdfkit
npm install
cp cv.example.json cv.json
# Edit cv.json with your data
node build.js cv.json out.pdf
```

That's it. Open `out.pdf`.

## The JSON schema

Every key is optional except `name`. Empty sections are silently skipped.

```jsonc
{
  "name": "Required",
  "title": "Optional — appears under name",
  "email": "", "phone": "", "location": "", "website": "", "linkedin": "",
  "summary": "1-3 sentence summary paragraph",
  "experience": [
    {
      "position": "Role title",
      "company": "Employer",
      "dates": "Start – End",
      "context": "Optional italic line below the role",
      "bullets": ["Achievement 1", "Achievement 2", "Achievement 3"]
    }
  ],
  "education": [
    {
      "qualification": "BSc (Hons) Computer Science",
      "institution": "University name",
      "dates": "2023 – 2026",
      "grade": "Optional grade/detail line"
    }
  ],
  "competencies": {
    "headers": ["COL A", "COL B", "COL C"],
    "columns": [["item", "item"], ["item"], ["item", "item", "item"]]
  },
  "certifications": ["Cert 1 (year)", "Cert 2 (year)"],
  "tools": ["VS Code", "Git", "..."],
  "footer": "Optional italic note at the bottom (e.g. work auth status)"
}
```

See [`cv.example.json`](cv.example.json) for a fully populated sample.

## How tight is "tight"?

The script logs how many points of the 812-point usable A4 height your
CV consumed. Anything over 812 will overflow to a second page; if that
happens, trim content. Most CVs land between 700 and 810 pt.

## Why monochrome + Helvetica

- ATS parsers love system fonts. Anything from Google Fonts works visually
  but loses structure on parsing.
- Single colour prints fine on bad printers. Recruiters still print CVs.
- Hairline rules + letter-spaced section heads do the visual work that
  colour would do, without confusing the parser.

## Tailoring per company

Branch the JSON, not the code. A typical workflow:

```bash
cp cv.json cv-acme.json
# Edit cv-acme.json: tailor the summary, reorder bullets, drop irrelevant
# role contexts, swap a tool that matches what Acme uses.
node build.js cv-acme.json cv-acme.pdf
```

`git diff cv.json cv-acme.json` shows exactly what you tailored — useful
when the next Acme-shaped company comes around.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgements

Built on [PDFKit](https://github.com/foliojs/pdfkit). All credit to that
team for the underlying engine.
