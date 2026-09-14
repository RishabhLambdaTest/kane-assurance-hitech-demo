# Kane CLI Assurance — Hi-Tech Enterprise Procurement STLC Demo

A ready-to-fork demo repository that maps Kane CLI Assurance to every phase of the Software Testing Lifecycle, using a **Hi-Tech B2B quote-to-order flow**. Enterprise customers configure laptops and workstations, build quotes with volume pricing and services, and pay on account. Orders above the spending limit go through an approval workflow.

Each STLC phase is a separate GitHub Actions workflow. Run them one at a time to demonstrate a single phase, or use the orchestrator to run everything end-to-end.

**App under test:** NovaTech Business Store (`app/`). Run it locally with `cd app && npm install && npm run dev`, or deploy it with workflow 0.

## Why this flow for Hi-Tech enterprise prospects

It covers the requirement types that enterprise hi-tech QA teams struggle to keep traced:

| Requirement type | Where it lives in the PRD |
|---|---|
| Product compatibility rules | FR-2 configurator (64 GB needs Core Ultra 9, 4 TB is Workstation only) |
| Tiered / contract pricing | FR-3 volume discounts (5% / 10% / 15%) |
| Per-device services with conditions | FR-4 (Autopilot is Windows only, imaging needs 10+ devices) |
| Supply constraints | FR-3/FR-5 backorders and lead-time-driven delivery dates; EOL products |
| Financial controls | FR-6 PO format, $150K credit limit, $10K card cap, 3-strike card lockout |
| Governance / SoD | FR-7 $25K approval threshold, rejection reasons, no self-approval |
| Localization / compliance | FR-5 country postal formats, tax-exemption certificates |

## The STLC → GitHub Actions mapping

| # | STLC Phase | Workflow | Kane CLI Commands | What the prospect sees |
|---|-----------|----------|-------------------|----------------------|
| 1 | Requirements Analysis | `1-requirements-analysis.yml` | `context ingest` + `context extract` | AI reads the PRD, extracts cited use-cases |
| 2 | Test Planning | `2-test-planning.yml` | `context review` + `cover gaps` | Human review gate + risk-ranked gap analysis |
| 3 | Test Design | `3-test-design.yml` | `design tests` | AI designs ACs, scenarios, and traced tests |
| 4 | Test Development | `4-test-development.yml` | `testmd run` | Agent authors tests in a real browser |
| 5 | Test Execution | `5-test-execution.yml` | `testrun run` + HyperExecute | Batch replay with sealed evidence packs |
| 6 | Coverage & Reporting | `6-coverage-reporting.yml` | `cover` + `cover gaps` | Two-axis coverage: proven vs owed |
| 7 | Maintenance | `7-maintenance.yml` | `maintain reconcile` + `maintain evolve` | PRD changed → suite adapts automatically |
| All | Full pipeline | `run-all-stlc-demo.yml` | All of the above | End-to-end in one click (self-hosted runner) |

## Quick start

### 1. Fork this repo

### 2. Add secrets

**Settings → Secrets → Actions:**

| Secret | Required | Where to find it |
|--------|----------|-----------------|
| `LT_USERNAME` | Yes | TestMu AI dashboard → Settings → Keys |
| `LT_ACCESS_KEY` | Yes | Same page |
| `VERCEL_TOKEN` | Optional | For auto-deploying the NovaTech app |
| `VERCEL_ORG_ID` | Optional | Vercel dashboard → Settings |
| `VERCEL_PROJECT_ID` | Optional | Vercel project settings |

### 3. Choose your demo path

**Path A — Run everything at once:** Actions → "Kane CLI Assurance - STLC Demo" → Run workflow. This runs on a self-hosted runner; see the setup notes at the top of `run-all-stlc-demo.yml`.

**Path B — Phase by phase (recommended for live demos):** Run workflows 1 → 7 one at a time. Between phases you can explain what happened, open the artifacts, and take questions.

