ALTER TABLE "branding_settings" ADD COLUMN "open_graph_image_id" varchar;--> statement-breakpoint
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_open_graph_image_id_media_id_fk" FOREIGN KEY ("open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
