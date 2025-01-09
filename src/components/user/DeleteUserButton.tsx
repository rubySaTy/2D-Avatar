"use client";

import { deleteUserAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  return (
    <Button
      variant="destructive"
      size={content === "icon" ? "icon" : undefined}
      onClick={() => deleteUserAction(userId)}
    >
      {content === "icon" || content === "both" ? <Trash2 className="h-4 w-4" /> : null}
      {content === "text" || content === "both" ? <span>{text}</span> : null}
    </Button>
  );
}
