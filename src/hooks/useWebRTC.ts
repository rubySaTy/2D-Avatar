import { useEffect, useRef, useState } from "react";
import {
  createDIDStream,
  sendSDPAnswer,
  sendICECandidate,
  notifyICEGatheringComplete,
  closeStream,
} from "@/app/actions/d-id";

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

  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    if (hasStarted) initiateConnection();

    return () => {
      isMountedRef.current = false;
      cleanupConnection();
    };
  }, [hasStarted]);

  async function initiateConnection() {
    const sessionResponse = await createDIDStream(meetingLink, DIDCodec);
    if (!sessionResponse || !isMountedRef.current)
      throw new Error("Failed to create stream.");

    const { id: streamId, session_id, offer, ice_servers } = sessionResponse;
    streamIdRef.current = streamId;
    sessionIdRef.current = session_id;

    setupPeerConnection({ iceServers: ice_servers }, offer);
  }

  function setupPeerConnection(
    configuration: RTCConfiguration,
    offer: RTCSessionDescriptionInit
  ) {
    if (!isMountedRef.current) return;

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
        if (streamIdRef.current && sessionIdRef.current && isMountedRef.current) {
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

  function onDataChannelMessage(event: MessageEvent) {
    if (!isMountedRef.current) return;

    const message = event.data;
    const [eventType] = message.split(":");

    switch (eventType) {
      case "stream/ready":
        setIsStreamReady(true);
        break;
      case "stream/started":
        setTimeout(() => {
          setVideoIsPlaying(true);
        }, 1000);
        break;
      case "stream/done":
        setVideoIsPlaying(false);
        break;
      case "stream/error":
        console.error("Stream error from data channel.");
        break;
      default:
        console.warn("Unknown data channel message:", message);
    }
  }

  function onIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (!streamIdRef.current || !sessionIdRef.current || !isMountedRef.current) return;

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

  function onIceConnectionStateChange() {
    if (!isMountedRef.current) return;

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
    if (!isMountedRef.current) return;

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
    if (!isMountedRef.current) return;

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
    if (streamIdRef.current && sessionIdRef.current) {
      closeStream(streamIdRef.current, sessionIdRef.current);
    }

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
    if (!isMountedRef.current) return;

    // Stop the current video stream
    if (streamVideoRef.current?.srcObject instanceof MediaStream) {
      const oldStream = streamVideoRef.current.srcObject as MediaStream;
      oldStream.getTracks().forEach((track) => track.stop());
      streamVideoRef.current.srcObject = null;
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
