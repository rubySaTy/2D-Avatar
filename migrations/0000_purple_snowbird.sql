CREATE TABLE IF NOT EXISTS "avatar" (
	"id" serial PRIMARY KEY NOT NULL,
	"avatar_name" varchar(50) NOT NULL,
	"image_url" text NOT NULL,
	"idle_video_url" text,
	"elevenlabs_voice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"avatar_id" serial NOT NULL,
	"meeting_link" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"did_stream_id" text,
	"did_session_id" text,
	"offer" jsonb,
	"ice_servers" jsonb,
	CONSTRAINT "meeting_session_meeting_link_unique" UNIQUE("meeting_link")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_avatars" (
	"user_id" text NOT NULL,
	"avatar_id" integer NOT NULL,
	CONSTRAINT "users_to_avatars_user_id_avatar_id_pk" PRIMARY KEY("user_id","avatar_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_avatars" ADD CONSTRAINT "users_to_avatars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_avatars" ADD CONSTRAINT "users_to_avatars_avatar_id_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatar"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
