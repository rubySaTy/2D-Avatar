// Dictionary for tones with base and extreme descriptors
export const toneInstructions: Record<string, { base: string; extreme: string }> = {
  calm: {
    base: "Your tone should be calm, measured, and understanding.",
    extreme: "completely serene, tranquil, and soothing",
  },
  angry: {
    base: "Your tone should be angry. Show irritation, frustration, and displeasure.",
    extreme: "absolutely furious, boiling over with rage and hostility",
  },
  shouting: {
    base: "Your tone should be forceful and raised, as if you are shouting. Use strong emphasis and volume.",
    extreme:
      "unrestrained yelling, with every word sounding like it’s being shouted at maximum volume",
  },
  serious: {
    base: "Your tone should be serious, grave, and earnest. Speak as if the matter is of great importance.",
    extreme:
      "deeply solemn and intense, leaving no room for lightness or levity",
  },
  cheerful: {
    base: "Your tone should be cheerful, upbeat, and positive. Sound like you’re in a good mood.",
    extreme:
      "radiantly joyful and exuberant, with every word brimming with happiness",
  },
  excited: {
    base: "Your tone should be excited, conveying enthusiasm and anticipation.",
    extreme:
      "overflowing with eager enthusiasm, as if you can barely contain your excitement",
  },
  fearful: {
    base: "Your tone should be fearful, sounding worried and anxious.",
    extreme:
      "trembling with terror, sounding as if you’re truly afraid for your safety",
  },
  terrified: {
    base: "Your tone should be terrified, as if gripped by intense fear.",
    extreme:
      "utterly petrified and panicked, as though you’re in immediate and extreme danger",
  },
  depressed: {
    base: "Your tone should be depressed, sounding sad, hopeless, and withdrawn.",
    extreme:
      "profoundly desolate, overwhelmingly sad, and devoid of any hope or energy",
  },
  sad: {
    base: "Your tone should be sad, reflecting sorrow and disappointment.",
    extreme:
      "deeply grief-stricken, sounding as if heartbroken and in great despair",
  },
  happy: {
    base: "Your tone should be happy, bright, and content.",
    extreme: "ecstatically joyful, overflowing with delight and positivity",
  },
  disgust: {
    base: "Your tone should convey disgust, sounding repulsed and displeased.",
    extreme:
      "intensely revolted and appalled, as if you can barely stand what you’re addressing",
  },
  surprise: {
    base: "Your tone should be surprised, sounding taken aback and astonished.",
    extreme:
      "utterly shocked and astonished, as though you can hardly believe what you’re seeing or hearing",
  },
  shameful: {
    base: "Your tone should be shameful, filled with regret and embarrassment.",
    extreme:
      "deeply remorseful and humiliated, as though weighed down by overwhelming guilt",
  },
  love: {
    base: "Your tone should be loving, warm, and affectionate.",
    extreme:
      "overflowing with adoration and devotion, as if every word is an expression of profound love",
  },
  proud: {
    base: "Your tone should be proud, confident, and self-assured.",
    extreme:
      "unabashedly triumphant and self-satisfied, as if basking in undeniable achievement",
  },
};

export function getToneInstruction(tone?: string): string {
  if (!tone) return "";

  // Expected format: "tone" or "tone:scale"
  const [toneName, scaleStr] = tone.split(":");
  const toneKey = toneName.toLowerCase().trim();
  const toneData = toneInstructions[toneKey];

  // If no known tone is found, just return a generic instruction
  if (!toneData) {
    return `Adopt a ${toneName} tone.`;
  }

  // If no scale provided, just return the base instruction
  if (!scaleStr) {
    return toneData.base;
  }

  const scale = parseInt(scaleStr, 10);
  if (isNaN(scale) || scale < 1 || scale > 5) {
    // If scale is invalid, just return the base instruction
    return toneData.base;
  }

  // Valid scale provided
  return `${toneData.base} On a scale of 1 to 5, where 5 is ${toneData.extreme}, adopt intensity level ${scale}.`;
}
