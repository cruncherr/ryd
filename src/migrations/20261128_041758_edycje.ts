import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_edition_status" AS ENUM('open', 'invite', 'announced');
  CREATE TYPE "public"."enum__products_v_version_edition_status" AS ENUM('open', 'invite', 'announced');
  ALTER TYPE "public"."enum_messages_kind" ADD VALUE 'waitlist';
  CREATE TABLE "pieces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"number" numeric NOT NULL,
  	"owner" varchar,
  	"order_id" integer,
  	"note" varchar,
  	"is_test" boolean DEFAULT false,
  	"label" varchar,
  	"token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_functions_product_id_products_id_fk";
  
  DROP INDEX "homepage_functions_functions_product_idx";
  ALTER TABLE "products" ADD COLUMN "edition_size" numeric DEFAULT 50;
  ALTER TABLE "products" ADD COLUMN "edition_code" varchar;
  ALTER TABLE "products" ADD COLUMN "edition_status" "enum_products_edition_status" DEFAULT 'open';
  ALTER TABLE "products" ADD COLUMN "edition_invite_code" varchar;
  ALTER TABLE "products" ADD COLUMN "edition_number_choice" boolean DEFAULT true;
  ALTER TABLE "products" ADD COLUMN "edition_release_date" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_size" numeric DEFAULT 50;
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_code" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_status" "enum__products_v_version_edition_status" DEFAULT 'open';
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_invite_code" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_number_choice" boolean DEFAULT true;
  ALTER TABLE "_products_v" ADD COLUMN "version_edition_release_date" timestamp(3) with time zone;
  ALTER TABLE "orders_items" ADD COLUMN "edition" varchar;
  ALTER TABLE "messages" ADD COLUMN "product_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pieces_id" integer;
  ALTER TABLE "homepage" ADD COLUMN "private_list_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "private_list_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "private_list_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "private_list_note" varchar;
  ALTER TABLE "pieces" ADD CONSTRAINT "pieces_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pieces" ADD CONSTRAINT "pieces_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pieces_product_idx" ON "pieces" USING btree ("product_id");
  CREATE INDEX "pieces_order_idx" ON "pieces" USING btree ("order_id");
  CREATE UNIQUE INDEX "pieces_token_idx" ON "pieces" USING btree ("token");
  CREATE INDEX "pieces_updated_at_idx" ON "pieces" USING btree ("updated_at");
  CREATE INDEX "pieces_created_at_idx" ON "pieces" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_number_idx" ON "pieces" USING btree ("product_id","number");
  ALTER TABLE "messages" ADD CONSTRAINT "messages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pieces_fk" FOREIGN KEY ("pieces_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "messages_product_idx" ON "messages" USING btree ("product_id");
  CREATE INDEX "payload_locked_documents_rels_pieces_id_idx" ON "payload_locked_documents_rels" USING btree ("pieces_id");
  ALTER TABLE "homepage" DROP COLUMN "categories_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "categories_title";
  ALTER TABLE "homepage" DROP COLUMN "categories_text";
  ALTER TABLE "homepage" DROP COLUMN "functions_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "functions_title";
  ALTER TABLE "homepage" DROP COLUMN "functions_text";
  ALTER TABLE "homepage" DROP COLUMN "functions_product_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pieces" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pieces" CASCADE;
  ALTER TABLE "messages" DROP CONSTRAINT "messages_product_id_products_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pieces_fk";
  
  ALTER TABLE "messages" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "messages" ALTER COLUMN "kind" SET DEFAULT 'contact'::text;
  DROP TYPE "public"."enum_messages_kind";
  CREATE TYPE "public"."enum_messages_kind" AS ENUM('contact', 'samples');
  ALTER TABLE "messages" ALTER COLUMN "kind" SET DEFAULT 'contact'::"public"."enum_messages_kind";
  ALTER TABLE "messages" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_messages_kind" USING "kind"::"public"."enum_messages_kind";
  DROP INDEX "messages_product_idx";
  DROP INDEX "payload_locked_documents_rels_pieces_id_idx";
  ALTER TABLE "homepage" ADD COLUMN "categories_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "categories_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "categories_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "functions_eyebrow" varchar;
  ALTER TABLE "homepage" ADD COLUMN "functions_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "functions_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "functions_product_id" integer;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_functions_product_id_products_id_fk" FOREIGN KEY ("functions_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "homepage_functions_functions_product_idx" ON "homepage" USING btree ("functions_product_id");
  ALTER TABLE "products" DROP COLUMN "edition_size";
  ALTER TABLE "products" DROP COLUMN "edition_code";
  ALTER TABLE "products" DROP COLUMN "edition_status";
  ALTER TABLE "products" DROP COLUMN "edition_invite_code";
  ALTER TABLE "products" DROP COLUMN "edition_number_choice";
  ALTER TABLE "products" DROP COLUMN "edition_release_date";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_size";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_code";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_status";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_invite_code";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_number_choice";
  ALTER TABLE "_products_v" DROP COLUMN "version_edition_release_date";
  ALTER TABLE "orders_items" DROP COLUMN "edition";
  ALTER TABLE "messages" DROP COLUMN "product_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pieces_id";
  ALTER TABLE "homepage" DROP COLUMN "private_list_eyebrow";
  ALTER TABLE "homepage" DROP COLUMN "private_list_title";
  ALTER TABLE "homepage" DROP COLUMN "private_list_text";
  ALTER TABLE "homepage" DROP COLUMN "private_list_note";
  DROP TYPE "public"."enum_products_edition_status";
  DROP TYPE "public"."enum__products_v_version_edition_status";`)
}
