import elevenlabs from "@/lib/elevenlabs";
import { sanitizeFileObjects } from "@/lib/utils";

export async function addVoice(
  voiceName: string,
  voiceFiles: Array<File>,
  description?: string,
  removeBackgroundNoise?: boolean
) {
  const sanitiziedVoiceFiles = sanitizeFileObjects(voiceFiles);

  return elevenlabs.voices.add({
    name: voiceName,
    files: sanitiziedVoiceFiles,
    description,
    remove_background_noise: removeBackgroundNoise,
  });
}
