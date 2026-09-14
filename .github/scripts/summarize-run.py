#!/usr/bin/env python3
"""Print the run summary as markdown table rows (for the CI job summary).

Usage: summarize-run.py <summary-json>
"""
import json
import sys
from pathlib import Path

ICON = {"passed": "🟢 passed", "failed": "🔴 failed"}


def main() -> int:
    rows = json.loads(Path(sys.argv[1]).read_text())
    for row in rows:
        name = row["test"].split("/")[-1].replace("_test.md", "")
        status = ICON.get(row["status"], row["status"])
        link = f"[open]({row['share_url']})" if row.get("share_url") else "-"
        print(f"| {name} | {status} | {link} |")
    return 0


if __name__ == "__main__":
    sys.exit(main())
