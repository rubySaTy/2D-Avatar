"use client";

import { useState } from "react";
import { deleteAvatarAction } from "@/app/actions/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DeleteAvatarButton({ avatarId }: { avatarId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        const res = await deleteAvatarAction(avatarId);
        toast({
          title: res.success ? "Success" : "Error",
          description: res.message,
          variant: res.success ? "default" : "destructive",
          duration: 5000,
        });
        if (!res.success) setIsLoading(false);
      }}
    >
      {!isLoading && <span>Delete Avatar</span>}
      {isLoading && <span>Deleting...</span>}
    </Button>
  );
}
