import { useEffect, useRef, useState } from "react";
import {
  createDIDStream,
  sendSDPAnswer,
  sendICECandidate,
  notifyICEGatheringComplete,
  closeStream,
} from "@/app/actions/d-id";
import { logMessage } from "@/app/actions";
import {
  publishStreamStatusAction,
  publishWebRTCStatusAction,
} from "@/app/actions/meetingSession";
import { useToast } from "./use-toast";

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
  // const [isReady, setIsReady] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  // const isConnected = isReady && isStreamReady;
  const isConnected = isStreamReady;
  const prevIsConnectedRef = useRef<boolean>(isConnected);
  const { toast } = useToast();

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
    if (!sessionResponse) {
      toast({
        title: "Error creating stream.",
        description: "Please try refreshing the page, or try again later.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const { id: streamId, session_id, offer, ice_servers } = sessionResponse;
    streamIdRef.current = streamId;
    sessionIdRef.current = session_id;

    setupPeerConnection({ iceServers: ice_servers }, offer);
  }

  async function setupPeerConnection(
    configuration: RTCConfiguration,
    offer: RTCSessionDescriptionInit
  ) {
    if (!streamIdRef.current || !sessionIdRef.current) return;

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    addPeerConnectionEventListeners(pc);

    const dataChannel = pc.createDataChannel("JanusDataChannel");
    dataChannelRef.current = dataChannel;
    dataChannel.onmessage = onDataChannelMessage;

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const res = await sendSDPAnswer(streamIdRef.current, sessionIdRef.current, {
      type: answer.type,
      sdp: answer.sdp,
    });

    if (res && !res.success) {
      toast({
        title: "Failed to establish connection.",
        description: res.message,
        variant: "destructive",
        duration: Infinity,
      });
    }
  }

  function addPeerConnectionEventListeners(pc: RTCPeerConnection) {
    pc.addEventListener("icecandidate", onIceCandidate);
    pc.addEventListener("icecandidateerror", (e) => {
      logMessage(`ICE candidate error: ${e}`);
    });
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
    const [eventType, ...params] = event.data.split(":");
    logMessage(event.data);

    switch (eventType) {
      case "stream/ready":
        setIsStreamReady(true);
        break;
      case "stream/started":
        setTimeout(() => {
          setVideoIsPlaying(true);
        }, 1000);
        publishStreamStatusAction(meetingLink, eventType);
        break;
      case "stream/done":
        setVideoIsPlaying(false);
        publishStreamStatusAction(meetingLink, eventType);
        break;
      case "stream/error":
        toast({
          title: "Stream error.",
          description: "Please try refreshing the page, or try again later.",
          variant: "destructive",
          duration: 5000,
        });
        console.warn("Stream error from data channel.");
        break;
      default:
        console.warn("Unknown data channel message:", event.data);
    }
  }

  function onIceConnectionStateChange() {
    const pc = pcRef.current;
    if (!pc) return;
    logMessage(`ICE state: ${pc.connectionState}`);

    switch (pc.connectionState) {
      case "connected":
        // setIsReady(true);
        // reconnectionAttemptsRef.current = 0;
        break;
      case "disconnected":
      case "failed":
        attemptReconnection();
        break;
      case "closed":
        cleanupConnection();
        break;
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
      toast({
        title: "Connection lost.",
        description: "Please try refreshing the page, or try again later.",
        variant: "destructive",
        duration: 5000,
      });
      console.warn("Maximum reconnection attempts reached.");
      return;
    }
    reconnectionAttemptsRef.current += 1;

    cleanupConnection();

    const delay = Math.min(1000 * reconnectionAttemptsRef.current, 10000);
    setTimeout(initiateConnection, delay);
  }

  function cleanupConnection() {
    const pc = pcRef.current;
    if (pc) {
      pc.removeEventListener("icecandidate", onIceCandidate);
      pc.removeEventListener("iceconnectionstatechange", onIceConnectionStateChange);
      pc.removeEventListener("track", onTrack);
      pc.getTransceivers().forEach((transceiver) => {
        transceiver.stop();
      });

      pc.close();
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

    // setIsReady(false);
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
