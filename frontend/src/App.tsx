import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Main } from './layout/Main';
import { MarketDetail } from './layout/MarketDetail';
import './App.css';
import { ThemeProvider } from "polymarket-ui";

function App() {
  return (
    <ThemeProvider defaultDarkMode={true}>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/market/:marketId" element={<MarketDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
