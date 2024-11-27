import { editUser } from "@/app/actions/admin";
import BaseUserForm from "./BaseUserForm";
import type { UserDto } from "@/lib/db/schema";

export default function EditUserForm({ user }: { user: UserDto }) {
  return (
    <BaseUserForm
      serverAction={editUser}
      initialData={user}
      title="Edit User"
      description="Update user details."
      submitText="Update User"
      isEditing={true}
    />
  );
}
