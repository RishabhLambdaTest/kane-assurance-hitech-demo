# Run Guide — NovaTech Hi-Tech Assurance Flow

Manual, one-command-at-a-time runbook. Every flag below was checked against `kane-cli --help` on **kane-cli 0.8.10** (macOS). No invented flags.

> **Run every `kane-cli` command from the REPO ROOT** (`kane-assurance-hitech-demo/`), never from `app/`.
> The assurance graph lives in `./.context/`, so from any other directory kane-cli reports `(no matching nodes)`.
> Only `npm` commands run inside `app/`.

---

## 0. One-time setup

```bash
kane-cli --version                      # expect 0.8.10 or newer
kane-cli whoami                         # must print ✓ Authenticated
kane-cli balance                        # extract/design/authoring spend credits
```

Not authenticated yet:

```bash
kane-cli login --username "<LT_USERNAME>" --access-key "<LT_ACCESS_KEY>"
```

Optional — where test cases land in Test Manager:

```bash
kane-cli config show
kane-cli config project <PROJECT_ID>
kane-cli config folder <FOLDER_ID>
```

Set once per shell (telemetry tag, any short name):

```bash
export KANE_CLI_USER_AGENT=my-laptop
```

---

## 1. Start the app under test — Terminal 1

```bash
cd kane-assurance-hitech-demo/app
npm install
npm run build
npm start                               # http://localhost:3000
```

Verify in a browser: http://localhost:3000 shows the NovaTech catalog. Leave this terminal running.

Tests start from `http://localhost:3000/?reset=1`, which clears quote, persona and approval state.

---

## 2. The flow — Terminal 2, from the repo root

```bash
cd kane-assurance-hitech-demo
export KANE_CLI_USER_AGENT=my-laptop
```

Run these in order. Each step says what to expect and roughly how long it takes.

### Step 1 — Land the PRD in the graph  (~5 s, no AI)

```bash
kane-cli context ingest docs/prd-enterprise-procurement.md --mode ci
```

- `--mode ci` **lands only** — it does not extract.
- Output is `created …` on a first ingest, or `unchanged …` if the same content was already landed. `unchanged` is not an error.

Check it landed:

```bash
kane-cli context list --type source
```

### Step 2 — Extract use-cases  (~2–3 min, AI)

```bash
kane-cli context extract --mode ci
```

Expect `saved N use-case(s) · N awaiting review`.

```bash
kane-cli context list --type usecase
```

New use-cases show `trust = derived`, meaning they are awaiting review.

**If extract says there is nothing to do**, the snapshot was already extracted. Force a re-extract:

```bash
kane-cli context extract --mode ci --force
```

> **`--force` is rejected on `context ingest --mode ci`**: *"--plan/--force/--trust steer the extraction — not available when only landing"*. Put `--force` on `context extract` instead, or land and extract in one headless step with `kane-cli context ingest <file> --mode agent --force`.

### Step 3 — Review gate

Interactive review chat (best for a live demo — approve / skip / defer each item):

```bash
kane-cli context review
```

Headless, approve everything pending:

```bash
bash .github/scripts/approve-derived.sh
```

Approve specific refs instead:

```bash
kane-cli context review --mode agent --approve uc-1 uc-2
```

Confirm they flipped to `trusted`:

```bash
kane-cli context list --type usecase
```

### Step 4 — See what still needs designing  (instant, no AI)

```bash
kane-cli cover gaps
```

The ribbon shows `designed × proven` per use-case. Each pending row carries a ready-to-paste `ready_command`, visible in the JSON form:

```bash
kane-cli cover gaps --json
```

### Step 5 — Design tests for ONE use-case  (~5–8 min each, AI)

```bash
kane-cli design tests --use-case uc-1 --mode ci --max 2
```

- `--max 2` caps it at 2 scenario+test pairs. Leave it off and kane-cli sizes the budget itself.
- Expect `saved N ACs / scenarios / tests as drafts` and `⚒ wrote …_test.md`.
- **Exit code 3 means the session paused**, not failed. Resume it:

  ```bash
  kane-cli context sessions
  kane-cli design tests --resume <session-id> --mode ci
  ```
- Designing against a use-case that isn't approved yet: add `--allow-unreviewed`.
- Redesigning a use-case that already has a design: add `--force`.

Approve what it just designed (ACs, scenarios, tests):

```bash
bash .github/scripts/approve-derived.sh
ls .testmuai/tests/*_test.md
```

Repeat Step 5 for the next use-case. Design one at a time so you can watch each one.

Why does a test exist (replays recorded reasoning, no AI cost):

```bash
kane-cli context explain t-2
```

### Step 6 — Fill in test variables  (no AI)

Designed tests contain `{{placeholders}}`. List every one in use:

```bash
grep -ohE '\{\{[a-zA-Z0-9_]+\}\}' .testmuai/tests/*_test.md | sort -u
```

Add any missing key to `.testmuai/variables/novatech.json`:

