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
  status: text("status").notNull().default("pending"), // pending, scraping, chunking, analyzing, completed, failed
  batchId: text("batch_id"), // For grouping batch analyses
  createdAt: timestamp("created_at").defaultNow(),
});

export const batches = pgTable("batches", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  totalUrls: integer("total_urls").notNull(),
  completedUrls: integer("completed_urls").notNull().default(0),
  failedUrls: integer("failed_urls").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const comparisons = pgTable("comparisons", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  description: text("description"),
  analysisIds: jsonb("analysis_ids").$type<number[]>().notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
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

export const insertBatchSchema = createInsertSchema(batches).omit({
  createdAt: true,
});

export const insertComparisonSchema = createInsertSchema(comparisons).omit({
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Comparison = typeof comparisons.$inferSelect;
export type InsertComparison = z.infer<typeof insertComparisonSchema>;

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
  title?: string | null;
  primaryEntity?: string | null;
  semanticChunks?: number | null;
  queryCoverage?: string | null;
  coverageScore?: number | null;
  queries?: QueryResult[] | null;
  recommendations?: string[] | null;
  semanticChunksData?: SemanticChunk[] | null;
  status: string;
  batchId?: string | null;
  createdAt?: Date | null;
}

export interface BatchAnalysisRequest {
  urls: string[];
  name?: string;
}

export interface BatchResponse {
  id: string;
  name: string;
  totalUrls: number;
  completedUrls: number;
  failedUrls: number;
  status: string;
  createdAt?: Date;
  analyses?: AnalysisResponse[];
}

export interface ComparisonRequest {
  name: string;
  description?: string;
  urls: string[];
}

export interface ComparisonResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: Date;
  analyses?: AnalysisResponse[];
  comparisonData?: {
    topQueries: Array<{
      query: string;
      coverage: Array<{
        url: string;
        hasContent: boolean;
        coverageLevel: "Yes" | "Partial" | "No";
      }>;
    }>;
    coverageGaps: Array<{
      query: string;
      missingFrom: string[];
    }>;
    strengths: Array<{
      url: string;
      uniqueQueries: string[];
    }>;
  };
}
