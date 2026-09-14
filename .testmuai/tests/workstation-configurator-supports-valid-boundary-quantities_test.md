---
assurance:
  id: t-1
  base: sha256:571d993bafb45695dff4efd3643a8b9288311c9f1bd38218c574b04077b0d41f
---
# Workstation configurator supports valid boundary quantities and immediate price updates

> Prove a workstation configuration remains orderable across representative valid option combinations, the running unit price updates immediately as selections change, and the configuration can be added with the valid boundary quantities 1 and 500.

## Step 1

Open {{start_url}} in a browser, navigate to the catalog entry for {{workstation_product}}, and launch the configurator for that workstation product.

## Step 2 @verifies ac-14, ac-2, ac-3, ac-4, ac-5

In the configurator for {{workstation_product}}, inspect the Processor, Memory, Storage, and Operating System selectors, then assert they list Core Ultra 5 / Core Ultra 7 / Core Ultra 9 with +$0 / +$250 / +$550, 16 GB / 32 GB / 64 GB with +$0 / +$200 / +$500, 512 GB / 1 TB / 2 TB / 4 TB with +$0 / +$150 / +$350 / +$700, Windows 11 Pro / Ubuntu 24.04 LTS with +$0 / −$50, and that 4 TB storage is enabled for selection on this workstation.

## Step 3 @verifies ac-1

In the same configurator, sweep these valid workstation combinations one by one: Core Ultra 5 + 16 GB + 512 GB + Ubuntu 24.04 LTS at quantity 1; Core Ultra 5 + 16 GB + 4 TB + Ubuntu 24.04 LTS at quantity 500; Core Ultra 5 + 16 GB + 4 TB + Windows 11 Pro at quantity 1; Core Ultra 5 + 16 GB + 512 GB + Windows 11 Pro at quantity 500; Core Ultra 7 + 32 GB + 4 TB + Ubuntu 24.04 LTS at quantity 1; Core Ultra 7 + 32 GB + 512 GB + Ubuntu 24.04 LTS at quantity 500; Core Ultra 7 + 32 GB + 512 GB + Windows 11 Pro at quantity 1; Core Ultra 7 + 32 GB + 4 TB + Windows 11 Pro at quantity 500; Core Ultra 9 + 64 GB + 512 GB + Ubuntu 24.04 LTS at quantity 1; Core Ultra 9 + 64 GB + 4 TB + Ubuntu 24.04 LTS at quantity 500; Core Ultra 9 + 64 GB + 4 TB + Windows 11 Pro at quantity 1; and Core Ultra 9 + 64 GB + 512 GB + Windows 11 Pro at quantity 500, then assert after each option change the displayed running unit price finishes updating within 200 ms.

## Step 4 @verifies ac-12, ac-15, ac-16

Return the configurator to Core Ultra 9, 64 GB, 4 TB, and Ubuntu 24.04 LTS for {{workstation_product}}, enter quantity 1, and add the configuration to the quote, then assert the quote page shows a line for {{workstation_product}} whose configuration summary lists Core Ultra 9, 64 GB, 4 TB, and Ubuntu 24.04 LTS and whose quantity is 1.

## Step 5 @verifies ac-13, ac-15, ac-16

Navigate back to the catalog entry for {{workstation_product}}, relaunch its configurator, set Core Ultra 5, 16 GB, 512 GB, and Windows 11 Pro, enter quantity 500, and add the configuration to the quote, then assert the quote page shows a line for {{workstation_product}} whose configuration summary lists Core Ultra 5, 16 GB, 512 GB, and Windows 11 Pro and whose quantity is 500.
