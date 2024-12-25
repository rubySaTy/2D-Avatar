ALTER TABLE "avatar" RENAME COLUMN "elevenlabs_voice_id" TO "elevenlabs_cloned_voice_id";--> statement-breakpoint
ALTER TABLE "meeting_session" ALTER COLUMN "cipher_key" SET NOT NULL;