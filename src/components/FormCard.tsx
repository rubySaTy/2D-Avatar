"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface AuthFormCardProps {
  title: string;
  state: { success: boolean; message: string } | null;
  children: React.ReactNode;
}

export default function FormCard({
  title,
  state,
  children,
}: AuthFormCardProps) {
  return (
    <Card className="w-full max-w-[600px] md:w-[600px] text-base md:text-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">{children}</CardContent>
      <CardFooter>
        {state?.message && (
          <Alert
            variant={state.success ? "default" : "destructive"}
            className="mb-4"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
