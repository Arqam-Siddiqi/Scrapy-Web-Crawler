from fastapi import FastAPI, Query, HTTPException
from typing import Optional, Any
from scrapy.utils.project import get_project_settings
from scrapy.crawler import CrawlerProcess
from web_crawler.spiders.anime import AnimeSpider
import uvicorn
import json
import os
import tempfile
import multiprocessing
from pathlib import Path

app = FastAPI()

def run_spider_in_process(settings, url, domain, max_pages, keywords_include, keywords_exclude, output_file):
    """Run spider in a separate process and save results to the output file"""
    process = CrawlerProcess(settings)
    
    # Define domain if provided
    allowed_domains = [domain] if domain else None
    
    # Start the crawler with the specified parameters
    process.crawl(
        AnimeSpider,
        start_urls=[url] if url else None,
        allowed_domains=allowed_domains,
        max_pages=max_pages,
        keywords_include=keywords_include,
        keywords_exclude=keywords_exclude
    )
    
    # This will block until the crawl is done
    process.start()

@app.get("/")
async def ping():
    return {"message": "Server started successfully"} 

@app.get("/crawl")
async def crawl(
    url: str = Query("https://animecorner.me/spring-2025-anime-rankings-week-3/", description="URL to crawl"),
    domain: Optional[str] = Query(None, description="Domain to restrict crawling to"),
    max_pages: int = Query(5, description="Maximum number of pages to crawl"),
    keywords_include: Optional[str] = Query(None, description="Keywords to include, comma-separated"),
    keywords_exclude: Optional[str] = Query(None, description="Keywords to exclude, comma-separated")
):
    """Endpoint to crawl a website and return results synchronously"""
    output_file = "results.json"
    
    # Create settings dictionary for the crawler
    settings = get_project_settings()
    settings['FEEDS'] = {
        output_file: {
            'format': 'json',
            'overwrite': True,
            'indent': 4,
            'encoding': 'utf8',
        }
    }
    
    if not domain and url:
        from urllib.parse import urlparse
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
    
    ctx = multiprocessing.get_context('spawn')
    p = ctx.Process(
        target=run_spider_in_process,
        args=(settings, url, domain, max_pages, keywords_include, keywords_exclude, output_file)
    )
    p.start()
    p.join()
    
    if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
        raise HTTPException(status_code=500, detail="Crawler failed to generate results or output file is empty")
    
    with open(output_file, "r", encoding="utf-8") as f:
        results = json.load(f)
        
    try:
        os.unlink(output_file)
    except Exception as e:
        print(f"Warning: Failed to delete temporary file {output_file}: {str(e)}")
    
    return results
    
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)