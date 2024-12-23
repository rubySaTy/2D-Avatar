"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import { useWebRTCStream } from "@/hooks/useWebRTC";

interface StreamProps {
  meetingLink: string;
  idleVideoUrl: string;
}

export default function Stream({ meetingLink, idleVideoUrl }: StreamProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const { isConnected, videoIsPlaying, streamVideoRef, restartStream } =
    useWebRTCStream({
      meetingLink,
      hasStarted,
    });

  return (
    <Card className="w-full max-w-6xl mx-auto overflow-hidden">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Ready to Start?
                  </h2>
                  <Button
                    onClick={() => setHasStarted(true)}
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 transition-colors group relative overflow-hidden"
                  >
                    <motion.span
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <PlayCircle className="size-5" />
                      Start Stream
                    </motion.span>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full h-full"
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/50 rounded-full px-3 py-1.5 backdrop-blur-sm"
                >
                  <motion.div
                    animate={{
                      scale: isConnected ? [1, 1.2, 1] : 1,
                      backgroundColor: isConnected ? "#22c55e" : "#eab308",
                    }}
                    transition={{
                      scale: {
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 1,
                        ease: "easeInOut",
                      },
                      backgroundColor: { duration: 0.3 },
                    }}
                    className="size-2 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-white font-medium">
                    {isConnected ? "Connected" : "Connecting..."}
                  </span>
                </motion.div>

                <motion.video
                  initial={{ opacity: 0 }}
                  animate={{ opacity: videoIsPlaying ? 0 : 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-contain"
                  src={idleVideoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted
                />

                <motion.video
                  ref={streamVideoRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: videoIsPlaying ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-contain absolute top-0 left-0"
                  autoPlay
                  playsInline
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          disabled={!videoIsPlaying}
          onClick={restartStream}
          variant="destructive"
          size="lg"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <StopCircle className="size-5" />
          Stop Video & Restart Stream
        </Button>
      </CardFooter>
    </Card>
  );
}
