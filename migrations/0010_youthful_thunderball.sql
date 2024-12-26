ALTER TABLE "avatar" ADD COLUMN "uploader_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "avatar" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;