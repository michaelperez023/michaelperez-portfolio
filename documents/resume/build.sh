#!/bin/sh
set -eu

resume_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
resume_build_dir=$(mktemp -d "${TMPDIR:-/tmp}/portfolio-resume.XXXXXX")
trap 'rm -rf "$resume_build_dir"' EXIT HUP INT TERM

for pass in 1 2; do
  xelatex -interaction=nonstopmode -halt-on-error -output-directory="$resume_build_dir" "$resume_dir/resume.tex" > "$resume_build_dir/build-output.txt" 2>&1 || {
    cat "$resume_build_dir/build-output.txt"
    exit 1
  }
done

if rg -n 'Overfull|Missing character|LaTeX Warning' "$resume_build_dir/resume.log"; then
  printf '\nReview the resume build warnings above.\n' >&2
fi

cp "$resume_build_dir/resume.pdf" "$resume_dir/../../public/files/Resume.pdf"
printf 'Built public/files/Resume.pdf\n'
