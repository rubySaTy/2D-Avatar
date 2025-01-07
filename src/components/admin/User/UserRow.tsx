import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import UpdateCreditsForm from "./UpdateCreditsForm";
import DeleteUserButton from "./DeleteUserButton";
import { EditUserDialog } from "./UserDialog";
import type { UserDto } from "@/lib/db/schema";

type UserRowProps = {
  user: UserDto;
  currentUserId: string;
};

export default function UserRow({ user, currentUserId }: UserRowProps) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <TableRow className={isCurrentUser ? "bg-muted/50" : ""}>
      <TableCell>
        {user.username}
        {isCurrentUser && (
          <span className="ml-2 text-sm text-muted-foreground">(You)</span>
        )}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        {user.role === "admin" ? (
          "N/A"
        ) : (
          <div className="flex items-center space-x-2">
            <span>{user.credits}</span>
            <UpdateCreditsForm userId={user.id} currentCredits={user.credits} />
          </div>
        )}
      </TableCell>
      <TableCell>
        {user.createdAt
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", " -")}
      </TableCell>
      <TableCell>
        {!isCurrentUser && (
          <div className="flex space-x-2">
            <EditUserDialog user={user} />
            <DeleteUserButton userId={user.id} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
