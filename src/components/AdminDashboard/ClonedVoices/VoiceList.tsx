"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, RefreshCcw, Search } from "lucide-react";
import VoiceItem from "./VoiceItem";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Mock data
const mockVoices = [
  {
    id: "1",
    name: "elana",
    previewUrl: "https://example.com/preview.mp3",
    associatedUsers: [
      { id: "u1", name: "John Smith" },
      { id: "u2", name: "Sarah Johnson" },
      { id: "u3", name: "Mike Williams" },
    ],
  },
  {
    id: "2",
    name: "rachel",
    previewUrl: "https://example.com/preview2.mp3",
    associatedUsers: [{ id: "u1", name: "John Smith" }],
  },
  {
    id: "3",
    name: "josh",
    previewUrl: "https://example.com/preview3.mp3",
    associatedUsers: [],
  },
];

export default function VoicesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDelete = (id: string) => {
    console.log("Delete voice:", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit voice:", id);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredVoices = mockVoices.filter(
    (voice) =>
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.associatedUsers.some((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voices or users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className={`${isRefreshing ? "animate-spin" : ""}`}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="sr-only">Refresh list</span>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Voice
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2 pr-4">
          {filteredVoices.length > 0 ? (
            filteredVoices.map((voice) => (
              <VoiceItem
                key={voice.id}
                {...voice}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-sm text-muted-foreground">
                No voices found {searchQuery && "matching your search"}
              </div>
              {searchQuery && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
