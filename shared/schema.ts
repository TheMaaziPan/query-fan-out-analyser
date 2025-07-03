import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  primaryEntity: text("primary_entity"),
  semanticChunks: integer("semantic_chunks"),
  queryCoverage: text("query_coverage"), // "7/10" format
  coverageScore: integer("coverage_score"), // 0-10
  queries: jsonb("queries").$type<QueryResult[]>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  semanticChunksData: jsonb("semantic_chunks_data").$type<SemanticChunk[]>(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

// Analysis data types
export interface QueryResult {
  query: string;
  description: string;
  coverage: "Yes" | "Partial" | "No";
}

export interface SemanticChunk {
  type: "primary_topic" | "section" | "heading";
  content: string;
  heading?: string;
  length: number;
  queryPotential: "High" | "Medium" | "Low";
}

export interface AnalysisRequest {
  url: string;
}

export interface AnalysisResponse {
  id: number;
  url: string;
  title?: string;
  primaryEntity?: string;
  semanticChunks?: number;
  queryCoverage?: string;
  coverageScore?: number;
  queries?: QueryResult[];
  recommendations?: string[];
  semanticChunksData?: SemanticChunk[];
  status: string;
  createdAt?: Date;
}
