---
test: ../workstation-configurator-supports-valid-boundary-quantities_test.md
status: passed
started: 2026-09-14T12:29:51.383Z
duration_s: 163
session_id: 1a24451f-aaa7-4677-bf74-ca5dee3f3aad
---

# Workstation configurator supports valid boundary quantities and immediate price updates — Result

## Step 1 ✓ passed (3.91s)
md5: 02e6255b0fc3aaf488dac1bee7d5e75d
Open {{start_url}} in a browser, navigate to the catalog entry for {{workstation_product}}, and launch the configurator for that workstation product.

## Step 2 ✓ passed (0.35s)
md5: 1a601377e354e5ceb6f2de159cd96ae6
In the configurator for {{workstation_product}}, inspect the Processor, Memory, Storage, and Operating System selectors, then assert they list Core Ultra 5 / Core Ultra 7 / Core Ultra 9 with +$0 / +$250 / +$550, 16 GB / 32 GB / 64 GB with +$0 / +$200 / +$500, 512 GB / 1 TB / 2 TB / 4 TB with +$0 / +$150 / +$350 / +$700, Windows 11 Pro / Ubuntu 24.04 LTS with +$0 / −$50, and that 4 TB storage is enabled for selection on this workstation.

## Step 3 ✓ passed (46.8s)
md5: e1bf964e488b443091276fe9a67cc8b8
In the same configurator, select Core Ultra 9 as the processor, then 64 GB as the memory, then 4 TB as the storage, then Ubuntu 24.04 LTS as the operating system, then assert the displayed running unit price in the Summary panel reads $4,599.00.

## Step 4 ✓ passed (49s)
md5: 41d8c761d432e03ff1fa5a7e39637c12
Return the configurator to Core Ultra 9, 64 GB, 4 TB, and Ubuntu 24.04 LTS for {{workstation_product}}, enter quantity 1, and add the configuration to the quote, then assert the quote page shows a line for {{workstation_product}} whose configuration summary lists Core Ultra 9, 64 GB, 4 TB, and Ubuntu 24.04 LTS and whose quantity is 1.

## Step 5 ✓ passed (60.6s)
md5: 03d79df8d72a17dc78e2e5c76d7681aa
Navigate back to the catalog entry for {{workstation_product}}, relaunch its configurator, set Core Ultra 5, 16 GB, 512 GB, and Windows 11 Pro, enter quantity 500, and add the configuration to the quote, then assert the quote page shows a line for {{workstation_product}} whose configuration summary lists Core Ultra 5, 16 GB, 512 GB, and Windows 11 Pro and whose quantity is 500.
