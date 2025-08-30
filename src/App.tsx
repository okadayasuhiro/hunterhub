import React from 'react';
import './App.css';
import { HelmetProvider } from 'react-helmet-async';
import AppRouter from './components/AppRouter';

function App() {
  return (
    <HelmetProvider>
      <AppRouter />
    </HelmetProvider>
  );
}

export default App;
