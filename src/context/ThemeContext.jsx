import { createContext, useContext, useState, useEffect } from 'react';
import { themes, applyTheme } from '../styles/themes';
import { storageService } from '../services/storageService';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('space-program');

  useEffect(() => {
    const settings = storageService.getSettings();
    setCurrentTheme(settings.theme || 'space-program');
    applyTheme(settings.theme || 'space-program');
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      applyTheme(themeName);
      storageService.saveSettings({ theme: themeName });
    }
  };

  const cycleTheme = () => {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    changeTheme(themeNames[nextIndex]);
  };

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    themes,
    changeTheme,
    cycleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
