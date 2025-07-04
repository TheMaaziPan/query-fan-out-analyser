import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeWebPage } from "./services/scraper";
import { analyzeQueryFanOut, extractSemanticChunks } from "./services/gemini";
import { performComparisonAnalysis, generateComparisonSummary } from "./services/comparison";
import { z } from "zod";
import { randomUUID } from "crypto";

const analyzeUrlSchema = z.object({
  url: z.string().url("Invalid URL format")
});

const batchAnalyzeSchema = z.object({
  urls: z.array(z.string().url("Invalid URL format")).min(1, "At least one URL is required").max(50, "Maximum 50 URLs allowed"),
  name: z.string().optional()
});

const comparisonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  urls: z.array(z.string().url("Invalid URL format")).min(2, "At least two URLs are required for comparison").max(10, "Maximum 10 URLs allowed for comparison")
});

async function processComparison(comparisonId: string, analysisIds: number[], urls: string[]): Promise<void> {
  try {
    await storage.updateComparison(comparisonId, { status: "processing" });
    
    // Process all analyses
    for (let i = 0; i < analysisIds.length; i++) {
      const analysisId = analysisIds[i];
      const url = urls[i];
      
      try {
        await performAnalysis(analysisId, url);
      } catch (error) {
        console.error(`Analysis ${analysisId} for comparison ${comparisonId} failed:`, error);
        await storage.updateAnalysis(analysisId, { status: "failed" });
      }
    }
    
    // Update comparison status to completed
    await storage.updateComparison(comparisonId, { status: "completed" });
    
  } catch (error) {
    console.error(`Comparison ${comparisonId} processing failed:`, error);
    await storage.updateComparison(comparisonId, { status: "failed" });
  }
}

