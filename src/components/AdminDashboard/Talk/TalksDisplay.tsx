"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { Talk } from "@/lib/db/schema";

interface TalkWithUser extends Talk {
  user: { id: string; username: string };
}

interface TalksDisplayProps {
  talks: Array<TalkWithUser>
}

export default function TalksDisplay({ talks }: TalksDisplayProps) {
  const [isGrouped, setIsGrouped] = useState(false);

  // Early return if no talks are available
  if (talks.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Talks Display</h1>
        <p>No talks available to display.</p>
      </div>
    );
  }

  // Create a map of meetingSessionId to user information
  const meetingSessionsMap = useMemo(() => {
    const map = new Map<number, { userId: string; username: string }>();
    talks.forEach((talk) => {
      if (!map.has(talk.meetingSessionId)) {
        map.set(talk.meetingSessionId, {
          userId: talk.user.id,
          username: talk.user.username,
        });
      }
    });
    return map;
  }, [talks]);

  // Group talks by meetingSessionId
  const groupedTalks = useMemo(() => {
    const groups: { [key: number]: TalkWithUser[] } = {};
    talks.forEach((talk) => {
      if (!groups[talk.meetingSessionId]) {
        groups[talk.meetingSessionId] = [];
      }
      groups[talk.meetingSessionId].push(talk);
    });
    return groups;
  }, [talks]);

  // Calculate total talks per user
  const totalTalksByUser = useMemo(() => {
    const counts: { [key: string]: number } = {};
    talks.forEach((talk) => {
      counts[talk.user.id] = (counts[talk.user.id] || 0) + 1;
    });
    return counts;
  }, [talks]);

  const renderUngroupedTalks = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Talk ID</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {talks.map((talk) => (
          <TableRow key={talk.id}>
            <TableCell>{talk.id}</TableCell>
            <TableCell>{talk.user.username || "Unknown"}</TableCell>
            <TableCell>{formatDate(talk.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderGroupedTalks = () => (
    <div className="space-y-4">
      {Array.from(meetingSessionsMap.entries()).map(([sessionId, user]) => {
        const sessionTalks = groupedTalks[sessionId];
        return (
          <Card key={sessionId}>
            <CardHeader>
              <CardTitle>
                Meeting Session {sessionId} - {user.username}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talk ID</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionTalks.map((talk) => (
                    <TableRow key={talk.id}>
                      <TableCell>{talk.id}</TableCell>
                      <TableCell>{formatDate(talk.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-sm text-muted-foreground">
                Total talks: {sessionTalks.length}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTotalTalksByUser = () => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Talks by User</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Total Talks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(totalTalksByUser).map(([userId, count]) => {
                // Find username from talks
                const username =
                  talks.find((talk) => talk.user.id === userId)?.user
                    .username || "Unknown";
                return (
                  <TableRow key={userId}>
                    <TableCell>{username}</TableCell>
                    <TableCell>{count}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Talks Display</h1>
      {renderTotalTalksByUser()}
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="group-toggle"
          checked={isGrouped}
          onCheckedChange={setIsGrouped}
        />
        <Label htmlFor="group-toggle">Group by Meeting Session</Label>
      </div>
      {isGrouped ? renderGroupedTalks() : renderUngroupedTalks()}
    </div>
  );
}
