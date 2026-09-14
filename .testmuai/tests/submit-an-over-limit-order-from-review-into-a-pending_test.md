---
assurance:
  id: t-3
  base: sha256:343c7e33963024b9200e6c3e6caa7e8cc9bf9a5ee65e5ed1adf48f7b9c2a6d89
---
# Submit an over-limit order from review into a pending approval request

> Prove that approval routing uses the final order total including tax and delivery, shows the over-limit review state, and creates a pending approval request when the buyer submits.

## Step 1

Open {{over_limit_quote_locator}} in a browser. The store signs in as the Buyer persona automatically, so no login is required. Assert the Quote Builder page shows a line for {{laptop_product}} with quantity 30, then click "Proceed to Checkout".

## Step 2

On the Ship-to Site & Delivery page, click the saved site "HQ — San Jose", select the "Standard Ground" delivery method, and click "Continue to Payment".

## Step 3 @verifies ac-17, ac-18, ac-19

On the Payment page, keep the "Purchase Order" tab selected, enter {{valid_po_number}} in the PO number field, and click "Continue to Review", then on the Order Review page assert the banner reads "This order exceeds the $25,000 spending limit and requires Procurement Manager approval.", the primary action button reads "Submit for Approval", and the displayed Order Total is greater than $25,000.

## Step 4 @verifies ac-20, ac-21, ac-22, ac-23, ac-24

Click "Submit for Approval" and wait for the confirmation page, then assert it shows the heading "Submitted for Approval", a Request ID matching REQ-##### , status "Pending Approval", and the order total.

## Step 5 @verifies ac-21, ac-22, ac-23, ac-24

Click "View Approvals" to open the Approvals page, then assert the request card shows the same Request ID, the status "Pending Approval", the requester name "Priya Shah", a submitted date and time, and the order total.
