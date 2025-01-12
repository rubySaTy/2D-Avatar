import Ably from "ably";

export const ablyRealtime = new Ably.Realtime({
  authUrl: "../api/ably",
  autoConnect: typeof window !== "undefined",
});
