"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, CopyIcon } from "lucide-react";

interface SessionLinkProps {
  clientUrl: string;
}
export default function SessionLink({ clientUrl }: SessionLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(clientUrl)
      .then(() => {
        setCopied(true);
      })
      .catch((err) => {
        console.error("Failed to copy!", err);
      });
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <>
      <Input readOnly value={clientUrl} />
      <Button onClick={handleCopy} disabled={copied}>
        {copied ? (
          <>
            <CheckIcon className="mr-2 h-4 w-4" /> Copied!
          </>
        ) : (
          <>
            <CopyIcon className="mr-2 h-4 w-4" /> Copy Link
          </>
        )}
      </Button>
    </>
  );
}
