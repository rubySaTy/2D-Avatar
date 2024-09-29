"use client";

import { useEffect, useRef, useState } from "react";
import {
  closeStream,
  createDIDStream,
  notifyICEGatheringComplete,
  sendICECandidate,
  sendSdpAnswer,
} from "@/app/actions";
import { Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface StreamProps {
  meetingLink: string;
}

export default function Stream({ meetingLink }: StreamProps) {
  const [isReady, setIsReady] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const streamIdRef = useRef<string>();
  const sessionIdRef = useRef<string>();

  // Add a ref to manage reconnection attempts
  const reconnectionAttemptsRef = useRef(0);
  const MAX_RECONNECTION_ATTEMPTS = 5;

  // Use a ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initiateConnection();

      // Cleanup on unmount
      return () => {
        cleanupConnection();
      };
    }
  }, []);

  async function initiateConnection() {
    const sessionResponse = await createDIDStream(meetingLink);

    if (sessionResponse) {
      const { id, session_id, offer, ice_servers } = sessionResponse;
      streamIdRef.current = id;
      sessionIdRef.current = session_id;

      startStream(id, session_id, offer, ice_servers);
    } else {
      console.error("Failed to get session parameters");
    }
  }

  async function startStream(
    streamId: string,
    sessionId: string,
    offer: RTCSessionDescriptionInit,
    iceServers: Array<RTCIceServer>
  ) {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
    pc.addEventListener("track", onTrack);

    await pc.setRemoteDescription(offer);
    const sessionClientAnswer = await pc.createAnswer();
    await pc.setLocalDescription(sessionClientAnswer);

    const answer = {
      type: sessionClientAnswer.type,
      sdp: sessionClientAnswer.sdp,
    };
    await sendSdpAnswer(streamId, answer, sessionId);
  }

  function onIceCandidate(event: RTCPeerConnectionIceEvent) {
    const streamId = streamIdRef.current;
    const sessionId = sessionIdRef.current;

    if (!streamId || !sessionId) {
      console.error("Stream ID not found.");
      return;
    }

    if (event.candidate) {
      console.log("Sending ICE candidate:", event.candidate);
      sendICECandidate(streamId, sessionId, event.candidate.toJSON());
    } else {
      // For the initial 2 sec idle stream at the beginning of the connection, we utilize a null ice candidate.
      notifyICEGatheringComplete(sessionId, streamId);
      console.log("All ICE candidates have been sent.");
    }
  }

  function onIceConnectionStateChange() {
    const pc = pcRef.current;
    if (pc) {
      console.log("ICE connection state changed:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setIsReady(true);
        // Reset reconnection attempts after successful connection
        reconnectionAttemptsRef.current = 0;
      } else if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        // Handle reconnection logic
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

      const streamId = streamIdRef.current;
      const sessionId = sessionIdRef.current;

      // Close the stream on the server side
      if (streamId && sessionId) {
        closeStream(streamId, sessionId);
      }

      // Clean up current peer connection
      pc.removeEventListener("icecandidate", onIceCandidate);
      pc.removeEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange
      );
      pc.removeEventListener("track", onTrack);
      pc.close();
      pcRef.current = null;

      // Reset streamId and sessionId
      streamIdRef.current = undefined;
      sessionIdRef.current = undefined;

      // Reset video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Initiate a new connection after a delay (e.g., exponential backoff)
      const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000); // Cap delay at 10 seconds
      setTimeout(() => {
        initiateConnection();
      }, delay);
    }
  }

  function onTrack(event: RTCTrackEvent) {
    console.log("Received track event:", event);
    const remoteStream = event.streams[0];
    const videoElement = document.getElementById(
      "remoteVideo"
    ) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = remoteStream;
    } else {
      console.error("Video element not found.");
    }
  }

  function cleanupConnection() {
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

    const streamId = streamIdRef.current;
    const sessionId = sessionIdRef.current;

    if (streamId && sessionId) {
      closeStream(streamId, sessionId);
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-gray-900">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <video
            id="remoteVideo"
            ref={videoRef}
            className={`w-full h-full object-contain ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            playsInline
          />
          <div className="absolute top-2 left-2">
            <Badge
              variant={isReady ? "default" : "secondary"}
              className="text-xs"
            >
              {isReady ? "Live" : "Connecting..."}
            </Badge>
          </div>
        </div>
        {/* {streamId && sessionId && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => closeStream(streamId, sessionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Close Stream
            </Button>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
