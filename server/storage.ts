import { users, type User, type InsertUser, analyses, type Analysis, type InsertAnalysis, batches, type Batch, type InsertBatch, comparisons, type Comparison, type InsertComparison } from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByStatus(status: string): Promise<Analysis[]>;
  updateAnalysis(id: number, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined>;
  getRecentAnalyses(limit?: number): Promise<Analysis[]>;
  getAnalysesByBatch(batchId: string): Promise<Analysis[]>;
  
  // Batch methods
  createBatch(batch: InsertBatch): Promise<Batch>;
  getBatch(id: string): Promise<Batch | undefined>;
  updateBatch(id: string, updates: Partial<InsertBatch>): Promise<Batch | undefined>;
  getRecentBatches(limit?: number): Promise<Batch[]>;
  
  // Comparison methods
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  getComparison(id: string): Promise<Comparison | undefined>;
  updateComparison(id: string, updates: Partial<InsertComparison>): Promise<Comparison | undefined>;
  getRecentComparisons(limit?: number): Promise<Comparison[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis as any) // Type assertion for JSON fields
      .returning();
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async getAnalysesByStatus(status: string): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.status, status));
  }

  async updateAnalysis(id: number, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined> {
    const [updated] = await db
      .update(analyses)
      .set(updates as any) // Type assertion for JSON fields
      .where(eq(analyses.id, id))
      .returning();
    return updated || undefined;
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
  }

  async getAnalysesByBatch(batchId: string): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.batchId, batchId));
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const [batch] = await db
      .insert(batches)
      .values(insertBatch)
      .returning();
    return batch;
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }

  async updateBatch(id: string, updates: Partial<InsertBatch>): Promise<Batch | undefined> {
    const [updated] = await db
      .update(batches)
      .set(updates)
      .where(eq(batches.id, id))
      .returning();
    return updated || undefined;
  }

  async getRecentBatches(limit: number = 10): Promise<Batch[]> {
    return await db
      .select()
      .from(batches)
      .orderBy(desc(batches.createdAt))
      .limit(limit);
  }

  // Comparison methods
  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const [comparison] = await db
      .insert(comparisons)
      .values(insertComparison as any)
      .returning();
    return comparison;
  }

  async getComparison(id: string): Promise<Comparison | undefined> {
    const [comparison] = await db.select().from(comparisons).where(eq(comparisons.id, id));
    return comparison || undefined;
  }

  async updateComparison(id: string, updates: Partial<InsertComparison>): Promise<Comparison | undefined> {
    const [comparison] = await db
      .update(comparisons)
      .set(updates as any)
      .where(eq(comparisons.id, id))
      .returning();
    return comparison || undefined;
  }

  async getRecentComparisons(limit: number = 10): Promise<Comparison[]> {
    return await db
      .select()
      .from(comparisons)
      .orderBy(desc(comparisons.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
