import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Brain, Wand2, Plus } from "lucide-react";
import { CreateAvatarForm } from "@/components/avatar/AvatarForm";
import { CreateAIAvatarForm } from "@/components/avatar/ai/CreateAIAvatarForm";

export function AvatarCreationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Avatar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Upload className="mr-2 h-4 w-4" /> Upload Photo
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <ScrollArea>
              <CreateAvatarForm />
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Brain className="mr-2 h-4 w-4" /> LLM Generation
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <ScrollArea>
              <CreateAIAvatarForm />
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Wand2 className="mr-2 h-4 w-4" /> Photo + LLM
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <ScrollArea>
              <CreateAIAvatarForm withImage />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
