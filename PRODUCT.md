# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pavodah serves three marketplace roles:

- Clients who discover, purchase, track, review, and dispute services.
- Service providers who publish services, respond to quotes, fulfil paid orders, communicate with clients, and receive payouts.
- Administrators who operate the marketplace, manage users and content, resolve disputes, oversee payments and payouts, and handle escalated support.

## Product Purpose

Pavodah is a Ghana-focused service marketplace that connects clients with service providers and supports the transaction from discovery and quoting through payment, fulfilment, review, dispute resolution, settlement, and payout. Success means each participant can see the state of work and money clearly and act on changes without losing context.

## Positioning

Pavodah combines a multi-role services marketplace with Ghana-oriented payments, payouts, phone verification, and operational workflows for providers and administrators.

## Operating Context

The product is used across public service discovery, authenticated client and provider workflows, and an operational admin dashboard. Important state changes include quotes, paid orders, order progress, messages, reviews, disputes, refunds, support escalations, settlements, and payouts. Transactional notifications must lead users back to the exact authorized record that needs attention.

## Capabilities and Constraints

- The web client is Next.js with TypeScript, Tailwind CSS, Zustand, and shadcn/Radix primitives.
- The API is NestJS with PostgreSQL and Prisma, JWT authorization, Socket.IO, Paystack payments, multi-provider email, and configurable SMS providers.
- English is the only currently supported product language.
- Transactional notification history is durable and cursor-paginated with no scheduled retention deletion for now.
- In-app notifications cover clients, providers, and administrators. Email follows the saved email preference. SMS is limited to payment, dispute, security, and payout-critical events and follows the saved SMS preference.
- Marketing communication remains separate from transactional notifications.
- Providers may access disputes for orders in which they are the provider.
- Notification links must respect role authorization and must not expose records to unrelated users.

## Brand Commitments

The product name is Pavodah. Existing product terminology, logo, restrained green accent, light operational surfaces, and current dashboard visual language remain authoritative for extensions.

## Evidence on Hand

- Existing client, provider, and admin workflows in the web and API repositories.
- Product roles and marketplace stories in `../user-stories.md`.
- Existing payment, refund, settlement, payout, chat, support, email, and SMS implementations.
- No external notification copy library, delivery benchmarks, or marketing claims have been supplied; future work must not fabricate them.

## Product Principles

- Treat the backend state transition as the source of truth for every transactional notification.
- Notify the right participant only when an event is actionable or materially changes trust, work, or money.
- Preserve a durable activity record even when realtime or external delivery is temporarily unavailable.
- Keep notification actions specific, authorized, and recoverable across reconnects and devices.
- Separate transactional communication from marketing consent.

## Accessibility & Inclusion

Notification controls must be keyboard accessible, screen-reader labelled, usable without color alone, responsive from mobile to desktop, and remain understandable with reduced motion or delayed network delivery.
