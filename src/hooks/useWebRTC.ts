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
  maxReconnectionAttempts?: number;
}

export function useWebRTCStream({
  meetingLink,
  maxReconnectionAttempts = 5,
}: UseWebRTCStreamOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isInitialRequest, setIsInitialRequest] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  const isConnected = isReady && isStreamReady;

  useEffect(() => {
    initiateConnection();

    return () => {
      cleanupConnection();
    };
  }, []);

  async function initiateConnection() {
    const sessionResponse = await createDIDStream(meetingLink);
    if (!sessionResponse) return;

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
        sendSDPAnswer(streamIdRef.current!, sessionIdRef.current!, {
          type: answer.type,
          sdp: answer.sdp,
        });
      });
  }

  function addPeerConnectionEventListeners(pc: RTCPeerConnection) {
    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
    pc.addEventListener("track", onTrack);
  }

  function onDataChannelMessage(event: MessageEvent) {
    const message = event.data;
    const [eventType] = message.split(":");

    switch (eventType) {
      case "stream/ready":
        setIsStreamReady(true);
        break;
      case "stream/started":
        if (isInitialRequest) {
          setTimeout(() => {
            setVideoIsPlaying(true);
            setIsInitialRequest(false);
          }, 1000);
        } else {
          setVideoIsPlaying(true);
        }
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

  function onIceConnectionStateChange() {
    const pc = pcRef.current;
    if (!pc) return;

    if (
      pc.iceConnectionState === "connected" ||
      pc.iceConnectionState === "completed"
    ) {
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
    const remoteStream = event.streams[0];
    if (videoElement && videoElement.srcObject !== remoteStream) {
      if (videoElement.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
      }
      videoElement.srcObject = remoteStream;
    }
  }

  function attemptReconnection() {
    const attempts = reconnectionAttemptsRef.current;
    if (attempts >= maxReconnectionAttempts) {
      console.error("Maximum reconnection attempts reached.");
      return;
    }
    reconnectionAttemptsRef.current += 1;

    setIsReady(false);
    setIsStreamReady(false);
    setVideoIsPlaying(false);

    cleanupConnection();

    const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000);
    setTimeout(initiateConnection, delay);
  }

  function cleanupConnection() {
    closeStream(streamIdRef.current!, sessionIdRef.current!);

    if (pcRef.current) {
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
      streamVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      streamVideoRef.current.srcObject = null;
    }

    streamIdRef.current = null;
    sessionIdRef.current = null;
  }

  return {
    isConnected,
    videoIsPlaying,
    streamVideoRef,
  };
}
