#!/usr/bin/env bash
# Create or update the `main` branch ruleset from .github/rulesets/main.json (rules as code).
# Requires a public repository or GitHub Pro/Team for private ones.
set -euo pipefail
REPO="${1:-aadarshjr123/brain}"
FILE=".github/rulesets/main.json"
ID=$(gh api "repos/$REPO/rulesets" -q '.[] | select(.name=="main") | .id' 2>/dev/null || true)
if [ -n "$ID" ]; then
  gh api -X PUT "repos/$REPO/rulesets/$ID" --input "$FILE" -q '"updated ruleset \(.id)"'
else
  gh api -X POST "repos/$REPO/rulesets" --input "$FILE" -q '"created ruleset \(.id)"'
fi
