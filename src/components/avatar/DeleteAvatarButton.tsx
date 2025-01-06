"use client";

import { deleteAvatarAction } from "@/app/actions/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteAvatarButton({ avatarId }: { avatarId: number }) {
  return (
    <Button variant="destructive" size="sm" onClick={() => deleteAvatarAction(avatarId)}>
      <Trash2 className="mr-2 h-3.5 w-3.5" />
      Delete
    </Button>
  );
}
