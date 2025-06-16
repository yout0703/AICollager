ALTER TABLE "ac_collages" ADD COLUMN "is_featured" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "credits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "template_id" varchar(100);--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "generated_style" varchar(100);--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "user_preferences" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "parent_collage_id" uuid;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD COLUMN "last_edited_at" timestamp with time zone;