#!/usr/bin/env python3
"""Append one test's result to a summary JSON file.

Usage: record-run.py <kane-output-file> <test-path> <summary-json>

Reads the terminal `test_md_done` NDJSON line from a `kane-cli testmd run
--agent` capture and records its status plus Test Manager share URL.
"""
import json
import sys
from pathlib import Path


def main() -> int:
    out_path, test_file, summary_path = sys.argv[1:4]

    status, share = "unknown", ""
    for line in Path(out_path).read_text(errors="replace").splitlines():
        if '"type":"test_md_done"' in line:
            try:
                done = json.loads(line)
                status = done.get("overall_status", "unknown")
                share = done.get("share_url", "")
            except json.JSONDecodeError:
                pass

    summary = Path(summary_path)
    rows = json.loads(summary.read_text()) if summary.exists() else []
    rows.append({"test": test_file, "status": status, "share_url": share})
    summary.write_text(json.dumps(rows, indent=2))

    print(f"{test_file}: {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
