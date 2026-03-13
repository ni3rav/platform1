ALTER TABLE "posts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "deleted_at" timestamp;