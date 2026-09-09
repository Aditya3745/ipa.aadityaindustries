import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import TopAppBar from './components/TopAppBar';
import BottomNav from './components/BottomNav';
import SideDrawer from './components/SideDrawer';
import Home from './pages/Home';
import Products from './pages/Products';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  }
});

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
          <TopAppBar toggleDrawer={toggleDrawer} />
          <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/admin" replace /> : <Home />} />
              <Route path="/products" element={<Products />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
