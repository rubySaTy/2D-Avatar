"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface AuthFormCardProps {
  title: string;
  message?: string | null;
  children: React.ReactNode;
}

export default function FormCard({
  title,
  message,
  children,
}: AuthFormCardProps) {
  return (
    <Card className="w-full max-w-[600px] md:w-[600px] text-base md:text-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">{children}</CardContent>
      <CardFooter>
        <p>{message}</p>
      </CardFooter>
    </Card>
  );
}