### 4. The maintenance demo (the closer)

After phases 1–6 complete with `prd-enterprise-procurement.md` (v1):

1. Go to Actions → "7 · Maintenance"
2. Set action to `reconcile`
3. Set new_prd to `docs/prd-enterprise-procurement-v2.md`
4. Run it

The v2 PRD changes the approval and payment rules and adds a new subscription offering. The changeset should show:
- `[MODIFY]` spend approval use-case — single approver becomes a two-level chain (Finance Director above $100K)
- `[MODIFY]` purchase-order payment use-case — Net 45 terms for orders above $50K
- `[ADD]` Device-as-a-Service subscription use-case(s) — 36-month term, 10-device minimum, PO-only, monthly pricing formula

Then run workflow 6 again. The coverage report now shows gaps for the new and changed requirements. This is the "test rot is structurally impossible" moment.

## Repository structure

```
.
├── .github/workflows/
│   ├── 0-setup-deploy.yml              ← deploy NovaTech app
│   ├── 1-requirements-analysis.yml     ← ingest + extract
│   ├── 2-test-planning.yml             ← review + gaps
│   ├── 3-test-design.yml               ← design tests
│   ├── 4-test-development.yml          ← testmd run (author)
│   ├── 5-test-execution.yml            ← testrun run (batch)
│   ├── 6-coverage-reporting.yml        ← cover + gaps
│   ├── 7-maintenance.yml               ← reconcile + evolve
│   └── run-all-stlc-demo.yml           ← orchestrator (self-hosted)
├── app/                                ← NovaTech Business Store (Next.js 14)
├── docs/
│   ├── prd-enterprise-procurement.md       ← v1 PRD
│   └── prd-enterprise-procurement-v2.md    ← v2 PRD (DaaS + 2-level approval + Net 45)
├── scripts/
│   └── run-demo.sh                     ← run everything locally
└── README.md
```

## The NovaTech Business app

| Route | What it covers |
|---|---|
| `/` | Catalog: in stock, backorder, and End of Life badges (FR-1) |
| `/configure/[id]` | Configurator with compatibility rules and live price (FR-2) |
| `/quote` | Quote builder: volume pricing, services, backorders, Save Quote (FR-3, FR-4) |
| `/checkout/shipping` | Saved sites, postal validation, tax exemption, delivery methods (FR-5) |
| `/checkout/payment` | Purchase order or corporate card (FR-6) |
| `/checkout/review` | Review, Place Order or Submit for Approval (FR-7, FR-8) |
| `/checkout/confirmation` | Order number, or approval request ID |
| `/approvals` | Approve / reject with reason, segregation of duties (FR-7) |

The app implements the **v1** PRD only. v2 features (DaaS, two-level approval, Net 45) are deliberately absent, so after reconcile the new tests fail against the app and show up as coverage gaps.

### Test fixtures and hooks

| Hook | Effect |
|---|---|
| `?seed=d1:30` | Sets the quote to exactly these lines (`productId:qty`, comma-separated, default config) |
| `?role=approver` / `?role=buyer` | Switches persona (Marcus Lee, Procurement Manager / Priya Shah, IT Buyer) |
| `?reset=1` | Clears the quote, persona, and approval requests |
| Card ending `0000` | Declined by the mock gateway (3 declines lock card payments for 15 minutes) |
| Product `d8` (Smart Card Reader) | Always fails stock allocation at placement |
| Product `d4` (NovaBook 13 Classic) | End of Life; seeding it blocks checkout |
| Products `d2`, `d3`, `d5`, `d7` | Limited or zero stock, so they trigger backorder lead times |

Handy scenarios:
- **Approval path:** `/quote?seed=d1:30` → 30 × $1,044.05 = $31,321.50 + tax → over $25K
- **Credit limit:** `/quote?seed=d3:60` → over the $150K available credit on PO
- **Card cap:** `/quote?seed=d6:50` → over $10K, so card payment is blocked
- **White-glove eligibility:** US site with 25 or more devices

