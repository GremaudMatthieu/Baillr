import { z } from "zod";

export const terminateLeaseSchema = z.object({
  endDate: z.string().min(1, { error: "Date de fin requise" }),
});

export type TerminateLeaseFormData = z.infer<typeof terminateLeaseSchema>;
