# Run Guide — ingestion to execution, line by line

Every command below was run against **kane-cli 0.8.10**. Run them in order.

**Two rules:**
- `npm` commands run in `app/`
- every `kane-cli` command runs from the **repo root** (`.context/` lives there). Anywhere else you get `(no matching nodes)`.

---

## Setup

```bash
kane-cli whoami
```
Must print `✓ Authenticated`. If not:
```bash
kane-cli login --username "<LT_USERNAME>" --access-key "<LT_ACCESS_KEY>"
```

```bash
kane-cli balance
```
Extract and design spend credits. Replaying an authored test does not.

```bash
export KANE_CLI_USER_AGENT=my-laptop
```
Any short name. Set once per terminal.

---

## Start the app — Terminal 1

```bash
cd app
npm install
npm run build
npm start
```
Serves http://localhost:3000. Leave it running. Open it in a browser to confirm the NovaTech catalog loads.

---

## The flow — Terminal 2, from the repo root

### 1. Ingest the PRD  · ~5 s

```bash
kane-cli context ingest docs/prd-enterprise-procurement.md --mode ci
```
Lands the PRD in the graph. `--mode ci` lands only, it does not extract.

- First time: `created prd-enterprise-procurement source sha256:…`
- Already in this repo: `prd-enterprise-procurement unchanged — already landed`. Not an error, move on.

```bash
kane-cli context list --type source
```
Confirms the source is in the graph.

### 2. Extract use-cases  · ~3 min, AI

```bash
kane-cli context extract --mode ci
```
The agent reads the PRD and proposes use-cases, each cited to the document.

- First time: `saved 8 use-case(s) · 8 awaiting review`
- In this repo: `extract: nothing to do — every ingested source is already extracted`. Expected — the 9 use-cases are committed. Add `--force` only if you want to regenerate them.

```bash
kane-cli context list --type usecase
```
New items show `trust = derived`, meaning awaiting review.

### 3. Approve — the human gate

```bash
kane-cli context review
```
Interactive: approve / skip / defer each item. Best for a live demo.

Or approve everything pending, non-interactively:
```bash
bash .github/scripts/approve-derived.sh
```
Prints `approve-derived: approving N node(s)`.

```bash
kane-cli context list --type usecase
```
All 9 should now read `trusted`.

### 4. See what needs designing

```bash
kane-cli cover gaps
```
The ribbon: designed × proven, per use-case. In this repo uc-8 and uc-3 have tests; the rest sit at 0%.

### 5. Design tests for one use-case  · ~5–8 min, AI

```bash
kane-cli design tests --use-case uc-1 --mode ci --max 2
```
Produces acceptance criteria, scenarios, and one test per scenario. `--max 2` caps it at 2 scenario+test pairs.

Ends with `saved N … as drafts` and `⚒ wrote …_test.md`.

**Exit code 3 means paused, not failed:**
```bash
kane-cli context sessions
kane-cli design tests --resume <session-id> --mode ci
```

Approve what it designed:
```bash
bash .github/scripts/approve-derived.sh
ls .testmuai/tests/*_test.md
```

*(Skip this step to demo what's already here — uc-8 and uc-3 are designed and committed.)*

### 6. Check the test variables

```bash
grep -ohE '\{\{[a-zA-Z0-9_]+\}\}' .testmuai/tests/*_test.md | sort -u
```
Every placeholder needs a value in `.testmuai/variables/novatech.json`, or the step using it fails. The ones in use are all filled in:

| Variable | Value |
|---|---|
| `start_url` | `http://localhost:3000/?reset=1` |
| `laptop_product` | `NovaBook 14 Business` |
| `workstation_product` | `NovaStation X Workstation` |
| `over_limit_quote_locator` | `http://localhost:3000/quote?reset=1&seed=d1:30` |
| `valid_po_number` | `PO-123456` |
| `tax_exempt_id` | `EXM-123456` |

### 7. Run a test  · ~4 min first time, seconds after

```bash
kane-cli testmd run .testmuai/tests/laptop-configurator-shows-and-enforces-incompatible-options_test.md \
  --agent --variables-file .testmuai/variables/novatech.json
```
First run **authors** it — the agent drives the browser and records what it did. Every later run **replays** that recording: fast, no AI. Add `--headless` to hide the browser.

The last output line carries `overall_status` and a Test Manager `share_url`. The evidence pack path is printed on stderr.

Run all three:
```bash
for t in .testmuai/tests/*_test.md; do
  kane-cli testmd run "$t" --agent --headless --variables-file .testmuai/variables/novatech.json
done
```

**If a step fails**, see where it stopped:
```bash
grep -E "^## Step|Reason" .testmuai/tests/output-<test-name>/Result.md
```
A designed test is prose — fix it by editing English, then re-run. Untouched steps replay; the edited one re-authors. Two real examples from this repo:

| Reason in `Result.md` | Cause | Fix |
|---|---|---|
| `DAG cycle detector forced stuck` | One step swept 12 configurations — looks like a loop | Cut it to a few representative ones |
| `AP determined agent is stuck — no viable actions remain` | The step asserted "updates **within 200 ms**" — the agent can't measure that, so it retried until it stalled | Assert a value instead: "the price reads $4,599.00" |

Keep timing and other performance targets out of browser assertions.

### 8. Coverage

```bash
kane-cli cover gaps
```
```bash
kane-cli cover gaps uc-8
```
Per-AC dossier: which are proven, which are blocked (their step never ran), which are failing.

```bash
kane-cli context view
```
The whole graph as an interactive HTML page.

### 9. Evidence

```bash
PACK=$(ls -t ~/.testmuai/kaneai/sessions/*/evidence/*.evidence | head -1)
kane-cli evidence validate "$PACK" --profile L1
kane-cli evidence serve "$PACK"
```
Sealed, auditable record of a run — steps, screenshots, assertions.

### 10. The PRD changes — the maintenance demo

```bash
kane-cli maintain reconcile \
  --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement \
  --mode ci --plan
```
`--plan` previews the changeset and commits nothing. Drop `--mode ci --plan` for the interactive card review, where you approve or reject each proposed change.

```bash
kane-cli context list --stale
kane-cli cover gaps
```
v2 adds Device-as-a-Service, a second approver above $100K, and Net 45 terms. The app implements v1 only, so those surface as gaps.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `(no matching nodes)` | Wrong directory — `cd` to the repo root, not `app/` |
| `npm error … no such file … package.json` | Wrong directory — `npm` runs in `app/` |
| ingest says `unchanged` | Same content already landed. Not an error |
| extract says `nothing to do` | Already extracted. `--force` regenerates |
| `--plan/--force/--trust … not available when only landing` | `--force` doesn't work with `ingest --mode ci`. Put it on `context extract` |
| `design tests` exits 3 | Paused. `kane-cli context sessions`, then `--resume <sid>` |
| A test step can't find a page or product | App not running on :3000, or a `{{variable}}` has no value |
| Stale quote or approval state between runs | Start URL needs `?reset=1` |

## App test hooks

| Hook | Effect |
|---|---|
| `?reset=1` | Clears quote, persona, approval requests |
| `?seed=d1:30` | Sets the quote to exactly those lines (`productId:qty`) |
| `?role=approver` | Switches to Marcus Lee, Procurement Manager |
| Card ending `0000` | Declined (3 declines lock card payment for 15 min) |
| Product `d8` | Always fails stock allocation at placement |
| Product `d4` | End of Life — blocks checkout |
