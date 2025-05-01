import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  // Set dark mode as default
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  // Initialize theme from localStorage if available, otherwise use dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, []);

  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};