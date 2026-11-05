#!/bin/sh
# Builds every copy of the CV from cv.tex, the single master source:
#   public/files/Michael_Perez_CV.pdf   the PDF the website links to
#   public/files/CV.pdf                 the same file under its old name (old links keep working)
#   documents/cv/Michael_Perez_CV.docx  the Word version, checked word-for-word against the PDF
# If documents/build.local sets CV_WORD_COPY, the Word file is also copied there.
set -eu

cv_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
files_dir="$cv_dir/../../public/files"
cv_build_dir=$(mktemp -d "${TMPDIR:-/tmp}/portfolio-cv.XXXXXX")
trap 'rm -rf "$cv_build_dir"' EXIT HUP INT TERM

for pass in 1 2; do
  xelatex -interaction=nonstopmode -halt-on-error -output-directory="$cv_build_dir" "$cv_dir/cv.tex" > "$cv_build_dir/build-output.txt" 2>&1 || {
    cat "$cv_build_dir/build-output.txt"
    exit 1
  }
done

if grep -nE 'Overfull|Missing character|LaTeX Warning' "$cv_build_dir/cv.log"; then
  printf '\nReview the CV build warnings above.\n' >&2
fi

cp "$cv_build_dir/cv.pdf" "$files_dir/Michael_Perez_CV.pdf"
cp "$cv_build_dir/cv.pdf" "$files_dir/CV.pdf"
printf 'Built public/files/Michael_Perez_CV.pdf (and CV.pdf)\n'

node "$cv_dir/build-docx.mjs" "$cv_dir/Michael_Perez_CV.docx" --check "$cv_build_dir/cv.pdf"

CV_WORD_COPY=""
if [ -f "$cv_dir/../build.local" ]; then
  . "$cv_dir/../build.local"
fi
if [ -n "$CV_WORD_COPY" ]; then
  cp "$cv_dir/Michael_Perez_CV.docx" "$CV_WORD_COPY"
  printf 'Copied the Word CV to %s\n' "$CV_WORD_COPY"
fi
