# Run Guide — NovaTech Hi-Tech Assurance Flow (kane-cli)

Step-by-step: start the app, then drive the full requirements → tests → evidence flow with kane-cli.
Verified with **kane-cli 0.8.10** on macOS.

---

## 0. Prerequisites (one time)

```bash
# Node 20+, Google Chrome, Python 3
brew install lambdatest/kane/kane-cli        # or: npm install -g @testmuai/kane-cli
kane-cli --version

export KANE_CLI_USER_AGENT=my-laptop
kane-cli login --username "$LT_USERNAME" --access-key "$LT_ACCESS_KEY"
kane-cli whoami                               # must show ✓ Authenticated
kane-cli balance                              # design + authoring consume credits
```

Optional — pick where test cases land in Test Manager:
```bash
kane-cli config project <PROJECT_ID>
kane-cli config folder  <FOLDER_ID>
```

---

## 1. Start the app under test (Terminal 1)

```bash
cd kane-assurance-hitech-demo/app
npm install
npm run build && npm start          # production mode on http://localhost:3000
# (or: npm run dev)
```

Check: open http://localhost:3000 → NovaTech Business catalog loads.
Leave this terminal running. Tests start from `http://localhost:3000/?reset=1` (clears state).

---

## 2. Run the flow (Terminal 2, from the repo root)

```bash
cd kane-assurance-hitech-demo
export KANE_CLI_USER_AGENT=my-laptop
```

### Stage 1 — Ingest the PRD  (~5 s)
```bash
kane-cli context ingest docs/prd-enterprise-procurement.md --mode ci
kane-cli context list --type source
```

### Stage 2 — Extract use-cases  (~3 min, AI)
```bash
kane-cli context extract --mode ci
kane-cli context list --type usecase          # expect ~8 use-cases, trust = derived
```

### Stage 3 — Approve (human review gate)
Interactive (recommended for a live demo):
```bash
kane-cli context review
```
Headless / CI (approve everything pending):
```bash
bash .github/scripts/approve-derived.sh
kane-cli context list --type usecase          # trust = trusted
```

### Stage 4 — Design tests  (~5–8 min per use-case, AI)
One use-case (best for demos):
```bash
kane-cli design tests --use-case uc-8 --mode ci --max 2
bash .github/scripts/approve-derived.sh        # approve new ACs / scenarios / tests
ls .testmuai/tests/*_test.md
```
All use-cases (long — 45–60 min):
```bash
for uc in $(kane-cli context list --type usecase --json | python3 -c "import json,sys;[print(json.loads(l)['id']) for l in sys.stdin if l.startswith('{')]"); do
  kane-cli design tests --use-case "$uc" --mode ci --max 2
  bash .github/scripts/approve-derived.sh
done
```
Explain why a test exists (no AI cost):
```bash
kane-cli context explain t-2
```

### Stage 5 — Fill test variables
Designed tests use `{{placeholders}}`. List them:
```bash
grep -ohE '\{\{[a-zA-Z0-9_]+\}\}' .testmuai/tests/*_test.md | sort -u
```
Add any missing ones to `.testmuai/variables/novatech.json` (starter file included):
```json
{
  "start_url": { "value": "http://localhost:3000/?reset=1", "secret": false },
  "laptop_product": { "value": "NovaBook 14 Business", "secret": false },
  "workstation_product": { "value": "NovaStation X Workstation", "secret": false }
}
```
Useful values: PO `PO-123456`, card `4111111111111111` / `12/30` / `123`, declined card `4000000000000000`,
approval-path quote `http://localhost:3000/quote?seed=d1:30`, approver `?role=approver`.

### Stage 6 — Run tests (author first time, replay after)  (~4 min per test first run)
One test (watch the browser — drop `--headless`):
```bash
kane-cli testmd run .testmuai/tests/laptop-configurator-shows-and-enforces-incompatible-options_test.md \
  --agent --variables-file .testmuai/variables/novatech.json
```
All tests, headless:
```bash
for t in .testmuai/tests/*_test.md; do
  kane-cli testmd run "$t" --agent --headless --variables-file .testmuai/variables/novatech.json
done
```
Each run prints a Test Manager share URL (`share_url` in the `test_md_done` line) and an evidence pack path.
Run it again → it **replays** from the recording (fast, no AI).

### Stage 7 — Coverage
```bash
kane-cli cover gaps                  # designed × proven ribbon
kane-cli cover gaps uc-8             # dossier for one use-case
kane-cli cover                       # depth proven by newest evidence pack
kane-cli context view                # interactive HTML graph in the browser
```

### Stage 8 — Evidence
```bash
PACKS=$(find ~/.testmuai/kaneai/sessions -name '*.evidence' -newer docs/prd-enterprise-procurement.md)
for p in $PACKS; do kane-cli evidence validate "$p" --profile L1; done
kane-cli evidence merge $PACKS --run-id local-demo --title "NovaTech assurance run" --on-collision prefer-latest
kane-cli evidence serve .testmuai/evidence/local-demo.evidence     # view in browser
```

### Stage 9 — Maintenance: the PRD changes (the closer)
```bash
kane-cli maintain reconcile \
  --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement \
  --mode ci --plan                     # preview the changeset, commits nothing
kane-cli maintain reconcile --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement   # interactive: approve/reject each card
kane-cli context list --stale          # affected use-cases / tests
kane-cli cover gaps                    # new gaps: Device-as-a-Service, 2-level approval, Net 45
```

---

## 3. Trigger from GitHub Actions

1. Push the repo to GitHub. Add secrets `LT_USERNAME`, `LT_ACCESS_KEY`.
2. The app must be reachable from the runner — deploy `app/` (Vercel: workflow **0 · Setup**) and use that URL as `start_url`.
3. Actions → pick a workflow → **Run workflow** → fill inputs.

---

## Reset / start over

```bash
rm -rf .context .testmuai/tests       # wipe graph + designed tests (keeps variables)
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `design tests` refuses: use-case not reviewed | Run Stage 3 approve, or add `--allow-unreviewed` |
| `design tests` exits 3 (paused) | `kane-cli context sessions` → `kane-cli design tests --resume <sid> --mode ci` |
| Test step can't find product / page | Check app is running on :3000 and variables file values |
| `extract` says nothing to do | Source already extracted — add `--force` |
| Stale state between tests | Start URL must include `?reset=1` |
