# Portfolio résumé

`resume.tex` is the editable source for the one-page general ML/computer vision résumé at `public/files/Resume.pdf`. It uses the current CV and portfolio record, including the completed Ph.D., August–November 2026 Raft role, supplied accomplishments, and confirmed Raft technologies. It selects the most relevant experience and publications from the longer CV.

Build from the portfolio checkout:

```sh
sh documents/resume/build.sh
```

Requires XeLaTeX (for example, MacTeX), its standard `geometry`, `enumitem`, `needspace`, and `hyperref` packages, and Times New Roman. The body uses 10.5-point type. Compilation uses a temporary directory and replaces only `public/files/Resume.pdf`; Vite copies the PDF into the deployed website.

The script runs this command twice, using absolute paths for the source and temporary output directory:

```sh
xelatex -interaction=nonstopmode -halt-on-error -output-directory="$resume_build_dir" "$resume_dir/resume.tex"
```

The résumé is maintained here alongside the website's current CV. The older sources and historical tailored applications in `job-agent` are unchanged.
