import React from 'react';
import { Main } from './layout/Main';
import './App.css';
import { ThemeProvider } from "polymarket-ui";

function App() {
  return (
    <ThemeProvider defaultDarkMode={true}>
      <div className="screen">
        <Main></Main>
      </div>
    </ThemeProvider>
  );
}

export default App;
