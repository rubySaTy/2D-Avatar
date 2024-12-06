"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Minus } from "lucide-react";
import { handleUpdateCredits } from "@/app/actions/admin";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SubmitButton } from "@/components/SubmitButton";

interface UpdateCreditsFormProps {
  userId: string;
  currentCredits: number;
}

export default function UpdateCreditsForm({
  userId,
  currentCredits,
}: UpdateCreditsFormProps) {
  const [state, formAction] = useFormState(handleUpdateCredits, null);
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (operation === "subtract" && amount > currentCredits) {
      setError(
        `Cannot subtract more than the current credits (${currentCredits})`
      );
    } else {
      setError(null);
    }
  }, [operation, amount, currentCredits]);

  useEffect(() => {
    if (state?.success) {
      setAmount(1);
      setIsOpen(false);
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    if (error) return;

    const finalAmount = operation === "add" ? amount : -amount;
    formData.set("amount", finalAmount.toString());
    formAction(formData);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Update Credits
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <Label htmlFor="amount">Adjust Credits</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                size="sm"
                variant={operation === "add" ? "default" : "outline"}
                onClick={() => setOperation("add")}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={operation === "subtract" ? "default" : "outline"}
                onClick={() => setOperation("subtract")}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(1, parseInt(e.target.value) || 0))
                }
                required
                min="1"
                max={operation === "subtract" ? currentCredits : undefined}
                step="1"
                className="w-20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" type="text" required />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="pt-2">
            <SubmitButton className="w-full" disabled={!!error}>
              {operation === "add" ? "Add" : "Subtract"} Credits
            </SubmitButton>
          </div>
        </form>

        {state && (
          <Alert
            variant={state.success ? "default" : "destructive"}
            className="mt-4"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Current Credits: {currentCredits}
        </div>
      </PopoverContent>
    </Popover>
  );
}
