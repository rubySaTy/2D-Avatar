import { redirect } from "next/navigation";
import { db } from "@/lib/db/db";
import { avatars } from "@/lib/db/schema";
import { getUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserManagement from "@/components/AdminDashboard/User/UserManagement";
import AvatarManagement from "@/components/AdminDashboard/Avatar/AvatarManagement";
import TalksDisplay from "@/components/AdminDashboard/Talk/TalksDisplay";
import { getUsersDto } from "@/services";
import { getTalksWithUser } from "@/services/talkService";

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [usersDto, avatarsArray] = await Promise.all([
    getUsersDto(),
    db.select().from(avatars),
  ]);

  const talks = await getTalksWithUser();
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, avatars, and view talk logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="avatars">Avatars</TabsTrigger>
              <TabsTrigger value="talks">Talks</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserManagement users={usersDto} />
            </TabsContent>
            <TabsContent value="avatars">
              <AvatarManagement avatars={avatarsArray} users={usersDto} />
            </TabsContent>
            <TabsContent value="talks">
              <TalksDisplay talks={talks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
