import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import UpdateCreditsForm from "./UpdateCreditsForm";
import DeleteUserButton from "@/components/user/DeleteUserButton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { EditUserDialog } from "./UserDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the account
                    and remove all the user's data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild className="bg-destructive">
                    <DeleteUserButton userId={user.id} content="text" />
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
