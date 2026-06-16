find src -name "*.js" -print0 | while IFS= read -r -d '' f; do
  if grep -qE "<[A-Z][A-Za-z0-9_]*\\b|</[A-Z][A-Za-z0-9_]*>" "$f"; then
    mv "$f" "${f%.js}.jsx"
  fi
done