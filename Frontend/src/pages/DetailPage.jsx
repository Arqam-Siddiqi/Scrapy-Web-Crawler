import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';

function DetailPage() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { pageIndex } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  
  // Add missing activeTab state
  const [activeTab, setActiveTab] = useState('content');
  
  // For load more functionality - Double the initial visible text blocks
  const [visibleImages, setVisibleImages] = useState(12);
  const [visibleText, setVisibleText] = useState(10); // Increased from 5 to 10
  
  // Add state for tracking grid columns
  const [imageColumnsCount, setImageColumnsCount] = useState(4);
  // Add state for tracking text columns
  const [textColumnsCount, setTextColumnsCount] = useState(2);
  
  // Add a useEffect to determine the number of columns based on viewport width
  useEffect(() => {
    const updateColumnCount = () => {
      // For images
      let imgColumnCount = 4; // Default for large screens
      if (window.innerWidth < 768) {
        imgColumnCount = 1;
      } else if (window.innerWidth < 992) {
        imgColumnCount = 2;
      } else if (window.innerWidth < 1200) {
        imgColumnCount = 3;
      }
      setImageColumnsCount(imgColumnCount);
      
      // For text blocks
      let txtColumnCount = 2; // Default is 2 columns
      if (window.innerWidth < 992) {
        txtColumnCount = 1; // Single column on smaller screens
      }
      setTextColumnsCount(txtColumnCount);
    };
    
    // Set initial count
    updateColumnCount();
    
    // Update on window resize
    window.addEventListener('resize', updateColumnCount);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);
  
  // Calculate how many rows are filled with current visible images
  const filledImageRows = Math.ceil(visibleImages / imageColumnsCount);
  
  // Calculate if the last row is fully filled or has empty spaces
  const lastImageRowIsComplete = (visibleImages % imageColumnsCount) === 0;
  
  // Determine if we should load more to fill empty spaces in the last row
  const shouldLoadMoreImagesToFillRow = !lastImageRowIsComplete && page?.images?.length > visibleImages;
  
  // Calculate text blocks row information
  const filledTextRows = Math.ceil(visibleText / textColumnsCount);
  const lastTextRowIsComplete = (visibleText % textColumnsCount) === 0;
  const shouldLoadMoreTextToFillRow = !lastTextRowIsComplete && page?.text?.length > visibleText;
  
  // Update load more images function to fill the row
  const loadMoreImages = () => {
    if (shouldLoadMoreImagesToFillRow) {
      // Calculate how many more images needed to fill the last row
      const neededToFill = imageColumnsCount - (visibleImages % imageColumnsCount);
      setVisibleImages(prev => Math.min(prev + neededToFill, page.images.length));
    } else {
      // Load a full row
      setVisibleImages(prev => Math.min(prev + imageColumnsCount, page.images.length));
    }
  };
  
  // Update load more text function to fill the row and load 10 at a time
  const loadMoreText = () => {
    if (shouldLoadMoreTextToFillRow) {
      // Calculate how many more text blocks needed to fill the last row
      const neededToFill = textColumnsCount - (visibleText % textColumnsCount);
      setVisibleText(prev => Math.min(prev + neededToFill, page.text.length));
    } else {
      // Load 10 more text blocks (or complete rows that make up at least 10)
      const rowsToLoad = Math.ceil(50 / textColumnsCount);
      const blocksToLoad = rowsToLoad * textColumnsCount;
      setVisibleText(prev => Math.min(prev + blocksToLoad, page.text.length));
    }
  };
  
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
          className={activeTab === 'tables' ? 'active' : ''} 
          onClick={() => setActiveTab('tables')}
        >
          Tables ({page.tables?.length || 0})
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
            
            {visibleImages < page.images?.length && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={loadMoreImages}>
                  {shouldLoadMoreImagesToFillRow ? 'Fill Row' : 'Load More Images'}
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
                  {shouldLoadMoreTextToFillRow ? 'Fill Row' : 'Load More Text (50)'}
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

        {activeTab === 'tables' && (
          <div className="tables-full">
            <h3>Tables ({page.tables?.length || 0})</h3>
            {page.tables && page.tables.length > 0 ? (
              <div className="tables-list">
                {page.tables.map((table, tableIdx) => (
                  <div key={tableIdx} className="table-container">
                    <div className="table-number">Table #{tableIdx + 1}</div>
                    <div className="table-scroll">
                      <table className="data-table">
                        <tbody>
                          {table.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-content">
                <p>No tables found on this page.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailPage;
