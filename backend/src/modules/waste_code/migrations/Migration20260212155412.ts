import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212155412 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "waste_code" ("id" text not null, "avv_number" text not null, "title" text not null, "category" text not null, "is_hazardous" boolean not null default false, "requires_trgs519" boolean not null default false, "description" text null, "warning_text" text null, "requires_gewabfv_declaration" boolean not null default false, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "waste_code_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_waste_code_deleted_at" ON "waste_code" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "waste_code" cascade;`);
  }

}
