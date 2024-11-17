ALTER TABLE "meeting_session" DROP CONSTRAINT "meeting_session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_session" DROP CONSTRAINT "meeting_session_avatar_id_avatar_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_avatars" DROP CONSTRAINT "users_to_avatars_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_avatars" DROP CONSTRAINT "users_to_avatars_avatar_id_avatar_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_session" ALTER COLUMN "avatar_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "meeting_session" ALTER COLUMN "avatar_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_avatars" ADD CONSTRAINT "users_to_avatars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_avatars" ADD CONSTRAINT "users_to_avatars_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
