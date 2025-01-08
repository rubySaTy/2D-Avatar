"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import { useWebRTCStream } from "@/hooks/useWebRTC";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { useIsLandscape, useIsMobile } from "@/hooks/use-mobile";

interface StreamProps {
  meetingLink: string;
  idleVideoUrl: string;
}

export default function Stream({ meetingLink, idleVideoUrl }: StreamProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const { isConnected, videoIsPlaying, streamVideoRef, restartStream } = useWebRTCStream({
    meetingLink,
    hasStarted,
  });

  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const isMobileLandscape = isMobile && isLandscape;

  // Get container classes based on current state
  const getContainerClasses = () => {
    const baseClasses = "bg-gray-900";

    if (isMobileLandscape) {
      return `fixed inset-0 z-50 ${baseClasses} flex justify-center items-center`;
    }

    if (isMobile) {
      return `fixed inset-0 z-50 ${baseClasses} flex items-center`;
    }

    return "aspect-video max-w-5xl mx-auto rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden";
  };

  // Get video wrapper classes based on device and orientation
  const getVideoWrapperClasses = () => {
    if (isMobileLandscape) {
      return "h-full aspect-[9/16]"; // Force portrait aspect ratio in landscape
    }
    if (isMobile) {
      return "w-full";
    }
    return "w-full h-full relative";
  };

  // Get video classes based on device and orientation
  const getVideoClasses = () => {
    if (isMobileLandscape) {
      return "h-full w-auto max-w-none";
    }
    if (isMobile) {
      return "w-full h-auto";
    }
    return "w-full h-full object-contain";
  };

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <StartScreen onStart={() => setHasStarted(true)} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={getVideoWrapperClasses()}
          >
            {/* Connection status indicator */}
            <ConnectionStatus isConnected={isConnected} />

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
              className={`absolute top-0 left-0 ${getVideoClasses()}`}
              autoPlay
              playsInline
            />

            {/* Controls */}
            <Controls
              meetingLink={meetingLink}
              restartStream={restartStream}
              videoIsPlaying={videoIsPlaying}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
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
          onClick={onStart}
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
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
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
        className="w-2 h-2 rounded-full"
        aria-hidden="true"
      />
      <span className="text-sm text-white font-medium">
        {isConnected ? "Connected" : "Connecting..."}
      </span>
    </motion.div>
  );
}

function Controls({
  videoIsPlaying,
  restartStream,
  meetingLink,
}: {
  videoIsPlaying: boolean;
  restartStream: () => void;
  meetingLink: string;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
      <Button
        onClick={restartStream}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
        disabled={!videoIsPlaying}
      >
        <StopCircle className="w-4 h-4" />
        <span className="hidden md:inline">Stop & Restart</span>
      </Button>
      <VoiceRecorderButton meetingLink={meetingLink} />
    </div>
  );
}
