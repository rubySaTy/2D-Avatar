import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AlertMessageProps {
  state: { message: string; success: boolean } | null;
}

export default function ServerActionAlertMessage({ state }: AlertMessageProps) {
  if (!state) return null;

  return (
    <Alert variant={state.success ? "default" : "destructive"} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
