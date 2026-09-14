# PRD: Enterprise Device Procurement (Quote-to-Order)

**Product:** NovaTech Business Store
**Author:** Product Team
**Version:** 1.0
**Last Updated:** September 2026

---

## Overview

NovaTech Business Store is a B2B web application where corporate customers buy laptops, workstations, tablets, and accessories for their employees. This PRD covers the quote-to-order flow: device configuration, quote building with volume pricing and services, shipping and delivery, payment on account or by corporate card, spend-limit approval, and order confirmation.

Every user belongs to a single enterprise account (Acme Corp). The account has a negotiated credit line and a spending policy that routes high-value orders through an approval workflow.

---

## User Roles

- **Buyer (Requester)** — employee in IT or Procurement who configures devices, builds quotes, and places orders. Has a per-order spending limit of $25,000.
- **Procurement Manager (Approver)** — reviews and approves or rejects orders that exceed a Buyer's spending limit. Can also build quotes and place orders, but cannot approve their own requests.

---

## Functional Requirements

### FR-1: Product Catalog

The catalog lists all products available to the account. Each product card shows:
- Product name, category (Laptop, Workstation, Tablet, Accessory), and image
- Starting price ("From $X" for configurable products)
- Availability: "In Stock", "Backorder — ships in N days" when stock is zero, or "End of Life"

Configurable products (laptops, workstations) show a "Configure" button that opens the configurator (FR-2). Non-configurable products (accessories, tablets) show an "Add to Quote" button.

End-of-life (EOL) products display a grey "End of Life" badge, cannot be added to a quote, and show the recommended replacement product by name.

### FR-2: Device Configurator

The configurator lets the buyer choose components for a configurable device. The running unit price updates immediately as options change.

| Option | Choices | Price adjustment |
|--------|---------|-----------------|
| Processor | Core Ultra 5 / Core Ultra 7 / Core Ultra 9 | +$0 / +$250 / +$550 |
| Memory | 16 GB / 32 GB / 64 GB | +$0 / +$200 / +$500 |
| Storage | 512 GB / 1 TB / 2 TB / 4 TB | +$0 / +$150 / +$350 / +$700 |
| Operating System | Windows 11 Pro / Ubuntu 24.04 LTS | +$0 / −$50 |

Compatibility rules:
1. 64 GB memory requires the Core Ultra 9 processor. If the buyer downgrades the processor while 64 GB is selected, memory is automatically changed to 32 GB and the message "64 GB memory requires Core Ultra 9 — memory changed to 32 GB" is shown.
2. 4 TB storage is available on Workstation products only. On laptops the option is shown disabled with the reason "Workstation only".
3. Incompatible options are shown disabled with the reason visible next to them — they are never silently hidden.

The buyer sets a quantity (minimum 1, maximum 500) and clicks "Add to Quote".

### FR-3: Quote Builder

The quote page lists every configured line. Per line the buyer sees:
- Product name and configuration summary (processor, memory, storage, OS)
- Quantity (editable, minimum 1, maximum 500)
- List unit price and the volume-discounted unit price
- Selected services (FR-4) and line total

**Volume pricing** applies per line to the hardware unit price only (never to services):

| Quantity on line | Discount |
|------------------|----------|
| 1–9 | 0% |
| 10–49 | 5% |
| 50–99 | 10% |
| 100+ | 15% |

The quote summary shows: hardware subtotal (list), volume discount, services total, subtotal, tax ("TBD" until a shipping address is entered), delivery ("TBD" until a delivery method is chosen), and quote total.

**Stock and lead time:** If the line quantity exceeds available stock, the line shows "Backorder: N units ship in X days". Backorders do not block checkout, but they push out the estimated delivery date (FR-5).

**Save quote:** "Save Quote" generates a quote number in the format `Q-` followed by 6 digits and shows "Valid until" a date 30 calendar days from today.

If the quote is empty, the page shows "Your quote is empty" with a "Browse Catalog" link. No checkout button is shown.

"Proceed to Checkout" is disabled while the quote contains any end-of-life product; such lines show the "End of Life" badge and must be removed.

### FR-4: Services and Support

Each hardware line can add services, priced per device:

| Service | Price per device | Rule |
|---------|-----------------|------|
| Standard Warranty (1 year) | Included | Default |
| ProSupport (3 years, next business day onsite) | $149 | — |
| ProSupport Plus (3 years, includes accidental damage) | $249 | — |
| Windows Autopilot Enrollment | $12 | Windows 11 Pro only — disabled for Ubuntu |
| Custom OS Imaging | $15 | Requires line quantity of 10 or more |
| Asset Tagging | $5 | — |

Only one warranty tier may be selected per line. If a line's quantity drops below 10 while Custom OS Imaging is selected, the service is removed and the buyer sees "Custom OS Imaging requires 10 or more devices".

### FR-5: Shipping and Delivery

