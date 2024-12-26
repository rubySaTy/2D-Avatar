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
  // VoicesList,
} from "@/components/AdminDashboard";
import {
  getAvatars,
  getUsersDto,
  getTalksWithUser,
  // getAvatarsByVoiceId,
} from "@/services";
// import elevenlabs from "@/lib/elevenlabs";

export default async function AdminPage() {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== "admin") redirect("/login");

  const [usersDto, avatars, talks] = await Promise.all([
    getUsersDto(),
    getAvatars(),
    getTalksWithUser(),
  ]);

  // const data = await elevenlabs.voices.getAll();
  // const clonedVoices = data.voices.filter((v) => v.category === "cloned");
  // const associatedAvatars = await getAvatarsByVoiceId(clonedVoices[0].voice_id);

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
              {/* <TabsTrigger value="cloned-voices">Cloned Voices</TabsTrigger> */}
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
            {/* <TabsContent value="cloned-voices">
              <VoicesList />
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
