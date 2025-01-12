import Link from "next/link";
import Image from "next/image";
import SessionLink from "./SessionLink";
import { Button } from "@/components/ui/button";
import { closeStreamTherapist } from "@/app/actions/d-id";

interface TherapistPanelHeaderProps {
  avatarImageUrl: string;
  avatarName: string;
  clientUrl: string;
  meetingLink: string;
}

export default function TherapistPanelHeader({
  avatarImageUrl,
  avatarName,
  clientUrl,
  meetingLink,
}: TherapistPanelHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="relative h-16 w-16 rounded-full overflow-hidden">
          <Image
            src={avatarImageUrl}
            alt="Avatar image"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 128px) 100vw, (max-width: 128px) 50vw, 33vw"
            priority
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-xl font-semibold tracking-tight">Therapy Session</h1>
          <p className="text-sm text-muted-foreground">Avatar name: {avatarName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <SessionLink clientUrl={clientUrl} />
        <Button variant="destructive" onClick={() => closeStreamTherapist(meetingLink)}>
          Stop Stream
        </Button>
        <Button variant={"destructive"} asChild>
          <Link href={"/therapist"}>End Session</Link>
        </Button>
      </div>
    </header>
  );
}
