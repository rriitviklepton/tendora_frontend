import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Tenders from './pages/Tenders/Tenders';
import TenderSummary from './pages/TenderSummary/TenderSummary';
import DocumentManager from './pages/DocumentManager/DocumentManager';
import Settings from './pages/Settings/Settings';
import Submission from './pages/Submission/Submission';
import Analytics from './pages/Analytics/Analytics';
import OCRConvert from './pages/OCRConvert';
import { TenderProvider } from './context/TenderContext';

// Create a client with better caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
      gcTime: 30 * 60 * 1000,   // Cache persists for 30 minutes
      refetchOnMount: false,     // Don't refetch on mount
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false  // Don't refetch on reconnect
    }
  }
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // TODO: Replace with actual auth check
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenderProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="tenders" element={<Tenders />} />
              <Route path="tender/:id" element={<TenderSummary />} />
              <Route path="documents" element={<DocumentManager />} />
              <Route path="submission" element={<Submission />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="ocr-convert" element={<OCRConvert />} />
            </Route>
          </Routes>
        </Router>
      </TenderProvider>
    </QueryClientProvider>
  );
}

export default App;