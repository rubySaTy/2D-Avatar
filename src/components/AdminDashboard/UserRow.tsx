import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TableCell, TableRow } from "../ui/table";
import { deleteUser } from "@/app/actions/admin";
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>TODO: implement edit user form</DialogContent>
            </Dialog>
            <form action={deleteUser}>
              <input type="hidden" name="id" value={user.id} />
              <Button variant="destructive" size="icon" type="submit">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
