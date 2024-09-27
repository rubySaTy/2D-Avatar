"use client";

import { MeetingSession } from "@/lib/db/schema";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface PreviousSessionsSelectProps {
  sessions: Array<MeetingSession>;
}

export default function PreviousSessionsSelect({
  sessions,
}: PreviousSessionsSelectProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="sessions">Previous Sessions</Label>
      <Select name="session">
        <SelectTrigger id="sessions">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent position="popper">
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id.toString()}>
              {session.createdAt.toISOString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
