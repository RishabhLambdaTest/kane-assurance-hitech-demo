---
test: ../submit-an-over-limit-order-from-review-into-a-pending_test.md
status: passed
started: 2026-09-14T12:40:47.362Z
duration_s: 339
session_id: 861e556d-e6cc-4c42-9c79-d98b027452e4
---

# Submit an over-limit order from review into a pending approval request — Result

## Step 1 ✓ passed (56.8s)
md5: 92ec817e29cf106c05b6f1b74d752603
Open {{over_limit_quote_locator}} in a browser. The store signs in as the Buyer persona automatically, so no login is required. Assert the Quote Builder page shows a line for {{laptop_product}} with quantity 30, then click "Proceed to Checkout".

## Step 2 ✓ passed (55.5s)
md5: 959ed0e943cb30b8cd4bb36ad9f03e5a
On the Ship-to Site & Delivery page, click the saved site "HQ — San Jose", select the "Standard Ground" delivery method, and click "Continue to Payment".

## Step 3 ✓ passed (86.9s)
md5: 1594199c19f8700cee1f2678aa3edbd7
On the Payment page, keep the "Purchase Order" tab selected, enter {{valid_po_number}} in the PO number field, and click "Continue to Review", then on the Order Review page assert the banner reads "This order exceeds the $25,000 spending limit and requires Procurement Manager approval.", the primary action button reads "Submit for Approval", and the displayed Order Total is greater than $25,000.

## Step 4 ✓ passed (70.2s)
md5: fbb7fb50bd41084b6b1f9a3d410fabff
Click "Submit for Approval" and wait for the confirmation page, then assert it shows the heading "Submitted for Approval", a Request ID matching REQ-##### , status "Pending Approval", and the order total.

## Step 5 ✓ passed (66.3s)
md5: 84f5f8391ac1da9eeb91ff174b528f39
Click "View Approvals" to open the Approvals page, then assert the request card shows the same Request ID, the status "Pending Approval", the requester name "Priya Shah", a submitted date and time, and the order total.
