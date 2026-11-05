# CVs and résumés

Four master sets, each a CV and a one-page résumé, built from one shared set of facts:

| Folder | For | Leads with |
| --- | --- | --- |
| `general/` | Anyone: friends forwarding it, recruiters, the website | The same content as the ML Engineer pair, plus a sentence saying which roles he is open to (it travels without a cover letter). **This pair is what the website serves.** |
| `ml-engineer/` | ML Engineer / Applied AI | Industry experience, ML and MLOps skills |
| `research-scientist/` | Research Scientist / Applied Scientist | Education, research experience, publications |
| `software-engineer/` | Software Engineer / ML Infrastructure | Industry experience, languages and infrastructure, projects |

## Build

```sh
sh documents/build.sh                      # everything
sh documents/build.sh research-scientist   # one variant
```

For each variant this writes to `documents/out/<variant>/` (not committed):

| File | What it is |
| --- | --- |
| `Michael_Perez_CV.pdf` | The CV |
| `Michael_Perez_CV.docx` | The same CV as a Word file |
| `Michael_Perez_Resume.pdf` | The one-page résumé |

The build stops with an error if a Word CV and its PDF do not contain the same words in the same order, or if a résumé is not exactly one page.

The `general` pair is copied to `public/files/` as `Michael_Perez_CV.pdf` and `Michael_Perez_Resume.pdf` (and as `CV.pdf` and `Resume.pdf`, so older links keep working). Run the build before `npm run deploy`.

To also copy the results somewhere on your own machine, create `documents/build.local` (git-ignored):

```sh
MASTERS_COPY_DIR="$HOME/Desktop/Resumes/Masters"            # one sub-folder per variant
CV_WORD_COPY="$HOME/Desktop/Resumes/MichaelPerezCV.docx"    # the Word version of the website CV
```

## Where things live

- `shared/cv-*.tex`: the CV's sections (employment, education, research, projects, publications, and so on). Every CV includes the same files, so a fact is edited once.
- `shared/cv-skills.tex`: each skills line, defined once; a CV lists the lines in the order that suits it.
- `shared/resume-facts.tex`: every reusable résumé line (role headings, bullets, publications, honors), defined once as a named command such as `\RaftExplore`. A résumé picks the lines it wants.
- `<variant>/cv.tex`: only the title under the name, the summary paragraph, and the order of sections.
- `<variant>/resume.tex`: which lines appear and in what order, the skills grouping, and the fit settings.

To change a fact (a date, a bullet, a new paper), edit the file in `shared/` and rebuild; all variants pick it up. Do not edit the `.docx` files by hand: the next build overwrites them.

## CV source rules

`build-docx.mjs` produces the Word files by reading the CV sources line by line. It understands only the commands below, each on **one line**, and refuses anything else (naming the line), so nothing can be dropped from a Word file unnoticed.

| Command | Produces |
| --- | --- |
| `\cvname{…}`, `\cvtitle{…}`, `\cvcontact{…}`, `\cvsummary{…}` | Header and opening paragraph |
| `\cvsection{…}`, `\cvsubsection{…}` | Section and sub-section headings |
| `\cvrole{title}{dates}{organisation}{location}` | A two-line entry with right-aligned dates and location |
| `\cvaward{name}{dates}`, `\cvservice{role}{organisation}{dates}` | One-line entries |
| `\cvskill{label}{items}` | A skills line |
| `\cvref{name}{title}{email}{department, institution}{city}` | A reference |
| `\begin{itemize}` / `\begin{enumerate}` with `\item …` | Bullets and numbered publication lists |
| `\input{file}` | Another source file |

Inside text: `\textbf{}`, `\textit{}`, `\underline{}`, `\href{url}{text}`, `\pubtitle{}` (a bold paper title), and `\me` (the underlined author name). A one-line `\newcommand{\Name}{…}` defined before `\begin{document}` can be used as a line of its own (this is how the skills lines work). To add a new kind of entry, define it in `shared/cv-preamble.tex` and add its Word layout to `build-docx.mjs`.

## Keeping a résumé to one full page

Each `resume.tex` has three fit settings near the top: the margins (`\geometry{…}`), the gap before each section (`\ResSectionGap`), and the type size and leading (`\fontsize{size}{leading}`). With the current content each page is full with roughly half a line to spare.

After changing content, rebuild. If a résumé spills onto a second page or leaves a visible gap, adjust in this order:

1. Reword a line that wraps by one or two words.
2. The leading (second number in `\fontsize`).
3. The section gap.
4. The margins.

Keep the type size at 10.4pt or larger.

## Conventions

- Tools used at a job go in a skills line, never under the job.
- Facts come from the CV sections here, `src/data/content.js`, or the job-agent experience bank (`~/Desktop/job-agent/bank`). No proficiency is inferred.
- Publication details (authors, order, volume, pages) follow the publisher's record for the DOI.
- A manuscript is listed as under review only while it is under review; manuscripts in preparation do not name a target venue.
- The CReLeRI publication (ACM Multimedia 2025) is a demo. Call it a demo, never a paper.
- Ph.D. thesis results are described without the model's name or the manuscript's title while the paper is unpublished.
- Contact links are written out and words are never hyphenated across lines, so the text survives plain-text extraction by applicant-tracking systems.
- No reason for leaving a job appears in any document.

## Requirements

- XeLaTeX (for example MacTeX) with the `geometry`, `enumitem`, `needspace`, and `hyperref` packages, and the Times New Roman font.
- Node with this repository's dev dependencies installed (`npm install`), for the Word files.
- `unzip` and `pdftotext` (Poppler) for the Word-versus-PDF check.
