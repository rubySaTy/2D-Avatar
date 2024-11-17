import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserRow from "./UserRow";
import { getUser } from "@/lib/auth";
import type { UserDto } from "@/lib/db/schema";

type UserTableProps = {
  users: Array<UserDto>;
};

export default async function UserTable({ users }: UserTableProps) {
  const currentUser = await getUser();
  if (!currentUser) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} currentUserId={currentUser.id} />
        ))}
      </TableBody>
    </Table>
  );
}
