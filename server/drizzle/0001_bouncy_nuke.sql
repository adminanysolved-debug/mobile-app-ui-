CREATE TYPE "public"."vendor_tier" AS ENUM('basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TABLE "active_ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"target_url" text,
	"type" text DEFAULT 'image',
	"is_active" boolean DEFAULT true,
	"target_screens" text DEFAULT '*',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"role" varchar DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "market_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"market_item_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_premium" boolean DEFAULT false,
	"price" integer DEFAULT 0,
	"colors" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "market_items" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "market_items" ADD COLUMN "duration_unit" "duration_unit";--> statement-breakpoint
ALTER TABLE "market_items" ADD COLUMN "recurrence" "recurrence";--> statement-breakpoint
ALTER TABLE "market_items" ADD COLUMN "how_to_achieve" text;--> statement-breakpoint
ALTER TABLE "market_items" ADD COLUMN "is_premium" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_type" varchar;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_data" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vendor_tier" "vendor_tier" DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_introductory_applied" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_personal_dreams" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_team_dreams" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_challenge_dreams" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_vendor_dreams" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "commission_rate" integer DEFAULT 20;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_market_item_id_market_items_id_fk" FOREIGN KEY ("market_item_id") REFERENCES "public"."market_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;