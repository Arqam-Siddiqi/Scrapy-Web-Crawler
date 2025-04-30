import scrapy
from scrapy.http.response import Response
import re


class AnimeSpider(scrapy.Spider):
    name = "results"

    # allowed_domains = ["coderslegacy.com"]
    # start_urls = ["https://coderslegacy.com/python/python-classes/"]

    # allowed_domains = ["geeksforgeeks.org"]
    # start_urls = ["https://www.geeksforgeeks.org/iterators-in-python/"]

    allowed_domains = ["animecorner.me"]
    start_urls = ["https://animecorner.me/spring-2025-anime-rankings-week-3/"]
    
    # allowed_domains = ["nu.edu.pk"]
    # start_urls = ["https://www.nu.edu.pk/"]

    def __init__(
            self, 
            max_pages=5, 
            keywords_include=None, 
            keywords_exclude=None,
            start_urls=None,
            allowed_domains=None,
            **kwargs
    ):
        super().__init__(**kwargs)
        self.visited = set()
        self.count = 0
        self.max_pages = int(max_pages)
        
        # Override class attributes if provided
        if start_urls:
            self.start_urls = start_urls
        if allowed_domains:
            self.allowed_domains = allowed_domains
            
        self.keywords_include = {k.lower() for k in keywords_include.split(',')} if keywords_include else set()
        self.keywords_exclude = {k.lower() for k in keywords_exclude.split(',')} if keywords_exclude else set()
    
    def should_parse_content(self, response: Response) -> bool:
        if not (self.keywords_include or self.keywords_exclude):
            return True
            
        text = ' '.join(response.css('body ::text').getall()).lower()
        
        if self.keywords_include and not any(keyword in text for keyword in self.keywords_include):
            return False
            
        if self.keywords_exclude and any(keyword in text for keyword in self.keywords_exclude):
            return False
            
        return True

    def extract_images(self, response: Response) -> list[str]:
        images = []
        
        for img in response.css('img'):
            src = (img.attrib.get('src') or 
                   img.attrib.get('data-src') or 
                   img.attrib.get('data-srcset') or 
                   img.attrib.get('data-lazy-src') or
                   img.attrib.get('data-original'))
            
            alt = img.attrib.get('alt', '')
            
            if src:
                if ' ' in src and ',' in src:  # Likely a srcset
                    src = src.split(',')[0].strip().split(' ')[0]
                
                src_url = response.urljoin(src)
                
                images.append({
                    'src': src_url,
                    'alt': alt
                })
        
        for element in response.css('[style*="background-image"]'):
            style = element.attrib.get('style', '')
            if 'background-image' in style and 'url(' in style:
                url_part = style.split('background-image:')[1].split(';')[0]
                url = url_part.split('url(')[1].split(')')[0].strip('\'"')
                if url:
                    src_url = response.urljoin(url)
                    images.append({
                        'src': src_url,
                        'alt': 'Background Image'
                    })
        
        # Handle lazy loading
        for element in response.css('[data-bgset]'):
            bg_src = element.attrib.get('data-bgset', '')
            if bg_src:
                if ' ' in bg_src:
                    bg_src = bg_src.split(' ')[0]
                
                src_url = response.urljoin(bg_src)
                alt = element.attrib.get('title', 'Background Image')
                
                images.append({
                    'src': src_url,
                    'alt': alt
                })
                
        for element in response.css('[data_bg_hidpi]'):
            bg_src = element.attrib.get('data_bg_hidpi', '')
            if bg_src:
                src_url = response.urljoin(bg_src)
                alt = element.attrib.get('title', 'High-DPI Background Image')
                
                images.append({
                    'src': src_url,
                    'alt': alt
                })

        return images

    def extract_tables(self, response: Response) -> list[list[str]]:
        tables = []
        for table in response.css('table'):
            table_rows = []
            for row in table.css('tr'):
                cells = row.css('th, td::text').getall()
                table_rows.append([cell.strip() for cell in cells if cell.strip()])
            if table_rows:
                tables.append(table_rows)
            
        return tables

    def extract_code(self, response: Response) -> list[str]:
        all_code_blocks = []
        
        for code in response.css('code, pre, .highlight, div.highlight pre'):
            code_text = ''.join(code.css('*::text').getall() or code.css('::text').getall() or [''])
            
            if code_text.strip():
                cleaned_code = '\n'.join(line.rstrip() for line in code_text.splitlines())
                cleaned_code = cleaned_code.strip()
                if cleaned_code:
                    all_code_blocks.append(cleaned_code)
        
        unique_code_blocks = []
        seen = set()
        
        for code in all_code_blocks:
            code_hash = hash(code)
            if code_hash not in seen:
                seen.add(code_hash)
                unique_code_blocks.append(code)
        
        grouped_blocks = []
        i = 0
        while i < len(unique_code_blocks):
            current_block = unique_code_blocks[i]
            is_output = all(len(line) < 50 and not any(keyword in line for keyword in 
                        ['def ', 'class ', 'import ', 'from ', '= ', 'return ', 'if ', 'for ', 'while ']) 
                        for line in current_block.split('\n'))
            
            if is_output and grouped_blocks and len(grouped_blocks[-1].split('\n')) > 2:
                grouped_blocks[-1] += '\n\n' + current_block
            else:
                grouped_blocks.append(current_block)
            i += 1
        
        return grouped_blocks
    
    def extract_meta(self, response: Response) -> dict:
        meta_data = {}
        for meta in response.css('meta[name]'):
            name = meta.attrib.get('name')
            content = meta.attrib.get('content', '')
            if name:
                meta_data[name] = content
            
        return meta_data

    def extract_text(self, response: Response) -> list[str]:
        text_elements = []
        
        # Target common text-containing elements, but exclude script, style, and code containers
        selector_str = 'p, div.content, div.text, article, section, span, li, td, th, h3, h4, h5, h6, .article-content, .post-content'
        
        for selector in response.css(selector_str):
            # Check if this element is inside or is a script, style, or code tag
            # The XPath expression was causing issues, so we'll use a different approach
            parent_tags = selector.xpath('ancestor-or-self::*[self::script or self::style or self::code or self::pre]')
            
            # If there are no script/style/code ancestors or self, process this element
            if not parent_tags:
                # Get text from this element and its children, excluding script/style/code elements
                full_text = ' '.join(selector.css('*:not(script):not(style):not(code)::text').getall()).strip()
                
                if full_text:
                    # Clean up the text by removing excessive whitespace
                    cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
                    if cleaned_text:
                        text_elements.append(cleaned_text)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_text = []
        for text in text_elements:
            if text not in seen:
                seen.add(text)
                unique_text.append(text)
                
        return unique_text

    def parse(self, response: Response):
        if self.count >= self.max_pages:
            self.crawler.engine.close_spider(self, "Reached max pages")
            return
        
        if response.url in self.visited:
            return
        
        self.visited.add(response.url)
        self.count += 1
        print(f"Visited: {response.url} contains {len(response.css('a::attr(href)').getall())} links")

        if not self.should_parse_content(response):
            print(f"Skipping content for {response.url} due to keyword filtering")
            
            if response.url not in self.start_urls:
                return
            
            # Still follow links even if we don't parse this page (if its the starting url).
            for href in response.css('a::attr(href)').getall():
                url = response.urljoin(href)
                if self.allowed_domains[0] in url:
                    yield scrapy.Request(url, callback=self.parse)

            return

        meta_data = self.extract_meta(response)
        images = self.extract_images(response)
        tables = self.extract_tables(response)
        code = self.extract_code(response)
        text = self.extract_text(response)

        yield {
            "url": response.url,
            "meta": meta_data,
            "title": response.css("title::text").get(),
            "h1": [ h1 for h1 in response.css("h1::text").getall() if h1.strip() ],
            "h2": [ h2 for h2 in response.css("h2::text").getall() if h2.strip() ],
            "text": text,
            # "links": response.css("a::attr(href)").getall(),
            "images": images,
            "tables": tables,
            "code": code,
            "videos": response.css("video::attr(src)").getall(),
        }
        
        for href in response.css('a::attr(href)').getall():
            url = response.urljoin(href)
            if self.allowed_domains[0] in url:
                yield scrapy.Request(url, callback=self.parse)
