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
  // State variables
  const [isReady, setIsReady] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false); // NEW: Tracks if user has interacted

  // Refs for peer connection and data channel
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Refs for stream and session IDs
  const streamIdRef = useRef<string>();
  const sessionIdRef = useRef<string>();

  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  // Refs for monitoring video data reception
  const statsIntervalIdRef = useRef<number | null>(null);
  const lastBytesReceivedRef = useRef(0);

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

    // Event listeners for the peer connection
    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
    pc.addEventListener("track", onTrack);
    pc.addEventListener("icegatheringstatechange", onIceGatheringStateChange); // NEW
    pc.addEventListener("connectionstatechange", onConnectionStateChange); // NEW
    pc.addEventListener("signalingstatechange", onSignalingStateChange); // NEW

    // Create data channel for stream events
    const dataChannel = pc.createDataChannel("JanusDataChannel");
    dataChannelRef.current = dataChannel;
    dataChannel.addEventListener("message", onDataChannelMessage);

    await pc.setRemoteDescription(offer);
    const sessionClientAnswer = await pc.createAnswer();
    await pc.setLocalDescription(sessionClientAnswer);

    const answer = {
      type: sessionClientAnswer.type,
      sdp: sessionClientAnswer.sdp,
    };
    await sendSdpAnswer(streamId, answer, sessionId);
  }

  // Handle messages from the data channel
  function onDataChannelMessage(event: MessageEvent) {
    const message = event.data;
    const [eventType] = message.split(":");

    console.log("Data channel message:", message);

    if (eventType === "stream/ready") {
      console.log("Stream is ready");
      setIsStreamReady(true);
    }
    // Handle other events like 'stream/started', 'stream/done', 'stream/error' if needed
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
      // Notify that ICE gathering is complete
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
      pc.removeEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange
      );
      pc.removeEventListener("connectionstatechange", onConnectionStateChange);
      pc.removeEventListener("signalingstatechange", onSignalingStateChange);
      pc.close();
      pcRef.current = null;

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

      // Clear stats interval
      if (statsIntervalIdRef.current !== null) {
        clearInterval(statsIntervalIdRef.current);
        statsIntervalIdRef.current = null;
      }

      // Initiate a new connection after a delay
      const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000); // Cap delay at 10 seconds
      setTimeout(() => {
        initiateConnection();
      }, delay);
    }
  }

  // Function to handle user interaction
  function handleUserInteraction() {
    setUserHasInteracted(true);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video after user interaction:", error);
      });
    }
  }

  function onTrack(event: RTCTrackEvent) {
    console.log("Received track event:", event);
    const remoteStream = event.streams[0];
    const videoElement = videoRef.current;

    if (videoElement) {
      // Check if the stream has changed
      if (videoElement.srcObject !== remoteStream) {
        videoElement.srcObject = remoteStream;

        // Add event listeners to manage playback
        videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
        videoElement.addEventListener("playing", onVideoPlaying);
        videoElement.addEventListener("pause", onVideoPaused);
      }
    } else {
      console.error("Video element not found.");
    }

    const pc = pcRef.current;
    if (pc) {
      // Monitor video data reception
      statsIntervalIdRef.current = window.setInterval(async () => {
        const stats = await pc.getStats(event.track);
        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            const bytesReceived = report.bytesReceived;
            if (bytesReceived > lastBytesReceivedRef.current) {
              if (!videoIsPlaying) {
                setVideoIsPlaying(true);
              }
            } else {
              if (videoIsPlaying) {
                setVideoIsPlaying(false);
              }
            }
            lastBytesReceivedRef.current = bytesReceived;
          }
        });
      }, 500);
    }
  }

  function onIceGatheringStateChange() {
    const pc = pcRef.current;
    if (pc) {
      console.log("ICE gathering state changed:", pc.iceGatheringState);
    }
  }

  function onConnectionStateChange() {
    const pc = pcRef.current;
    if (pc) {
      console.log("Connection state changed:", pc.connectionState);
    }
  }

  function onSignalingStateChange() {
    const pc = pcRef.current;
    if (pc) {
      console.log("Signaling state changed:", pc.signalingState);
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
      pc.removeEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange
      );
      pc.removeEventListener("connectionstatechange", onConnectionStateChange);
      pc.removeEventListener("signalingstatechange", onSignalingStateChange);
      pc.close();
      pcRef.current = null;
    }

    const dataChannel = dataChannelRef.current;
    if (dataChannel) {
      dataChannel.removeEventListener("message", onDataChannelMessage);
      dataChannel.close();
      dataChannelRef.current = null;
    }

    const streamId = streamIdRef.current;
    const sessionId = sessionIdRef.current;

    if (streamId && sessionId) {
      closeStream(streamId, sessionId);
    }

    // Reset video element
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }

    // Clear stats interval
    if (statsIntervalIdRef.current !== null) {
      clearInterval(statsIntervalIdRef.current);
      statsIntervalIdRef.current = null;
    }
  }

  // Handle video loadedmetadata event
  function onLoadedMetadata() {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Only play if the user has interacted or the video is muted
      if (userHasInteracted || videoElement.muted) {
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      } else {
        console.log(
          "User has not interacted yet; video will not play with sound."
        );
      }
    }
  }

  // Handle video playing event
  function onVideoPlaying() {
    console.log("Video is playing.");
  }

  // Handle video paused event
  function onVideoPaused() {
    console.log("Video is paused.");
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-gray-900">
          {!(isReady && isStreamReady && videoIsPlaying) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <video
            id="remoteVideo"
            ref={videoRef}
            className={`w-full h-full object-contain ${
              isReady && isStreamReady && videoIsPlaying
                ? "opacity-100"
                : "opacity-0"
            }`}
            autoPlay
            playsInline
            muted={!userHasInteracted} // Keep muted until user interacts
          />
          {!userHasInteracted && isReady && isStreamReady && videoIsPlaying && (
            // Overlay a button to prompt user interaction
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <button
                onClick={handleUserInteraction}
                className="bg-white text-black px-4 py-2 rounded"
              >
                Click to Unmute
              </button>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge
              variant={
                isReady && isStreamReady && videoIsPlaying
                  ? "default"
                  : "secondary"
              }
              className="text-xs"
            >
              {isReady
                ? isStreamReady
                  ? videoIsPlaying
                    ? "Live"
                    : "Buffering..."
                  : "Preparing Stream..."
                : "Connecting..."}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
