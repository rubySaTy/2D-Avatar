import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserManagement,
  AvatarManagement,
  TalksDisplay,
} from "@/components/AdminDashboard";
import { getAvatars, getUsersDto, getTalksWithUser } from "@/services";

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [usersDto, avatars, talks] = await Promise.all([
    getUsersDto(),
    getAvatars(),
    getTalksWithUser(),
  ]);

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
              <AvatarManagement avatars={avatars} users={usersDto} />
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
