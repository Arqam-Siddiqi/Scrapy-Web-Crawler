from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
from scrapy.utils.project import get_project_settings
from scrapy.crawler import CrawlerProcess
from web_crawler.spiders.custom_spider import CustomSpider
import uvicorn
import json
import os
import multiprocessing
import tempfile

from dotenv import load_dotenv
load_dotenv()  

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
    url: HttpUrl = None
    domain: str = None
    max_pages: int = 5
    keywords_include: Optional[str] = None
    keywords_exclude: Optional[str] = None

def run_spider_in_process(settings, url, domain, max_pages, keywords_include, keywords_exclude):
    """Run spider in a separate process and save results to the output file"""
    process = CrawlerProcess(settings)
    
    allowed_domains = [domain] if domain else None
    
    process.crawl(
        CustomSpider,
        start_urls=[url] if url else None,
        allowed_domains=allowed_domains,
        max_pages=max_pages,
        keywords_include=keywords_include,
        keywords_exclude=keywords_exclude
    )
    
    process.start()

@app.get("/")
async def ping():
    return {"message": "Server started successfully"} 

@app.post("/crawl")
async def crawl(params: CrawlerParams):
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
                params.keywords_include, params.keywords_exclude)
        )
        p.start()
        p.join()
        
        print(f"Spider finished running. Output saved to {output_file}")
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
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
