---
assurance:
  id: t-2
  base: sha256:6ed7274822f69d42dd8ee5d2a4c88fe4ae5698c2d48f0a1617014c65bf67b6bc
---
# Laptop configurator shows and enforces incompatible options

> Prove a laptop configuration keeps incompatible choices visible and disabled with their reasons, and that downgrading the processor from a 64 GB selection auto-corrects memory to 32 GB with the exact warning message.

## Step 1

Open {{start_url}} in a browser, navigate to the catalog entry for {{laptop_product}}, and launch the configurator for that laptop product.

## Step 2 @verifies ac-2, ac-3, ac-4, ac-8, ac-9, ac-10, ac-11

In the configurator for {{laptop_product}}, inspect the Processor, Memory, and Storage selectors, then assert Processor lists Core Ultra 5 / Core Ultra 7 / Core Ultra 9 with +$0 / +$250 / +$550, Memory lists 16 GB / 32 GB / 64 GB with +$0 / +$200 / +$500, Storage lists 512 GB / 1 TB / 2 TB / 4 TB with +$0 / +$150 / +$350 / +$700, and the 4 TB option remains visible, is disabled, and shows the reason "Workstation only".

## Step 3

In the same configurator, select Core Ultra 9 as the processor and 64 GB as the memory choice, and store the displayed processor and memory selections as baseline_processor and baseline_memory.

## Step 4 @verifies ac-1, ac-6, ac-7, ac-9, ac-10, ac-11

Still in the laptop configurator, change the processor from Core Ultra 9 to Core Ultra 7, then assert the selected memory has changed to 32 GB, the message reads `64 GB memory requires Core Ultra 9 — memory changed to 32 GB`, the 64 GB memory option remains visible with a compatibility reason and is not silently hidden, and the displayed running unit price finishes updating within 200 ms of the downgrade.