**Ship-to address.** The account's saved sites are listed for selection (e.g., "HQ — San Jose", "EU Hub — Frankfurt"); the buyer can also enter a new site.

Required fields: company name, attention (recipient name), street address line 1, city, state/province, postal code, country, phone number.
Optional fields: street address line 2, tax exemption certificate number.

Supported countries: United States, Canada, United Kingdom, Germany, France, Japan, India. Invalid postal code format for the selected country is a hard block — the form does not submit.

**Tax.** Tax is 8.25% of (discounted hardware + services). If a tax exemption certificate number is entered in the format `EXM-` followed by 6 digits, tax is $0.00. A certificate number in any other format shows "Invalid exemption certificate format (EXM-123456)" and blocks submission.

**Delivery method.**

| Method | Delivery window | Cost | Availability |
|--------|----------------|------|-------------|
| Standard Ground | 5–7 business days | Free if hardware subtotal ≥ $5,000, otherwise $49 | All countries |
| Expedited | 2–3 business days | $199 per order | United States, Canada |
| White-Glove Deployment | 10 business days | $75 per device | United States only; 25 or more devices on the order |

The estimated delivery date = today + the longest backorder lead time on the quote (if any) + the delivery window, counted in business days.

### FR-6: Payment

The payment step offers two methods:

**Purchase Order (on account)**
- PO number is required and must match the format `PO-` followed by 6 digits
- Payment terms are Net 30
- The account's available credit is $150,000. If the order total exceeds available credit, the buyer sees "Order total exceeds available credit of $150,000.00. Pay by corporate card or contact your account manager." and cannot continue with PO

**Corporate Card**
- Visa, Mastercard, and Amex; card number validated with a Luhn check; expiry must be in the future; CVV 3 digits (4 for Amex)
- Corporate cards are limited to $10,000 per order. Above that, the buyer sees "Corporate card payments are limited to $10,000 per order. Use a purchase order."
- If authorization fails, the buyer sees "Payment could not be processed. Please check your details or try another method." After 3 consecutive failures the card form is locked for 15 minutes and a support contact is shown

### FR-7: Spend Approval Workflow

Orders whose total (including tax and delivery) exceeds $25,000 require approval by a Procurement Manager.

- On order review, the buyer sees the banner "This order exceeds the $25,000 spending limit and requires Procurement Manager approval." The primary button reads "Submit for Approval" instead of "Place Order".
- Submitting creates an approval request with an ID in the format `REQ-` followed by 5 digits, status "Pending Approval", the requester's name, the total, and the submitted time.
- The Approvals page lists all requests with their status. Approvers see "Approve" and "Reject" actions on pending requests.
- Rejecting requires a reason of at least 10 characters. The request status becomes "Rejected" and the reason is shown to the requester.
- Approving changes the status to "Approved" and places the order, generating an order number (FR-8).
- **Segregation of duties:** an approver cannot approve or reject their own request. The actions are hidden and the message "You cannot approve your own request" is shown.
- Orders at or below $25,000 are placed directly without approval.

### FR-8: Order Review and Placement

Before final submission, the buyer sees:
- All lines with configuration, quantity, discounted unit price, and services
- Ship-to site (editable — "Edit" returns to FR-5)
- Delivery method and estimated delivery date (editable — returns to FR-5)
- Payment method: PO number or card brand + last 4 digits (editable — returns to FR-6)
- Hardware subtotal, volume discount, services, tax, delivery, and order total

"Place Order" is disabled after the first click to prevent double submission.

On success: the confirmation page shows the order number (`NT-` followed by 8 characters), PO number (if paid by PO), estimated delivery date, order total, and a "Print Order" option. An order acknowledgement email is sent to the requester within 5 minutes.

On failure (stock allocation fails at placement for a constrained item): the buyer sees an error naming the affected product with options "Remove item and retry" or "Return to quote".

---

## Non-Functional Requirements

- **Performance:** Configurator price updates render in under 200 ms. Quote page loads in under 2 seconds with 50 lines.
- **Accessibility:** WCAG 2.1 AA. All form fields have labels; disabled options expose their reason to screen readers; errors are announced with `role="alert"`.
- **Security & Audit:** Every approval decision records approver, timestamp, and reason. Card data is never stored in plain text.
- **Browser support:** Latest two versions of Chrome, Edge, Safari, and Firefox. Fully usable at 1280px and down to 768px (tablet).

---

## Out of Scope (v1)

- Device-as-a-Service (leasing / monthly subscription)
- Multi-level approval chains
- Split shipments to multiple sites on one order
- Trade-in and asset recovery
- Punchout catalogs (cXML / OCI) to Ariba or Coupa
- Multi-currency (all prices in USD)

---

## Open Questions

1. Should approval requests expire if not actioned within 7 days?
2. Can a buyer edit an order after it has been submitted for approval?
3. Do backordered lines need a separate partial-shipment confirmation?