```json
{
  "start_url": { "value": "http://localhost:3000/?reset=1", "secret": false },
  "laptop_product": { "value": "NovaBook 14 Business", "secret": false },
  "workstation_product": { "value": "NovaStation X Workstation", "secret": false }
}
```

Values that match the app's built-in test hooks:

| Need                      | Value                                             |
| ------------------------- | ------------------------------------------------- |
| Approval path (over $25K) | `http://localhost:3000/quote?seed=d1:30`        |
| Over credit limit ($150K) | `http://localhost:3000/quote?seed=d3:60`        |
| Over card cap ($10K)      | `http://localhost:3000/quote?seed=d6:50`        |
| Approver persona          | `http://localhost:3000/approvals?role=approver` |
| Valid PO number           | `PO-123456`                                     |
| Card that succeeds        | `4111111111111111` · `12/30` · `123`      |
| Card that is declined     | `4000000000000000`                              |

A test that runs with an unresolved `{{var}}` fails on the step that needs it.

### Step 7 — Run one test  (~4 min first time, seconds on replay)

Watch it drive a visible Chrome window:

```bash
kane-cli testmd run .testmuai/tests/laptop-configurator-shows-and-enforces-incompatible-options_test.md \
  --agent --variables-file .testmuai/variables/novatech.json
```

Headless:

```bash
kane-cli testmd run .testmuai/tests/<file>_test.md \
  --agent --headless --variables-file .testmuai/variables/novatech.json
```

- The first run **authors** the test (the agent works out the interactions). Every later run **replays** the recording — fast, no AI.
- The final `test_md_done` NDJSON line carries `overall_status` and a Test Manager `share_url`.
- The evidence pack path is printed on **stderr**: `evidence: view locally with kane-cli evidence serve <path>`.
- Override the start URL for one run with `--url http://localhost:3000/?reset=1`.

#### When a step fails for a test-design reason

A designed test is prose, so fixing it means editing English — not code, and not the app. Re-running replays the untouched steps and re-authors from the changed one. Two failures seen on this repo, both reported by kane-cli as `automation_bug` rather than a product bug:

| Failure reason in `Result.md` | Cause | Fix |
|---|---|---|
| `DAG cycle detector forced stuck — repeated cycles without resolution` | One step asked for a sweep of 12 configuration combinations, which looks like a loop | Split it, or cut it to a few representative combinations |
| `AP determined agent is stuck — no viable actions remain` | The step asserted "the price finishes updating **within 200 ms**". The agent can't measure a millisecond budget, so it retries the check until it stalls | Assert the observable outcome instead — e.g. "the running unit price reads $4,599.00" |

**Rule of thumb:** keep timing and other performance NFRs out of browser assertions. Assert values, text and states the agent can actually read. Check where a run stopped with:

```bash
grep -E "^## Step|Reason" .testmuai/tests/output-<test-name>/Result.md
```

Skipped steps leave their ACs `blocked` in `cover gaps` — meaning never exercised, which is different from failing.

Run every designed test:

```bash
for t in .testmuai/tests/*_test.md; do
  kane-cli testmd run "$t" --agent --headless --variables-file .testmuai/variables/novatech.json
done
```

### Step 8 — Coverage  (instant, no AI)

```bash
kane-cli cover gaps                     # designed × proven ribbon
kane-cli cover gaps uc-8                # full dossier for one use-case
kane-cli cover                          # depth proven by the newest evidence pack
kane-cli cover gaps --stage design      # design axis only (design | cover | all)
```

Interactive HTML graph:

```bash
kane-cli context view                   # opens in the browser
kane-cli context view --out graph.html --no-open
```

### Step 9 — Evidence  (no AI)

```bash
# newest pack from the last run
PACK=$(ls -t ~/.testmuai/kaneai/sessions/*/evidence/*.evidence | head -1)

kane-cli evidence validate "$PACK" --profile L1
kane-cli evidence serve "$PACK"         # view it in the browser
```

Merge several packs into one sealed bundle:

```bash
PACKS=$(ls -t ~/.testmuai/kaneai/sessions/*/evidence/*.evidence | head -5)
kane-cli evidence merge $PACKS \
  --run-id local-demo \
  --title "NovaTech assurance run" \
  --on-collision prefer-latest \
  -o .testmuai/evidence/local-demo.evidence
kane-cli evidence validate .testmuai/evidence/local-demo.evidence --profile L1
```

`evidence merge` refuses the whole merge if any input pack fails L1, so validate first and drop the bad ones.

### Step 10 — Maintenance: the PRD changes (the closer)

Preview only — the head moves, everything else is staged, nothing suite-side commits:

```bash
kane-cli maintain reconcile \
  --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement \
  --mode ci --plan
```

Interactive card review (approve / reject / defer each proposed change):

```bash
kane-cli maintain reconcile \
  --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement
```

Then:

```bash
kane-cli context list --stale           # what the change invalidated
kane-cli cover gaps                     # new gaps: DaaS, 2-level approval, Net 45
```

The app implements v1 only, so v2 requirements surface as gaps or failing tests. That's the point of the demo.

