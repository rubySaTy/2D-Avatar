"use client";
import {
  notifyICEGatheringComplete,
  sendICECandidate,
  sendSdpAnswer,
  closeStream,
} from "@/app/actions";
import { useEffect, useRef, useState } from "react";

interface StreamingComponentProps {
  didStreamId: string;
  didSessionId: string;
  offer: RTCSessionDescriptionInit;
  iceServers: Array<RTCIceServer>;
}

export default function StreamingComponent({
  didStreamId,
  didSessionId,
  offer,
  iceServers,
}: StreamingComponentProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pcDataChannelRef = useRef<RTCDataChannel | null>(null);

  const statsIntervalIdRef = useRef<number | null>(null);
  const lastBytesReceivedRef = useRef<number>(0);

  // Video element references
  const idleVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamVideoElementRef = useRef<HTMLVideoElement | null>(null);

  const [iceGatheringStatus, setIceGatheringStatus] = useState("");
  const [iceStatus, setIceStatus] = useState("");
  const [peerStatus, setPeerStatus] = useState("");
  const [signalingStatus, setSignalingStatus] = useState("");
  const [streamEvent, setStreamEvent] = useState("");
  const [streamingStatus, setStreamingStatus] = useState("");

  // State variables for rendering
  const [videoIsPlaying, setVideoIsPlaying] = useState<boolean>(false);
  const [isStreamReady, setIsStreamReady] = useState<boolean>(false);

  // Event handler functions
  const onIceGatheringStateChange = (): void => {
    const pc = peerConnectionRef.current;
    if (pc) {
      console.log("ICE Gathering State:", pc.iceGatheringState);
      setIceGatheringStatus(pc.iceGatheringState);
      // Update UI or state as needed
    }
  };

  function onIceCandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      console.log("New ICE Candidate:", event.candidate);
      // Send the ICE candidate to your server
      const serializedCandidate = event.candidate.toJSON();
      sendICECandidate(didStreamId, didSessionId, serializedCandidate);
    } else {
      console.log("All ICE candidates have been sent");
      // Optionally notify the server that ICE gathering is complete
      // For the initial 2 sec idle stream at the beginning of the connection, we utilize a null ice candidate.
      notifyICEGatheringComplete(didSessionId, didStreamId);
    }
  }

  const onIceConnectionStateChange = (): void => {
    const pc = peerConnectionRef.current;
    if (pc) {
      console.log("ICE Connection State:", pc.iceConnectionState);
      setIceStatus(pc.iceConnectionState);
      // Handle different states as needed
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "closed"
      ) {
        stopAllStreams();
        closePC();
      }
    }
  };

  const onConnectionStateChange = (): void => {
    const pc = peerConnectionRef.current;
    if (pc) {
      console.log("Connection State:", pc.connectionState);
      setPeerStatus(pc.connectionState);
      if (pc.connectionState === "connected") {
        playIdleVideo();
        // Optionally set a timeout to force stream readiness if needed
        setTimeout(() => {
          if (!isStreamReady) {
            console.log("Forcing stream readiness");
            setIsStreamReady(true);
            setStreamEvent("ready");
          }
        }, 5000);
      }
    }
  };

  const onSignalingStateChange = (): void => {
    const pc = peerConnectionRef.current;
    if (pc) {
      console.log("Signaling State:", pc.signalingState);
      setSignalingStatus(pc.signalingState);
      // Update UI or state as needed
    }
  };

  const onTrack = (event: RTCTrackEvent): void => {
    console.log("Track event:", event.track.kind);
    if (event.track.kind === "video") {
      const stream = event.streams[0];
      if (streamVideoElementRef.current) {
        streamVideoElementRef.current.srcObject = stream;
        streamVideoElementRef.current.play().catch((e) => {
          console.error("Error playing stream video:", e);
        });
      }

      // Monitor the stream to detect if video is playing
      statsIntervalIdRef.current = window.setInterval(async () => {
        const pc = peerConnectionRef.current;
        if (pc) {
          const stats = await pc.getStats(event.track);
          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
              const currentBytesReceived = report.bytesReceived;
              const videoPlaying =
                currentBytesReceived > lastBytesReceivedRef.current;

              if (videoPlaying !== videoIsPlaying) {
                setVideoIsPlaying(videoPlaying);
                onVideoStatusChange(videoPlaying);
              }

              lastBytesReceivedRef.current = currentBytesReceived;
            }
          });
        }
      }, 500);
    }
  };

  const onStreamEvent = (event: MessageEvent): void => {
    const message = event.data as string;
    console.log("Stream event message:", message);

    const [eventType, payload] = message.split(":");

    switch (eventType) {
      case "stream/started":
        console.log("Stream started");
        break;
      case "stream/done":
        console.log("Stream done");
        break;
      case "stream/ready":
        console.log("Stream ready");
        setIsStreamReady(true);
        break;
      case "stream/error":
        console.error("Stream error:", payload);
        break;
      default:
        console.log("Unhandled stream event:", eventType);
        break;
    }
  };

  const onVideoStatusChange = (isPlaying: boolean): void => {
    let status = "";
    if (idleVideoElementRef.current && streamVideoElementRef.current) {
      if (isPlaying) {
        status = "streaming";
        streamVideoElementRef.current.style.opacity = "1";
        idleVideoElementRef.current.style.opacity = "0";
      } else {
        status = "empty";
        streamVideoElementRef.current.style.opacity = "0";
        idleVideoElementRef.current.style.opacity = "1";
      }
    }
    setStreamingStatus(status);
  };

  // Function to play the idle video
  const playIdleVideo = (): void => {
    if (idleVideoElementRef.current) {
      // TODO: provide idle video?
      // idleVideoElementRef.current.src = "/elana_idle.mp4"; // Update with your idle video source
      idleVideoElementRef.current.loop = true;
      idleVideoElementRef.current.play().catch((e) => {
        console.error("Error playing idle video:", e);
      });
    }
  };

  // Function to stop all streams
  const stopAllStreams = (): void => {
    if (
      streamVideoElementRef.current &&
      streamVideoElementRef.current.srcObject
    ) {
      const stream = streamVideoElementRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      streamVideoElementRef.current.srcObject = null;
      console.log("Stopped all streams");
    }
  };

  // Function to close the peer connection
  const closePC = (): void => {
    const pc = peerConnectionRef.current;
    if (pc) {
      console.log("Closing peer connection");
      pc.close();
      peerConnectionRef.current = null;
    }

    if (pcDataChannelRef.current) {
      pcDataChannelRef.current.close();
      pcDataChannelRef.current = null;
    }

    if (statsIntervalIdRef.current !== null) {
      clearInterval(statsIntervalIdRef.current);
      statsIntervalIdRef.current = null;
    }

    setIsStreamReady(false);
    setVideoIsPlaying(false);
  };

  async function createPeerConnection(
    offer: RTCSessionDescriptionInit,
    iceServers: RTCIceServer[]
  ): Promise<RTCSessionDescriptionInit> {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({ iceServers });
      pcDataChannelRef.current =
        peerConnectionRef.current.createDataChannel("JanusDataChannel");

      peerConnectionRef.current.addEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange,
        true
      );
      peerConnectionRef.current.addEventListener(
        "icecandidate",
        onIceCandidate,
        true
      );
      peerConnectionRef.current.addEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange,
        true
      );
      peerConnectionRef.current.addEventListener(
        "connectionstatechange",
        onConnectionStateChange,
        true
      );
      peerConnectionRef.current.addEventListener(
        "signalingstatechange",
        onSignalingStateChange,
        true
      );
      peerConnectionRef.current.addEventListener("track", onTrack, true);

      pcDataChannelRef.current?.addEventListener(
        "message",
        onStreamEvent,
        true
      );
    }

    if (!peerConnectionRef.current) {
      throw new Error("Failed to create RTCPeerConnection");
    }

    await peerConnectionRef.current.setRemoteDescription(offer);
    console.log("Set remote SDP OK");

    const sessionClientAnswer = await peerConnectionRef.current.createAnswer();
    console.log("Created local SDP OK");

    await peerConnectionRef.current.setLocalDescription(sessionClientAnswer);
    console.log("Set local SDP OK");

    return sessionClientAnswer;
  }

  async function handleStartStreaming() {
    try {
      const answer = await createPeerConnection(offer, iceServers);

      // Proceed to send the answer to your server
      const serializableAnswer = {
        type: answer.type,
        sdp: answer.sdp,
      };
      await sendSdpAnswer(didStreamId, serializableAnswer, didSessionId);
    } catch (error) {
      console.error("Error during streaming setup:", error);
      stopAllStreams();
      closePC();
    }
  }
  // Function to handle stopping the streaming process
  async function handleStopStreaming() {
    // Send a request to your server to stop the stream
    await closeStream(didStreamId, didSessionId);
    stopAllStreams();
    closePC();
  }

  useEffect(() => {
    // Any initialization code that needs to run on component mount
    // Remember to check if window is defined
    if (typeof window !== "undefined") {
      // Safe to use browser APIs
    }

    return () => {
      stopAllStreams();
      closePC();
    };
  }, []);

  return (
    <div>
      ICE gathering status:{" "}
      <label id="ice-gathering-status-label">{iceGatheringStatus}</label>
      <br />
      ICE status: <label id="ice-status-label">{iceStatus}</label>
      <br />
      Peer connection status: <label id="peer-status-label">{peerStatus}</label>
      <br />
      Signaling status:{" "}
      <label id="signaling-status-label">{signalingStatus}</label>
      <br />
      Last stream event: <label id="stream-event-label">{streamEvent}</label>
      <br />
      Streaming status:{" "}
      <label id="streaming-status-label">{streamingStatus}</label>
      <br />
      {/* Video elements */}
      {/* <video
        ref={idleVideoElementRef}
        id="idle-video-element"
        // style={{ width: "100%", opacity: videoIsPlaying ? 0 : 1 }}
        playsInline
      ></video> */}
      <video
        ref={streamVideoElementRef}
        id="stream-video-element"
        // style={{ width: "100%", opacity: videoIsPlaying ? 1 : 0 }}
        playsInline
      ></video>
      {/* Control buttons */}
      <button onClick={handleStartStreaming}>Start Streaming</button>
      <button onClick={handleStopStreaming}>Stop Streaming</button>
    </div>
  );
}
