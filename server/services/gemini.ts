import { GoogleGenAI } from "@google/genai";
import type { QueryResult, SemanticChunk } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface QueryFanOutResult {
  primaryEntity: string;
  queries: QueryResult[];
  recommendations: string[];
  semanticChunks: SemanticChunk[];
  coverageScore: number;
}

export async function analyseQueryFanOut(
  title: string,
  content: string,
  semanticChunks: SemanticChunk[]
): Promise<QueryFanOutResult> {
  try {
    const systemPrompt = `You are a Query Fan-Out Analysis expert that analyses web content to predict how Google's AI Mode breaks down content into sub-queries.

Your task is to:
1. Identify the primary entity/topic
2. Generate 8-10 sub-queries that Google's AI would likely create from this content
3. Score each query's coverage in the content (Yes/Partial/No)
4. Provide optimisation recommendations
5. Calculate an overall coverage score (0-10)

Analyse the content like Google's AI Mode would - looking for comprehensive answers across related sub-topics.

Respond with JSON in this exact format:
{
  "primaryEntity": "string - the main ontological topic",
  "queries": [
    {
      "query": "string - the sub-query",
      "description": "string - brief explanation of what this query seeks",
      "coverage": "Yes|Partial|No"
    }
  ],
  "recommendations": [
    "string - specific optimization recommendations"
  ],
  "coverageScore": number
}`;

    const analysisPrompt = `
TITLE: ${title}

CONTENT PREVIEW: ${content.substring(0, 2000)}

SEMANTIC CHUNKS DETECTED: ${semanticChunks.length}
${semanticChunks.map(chunk => `- ${chunk.type}: ${chunk.content.substring(0, 100)}...`).join('\n')}

Analyse this content for query fan-out patterns and provide the structured response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            primaryEntity: { type: "string" },
            queries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  description: { type: "string" },
                  coverage: { type: "string", enum: ["Yes", "Partial", "No"] }
                },
                required: ["query", "description", "coverage"]
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            coverageScore: { type: "number" }
          },
          required: ["primaryEntity", "queries", "recommendations", "coverageScore"]
        }
      },
      contents: analysisPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini AI");
    }

    const result = JSON.parse(rawJson);
    
    return {
      primaryEntity: result.primaryEntity,
      queries: result.queries,
      recommendations: result.recommendations,
      semanticChunks,
      coverageScore: Math.min(10, Math.max(0, result.coverageScore))
    };

  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error(`Failed to analyse content with Gemini AI: ${error}`);
  }
}

export function extractSemanticChunks(content: string, title: string): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  
  // Add primary topic chunk
  if (title) {
    chunks.push({
      type: "primary_topic",
      content: title,
      length: title.length,
      queryPotential: "High"
    });
  }

  // Simple text-based chunking (in a real implementation, this would be more sophisticated)
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  
  paragraphs.forEach(paragraph => {
    const trimmed = paragraph.trim();
    if (trimmed.length > 100) {
      // Check if it looks like a heading
      const isHeading = trimmed.length < 200 && 
        (trimmed.includes('How to') || trimmed.includes('What is') || 
         trimmed.includes('Why') || trimmed.endsWith(':'));
      
      chunks.push({
        type: isHeading ? "heading" : "section",
        content: trimmed.substring(0, 500),
        length: trimmed.length,
        queryPotential: trimmed.length > 300 ? "High" : trimmed.length > 150 ? "Medium" : "Low"
      });
    }
  });

  return chunks;
}
