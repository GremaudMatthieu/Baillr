"use client";

import { use } from "react";
import { LeaseDetailContent } from "@/components/features/leases/lease-detail-content";

export default function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LeaseDetailContent leaseId={id} />;
}
