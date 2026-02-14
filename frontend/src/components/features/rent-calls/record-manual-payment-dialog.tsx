"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecordManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    amountCents: number;
    paymentMethod: "cash" | "check";
    paymentDate: string;
    payerName: string;
    paymentReference?: string;
  }) => void;
  isPending: boolean;
  defaultPayerName: string;
  defaultAmountCents: number;
  error?: string | null;
}

export function RecordManualPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  defaultPayerName,
  defaultAmountCents,
  error,
}: RecordManualPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "check">("cash");
  const [amount, setAmount] = useState(
    defaultAmountCents > 0 ? (defaultAmountCents / 100).toFixed(2) : "",
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payerName, setPayerName] = useState(defaultPayerName);
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentMethod("cash");
      setAmount(
        defaultAmountCents > 0 ? (defaultAmountCents / 100).toFixed(2) : "",
      );
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPayerName(defaultPayerName);
      setPaymentReference("");
    }
  }, [open, defaultAmountCents, defaultPayerName]);

  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const isFormValid =
    isAmountValid && paymentDate.length > 0 && payerName.trim().length > 0;

  const handleConfirm = () => {
    if (!isFormValid) return;
    const amountCents = Math.round(parsedAmount * 100);
    onConfirm({
      amountCents,
      paymentMethod,
      paymentDate,
      payerName: payerName.trim(),
      ...(paymentMethod === "check" && paymentReference.trim()
        ? { paymentReference: paymentReference.trim() }
        : {}),
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!isPending) {
      if (!v) {
        setPaymentMethod("cash");
        setAmount(
          defaultAmountCents > 0
            ? (defaultAmountCents / 100).toFixed(2)
            : "",
        );
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setPayerName(defaultPayerName);
        setPaymentReference("");
      }
      onOpenChange(v);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enregistrer un paiement</AlertDialogTitle>
          <AlertDialogDescription>
            Enregistrez un paiement reçu en espèces ou par chèque.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Payment method */}
          <div className="grid gap-1.5">
            <Label htmlFor="payment-method">Mode de paiement</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as "cash" | "check")}
            >
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid gap-1.5">
            <Label htmlFor="payment-amount">Montant (€)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="850.00"
            />
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="payment-date">Date du paiement</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Payer name */}
          <div className="grid gap-1.5">
            <Label htmlFor="payer-name">Nom du payeur</Label>
            <Input
              id="payer-name"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          {/* Check reference — shown only for check payments */}
          {paymentMethod === "check" && (
            <div className="grid gap-1.5">
              <Label htmlFor="payment-reference">N° de chèque</Label>
              <Input
                id="payment-reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="CHK-123456"
                maxLength={100}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending || !isFormValid}
          >
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
