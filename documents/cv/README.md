# Portfolio CV

`cv.tex` is the editable source for the website's `public/files/CV.pdf`. It preserves the complete content of the August 18, 2026 website CV, with Raft's employment dates changed to August–November 2026 and the three supplied accomplishment bullets added. The confirmed Raft tools (Kubernetes, MLOps, Airflow, MLflow, Label Studio, and FiftyOne) are listed under Technical Skills only, not under the role. Publications include a Manuscripts Under Review subsection ahead of Manuscripts in Preparation.

The source was reconstructed from the existing website PDF because the sources in `job-agent/resume/` and `job-agent/bank/cv.yaml` predated it. Those sources and historical job applications were left unchanged.

Build from the portfolio checkout:

```sh
sh documents/cv/build.sh
```

Requires XeLaTeX (for example, MacTeX), its standard `geometry`, `enumitem`, `needspace`, and `hyperref` packages, and the Times New Roman font. Compilation uses a temporary directory and replaces only `public/files/CV.pdf`. The website's normal Vite build copies that PDF unchanged.

The script runs this command twice, using absolute paths for the source and temporary output directory:

```sh
xelatex -interaction=nonstopmode -halt-on-error -output-directory="$cv_build_dir" "$cv_dir/cv.tex"
```

The font, letter page size, section rules, and overall structure follow the previous CV. Line wrapping and page breaks are recalculated when the document is built. The script prints any overfull-box, missing-character, or LaTeX warnings from the build log; proof the rendered pages before deploying.
