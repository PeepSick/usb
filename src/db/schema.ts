import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type AgentTarget =
  | "leosis"
  | "auto"
  | "claude"
  | "hermes"
  | "openai"
  | "anthropic"
  | "langchain"
  | "cursor"
  | "mcp"
  | "generic"
  | "openrouter"
  | "groq"
  | "mistral"
  | "ollama"
  | "lm-studio"
  | "vllm";

export type AdapterFile = {
  path: string;
  kind: "manifest" | "skill" | "rule" | "tool" | "readme";
  description: string;
};

export type AgentAdapter = {
  target: AgentTarget;
  label: string;
  installPath: string;
  commandHint: string;
  capabilities: string[];
  notes: string;
  files: AdapterFile[];
};

export type SkillInput = {
  name: string;
  kind: "text" | "url" | "file" | "selection" | "json";
  required: boolean;
  description: string;
};

export type SkillOutput = {
  name: string;
  kind: "markdown" | "json" | "diff" | "command" | "checklist";
  description: string;
};

export type SkillMetadata = {
  modelAgnostic: boolean;
  agentAgnostic: boolean;
  risk: "low" | "medium" | "high";
  tags: string[];
};

export const skillPacks = pgTable("skill_packs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  author: text("author").notNull(),
  targets: jsonb("targets").$type<AgentTarget[]>().notNull(),
  adapters: jsonb("adapters").$type<AgentAdapter[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id")
    .notNull()
    .references(() => skillPacks.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  triggerPhrase: text("trigger_phrase").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  inputs: jsonb("inputs").$type<SkillInput[]>().notNull(),
  outputs: jsonb("outputs").$type<SkillOutput[]>().notNull(),
  examples: jsonb("examples").$type<string[]>().notNull(),
  metadata: jsonb("metadata").$type<SkillMetadata>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skillInstallations = pgTable("skill_installations", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id")
    .notNull()
    .references(() => skillPacks.id, { onDelete: "cascade" }),
  target: text("target").notNull(),
  command: text("command").notNull(),
  manifest: jsonb("manifest").$type<unknown>().notNull(),
  meta: jsonb("meta").$type<unknown>().notNull(),
  installedAt: timestamp("installed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SkillPack = typeof skillPacks.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type SkillInstallation = typeof skillInstallations.$inferSelect;
