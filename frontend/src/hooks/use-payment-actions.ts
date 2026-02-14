"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBankStatementsApi,
  type ValidateMatchPayload,
  type RejectMatchPayload,
  type ManualAssignMatchPayload,
} from "@/lib/api/bank-statements-api";

export type RowStatus = "default" | "validated" | "rejected" | "assigned" | "loading";

export interface ValidationProgress {
  validated: number;
  rejected: number;
  assigned: number;
}

export function useValidateMatch(entityId: string) {
  const api = useBankStatementsApi();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    async (data: ValidateMatchPayload): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      try {
        await api.validateMatch(entityId, data);
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: ["entities", entityId, "rent-calls"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["entities"],
          });
        }, 1500);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la validation";
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [entityId, api, queryClient],
  );

  return { validate, isPending, error };
}

export function useRejectMatch(entityId: string) {
  const api = useBankStatementsApi();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reject = useCallback(
    async (data: RejectMatchPayload): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      try {
        await api.rejectMatch(entityId, data);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du rejet";
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [entityId, api],
  );

  return { reject, isPending, error };
}

export function useManualAssignMatch(entityId: string) {
  const api = useBankStatementsApi();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = useCallback(
    async (data: ManualAssignMatchPayload): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      try {
        await api.manualAssignMatch(entityId, data);
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: ["entities", entityId, "rent-calls"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["entities"],
          });
        }, 1500);
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'assignation manuelle";
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [entityId, api, queryClient],
  );

  return { assign, isPending, error };
}

export function usePaymentActions(entityId: string) {
  const validateHook = useValidateMatch(entityId);
  const rejectHook = useRejectMatch(entityId);
  const assignHook = useManualAssignMatch(entityId);

  const [rowStatuses, setRowStatuses] = useState<Map<string, RowStatus>>(
    new Map(),
  );
  const [progress, setProgress] = useState<ValidationProgress>({
    validated: 0,
    rejected: 0,
    assigned: 0,
  });

  const getRowStatus = useCallback(
    (transactionId: string): RowStatus =>
      rowStatuses.get(transactionId) ?? "default",
    [rowStatuses],
  );

  const handleValidate = useCallback(
    async (data: ValidateMatchPayload): Promise<boolean> => {
      if (getRowStatus(data.transactionId) !== "default") return false;
      setRowStatuses((prev) =>
        new Map(prev).set(data.transactionId, "loading"),
      );
      const success = await validateHook.validate(data);
      if (success) {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "validated"),
        );
        setProgress((prev) => ({
          ...prev,
          validated: prev.validated + 1,
        }));
      } else {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "default"),
        );
      }
      return success;
    },
    [validateHook],
  );

  const handleReject = useCallback(
    async (data: RejectMatchPayload): Promise<boolean> => {
      if (getRowStatus(data.transactionId) !== "default") return false;
      setRowStatuses((prev) =>
        new Map(prev).set(data.transactionId, "loading"),
      );
      const success = await rejectHook.reject(data);
      if (success) {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "rejected"),
        );
        setProgress((prev) => ({
          ...prev,
          rejected: prev.rejected + 1,
        }));
      } else {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "default"),
        );
      }
      return success;
    },
    [rejectHook],
  );

  const handleAssign = useCallback(
    async (data: ManualAssignMatchPayload): Promise<boolean> => {
      if (getRowStatus(data.transactionId) !== "default") return false;
      setRowStatuses((prev) =>
        new Map(prev).set(data.transactionId, "loading"),
      );
      const success = await assignHook.assign(data);
      if (success) {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "assigned"),
        );
        setProgress((prev) => ({
          ...prev,
          assigned: prev.assigned + 1,
        }));
      } else {
        setRowStatuses((prev) =>
          new Map(prev).set(data.transactionId, "default"),
        );
      }
      return success;
    },
    [assignHook],
  );

  return {
    handleValidate,
    handleReject,
    handleAssign,
    getRowStatus,
    progress,
    error:
      validateHook.error ?? rejectHook.error ?? assignHook.error ?? null,
  };
}
