import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d89c62',
    },
    secondary: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
