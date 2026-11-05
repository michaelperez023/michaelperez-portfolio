# Portfolio résumé

`resume.tex` is the source for the one-page general ML / computer vision résumé. Build it with:

```sh
sh documents/resume/build.sh
```

| Output | What it is |
| --- | --- |
| `public/files/Michael_Perez_Resume.pdf` | The PDF the website links to |
| `public/files/Resume.pdf` | The same file under its old name, so older links keep working |

The build **fails if the résumé is not exactly one page**.

Requires XeLaTeX (for example MacTeX) with the standard `geometry`, `enumitem`, and `hyperref` packages, and Times New Roman.

## Where the content comes from

Every fact is taken from the CV (`documents/cv/cv.tex`), the website content (`src/data/content.js`), or the owner's job-agent experience bank (`~/Desktop/job-agent/bank`). No proficiency is inferred. Conventions:

- Tools used at a job go under Technical Skills, not under the job.
- Contact links are written out (`linkedin.com/in/…`, `github.com/…`) so they survive plain-text extraction by applicant-tracking systems.
- Words are never hyphenated across lines, for the same reason.

## Keeping it to one full page

The body is 10.5-point Times New Roman on 12.9-point leading, with 0.7in side and 0.55in top and bottom margins. With the current content the page is full, with about two-thirds of a line to spare.

After adding or removing text, rebuild. If it spills onto a second page or leaves a visible gap, adjust in this order:

1. Reword a bullet that wraps by one or two words.
2. The section gap in `\ressection` (`\addvspace{9pt}`).
3. The leading in `\fontsize{10.5}{12.9}`.
4. `itemsep` in `\setlist`.

Leave the type size at 10.5pt or larger.
