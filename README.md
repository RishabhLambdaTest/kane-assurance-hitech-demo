# NovaTech Hi-Tech Assurance Demo

A sample repo showing [`kane-cli`](https://www.npmjs.com/package/@testmuai/kane-cli) taking a **Hi-Tech enterprise procurement PRD** all the way to browser-proven tests.

A PRD goes in. kane-cli extracts use-cases, designs tests from them, runs those tests against a real app in a real browser, and reports coverage traced back to the requirement.

## What's here

| Path | What it is |
|---|---|
| `docs/prd-enterprise-procurement.md` | The PRD (v1) — 8 requirements for a B2B quote-to-order flow |
| `docs/prd-enterprise-procurement-v2.md` | A changed PRD, for the maintenance demo |
| `app/` | NovaTech Business Store — the app under test (Next.js, runs on localhost:3000) |
| `.context/` | The assurance graph kane-cli built from the PRD |
| `.testmuai/tests/` | The designed tests (`*_test.md`) |
| `.testmuai/variables/novatech.json` | Test data for the `{{placeholders}}` in those tests |
| `.testmuai/tests/output-*/` | Each test's recording and `Result.md` — what makes re-runs replay instead of re-author |
| `.github/workflows/` | `run-tests.yml` (run the committed tests) and `assurance-pipeline.yml` (the full flow) |
| `RUN-GUIDE.md` | Line-by-line runbook: every command from ingest to execution |
| `DEMO.md` | **The 10-minute demo script — start here** |

## The app under test

NovaTech Business Store: a corporate buyer configures laptops and workstations, builds a quote with volume pricing and services, pays by purchase order or card, and orders above $25,000 go to a Procurement Manager for approval.

It's deliberately full of the rules enterprise QA has to keep traced: compatibility rules in the configurator, volume discount tiers, credit limits, a card cap, approval thresholds, and no self-approval.

## Current state

kane-cli has already run against this repo, and the results are committed:

| | |
|---|---|
| Use-cases extracted from the PRD | **9**, all approved |
| Use-cases with designed tests | **2** — uc-8 (Configure a device), uc-3 (Over-limit approval) |
| Test files | **3**, all verified passing in a real browser |
| Coverage | uc-8: 100% designed, 100% proven |

The other 7 use-cases have no tests yet — by design. Designing one live is a good demo moment.

The three tests:

| Test | Use-case | What it proves |
|---|---|---|
| `laptop-configurator-shows-and-enforces-incompatible-options` | uc-8 | Incompatible options stay visible and disabled with reasons; downgrading the processor auto-corrects 64 GB memory to 32 GB with the exact message |
| `workstation-configurator-supports-valid-boundary-quantities` | uc-8 | Option pricing, 4 TB allowed on workstations, and adding to the quote at quantities 1 and 500 |
| `submit-an-over-limit-order-from-review-into-a-pending` | uc-3 | A $33,905.52 order shows the over-limit banner, submits for approval, and lands as a pending request with requester, total and time |

## Quick start

```bash
# Terminal 1 — the app
cd app && npm install && npm run build && npm start

# Terminal 2 — kane-cli, from the repo root
kane-cli whoami
kane-cli cover gaps
kane-cli testmd run .testmuai/tests/laptop-configurator-shows-and-enforces-incompatible-options_test.md \
  --agent --variables-file .testmuai/variables/novatech.json
```

Every command, in order, with expected output: **[RUN-GUIDE.md](RUN-GUIDE.md)**.

## Demo in 10 minutes

Two moments carry the whole story, and both are in **[DEMO.md](DEMO.md)**:

1. **The coverage ribbon** — `kane-cli cover gaps`. Designed × proven, per requirement, with the gaps showing honestly. This replaces the traceability spreadsheet.
2. **The PRD changes** — reconcile against the v2 PRD and watch the suite go stale exactly where the requirements moved.

Run both live. `.context/` is committed, so `git checkout .context` resets to the pre-demo state.

## GitHub Actions

Both workflows build and serve the app on the runner, so nothing needs deploying. Both need two repo secrets first — **Settings → Secrets and variables → Actions**:

- `LT_USERNAME`
- `LT_ACCESS_KEY`

| Workflow | What it does | When |
|---|---|---|
| **Run Tests** (`run-tests.yml`) | Runs the tests already in `.testmuai/tests/`, then prints results and coverage in the job summary. A few minutes, no design credits | **Use this for a demo** |
| **KaneAI Assurance Pipeline** (`assurance-pipeline.yml`) | The full flow, including designing tests for the 7 use-cases that have none. 45–60 min, spends design credits | When you want the whole story end to end |

Both are manual: **Actions → pick the workflow → Run workflow**. Nothing runs automatically on push.

`Run Tests` takes an optional `test_file` input to run a single test instead of all of them. Results land in the job summary with a Test Manager link per test, and the evidence packs are uploaded as an artifact.

## Notes

- Run `npm` commands in `app/`. Run every `kane-cli` command from the **repo root** — that's where `.context/` lives.
- Extracting and designing use AI and consume credits. Running an already-authored test replays a recording: fast and free.
- The app implements the v1 PRD only, so v2 requirements show up as gaps. That's the maintenance story.
