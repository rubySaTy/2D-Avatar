CREATE TABLE IF NOT EXISTS "avatars" (
	"avatar_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"avatar_name" varchar(50) NOT NULL,
	"image_url" text NOT NULL,
	"voice_sample_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"avatar_id" integer,
	"meeting_link" varchar(255) NOT NULL,
	"emotional_tone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "sessions_meeting_link_unique" UNIQUE("meeting_link")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_avatar_id_avatars_avatar_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatars"("avatar_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
