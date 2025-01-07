import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import {
  CreateAIAvatarDialog,
  CreateAvatarDialog,
} from "@/components/avatar/AvatarDialog";

export function AvatarCreationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Avatar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CreateAvatarDialog />
        <CreateAIAvatarDialog withImage={false} />
        <CreateAIAvatarDialog withImage={true} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
