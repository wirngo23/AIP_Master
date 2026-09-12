import { index, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const studies = sqliteTable(
  "studies",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    title: text("title").notNull(),
    settings: text("settings").notNull(),
    photoKey: text("photo_key"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("studies_owner_date").on(t.owner, t.createdAt)],
);
export const consultations = sqliteTable(
  "consultations",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    studyId: text("study_id").references(() => studies.id, {
      onDelete: "set null",
    }),
    goal: text("goal").notNull(),
    followup: integer("followup").notNull(),
    status: text("status").notNull().default("draft"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("consultations_owner_date").on(t.owner, t.createdAt),
    index("consultations_study").on(t.studyId),
  ],
);
export const clinics = sqliteTable("clinics", {
  owner: text("owner").primaryKey(),
  config: text("config").notNull(),
});
