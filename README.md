# Scrapy-Web-Crawler

A flexible web crawling solution built with Scrapy and FastAPI that extracts structured content from websites.

## Table of Contents

1. [Project Structure](#project-structure)  
2. [Features](#features)  
3. [Setup](#setup)  
4. [Running the Application](#running-the-application)  
5. [Scrapy Crawler](#scrapy-crawler)  
6. [Backend Architecture](#backend-architecture)
7. [Content Extraction](#content-extraction)
8. [License](#license)


## Project Structure

```
Project/
├── README.md
├──  Backend/
    ├── app.py                         # FastAPI application
    ├── requirements.txt               # Python dependencies
    ├── scrapy.cfg                     # Scrapy configuration
    └── web_crawler/                   # Scrapy project
        ├── items.py                   # Data structure definitions
        ├── middlewares.py             # Request/response processing
        ├── pipelines.py               # Data processing components
        ├── settings.py                # Scrapy settings
        └── spiders/                   # Web crawlers
            └── custom_spider.py       # Main crawler implementation
└── Frontend/
```

## Features

- REST API for triggering web crawls
- Configurable parameters for URL, domain, max pages, and keyword filtering
- Extracts text, images, tables, code blocks, and metadata from websites

## Setup & Run Backend

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

4. Start the FastAPI server:
   ```
   uvicorn app:app --reload
   ```

## Setup & Run Frontend

1. Navigate to Frontend directory and install dependencies:
   ```
   cd Frontend
   npm install
   ```
2. Start the React Application:
   ```
   npm run dev
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

## Architecture

The Backend of this project consists of two main components:

### 1. Scrapy Spider (`web_crawler/spiders/custom_spider.py`)

- Implements the `CustomSpider` class, a custom Scrapy spider
- Intelligently crawls websites while respecting domain restrictions
- Features sophisticated content extraction algorithms for various types of web content
- Implements keyword filtering to include or exclude content based on specified criteria
- Manages crawl state and respects maximum page count limits


### 2. FastAPI Server (`app.py`)

- Built using FastAPI, a modern, high-performance web framework for building APIs
- Implements RESTful endpoints for triggering web crawls
- Uses multiprocessing to run Scrapy crawlers asynchronously without blocking the API
- Automatically parses and formats crawl results as JSON responses

### 3. React Frontend Application (`App.jsx`)
- Built with React and Vite for a responsive, modern user interface
- Implements a tabbed interface for exploring different content types:
   - Content overview with statistics and media previews
   - Image gallery with responsive grid layout and lazy loading
   - Text blocks with categorization and progressive loading
   - Tables view with proper formatting and navigation
   - Raw JSON view for developers
- Communicates with the Backend through RESTful API endpoints
- Provides intuitive configuration controls for the crawler parameters
