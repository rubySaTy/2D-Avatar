"use client";

import { deleteUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteUserButton({ userId }: { userId: string }) {
  return (
    <Button variant="destructive" size="icon" onClick={() => deleteUserAction(userId)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
