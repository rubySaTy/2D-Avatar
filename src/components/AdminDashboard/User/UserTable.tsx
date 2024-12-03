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

  const sortedUsers = users.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUsers.map((user) => (
          <UserRow key={user.id} user={user} currentUserId={currentUser.id} />
        ))}
      </TableBody>
    </Table>
  );
}
