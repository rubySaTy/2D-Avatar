import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import UserTable from "./UserTable";
import { CreateUserForm } from "./UserForm";

export default async function UserManagement() {
  return (
    <div>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateUserForm />
          </DialogContent>
        </Dialog>
      </div>
      <UserTable />
    </div>
  );
}
