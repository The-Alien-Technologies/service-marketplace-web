import type { Metadata } from "next";
import {
  DocumentSection,
  PublicDocumentPage,
} from "@/components/legal/public-document-page";

export const metadata: Metadata = {
  title: "Terms of Service | Pavodah",
  description:
    "The terms that apply when clients, service providers, and administrators use Pavodah.",
};

const SECTIONS: DocumentSection[] = [
  {
    id: "using-pavodah",
    title: "Using Pavodah",
    paragraphs: [
      "These Terms govern access to and use of the Pavodah service marketplace. By creating an account or using the platform, you agree to follow these Terms and the policies linked from them.",
      "You must provide accurate account information, keep your login details secure, and use Pavodah only for lawful marketplace activity. You are responsible for actions taken through your account unless you promptly report unauthorized access.",
    ],
  },
  {
    id: "marketplace-roles",
    title: "Marketplace roles",
    paragraphs: [
      "Pavodah provides tools that help clients discover services and help providers offer and deliver them. Service providers are responsible for the accuracy, legality, quality, and delivery of their services. Clients are responsible for supplying accurate requirements and reviewing work in a timely manner.",
      "An order, quote, message, review, or profile does not create employment, partnership, or agency between Pavodah and a marketplace user.",
    ],
  },
  {
    id: "orders-payments",
    title: "Orders and payments",
    paragraphs: [
      "Use Pavodah checkout and the order workflow for marketplace payments. The amount, currency, fees, and available actions are shown before or during checkout and on the order record.",
      "Payment verification, refunds, settlement, and payouts may depend on payment providers and financial institutions. A displayed pending state is not confirmation that money has completed every stage of processing.",
    ],
    bullets: [
      "Do not ask another user to move payment outside Pavodah for work arranged through Pavodah.",
      "Do not misrepresent a payment, delivery, refund, or payout state.",
      "Review the order details before accepting delivery or taking another final action.",
    ],
  },
  {
    id: "provider-obligations",
    title: "Provider obligations",
    paragraphs: [
      "Providers must describe services honestly, use pricing and delivery terms they can honor, possess any authorization required for the work, and communicate material changes before delivery.",
      "Providers may not publish deceptive, unlawful, infringing, unsafe, or prohibited services. Pavodah may review, limit, or remove services that create risk for users or the platform.",
    ],
  },
  {
    id: "user-content",
    title: "Messages, reviews, and content",
    paragraphs: [
      "You retain responsibility for content you submit, including profile information, service listings, files, messages, reviews, and dispute evidence. You grant Pavodah permission to host, display, process, and transmit that content as needed to operate and protect the marketplace.",
      "Content must not be fraudulent, abusive, discriminatory, unlawfully threatening, privacy-invasive, or infringing. Reviews must reflect a genuine marketplace experience and must not be manipulated in exchange for payment or another benefit.",
    ],
  },
  {
    id: "disputes-refunds",
    title: "Disputes and refunds",
    paragraphs: [
      "Eligible orders may provide an in-platform dispute action. Each party should give accurate information and cooperate with the review. Pavodah may consider the order state, messages, delivery record, payment information, and submitted evidence when administering a resolution.",
      "Refund availability and amount depend on the payment and order circumstances. A refund can require additional processing time after Pavodah records it as initiated or processed.",
    ],
  },
  {
    id: "enforcement",
    title: "Restriction and enforcement",
    paragraphs: [
      "Pavodah may restrict content, transactions, features, or accounts when reasonably necessary to investigate misuse, comply with law, protect users, address security risk, or enforce these Terms. Where appropriate, Pavodah may request additional information before restoring access.",
    ],
  },
  {
    id: "availability-liability",
    title: "Availability and responsibility",
    paragraphs: [
      "Pavodah works to provide a reliable marketplace, but uninterrupted or error-free availability is not guaranteed. To the extent permitted by applicable law, Pavodah is not responsible for indirect losses or for a user's independent acts, services, representations, or off-platform arrangements.",
      "Nothing in these Terms excludes a right or responsibility that cannot lawfully be excluded.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    paragraphs: [
      "Pavodah may update these Terms when the service, legal requirements, or marketplace risks change. Material updates will be communicated through an appropriate platform or account channel before they take effect when required.",
      "Questions about these Terms can be sent to support@pavodah.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <PublicDocumentPage
      title="Terms of Service"
      summary="These terms explain the responsibilities that keep marketplace work, payment, communication, and dispute handling clear for everyone using Pavodah."
      updatedAt="9 August 2026"
      sections={SECTIONS}
    />
  );
}
