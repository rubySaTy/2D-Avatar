import { ElevenLabsClient } from "elevenlabs";

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("Missing ElevenLabs configuration in environment variables.");
}

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY, // Defaults to process.env.ELEVENLABS_API_KEY
});

export default elevenlabs;
