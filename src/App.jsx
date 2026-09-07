import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import TopAppBar from './components/TopAppBar';
import BottomNav from './components/BottomNav';
import SideDrawer from './components/SideDrawer';
import Home from './pages/Home';
import Products from './pages/Products';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
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
  );
}

export default App;
