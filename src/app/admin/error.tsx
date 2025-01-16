"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logMessage } from "@/app/actions";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    logErrorToService(error);
  }, [error]);

  const logErrorToService = (error: Error) => {
    logMessage(`Logging error to service: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We apologize for the inconvenience. An error occurred in the admin section.
          </p>
        </div>
        <div className="mt-8 bg-white p-6 shadow rounded-lg">
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500">
              Error Code: {error.digest}
            </p>
            <p className="text-sm text-gray-700">{error.message}</p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-3">
            <Button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="inline-flex items-center px-4 py-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
