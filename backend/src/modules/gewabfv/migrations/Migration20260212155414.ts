import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212155414 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "gewabfv_declaration" ("id" text not null, "order_id" text null, "customer_id" text not null, "delivery_location_id" text not null, "avv_number" text not null, "is_separated" boolean not null default false, "justification_type" text null, "justification_text" text null, "signed_at" timestamptz null, "year" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gewabfv_declaration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gewabfv_declaration_deleted_at" ON "gewabfv_declaration" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gewabfv_declaration" cascade;`);
  }

}
