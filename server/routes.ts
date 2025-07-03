import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeWebPage } from "./services/scraper";
import { analyzeQueryFanOut, extractSemanticChunks } from "./services/gemini";
import { z } from "zod";

const analyzeUrlSchema = z.object({
  url: z.string().url("Invalid URL format")
});

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
      coverageScore: Math.round(analysisResult.coverageScore), // Ensure integer
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
