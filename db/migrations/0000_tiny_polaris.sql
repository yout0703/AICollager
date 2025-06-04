CREATE TABLE "ac_ai_analysis_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"cache_type" varchar(50) NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"analysis_result" jsonb NOT NULL,
	"confidence_score" numeric(3, 2),
	"use_count" integer DEFAULT 1 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_ai_analysis_cache_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "ac_ai_analysis_cache_input_hash_unique" UNIQUE("input_hash")
);
--> statement-breakpoint
CREATE TABLE "ac_ai_usage_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"cached_requests" integer DEFAULT 0 NOT NULL,
	"image_analysis_count" integer DEFAULT 0 NOT NULL,
	"layout_suggestion_count" integer DEFAULT 0 NOT NULL,
	"icon_recommendation_count" integer DEFAULT 0 NOT NULL,
	"estimated_cost" numeric(10, 4) DEFAULT '0' NOT NULL,
	"cost_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"avg_response_time" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_processing_time" numeric(15, 2) DEFAULT '0' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_ai_usage_stats_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ac_daily_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"limit_date" date NOT NULL,
	"limit_type" varchar(20) NOT NULL,
	"ai_analysis_count" integer DEFAULT 0 NOT NULL,
	"layout_generation_count" integer DEFAULT 0 NOT NULL,
	"icon_recommendation_count" integer DEFAULT 0 NOT NULL,
	"total_usage_count" integer DEFAULT 0 NOT NULL,
	"max_daily_usage" integer DEFAULT 10 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_daily_limits_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ac_collage_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"collage_id" uuid NOT NULL,
	"image_index" integer NOT NULL,
	"original_url" varchar(500) NOT NULL,
	"processed_url" varchar(500),
	"thumbnail_url" varchar(500),
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"width" integer,
	"height" integer,
	"format" varchar(10),
	"ai_analysis" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_collage_images_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ac_collages" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"title" varchar(255) NOT NULL,
	"description" text,
	"canvas_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"elements" jsonb DEFAULT '[]'::jsonb,
	"preview_url" varchar(500),
	"full_image_url" varchar(500),
	"thumbnail_url" varchar(500),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"generation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"visibility" varchar(20) DEFAULT 'private' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"ai_processing_time" integer,
	"ai_model" varchar(50),
	"ai_cost" numeric(10, 4) DEFAULT '0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "ac_collages_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ac_credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"title" varchar(255),
	"description" text,
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_credit_transactions_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ac_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_id" uuid,
	"invite_code" varchar(20) NOT NULL,
	"email" varchar(255),
	"invitation_method" varchar(20) DEFAULT 'link' NOT NULL,
	"inviter_reward" integer DEFAULT 20 NOT NULL,
	"invitee_reward" integer DEFAULT 20 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"clicked_at" timestamp with time zone,
	"registered_at" timestamp with time zone,
	"reward_given_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ac_invitations_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "ac_invitations_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "ac_icon_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar(100) NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"parent_category_id" varchar(100),
	"description" text,
	"ai_description" text,
	"ai_keywords" text[],
	"display_order" integer DEFAULT 0 NOT NULL,
	"icon_color" varchar(20) DEFAULT '#666666' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"icon_count" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_icon_categories_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "ac_icon_categories_category_id_unique" UNIQUE("category_id")
);
--> statement-breakpoint
CREATE TABLE "ac_icons" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"icon_id" varchar(100) NOT NULL,
	"icon_name" varchar(255) NOT NULL,
	"category_id" varchar(100) NOT NULL,
	"svg_content" text NOT NULL,
	"style" varchar(50) DEFAULT 'outline' NOT NULL,
	"size" varchar(20) DEFAULT '24' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"ai_tags" text[] DEFAULT '{}' NOT NULL,
	"primary_color" varchar(20),
	"secondary_color" varchar(20),
	"color_palette" jsonb DEFAULT '[]'::jsonb,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"popularity_score" integer DEFAULT 0 NOT NULL,
	"quality_score" integer DEFAULT 5 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"moderation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_icons_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "ac_icons_icon_id_unique" UNIQUE("icon_id")
);
--> statement-breakpoint
CREATE TABLE "ac_user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" uuid,
	"trial_usage_count" integer DEFAULT 0 NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ac_user_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "ac_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100),
	"display_name" varchar(255),
	"avatar_url" text,
	"credits" integer DEFAULT 50 NOT NULL,
	"total_earned_credits" integer DEFAULT 50 NOT NULL,
	"total_used_credits" integer DEFAULT 0 NOT NULL,
	"invite_code" varchar(20) NOT NULL,
	"invited_by_code" varchar(20),
	"invited_by_user_id" uuid,
	"daily_ai_usage" integer DEFAULT 0 NOT NULL,
	"last_ai_usage_date" timestamp,
	"total_ai_usage" integer DEFAULT 0 NOT NULL,
	"language" varchar(10) DEFAULT 'zh-CN' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Shanghai' NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ac_users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "ac_users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "ac_users_email_unique" UNIQUE("email"),
	CONSTRAINT "ac_users_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "ac_daily_limits" ADD CONSTRAINT "ac_daily_limits_user_id_ac_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ac_users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_collage_images" ADD CONSTRAINT "ac_collage_images_collage_id_ac_collages_uuid_fk" FOREIGN KEY ("collage_id") REFERENCES "public"."ac_collages"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_collages" ADD CONSTRAINT "ac_collages_user_id_ac_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ac_users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_credit_transactions" ADD CONSTRAINT "ac_credit_transactions_user_id_ac_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ac_users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_invitations" ADD CONSTRAINT "ac_invitations_inviter_id_ac_users_uuid_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."ac_users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_invitations" ADD CONSTRAINT "ac_invitations_invitee_id_ac_users_uuid_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."ac_users"("uuid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_icons" ADD CONSTRAINT "ac_icons_category_id_ac_icon_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ac_icon_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_user_sessions" ADD CONSTRAINT "ac_user_sessions_user_id_ac_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ac_users"("uuid") ON DELETE cascade ON UPDATE no action;