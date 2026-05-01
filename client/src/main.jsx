import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d0d0d',
              color: '#fff',
              border: '1px solid #2a2a2a',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#39FF14', secondary: '#000' } },
            error: { iconTheme: { primary: '#ff5050', secondary: '#000' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
