#!/bin/sh
set -eu

cv_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cv_build_dir=$(mktemp -d "${TMPDIR:-/tmp}/portfolio-cv.XXXXXX")
trap 'rm -rf "$cv_build_dir"' EXIT HUP INT TERM

for pass in 1 2; do
  xelatex -interaction=nonstopmode -halt-on-error -output-directory="$cv_build_dir" "$cv_dir/cv.tex" > "$cv_build_dir/build-output.txt" 2>&1 || {
    cat "$cv_build_dir/build-output.txt"
    exit 1
  }
done

if rg -n 'Overfull|Missing character|LaTeX Warning' "$cv_build_dir/cv.log"; then
  printf '\nReview the CV build warnings above.\n' >&2
fi

cp "$cv_build_dir/cv.pdf" "$cv_dir/../../public/files/CV.pdf"
printf 'Built public/files/CV.pdf\n'
