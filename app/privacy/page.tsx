import type { Metadata } from "next";
import {
  DocumentSection,
  PublicDocumentPage,
} from "@/components/legal/public-document-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Pavodah",
  description:
    "How Pavodah collects, uses, shares, and protects personal information.",
};

const SECTIONS: DocumentSection[] = [
  {
    id: "information-collected",
    title: "Information we collect",
    paragraphs: [
      "Pavodah collects information you provide, information created through marketplace activity, and technical information needed to operate and protect the service.",
    ],
    bullets: [
      "Account and profile details, such as name, email address, phone number, role, profile image, location, and provider information.",
      "Service listings, quote requests, orders, delivery details, reviews, disputes, messages, support conversations, and files you choose to submit.",
      "Payment, refund, settlement, and payout references and statuses. Payment providers process sensitive payment credentials according to their own services; Pavodah receives the records needed to verify and administer transactions.",
      "Device, browser, network, authentication, and security-event information used to maintain sessions, diagnose problems, and prevent misuse.",
    ],
  },
  {
    id: "how-used",
    title: "How information is used",
    bullets: [
      "Create and secure accounts, complete onboarding, and provide role-appropriate marketplace features.",
      "Publish services, connect clients and providers, process quotes and orders, and maintain transaction records.",
      "Verify payment events, administer refunds, settlements, and payouts, and investigate mismatches or fraud.",
      "Deliver messages, transactional notifications, support, dispute handling, and safety responses.",
      "Monitor reliability, diagnose errors, enforce policies, comply with legal obligations, and improve the service.",
    ],
  },
  {
    id: "sharing",
    title: "When information is shared",
    paragraphs: [
      "Pavodah shares information only when needed to provide the marketplace, carry out a requested transaction, protect the service, or meet a legal obligation.",
    ],
    bullets: [
      "Clients and providers receive the profile, order, quote, delivery, review, and conversation information needed for their marketplace relationship.",
      "Payment, communication, file-storage, analytics, and infrastructure providers receive information needed to perform services for Pavodah.",
      "Authorized administrators may access information needed for support, disputes, payments, payouts, security, and platform operations.",
      "Information may be disclosed when required by law or reasonably necessary to protect rights, safety, users, or the integrity of Pavodah.",
    ],
  },
  {
    id: "notifications",
    title: "Notifications and communications",
    paragraphs: [
      "Pavodah sends transactional communications about account security, messages, orders, payments, refunds, disputes, reviews, support, settlements, and payouts. Available in-app, email, and SMS preferences can be managed from Profile & settings, although certain service or security communications may still be necessary to operate the account.",
      "Marketing communication, when offered, is handled separately from transactional notification preferences.",
    ],
  },
  {
    id: "retention-security",
    title: "Retention and security",
    paragraphs: [
      "Pavodah retains information for as long as needed to provide the service, maintain marketplace and financial records, resolve disputes, protect users, and meet legal obligations. Different record types may require different retention periods.",
      "Administrative, technical, and organizational safeguards are used to reduce unauthorized access, alteration, disclosure, or loss. No internet service can guarantee absolute security, so report suspected account compromise promptly.",
    ],
  },
  {
    id: "choices",
    title: "Your choices",
    bullets: [
      "Review and update available profile and notification settings from your account.",
      "Use the password-reset or password-change flow when account credentials need to be updated.",
      "Contact support to ask about access, correction, deletion, restriction, or another privacy request. Some information may need to be retained for transactions, safety, disputes, or legal compliance.",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    paragraphs: [
      "Pavodah is not intended for children who cannot legally agree to marketplace transactions or these terms. If you believe a child has submitted personal information without appropriate authorization, contact support so the situation can be reviewed.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    paragraphs: [
      "This policy may be updated as Pavodah's features, service providers, or legal obligations change. Material changes will be communicated through an appropriate platform or account channel when required.",
      "Privacy questions and requests can be sent to support@pavodah.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PublicDocumentPage
      title="Privacy Policy"
      summary="This policy explains what information Pavodah uses to operate the marketplace, complete transactions, communicate with users, and protect the service."
      updatedAt="9 August 2026"
      sections={SECTIONS}
    />
  );
}
