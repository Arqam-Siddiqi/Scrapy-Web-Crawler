import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../ThemeContext';

function HomePage() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [url, setUrl] = useState('https://animecorner.me/spring-2025-anime-rankings-week-3/');
  const [maxPages, setMaxPages] = useState(5);
  const [keywordsInclude, setKeywordsInclude] = useState('');
  const [keywordsExclude, setKeywordsExclude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('form');

  // Load stored results when component mounts
  useEffect(() => {
    const storedResults = localStorage.getItem('crawlResults');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        
        // If coming back from detail page, show results tab
        if (location.state?.fromDetail || location.state?.showResults) {
          setActiveTab('results');
        }
      } catch (err) {
        console.error('Error parsing stored results:', err);
      }
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Create the request payload
      const payload = {
        url: url,
        max_pages: parseInt(maxPages),
      };
      
      // Add optional parameters if provided
      if (keywordsInclude.trim()) {
        payload.keywords_include = keywordsInclude;
      }
      
      if (keywordsExclude.trim()) {
        payload.keywords_exclude = keywordsExclude;
      }
      
      console.log('Sending request with payload:', payload);
      
      // Make the POST request using axios
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/crawl`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Axios automatically throws on 4xx/5xx responses, so we can use the data directly
      setResults(response.data);
      
      // Store the results in localStorage for access from detail page
      localStorage.setItem('crawlResults', JSON.stringify(response.data));
      
      setActiveTab('results');
    } catch (err) {
      console.error('Error during API call:', err);
      // Axios error handling
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        setError(`Server error: ${err.response.status} - ${err.response.data.detail || err.response.statusText}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Is the backend running?');
      } else {
        // Something happened in setting up the request
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crawler-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const viewDetails = (pageIndex) => {
    navigate(`/details/${pageIndex}`);
  };

  return (
    <div className="page-container">
      <header>
        <div className="header-content">
          <div>
            <h1>Scrapy Web Crawler</h1>
            <p>Extract structured content from websites with configurable parameters</p>
          </div>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg> 
              : 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'form' ? 'active' : ''} 
          onClick={() => setActiveTab('form')}
        >
          Crawler Settings
        </button>
        <button 
          className={activeTab === 'results' ? 'active' : ''} 
          onClick={() => setActiveTab('results')}
          disabled={!results}
        >
          Results
        </button>
      </div>

      <main>
        {activeTab === 'form' && (
          <div className="form-container">
            <form onSubmit={handleSubmit} className="crawler-form">
              <div className="form-heading">
                <h2>Configure Crawler</h2>
                <p>Set parameters for your web crawling session</p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="url">Starting URL:</label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maxPages">Maximum Pages:</label>
                  <div className="number-input-container">
                    <input
                      type="number"
                      id="maxPages"
                      value={maxPages}
                      onChange={(e) => setMaxPages(e.target.value)}
                      required
                      min="1"
                      max="100"
                    />
                    <div className="number-controls">
                      <button 
                        type="button"
                        className="number-control-btn" 
                        onClick={() => setMaxPages(prev => Math.min(100, parseInt(prev) + 1))}
                        aria-label="Increase value"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="number-control-btn" 
                        onClick={() => setMaxPages(prev => Math.max(1, parseInt(prev) - 1))}
                        aria-label="Decrease value"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <small>Recommended: 5-10 pages for testing</small>
                </div>

                <div className="form-group">
                  <label htmlFor="keywordsInclude">Keywords to Include:</label>
                  <input
                    type="text"
                    id="keywordsInclude"
                    value={keywordsInclude}
                    onChange={(e) => setKeywordsInclude(e.target.value)}
                    placeholder="anime, review, season"
                  />
                  <small>Separate multiple keywords with commas</small>
                </div>

                <div className="form-group">
                  <label htmlFor="keywordsExclude">Keywords to Exclude:</label>
                  <input
                    type="text"
                    id="keywordsExclude"
                    value={keywordsExclude}
                    onChange={(e) => setKeywordsExclude(e.target.value)}
                    placeholder="spoiler, nsfw"
                  />
                  <small>Separate multiple keywords with commas</small>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Crawling...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Start Crawling</span>
                  </>
                )}
              </button>
            </form>
            
            {isLoading && (
              <div className="spinner-container">
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Crawling website, please wait...</p>
                  <div className="progress-info">
                    <p>This may take a few minutes depending on the website size and maximum pages set.</p>
                  </div>
                </div>
              </div>
            )}
            
            {!isLoading && (
              <div className="spinner-container">
                <div className="help-info">
                  <h3>How it works</h3>
                  <p><strong>Starting URL:</strong> The initial page where crawling begins.</p>
                  <p><strong>Maximum Pages:</strong> Limits how many pages will be crawled.</p>
                  <p><strong>Keywords to Include:</strong> Only crawl pages containing these terms.</p>
                  <p><strong>Keywords to Exclude:</strong> Skip pages containing these terms.</p>
                  
                  <div className="help-tip">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p>For best results, start with a small number of pages (5-10) to test crawling speed.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="results-container">
            <div className="results-header">
              <h2>Crawl Results</h2>
              <button onClick={handleDownload} className="download-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download JSON
              </button>
            </div>
            
            <div className="results-grid">
              {results.map((page, index) => (
                <div key={index} className="result-card">
                  <h3 className="page-title">{page.title || 'Untitled Page'}</h3>
                  <a href={page.url} target="_blank" rel="noopener noreferrer" className="page-url">
                    {page.url}
                  </a>
                  
                  <div className="content-stats">
                    <div className="stat">
                      <span className="stat-label">Images:</span> 
                      <span className="stat-value">{page.images?.length || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Text Blocks:</span> 
                      <span className="stat-value">{page.text?.length || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Code Blocks:</span> 
                      <span className="stat-value">{page.code?.length || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tables:</span> 
                      <span className="stat-value">{page.tables?.length || 0}</span>
                    </div>
                  </div>

                  {page.h1 && page.h1.length > 0 && (
                    <div className="content-section">
                      <h4>Main Headings</h4>
                      <ul>
                        {page.h1.map((heading, idx) => (
                          <li key={idx}>{heading}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {page.images && page.images.length > 0 && (
                    <div className="content-section">
                      <h4>Images</h4>
                      <div className="image-gallery">
                        {page.images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="image-preview">
                            <img 
                              src={img.src} 
                              alt={img.alt || 'Image'} 
                              onError={(e) => {e.target.src = 'https://via.placeholder.com/100x100?text=Not+Found'}}
                            />
                            <span className="image-alt">{img.alt || 'No description'}</span>
                          </div>
                        ))}
                        {page.images.length > 4 && (
                          <div className="more-items">+{page.images.length - 4} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {page.text && page.text.length > 0 && (
                    <div className="content-section">
                      <h4>Sample Text</h4>
                      <p>{page.text[0]?.substring(0, 150)}...</p>
                      {page.text.length > 1 && (
                        <div className="more-items">+{page.text.length - 1} more text blocks</div>
                      )}
                    </div>
                  )}

                  <div className="view-details">
                    <button onClick={() => viewDetails(index)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                      View Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;