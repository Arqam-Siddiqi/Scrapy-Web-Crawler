import { useState, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from './ThemeContext';
import './App.css';

function App() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [url, setUrl] = useState('https://animecorner.me/spring-2025-anime-rankings-week-3/');
  const [maxPages, setMaxPages] = useState(5);
  const [keywordsInclude, setKeywordsInclude] = useState('');
  const [keywordsExclude, setKeywordsExclude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('form');

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
      const response = await axios.post('http://localhost:8000/crawl', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Axios automatically throws on 4xx/5xx responses, so we can use the data directly
      setResults(response.data);
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

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div>
            <h1>Web Crawler</h1>
            <p>Extract structured content from websites with configurable parameters</p>
          </div>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
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
          <form onSubmit={handleSubmit} className="crawler-form">
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
              <input
                type="number"
                id="maxPages"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
                required
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="keywordsInclude">Keywords to Include (comma-separated):</label>
              <input
                type="text"
                id="keywordsInclude"
                value={keywordsInclude}
                onChange={(e) => setKeywordsInclude(e.target.value)}
                placeholder="anime, review, season"
              />
            </div>

            <div className="form-group">
              <label htmlFor="keywordsExclude">Keywords to Exclude (comma-separated):</label>
              <input
                type="text"
                id="keywordsExclude"
                value={keywordsExclude}
                onChange={(e) => setKeywordsExclude(e.target.value)}
                placeholder="spoiler, nsfw"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Crawling...' : 'Start Crawling'}
            </button>
          </form>
        )}

        {activeTab === 'results' && results && (
          <div className="results-container">
            <div className="results-header">
              <h2>Crawl Results</h2>
              <button onClick={handleDownload} className="download-btn">
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
                    <button 
                      onClick={() => {
                        const modal = document.getElementById(`modal-${index}`);
                        if (modal) modal.style.display = 'block';
                      }}
                    >
                      View Full Details
                    </button>
                  </div>

                  <div id={`modal-${index}`} className="modal">
                    <div className="modal-content">
                      <span 
                        className="close"
                        onClick={() => {
                          const modal = document.getElementById(`modal-${index}`);
                          if (modal) modal.style.display = 'none';
                        }}
                      >
                        &times;
                      </span>
                      <h2>{page.title || 'Untitled Page'}</h2>
                      <pre>{JSON.stringify(page, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Crawling website, please wait...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}
      </main>

      <footer>
        <p>Scrapy Web Crawler &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;