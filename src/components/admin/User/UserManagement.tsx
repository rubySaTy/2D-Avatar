import UserTable from "./UserTable";
import { CreateUserDialog } from "./UserDialog";

export default async function UserManagement() {
  return (
    <div>
      <CreateUserDialog />
      <UserTable />
    </div>
  );
}
