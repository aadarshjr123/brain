#!/usr/bin/env bash
# Move a BRAIN issue on the project board.  Usage: scripts/board.sh <issue-number> <backlog|ready|progress|review|done>
# Looks up the one item for this issue (cheap), instead of listing the whole board (GraphQL rate limits).
set -euo pipefail
PROJECT_ID="PVT_kwHOA1HzYs4Br6P-"; FIELD_ID="PVTSSF_lAHOA1HzYs4Br6P-zhqKvFU"; OWNER="aadarshjr123"; REPO="brain"
case "$2" in
  backlog) OPT=8eb7006c;; ready) OPT=1936ecc8;; progress) OPT=473cfd13;; review) OPT=99bbc169;; done) OPT=e54bc3b8;;
  *) echo "unknown status: $2" >&2; exit 1;;
esac
ITEM=$(gh api graphql -f query="query { repository(owner: \"$OWNER\", name: \"$REPO\") { issue(number: $1) { projectItems(first: 10) { nodes { id project { id } } } } } }" \
  --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id")
[ -n "$ITEM" ] || { echo "issue #$1 not on board" >&2; exit 1; }
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM" --field-id "$FIELD_ID" --single-select-option-id "$OPT" >/dev/null
echo "#$1 → $2"
