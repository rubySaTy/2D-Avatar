"use client";

import { useState } from "react";
import { deleteUserAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

type DeleteUserButtonProps = {
  userId: string;
  content?: "icon" | "text" | "both";
  text?: string;
};

export default function DeleteUserButton({
  userId,
  content = "icon",
  text = "Delete Account",
}: DeleteUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  return (
    <Button
      variant="destructive"
      size={content === "icon" ? "icon" : undefined}
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        const res = await deleteUserAction(userId);
        toast({
          title: res.success ? "Success" : "Error",
          description: res.message,
          variant: res.success ? "default" : "destructive",
          duration: 5000,
        });
        if (!res.success) setIsLoading(false);
      }}
      className="relative"
    >
      <span
        className={`flex items-center justify-center ${isLoading ? "invisible" : ""}`}
      >
        {content === "icon" || content === "both" ? <Trash2 className="h-4 w-4" /> : null}
        {content === "text" || content === "both" ? (
          <span className={content === "both" ? "ml-2" : ""}>{text}</span>
        ) : null}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </Button>
  );
}
