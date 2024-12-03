"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { PlayCircle } from "lucide-react";
import {
  createDIDStream,
  sendSDPAnswer,
  sendICECandidate,
  notifyICEGatheringComplete,
  closeStream,
} from "@/app/actions/d-id";

interface StreamProps {
  meetingLink: string;
  idleVideoUrl: string;
}

export default function Stream({ meetingLink, idleVideoUrl }: StreamProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);

  // Refs for peer connection and data channel
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Refs for stream and session IDs
  const streamIdRef = useRef<string>();
  const sessionIdRef = useRef<string>();

  // Refs for the video elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);

  // Refs for reconnection attempts
  const reconnectionAttemptsRef = useRef(0);
  const MAX_RECONNECTION_ATTEMPTS = 5;

  useEffect(() => {
    if (typeof window !== "undefined") {
      initiateConnection();

      // Cleanup on unmount
      return () => {
        cleanupConnection();
      };
    }
  }, []);

  // Play the idle video on component mount
  useEffect(() => {
    if (idleVideoRef.current) {
      idleVideoRef.current.play().catch((error) => {
        console.error("Error playing idle video on mount:", error);
      });
    }
  }, []);

  async function initiateConnection() {
    const sessionResponse = await createDIDStream(meetingLink);
    if (!sessionResponse) {
      console.error("Failed to get session parameters and create a stream.");
      return;
    }

    const { id: streamId, session_id, offer, ice_servers } = sessionResponse;

    streamIdRef.current = streamId;
    sessionIdRef.current = session_id;

    const pc = new RTCPeerConnection({ iceServers: ice_servers });
    pcRef.current = pc;

    // Event listeners for the peer connection
    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
    pc.addEventListener("track", onTrack);

    // Create data channel for stream events
    const dataChannel = pc.createDataChannel("JanusDataChannel");
    dataChannelRef.current = dataChannel;
    dataChannel.addEventListener("message", onDataChannelMessage);

    await pc.setRemoteDescription(offer);
    const sessionClientAnswer = await pc.createAnswer();
    await pc.setLocalDescription(sessionClientAnswer);

    const answer: RTCSessionDescriptionInit = {
      type: sessionClientAnswer.type,
      sdp: sessionClientAnswer.sdp,
    };
    await sendSDPAnswer(streamId, answer, session_id);
  }

  // Handle messages from the data channel
  function onDataChannelMessage(event: MessageEvent) {
    const message = event.data;
    const [eventType] = message.split(":");

    if (eventType === "stream/ready") setIsStreamReady(true);
    else if (eventType === "stream/started") setVideoIsPlaying(true);
    else if (eventType === "stream/done") setVideoIsPlaying(false);
    else if (eventType === "stream/error") console.error("Stream error");
  }

  function onIceCandidate(event: RTCPeerConnectionIceEvent) {
    const streamId = streamIdRef.current;
    const sessionId = sessionIdRef.current;

    if (!streamId || !sessionId) {
      console.error("Stream ID not found.");
      return;
    }

    if (event.candidate) {
      sendICECandidate(streamId, sessionId, event.candidate.toJSON());
    } else {
      // For the initial 2 sec idle stream at the beginning of the connection, we utilize a null ice candidate.
      // Notify that ICE gathering is complete
      notifyICEGatheringComplete(sessionId, streamId);
    }
  }

  function onIceConnectionStateChange() {
    const pc = pcRef.current;
    if (pc) {
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setIsReady(true);
        // Reset reconnection attempts after successful connection
        reconnectionAttemptsRef.current = 0;
      } else if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        console.error("ICE connection failed or disconnected.");
        handleReconnection();
      }
    }
  }

  function handleReconnection() {
    const pc = pcRef.current;
    if (pc) {
      if (reconnectionAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS) {
        console.error("Maximum reconnection attempts reached.");
        return;
      }

      reconnectionAttemptsRef.current += 1;

      console.log(
        `Connection lost. Attempting to reconnect... (${reconnectionAttemptsRef.current}/${MAX_RECONNECTION_ATTEMPTS})`
      );
      setIsReady(false);
      setIsStreamReady(false);
      setVideoIsPlaying(false);
      cleanupConnection();

      // Initiate a new connection after a delay
      const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000); // Cap delay at 10 seconds
      setTimeout(() => {
        initiateConnection();
      }, delay);
    }
  }

  function onTrack(event: RTCTrackEvent) {
    const remoteStream = event.streams[0];
    const videoElement = videoRef.current;

    if (videoElement) {
      // Check if the stream has changed
      if (videoElement.srcObject !== remoteStream) {
        videoElement.srcObject = remoteStream;
      }
    } else {
      console.error("Video element not found.");
    }
  }

  function cleanupConnection() {
    const streamId = streamIdRef.current;
    const sessionId = sessionIdRef.current;

    // Close the stream on the server side
    if (streamId && sessionId) {
      closeStream(streamId, sessionId);
    }

    // Clean up current peer connection
    const pc = pcRef.current;
    if (pc) {
      pc.removeEventListener("icecandidate", onIceCandidate);
      pc.removeEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange
      );
      pc.removeEventListener("track", onTrack);
      pc.close();
      pcRef.current = null;
    }

    // Clean up data channel
    const dataChannel = dataChannelRef.current;
    if (dataChannel) {
      dataChannel.removeEventListener("message", onDataChannelMessage);
      dataChannel.close();
      dataChannelRef.current = null;
    }

    // Reset streamId and sessionId
    streamIdRef.current = undefined;
    sessionIdRef.current = undefined;

    // Reset video element
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden">
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
                {/* Connection Status */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/50 rounded-full px-3 py-1.5 backdrop-blur-sm"
                >
                  <motion.div
                    animate={{
                      scale: isReady && isStreamReady ? [1, 1.2, 1] : 1,
                      backgroundColor:
                        isReady && isStreamReady ? "#22c55e" : "#eab308",
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
                    {isReady && isStreamReady ? "Connected" : "Connecting..."}
                  </span>
                </motion.div>

                {/* Idle Video */}
                <motion.video
                  id="idleVideo"
                  ref={idleVideoRef}
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

                {/* Live Stream Video */}
                <motion.video
                  id="remoteVideo"
                  ref={videoRef}
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
    </Card>
  );
}
