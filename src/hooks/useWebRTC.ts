import { useEffect, useRef, useState } from "react";
import {
  createDIDStream,
  sendSDPAnswer,
  sendICECandidate,
  notifyICEGatheringComplete,
  closeStream,
} from "@/app/actions/d-id";
import { logMessage } from "@/app/actions";
import { publishWebRTCStatusAction } from "@/app/actions/meetingSession";

interface UseWebRTCStreamOptions {
  meetingLink: string;
  hasStarted: boolean;
  DIDCodec: string;
  maxReconnectionAttempts?: number;
}

export function useWebRTCStream({
  meetingLink,
  hasStarted,
  DIDCodec,
  maxReconnectionAttempts = 5,
}: UseWebRTCStreamOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  const isConnected = isReady && isStreamReady;
  const prevIsConnectedRef = useRef<boolean>(isConnected);

  useEffect(() => {
    if (hasStarted) initiateConnection();
  }, [hasStarted]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/did-webrtc/close", JSON.stringify(meetingLink));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [meetingLink]);

  useEffect(() => {
    // Only call the server action if isConnected has actually changed
    if (prevIsConnectedRef.current !== isConnected) {
      publishWebRTCStatusAction(meetingLink, isConnected);
      prevIsConnectedRef.current = isConnected;
    }
  }, [isConnected, meetingLink]);

  async function initiateConnection() {
    const sessionResponse = await createDIDStream(meetingLink, DIDCodec);
    if (!sessionResponse) throw new Error("Failed to create stream.");

    const { id: streamId, session_id, offer, ice_servers } = sessionResponse;
    streamIdRef.current = streamId;
    sessionIdRef.current = session_id;

    setupPeerConnection({ iceServers: ice_servers }, offer);
  }

  function setupPeerConnection(
    configuration: RTCConfiguration,
    offer: RTCSessionDescriptionInit
  ) {
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    addPeerConnectionEventListeners(pc);

    const dataChannel = pc.createDataChannel("JanusDataChannel");
    dataChannelRef.current = dataChannel;
    dataChannel.onmessage = onDataChannelMessage;

    pc.setRemoteDescription(offer)
      .then(() => pc.createAnswer())
      .then((answer) => {
        pc.setLocalDescription(answer);
        if (streamIdRef.current && sessionIdRef.current) {
          sendSDPAnswer(streamIdRef.current, sessionIdRef.current, {
            type: answer.type,
            sdp: answer.sdp,
          });
        }
      });
  }

  function addPeerConnectionEventListeners(pc: RTCPeerConnection) {
    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
    pc.addEventListener("track", onTrack);
  }

  function onIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (!streamIdRef.current || !sessionIdRef.current) return;

    if (event.candidate) {
      sendICECandidate(
        streamIdRef.current,
        sessionIdRef.current,
        event.candidate.toJSON()
      );
    } else {
      notifyICEGatheringComplete(sessionIdRef.current, streamIdRef.current);
    }
  }

  function onDataChannelMessage(event: MessageEvent) {
    const message = event.data;
    const [eventType] = message.split(":");

    switch (eventType) {
      case "stream/ready":
        logMessage(message);
        setIsStreamReady(true);
        break;
      case "stream/started":
        logMessage(message);
        setTimeout(() => {
          setVideoIsPlaying(true);
        }, 1000);
        break;
      case "stream/done":
        logMessage(message);
        setVideoIsPlaying(false);
        break;
      case "stream/error":
        logMessage(message);
        console.error("Stream error from data channel.");
        break;
      default:
        logMessage(message);
        console.warn("Unknown data channel message:", message);
    }
  }

  function onIceConnectionStateChange() {
    const pc = pcRef.current;
    if (!pc) return;

    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
      setIsReady(true);
      reconnectionAttemptsRef.current = 0;
    } else if (
      pc.iceConnectionState === "disconnected" ||
      pc.iceConnectionState === "failed"
    ) {
      attemptReconnection();
    }
  }

  function onTrack(event: RTCTrackEvent) {
    const videoElement = streamVideoRef.current;
    if (!videoElement) return;

    // Initialize a single MediaStream if not already present
    if (!videoElement.srcObject) {
      videoElement.srcObject = new MediaStream();
    }

    const remoteStream = videoElement.srcObject as MediaStream;

    // Add the new track to the existing MediaStream
    remoteStream.addTrack(event.track);

    // handle track removal
    event.track.onended = () => {
      remoteStream.removeTrack(event.track);
    };
  }

  function attemptReconnection() {
    const attempts = reconnectionAttemptsRef.current;
    if (attempts >= maxReconnectionAttempts) {
      console.error("Maximum reconnection attempts reached.");
      return;
    }
    reconnectionAttemptsRef.current += 1;

    cleanupConnection();

    const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000);
    setTimeout(initiateConnection, delay);
  }

  function cleanupConnection() {
    if (pcRef.current) {
      pcRef.current.removeEventListener("icecandidate", onIceCandidate);
      pcRef.current.removeEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange
      );
      pcRef.current.removeEventListener("track", onTrack);
      pcRef.current.close();
      pcRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (
      streamVideoRef.current &&
      streamVideoRef.current.srcObject instanceof MediaStream
    ) {
      streamVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      streamVideoRef.current.srcObject = null;
    }

    setIsReady(false);
    setIsStreamReady(false);
    setVideoIsPlaying(false);

    streamIdRef.current = null;
    sessionIdRef.current = null;
  }

  function restartStream() {
    // Stop the current video stream
    if (streamVideoRef.current?.srcObject instanceof MediaStream) {
      const oldStream = streamVideoRef.current.srcObject as MediaStream;
      oldStream.getTracks().forEach((track) => track.stop());
      streamVideoRef.current.srcObject = null;
    }

    if (streamIdRef.current && sessionIdRef.current) {
      closeStream(streamIdRef.current, sessionIdRef.current, meetingLink);
    }

    // Clean up existing PeerConnection
    cleanupConnection();

    // Reinitialize the connection
    initiateConnection();
  }

  return {
    isConnected,
    videoIsPlaying,
    streamVideoRef,
    restartStream,
  };
}
