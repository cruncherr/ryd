import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_fabrics_features" ADD VALUE 'fire_retardant';
  ALTER TYPE "public"."enum_fabrics_features" ADD VALUE 'oeko_tex';
  ALTER TYPE "public"."enum_fabrics_features" ADD VALUE 'recycled';
  ALTER TABLE "fabrics_colors" ADD COLUMN "photo_id" integer;
  ALTER TABLE "fabrics" ADD COLUMN "supplier" varchar;
  ALTER TABLE "fabrics" ADD COLUMN "weight" varchar;
  ALTER TABLE "fabrics" ADD COLUMN "datasheet_url" varchar;
  ALTER TABLE "fabrics_colors" ADD CONSTRAINT "fabrics_colors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "fabrics_colors_photo_idx" ON "fabrics_colors" USING btree ("photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fabrics_colors" DROP CONSTRAINT "fabrics_colors_photo_id_media_id_fk";
  
  ALTER TABLE "fabrics_features" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_fabrics_features";
  CREATE TYPE "public"."enum_fabrics_features" AS ENUM('easy_clean', 'water_repellent', 'pet_friendly', 'durable', 'soft');
  ALTER TABLE "fabrics_features" ALTER COLUMN "value" SET DATA TYPE "public"."enum_fabrics_features" USING "value"::"public"."enum_fabrics_features";
  DROP INDEX "fabrics_colors_photo_idx";
  ALTER TABLE "fabrics_colors" DROP COLUMN "photo_id";
  ALTER TABLE "fabrics" DROP COLUMN "supplier";
  ALTER TABLE "fabrics" DROP COLUMN "weight";
  ALTER TABLE "fabrics" DROP COLUMN "datasheet_url";`)
}
