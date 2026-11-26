import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_default_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__products_v_version_default_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_fabrics_features" AS ENUM('easy_clean', 'water_repellent', 'pet_friendly', 'durable', 'soft');
  CREATE TYPE "public"."enum_fabrics_type" AS ENUM('velvet', 'boucle', 'chenille', 'corduroy', 'weave', 'leather');
  CREATE TYPE "public"."enum_messages_kind" AS ENUM('contact', 'samples');
  CREATE TABLE "products_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price_delta" numeric DEFAULT 0,
  	"width" numeric,
  	"depth" numeric,
  	"height" numeric,
  	"sleep_width" numeric,
  	"sleep_length" numeric,
  	"body_depth" numeric,
  	"chaise_width" numeric
  );
  
  CREATE TABLE "products_legs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"swatch_color" varchar DEFAULT '#1C1A18',
  	"price_delta" numeric DEFAULT 0
  );
  
  CREATE TABLE "_products_v_version_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price_delta" numeric DEFAULT 0,
  	"width" numeric,
  	"depth" numeric,
  	"height" numeric,
  	"sleep_width" numeric,
  	"sleep_length" numeric,
  	"body_depth" numeric,
  	"chaise_width" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_legs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"swatch_color" varchar DEFAULT '#1C1A18',
  	"price_delta" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "fabrics_features" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_fabrics_features",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "fabrics_colors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar,
  	"swatch_color" varchar DEFAULT '#8A8580' NOT NULL,
  	"available" boolean DEFAULT true,
  	"image_id" integer
  );
  
  CREATE TABLE "fabrics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_fabrics_type" DEFAULT 'velvet' NOT NULL,
  	"surcharge_percent" numeric DEFAULT 0 NOT NULL,
  	"description" varchar,
  	"composition" varchar,
  	"martindale" numeric,
  	"active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 10,
  	"sample_data" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items_configuration" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "settings" ALTER COLUMN "store_name" SET DEFAULT 'VELURO';
  ALTER TABLE "settings" ALTER COLUMN "orders_prefix" SET DEFAULT 'VEL';
  ALTER TABLE "products_variants" ADD COLUMN "fabric_link_id" integer;
  ALTER TABLE "products" ADD COLUMN "side_choice" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "default_side" "enum_products_default_side" DEFAULT 'right';
  ALTER TABLE "products_rels" ADD COLUMN "fabrics_id" integer;
  ALTER TABLE "_products_v_version_variants" ADD COLUMN "fabric_link_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_side_choice" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_default_side" "enum__products_v_version_default_side" DEFAULT 'right';
  ALTER TABLE "_products_v_rels" ADD COLUMN "fabrics_id" integer;
  ALTER TABLE "messages" ADD COLUMN "kind" "enum_messages_kind" DEFAULT 'contact' NOT NULL;
  ALTER TABLE "messages" ADD COLUMN "samples" varchar;
  ALTER TABLE "messages" ADD COLUMN "address" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fabrics_id" integer;
  ALTER TABLE "homepage" ADD COLUMN "categories_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "categories_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "categories_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "steps_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "steps_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "steps_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "fabrics_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "fabrics_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "fabrics_text" varchar;
  ALTER TABLE "settings" ADD COLUMN "samples_enabled" boolean DEFAULT true;
  ALTER TABLE "settings" ADD COLUMN "samples_max" numeric DEFAULT 6;
  ALTER TABLE "settings" ADD COLUMN "samples_note" varchar DEFAULT 'Próbki wysyłamy bezpłatnie listem — zwykle w ciągu 2–3 dni roboczych.';
  ALTER TABLE "products_sizes" ADD CONSTRAINT "products_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_legs" ADD CONSTRAINT "products_legs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_sizes" ADD CONSTRAINT "_products_v_version_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_legs" ADD CONSTRAINT "_products_v_version_legs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fabrics_features" ADD CONSTRAINT "fabrics_features_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fabrics_colors" ADD CONSTRAINT "fabrics_colors_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fabrics_colors" ADD CONSTRAINT "fabrics_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_steps_items" ADD CONSTRAINT "homepage_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_sizes_order_idx" ON "products_sizes" USING btree ("_order");
  CREATE INDEX "products_sizes_parent_id_idx" ON "products_sizes" USING btree ("_parent_id");
  CREATE INDEX "products_legs_order_idx" ON "products_legs" USING btree ("_order");
  CREATE INDEX "products_legs_parent_id_idx" ON "products_legs" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_sizes_order_idx" ON "_products_v_version_sizes" USING btree ("_order");
  CREATE INDEX "_products_v_version_sizes_parent_id_idx" ON "_products_v_version_sizes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_legs_order_idx" ON "_products_v_version_legs" USING btree ("_order");
  CREATE INDEX "_products_v_version_legs_parent_id_idx" ON "_products_v_version_legs" USING btree ("_parent_id");
  CREATE INDEX "fabrics_features_order_idx" ON "fabrics_features" USING btree ("order");
  CREATE INDEX "fabrics_features_parent_idx" ON "fabrics_features" USING btree ("parent_id");
  CREATE INDEX "fabrics_colors_order_idx" ON "fabrics_colors" USING btree ("_order");
  CREATE INDEX "fabrics_colors_parent_id_idx" ON "fabrics_colors" USING btree ("_parent_id");
  CREATE INDEX "fabrics_colors_image_idx" ON "fabrics_colors" USING btree ("image_id");
  CREATE INDEX "fabrics_updated_at_idx" ON "fabrics" USING btree ("updated_at");
  CREATE INDEX "fabrics_created_at_idx" ON "fabrics" USING btree ("created_at");
  CREATE INDEX "orders_items_configuration_order_idx" ON "orders_items_configuration" USING btree ("_order");
  CREATE INDEX "orders_items_configuration_parent_id_idx" ON "orders_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "homepage_steps_items_order_idx" ON "homepage_steps_items" USING btree ("_order");
  CREATE INDEX "homepage_steps_items_parent_id_idx" ON "homepage_steps_items" USING btree ("_parent_id");
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_fabric_link_id_fabrics_id_fk" FOREIGN KEY ("fabric_link_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_fabrics_fk" FOREIGN KEY ("fabrics_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_variants" ADD CONSTRAINT "_products_v_version_variants_fabric_link_id_fabrics_id_fk" FOREIGN KEY ("fabric_link_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_fabrics_fk" FOREIGN KEY ("fabrics_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fabrics_fk" FOREIGN KEY ("fabrics_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_variants_fabric_link_idx" ON "products_variants" USING btree ("fabric_link_id");
  CREATE INDEX "products_rels_fabrics_id_idx" ON "products_rels" USING btree ("fabrics_id");
  CREATE INDEX "_products_v_version_variants_fabric_link_idx" ON "_products_v_version_variants" USING btree ("fabric_link_id");
  CREATE INDEX "_products_v_rels_fabrics_id_idx" ON "_products_v_rels" USING btree ("fabrics_id");
  CREATE INDEX "payload_locked_documents_rels_fabrics_id_idx" ON "payload_locked_documents_rels" USING btree ("fabrics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_sizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_legs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_sizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_legs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fabrics_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fabrics_colors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fabrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items_configuration" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_steps_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_sizes" CASCADE;
  DROP TABLE "products_legs" CASCADE;
  DROP TABLE "_products_v_version_sizes" CASCADE;
  DROP TABLE "_products_v_version_legs" CASCADE;
  DROP TABLE "fabrics_features" CASCADE;
  DROP TABLE "fabrics_colors" CASCADE;
  DROP TABLE "fabrics" CASCADE;
  DROP TABLE "orders_items_configuration" CASCADE;
  DROP TABLE "homepage_steps_items" CASCADE;
  ALTER TABLE "products_variants" DROP CONSTRAINT "products_variants_fabric_link_id_fabrics_id_fk";
  
  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_fabrics_fk";
  
  ALTER TABLE "_products_v_version_variants" DROP CONSTRAINT "_products_v_version_variants_fabric_link_id_fabrics_id_fk";
  
  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_fabrics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_fabrics_fk";
  
  DROP INDEX "products_variants_fabric_link_idx";
  DROP INDEX "products_rels_fabrics_id_idx";
  DROP INDEX "_products_v_version_variants_fabric_link_idx";
  DROP INDEX "_products_v_rels_fabrics_id_idx";
  DROP INDEX "payload_locked_documents_rels_fabrics_id_idx";
  ALTER TABLE "settings" ALTER COLUMN "store_name" SET DEFAULT 'RYD';
  ALTER TABLE "settings" ALTER COLUMN "orders_prefix" SET DEFAULT 'RYD';
  ALTER TABLE "products_variants" DROP COLUMN "fabric_link_id";
  ALTER TABLE "products" DROP COLUMN "side_choice";
  ALTER TABLE "products" DROP COLUMN "default_side";
  ALTER TABLE "products_rels" DROP COLUMN "fabrics_id";
  ALTER TABLE "_products_v_version_variants" DROP COLUMN "fabric_link_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_side_choice";
  ALTER TABLE "_products_v" DROP COLUMN "version_default_side";
  ALTER TABLE "_products_v_rels" DROP COLUMN "fabrics_id";
  ALTER TABLE "messages" DROP COLUMN "kind";
  ALTER TABLE "messages" DROP COLUMN "samples";
  ALTER TABLE "messages" DROP COLUMN "address";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "fabrics_id";
  ALTER TABLE "homepage" DROP COLUMN "categories_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "categories_title";
  ALTER TABLE "homepage" DROP COLUMN "categories_text";
  ALTER TABLE "homepage" DROP COLUMN "steps_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "steps_title";
  ALTER TABLE "homepage" DROP COLUMN "steps_text";
  ALTER TABLE "homepage" DROP COLUMN "fabrics_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "fabrics_title";
  ALTER TABLE "homepage" DROP COLUMN "fabrics_text";
  ALTER TABLE "settings" DROP COLUMN "samples_enabled";
  ALTER TABLE "settings" DROP COLUMN "samples_max";
  ALTER TABLE "settings" DROP COLUMN "samples_note";
  DROP TYPE "public"."enum_products_default_side";
  DROP TYPE "public"."enum__products_v_version_default_side";
  DROP TYPE "public"."enum_fabrics_features";
  DROP TYPE "public"."enum_fabrics_type";
  DROP TYPE "public"."enum_messages_kind";`)
}
