import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';

function DetailPage() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { pageIndex } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  
  // For load more functionality
  const [visibleImages, setVisibleImages] = useState(8);
  const [visibleText, setVisibleText] = useState(5);
  
  // Tab management
  const [activeTab, setActiveTab] = useState('content');
  
  useEffect(() => {
    try {
      const results = JSON.parse(localStorage.getItem('crawlResults'));
      if (!results || !results[pageIndex]) {
        setError('Page data not found. Please return to the home page and try again.');
        return;
      }
      
      setPage(results[pageIndex]);
    } catch (err) {
      setError('Failed to load page data: ' + err.message);
    }
  }, [pageIndex]);
  
  const handleBackClick = () => {
    // Navigate back to the home page with a state flag indicating we came from detail
    // and explicitly set activeTab to 'results'
    navigate('/', { 
      state: { 
        fromDetail: true,
        showResults: true 
      } 
    });
  };
  
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + 8);
  };
  
  const loadMoreText = () => {
    setVisibleText(prev => prev + 5);
  };
  
  if (error) {
    return (
      <div className="page-container">
        <header>
          <div className="header-content">
            <div>
              <h1>Scrapy Web Crawler</h1>
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
        
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!page) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header>
        <div className="header-content">
          <div>
            <h1>Scrapy Web Crawler</h1>
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
      
      <div className="detail-header">
        <button 
          className="back-btn"
          onClick={handleBackClick}
        >
          ← Back to Results
        </button>
        
        <h2 className="detail-title">{page.title || 'Untitled Page'}</h2>
        
        <a 
          href={page.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="detail-url"
        >
          {page.url}
        </a>
      </div>
      
      <div className="details-tabs">
        <button 
          className={activeTab === 'content' ? 'active' : ''} 
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button 
          className={activeTab === 'images' ? 'active' : ''} 
          onClick={() => setActiveTab('images')}
        >
          Images ({page.images?.length || 0})
        </button>
        <button 
          className={activeTab === 'text' ? 'active' : ''} 
          onClick={() => setActiveTab('text')}
        >
          Text Blocks ({page.text?.length || 0})
        </button>
        <button 
          className={activeTab === 'json' ? 'active' : ''} 
          onClick={() => setActiveTab('json')}
        >
          Raw JSON
        </button>
      </div>
      
      <div className="detail-content">
        {activeTab === 'content' && (
          <div className="content-overview">
            <div className="detail-section">
              <h3>Page Overview</h3>
              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-label">Images:</span>
                  <span className="meta-value">{page.images?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Text Blocks:</span>
                  <span className="meta-value">{page.text?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Headings:</span>
                  <span className="meta-value">{(page.h1?.length || 0) + (page.h2?.length || 0)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Code Blocks:</span>
                  <span className="meta-value">{page.code?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tables:</span>
                  <span className="meta-value">{page.tables?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Videos:</span>
                  <span className="meta-value">{page.videos?.length || 0}</span>
                </div>
              </div>
            </div>
            
            {(page.h1?.length > 0 || page.h2?.length > 0) && (
              <div className="detail-section">
                <h3>Headings</h3>
                <div className="headings-list">
                  {page.h1?.map((heading, idx) => (
                    <div key={`h1-${idx}`} className="heading h1-heading">
                      <h4>{heading}</h4>
                    </div>
                  ))}
                  {page.h2?.map((heading, idx) => (
                    <div key={`h2-${idx}`} className="heading h2-heading">
                      <h5>{heading}</h5>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {page.images?.length > 0 && (
              <div className="detail-section">
                <h3>Featured Images</h3>
                <div className="featured-images">
                  {page.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="featured-image">
                      <img 
                        src={img.src} 
                        alt={img.alt || 'Image'} 
                        onError={(e) => {e.target.src = 'https://via.placeholder.com/300x200?text=Not+Found'}}
                      />
                    </div>
                  ))}
                </div>
                {page.images.length > 4 && (
                  <button 
                    className="see-all-btn"
                    onClick={() => setActiveTab('images')}
                  >
                    See All Images
                  </button>
                )}
              </div>
            )}
            
            {page.text?.length > 0 && (
              <div className="detail-section">
                <h3>Sample Text</h3>
                <div className="sample-text">
                  {page.text.slice(0, 2).map((text, idx) => (
                    <p key={idx} className="text-block">{text}</p>
                  ))}
                </div>
                {page.text.length > 2 && (
                  <button 
                    className="see-all-btn"
                    onClick={() => setActiveTab('text')}
                  >
                    See All Text
                  </button>
                )}
              </div>
            )}
            
            {page.code?.length > 0 && (
              <div className="detail-section">
                <h3>Code Blocks</h3>
                <div className="code-blocks">
                  {page.code.slice(0, 1).map((code, idx) => (
                    <pre key={idx} className="code-block">
                      <code>{code}</code>
                    </pre>
                  ))}
                </div>
                {page.code.length > 1 && (
                  <div className="more-info">+{page.code.length - 1} more code blocks</div>
                )}
              </div>
            )}
            
            {page.tables?.length > 0 && (
              <div className="detail-section">
                <h3>Tables</h3>
                <div className="tables-preview">
                  Tables are available in the raw JSON data.
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'images' && (
          <div className="images-gallery-full">
            <h3>Images ({page.images?.length || 0})</h3>
            <div className="images-grid">
              {page.images?.slice(0, visibleImages).map((img, idx) => (
                <div key={idx} className="gallery-image">
                  <div className="image-container">
                    <img 
                      src={img.src} 
                      alt={img.alt || 'Image'} 
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/400x300?text=Not+Found'}}
                    />
                  </div>
                  <div className="image-info">
                    <div className="image-alt-full">{img.alt || 'No description'}</div>
                    <a 
                      href={img.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="image-src"
                    >
                      View original
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {page.images && visibleImages < page.images.length && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={loadMoreImages}>
                  Load More Images
                </button>
                <span className="showing-count">
                  Showing {visibleImages} of {page.images.length}
                </span>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'text' && (
          <div className="text-blocks-full">
            <h3>Text Blocks ({page.text?.length || 0})</h3>
            <div className="text-blocks-container">
              {page.text?.slice(0, visibleText).map((text, idx) => (
                <div 
                  key={idx} 
                  className={`full-text-block ${text.length > 300 ? 'large' : ''}`}
                >
                  <div className="text-number">#{idx + 1}</div>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            
            {page.text && visibleText < page.text.length && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={loadMoreText}>
                  Load More Text
                </button>
                <span className="showing-count">
                  Showing {visibleText} of {page.text.length}
                </span>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'json' && (
          <div className="json-view">
            <h3>Raw JSON Data</h3>
            <pre className="json-content">
              <code>{JSON.stringify(page, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailPage;