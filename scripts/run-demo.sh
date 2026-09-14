#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Kane CLI Assurance — Hi-Tech Enterprise Procurement STLC Demo (Local)
#
# Usage:
#   ./scripts/run-demo.sh [prd-file] [source-id] [app-url]
#
# Example:
#   ./scripts/run-demo.sh docs/prd-enterprise-procurement.md prd-enterprise-procurement http://localhost:3000
# ─────────────────────────────────────────────────────────

PRD="${1:-docs/prd-enterprise-procurement.md}"
SRC="${2:-prd-enterprise-procurement}"
URL="${3:-http://localhost:3000}"

G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' R='\033[0;31m' N='\033[0m'

phase() {
  echo ""
  echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
  echo -e "${G}  Phase $1: $2${N}"
  echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
}

echo -e "${Y}Kane CLI Assurance — Full STLC Demo${N}"
echo "PRD: $PRD | Source: $SRC | App: $URL"

# ── Phase 1 ──────────────────────────────────────────────
phase 1 "Requirements Analysis (ingest + extract)"
kane-cli context ingest "./$PRD" --as "$SRC" --mode ci
kane-cli context extract --mode override --source "$SRC"
echo "" && kane-cli context list

# ── Phase 2 ──────────────────────────────────────────────
phase 2 "Test Planning (review + gaps)"
kane-cli context review --approve-all --mode ci 2>/dev/null || true
echo "" && kane-cli cover gaps --stage design 2>/dev/null || echo -e "${Y}No gaps yet${N}"

# ── Phase 3 ──────────────────────────────────────────────
phase 3 "Test Design (design tests)"
for UC in $(kane-cli context list --type use-case --trust trusted --json | jq -r '.[].ref // empty' 2>/dev/null); do
  echo -e "  ${C}Designing: $UC${N}"
  kane-cli design tests --use-case "$UC" --mode override --max 5 || true
done
kane-cli context review --approve-all --mode ci 2>/dev/null || true
echo "" && find .testmuai/tests -name '*_test.md' 2>/dev/null | sort || echo "No test files"

# ── Phase 4 ──────────────────────────────────────────────
phase 4 "Test Development (author first 3 tests)"
for TEST in $(find .testmuai/tests -name '*_test.md' 2>/dev/null | head -3); do
  echo -e "  ${C}Authoring: $(basename $TEST)${N}"
  kane-cli testmd run "$TEST" --url "$URL" --headless || true
done

# ── Phase 5 ──────────────────────────────────────────────
phase 5 "Test Execution (batch replay)"
kane-cli testrun run --match 't-' --url "$URL" --headless || true

# ── Phase 6 ──────────────────────────────────────────────
phase 6 "Coverage & Reporting"
kane-cli cover 2>/dev/null || echo -e "${Y}No evidence packs yet${N}"
echo "" && kane-cli cover gaps 2>/dev/null || echo -e "${Y}No gaps${N}"

# ── Save outputs ─────────────────────────────────────────
kane-cli cover --json > coverage.json 2>/dev/null || true
kane-cli cover gaps --json > coverage-gaps.json 2>/dev/null || true
kane-cli context view --output context-graph.html 2>/dev/null || true

echo ""
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Demo complete${N}"
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo "Outputs:"
echo "  context-graph.html  — open in browser"
echo "  coverage.json       — machine-readable"
echo "  coverage-gaps.json  — ranked gaps"
echo ""
echo -e "${Y}Phase 7 (Maintenance):${N}"
echo "  ./scripts/run-demo.sh docs/prd-enterprise-procurement-v2.md prd-enterprise-procurement $URL"
echo "  This will reconcile the PRD change and show stale markers"
