---
test: ../laptop-configurator-shows-and-enforces-incompatible-options_test.md
status: passed
started: 2026-09-14T11:25:52.328Z
duration_s: 248
session_id: 2f79131e-835e-45a3-83bc-b37fbbe820fd
---

# Laptop configurator shows and enforces incompatible options — Result

## Step 1 ✓ passed (34.8s)
md5: c6be410f96d3d3ecb8569efb148ccc91
Open {{start_url}} in a browser, navigate to the catalog entry for {{laptop_product}}, and launch the configurator for that laptop product.

## Step 2 ✓ passed (62.6s)
md5: 8a98936a3da618f8c83c3cf7d04e26ec
In the configurator for {{laptop_product}}, inspect the Processor, Memory, and Storage selectors, then assert Processor lists Core Ultra 5 / Core Ultra 7 / Core Ultra 9 with +$0 / +$250 / +$550, Memory lists 16 GB / 32 GB / 64 GB with +$0 / +$200 / +$500, Storage lists 512 GB / 1 TB / 2 TB / 4 TB with +$0 / +$150 / +$350 / +$700, and the 4 TB option remains visible, is disabled, and shows the reason "Workstation only".

## Step 3 ✓ passed (59.4s)
md5: 7e0b168c9bb8f55ee4ccc21818af168d
In the same configurator, select Core Ultra 9 as the processor and 64 GB as the memory choice, and store the displayed processor and memory selections as baseline_processor and baseline_memory.

## Step 4 ✓ passed (87.2s)
md5: 252391b7a656908589b036f8b07783ff
Still in the laptop configurator, change the processor from Core Ultra 9 to Core Ultra 7, then assert the selected memory has changed to 32 GB, the message reads `64 GB memory requires Core Ultra 9 — memory changed to 32 GB`, the 64 GB memory option remains visible with a compatibility reason and is not silently hidden, and the displayed running unit price finishes updating within 200 ms of the downgrade.
