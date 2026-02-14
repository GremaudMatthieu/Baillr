"use client";

import { use } from "react";
import { RentCallDetailContent } from "@/components/features/escalation/rent-call-detail-content";

export default function RentCallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <RentCallDetailContent rentCallId={id} />;
}
