import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RBACProvider } from './context/RBACContext.jsx';
import { FeatureFlagProvider } from './context/FeatureFlagContext.jsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RBACProvider>
          <FeatureFlagProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </FeatureFlagProvider>
        </RBACProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
