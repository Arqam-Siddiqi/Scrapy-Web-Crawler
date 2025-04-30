# Scrapy-Web-Crawler

A flexible web crawling solution built with Scrapy and FastAPI that extracts structured content from websites.

---

## Table of Contents

1. [Project Structure](#project-structure)  
2. [Features](#features)  
3. [Setup](#setup)  
4. [Running the Application](#running-the-application)  
5. [Scrapy Crawler](#scrapy-crawler)  
6. [Backend Architecture](#backend-architecture)
7. [Content Extraction](#content-extraction)
8. [License](#license)

---

## Project Structure

```
Project/
├── README.md
└── Backend/
    ├── app.py                 # FastAPI application
    ├── requirements.txt       # Python dependencies
    ├── scrapy.cfg             # Scrapy configuration
    └── web_crawler/           # Scrapy project
        ├── items.py           # Data structure definitions
        ├── middlewares.py     # Request/response processing
        ├── pipelines.py       # Data processing components
        ├── settings.py        # Scrapy settings
        └── spiders/           # Web crawlers
            └── anime.py       # Main crawler implementation
```

## Features

- REST API for triggering web crawls
- Configurable parameters for URL, domain, max pages, and keyword filtering
- Extracts text, images, tables, code blocks, and metadata from websites

## Setup

1. Create a virtual environment:
   ```
   cd Backend
   python -m venv venv
   ```

2. Activate the virtual environment:
   ```
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Application

Start the FastAPI server:
```
uvicorn app:app --reload
```

## Scrapy Crawler
- Extracts structured content from websites
- Filtering by domain and keywords
- Page limit configuration
- Content extraction:
  - Text content (paragraphs, headings, lists)
  - Images and videos
  - Tables
  - Code blocks
  - Meta information

## Backend Architecture

The Backend of this project consists of two main components:

### 1. FastAPI Server (`app.py`)

- Built using FastAPI, a modern, high-performance web framework for building APIs
- Implements RESTful endpoints for triggering web crawls
- Uses multiprocessing to run Scrapy crawlers asynchronously without blocking the API
- Automatically parses and formats crawl results as JSON responses
- Default configuration set to crawl anime-related content from animecorner.me

### 2. Scrapy Spider (`web_crawler/spiders/anime.py`)

- Implements the `AnimeSpider` class, a custom Scrapy spider
- Intelligently crawls websites while respecting domain restrictions
- Features sophisticated content extraction algorithms for various types of web content
- Implements keyword filtering to include or exclude content based on specified criteria
- Manages crawl state and respects maximum page count limits

### Dependencies

The project uses several key Python libraries:

- **FastAPI**: For the web API interface
- **Uvicorn**: ASGI server for running the FastAPI application
- **Scrapy**: For web crawling and content extraction
- **Pydantic**: For data validation

Full dependencies are listed in `requirements.txt`.

## Content Extraction

The crawler is capable of extracting various types of content from web pages:

### Text Content
- Paragraphs, headings, and list items
- Intelligent text cleaning to remove duplicates and excessive whitespace
- Hierarchical extraction of headings (h1, h2, etc.)

### Media Content
- Images with their URLs and alt text attributes
- Support for various image sources (src, data-src, background images)
- Video elements and their sources

### Structured Content
- Tables with row and column data
- Code blocks with syntax highlighting preservation
- Meta information for SEO analysis

### Filtering Capabilities
- Domain-based filtering to restrict crawling within specific websites
- Keyword inclusion/exclusion filtering
- Maximum page count limitation
