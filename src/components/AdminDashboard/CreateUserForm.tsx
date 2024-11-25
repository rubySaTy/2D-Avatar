import { createUser } from "@/app/actions/admin";
import UserForm from "./UserForm";

export default function CreateUserForm() {
  return (
    <UserForm
      serverAction={createUser}
      title="Create New User"
      description="Add a new user to the system."
      submitText="Create User"
    />
  );
}
