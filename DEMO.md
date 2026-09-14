# Demo script — the two moments that land

Run these live. Total 10–12 minutes. Everything else in this repo is setup for these two.

**Before you start**

```bash
cd app && npm start          # Terminal 1 — http://localhost:3000
cd kane-assurance-hitech-demo # Terminal 2 — everything below runs here
kane-cli whoami              # must say ✓ Authenticated
```

---

## Moment 1 — The coverage ribbon (3 min)

> "Your traceability matrix is a spreadsheet somebody updates by hand, and it's wrong the day after they write it. Here's the same question answered from the requirements themselves."

```bash
kane-cli cover gaps
```

```
designed  100% ██████████  25/25 ACs have a verifying test
proven     93% █████████░  24/25 · 0 failing · 0 blocked · 1 not yet run

      USE CASE                                     DESIGNED           PROVEN
UC-1  Pay for an enterprise order                 0% ░░░░░░░░░░       no runs
UC-2  Approve or reject a high-value enterpr…     0% ░░░░░░░░░░       no runs
...
UC-3  Submit an over-limit enterprise order …   100% ██████████    89% █████████░
UC-8  Configure a device for a quote            100% ██████████   100% ██████████
```

**What to point at:**

- **Two axes, not one.** *Designed* is what the requirements owe. *Proven* is what a passing run actually demonstrated. Most tools only tell you the second, and only about code.
- **The zeros are the honest part.** Seven use-cases from the PRD have no tests. Nobody had to notice that — the graph knows, because the use-cases came from the PRD itself.
- **This is per requirement, not per file.** Line coverage can't tell you whether "orders above $25,000 need approval" is tested. This can.

Drill into one:

```bash
kane-cli cover gaps uc-8
```

> "Sixteen acceptance criteria, every one proven by a specific step in a specific run. Ask me how we know the configurator blocks 64 GB on the wrong processor — that's AC-6, and the evidence is one command away."

Then show where a test came from:

```bash
kane-cli context explain t-2
```

> "No model call — this is the recorded reasoning from when the test was designed. Six months from now it still answers 'why does this test exist?'"

---

## Moment 2 — The PRD changes (5 min)

> "Here's what normally kills a test suite. The product manager updates the requirements. Nobody tells QA which tests just became wrong."

Show the change first — v2 adds a Finance Director above $100K, Net 45 terms, and a Device-as-a-Service subscription:

```bash
diff docs/prd-enterprise-procurement.md docs/prd-enterprise-procurement-v2.md | head -40
```

Now feed the new version to the graph:

```bash
kane-cli maintain reconcile \
  --from docs/prd-enterprise-procurement-v2.md \
  --source-id prd-enterprise-procurement
```

This is the **interactive card review**: each proposed change comes up as a card — add, modify, archive — and nothing commits until you give a verdict. Walk a couple of cards out loud, approve them.

*(Headless preview instead, if you'd rather not drive the chat: add `--mode ci --plan`. It stages everything and commits nothing suite-side.)*

Then:

```bash
kane-cli context list --stale
```

> "These are the use-cases and tests the change invalidated. Not a guess — the graph knows which tests trace to the requirement lines that moved."

```bash
kane-cli cover gaps
```

> "And the ribbon just moved. New requirements, no tests. That gap appeared the moment the PRD changed, not six months later in an audit."

**The line to land it on:**

> "Test rot isn't something you fight here. The suite is derived from the requirements, so when the requirements move, the suite is *structurally* out of date, and it says so. The only question left is whether you approve the re-design."

---

## Reset afterwards

`.context/` is committed, so restoring the pre-demo state is one command:

```bash
git checkout .context
kane-cli context list --type usecase    # back to 9 trusted use-cases, v1 head
```

Check nothing else drifted:

```bash
git status --short
```

---

## If you have 3 more minutes

Run a test live so they see the browser drive itself:

```bash
kane-cli testmd run .testmuai/tests/submit-an-over-limit-order-from-review-into-a-pending_test.md \
  --agent --variables-file .testmuai/variables/novatech.json
```

Five steps: seeds a 30-unit quote, walks shipping and PO payment, hits the over-limit banner, submits for approval, and confirms the pending request on the Approvals page. The share URL at the end opens the report in Test Manager.

Or design a use-case from scratch, which takes 5–8 minutes and shows the AI doing the work:

```bash
kane-cli design tests --use-case uc-1 --mode ci --max 2
```

> "That's payment: PO format, the credit limit, the card cap, the three-strike lockout. Nobody wrote those tests — they came out of the PRD paragraph you just read."
