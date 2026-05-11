import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212155406 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "delivery_location" ("id" text not null, "customer_id" text not null, "name" text not null, "street" text not null, "zip_code" text not null, "city" text not null, "contact_person" text null, "contact_phone" text null, "notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_location_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_location_deleted_at" ON "delivery_location" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "delivery_location" cascade;`);
  }

}
