CREATE TABLE IF NOT EXISTS "talk" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_session_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_session" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_session" ALTER COLUMN "avatar_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talk" ADD CONSTRAINT "talk_meeting_session_id_meeting_session_id_fk" FOREIGN KEY ("meeting_session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