---

## Command / flag reference (verified on 0.8.10)

| Command                         | Flags that exist                                                                                                                                                              | Notes                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `context ingest <src...>`     | `--as <id>` · `--mode interactive\|agent\|ci\|override` · `--plan` · `--force` · `--trust auto\|hold`                                                               | `--force` only with a mode that extracts (`agent`/`override`), never with `ci`   |
| `context extract`             | `--mode` · `--force` · `--plan` · `--source <id>` · `--resume <sid>` · `--message` · `--trust`                                                            | `--mode` is required headless                                                          |
| `context review`              | `--verdicts <file>` · `--approve <refs...>` · `--skip` · `--defer` · `--mode agent\|ci` · `--queue` · `--json`                                             | There is**no** `--approve-all`                                                   |
| `context list`                | `--type source\|usecase` · `--inferred` · `--stale` · `--all` · `--json`                                                                                         | Type is`usecase`, **not** `use-case`. There is **no** `--trust` filter |
| `context view`                | `--out <path>` · `--open` · `--no-open` · `--json`                                                                                                                 | Flag is`--out`, **not** `--output`                                             |
| `context explain <ref>`       | `--json`                                                                                                                                                                    | Replays recorded reasoning, no model call                                                |
| `context sessions`            | `[show\|clean] [sid]` · `--all` · `--json`                                                                                                                             | For resuming paused sessions                                                             |
| `design tests`                | `--use-case <ref>` · `--max <n>` · `--mode` · `--force` · `--resume` · `--message` · `--plan` · `--allow-unreviewed` · `--phase` · `--strength`  | Exit 3 = paused and resumable                                                            |
| `cover`                       | `--from <pack>` · `--json` · `--mode`                                                                                                                                 | Depth from an evidence pack                                                              |
| `cover gaps [uc]`             | `--stage design\|cover\|all` · `--top <n>` · `--rollup lenient\|strict` · `--json` · `--mode`                                                                      |                                                                                          |
| `testmd run <path>`           | `--url` · `--headless` · `--agent` · `--variables-file` · `--variables` · `--timeout` · `--max-steps` · `--name` · `--mode` · `--assertion-mode` | No`--retry` flag on 0.8.10                                                             |
| `testrun run`                 | `--match <regex>` · `--tags` · `--from-context` · `--parallel` · `--headless` · `--dry-run` · `--on-failure` · `--remote`                              | Batch runner. Takes**no** `--url`                                                |
| `maintain reconcile`          | `--from <file>` · `--source-id <id>` · `--mode` · `--plan` · `--apply [path]`                                                                                   |                                                                                          |
| `evidence validate <target>`  | `--profile L0\|L1` · `--json`                                                                                                                                             |                                                                                          |
| `evidence merge <targets...>` | `--run-id` (required) · `-o/--out` · `--title` · `--on-collision` · `--rules` · `--json` · `--no-finalize`                                                |                                                                                          |
| `evidence serve <paths...>`   |                                                                                                                                                                               | Opens a local viewer                                                                     |

---

## Where this repo currently stands

Already done and committed, so you can skip ahead:

- Source `prd-enterprise-procurement` ingested
- **9 use-cases**, all approved (`uc-1` … `uc-9`)
- **16 ACs, 2 scenarios, 2 tests** — designed for `uc-8` (Configure a device) only
- 1 evidence pack from a passing run of `t-2`

To continue, start at **Step 5** with any of `uc-1` … `uc-7`, `uc-9`.

## Reset / start over

```bash
rm -rf .context .testmuai/tests         # wipe graph + designed tests (keeps variables)
kane-cli context ingest docs/prd-enterprise-procurement.md --mode ci   # then Step 2 onward
```

## Troubleshooting

| Symptom                                                                            | Cause / fix                                                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `(no matching nodes)`                                                            | Wrong directory —`cd` to the repo root, not `app/`                                                       |
| `--plan/--force/--trust steer the extraction — not available when only landing` | `--force` with `--mode ci` on ingest. Use `context extract --force`, or `ingest --mode agent --force` |
| ingest prints`unchanged`                                                         | Same file content already landed. Not an error — go to Step 2                                                |
| extract does nothing                                                               | Snapshot already extracted. Add`--force`                                                                    |
| `design tests` exits 3                                                           | Session paused.`kane-cli context sessions`, then `design tests --resume <sid> --mode ci`                  |
| `design tests` refuses: use-case not reviewed                                    | Approve it (Step 3), or pass`--allow-unreviewed`                                                            |
| Test step can't find a page or product                                             | App not running on :3000, or a`{{variable}}` has no value                                                   |
| Stale quote/approval state between tests                                           | Start URL must include`?reset=1`                                                                            |
| `evidence merge` refuses outright                                                | One input pack failed L1. Validate each, merge only the good ones                                             |

## Running it in CI instead

The same flow runs as one GitHub Actions pipeline (`.github/workflows/assurance-pipeline.yml`), which even builds and serves the app on the runner, so no deployment is needed. See the README.
