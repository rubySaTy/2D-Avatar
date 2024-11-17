ALTER TABLE "meeting_session" DROP CONSTRAINT "meeting_session_avatar_id_avatar_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_avatars" DROP CONSTRAINT "users_to_avatars_avatar_id_avatar_id_fk";
--> statement-breakpoint
ALTER TABLE "avatar" ADD COLUMN "image_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "avatar" ADD COLUMN "idle_video_key" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_avatars" ADD CONSTRAINT "users_to_avatars_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
