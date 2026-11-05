# Portfolio CV

`cv.tex` is the **single master source** for the CV. One command builds every copy from it, so the PDF and the Word file always match:

```sh
sh documents/cv/build.sh
```

| Output | What it is |
| --- | --- |
| `public/files/Michael_Perez_CV.pdf` | The PDF the website links to |
| `public/files/CV.pdf` | The same file under its old name, so older links keep working |
| `documents/cv/Michael_Perez_CV.docx` | The Word version, generated from `cv.tex` |

The build stops with an error if the Word file and the PDF do not contain the same words in the same order.

To also drop a copy of the Word file somewhere else on your machine each time, create `documents/build.local` (it is git-ignored) containing:

```sh
CV_WORD_COPY="$HOME/Desktop/Resumes/MichaelPerezCV.docx"
```

## Editing

Edit `cv.tex` only, then rebuild. Do not edit the `.docx` by hand: the next build overwrites it.

The body of `cv.tex` uses a small set of commands, each on **one line**:

| Command | Produces |
| --- | --- |
| `\cvname{…}`, `\cvcontact{…}`, `\cvsummary{…}` | Header and opening paragraph |
| `\cvsection{…}`, `\cvsubsection{…}` | Section and sub-section headings |
| `\cvrole{title}{dates}{organisation}{location}` | A two-line entry with right-aligned dates and location |
| `\cvaward{name}{dates}`, `\cvservice{role}{organisation}{dates}` | One-line entries |
| `\cvskill{label}{items}` | A skills line |
| `\cvref{name}{title}{email}{department, institution}{city}` | A reference |
| `\begin{itemize}` / `\begin{enumerate}` with `\item …` | Bullets and numbered publication lists |

Inside text you can use `\textbf{}`, `\textit{}`, `\underline{}`, `\href{url}{text}`, `\pubtitle{}` (a bold paper title), and `\me` (the underlined author name). `build-docx.mjs` reads the file line by line and refuses anything else, naming the line, so nothing can be dropped from the Word version unnoticed. To add a new kind of entry, define the command in the preamble of `cv.tex` and add its Word layout to `build-docx.mjs`.

Conventions for this CV:

- Tools used at a job go under Technical Skills, not under the job.
- A manuscript is listed as under review only while it is actually under review, and manuscripts in preparation do not name a target venue.
- Publication details (authors, order, volume, pages) follow the publisher's record for the DOI.

## Requirements

- XeLaTeX (for example MacTeX) with the standard `geometry`, `enumitem`, `needspace`, and `hyperref` packages, and the Times New Roman font.
- Node with this repository's dev dependencies installed (`npm install`), for the Word file.
- `unzip` and `pdftotext` (Poppler) for the Word-versus-PDF check.

The script prints any overfull-box, missing-character, or LaTeX warnings from the build log. Proof the rendered pages before deploying.
