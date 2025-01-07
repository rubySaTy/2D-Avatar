"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import { useWebRTCStream } from "@/hooks/useWebRTC";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface StreamProps {
  meetingLink: string;
  idleVideoUrl: string;
}

export default function Stream({ meetingLink, idleVideoUrl }: StreamProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const { isConnected, videoIsPlaying, streamVideoRef, restartStream } = useWebRTCStream({
    meetingLink,
    hasStarted,
  });

  const isMobile = useIsMobile();

  // Handle orientation changes
  useEffect(() => {
    const handleOrientation = () => {
      if (!window.screen?.orientation) return;
      setIsLandscape(window.screen.orientation.type.includes("landscape"));
    };

    handleOrientation();

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", handleOrientation);
      return () => {
        window.screen.orientation.removeEventListener("change", handleOrientation);
      };
    }
  }, []);

  // Get container classes based on current state
  const getContainerClasses = () => {
    const baseClasses =
      "relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden transition-all duration-300";

    if (isMobile && isLandscape) {
      // Updated mobile landscape classes to ensure proper fitting
      return `fixed inset-0 z-50 flex items-center justify-center ${baseClasses}`;
    }

    return `w-full max-w-6xl mx-auto ${baseClasses}`;
  };

  // Get video container classes based on current state
  const getVideoContainerClasses = () => {
    if (isMobile && isLandscape) {
      // Updated to maintain aspect ratio while fitting screen
      return "relative h-screen w-screen flex items-center";
    }
    return "relative aspect-video";
  };

  // Get video classes based on current state
  const getVideoClasses = () => {
    if (isMobile && isLandscape) {
      // Updated to maintain aspect ratio while fitting screen
      return "w-full h-full object-contain max-h-screen";
    }
    return "w-full h-full object-contain";
  };

  return (
    <div className={getContainerClasses()}>
      <div className={getVideoContainerClasses()}>
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
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
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
              {/* Connection status indicator */}
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

              {/* Idle video */}
              <motion.video
                initial={{ opacity: 0 }}
                animate={{ opacity: videoIsPlaying ? 0 : 1 }}
                transition={{ duration: 0.5 }}
                className={getVideoClasses()}
                src={idleVideoUrl}
                autoPlay
                loop
                playsInline
                muted
              />

              {/* Stream video */}
              <motion.video
                ref={streamVideoRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: videoIsPlaying ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                className={`${getVideoClasses()} absolute top-0 left-0`}
                autoPlay
                playsInline
              />

              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                <Button
                  onClick={restartStream}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!videoIsPlaying}
                >
                  <StopCircle className="size-4" />
                  <span className="hidden sm:inline">Stop & Restart</span>
                </Button>

                <VoiceRecorderButton meetingLink={meetingLink} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