## Demo script (10-minute version)

### Opening (2 min)
> "Let me show you how Kane CLI Assurance maps to your testing lifecycle. Here's a PRD for an enterprise device-ordering portal. It has compatibility rules, volume pricing, credit limits and an approval workflow: the kind of document your product team already writes, and the kind that's painful to keep traced to tests."

Show `docs/prd-enterprise-procurement.md` in GitHub.

### Phase 1 — Requirements Analysis (2 min)
> "First, we feed the PRD to Kane CLI. An AI agent reads it and extracts use-cases. It doesn't guess: every use-case cites exact lines in your document."

Trigger workflow 1. Point out the citations, and the clarifying questions it raises for the Open Questions section.

### Phase 2 — Test Planning (1 min)
> "Nothing moves forward without human approval."

Trigger workflow 2. Show the gap analysis, where financial controls and approval rules should rank as high-risk.

### Phase 3 — Test Design (2 min)
> "For each approved use-case, the AI designs acceptance criteria, scenarios (happy, negative, boundary) and one runnable test per scenario."

Trigger workflow 3. Show a boundary test around the $25,000 threshold or the 10-device imaging rule, and point out the `@verifies` tags.

### Phase 6 — Coverage Report (1 min)
> "This replaces your RTM spreadsheet. Two questions answered: what's designed, and what's proven."

Trigger workflow 6. **This is the money slide.**

### Phase 7 — Maintenance (2 min)
> "Finance now wants a second approver above $100K, and Sales launches Device-as-a-Service. Watch what happens."

Trigger workflow 7 with `prd-enterprise-procurement-v2.md`. Show the changeset (MODIFY, ADD), the stale markers, and the new gaps.

> "When audit asks 'how do we know orders over $100K get Finance sign-off?', the answer is in the graph, not in someone's head."

## Running locally

```bash
# Prerequisites
npm install -g @testmuai/kane-cli
export LT_USERNAME="your-username"
export LT_ACCESS_KEY="your-access-key"
kane-cli login --username "$LT_USERNAME" --access-key "$LT_ACCESS_KEY"

# Start the app
(cd app && npm install && npm run dev)

# Full demo
./scripts/run-demo.sh docs/prd-enterprise-procurement.md prd-enterprise-procurement http://localhost:3000

# Maintenance demo (after full demo)
./scripts/run-demo.sh docs/prd-enterprise-procurement-v2.md prd-enterprise-procurement http://localhost:3000
```

## Customizing for a specific prospect

1. **Rebrand the catalog.** Edit `app/src/data/products.json` (use servers, networking gear, or semiconductors instead of laptops).
2. **Match their policy numbers.** Approval limit, credit limit, and card cap live in `app/src/lib/pricing.js`; update the PRD to match.
3. **Replace the PRD.** Drop the prospect's own requirement doc into `docs/` and update the `source_file` / `source_id` defaults in each workflow.
4. **Adjust the test budget.** Change the `max_tests` default. More tests means a longer demo and more coverage.
5. **Add their integration.** If they use Jira or Confluence, point ingest at their URL instead of a file.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow fails at authentication | Verify `LT_USERNAME` and `LT_ACCESS_KEY` secrets |
| Extract produces no use-cases | Check that the PRD file path is correct |
| Test authoring fails | Ensure the app URL is reachable from the runner (localhost only works on self-hosted) |
| Tests see stale quote/approval state | Start tests from a `?reset=1` URL |
| Cache issues between workflows | Delete caches from Actions → Caches, re-run from phase 1 |
| Coverage report shows no evidence | Run phases 4 and 5 with a live app first |
| Reconcile shows "nothing to reconcile" | The PRD hasn't changed — use `prd-enterprise-procurement-v2.md` |
