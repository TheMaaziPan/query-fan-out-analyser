import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  error?: string;
}

export async function scrapeWebPage(url: string): Promise<ScrapedContent> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
    }

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, footer, .advertisement, .ads, .social-share').remove();
    
    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Page';
    
    // Extract main content
    let content = '';
    
    // Try to find main content area
    const mainSelectors = [
      'main',
      'article', 
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];
    
    let $mainContent = null;
    for (const selector of mainSelectors) {
      $mainContent = $(selector);
      if ($mainContent.length > 0) {
        break;
      }
    }
    
    if ($mainContent && $mainContent.length > 0) {
      content = $mainContent.text();
    } else {
      // Fallback to body content
      $('header, nav, footer, .sidebar, .navigation, .menu').remove();
      content = $('body').text();
    }
    
    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    if (content.length < 100) {
      throw new Error('Insufficient content found on the page');
    }
    
    return {
      title,
      content,
      url
    };
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND') {
        throw new Error('URL not found. Please check the URL and try again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden. The website is blocking scraping requests.');
      } else if (error.response?.status === 404) {
        throw new Error('Page not found (404). Please verify the URL.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. The website is currently unavailable.');
      }
    }
    
    throw new Error(`Failed to scrape webpage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
