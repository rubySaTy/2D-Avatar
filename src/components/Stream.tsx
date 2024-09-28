"use client";

import { useEffect, useRef, useState } from "react";
import { closeStream, sendICECandidate, sendSdpAnswer } from "@/app/actions";
import { Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

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
      console.log("Sending ICE candidate:", event.candidate);
      sendICECandidate(streamId, sessionId, event.candidate.toJSON());
    } else {
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
      }
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

  // return (
  //   <div>
  //     <p>Is stream ready: {isReady ? "yes" : "no"}</p>
  //     <video id="remoteVideo" autoPlay playsInline />
  //     <button onClick={() => closeStream(streamId, sessionId)}>
  //       Close Stream
  //     </button>
  //   </div>
  // );

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
      </CardContent>
    </Card>
  );
}
