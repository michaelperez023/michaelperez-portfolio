#!/bin/sh
# Builds the one-page résumé from resume.tex:
#   public/files/Michael_Perez_Resume.pdf   the PDF the website links to
#   public/files/Resume.pdf                 the same file under its old name (old links keep working)
# The build fails if the résumé is no longer exactly one page.
set -eu

resume_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
files_dir="$resume_dir/../../public/files"
resume_build_dir=$(mktemp -d "${TMPDIR:-/tmp}/portfolio-resume.XXXXXX")
trap 'rm -rf "$resume_build_dir"' EXIT HUP INT TERM

for pass in 1 2; do
  xelatex -interaction=nonstopmode -halt-on-error -output-directory="$resume_build_dir" "$resume_dir/resume.tex" > "$resume_build_dir/build-output.txt" 2>&1 || {
    cat "$resume_build_dir/build-output.txt"
    exit 1
  }
done

if grep -nE 'Overfull|Missing character|LaTeX Warning' "$resume_build_dir/resume.log"; then
  printf '\nReview the resume build warnings above.\n' >&2
fi

# The log ends with "Output written on <path> (1 page, ...)". TeX hard-wraps log
# lines, so join them before reading the page count.
pages=$(tr -d '\n' < "$resume_build_dir/resume.log" | sed -n 's/.*Output written on [^(]*(\([0-9][0-9]*\) page.*/\1/p')
if [ "$pages" != "1" ]; then
  printf 'The résumé is %s pages; it must be exactly one. See "Keeping it to one full page" in README.md.\n' "${pages:-an unknown number of}" >&2
  exit 1
fi

cp "$resume_build_dir/resume.pdf" "$files_dir/Michael_Perez_Resume.pdf"
cp "$resume_build_dir/resume.pdf" "$files_dir/Resume.pdf"
printf 'Built public/files/Michael_Perez_Resume.pdf (and Resume.pdf), 1 page\n'
