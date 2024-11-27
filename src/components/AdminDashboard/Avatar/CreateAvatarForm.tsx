import { createAvatar } from "@/app/actions/admin";
import BaseAvatarForm from "./BaseAvatarForm";
import type { UserDto } from "@/lib/db/schema";

interface CreateAvatarFormProps {
  users: Array<UserDto>;
  currentUserId: string;
}

export default function CreateAvatarForm({
  users,
  currentUserId,
}: CreateAvatarFormProps) {
  return (
    <BaseAvatarForm
      currentUserId={currentUserId}
      users={users}
      serverAction={createAvatar}
      title="Create New Avatar"
      description="Add a new avatar to the system."
      submitText="Create Avatar"
    />
  );
}
