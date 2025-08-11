CREATE TABLE "branding_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text DEFAULT 'dt.visuals' NOT NULL,
	"show_company_text" boolean DEFAULT true NOT NULL,
	"logo_light_image_id" varchar,
	"logo_dark_image_id" varchar,
	"favicon_image_id" varchar,
	"updated_by" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_logo_light_image_id_media_id_fk" FOREIGN KEY ("logo_light_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_logo_dark_image_id_media_id_fk" FOREIGN KEY ("logo_dark_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_favicon_image_id_media_id_fk" FOREIGN KEY ("favicon_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;