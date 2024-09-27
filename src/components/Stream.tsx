"use client";

import { useEffect, useRef, useState } from "react";
import { closeStream, sendICECandidate, sendSdpAnswer } from "@/app/actions";

interface StreamingComponentProps {
  didStreamId: string;
  didSessionId: string;
  offer: RTCSessionDescriptionInit;
  iceServers: Array<RTCIceServer>;
}

export default function Stream({
  didStreamId: streamId,
  didSessionId: sessionId,
  offer,
  iceServers,
}: StreamingComponentProps) {
  const [isReady, setIsReady] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      startStream();
    }
  }, []);

  async function startStream() {
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
    if (event.candidate) {
      sendICECandidate(streamId, sessionId, event.candidate.toJSON());
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
      }
    }
  }

  function onTrack(event: RTCTrackEvent) {
    const remoteStream = event.streams[0];
    const videoElement = document.getElementById(
      "remoteVideo"
    ) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = remoteStream;
    }
  }

  return (
    <div>
      <p>Is stream ready: {isReady ? "yes" : "no"}</p>
      <video id="remoteVideo" autoPlay playsInline />
      <button onClick={() => closeStream(streamId, sessionId)}>
        Close Stream
      </button>
    </div>
  );
}
