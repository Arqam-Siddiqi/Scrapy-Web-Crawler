from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Any
from scrapy.utils.project import get_project_settings
from scrapy.crawler import CrawlerProcess
from web_crawler.spiders.anime import AnimeSpider
import uvicorn
import json
import os
import multiprocessing
import tempfile
from pathlib import Path

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a model for the crawler parameters
class CrawlerParams(BaseModel):
    url: HttpUrl = "https://animecorner.me/spring-2025-anime-rankings-week-3/"
    domain: str = "animecorner.me"
    max_pages: int = 5
    keywords_include: Optional[str] = None
    keywords_exclude: Optional[str] = None

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

@app.post("/crawl")
async def crawl(params: CrawlerParams):
    # Create a temporary file in the Backend directory
    temp_dir = os.path.dirname(os.path.abspath(__file__))
    fd, output_file = tempfile.mkstemp(prefix="crawler_", suffix=".json", dir=temp_dir)
    os.close(fd)  # Close the file descriptor immediately
    
    try:
        settings = get_project_settings()
        settings['FEEDS'] = {
            output_file: {
                'format': 'json',
                'overwrite': True,
                'indent': 4,
                'encoding': 'utf8',
            }
        }
        
        # Extract domain from URL if not provided
        if not params.domain and params.url:
            from urllib.parse import urlparse
            parsed_url = urlparse(str(params.url))
            domain = parsed_url.netloc
        else:
            domain = params.domain
        
        ctx = multiprocessing.get_context('spawn')
        p = ctx.Process(
            target=run_spider_in_process,
            args=(settings, str(params.url), domain, params.max_pages, 
                params.keywords_include, params.keywords_exclude, output_file)
        )
        p.start()
        p.join()
        
        if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
            raise HTTPException(status_code=500, detail="Crawler failed to generate results or output file is empty")
        
        with open(output_file, "r", encoding="utf-8") as f:
            results = json.load(f)
            
        return results
    
    finally:
        # Always clean up the temporary file, even if an exception occurs
        try:
            if os.path.exists(output_file):
                os.unlink(output_file)
                print(f"Temporary file {output_file} successfully deleted")
        except Exception as e:
            print(f"Warning: Failed to delete temporary file {output_file}: {str(e)}")
    
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)