async function processBatch(batchId: string, analysisIds: number[]): Promise<void> {
  try {
    await storage.updateBatch(batchId, { status: "processing" });
    
    // Process analyses with limited concurrency to avoid overwhelming the API
    const concurrencyLimit = 3;
    let completedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < analysisIds.length; i += concurrencyLimit) {
      const batch = analysisIds.slice(i, i + concurrencyLimit);
      
      const promises = batch.map(async (analysisId) => {
        try {
          const analysis = await storage.getAnalysis(analysisId);
          if (!analysis) throw new Error("Analysis not found");
          
          await performAnalysis(analysisId, analysis.url);
          completedCount++;
        } catch (error) {
          console.error(`Analysis ${analysisId} failed:`, error);
          failedCount++;
          await storage.updateAnalysis(analysisId, { status: "failed" });
        }
      });
      
      await Promise.all(promises);
      
      // Update batch progress
      await storage.updateBatch(batchId, {
        completedUrls: completedCount,
        failedUrls: failedCount
      });
    }
    
    // Mark batch as completed
    await storage.updateBatch(batchId, { 
      status: "completed",
      completedUrls: completedCount,
      failedUrls: failedCount
    });
    
  } catch (error) {
    console.error(`Batch ${batchId} processing failed:`, error);
    await storage.updateBatch(batchId, { status: "failed" });
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Start analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = analyzeUrlSchema.parse(req.body);
      
      // Create analysis record
      const analysis = await storage.createAnalysis({
        url,
        status: "pending"
      });
      
      // Start analysis process (don't await - run in background)
      performAnalysis(analysis.id, url).catch(error => {
        console.error(`Analysis ${analysis.id} failed:`, error);
        storage.updateAnalysis(analysis.id, { 
          status: "failed"
        });
      });
      
      res.json({ 
        id: analysis.id, 
        status: "pending",
        message: "Analysis started successfully" 
      });
      
    } catch (error) {
      console.error("Analysis start error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to start analysis" 
      });
    }
  });
  
  // Get analysis results
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }
      
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      res.json(analysis);
      
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve analysis" 
      });
    }
  });

  // Start batch analysis endpoint
  app.post("/api/analyze/batch", async (req, res) => {
    try {
      const { urls, name } = batchAnalyzeSchema.parse(req.body);
      
      // Create batch record
      const batchId = randomUUID();
      const batchName = name || `Batch Analysis ${new Date().toLocaleDateString()}`;
      
      const batch = await storage.createBatch({
        id: batchId,
        name: batchName,
        totalUrls: urls.length,
        status: "pending"
      });
      
      // Create individual analysis records for each URL
      const analysisPromises = urls.map(url => 
        storage.createAnalysis({
          url,
          batchId,
          status: "pending"
        })
      );
      
      const analyses = await Promise.all(analysisPromises);
      
      // Start batch processing (don't await - run in background)
      processBatch(batchId, analyses.map(a => a.id)).catch((error: any) => {
        console.error(`Batch ${batchId} failed:`, error);
        storage.updateBatch(batchId, { status: "failed" });
      });
      
      res.json({ 
        id: batchId,
        name: batchName,
        totalUrls: urls.length,
        status: "pending",
        message: "Batch analysis started successfully" 
      });
      
    } catch (error) {
      console.error("Batch analysis start error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to start batch analysis" 
      });
    }
  });
  
  // Get recent analyses
  app.get("/api/analyses/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Get recent analyses error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve recent analyses" 
      });
    }
  });

  // Get batch status and results
  app.get("/api/batch/:id", async (req, res) => {
    try {
      const batchId = req.params.id;
      
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      
      const analyses = await storage.getAnalysesByBatch(batchId);
      
      res.json({
        ...batch,
        analyses
      });
      
    } catch (error) {
      console.error("Get batch error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve batch" 
      });
    }
  });
  
  // Get recent batches
  app.get("/api/batches/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const batches = await storage.getRecentBatches(limit);
      res.json(batches);
    } catch (error) {
      console.error("Get recent batches error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve recent batches" 
      });
    }
  });

  // Create comparison analysis
  app.post("/api/compare", async (req, res) => {
    try {
      const validatedData = comparisonSchema.parse(req.body);
      const comparisonId = randomUUID();
      
      // Create analyses for each URL first
      const analysisPromises = validatedData.urls.map(async (url) => {
        const analysis = await storage.createAnalysis({
          url,
          status: "pending"
        });
        return analysis.id;
      });
      
      const analysisIds = await Promise.all(analysisPromises);
      
      // Create comparison record
      const comparison = await storage.createComparison({
        id: comparisonId,
        name: validatedData.name,
        description: validatedData.description,
        analysisIds,
        status: "pending"
      });
      
      // Start processing analyses in background
      processComparison(comparisonId, analysisIds, validatedData.urls);
      
      res.json({
        id: comparison.id,
        name: comparison.name,
        description: comparison.description,
        status: comparison.status,
        totalUrls: validatedData.urls.length
      });
      
    } catch (error) {
      console.error("Create comparison error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Failed to create comparison" 
      });
    }
  });

  // Get comparison by ID
  app.get("/api/comparison/:id", async (req, res) => {
    try {
      const comparisonId = req.params.id;
      const comparison = await storage.getComparison(comparisonId);
      
      if (!comparison) {
        return res.status(404).json({ error: "Comparison not found" });
      }
      
      // Get all analyses for this comparison
      const analyses = await Promise.all(
        comparison.analysisIds.map(id => storage.getAnalysis(id))
      );
      
      const validAnalyses = analyses.filter((analysis): analysis is NonNullable<typeof analysis> => Boolean(analysis));
      
      // If all analyses are completed, generate comparison data
      let comparisonData = undefined;
      if (validAnalyses.every(analysis => analysis?.status === "completed")) {
        try {
          comparisonData = performComparisonAnalysis(validAnalyses);
        } catch (error) {
          console.error("Comparison analysis error:", error);
        }
      }
      
      res.json({
        ...comparison,
        analyses: validAnalyses,
        comparisonData
      });
      
    } catch (error) {
      console.error("Get comparison error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve comparison" 
      });
    }
  });

  // Get recent comparisons
  app.get("/api/comparisons/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const comparisons = await storage.getRecentComparisons(limit);
      res.json(comparisons);
    } catch (error) {
      console.error("Get recent comparisons error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve recent comparisons" 
      });
    }
  });
  
  // Export analysis results
  app.get("/api/analysis/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }
      
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      const format = req.query.format as string || 'json';
      
      if (format === 'csv') {
        // Generate CSV
        let csv = 'Query,Description,Coverage\n';
        analysis.queries?.forEach(query => {
          csv += `"${query.query}","${query.description}","${query.coverage}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analysis-${id}.csv"`);
        res.send(csv);
      } else {
        // JSON export
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analysis-${id}.json"`);
        res.json(analysis);
      }
      
    } catch (error) {
      console.error("Export analysis error:", error);
      res.status(500).json({ 
        error: "Failed to export analysis" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function performAnalysis(analysisId: number, url: string): Promise<void> {
  try {
    // Step 1: Scrape the webpage
    await storage.updateAnalysis(analysisId, { status: "scraping" });
    const scrapedContent = await scrapeWebPage(url);
    
    // Step 2: Extract semantic chunks
    await storage.updateAnalysis(analysisId, { status: "chunking" });
    const semanticChunks = extractSemanticChunks(scrapedContent.content, scrapedContent.title);
    
    // Step 3: Analyze with Gemini AI
    await storage.updateAnalysis(analysisId, { status: "analyzing" });
    const analysisResult = await analyzeQueryFanOut(
      scrapedContent.title,
      scrapedContent.content,
      semanticChunks
    );
    
    // Step 4: Save results
    await storage.updateAnalysis(analysisId, {
      title: scrapedContent.title,
      primaryEntity: analysisResult.primaryEntity,
      semanticChunks: semanticChunks.length,
      queryCoverage: `${analysisResult.queries.filter(q => q.coverage === "Yes").length}/${analysisResult.queries.length}`,
      coverageScore: Math.round(analysisResult.coverageScore),
      queries: analysisResult.queries,
      recommendations: analysisResult.recommendations,
      semanticChunksData: analysisResult.semanticChunks,
      status: "completed"
    });
    
  } catch (error) {
    console.error(`Analysis ${analysisId} failed:`, error);
    await storage.updateAnalysis(analysisId, { 
      status: "failed"
    });
    throw error;
  }
}
