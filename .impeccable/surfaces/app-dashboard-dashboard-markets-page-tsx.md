---
version: 1
slug: "app-dashboard-dashboard-markets-page-tsx"
primary_target: "app/(dashboard)/dashboard/markets/page.tsx"
related_targets: ["app/(dashboard)/dashboard/markets/[marketId]/page.tsx","app/(dashboard)/dashboard/country-administrators/page.tsx"]
---

Scope: super-admin country operations across the Markets overview, per-market detail, and Country administrators routes. Visitor mode: Operate.

Audience and job: A global administrator needs to scan market health, find missing operational ownership or payment setup, and safely change one market or administrator without losing context.

Primary task and proof: The overview exposes status, administrator/provider/order counts, enabled operations, and payment readiness. Detailed changes live in the selected market workspace. People lifecycle actions live in Country administrators.

Direction: Preserve Pavodah's restrained green operational language. Prefer compact rows and explicit status labels over expanded configuration cards. Keep account status, administrator access, market assignment, and market status visibly distinct.

Constraints: Responsive and keyboard accessible; English, French, and Swahili catalogs remain aligned; Paystack secrets are never returned; each country administrator belongs to exactly one market.
