import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import './App.css';

function App() {

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/details/:pageIndex" element={<DetailPage />} />
        </Routes>
      </Router>

      <footer>
        <p>Scrapy Web Crawler &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;