import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212170327 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "delivery_schedule" ("id" text not null, "customer_id" text not null, "order_id" text null, "requested_date" text not null, "confirmed_date" text null, "status" text not null default 'requested', "admin_note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_schedule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_schedule_deleted_at" ON "delivery_schedule" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "delivery_schedule" cascade;`);
  }

}
