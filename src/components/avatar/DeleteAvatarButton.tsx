"use client";

import { deleteAvatarAction } from "@/app/actions/avatar";
import { Button } from "@/components/ui/button";

export default function DeleteAvatarButton({ avatarId }: { avatarId: number }) {
  return (
    <Button variant="destructive" size="sm" onClick={() => deleteAvatarAction(avatarId)}>
      Delete Avatar
    </Button>
  );
}
