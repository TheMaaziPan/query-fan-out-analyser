import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeWebPage } from "./services/scraper";
import { analyzeQueryFanOut, extractSemanticChunks } from "./services/gemini";
import { z } from "zod";
import { randomUUID } from "crypto";

const analyzeUrlSchema = z.object({
  url: z.string().url("Invalid URL format")
});

const batchAnalyzeSchema = z.object({
  urls: z.array(z.string().url("Invalid URL format")).min(1, "At least one URL is required").max(50, "Maximum 50 URLs allowed"),
  name: z.string().optional()
});

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
