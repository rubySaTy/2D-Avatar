import { editUser } from "@/app/actions/admin";
import UserForm from "./UserForm";
import type { UserDto } from "@/lib/db/schema";

export default function EditUserForm({ user }: { user: UserDto }) {
  return (
    <UserForm
      serverAction={editUser}
      initialData={user}
      title="Edit User"
      description="Update user details."
      submitText="Update User"
      isEditing={true}
    />
  );
}
