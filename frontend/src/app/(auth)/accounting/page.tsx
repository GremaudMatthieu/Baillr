import type { Metadata } from "next";
import { AccountBookContent } from "@/components/features/accounting/account-book-content";

export const metadata: Metadata = {
  title: "Livre de comptes",
};

export default function AccountingPage() {
  return <AccountBookContent />;
}
