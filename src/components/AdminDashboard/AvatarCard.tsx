import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Avatar } from "@/lib/db/schema";

type AvatarCardProps = {
  avatar: Avatar;
};

export default function AvatarCard({ avatar }: AvatarCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{avatar.avatarName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Image
          src={avatar.imageUrl}
          alt={avatar.avatarName}
          width={100}
          height={100}
          className="rounded-lg"
        />
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              TODO: Avatar edit Form
              {/* <AvatarForm /> */}
            </DialogContent>
          </Dialog>
          <form>
            <input type="hidden" name="id" value={avatar.id} />
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
