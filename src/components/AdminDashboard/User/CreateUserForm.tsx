import { createUser } from "@/app/actions/admin";
import BaseUserForm from "./BaseUserForm";

export default function CreateUserForm() {
  return (
    <BaseUserForm
      serverAction={createUser}
      title="Create New User"
      description="Add a new user to the system."
      submitText="Create User"
    />
  );
}
