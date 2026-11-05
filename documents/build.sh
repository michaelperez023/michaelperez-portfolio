#!/bin/sh
# Builds the master CVs and résumés from the LaTeX sources in this folder.
#
#   sh documents/build.sh                      build every variant
#   sh documents/build.sh research-scientist   build only the named variant(s)
#
# For each variant (ml-engineer, research-scientist, software-engineer) this writes to
# documents/out/<variant>/ (not committed):
#   Michael_Perez_CV.pdf      the CV
#   Michael_Perez_CV.docx     the same CV as a Word file, checked word-for-word against the PDF
#   Michael_Perez_Resume.pdf  the one-page résumé (the build fails if it is not exactly one page)
# The ml-engineer pair is also the one the website serves, so it is copied to public/files/.
# documents/build.local (git-ignored) can name extra places to copy the results; see README.md.
set -eu

docs_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
files_dir="$docs_dir/../public/files"
out_root="$docs_dir/out"
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/portfolio-docs.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM

all_variants="ml-engineer research-scientist software-engineer"
variants=${*:-$all_variants}

folder_name() {
  case "$1" in
    ml-engineer) printf 'ML Engineer - Applied AI' ;;
    research-scientist) printf 'Research Scientist - Applied Scientist' ;;
    software-engineer) printf 'Software Engineer - ML Infrastructure' ;;
    *) printf '%s' "$1" ;;
  esac
}

# typeset <variant> <cv|resume>: two XeLaTeX passes; prints the page count.
typeset_doc() {
  build_dir="$work_dir/$1-$2"
  mkdir -p "$build_dir"
  for pass in 1 2; do
    (cd "$docs_dir/$1" && xelatex -interaction=nonstopmode -halt-on-error -output-directory="$build_dir" "$2.tex" > "$build_dir/build-output.txt" 2>&1) || {
      cat "$build_dir/build-output.txt"
      printf '\nXeLaTeX failed on %s/%s.tex\n' "$1" "$2" >&2
      exit 1
    }
  done
  if grep -nE 'Overfull|Missing character|LaTeX Warning' "$build_dir/$2.log" >&2; then
    printf 'Review the warnings above (%s/%s.tex).\n' "$1" "$2" >&2
  fi
  # The log ends with "Output written on <path> (N pages, ...)". TeX hard-wraps log lines,
  # so join them before reading the page count.
  tr -d '\n' < "$build_dir/$2.log" | sed -n 's/.*Output written on [^(]*(\([0-9][0-9]*\) page.*/\1/p'
}

for variant in $variants; do
  [ -f "$docs_dir/$variant/cv.tex" ] || { printf 'Unknown variant: %s\n' "$variant" >&2; exit 1; }
  out_dir="$out_root/$variant"
  mkdir -p "$out_dir"

  cv_pages=$(typeset_doc "$variant" cv)
  cp "$work_dir/$variant-cv/cv.pdf" "$out_dir/Michael_Perez_CV.pdf"
  node "$docs_dir/build-docx.mjs" "$docs_dir/$variant/cv.tex" "$out_dir/Michael_Perez_CV.docx" --check "$out_dir/Michael_Perez_CV.pdf" > "$work_dir/docx.txt" || { cat "$work_dir/docx.txt"; exit 1; }

  resume_pages=$(typeset_doc "$variant" resume)
  if [ "$resume_pages" != "1" ]; then
    printf 'The %s résumé is %s pages; it must be exactly one. See "Keeping a résumé to one full page" in README.md.\n' "$variant" "${resume_pages:-an unknown number of}" >&2
    exit 1
  fi
  cp "$work_dir/$variant-resume/resume.pdf" "$out_dir/Michael_Perez_Resume.pdf"

  printf '%-20s CV %s pages (PDF + Word, %s)   résumé 1 page\n' "$variant" "$cv_pages" "$(sed -n 's/^Checked: the Word file and the PDF contain //p' "$work_dir/docx.txt")"
done

# The website serves the ml-engineer pair. The old file names are kept as identical copies
# so links to /files/CV.pdf and /files/Resume.pdf keep working.
if [ -f "$out_root/ml-engineer/Michael_Perez_CV.pdf" ]; then
  cp "$out_root/ml-engineer/Michael_Perez_CV.pdf" "$files_dir/Michael_Perez_CV.pdf"
  cp "$out_root/ml-engineer/Michael_Perez_CV.pdf" "$files_dir/CV.pdf"
  cp "$out_root/ml-engineer/Michael_Perez_Resume.pdf" "$files_dir/Michael_Perez_Resume.pdf"
  cp "$out_root/ml-engineer/Michael_Perez_Resume.pdf" "$files_dir/Resume.pdf"
  printf 'Website copies updated in public/files/\n'
fi

# Optional local copies (documents/build.local):
#   MASTERS_COPY_DIR  a folder that receives one sub-folder per variant
#   CV_WORD_COPY      a path that receives the ml-engineer Word CV
MASTERS_COPY_DIR=""
CV_WORD_COPY=""
if [ -f "$docs_dir/build.local" ]; then
  . "$docs_dir/build.local"
fi
if [ -n "$MASTERS_COPY_DIR" ]; then
  for variant in $variants; do
    dest="$MASTERS_COPY_DIR/$(folder_name "$variant")"
    mkdir -p "$dest"
    cp "$out_root/$variant/Michael_Perez_CV.pdf" "$out_root/$variant/Michael_Perez_CV.docx" "$out_root/$variant/Michael_Perez_Resume.pdf" "$dest/"
  done
  printf 'Copied the masters to %s\n' "$MASTERS_COPY_DIR"
fi
if [ -n "$CV_WORD_COPY" ] && [ -f "$out_root/ml-engineer/Michael_Perez_CV.docx" ]; then
  cp "$out_root/ml-engineer/Michael_Perez_CV.docx" "$CV_WORD_COPY"
  printf 'Copied the Word CV to %s\n' "$CV_WORD_COPY"
fi
