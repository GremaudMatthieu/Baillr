#!/usr/bin/env bash
# check-dto-imports.sh
# Validates that every DTO file imports at least one class-validator decorator.
# Exit code: 0 if all DTOs pass, 1 if any DTO lacks class-validator imports.
#
# Usage: ./scripts/check-dto-imports.sh
# CI:    npm run lint:dto (from backend/)

set -euo pipefail

BACKEND_SRC="${1:-backend/src}"
EXIT_CODE=0
CHECKED=0
FAILED=0

# Find all DTO files
while IFS= read -r dto_file; do
  CHECKED=$((CHECKED + 1))

  if ! grep -q "from 'class-validator'" "$dto_file" && \
     ! grep -q 'from "class-validator"' "$dto_file"; then
    echo "FAIL: $dto_file — missing class-validator import"
    FAILED=$((FAILED + 1))
    EXIT_CODE=1
  fi
done < <(find "$BACKEND_SRC" -name "*.dto.ts" -type f)

if [ "$CHECKED" -eq 0 ]; then
  echo "WARNING: No DTO files found in $BACKEND_SRC"
  exit 0
fi

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "OK: All $CHECKED DTO files import class-validator decorators"
else
  echo "FAIL: $FAILED/$CHECKED DTO files missing class-validator imports"
fi

exit $EXIT_CODE
